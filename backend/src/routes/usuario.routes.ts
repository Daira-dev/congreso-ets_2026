import { Router, Request, Response } from 'express';
import { randomInt } from 'crypto';
import { query, withTransaction } from '../lib/db';
import { decryptQRPayload } from '../lib/cryptoQR';
import { sendCancellationOtpEmail } from '../lib/mailService';
import { z } from 'zod';

const router = Router();

// Store en memoria para códigos OTP temporales de cancelación (TTL 10 min)
interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpEntry>();

// Limpieza periódica de OTPs expirados cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [dni, entry] of otpStore.entries()) {
    if (entry.expiresAt < now) {
      otpStore.delete(dni);
    }
  }
}, 5 * 60 * 1000);

const solicitarOtpSchema = z.object({
  dni_pasaporte: z.string().min(5).max(25),
});

const cancelarSchema = z.object({
  dni_pasaporte: z.string().min(5).max(25),
  motivo: z.string().max(300).optional(),
  qr_token: z.string().optional(),
  otp_code: z.string().optional(),
});

/**
 * POST /api/usuario/solicitar-cancelacion-otp
 * Genera un código de seguridad OTP de 6 dígitos y lo envía al correo del titular de la vacante.
 */
router.post('/solicitar-cancelacion-otp', async (req: Request, res: Response) => {
  try {
    const parsed = solicitarOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: 'ERR_VALIDATION',
        message: 'DNI o Pasaporte inválido.',
      });
    }

    const { dni_pasaporte } = parsed.data;

    // Buscar al usuario
    const userRes = await query(
      `SELECT u.id, u.nombre, u.apellido, u.email, ei.codigo AS estado_codigo
       FROM usuarios u
       JOIN estados_inscripcion ei ON u.estado_inscripcion_id = ei.id
       WHERE u.dni_pasaporte = $1
       ORDER BY u.actualizado_en DESC
       LIMIT 1`,
      [dni_pasaporte.trim()]
    );

    // Respuesta genérica de seguridad ante DNI no existente para evitar enumeración
    if (userRes.rowCount === 0) {
      return res.json({
        ok: true,
        success: true,
        message: 'Si el DNI posee una vacante activa, se ha remitido un código de verificación de 6 dígitos a su casilla registrada.',
      });
    }

    const usuario = userRes.rows[0];

    if (usuario.estado_codigo === 'CANCELADO') {
      return res.status(400).json({
        ok: false,
        error: 'ERR_ALREADY_CANCELLED',
        message: 'La inscripción asociada a este documento ya se encuentra cancelada.',
      });
    }

    // Generar código OTP criptográficamente seguro de 6 dígitos
    const otpCode = randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos de validez

    otpStore.set(dni_pasaporte.trim().toUpperCase(), {
      code: otpCode,
      expiresAt,
      attempts: 0,
    });

    // Enviar código al correo del usuario
    await sendCancellationOtpEmail({
      to: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: dni_pasaporte.trim(),
      otpCode,
    }).catch((err) => {
      console.error('Error enviando correo OTP de cancelación:', err);
    });

    // Enmascarar correo para confirmación visual al usuario
    const [localPart, domain] = usuario.email.split('@');
    const maskedEmail = `${localPart.slice(0, 2)}•••@${domain}`;

    return res.json({
      ok: true,
      success: true,
      message: `Se ha remitido un código de verificación de 6 dígitos a su casilla de correo registrada (${maskedEmail}).`,
    });
  } catch (error: any) {
    console.error('Error en POST /api/usuario/solicitar-cancelacion-otp:', error);
    return res.status(500).json({
      ok: false,
      error: 'ERR_INTERNAL',
      message: 'Error al procesar la solicitud del código de seguridad.',
    });
  }
});

/**
 * POST /api/usuario/cancelar
 * Permite al usuario autogestionar la cancelación de su vacante desde la PWA / Credencial.
 * Exige validación de identidad obligatoria: credencial digital QR o código OTP enviado al correo.
 * Si estaba CONFIRMADO, promueve automáticamente al primer aspirante de LISTA_ESPERA (FIFO).
 */
router.post('/cancelar', async (req: Request, res: Response) => {
  try {
    const parsed = cancelarSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'ERR_VALIDATION',
        details: parsed.error.format(),
      });
    }

    const { dni_pasaporte, motivo, qr_token, otp_code } = parsed.data;
    const cleanDni = dni_pasaporte.trim().toUpperCase();

    // 1. VALIDACIÓN ESTRICTA DE IDENTIDAD (SEC-02)
    let identidadVerificada = false;
    let metodoValidacion = '';

    if (qr_token && typeof qr_token === 'string' && qr_token.trim()) {
      try {
        const payload = decryptQRPayload(qr_token.trim());
        if (payload.d.toUpperCase() === cleanDni) {
          identidadVerificada = true;
          metodoValidacion = 'CREDENCIAL_QR_PWA';
        } else {
          return res.status(403).json({
            error: 'ERR_INVALID_QR_TOKEN',
            message: 'La credencial digital escaneada no corresponde al DNI que solicita la cancelación.',
          });
        }
      } catch (err: any) {
        return res.status(403).json({
          error: 'ERR_INVALID_QR_TOKEN',
          message: 'La credencial digital es inválida o ha expirado.',
        });
      }
    } else if (otp_code && typeof otp_code === 'string' && otp_code.trim()) {
      const entry = otpStore.get(cleanDni);
      if (!entry) {
        return res.status(400).json({
          error: 'ERR_OTP_NOT_FOUND',
          message: 'No hay ninguna solicitud de cancelación activa para este DNI o el código ha expirado.',
        });
      }

      if (entry.expiresAt < Date.now()) {
        otpStore.delete(cleanDni);
        return res.status(400).json({
          error: 'ERR_OTP_EXPIRED',
          message: 'El código de seguridad ha expirado. Por favor, solicita uno nuevo.',
        });
      }

      if (entry.attempts >= 3) {
        otpStore.delete(cleanDni);
        return res.status(429).json({
          error: 'ERR_OTP_MAX_ATTEMPTS',
          message: 'Superaste el límite máximo de intentos fallidos. Solicita un nuevo código.',
        });
      }

      if (entry.code !== otp_code.trim()) {
        entry.attempts += 1;
        return res.status(400).json({
          error: 'ERR_INVALID_OTP',
          message: `Código de verificación incorrecto. Intentos restantes: ${3 - entry.attempts}`,
        });
      }

      identidadVerificada = true;
      metodoValidacion = 'CODIGO_OTP_EMAIL';
      otpStore.delete(cleanDni); // Invalidar código de un solo uso
    }

    if (!identidadVerificada) {
      return res.status(401).json({
        error: 'ERR_AUTHENTICATION_REQUIRED',
        message: 'Para cancelar su vacante debe presentar su credencial digital QR o ingresar el código OTP enviado a su correo electrónico.',
      });
    }

    const result = await withTransaction(async (client) => {
      // 2. Buscar al usuario y su estado actual
      const userRes = await client.query(
        `SELECT u.id, u.nombre, u.apellido, u.email, u.evento_id, ei.codigo AS estado_codigo
         FROM usuarios u
         JOIN estados_inscripcion ei ON u.estado_inscripcion_id = ei.id
         WHERE UPPER(u.dni_pasaporte) = $1
         ORDER BY u.actualizado_en DESC
         LIMIT 1`,
        [cleanDni]
      );

      if (userRes.rowCount === 0) {
        throw {
          statusCode: 404,
          code: 'ERR_USER_NOT_FOUND',
          message: 'No se encontró ningún participante con el DNI ingresado.',
        };
      }

      const usuario = userRes.rows[0];

      if (usuario.estado_codigo === 'CANCELADO') {
        return {
          mensaje: 'Tu inscripción ya se encuentra cancelada.',
          usuario: {
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            dni: dni_pasaporte,
            estado: 'CANCELADO',
          },
        };
      }

      const estabaConfirmado = usuario.estado_codigo === 'CONFIRMADO';

      // 3. Pasar al usuario a estado CANCELADO
      await client.query(
        `UPDATE usuarios
         SET estado_inscripcion_id = (SELECT id FROM estados_inscripcion WHERE codigo = 'CANCELADO'),
             actualizado_en = NOW()
         WHERE id = $1`,
        [usuario.id]
      );

      // Registrar en bitácora inmutable de auditoría
      await client.query(
        `INSERT INTO logs_auditoria (evento, actor_usuario, usuario_afectado_id, detalles, timestamp)
         VALUES ('AUTO_BAJA_VOLUNTARIA', 'USUARIO', $1, $2, NOW())`,
        [
          usuario.id,
          JSON.stringify({
            dni_pasaporte,
            motivo: motivo || 'Cancelación voluntaria solicitada por el usuario',
            metodo_validacion: metodoValidacion,
            estaba_confirmado: estabaConfirmado,
          }),
        ]
      );

      let usuarioPromovido = null;

      // 4. Si el usuario estaba CONFIRMADO, promover automáticamente al primer aspirante de LISTA_ESPERA (FIFO)
      if (estabaConfirmado) {
        const waitIdRes = await client.query(
          `SELECT id FROM estados_inscripcion WHERE codigo = 'LISTA_ESPERA'`
        );
        const confIdRes = await client.query(
          `SELECT id FROM estados_inscripcion WHERE codigo = 'CONFIRMADO'`
        );
        const waitId = waitIdRes.rows[0]?.id;
        const confId = confIdRes.rows[0]?.id;

        if (waitId && confId) {
          const aspiranteRes = await client.query(
            `SELECT id, dni_pasaporte, nombre, apellido, email
             FROM usuarios
             WHERE estado_inscripcion_id = $1 AND evento_id = $2
               AND NOT EXISTS (
                 SELECT 1 FROM blacklist b WHERE b.dni_pasaporte = usuarios.dni_pasaporte AND b.activo = TRUE
               )
             ORDER BY creado_en ASC
             LIMIT 1`,
            [waitId, usuario.evento_id || 1]
          );

          if (aspiranteRes.rowCount && aspiranteRes.rowCount > 0) {
            const aspirante = aspiranteRes.rows[0];

            await client.query(
              `UPDATE usuarios
               SET estado_inscripcion_id = $1, actualizado_en = NOW()
               WHERE id = $2`,
              [confId, aspirante.id]
            );

            await client.query(
              `INSERT INTO logs_auditoria (evento, actor_usuario, usuario_afectado_id, detalles, timestamp)
               VALUES ('PROMOCION_POR_AUTO_BAJA', 'SISTEMA', $1, $2, NOW())`,
              [
                aspirante.id,
                JSON.stringify({
                  motivo: `Vacante liberada por auto-baja de usuario ${dni_pasaporte}`,
                  promovido: `${aspirante.nombre} ${aspirante.apellido}`,
                  dni: aspirante.dni_pasaporte,
                  metodo_baja_origen: metodoValidacion,
                }),
              ]
            );

            usuarioPromovido = { nombre: aspirante.nombre, apellido: aspirante.apellido };
          }
        }
      }

      return {
        mensaje:
          'Tu inscripción ha sido cancelada exitosamente. Se liberó la vacante para la comunidad.',
        usuario: {
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          dni: dni_pasaporte,
          estado: 'CANCELADO',
        },
        vacante_reasignada: Boolean(usuarioPromovido),
      };
    });

    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error en /api/usuario/cancelar:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      error: error.code || 'ERR_CANCELACION',
      message: error.message || 'Error al procesar la cancelación.',
    });
  }
});

export default router;
