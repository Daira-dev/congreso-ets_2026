import { Router, Request, Response } from "express";
import { z } from "zod";
import { pool, query } from "../lib/db";
import {
  AuthenticatedRequest,
  requireHierarchy,
} from "../middlewares/authMiddleware";


// ============================================================
// VALIDACIONES
// ============================================================

const actividadSchema = z.object({
  nombre: z.string().min(1).max(255),
  descripcion: z.string().max(10000).nullable().optional(),
  tipo: z.string().min(1).max(100),
  tipo_acreditacion_id: z.number().int().positive().nullable().optional(),
  punto_acceso_id: z.number().int().positive().nullable().optional(),
  cupo_maximo: z.number().int().positive().nullable().optional(),
  horario_inicio: z.string().datetime({ offset: true }).nullable().optional(),
  horario_fin: z.string().datetime({ offset: true }).nullable().optional(),
  disertante_nombre: z.string().max(255).nullable().optional(),
  activa: z.boolean().optional(),
  publicada: z.boolean().optional(),
});

const actividadUpdateSchema = actividadSchema.partial();


// ============================================================
// ROUTER PÚBLICO
// ============================================================

const router = Router();


// ============================================================
// GET /api/actividades
// Actividades publicadas del Congreso
// ============================================================

router.get(
  "/",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await query(
        `
        SELECT
          a.id,
          a.nombre,
          a.descripcion,
          a.tipo AS categoria,
          a.disertante_nombre AS expositor,
          p.nombre AS sala,
          p.ubicacion_fisica AS ubicacion,
          a.horario_inicio,
          a.horario_fin,
          a.cupo_maximo AS cupo,
          COUNT(DISTINCT s.usuario_id)::int AS ocupacion,
          a.activa AS activo
        FROM actividades a
        JOIN eventos e
          ON e.id = a.evento_id
        LEFT JOIN puntos_acceso p
          ON p.id = a.punto_acceso_id
        LEFT JOIN asistencias s
          ON s.actividad_id = a.id
        WHERE e.codigo = 'ETS_2026'
          AND e.activo = TRUE
          AND a.activa = TRUE
          AND a.publicada = TRUE
        GROUP BY
          a.id,
          a.nombre,
          a.descripcion,
          a.tipo,
          a.disertante_nombre,
          p.nombre,
          p.ubicacion_fisica,
          a.horario_inicio,
          a.horario_fin,
          a.cupo_maximo,
          a.activa
        ORDER BY
          a.horario_inicio ASC NULLS LAST,
          a.id ASC
        `
      );

      res.json({
        ok: true,
        actividades: result.rows,
      });
    } catch (error) {
      console.error("Error en GET /api/actividades:", error);

      res.status(500).json({
        ok: false,
        error: "ERR_DB",
        message: "No fue posible consultar las actividades.",
      });
    }
  }
);


// ============================================================
// ROUTER ADMINISTRATIVO
// ============================================================

export const adminActividadesRouter = Router();

adminActividadesRouter.use(requireHierarchy(4));


// ============================================================
// GET /api/admin/actividades
// Lista todas las actividades
// ============================================================

adminActividadesRouter.get(
  "/",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await query(
        `
        SELECT
          a.id,
          a.nombre,
          a.descripcion,
          a.tipo,
          a.tipo_acreditacion_id,
          a.punto_acceso_id,
          p.nombre AS punto_acceso,
          a.cupo_maximo,
          a.horario_inicio,
          a.horario_fin,
          a.disertante_nombre,
          a.activa,
          a.publicada,
          COUNT(DISTINCT s.usuario_id)::int AS ocupacion,
          a.creado_en,
          a.actualizado_en
        FROM actividades a
        JOIN eventos e
          ON e.id = a.evento_id
        LEFT JOIN puntos_acceso p
          ON p.id = a.punto_acceso_id
        LEFT JOIN asistencias s
          ON s.actividad_id = a.id
        WHERE e.codigo = 'ETS_2026'
        GROUP BY
          a.id,
          a.nombre,
          a.descripcion,
          a.tipo,
          a.tipo_acreditacion_id,
          a.punto_acceso_id,
          p.nombre,
          a.cupo_maximo,
          a.horario_inicio,
          a.horario_fin,
          a.disertante_nombre,
          a.activa,
          a.publicada,
          a.creado_en,
          a.actualizado_en
        ORDER BY
          a.horario_inicio ASC NULLS LAST,
          a.id ASC
        `
      );

      res.json({
        ok: true,
        actividades: result.rows,
      });
    } catch (error) {
      console.error("Error en GET /api/admin/actividades:", error);

      res.status(500).json({
        ok: false,
        error: "ERR_DB",
        message: "No fue posible consultar las actividades.",
      });
    }
  }
);


// ============================================================
// POST /api/admin/actividades
// Crear actividad
// ============================================================

adminActividadesRouter.post(
  "/",
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const parsed = actividadSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: "ERR_VALIDATION",
        message: "Los datos de la actividad no son válidos.",
        details: parsed.error.format(),
      });

      return;
    }

    const data = parsed.data;

    if (
      data.horario_inicio &&
      data.horario_fin &&
      new Date(data.horario_fin) <= new Date(data.horario_inicio)
    ) {
      res.status(400).json({
        ok: false,
        error: "ERR_INVALID_SCHEDULE",
        message: "El horario de finalización debe ser posterior al de inicio.",
      });

      return;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const eventoResult = await client.query(
        `
        SELECT id
        FROM eventos
        WHERE codigo = 'ETS_2026'
        LIMIT 1
        `
      );

      if (eventoResult.rows.length === 0) {
        throw new Error("No se encontró el evento ETS_2026.");
      }

      const eventoId = eventoResult.rows[0].id;

      const actividadResult = await client.query(
        `
        INSERT INTO actividades (
          evento_id,
          nombre,
          descripcion,
          tipo,
          tipo_acreditacion_id,
          punto_acceso_id,
          cupo_maximo,
          horario_inicio,
          horario_fin,
          disertante_nombre,
          activa,
          publicada
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          COALESCE($11, TRUE),
          COALESCE($12, FALSE)
        )
        RETURNING *
        `,
        [
          eventoId,
          data.nombre,
          data.descripcion ?? null,
          data.tipo,
          data.tipo_acreditacion_id ?? null,
          data.punto_acceso_id ?? null,
          data.cupo_maximo ?? null,
          data.horario_inicio
            ? new Date(data.horario_inicio)
            : null,
          data.horario_fin
            ? new Date(data.horario_fin)
            : null,
          data.disertante_nombre ?? null,
          data.activa ?? true,
          data.publicada ?? false,
        ]
      );

      const actividad = actividadResult.rows[0];

      await client.query(
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
          "ACTIVIDAD_CREADA",
          JSON.stringify({
            actividad_id: actividad.id,
            nombre: actividad.nombre,
          }),
        ]
      );

      await client.query("COMMIT");

      res.status(201).json({
        ok: true,
        actividad,
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});

      console.error("Error en POST /api/admin/actividades:", error);

      res.status(500).json({
        ok: false,
        error: "ERR_ACTIVITY_CREATE",
        message: "No fue posible crear la actividad.",
      });
    } finally {
      client.release();
    }
  }
);


// ============================================================
// PATCH /api/admin/actividades/:id
// Editar actividad
// ============================================================

adminActividadesRouter.patch(
  "/:id",
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        ok: false,
        error: "ERR_INVALID_ID",
        message: "El ID de actividad no es válido.",
      });

      return;
    }

    const parsed = actividadUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: "ERR_VALIDATION",
        message: "Los datos de la actividad no son válidos.",
        details: parsed.error.format(),
      });

      return;
    }

    const data = parsed.data;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const currentResult = await client.query(
        `
        SELECT
          a.*
        FROM actividades a
        JOIN eventos e
          ON e.id = a.evento_id
        WHERE a.id = $1
          AND e.codigo = 'ETS_2026'
        FOR UPDATE
        `,
        [id]
      );

      if (currentResult.rows.length === 0) {
        await client.query("ROLLBACK");

        res.status(404).json({
          ok: false,
          error: "ERR_ACTIVITY_NOT_FOUND",
          message: "No se encontró la actividad.",
        });

        return;
      }

      const current = currentResult.rows[0];

      const updated = {
        nombre: data.nombre ?? current.nombre,
        descripcion:
          data.descripcion !== undefined
            ? data.descripcion
            : current.descripcion,
        tipo: data.tipo ?? current.tipo,
        tipo_acreditacion_id:
          data.tipo_acreditacion_id !== undefined
            ? data.tipo_acreditacion_id
            : current.tipo_acreditacion_id,
        punto_acceso_id:
          data.punto_acceso_id !== undefined
            ? data.punto_acceso_id
            : current.punto_acceso_id,
        cupo_maximo:
          data.cupo_maximo !== undefined
            ? data.cupo_maximo
            : current.cupo_maximo,
        horario_inicio:
          data.horario_inicio !== undefined
            ? data.horario_inicio
            : current.horario_inicio,
        horario_fin:
          data.horario_fin !== undefined
            ? data.horario_fin
            : current.horario_fin,
        disertante_nombre:
          data.disertante_nombre !== undefined
            ? data.disertante_nombre
            : current.disertante_nombre,
        activa:
          data.activa !== undefined
            ? data.activa
            : current.activa,
        publicada:
          data.publicada !== undefined
            ? data.publicada
            : current.publicada,
      };

      if (
        updated.horario_inicio &&
        updated.horario_fin &&
        new Date(updated.horario_fin) <=
          new Date(updated.horario_inicio)
      ) {
        await client.query("ROLLBACK");

        res.status(400).json({
          ok: false,
          error: "ERR_INVALID_SCHEDULE",
          message:
            "El horario de finalización debe ser posterior al de inicio.",
        });

        return;
      }

      const updateResult = await client.query(
        `
        UPDATE actividades
        SET
          nombre = $1,
          descripcion = $2,
          tipo = $3,
          tipo_acreditacion_id = $4,
          punto_acceso_id = $5,
          cupo_maximo = $6,
          horario_inicio = $7,
          horario_fin = $8,
          disertante_nombre = $9,
          activa = $10,
          publicada = $11,
          actualizado_en = NOW()
        WHERE id = $12
        RETURNING *
        `,
        [
          updated.nombre,
          updated.descripcion,
          updated.tipo,
          updated.tipo_acreditacion_id,
          updated.punto_acceso_id,
          updated.cupo_maximo,
          updated.horario_inicio
            ? new Date(updated.horario_inicio)
            : null,
          updated.horario_fin
            ? new Date(updated.horario_fin)
            : null,
          updated.disertante_nombre,
          updated.activa,
          updated.publicada,
          id,
        ]
      );

      await client.query(
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
          "ACTIVIDAD_ACTUALIZADA",
          JSON.stringify({
            actividad_id: id,
          }),
        ]
      );

      await client.query("COMMIT");

      res.json({
        ok: true,
        actividad: updateResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});

      console.error("Error en PATCH /api/admin/actividades/:id:", error);

      res.status(500).json({
        ok: false,
        error: "ERR_ACTIVITY_UPDATE",
        message: "No fue posible actualizar la actividad.",
      });
    } finally {
      client.release();
    }
  }
);


// ============================================================
// PATCH /api/admin/actividades/:id/publicacion
// Publicar / despublicar actividad
// ============================================================

adminActividadesRouter.patch(
  "/:id/publicacion",
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Number(req.params.id);
    const publicada = req.body?.publicada;

    if (!Number.isInteger(id) || id <= 0 || typeof publicada !== "boolean") {
      res.status(400).json({
        ok: false,
        error: "ERR_INVALID_DATA",
        message: "El ID o el estado de publicación no son válidos.",
      });

      return;
    }

    try {
      const result = await query(
        `
        UPDATE actividades
        SET
          publicada = $1,
          actualizado_en = NOW()
        WHERE id = $2
        RETURNING id, nombre, publicada, activa
        `,
        [publicada, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          ok: false,
          error: "ERR_ACTIVITY_NOT_FOUND",
          message: "No se encontró la actividad.",
        });

        return;
      }

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
          publicada
            ? "ACTIVIDAD_PUBLICADA"
            : "ACTIVIDAD_DESPUBLICADA",
          JSON.stringify({
            actividad_id: id,
          }),
        ]
      );

      res.json({
        ok: true,
        actividad: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Error en PATCH /api/admin/actividades/:id/publicacion:",
        error
      );

      res.status(500).json({
        ok: false,
        error: "ERR_ACTIVITY_PUBLICATION",
        message: "No fue posible cambiar la publicación.",
      });
    }
  }
);


// ============================================================
// PATCH /api/admin/actividades/:id/estado
// Activar / desactivar actividad
// ============================================================

adminActividadesRouter.patch(
  "/:id/estado",
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Number(req.params.id);
    const activa = req.body?.activa;

    if (!Number.isInteger(id) || id <= 0 || typeof activa !== "boolean") {
      res.status(400).json({
        ok: false,
        error: "ERR_INVALID_DATA",
        message: "El ID o el estado de la actividad no son válidos.",
      });

      return;
    }

    try {
      const result = await query(
        `
        UPDATE actividades
        SET
          activa = $1,
          actualizado_en = NOW()
        WHERE id = $2
        RETURNING id, nombre, publicada, activa
        `,
        [activa, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          ok: false,
          error: "ERR_ACTIVITY_NOT_FOUND",
          message: "No se encontró la actividad.",
        });

        return;
      }

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
          activa
            ? "ACTIVIDAD_ACTIVADA"
            : "ACTIVIDAD_DESACTIVADA",
          JSON.stringify({
            actividad_id: id,
          }),
        ]
      );

      res.json({
        ok: true,
        actividad: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Error en PATCH /api/admin/actividades/:id/estado:",
        error
      );

      res.status(500).json({
        ok: false,
        error: "ERR_ACTIVITY_STATUS",
        message: "No fue posible cambiar el estado.",
      });
    }
  }
);

export default router;