
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

// Inicializa las columnas extendidas y semillas iniciales si la tabla está vacía
async function asegurarMaterialesIniciales(): Promise<void> {
  try {
    await query(`
      ALTER TABLE materiales 
      ADD COLUMN IF NOT EXISTS contenido_detalle TEXT,
      ADD COLUMN IF NOT EXISTS enlaces_externos JSONB DEFAULT '[]'::jsonb
    `);

    const countRes = await query('SELECT COUNT(*) FROM materiales');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      const eventoRes = await query(`SELECT id FROM eventos WHERE codigo = 'ETS_2026' OR activo = TRUE ORDER BY (codigo = 'ETS_2026') DESC LIMIT 1`);
      if (eventoRes.rows.length > 0) {
        const eventoId = eventoRes.rows[0].id;
        const initialSeeds = [
          {
            type: 'novedad',
            date: '2026-09-11',
            title: 'Novedades del Congreso ETS 2026',
            description: 'En este espacio se publicarán las novedades relacionadas con el Congreso de Educación Técnica Superior.',
            contenidoDetalle: 'El Congreso de Educación Técnica Superior 2026 reunirá a directivos, docentes, especialistas y estudiantes para compartir innovaciones pedagógicas, prácticas profesionalizantes y modelos de enseñanza aplicados en el ámbito técnico superior.',
            image: '/assets/icons/card1.svg',
            publicado: true,
          },
          {
            type: 'documento',
            date: '2026-09-10',
            title: 'Documento general de participación',
            description: 'Información orientativa para participar del 1er Congreso de Educación Técnica Superior.',
            contenidoDetalle: 'Descargá el documento institucional orientativo con las bases y condiciones, lineamientos pedagógicos y pautas de participación para instituciones, equipos de cátedra y estudiantes del sistema técnico superior.',
            fileUrl: '/PDF/1 Aula Abierta - demostraciones aplicadas.pdf',
            image: '/assets/icons/card2.svg',
            publicado: true,
          },
          {
            type: 'video',
            date: '2026-09-09',
            title: 'Conocé el Congreso ETS 2026',
            description: 'Contenido audiovisual institucional relacionado con el Congreso.',
            contenidoDetalle: 'Video de presentación y recorrido sobre los ejes temáticos, los dispositivos de muestra permanente y las actividades académicas proyectadas para la jornada.',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            image: '/assets/icons/card3.svg',
            publicado: true,
          },
          {
            type: 'flyer',
            date: '2026-09-08',
            title: 'Flyer oficial del Congreso',
            description: 'Pieza gráfica institucional del Congreso de Educación Técnica Superior.',
            contenidoDetalle: 'Pieza gráfica y afiche institucional para difusión en carteleras institucionales, portales educativos y comunidades académicas.',
            image: '/assets/icons/card4.svg',
            publicado: true,
          },
          {
            type: 'foto',
            date: '2026-09-07',
            title: 'Fotografías del Congreso',
            description: 'Registro fotográfico de las actividades del Congreso de Educación Técnica Superior.',
            contenidoDetalle: 'Colección de imágenes del espacio de exposición, auditorios y stands tecnológicos preparados para el desarrollo del Congreso.',
            image: '/assets/icons/card5.svg',
            images: ['/assets/icons/card1.svg', '/assets/icons/card2.svg', '/assets/icons/card3.svg'],
            publicado: true,
          },
          {
            type: 'recurso',
            date: '2026-09-06',
            title: 'Recursos para participantes',
            description: 'Materiales y recursos vinculados con el programa y los dispositivos de participación.',
            contenidoDetalle: 'Repositorio de recursos, plantillas descargables y enlaces útiles para los participantes acreditados.',
            image: '/assets/icons/card1.svg',
            enlacesExternos: [
              { id: 'enlace-1', titulo: 'Portal de la Dirección de Educación Técnica Superior', url: 'https://buenosaires.gob.ar/educacion' },
              { id: 'enlace-2', titulo: 'Programa y Cronograma Oficial', url: '/#actividades' },
            ],
            publicado: true,
          },
        ];

        for (const s of initialSeeds) {
          await query(
            `INSERT INTO materiales (evento_id, tipo, titulo, descripcion, fecha_publicacion, url_imagen, url_archivo, url_video, imagenes, contenido_detalle, enlaces_externos, publicado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11::jsonb, $12)`,
            [
              eventoId, s.type, s.title, s.description, s.date,
              s.image || null, s.fileUrl || null, s.videoUrl || null,
              JSON.stringify(s.images || []), s.contenidoDetalle || null,
              JSON.stringify(s.enlacesExternos || []), s.publicado,
            ]
          );
        }
      }
    }
  } catch (err) {
    console.error('Error asegurando materiales iniciales:', err);
  }
}

// Ejecutar siembra inicial
asegurarMaterialesIniciales();

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
              COALESCE(contenido_detalle, '') AS "contenidoDetalle",
              COALESCE(enlaces_externos, '[]'::jsonb) AS "enlacesExternos",
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
              COALESCE(contenido_detalle, '') AS "contenidoDetalle",
              COALESCE(enlaces_externos, '[]'::jsonb) AS "enlacesExternos",
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
      date, image, fileUrl, videoUrl, images,
      contenidoDetalle, contenido_detalle,
      enlacesExternos, enlaces_externos,
      publicado
    } = req.body;

    let targetEventoId = obtenerEventoId(evento_id);
    if (!targetEventoId) {
      const defEvento = await query(`SELECT id FROM eventos WHERE codigo = 'ETS_2026' OR activo = TRUE ORDER BY (codigo = 'ETS_2026') DESC LIMIT 1`);
      if (defEvento.rows.length > 0) targetEventoId = defEvento.rows[0].id;
    }

    if (!targetEventoId || !TIPOS_VALIDOS.includes(type) || !title?.trim()) {
      res.status(400).json({
        success: false,
        error: 'El evento, el tipo y el título son obligatorios.'
      });
      return;
    }

    const detalleText = (contenidoDetalle !== undefined ? contenidoDetalle : contenido_detalle) || null;
    const enlacesJson = JSON.stringify(Array.isArray(enlacesExternos) ? enlacesExternos : (Array.isArray(enlaces_externos) ? enlaces_externos : []));

    const result = await query(
      `INSERT INTO materiales
        (evento_id, tipo, titulo, descripcion, fecha_publicacion,
         url_imagen, url_archivo, url_video, imagenes, contenido_detalle, enlaces_externos, publicado)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE),
               $6, $7, $8, $9::jsonb, $10, $11::jsonb, $12)
       RETURNING id`,
      [
        targetEventoId, type, title.trim(), description || null,
        date || null, image || null, fileUrl || null, videoUrl || null,
        JSON.stringify(Array.isArray(images) ? images : []),
        detalleText, enlacesJson,
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

/* Actualiza un material existente (completo) */
router.put('/:id', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = obtenerEventoId(req.params.id);
    const {
      evento_id, type, title, description,
      date, image, fileUrl, videoUrl, images,
      contenidoDetalle, contenido_detalle,
      enlacesExternos, enlaces_externos,
      publicado
    } = req.body;

    let targetEventoId = obtenerEventoId(evento_id);
    if (!targetEventoId) {
      const defEvento = await query(`SELECT id FROM eventos WHERE codigo = 'ETS_2026' OR activo = TRUE ORDER BY (codigo = 'ETS_2026') DESC LIMIT 1`);
      if (defEvento.rows.length > 0) targetEventoId = defEvento.rows[0].id;
    }

    if (!id || !targetEventoId || !TIPOS_VALIDOS.includes(type) || !title?.trim()) {
      res.status(400).json({ success: false, error: 'Los datos del material son inválidos.' });
      return;
    }

    const detalleText = (contenidoDetalle !== undefined ? contenidoDetalle : contenido_detalle) || null;
    const enlacesJson = JSON.stringify(Array.isArray(enlacesExternos) ? enlacesExternos : (Array.isArray(enlaces_externos) ? enlaces_externos : []));

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
           contenido_detalle = $10,
           enlaces_externos = $11::jsonb,
           publicado = $12,
           actualizado_en = NOW()
       WHERE id = $13
       RETURNING id`,
      [
        targetEventoId, type, title.trim(), description || null,
        date || null, image || null, fileUrl || null, videoUrl || null,
        JSON.stringify(Array.isArray(images) ? images : []),
        detalleText, enlacesJson,
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

/**
 * PUT /api/materiales/:id/tarjeta
 * CRUD Nivel 1: Actualiza exclusivamente los campos de la tarjeta con su imagen
 */
router.put('/:id/tarjeta', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = obtenerEventoId(req.params.id);
    const { type, title, description, date, image, publicado } = req.body;

    if (!id || !title?.trim() || !TIPOS_VALIDOS.includes(type)) {
      res.status(400).json({ success: false, error: 'ID, tipo y título son requeridos para la tarjeta.' });
      return;
    }

    const result = await query(
      `UPDATE materiales
       SET tipo = $1,
           titulo = $2,
           descripcion = $3,
           fecha_publicacion = COALESCE($4::date, CURRENT_DATE),
           url_imagen = $5,
           publicado = COALESCE($6, publicado),
           actualizado_en = NOW()
       WHERE id = $7
       RETURNING id, tipo AS type, titulo AS title, descripcion AS description,
                 TO_CHAR(fecha_publicacion, 'YYYY-MM-DD') AS date,
                 url_imagen AS image, publicado`,
      [type, title.trim(), description || null, date || null, image || null, publicado, id]
    );

    if (!result.rows.length) {
      res.status(404).json({ success: false, error: 'Material no encontrado.' });
      return;
    }

    res.json({ success: true, message: 'Tarjeta de material actualizada correctamente.', material: result.rows[0] });
  } catch (error: any) {
    console.error('Error en PUT /:id/tarjeta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/materiales/:id/contenido
 * CRUD Nivel 2: Actualiza exclusivamente el contenido que se despliega al presionar el botón "Ver"
 */
router.put('/:id/contenido', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = obtenerEventoId(req.params.id);
    const { contenidoDetalle, fileUrl, videoUrl, images, enlacesExternos } = req.body;

    if (!id) {
      res.status(400).json({ success: false, error: 'Identificador de material inválido.' });
      return;
    }

    const imagesJson = JSON.stringify(Array.isArray(images) ? images : []);
    const enlacesJson = JSON.stringify(Array.isArray(enlacesExternos) ? enlacesExternos : []);

    const result = await query(
      `UPDATE materiales
       SET contenido_detalle = $1,
           url_archivo = $2,
           url_video = $3,
           imagenes = $4::jsonb,
           enlaces_externos = $5::jsonb,
           actualizado_en = NOW()
       WHERE id = $6
       RETURNING id, contenido_detalle AS "contenidoDetalle",
                 url_archivo AS "fileUrl", url_video AS "videoUrl",
                 imagenes AS images, enlaces_externos AS "enlacesExternos"`,
      [contenidoDetalle || null, fileUrl || null, videoUrl || null, imagesJson, enlacesJson, id]
    );

    if (!result.rows.length) {
      res.status(404).json({ success: false, error: 'Material no encontrado.' });
      return;
    }

    res.json({ success: true, message: 'Contenido del botón "Ver" actualizado correctamente.', contenido: result.rows[0] });
  } catch (error: any) {
    console.error('Error en PUT /:id/contenido:', error);
    res.status(500).json({ success: false, error: error.message });
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
