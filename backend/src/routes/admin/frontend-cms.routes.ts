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

export interface FaqEnlace {
  id: string;
  titulo: string;
  url: string;
}

export interface FaqArchivo {
  id: string;
  nombre: string;
  url: string;
  tamano?: string;
}

export interface FaqMultimedia {
  id: string;
  tipo: 'imagen' | 'video';
  url: string;
  titulo?: string;
}

export interface FaqItem {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  orden: number;
  activo: boolean;
  enlaces?: FaqEnlace[];
  archivos?: FaqArchivo[];
  multimedia?: FaqMultimedia[];
}

export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    pregunta: '¿Qué es el Congreso ETS 2026?',
    respuesta: 'Es una instancia institucional, académico-aplicada, demostrativa y formativa destinada a mostrar y poner en diálogo experiencias de enseñanza, prácticas profesionalizantes, proyectos, producciones estudiantiles y modelos de gestión y enseñanza de la Educación Técnica Superior.',
    categoria: 'General',
    orden: 1,
    activo: true,
    enlaces: [
      { id: 'enl-info-1', titulo: 'Conocé las modalidades del Congreso', url: '/#actividades' }
    ],
  },
  {
    id: 'faq-2',
    pregunta: '¿Cuándo se realiza?',
    respuesta: 'El 6 de noviembre de 2026 en jornada completa de 09:00 a 18:00 hs.',
    categoria: 'General',
    orden: 2,
    activo: true,
  },
  {
    id: 'faq-3',
    pregunta: '¿Dónde se realiza?',
    respuesta: 'La sede prevista es el Auditorio Polo Saavedra, Crisólogo Larralde 5085, Ciudad Autónoma de Buenos Aires.',
    categoria: 'Sede y Acceso',
    orden: 3,
    activo: true,
    enlaces: [
      { id: 'enl-mapa', titulo: 'Ver ubicación en Google Maps', url: 'https://maps.google.com/?q=Crisologo+Larralde+5085+Buenos+Aires' }
    ],
  },
  {
    id: 'faq-4',
    pregunta: '¿La participación es gratuita?',
    respuesta: 'Sí. El Congreso es una iniciativa pública, abierta y 100% gratuita para toda la comunidad educativa y público interesado.',
    categoria: 'General',
    orden: 4,
    activo: true,
  },
  {
    id: 'faq-5',
    pregunta: '¿Cómo me inscribo como asistente?',
    respuesta: 'La inscripción se realiza desde esta web a través de la sección de inscripción oficial para asistentes generales.',
    categoria: 'Inscripción',
    orden: 5,
    activo: true,
    enlaces: [
      { id: 'enl-insc', titulo: 'Ir a Inscripciones', url: '/#contacto' }
    ],
  },
  {
    id: 'faq-6',
    pregunta: '¿Tengo que inscribirme en cada actividad?',
    respuesta: 'No. La inscripción es general al Congreso. El formulario releva intereses temáticos, pero esa selección no constituye una reserva fija de lugar en actividades específicas.',
    categoria: 'Inscripción',
    orden: 6,
    activo: true,
  },
  {
    id: 'faq-7',
    pregunta: '¿La inscripción tiene cupo?',
    respuesta: 'Sí. La cantidad de inscripciones confirmadas está sujeta a la capacidad máxima de la sede. Una vez alcanzado el cupo, el sistema permite registrarse en lista de espera.',
    categoria: 'Inscripción',
    orden: 7,
    activo: true,
  },
  {
    id: 'faq-8',
    pregunta: '¿Para qué sirve el Código QR?',
    respuesta: 'Las personas con inscripción confirmada reciben un Código QR personal e intransferible que se utilizará para acreditar el ingreso en puertas y registrar la asistencia a actividades durante la jornada.',
    categoria: 'Acreditación',
    orden: 8,
    activo: true,
  },
  {
    id: 'faq-9',
    pregunta: '¿Debo presentar el DNI al ingresar?',
    respuesta: 'En principio, la acreditación se realiza mediante el QR generado por el sistema y no está previsto solicitar el documento físico en el ingreso rutinario.',
    categoria: 'Acreditación',
    orden: 9,
    activo: true,
  },
  {
    id: 'faq-10',
    pregunta: '¿Habrá constancia o microcredencial de participación?',
    respuesta: 'Se prevé la emisión posterior de una constancia o microcredencial a partir de la participación efectiva. El criterio operativo definido requiere acreditación general al Congreso y registro de asistencia a al menos una actividad.',
    categoria: 'Certificados',
    orden: 10,
    activo: true,
  },
  {
    id: 'faq-11',
    pregunta: '¿Cómo se presentan propuestas institucionales?',
    respuesta: 'Las instituciones de Formación Técnica Superior dependientes de la DETS cuentan con un circuito específico de carga de propuestas, diferente de la inscripción de asistentes.',
    categoria: 'Propuestas',
    orden: 11,
    activo: true,
    archivos: [
      { id: 'arc-doc-part', nombre: '1 Aula Abierta - demostraciones aplicadas.pdf', url: '/PDF/1 Aula Abierta - demostraciones aplicadas.pdf' }
    ],
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

/**
 * Obtiene los elementos de preguntas frecuentes (FAQ) desde la base de datos o valores por defecto
 */
export async function getFaqItemsFromDb(): Promise<FaqItem[]> {
  try {
    const res = await query(
      `SELECT valor FROM configuraciones_sistema WHERE clave = 'frontend_faq_cms' LIMIT 1`
    );
    if (res.rows.length > 0 && res.rows[0].valor) {
      const parsed = typeof res.rows[0].valor === 'string' ? JSON.parse(res.rows[0].valor) : res.rows[0].valor;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error leyendo frontend_faq_cms:', err);
  }
  return DEFAULT_FAQ_ITEMS;
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

/**
 * Persiste los elementos de FAQ en la base de datos central PostgreSQL
 */
export async function saveFaqItemsToDb(faqs: FaqItem[]): Promise<void> {
  await query(
    `INSERT INTO configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en)
     VALUES ('frontend_faq_cms', $1, 'Preguntas Frecuentes (FAQ) del Frontend dinámico', 'FRONTEND', NOW())
     ON CONFLICT (clave) DO UPDATE
     SET valor = $1, actualizado_en = NOW()`,
    [JSON.stringify(faqs)]
  );
}

/**
 * GET /api/admin/frontend-cms/faq
 * Listado completo de preguntas frecuentes para el panel administrativo
 */
router.get('/faq', requireHierarchy(3), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const items = await getFaqItemsFromDb();
    const sorted = [...items].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    res.json({
      ok: true,
      faqs: sorted,
      total: sorted.length,
      defaultCount: DEFAULT_FAQ_ITEMS.length,
    });
  } catch (error: any) {
    console.error('Error en GET /api/admin/frontend-cms/faq:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * Helper para sanitizar contenidos enriquecidos (URLs, PDFs, multimedia) de FAQs
 */
function sanitizeFaqEnrichments(body: any) {
  const enlaces: FaqEnlace[] = Array.isArray(body.enlaces)
    ? body.enlaces
        .filter((e: any) => e && e.url && String(e.url).trim().length > 0)
        .map((e: any) => ({
          id: e.id ? String(e.id) : `enl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          titulo: String(e.titulo || e.url).trim(),
          url: String(e.url).trim(),
        }))
    : [];

  const archivos: FaqArchivo[] = Array.isArray(body.archivos)
    ? body.archivos
        .filter((a: any) => a && a.url && String(a.url).trim().length > 0)
        .map((a: any) => ({
          id: a.id ? String(a.id) : `arc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          nombre: String(a.nombre || a.url.split('/').pop() || 'Documento PDF').trim(),
          url: String(a.url).trim(),
          tamano: a.tamano ? String(a.tamano).trim() : undefined,
        }))
    : [];

  const multimedia: FaqMultimedia[] = Array.isArray(body.multimedia)
    ? body.multimedia
        .filter((m: any) => m && m.url && String(m.url).trim().length > 0)
        .map((m: any) => ({
          id: m.id ? String(m.id) : `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          tipo: m.tipo === 'video' ? ('video' as const) : ('imagen' as const),
          url: String(m.url).trim(),
          titulo: m.titulo ? String(m.titulo).trim() : undefined,
        }))
    : [];

  return { enlaces, archivos, multimedia };
}

/**
 * POST /api/admin/frontend-cms/faq
 * Crea un nuevo elemento de FAQ con soporte para URLs, PDFs y multimedia
 */
router.post('/faq', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { pregunta, respuesta, categoria, activo, orden } = req.body;
    if (!pregunta || !respuesta) {
      res.status(400).json({ ok: false, error: 'ERR_VALIDATION', message: 'Pregunta y respuesta son campos obligatorios.' });
      return;
    }

    const { enlaces, archivos, multimedia } = sanitizeFaqEnrichments(req.body);

    const currentFaqs = await getFaqItemsFromDb();
    const maxOrden = currentFaqs.reduce((max, item) => Math.max(max, item.orden || 0), 0);
    const newId = `faq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newFaq: FaqItem = {
      id: newId,
      pregunta: String(pregunta).trim(),
      respuesta: String(respuesta).trim(),
      categoria: categoria ? String(categoria).trim() : 'General',
      activo: activo !== false,
      orden: typeof orden === 'number' ? orden : maxOrden + 1,
      enlaces,
      archivos,
      multimedia,
    };

    const updated = [...currentFaqs, newFaq].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    await saveFaqItemsToDb(updated);

    res.status(201).json({
      ok: true,
      mensaje: 'Pregunta frecuente creada exitosamente con sus contenidos.',
      faq: newFaq,
      faqs: updated,
    });
  } catch (error: any) {
    console.error('Error en POST /api/admin/frontend-cms/faq:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * PUT /api/admin/frontend-cms/faq/reorder
 * Actualiza el ordenamiento de los elementos de FAQ
 */
router.put('/faq/reorder', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      res.status(400).json({ ok: false, error: 'ERR_VALIDATION', message: 'Se requiere un array de IDs ordenados en "ids".' });
      return;
    }

    const currentFaqs = await getFaqItemsFromDb();
    const map = new Map(currentFaqs.map((f) => [f.id, f]));

    const reordered: FaqItem[] = [];
    ids.forEach((id: string, index: number) => {
      const item = map.get(id);
      if (item) {
        reordered.push({ ...item, orden: index + 1 });
        map.delete(id);
      }
    });

    // Añadir los que no se hayan incluido en ids
    Array.from(map.values()).forEach((item) => {
      reordered.push({ ...item, orden: reordered.length + 1 });
    });

    await saveFaqItemsToDb(reordered);

    res.json({
      ok: true,
      mensaje: 'Orden de preguntas frecuentes actualizado correctamente.',
      faqs: reordered,
    });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/frontend-cms/faq/reorder:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * PUT /api/admin/frontend-cms/faq/:id
 * Actualiza un elemento de FAQ existente (texto, visibilidad, orden, URLs, PDFs y multimedia)
 */
router.put('/faq/:id', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const faqId = req.params.id;
    const { pregunta, respuesta, categoria, activo, orden, enlaces, archivos, multimedia } = req.body;

    const currentFaqs = await getFaqItemsFromDb();
    const index = currentFaqs.findIndex((f) => f.id === faqId);

    if (index === -1) {
      res.status(404).json({ ok: false, error: 'ERR_NOT_FOUND', message: 'Pregunta frecuente no encontrada.' });
      return;
    }

    const current = currentFaqs[index];
    const enrichments = sanitizeFaqEnrichments({
      enlaces: enlaces !== undefined ? enlaces : current.enlaces,
      archivos: archivos !== undefined ? archivos : current.archivos,
      multimedia: multimedia !== undefined ? multimedia : current.multimedia,
    });

    const updatedFaq: FaqItem = {
      ...current,
      pregunta: pregunta !== undefined ? String(pregunta).trim() : current.pregunta,
      respuesta: respuesta !== undefined ? String(respuesta).trim() : current.respuesta,
      categoria: categoria !== undefined ? String(categoria).trim() : current.categoria,
      activo: activo !== undefined ? (activo !== false && (activo as any) !== 'false') : current.activo,
      orden: typeof orden === 'number' ? orden : current.orden,
      enlaces: enrichments.enlaces,
      archivos: enrichments.archivos,
      multimedia: enrichments.multimedia,
    };

    currentFaqs[index] = updatedFaq;
    const sorted = [...currentFaqs].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    await saveFaqItemsToDb(sorted);

    res.json({
      ok: true,
      mensaje: 'Pregunta frecuente actualizada exitosamente.',
      faq: updatedFaq,
      faqs: sorted,
    });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/frontend-cms/faq/:id:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * DELETE /api/admin/frontend-cms/faq/:id
 * Elimina un elemento de FAQ
 */
router.delete('/faq/:id', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const faqId = req.params.id;
    const currentFaqs = await getFaqItemsFromDb();
    const filtered = currentFaqs.filter((f) => f.id !== faqId);

    if (filtered.length === currentFaqs.length) {
      res.status(404).json({ ok: false, error: 'ERR_NOT_FOUND', message: 'Pregunta frecuente no encontrada.' });
      return;
    }

    const renumbered = filtered.map((f, idx) => ({ ...f, orden: idx + 1 }));
    await saveFaqItemsToDb(renumbered);

    res.json({
      ok: true,
      mensaje: 'Pregunta frecuente eliminada exitosamente.',
      faqs: renumbered,
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/admin/frontend-cms/faq/:id:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * POST /api/admin/frontend-cms/faq/reset
 * Restaura las 11 preguntas frecuentes oficiales por defecto
 */
router.post('/faq/reset', requireHierarchy(5), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await saveFaqItemsToDb(DEFAULT_FAQ_ITEMS);
    res.json({
      ok: true,
      mensaje: 'Preguntas frecuentes restablecidas a los 11 elementos oficiales por defecto.',
      faqs: DEFAULT_FAQ_ITEMS,
    });
  } catch (error: any) {
    console.error('Error en POST /api/admin/frontend-cms/faq/reset:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

export default router;
