
import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { query } from '../lib/db';
import { AuthenticatedRequest, requireHierarchy } from '../middlewares/authMiddleware';

const router = Router();

const TIPOS_VALIDOS = ['novedad', 'documento', 'video', 'flyer', 'foto', 'recurso'];

const ALLOWED_IMAGE_MIMES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'image/avif',
];

const DEFAULT_CATEGORIAS_IMAGENES: Record<string, string> = {
  novedad: '/assets/icons/card1.svg',
  documento: '/assets/icons/card2.svg',
  video: '/assets/icons/card3.svg',
  flyer: '/assets/icons/card4.svg',
  foto: '/assets/icons/card5.svg',
  recurso: '/assets/icons/card1.svg',
};

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

/* Sube una imagen de material sin compresión destructiva a imagenes_de_materiales/ */
router.post('/upload-imagen', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { filename, fileBase64, mimeType } = req.body;
    if (!filename || !fileBase64) {
      res.status(400).json({ success: false, error: 'Se requieren filename y fileBase64.' });
      return;
    }

    // Validación de tipo MIME en Backend
    const detectedMime = mimeType ? String(mimeType).toLowerCase() : '';
    const ext = path.extname(filename).toLowerCase();
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.avif'];

    if (!validExtensions.includes(ext)) {
      res.status(400).json({
        success: false,
        error: `Extensión "${ext}" no permitida. Formatos válidos: PNG, JPG, JPEG, WebP, SVG, AVIF.`,
      });
      return;
    }

    if (detectedMime && !ALLOWED_IMAGE_MIMES.includes(detectedMime)) {
      res.status(400).json({
        success: false,
        error: `Tipo MIME "${detectedMime}" no permitido. Formatos permitidos: image/png, image/jpeg, image/webp, image/svg+xml, image/avif.`,
      });
      return;
    }

    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Directorios de persistencia física: imagenes_de_materiales/
    const rootDir = path.resolve(__dirname, '../../../imagenes_de_materiales');
    const frontendDir = path.resolve(__dirname, '../../../frontend/public/imagenes_de_materiales');

    if (!fs.existsSync(rootDir)) {
      fs.mkdirSync(rootDir, { recursive: true });
    }
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }

    const cleanBaseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFilename = `${cleanBaseName}_${Date.now()}${ext}`;
    const targetRootPath = path.join(rootDir, finalFilename);
    const targetFrontendPath = path.join(frontendDir, finalFilename);

    // Guardar archivo "as it is" (sin compresión destructiva)
    await fs.promises.writeFile(targetRootPath, buffer);
    await fs.promises.writeFile(targetFrontendPath, buffer);

    // URL relativa accesible para la base de datos (cero blobs binarios)
    const relativeUrl = `/imagenes_de_materiales/${finalFilename}`;

    res.json({
      success: true,
      mensaje: 'Imagen almacenada correctamente en imagenes_de_materiales/ sin compresión.',
      url: relativeUrl,
      filename: finalFilename,
      sizeBytes: buffer.length,
      mimeType: detectedMime || `image/${ext.replace('.', '')}`,
    });
  } catch (error: any) {
    console.error('Error en upload-imagen de materiales:', error);
    res.status(500).json({ success: false, error: 'Error procesando la subida de imagen.' });
  }
});

/* Consulta el catálogo de imágenes por categorías de materiales */
router.get('/categorias-imagenes', async (_req: Request, res: Response): Promise<void> => {
  try {
    const dbRes = await query(
      `SELECT valor FROM configuraciones_sistema WHERE clave = 'materiales_categorias_imagenes' LIMIT 1`
    );
    let categorias = DEFAULT_CATEGORIAS_IMAGENES;
    if (dbRes.rows.length > 0 && dbRes.rows[0].valor) {
      const parsed = typeof dbRes.rows[0].valor === 'string' ? JSON.parse(dbRes.rows[0].valor) : dbRes.rows[0].valor;
      categorias = { ...DEFAULT_CATEGORIAS_IMAGENES, ...parsed };
    }

    res.json({ success: true, categorias });
  } catch (error: any) {
    console.error('Error al obtener imágenes de categorías de materiales:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* Actualiza la imagen asociada a una categoría de material */
router.put('/categorias-imagenes', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tipo, url_imagen } = req.body;
    if (!tipo || !TIPOS_VALIDOS.includes(tipo) || !url_imagen) {
      res.status(400).json({
        success: false,
        error: 'Se requiere un tipo válido de material y la url_imagen relativa.',
      });
      return;
    }

    const currentRes = await query(
      `SELECT valor FROM configuraciones_sistema WHERE clave = 'materiales_categorias_imagenes' LIMIT 1`
    );
    let categorias = { ...DEFAULT_CATEGORIAS_IMAGENES };
    if (currentRes.rows.length > 0 && currentRes.rows[0].valor) {
      const parsed = typeof currentRes.rows[0].valor === 'string' ? JSON.parse(currentRes.rows[0].valor) : currentRes.rows[0].valor;
      categorias = { ...categorias, ...parsed };
    }

    categorias[tipo] = String(url_imagen).trim();

    await query(
      `INSERT INTO configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en)
       VALUES ('materiales_categorias_imagenes', $1, 'Asociación de imágenes y banners representativos por categoría de material', 'MATERIALES', NOW())
       ON CONFLICT (clave) DO UPDATE
       SET valor = $1, actualizado_en = NOW()`,
      [JSON.stringify(categorias)]
    );

    res.json({
      success: true,
      mensaje: `Imagen de la categoría "${tipo}" actualizada con éxito.`,
      categorias,
    });
  } catch (error: any) {
    console.error('Error al actualizar imagen de categoría de materiales:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
