import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { pool, query } from "../lib/db";
import { registerSchema } from "../lib/schemas";

const router = Router();

// ============================================================
// PROTECCIÓN DEL FORMULARIO PÚBLICO
// ============================================================

const registroLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: process.env.NODE_ENV === "test" ? 1000 : 25,
standardHeaders: true,
legacyHeaders: false,

message: {
    ok: false,
    error: "ERR_RATE_LIMIT_EXCEEDED",
    message:
    "Has superado el límite de intentos de inscripción. Por favor, aguardá unos minutos e intentá nuevamente.",
},
});


// ============================================================
// POST /api/registro
// Registro público de asistentes
// ============================================================

router.post(
"/",
registroLimiter,
async (req: Request, res: Response): Promise<void> => {
    const client = await pool.connect();

    try {
    // --------------------------------------------------------
    // 1. Validación de datos
    // --------------------------------------------------------

    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
        ok: false,
        error: "ERR_VALIDATION",
        message: "Los datos de inscripción no son válidos.",
        details: parsed.error.format(),
        });

        return;
    }

    const {
        tipo_documento,
        dni_pasaporte,
        nombre,
        apellido,
        email,
        celular,
        institucion,
        rol_principal_id,
        roles_adicionales_ids,
        condiciones_adicionales,
        intereses,
        acepta_comunicaciones,
    } = parsed.data;

    // --------------------------------------------------------
    // 2. Iniciar transacción
    // --------------------------------------------------------

    await client.query("BEGIN");

    // --------------------------------------------------------
    // 3. Obtener el evento ETS 2026
    // Bloqueamos la fila para controlar correctamente el cupo.
    // --------------------------------------------------------

    const eventoResult = await client.query(
        `
        SELECT
        id,
        codigo,
        cupo_maximo,
        activo
        FROM eventos
        WHERE codigo = 'ETS_2026'
        LIMIT 1
        FOR UPDATE
        `
    );

    if (eventoResult.rows.length === 0) {
        await client.query("ROLLBACK");

        res.status(500).json({
        ok: false,
        error: "ERR_EVENT_NOT_FOUND",
        message: "No se encontró el evento ETS 2026.",
        });

        return;
    }

    const evento = eventoResult.rows[0];

    if (!evento.activo) {
        await client.query("ROLLBACK");

        res.status(403).json({
        ok: false,
        error: "ERR_EVENT_DISABLED",
        message: "Las inscripciones no están disponibles actualmente.",
        });

        return;
    }

    // --------------------------------------------------------
    // 4. Verificar si las inscripciones están habilitadas
    // --------------------------------------------------------

    const configResult = await client.query(
        `
        SELECT valor
        FROM configuraciones_sistema
        WHERE clave = 'inscripciones_habilitadas'
        LIMIT 1
        `
    );

    const inscripcionesHabilitadas =
        configResult.rows[0]?.valor?.habilitada !== false;

    if (!inscripcionesHabilitadas) {
        await client.query("ROLLBACK");

        res.status(403).json({
        ok: false,
        error: "ERR_REGISTRATION_CLOSED",
        message: "Las inscripciones al Congreso no están habilitadas actualmente.",
        });

        return;
    }

    // --------------------------------------------------------
    // 5. Validar rol principal
    // Solo roles de asistentes, no roles operativos.
    // --------------------------------------------------------

    const rolResult = await client.query(
        `
        SELECT id, nombre, jerarquia
        FROM roles
        WHERE id = $1
        AND nombre NOT IN (
            'Operador',
            'Verificador',
            'Administrador',
            'Superadmin'
        )
        LIMIT 1
        `,
        [rol_principal_id]
    );

    if (rolResult.rows.length === 0) {
        await client.query("ROLLBACK");

        res.status(400).json({
        ok: false,
        error: "ERR_INVALID_ROLE",
        message: "El rol principal seleccionado no es válido para una inscripción.",
        });

        return;
    }

    // --------------------------------------------------------
    // 6. Validar roles adicionales
    // --------------------------------------------------------

    const rolesAdicionales = Array.isArray(roles_adicionales_ids)
        ? [...new Set(roles_adicionales_ids)]
        : [];

    if (rolesAdicionales.length > 0) {
        const rolesResult = await client.query(
        `
        SELECT id, nombre
        FROM roles
        WHERE id = ANY($1::int[])
            AND nombre NOT IN (
            'Operador',
            'Verificador',
            'Administrador',
            'Superadmin'
            )
        `,
        [rolesAdicionales]
        );

        if (rolesResult.rows.length !== rolesAdicionales.length) {
        await client.query("ROLLBACK");

        res.status(400).json({
            ok: false,
            error: "ERR_INVALID_ADDITIONAL_ROLES",
            message: "Uno o más roles adicionales no son válidos.",
        });

        return;
        }
    }

    // --------------------------------------------------------
    // 7. Comprobar duplicado
    // --------------------------------------------------------

    const duplicateResult = await client.query(
        `
        SELECT
        u.id,
        u.nombre,
        u.apellido,
        ei.codigo AS estado_codigo
        FROM usuarios u
        JOIN estados_inscripcion ei
        ON ei.id = u.estado_inscripcion_id
        WHERE u.tipo_documento = $1
        AND u.dni_pasaporte = $2
        AND u.evento_id = $3
        LIMIT 1
        `,
        [
        tipo_documento,
        dni_pasaporte,
        evento.id,
        ]
    );

    if (duplicateResult.rows.length > 0) {
        const existente = duplicateResult.rows[0];

        await client.query(
        `
        INSERT INTO logs_auditoria (
            operador_id,
            accion,
            usuario_id,
            detalles,
            ip_origen
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
            null,
            "REGISTRO_DUPLICADO_RECHAZADO",
            existente.id,
            JSON.stringify({
            evento_id: evento.id,
            estado_actual: existente.estado_codigo,
            }),
            req.ip || "127.0.0.1",
        ]
        );

        await client.query("COMMIT");

        res.status(409).json({
        ok: false,
        error: "ERR_DUPLICATE_REGISTRATION",
        message:
            "Ya existe una inscripción registrada con ese tipo y número de documento para este Congreso.",
        usuario_id: existente.id,
        estado: existente.estado_codigo,
        });

        return;
    }
    
    // --------------------------------------------------------
    // 8. Determinar estado según cupo
    // --------------------------------------------------------

    // El aforo confirmado se administra mediante
    // configuraciones_sistema para poder modificarlo
    // sin cambiar el registro del evento.

    const aforoConfigResult = await client.query(
    `
    SELECT valor
    FROM configuraciones_sistema
    WHERE clave = 'aforo_maximo_confirmados'
    LIMIT 1
    `
    );

    if (aforoConfigResult.rows.length === 0) {
    throw new Error(
        "No está configurada la capacidad máxima de inscripciones confirmadas."
    );
    }

    const aforoConfig = aforoConfigResult.rows[0].valor;
    const cupo = Number(aforoConfig?.cupo);

    if (!Number.isInteger(cupo) || cupo <= 0) {
    throw new Error(
        "La configuración del aforo máximo de inscripciones confirmadas no es válida."
    );
    }

    const countResult = await client.query(
    `
    SELECT COUNT(*)::int AS total
    FROM usuarios u
    JOIN estados_inscripcion ei
        ON ei.id = u.estado_inscripcion_id
    WHERE u.evento_id = $1
        AND ei.codigo = 'CONFIRMADO'
    `,
    [evento.id]
    );

    const confirmados = Number(countResult.rows[0].total);

    const entraEnCupo = confirmados < cupo;

    const estadoCodigo = entraEnCupo
    ? "CONFIRMADO"
    : "LISTA_ESPERA";

    const estadoResult = await client.query(
    `
    SELECT id
    FROM estados_inscripcion
    WHERE codigo = $1
    LIMIT 1
    `,
    [estadoCodigo]
    );

    if (estadoResult.rows.length === 0) {
    throw new Error(
        `No está configurado el estado de inscripción ${estadoCodigo}.`
    );
    }

    const estadoId = estadoResult.rows[0].id;

    // --------------------------------------------------------
    // 9. Crear usuario
    //
    // qr_token:
    // - confirmado → UUID
    // - lista de espera → NULL
    //
    // No se almacenan datos personales dentro del QR.
    // --------------------------------------------------------

    const userResult = await client.query(
        `
        INSERT INTO usuarios (
        evento_id,
        tipo_documento,
        dni_pasaporte,
        nombre,
        apellido,
        email,
        celular,
        institucion,
        rol_principal_id,
        condiciones_adicionales,
        intereses,
        acepta_comunicaciones,
        estado_inscripcion_id,
        qr_token
        )
        VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        CASE
            WHEN $14 = 'CONFIRMADO' THEN gen_random_uuid()
            ELSE NULL
        END
        )
        RETURNING
        id,
        estado_inscripcion_id,
        qr_token
        `,
        [
        evento.id,
        tipo_documento,
        dni_pasaporte,
        nombre,
        apellido,
        email,
        celular,
        institucion || null,
        rol_principal_id,
        condiciones_adicionales || null,
        intereses || null,
        acepta_comunicaciones,
        estadoId,
        estadoCodigo,
        ]
    );

    const usuario = userResult.rows[0];

    // --------------------------------------------------------
    // 10. Guardar roles adicionales
    // --------------------------------------------------------

    for (const rolId of rolesAdicionales) {
        // El rol principal no necesita repetirse.
        if (rolId === rol_principal_id) {
        continue;
        }

        await client.query(
        `
        INSERT INTO usuario_roles_adicionales (
            usuario_id,
            rol_id
        )
        VALUES ($1, $2)
        ON CONFLICT (usuario_id, rol_id) DO NOTHING
        `,
        [usuario.id, rolId]
        );
    }

    // --------------------------------------------------------
    // 11. Auditoría
    // --------------------------------------------------------

    await client.query(
        `
        INSERT INTO logs_auditoria (
        operador_id,
        accion,
        usuario_id,
        detalles,
        ip_origen
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
        null,
        estadoCodigo === "CONFIRMADO"
            ? "REGISTRO_CONFIRMADO"
            : "REGISTRO_LISTA_ESPERA",
        usuario.id,
        JSON.stringify({
            evento_id: evento.id,
            estado: estadoCodigo,
            acepta_comunicaciones,
        }),
        req.ip || "127.0.0.1",
        ]
    );

    // --------------------------------------------------------
    // 12. Confirmar transacción
    // --------------------------------------------------------

    await client.query("COMMIT");

    // --------------------------------------------------------
    // 13. Respuesta
    // --------------------------------------------------------

    if (estadoCodigo === "CONFIRMADO") {
        res.status(201).json({
        ok: true,
        estado: "CONFIRMADO",
        mensaje:
            "Tu inscripción al Congreso ETS 2026 fue confirmada.",
        usuario_id: usuario.id,
        qr_token: usuario.qr_token,
        qr_pendiente_envio: true,
        });

        return;
    }

    res.status(201).json({
        ok: true,
        estado: "LISTA_ESPERA",
        mensaje:
        "El cupo de inscripciones confirmadas se encuentra completo. Tu registro fue incorporado a la lista de espera.",
        usuario_id: usuario.id,
        qr_token: null,
    });
    } catch (error: any) {
    await client.query("ROLLBACK").catch(() => {});

    // Si otra petición ganó una carrera e intentó
    // insertar el mismo documento, la restricción UNIQUE
    // de PostgreSQL protege igualmente la integridad.
    if (error?.code === "23505") {
        res.status(409).json({
        ok: false,
        error: "ERR_DUPLICATE_REGISTRATION",
        message:
            "Ya existe una inscripción registrada con ese tipo y número de documento para este Congreso.",
        });

        return;
    }

    console.error("Error en POST /api/registro:", error);

    res.status(500).json({
        ok: false,
        error: "ERR_REGISTRATION_INTERNAL",
        message: "No fue posible procesar la inscripción.",
    });
    } finally {
    client.release();
    }
}
);


// ============================================================
// GET /api/registro/roles
// Roles disponibles para el formulario público
// ============================================================

router.get(
"/roles",
async (_req: Request, res: Response): Promise<void> => {
    try {
    const result = await query(
        `
        SELECT
        id,
        nombre,
        descripcion
        FROM roles
        WHERE nombre NOT IN (
        'Operador',
        'Verificador',
        'Administrador',
        'Superadmin'
        )
        ORDER BY jerarquia ASC, id ASC
        `
    );

    res.json({
        ok: true,
        roles: result.rows,
    });
    } catch (error) {
    console.error("Error en GET /api/registro/roles:", error);

    res.status(500).json({
        ok: false,
        error: "ERR_DB",
        message: "Error al consultar los roles disponibles.",
    });
    }
}
);

export default router;