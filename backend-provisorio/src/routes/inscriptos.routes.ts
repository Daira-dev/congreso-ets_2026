import { Router, Response } from "express";
import { query } from "../lib/db";
import {
  AuthenticatedRequest,
  requireHierarchy,
} from "../middlewares/authMiddleware";

const router = Router();

router.use(requireHierarchy(4));

// ============================================================
// GET /api/admin/inscriptos
// Lista, búsqueda y filtro de inscriptos
// ============================================================

router.get(
  "/",
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const q =
        typeof req.query.q === "string"
          ? req.query.q.trim()
          : "";

      const estado =
        typeof req.query.estado === "string"
          ? req.query.estado.trim().toUpperCase()
          : "";

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
          r.nombre AS rol_principal,
          ei.codigo AS estado,
          ei.nombre AS estado_nombre,
          u.acepta_comunicaciones,
          u.qr_token,
          u.creado_en,
          u.actualizado_en
        FROM usuarios u
        JOIN roles r
          ON r.id = u.rol_principal_id
        JOIN estados_inscripcion ei
          ON ei.id = u.estado_inscripcion_id
        JOIN eventos e
          ON e.id = u.evento_id
        WHERE e.codigo = 'ETS_2026'
          AND (
            $1 = ''
            OR u.nombre ILIKE '%' || $1 || '%'
            OR u.apellido ILIKE '%' || $1 || '%'
            OR u.dni_pasaporte ILIKE '%' || $1 || '%'
            OR u.email ILIKE '%' || $1 || '%'
          )
          AND (
            $2 = ''
            OR ei.codigo = $2
          )
        ORDER BY u.apellido ASC, u.nombre ASC
        `,
        [q, estado]
      );

      res.json({
        ok: true,
        total: result.rows.length,
        inscriptos: result.rows,
      });
    } catch (error) {
      console.error("Error en GET /api/admin/inscriptos:", error);

      res.status(500).json({
        ok: false,
        error: "ERR_DB",
        message: "No fue posible consultar los inscriptos.",
      });
    }
  }
);

// ============================================================
// GET /api/admin/inscriptos/exportar
// Exportar inscriptos a CSV
// ============================================================

router.get(
  "/exportar",
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const q =
        typeof req.query.q === "string"
          ? req.query.q.trim()
          : "";

      const estado =
        typeof req.query.estado === "string"
          ? req.query.estado.trim().toUpperCase()
          : "";

      const result = await query(
        `
        SELECT
          u.nombre,
          u.apellido,
          u.tipo_documento,
          u.dni_pasaporte,
          u.email,
          u.celular,
          u.institucion,
          r.nombre AS rol_principal,
          COALESCE(
            STRING_AGG(DISTINCT ra.nombre, ', ' ORDER BY ra.nombre),
            ''
          ) AS roles_adicionales,
          ei.codigo AS estado,
          u.acepta_comunicaciones,
          u.creado_en
        FROM usuarios u
        JOIN roles r
          ON r.id = u.rol_principal_id
        JOIN estados_inscripcion ei
          ON ei.id = u.estado_inscripcion_id
        JOIN eventos e
          ON e.id = u.evento_id
        LEFT JOIN usuario_roles_adicionales ura
          ON ura.usuario_id = u.id
        LEFT JOIN roles ra
          ON ra.id = ura.rol_id
        WHERE e.codigo = 'ETS_2026'
          AND (
            $1 = ''
            OR u.nombre ILIKE '%' || $1 || '%'
            OR u.apellido ILIKE '%' || $1 || '%'
            OR u.dni_pasaporte ILIKE '%' || $1 || '%'
            OR u.email ILIKE '%' || $1 || '%'
          )
          AND (
            $2 = ''
            OR ei.codigo = $2
          )
        GROUP BY
          u.id,
          r.nombre,
          ei.codigo
        ORDER BY
          u.apellido ASC,
          u.nombre ASC
        `,
        [q, estado]
      );

      const escapeCsv = (value: unknown): string => {
        const text = value === null || value === undefined
          ? ""
          : String(value);

        return `"${text.replace(/"/g, '""')}"`;
      };

      const headers = [
        "Nombre",
        "Apellido",
        "Tipo documento",
        "Número documento",
        "Email",
        "Celular",
        "Institución",
        "Rol principal",
        "Roles adicionales",
        "Estado",
        "Acepta comunicaciones",
        "Fecha inscripción",
      ];

      const rows = result.rows.map((row) => [
        row.nombre,
        row.apellido,
        row.tipo_documento,
        row.dni_pasaporte,
        row.email,
        row.celular,
        row.institucion,
        row.rol_principal,
        row.roles_adicionales,
        row.estado,
        row.acepta_comunicaciones ? "Sí" : "No",
        row.creado_en
          ? new Date(row.creado_en).toISOString()
          : "",
      ]);

      const csv = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
      ].join("\r\n");

      await query(
        `
        INSERT INTO logs_auditoria (
          operador_id,
          accion,
          detalles
        )
        VALUES ($1, $2, $3)
        `,
        [
          req.operator?.sub ?? null,
          "INSCRIPTOS_EXPORTADOS_CSV",
          JSON.stringify({
            filtros: {
              q,
              estado,
            },
            cantidad: result.rows.length,
          }),
        ]
      );

      res.setHeader(
        "Content-Type",
        "text/csv; charset=utf-8"
      );

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="inscriptos_ets_2026.csv"'
      );

      // BOM para que Excel reconozca UTF-8 correctamente.
      res.send("\uFEFF" + csv);
    } catch (error) {
      console.error(
        "Error en GET /api/admin/inscriptos/exportar:",
        error
      );

      res.status(500).json({
        ok: false,
        error: "ERR_EXPORT",
        message: "No fue posible exportar los inscriptos.",
      });
    }
  }
);


// ============================================================
// GET /api/admin/inscriptos/:id
// Detalle de un inscripto
// ============================================================

router.get(
  "/:id",
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const id = req.params.id;

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
          u.condiciones_adicionales,
          u.intereses,
          u.acepta_comunicaciones,
          u.qr_token,
          u.creado_en,
          u.actualizado_en,

          r.id AS rol_principal_id,
          r.nombre AS rol_principal,

          ei.id AS estado_id,
          ei.codigo AS estado,
          ei.nombre AS estado_nombre

        FROM usuarios u
        JOIN roles r
          ON r.id = u.rol_principal_id
        JOIN estados_inscripcion ei
          ON ei.id = u.estado_inscripcion_id
        JOIN eventos e
          ON e.id = u.evento_id
        WHERE u.id = $1
          AND e.codigo = 'ETS_2026'
        LIMIT 1
        `,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          ok: false,
          error: "ERR_USER_NOT_FOUND",
          message: "No se encontró el inscripto.",
        });

        return;
      }

      const usuario = result.rows[0];

      const rolesResult = await query(
        `
        SELECT
          r.id,
          r.nombre,
          r.descripcion
        FROM usuario_roles_adicionales ura
        JOIN roles r
          ON r.id = ura.rol_id
        WHERE ura.usuario_id = $1
        ORDER BY r.id
        `,
        [id]
      );

      res.json({
        ok: true,
        inscripto: {
          ...usuario,
          roles_adicionales: rolesResult.rows,
        },
      });
    } catch (error) {
      console.error(
        "Error en GET /api/admin/inscriptos/:id:",
        error
      );

      res.status(500).json({
        ok: false,
        error: "ERR_DB",
        message: "No fue posible consultar el inscripto.",
      });
    }
  }
);

export default router;