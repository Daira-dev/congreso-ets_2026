import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { query } from '../../lib/db';
import { AuthenticatedRequest, requireHierarchy } from '../../middlewares/authMiddleware';

export interface FrontendCard {
  id: number | string;
  title: string;
  description: string;
  image: string;
  builtinKey?: string;
  pdfUrl?: string;
  badge?: string;
  colorAccent?: string;
  activo: boolean;
  orden: number;
}

export interface FrontendHeroConfig {
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundOverlayOpacity: number;
  logoUrl: string | null;
  subtitle: string;
  title: string;
  address: string;
  ctaButtonText: string;
  ctaButtonUrl: string;
  mostrarLogo: boolean;
  mostrarMiscelaneas: boolean;
  mostrarBotonCta: boolean;
  fontSizeTitle?: number;
  fontSizeSubtitle?: number;
  colorTitle?: string;
  colorSubtitle?: string;
  colorAddress?: string;
  customCss?: string;
  elements?: {
    id: string;
    type: 'text' | 'image' | 'badge' | 'button';
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    styles?: Record<string, any>;
  }[];
}

export const DEFAULT_HERO_CONFIG: FrontendHeroConfig = {
  backgroundColor: '#1D3343',
  backgroundImage: '/assets/IFTS_27/hero/Imagen del header.jpg',
  backgroundOverlayOpacity: 0.6,
  logoUrl: '/assets/IFTS_27/hero/Logo en blanco.svg',
  subtitle: '1° Congreso',
  title: 'Educación Técnica Superior',
  address: 'Universidad de la Ciudad de Buenos Aires · Tte. Gral. Juan Domingo Perón 802, CABA.',
  ctaButtonText: 'INSCRIBITE',
  ctaButtonUrl: '/login',
  mostrarLogo: true,
  mostrarMiscelaneas: true,
  mostrarBotonCta: true,
  fontSizeTitle: 48,
  fontSizeSubtitle: 24,
  colorTitle: '#ffffff',
  colorSubtitle: '#ffffff',
  colorAddress: '#ffffff',
  elements: [],
};

export interface SeccionVisibilidad {
  key: string;
  nombre: string;
  descripcion: string;
  enabled: boolean;
}

export const DEFAULT_SECCIONES_VISIBILIDAD: SeccionVisibilidad[] = [
  { key: 'hero', nombre: 'Sección Hero', descripcion: 'Cabecera de bienvenida con logotipo, títulos y llamada a la acción', enabled: true },
  { key: 'avisos', nombre: 'Avisos en Vivo (Push)', descripcion: 'Barra interactiva de notificaciones y suscripción web push', enabled: true },
  { key: 'sobre_congreso', nombre: 'El Congreso & Carrusel', descripcion: 'Presentación institucional y carrusel multimedia interactivo', enabled: true },
  { key: 'modalidades', nombre: 'Actividades & Modalidades', descripcion: 'Tarjetas de modalidades formativas (Aula abierta, stands, etc.)', enabled: true },
  { key: 'programa', nombre: 'Programa del Congreso', descripcion: 'Cronograma interactivo de ponencias, horarios y filtros de salas', enabled: true },
  { key: 'experiencia', nombre: 'Experiencia & Ubicación', descripcion: 'Spot audiovisual en video y mapa de la sede Polo Saavedra', enabled: true },
];

export interface CarouselSlide {
  id: string;
  tipo: 'imagen' | 'video';
  url: string;
  titulo?: string;
  descripcion?: string;
  duracion_ms: number;
  orden: number;
  es_default: boolean;
  activo: boolean;
}

export const DEFAULT_CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: 'slide-1',
    tipo: 'imagen',
    url: '/assets/IFTS_27/hero/Imagen del header.jpg',
    titulo: 'Auditorio Central Saavedra',
    descripcion: 'Espacio principal de conferencias y aperturas magistrales',
    duracion_ms: 5000,
    orden: 1,
    es_default: true,
    activo: true,
  },
  {
    id: 'slide-2',
    tipo: 'video',
    url: 'https://www.youtube.com/embed/fFaAyN6sBus?autoplay=1&mute=1&loop=1',
    titulo: 'Spot Oficial Buenos Aires 2030',
    descripcion: 'Experiencias de innovación formativa técnica superior',
    duracion_ms: 8000,
    orden: 2,
    es_default: false,
    activo: true,
  },
  {
    id: 'slide-3',
    tipo: 'imagen',
    url: '/assets/6. MAILING/Header.png',
    titulo: 'Comunidad Educativa Técnica',
    descripcion: 'Institutos de Formación Técnica Superior trabajando en red',
    duracion_ms: 6000,
    orden: 3,
    es_default: false,
    activo: true,
  },
];

export const DEFAULT_FRONTEND_CARDS: FrontendCard[] = [
  {
    id: 1,
    image: '/assets/icons/card1.svg',
    builtinKey: 'card1',
    title: 'Aula Abierta',
    description:
      'Instancias programadas para mostrar el saber hacer técnico-profesional en acción. Permiten presentar procedimientos, prácticas, simulaciones, intervenciones, uso de herramientas, resolución de problemas o secuencias de trabajo que necesitan ser observadas de manera dinámica y contextualizada.',
    pdfUrl: '/PDF/1 Aula Abierta - demostraciones aplicadas.pdf',
    badge: 'Demostración Práctica',
    activo: true,
    orden: 1,
  },
  {
    id: 2,
    image: '/assets/icons/card2.svg',
    builtinKey: 'card2',
    title: 'Muestra permanente / Stands',
    description:
      'Espacio institucional de muestra permanente destinado a exhibir experiencias, proyectos, producciones y evidencias formativas. El foco no está solamente en el resultado final, sino también en el proceso, las decisiones técnicas, la participación estudiantil y los aprendizajes construidos.',
    pdfUrl: '/PDF/2 Muestra permanente - Stands.pdf',
    badge: 'Exhibición Permanente',
    activo: true,
    orden: 2,
  },
  {
    id: 3,
    image: '/assets/icons/card3.svg',
    builtinKey: 'card3',
    title: 'Presentaciones académico - aplicadas',
    description:
      'Espacios para explicar, analizar y sistematizar experiencias reales vinculadas con la Educación Técnica Superior. Pueden incluir experiencias de enseñanza, prácticas profesionalizantes, investigaciones situadas, sistematizaciones, análisis de casos y modelos de gestión o enseñanza, siempre vinculados con procesos institucionales concretos.',
    pdfUrl: '/PDF/3 Presentaciones académico-aplicadas.pdf',
    badge: 'Académico',
    activo: true,
    orden: 3,
  },
  {
    id: 4,
    image: '/assets/icons/card4.svg',
    builtinKey: 'card4',
    title: 'Proyectos y producciones de estudiantes',
    description:
      'Espacio de presentación de proyectos, producciones y desarrollos realizados por estudiantes en el marco de sus trayectorias formativas. Las presentaciones deberán permitir comprender el problema abordado, el proceso de trabajo, las decisiones tomadas, las evidencias producidas y los aprendizajes construidos, con acompañamiento institucional.',
    pdfUrl: '/PDF/4 Proyectos y producciones estudiantiles.pdf',
    badge: 'Estudiantil',
    activo: true,
    orden: 4,
  },
  {
    id: 5,
    image: '/assets/icons/card5.svg',
    builtinKey: 'card5',
    title: 'Talentos ETS',
    description:
      'Dispositivo de presentación breve de proyectos aplicados con preguntas y devolución formativa de un panel. Su finalidad es enriquecer los proyectos y fortalecer capacidades de comunicación, argumentación y mejora. No constituye una competencia: no hay ranking, ganadores, premiación, reclutamiento ni promesas de oportunidades posteriores.',
    pdfUrl: '/PDF/5 Talentos ETS.pdf',
    badge: 'Pitch / Panel',
    activo: true,
    orden: 5,
  },
];

/**
 * Obtiene las tarjetas de la base de datos o retorna las predeterminadas oficiales
 */
export async function getFrontendCardsFromDb(): Promise<FrontendCard[]> {
  try {
    const res = await query(
      `SELECT valor FROM configuraciones_sistema WHERE clave = 'frontend_cards_cms' LIMIT 1`
    );
    if (res.rows.length > 0 && res.rows[0].valor) {
      const parsed = typeof res.rows[0].valor === 'string' ? JSON.parse(res.rows[0].valor) : res.rows[0].valor;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error leyendo frontend_cards_cms:', err);
  }
  return DEFAULT_FRONTEND_CARDS;
}

/**
 * Obtiene la configuración del Hero desde la base de datos o valores predeterminados
 */
export async function getHeroConfigFromDb(): Promise<FrontendHeroConfig> {
  try {
    const res = await query(
      `SELECT valor FROM configuraciones_sistema WHERE clave = 'frontend_hero_cms' LIMIT 1`
    );
    if (res.rows.length > 0 && res.rows[0].valor) {
      const parsed = typeof res.rows[0].valor === 'string' ? JSON.parse(res.rows[0].valor) : res.rows[0].valor;
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_HERO_CONFIG, ...parsed };
      }
    }
  } catch (err) {
    console.error('Error leyendo frontend_hero_cms:', err);
  }
  return DEFAULT_HERO_CONFIG;
}

/**
 * Obtiene el estado de visibilidad de las secciones intermedias
 */
export async function getSeccionesVisibilidadFromDb(): Promise<SeccionVisibilidad[]> {
  try {
    const res = await query(
      `SELECT valor FROM configuraciones_sistema WHERE clave = 'frontend_secciones_visibilidad' LIMIT 1`
    );
    if (res.rows.length > 0 && res.rows[0].valor) {
      const parsed = typeof res.rows[0].valor === 'string' ? JSON.parse(res.rows[0].valor) : res.rows[0].valor;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error leyendo frontend_secciones_visibilidad:', err);
  }
  return DEFAULT_SECCIONES_VISIBILIDAD;
}

/**
 * Obtiene las diapositivas del carrusel multimedia
 */
export async function getCarouselSlidesFromDb(): Promise<CarouselSlide[]> {
  try {
    const res = await query(
      `SELECT valor FROM configuraciones_sistema WHERE clave = 'frontend_carousel_cms' LIMIT 1`
    );
    if (res.rows.length > 0 && res.rows[0].valor) {
      const parsed = typeof res.rows[0].valor === 'string' ? JSON.parse(res.rows[0].valor) : res.rows[0].valor;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error leyendo frontend_carousel_cms:', err);
  }
  return DEFAULT_CAROUSEL_SLIDES;
}

const router = Router();

/**
 * GET /api/admin/frontend-cms/cards
 * Listado completo de tarjetas para el editor CMS del Panel de Administración
 */
router.get('/cards', requireHierarchy(3), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const cards = await getFrontendCardsFromDb();
    res.json({
      ok: true,
      cards: cards.sort((a, b) => (a.orden || 0) - (b.orden || 0)),
      total: cards.length,
      defaultCardsAvailable: DEFAULT_FRONTEND_CARDS.length,
    });
  } catch (error: any) {
    console.error('Error en GET /api/admin/frontend-cms/cards:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * PUT /api/admin/frontend-cms/cards
 * Guarda o actualiza la totalidad de las tarjetas en la base de datos central PostgreSQL
 */
router.put('/cards', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { cards } = req.body;
    if (!Array.isArray(cards)) {
      res.status(400).json({ ok: false, error: 'ERR_VALIDATION', message: 'Se espera un array de tarjetas en cards.' });
      return;
    }

    // Normalizar orden y campos con validación booleana estricta de activo
    const sanitizedCards: FrontendCard[] = cards.map((c, index) => {
      const esInactivo =
        (c as any).activo === false ||
        (c as any).activo === 'false' ||
        (c as any).activo === 0 ||
        (c as any).activo === '0' ||
        (c as any).visible === false ||
        (c as any).visible === 'false' ||
        (c as any).estado === 'oculto' ||
        (c as any).estado === 'inactivo';

      return {
        id: c.id || index + 1,
        title: String(c.title || '').trim(),
        description: String(c.description || '').trim(),
        image: String(c.image || '/assets/icons/card1.svg').trim(),
        builtinKey: c.builtinKey || undefined,
        pdfUrl: c.pdfUrl ? String(c.pdfUrl).trim() : '',
        badge: c.badge ? String(c.badge).trim() : '',
        colorAccent: c.colorAccent || '#1D3343',
        activo: !esInactivo,
        orden: typeof c.orden === 'number' ? c.orden : index + 1,
      };
    });

    await query(
      `INSERT INTO configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en)
       VALUES ('frontend_cards_cms', $1, 'Configuración y contenido dinámico de las tarjetas del portal público (CMS Frontend)', 'FRONTEND', NOW())
       ON CONFLICT (clave) DO UPDATE
       SET valor = $1, actualizado_en = NOW()`,
      [JSON.stringify(sanitizedCards)]
    );

    // Registro en auditoría
    await query(
      `INSERT INTO logs_auditoria (tabla_afectada, accion, usuario_responsable, datos_nuevos)
       VALUES ('configuraciones_sistema', 'FRONTEND_CARDS_CMS_UPDATE', $1, $2)`,
      [req.operator?.email || 'ADMIN', JSON.stringify({ total: sanitizedCards.length })]
    ).catch(() => {});

    res.json({
      ok: true,
      mensaje: 'Tarjetas del frontend actualizadas correctamente en la base de datos.',
      cards: sanitizedCards.sort((a, b) => a.orden - b.orden),
    });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/frontend-cms/cards:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * POST /api/admin/frontend-cms/cards/reset
 * Restablece las tarjetas a los valores oficiales predeterminados del congreso
 */
router.post('/cards/reset', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await query(
      `INSERT INTO configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en)
       VALUES ('frontend_cards_cms', $1, 'Configuración y contenido dinámico de las tarjetas del portal público (CMS Frontend)', 'FRONTEND', NOW())
       ON CONFLICT (clave) DO UPDATE
       SET valor = $1, actualizado_en = NOW()`,
      [JSON.stringify(DEFAULT_FRONTEND_CARDS)]
    );

    await query(
      `INSERT INTO logs_auditoria (tabla_afectada, accion, usuario_responsable, datos_nuevos)
       VALUES ('configuraciones_sistema', 'FRONTEND_CARDS_CMS_RESET', $1, $2)`,
      [req.operator?.email || 'ADMIN', JSON.stringify({ reset: true })]
    ).catch(() => {});

    res.json({
      ok: true,
      mensaje: 'Tarjetas restablecidas exitosamente a los valores oficiales predeterminados.',
      cards: DEFAULT_FRONTEND_CARDS,
    });
  } catch (error: any) {
    console.error('Error en POST /api/admin/frontend-cms/cards/reset:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * POST /api/admin/frontend-cms/upload
 * Permite subir un ícono, imagen o PDF directamente para las tarjetas
 */
router.post('/upload', requireHierarchy(3), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { filename, fileBase64 } = req.body;
    if (!filename || !fileBase64) {
      res.status(400).json({ ok: false, error: 'ERR_VALIDATION', message: 'Se requiere filename y fileBase64.' });
      return;
    }

    // Limpieza del nombre de archivo
    const ext = path.extname(filename).toLowerCase();
    const allowedExts = ['.svg', '.png', '.jpg', '.jpeg', '.webp', '.pdf'];
    if (!allowedExts.includes(ext)) {
      res.status(400).json({
        ok: false,
        error: 'ERR_INVALID_FILE_TYPE',
        message: `Extensión no permitida. Formatos válidos: ${allowedExts.join(', ')}`,
      });
      return;
    }

    // Extraer base64 puro
    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Directorio de destino: frontend/public/uploads/
    const uploadsDir = path.resolve(__dirname, '../../../../frontend/public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanBaseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFilename = `${cleanBaseName}_${Date.now()}${ext}`;
    const targetFilePath = path.join(uploadsDir, finalFilename);

    await fs.promises.writeFile(targetFilePath, buffer);

    const publicUrl = `/uploads/${finalFilename}`;
    res.json({
      ok: true,
      mensaje: 'Archivo subido exitosamente.',
      url: publicUrl,
      filename: finalFilename,
      sizeBytes: buffer.length,
    });
  } catch (error: any) {
    console.error('Error en POST /api/admin/frontend-cms/upload:', error);
    res.status(500).json({ ok: false, error: 'ERR_UPLOAD', message: error.message });
  }
});

/**
 * GET /api/admin/frontend-cms/hero
 * Retorna la configuración completa del Hero para el editor WYSIWYG
 */
router.get('/hero', requireHierarchy(3), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hero = await getHeroConfigFromDb();
    res.json({ ok: true, hero });
  } catch (error: any) {
    console.error('Error en GET /api/admin/frontend-cms/hero:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * PUT /api/admin/frontend-cms/hero
 * Guarda la configuración del Hero desde el editor WYSIWYG
 */
router.put('/hero', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { hero } = req.body;
    if (!hero || typeof hero !== 'object') {
      res.status(400).json({ ok: false, error: 'ERR_VALIDATION', message: 'Se espera un objeto de configuración en hero.' });
      return;
    }

    const sanitizedHero: FrontendHeroConfig = {
      backgroundColor: String(hero.backgroundColor || '#1D3343'),
      backgroundImage: hero.backgroundImage ? String(hero.backgroundImage).trim() : null,
      backgroundOverlayOpacity: typeof hero.backgroundOverlayOpacity === 'number' ? hero.backgroundOverlayOpacity : 0.6,
      logoUrl: hero.logoUrl ? String(hero.logoUrl).trim() : null,
      subtitle: String(hero.subtitle || '1° Congreso').trim(),
      title: String(hero.title || 'Educación Técnica Superior').trim(),
      address: String(hero.address || '').trim(),
      ctaButtonText: String(hero.ctaButtonText || 'INSCRIBITE').trim(),
      ctaButtonUrl: String(hero.ctaButtonUrl || '/login').trim(),
      mostrarLogo: hero.mostrarLogo !== false,
      mostrarMiscelaneas: hero.mostrarMiscelaneas !== false,
      mostrarBotonCta: hero.mostrarBotonCta !== false,
      fontSizeTitle: Number(hero.fontSizeTitle) || 48,
      fontSizeSubtitle: Number(hero.fontSizeSubtitle) || 24,
      colorTitle: String(hero.colorTitle || '#ffffff'),
      colorSubtitle: String(hero.colorSubtitle || '#ffffff'),
      colorAddress: String(hero.colorAddress || '#ffffff'),
      customCss: hero.customCss ? String(hero.customCss) : '',
      elements: Array.isArray(hero.elements) ? hero.elements : [],
    };

    await query(
      `INSERT INTO configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en)
       VALUES ('frontend_hero_cms', $1, 'Configuración WYSIWYG y contenido dinámico del Hero principal', 'FRONTEND', NOW())
       ON CONFLICT (clave) DO UPDATE
       SET valor = $1, actualizado_en = NOW()`,
      [JSON.stringify(sanitizedHero)]
    );

    await query(
      `INSERT INTO logs_auditoria (tabla_afectada, accion, usuario_responsable, datos_nuevos)
       VALUES ('configuraciones_sistema', 'FRONTEND_HERO_CMS_UPDATE', $1, $2)`,
      [req.operator?.email || 'ADMIN', JSON.stringify({ title: sanitizedHero.title })]
    ).catch(() => {});

    res.json({
      ok: true,
      mensaje: 'Configuración del Hero guardada exitosamente.',
      hero: sanitizedHero,
    });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/frontend-cms/hero:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * POST /api/admin/frontend-cms/hero/reset
 * Restablece los valores del Hero a los predeterminados oficiales
 */
router.post('/hero/reset', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await query(
      `INSERT INTO configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en)
       VALUES ('frontend_hero_cms', $1, 'Configuración WYSIWYG y contenido dinámico del Hero principal', 'FRONTEND', NOW())
       ON CONFLICT (clave) DO UPDATE
       SET valor = $1, actualizado_en = NOW()`,
      [JSON.stringify(DEFAULT_HERO_CONFIG)]
    );

    await query(
      `INSERT INTO logs_auditoria (tabla_afectada, accion, usuario_responsable, datos_nuevos)
       VALUES ('configuraciones_sistema', 'FRONTEND_HERO_CMS_RESET', $1, $2)`,
      [req.operator?.email || 'ADMIN', JSON.stringify({ reset: true })]
    ).catch(() => {});

    res.json({
      ok: true,
      mensaje: 'Hero restablecido exitosamente a los valores oficiales predeterminados.',
      hero: DEFAULT_HERO_CONFIG,
    });
  } catch (error: any) {
    console.error('Error en POST /api/admin/frontend-cms/hero/reset:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * GET /api/admin/frontend-cms/secciones
 * Retorna el estado de visibilidad de las secciones intermedias del portal
 */
router.get('/secciones', requireHierarchy(3), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const secciones = await getSeccionesVisibilidadFromDb();
    res.json({ ok: true, secciones });
  } catch (error: any) {
    console.error('Error en GET /api/admin/frontend-cms/secciones:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * PUT /api/admin/frontend-cms/secciones
 * Actualiza la visibilidad dinámica de las secciones intermedias
 */
router.put('/secciones', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { secciones } = req.body;
    if (!Array.isArray(secciones)) {
      res.status(400).json({ ok: false, error: 'ERR_VALIDATION', message: 'Se espera un array en secciones.' });
      return;
    }

    const sanitizedSecciones: SeccionVisibilidad[] = DEFAULT_SECCIONES_VISIBILIDAD.map((defSec) => {
      const incoming = secciones.find((s: any) => s.key === defSec.key);
      return {
        key: defSec.key,
        nombre: defSec.nombre,
        descripcion: defSec.descripcion,
        enabled: incoming ? incoming.enabled !== false : defSec.enabled,
      };
    });

    await query(
      `INSERT INTO configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en)
       VALUES ('frontend_secciones_visibilidad', $1, 'Visibilidad dinámica de secciones intermedias del portal público', 'FRONTEND', NOW())
       ON CONFLICT (clave) DO UPDATE
       SET valor = $1, actualizado_en = NOW()`,
      [JSON.stringify(sanitizedSecciones)]
    );

    await query(
      `INSERT INTO logs_auditoria (tabla_afectada, accion, usuario_responsable, datos_nuevos)
       VALUES ('configuraciones_sistema', 'FRONTEND_SECCIONES_UPDATE', $1, $2)`,
      [req.operator?.email || 'ADMIN', JSON.stringify(sanitizedSecciones)]
    ).catch(() => {});

    res.json({
      ok: true,
      mensaje: 'Visibilidad de secciones actualizada correctamente.',
      secciones: sanitizedSecciones,
    });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/frontend-cms/secciones:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * GET /api/admin/frontend-cms/carousel
 * Retorna todos los slides del carrusel con sus temporizadores y estados
 */
router.get('/carousel', requireHierarchy(3), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const slides = await getCarouselSlidesFromDb();
    res.json({
      ok: true,
      slides: slides.sort((a, b) => a.orden - b.orden),
      total: slides.length,
    });
  } catch (error: any) {
    console.error('Error en GET /api/admin/frontend-cms/carousel:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * POST /api/admin/frontend-cms/carousel
 * Crea un nuevo slide en el carrusel multimedia
 */
router.post('/carousel', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tipo, url, titulo, descripcion, duracion_ms, es_default, activo } = req.body;
    if (!url || !tipo || !['imagen', 'video'].includes(tipo)) {
      res.status(400).json({
        ok: false,
        error: 'ERR_VALIDATION',
        message: 'Se requiere url válida y tipo ("imagen" | "video").',
      });
      return;
    }

    const currentSlides = await getCarouselSlidesFromDb();
    const newSlideId = `slide-${Date.now()}`;
    const isDefault = Boolean(es_default) || currentSlides.length === 0;

    const newSlide: CarouselSlide = {
      id: newSlideId,
      tipo,
      url: String(url).trim(),
      titulo: titulo ? String(titulo).trim() : '',
      descripcion: descripcion ? String(descripcion).trim() : '',
      duracion_ms: Number(duracion_ms) > 0 ? Number(duracion_ms) : 5000,
      orden: currentSlides.length + 1,
      es_default: isDefault,
      activo: activo !== false,
    };

    let updatedSlides = currentSlides.map((s) => (isDefault ? { ...s, es_default: false } : s));
    updatedSlides.push(newSlide);

    await query(
      `INSERT INTO configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en)
       VALUES ('frontend_carousel_cms', $1, 'Slides multimedia dinámicos del carrusel del portal', 'FRONTEND', NOW())
       ON CONFLICT (clave) DO UPDATE
       SET valor = $1, actualizado_en = NOW()`,
      [JSON.stringify(updatedSlides)]
    );

    res.status(201).json({
      ok: true,
      mensaje: 'Slide agregado exitosamente.',
      slide: newSlide,
      slides: updatedSlides.sort((a, b) => a.orden - b.orden),
    });
  } catch (error: any) {
    console.error('Error en POST /api/admin/frontend-cms/carousel:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * PUT /api/admin/frontend-cms/carousel/reorder
 * Reordena los slides del carrusel
 */
router.put('/carousel/reorder', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { slideIds } = req.body;
    if (!Array.isArray(slideIds)) {
      res.status(400).json({ ok: false, error: 'ERR_VALIDATION', message: 'Se requiere un array slideIds.' });
      return;
    }

    const currentSlides = await getCarouselSlidesFromDb();
    const slideMap = new Map(currentSlides.map((s) => [s.id, s]));

    const reordered: CarouselSlide[] = [];
    slideIds.forEach((id: string, idx: number) => {
      const slide = slideMap.get(id);
      if (slide) {
        reordered.push({ ...slide, orden: idx + 1 });
        slideMap.delete(id);
      }
    });

    slideMap.forEach((slide) => {
      reordered.push({ ...slide, orden: reordered.length + 1 });
    });

    await query(
      `INSERT INTO configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en)
       VALUES ('frontend_carousel_cms', $1, 'Slides multimedia dinámicos del carrusel del portal', 'FRONTEND', NOW())
       ON CONFLICT (clave) DO UPDATE
       SET valor = $1, actualizado_en = NOW()`,
      [JSON.stringify(reordered)]
    );

    res.json({
      ok: true,
      mensaje: 'Orden de slides actualizado con éxito.',
      slides: reordered.sort((a, b) => a.orden - b.orden),
    });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/frontend-cms/carousel/reorder:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * PUT /api/admin/frontend-cms/carousel/:id
 * Modifica un slide específico del carrusel (duración, medio, texto, default)
 */
router.put('/carousel/:id', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const slideId = req.params.id;
    const { tipo, url, titulo, descripcion, duracion_ms, es_default, activo, orden } = req.body;

    const currentSlides = await getCarouselSlidesFromDb();
    const exists = currentSlides.some((s) => s.id === slideId);
    if (!exists) {
      res.status(404).json({ ok: false, error: 'ERR_NOT_FOUND', message: 'Slide no encontrado.' });
      return;
    }

    const isDefault = Boolean(es_default);

    const updatedSlides: CarouselSlide[] = currentSlides.map((s) => {
      if (s.id === slideId) {
        return {
          ...s,
          tipo: tipo && ['imagen', 'video'].includes(tipo) ? tipo : s.tipo,
          url: url ? String(url).trim() : s.url,
          titulo: titulo !== undefined ? String(titulo).trim() : s.titulo,
          descripcion: descripcion !== undefined ? String(descripcion).trim() : s.descripcion,
          duracion_ms: Number(duracion_ms) > 0 ? Number(duracion_ms) : s.duracion_ms,
          es_default: isDefault,
          activo: activo !== undefined ? Boolean(activo) : s.activo,
          orden: typeof orden === 'number' ? orden : s.orden,
        };
      }
      return isDefault ? { ...s, es_default: false } : s;
    });

    await query(
      `INSERT INTO configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en)
       VALUES ('frontend_carousel_cms', $1, 'Slides multimedia dinámicos del carrusel del portal', 'FRONTEND', NOW())
       ON CONFLICT (clave) DO UPDATE
       SET valor = $1, actualizado_en = NOW()`,
      [JSON.stringify(updatedSlides)]
    );

    res.json({
      ok: true,
      mensaje: 'Slide actualizado correctamente.',
      slides: updatedSlides.sort((a, b) => a.orden - b.orden),
    });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/frontend-cms/carousel/:id:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * DELETE /api/admin/frontend-cms/carousel/:id
 * Elimina un slide del carrusel
 */
router.delete('/carousel/:id', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const slideId = req.params.id;
    const currentSlides = await getCarouselSlidesFromDb();
    const filtered = currentSlides.filter((s) => s.id !== slideId);

    if (filtered.length === currentSlides.length) {
      res.status(404).json({ ok: false, error: 'ERR_NOT_FOUND', message: 'Slide no encontrado.' });
      return;
    }

    // Asegurar que al menos un slide sea default si quedan slides
    if (filtered.length > 0 && !filtered.some((s) => s.es_default)) {
      filtered[0].es_default = true;
    }

    const renumbered = filtered.map((s, idx) => ({ ...s, orden: idx + 1 }));

    await query(
      `INSERT INTO configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en)
       VALUES ('frontend_carousel_cms', $1, 'Slides multimedia dinámicos del carrusel del portal', 'FRONTEND', NOW())
       ON CONFLICT (clave) DO UPDATE
       SET valor = $1, actualizado_en = NOW()`,
      [JSON.stringify(renumbered)]
    );

    res.json({
      ok: true,
      mensaje: 'Slide eliminado exitosamente.',
      slides: renumbered,
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/admin/frontend-cms/carousel/:id:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

export default router;
