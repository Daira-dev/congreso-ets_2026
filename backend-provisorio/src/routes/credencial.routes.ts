import { Router, Request, Response } from "express";
import { query } from "../lib/db";
import { enviarCredencialPorEmail } from "../lib/emailService";
import nodemailer from "nodemailer";
const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const dni = req.query.dni as string;

  if (!dni) {
    res.status(400).json({ success: false, message: "DNI es requerido" });
    return;
  }

  try {
    const result = await query(
      `
      SELECT
        u.id,
        u.nombre,
        u.apellido,
        u.tipo_documento,
        u.dni_pasaporte,
        u.email,
        u.celular,
        u.institucion,
        u.qr_token,
        ei.codigo AS estado,
        r.nombre AS rol_principal
      FROM usuarios u
      JOIN estados_inscripcion ei ON ei.id = u.estado_inscripcion_id
      JOIN roles r ON r.id = u.rol_principal_id
      WHERE u.dni_pasaporte = $1
      LIMIT 1
      `,
      [dni]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "No se encontró ninguna inscripción con este DNI." });
      return;
    }

    const usuario = result.rows[0];

    if (usuario.estado !== 'CONFIRMADO') {
      res.status(403).json({ success: false, message: "La credencial solo se emite para vacantes confirmadas." });
      return;
    }

    res.json({
      success: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        dni_pasaporte: usuario.dni_pasaporte,
        tipo_documento: usuario.tipo_documento,
        email: usuario.email,
        rol_principal: usuario.rol_principal,
        institucion: usuario.institucion,
      },
      qr_token: usuario.qr_token
    });

  } catch (err) {
    console.error("Error en GET /api/credencial:", err);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
});

router.post("/enviar-email", async (req: Request, res: Response): Promise<void> => {
  const { dni } = req.body;

  if (!dni) {
    res.status(400).json({ success: false, message: "DNI es requerido" });
    return;
  }

  try {
    const result = await query(
      `
      SELECT
        nombre,
        email,
        qr_token,
        dni_pasaporte
      FROM usuarios
      WHERE dni_pasaporte = $1
      LIMIT 1
      `,
      [dni]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "No se encontró ninguna inscripción con este DNI." });
      return;
    }

    const usuario = result.rows[0];

    const info = await enviarCredencialPorEmail(usuario.email, usuario.nombre, usuario.dni_pasaporte, usuario.qr_token);
    
    // Si estamos usando Ethereal, devolveremos la URL de previsualización para mostrarla (opcional)
    const previewUrl = info && info.messageId ? (nodemailer.getTestMessageUrl(info) || null) : null;

    res.json({
      success: true,
      message: "Credencial enviada por email correctamente.",
      previewUrl
    });

  } catch (err) {
    console.error("Error en POST /api/credencial/enviar-email:", err);
    res.status(500).json({ success: false, message: "Error al enviar el email." });
  }
});

export default router;
