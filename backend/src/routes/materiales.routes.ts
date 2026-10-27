
import { Router, Request, Response } from 'express';
import { query } from '../lib/db';
import { AuthenticatedRequest, requireHierarchy } from '../middlewares/authMiddleware';

const router = Router();

const TIPOS_VALIDOS = ['novedad', 'documento', 'video', 'flyer', 'foto', 'recurso'];

function obtenerEventoId(valor: unknown): number | null {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/* Lista materiales publicados para el sitio público */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const eventoId = obtenerEventoId(req.query.evento_id);

    const evento = eventoId
      ? await query('SELECT id FROM eventos WHERE id = $1', [eventoId])
      : await query(
          `SELECT id FROM eventos
           WHERE codigo = 'ETS_2026' OR activo = TRUE
           ORDER BY (codigo = 'ETS_2026') DESC, anio ASC
           LIMIT 1`
        );

    if (!evento.rows.length) {
      res.json({ success: true, total: 0, materiales: [] });
      return;
    }

    const result = await query(
      `SELECT id, evento_id, tipo AS type,
              TO_CHAR(fecha_publicacion, 'YYYY-MM-DD') AS date,
              titulo AS title, descripcion AS description,
              url_imagen AS image, url_archivo AS "fileUrl",
              url_video AS "videoUrl", imagenes AS images,
              publicado
       FROM materiales
       WHERE evento_id = $1 AND publicado = TRUE
       ORDER BY fecha_publicacion DESC, id DESC`,
      [evento.rows[0].id]
    );

    res.json({ success: true, total: result.rows.length, materiales: result.rows });
  } catch (error) {
    console.error('Error al consultar materiales:', error);
    res.status(500).json({ success: false, error: 'Error al consultar materiales' });
  }
});

/* Lista todos los materiales para administración, incluidos borradores */
router.get('/admin', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const eventoId = obtenerEventoId(req.query.evento_id);

    const evento = eventoId
      ? await query('SELECT id FROM eventos WHERE id = $1', [eventoId])
      : await query(
          `SELECT id FROM eventos
           WHERE codigo = 'ETS_2026' OR activo = TRUE
           ORDER BY (codigo = 'ETS_2026') DESC, anio ASC
           LIMIT 1`
        );

    if (!evento.rows.length) {
      res.json({ success: true, total: 0, materiales: [] });
      return;
    }

    const result = await query(
      `SELECT id, evento_id, tipo AS type,
              TO_CHAR(fecha_publicacion, 'YYYY-MM-DD') AS date,
              titulo AS title, descripcion AS description,
              url_imagen AS image, url_archivo AS "fileUrl",
              url_video AS "videoUrl", imagenes AS images,
              publicado
       FROM materiales
       WHERE evento_id = $1
       ORDER BY fecha_publicacion DESC, id DESC`,
      [evento.rows[0].id]
    );

    res.json({ success: true, total: result.rows.length, materiales: result.rows });
  } catch (error) {
    console.error('Error al listar materiales para administración:', error);
    res.status(500).json({ success: false, error: 'Error al listar materiales' });
  }
});

/* Crea un material */
router.post('/', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      evento_id, type, title, description,
      date, image, fileUrl, videoUrl, images, publicado
    } = req.body;

    const eventoId = obtenerEventoId(evento_id);

    if (!eventoId || !TIPOS_VALIDOS.includes(type) || !title?.trim()) {
      res.status(400).json({
        success: false,
        error: 'El evento, el tipo y el título son obligatorios.'
      });
      return;
    }

    const evento = await query('SELECT id FROM eventos WHERE id = $1', [eventoId]);

    if (!evento.rows.length) {
      res.status(400).json({ success: false, error: 'El evento indicado no existe.' });
      return;
    }

    const result = await query(
      `INSERT INTO materiales
        (evento_id, tipo, titulo, descripcion, fecha_publicacion,
         url_imagen, url_archivo, url_video, imagenes, publicado)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE),
               $6, $7, $8, $9::jsonb, $10)
       RETURNING id`,
      [
        eventoId, type, title.trim(), description || null,
        date || null, image || null, fileUrl || null, videoUrl || null,
        JSON.stringify(Array.isArray(images) ? images : []),
        publicado === true
      ]
    );

    res.status(201).json({
      success: true,
      id: result.rows[0].id,
      message: 'Material creado correctamente.'
    });
  } catch (error) {
    console.error('Error al crear material:', error);
    res.status(500).json({ success: false, error: 'Error al crear material' });
  }
});

/* Actualiza un material existente */
router.put('/:id', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = obtenerEventoId(req.params.id);
    const {
      evento_id, type, title, description,
      date, image, fileUrl, videoUrl, images, publicado
    } = req.body;

    const eventoId = obtenerEventoId(evento_id);

    if (!id || !eventoId || !TIPOS_VALIDOS.includes(type) || !title?.trim()) {
      res.status(400).json({ success: false, error: 'Los datos del material son inválidos.' });
      return;
    }

    const result = await query(
      `UPDATE materiales
       SET evento_id = $1,
           tipo = $2,
           titulo = $3,
           descripcion = $4,
           fecha_publicacion = COALESCE($5::date, CURRENT_DATE),
           url_imagen = $6,
           url_archivo = $7,
           url_video = $8,
           imagenes = $9::jsonb,
           publicado = $10,
           actualizado_en = NOW()
       WHERE id = $11
       RETURNING id`,
      [
        eventoId, type, title.trim(), description || null,
        date || null, image || null, fileUrl || null, videoUrl || null,
        JSON.stringify(Array.isArray(images) ? images : []),
        publicado === true, id
      ]
    );

    if (!result.rows.length) {
      res.status(404).json({ success: false, error: 'No se encontró el material.' });
      return;
    }

    res.json({ success: true, message: 'Material actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar material:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar material' });
  }
});

/* Elimina un material */
router.delete('/:id', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = obtenerEventoId(req.params.id);

    if (!id) {
      res.status(400).json({ success: false, error: 'El identificador es inválido.' });
      return;
    }

    const result = await query('DELETE FROM materiales WHERE id = $1 RETURNING id', [id]);

    if (!result.rows.length) {
      res.status(404).json({ success: false, error: 'No se encontró el material.' });
      return;
    }

    res.json({ success: true, message: 'Material eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar material:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar material' });
  }
});

export default router;
