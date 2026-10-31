import { Router, Request, Response } from 'express';
import {
  getFrontendCardsFromDb,
  getHeroConfigFromDb,
  getSeccionesVisibilidadFromDb,
  getCarouselSlidesFromDb,
  getFaqItemsFromDb,
  getVideoInstitucionalFromDb,
  getAvisosConfigFromDb,
} from './admin/frontend-cms.routes';

const router = Router();

/**
 * GET /api/frontend/cards
 * Endpoint público consumido por el portal web principal para renderizar las tarjetas de modalidades
 */
router.get('/cards', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cards = await getFrontendCardsFromDb();
    const activeCards = cards
      .filter((c) => {
        const esInactivo =
          (c as any).activo === false ||
          (c as any).activo === 'false' ||
          (c as any).activo === 0 ||
          (c as any).activo === '0' ||
          (c as any).visible === false ||
          (c as any).visible === 'false' ||
          (c as any).estado === 'oculto' ||
          (c as any).estado === 'inactivo';
        return !esInactivo;
      })
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
      ok: true,
      cards: activeCards,
      total: activeCards.length,
    });
  } catch (error: any) {
    console.error('Error en GET /api/frontend/cards:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * GET /api/frontend/hero
 * Endpoint público con la configuración visual y contenidos del Hero principal
 */
router.get('/hero', async (_req: Request, res: Response): Promise<void> => {
  try {
    const hero = await getHeroConfigFromDb();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ ok: true, hero });
  } catch (error: any) {
    console.error('Error en GET /api/frontend/hero:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * GET /api/frontend/secciones
 * Endpoint público con el mapa de visibilidad de secciones intermedias
 */
router.get('/secciones', async (_req: Request, res: Response): Promise<void> => {
  try {
    const secciones = await getSeccionesVisibilidadFromDb();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ ok: true, secciones });
  } catch (error: any) {
    console.error('Error en GET /api/frontend/secciones:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * GET /api/frontend/carousel
 * Endpoint público con las diapositivas multimedia activas del carrusel
 */
router.get('/carousel', async (_req: Request, res: Response): Promise<void> => {
  try {
    const slides = await getCarouselSlidesFromDb();
    const activeSlides = slides
      .filter((s) => s.activo !== false)
      .sort((a, b) => a.orden - b.orden);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
      ok: true,
      slides: activeSlides,
      total: activeSlides.length,
    });
  } catch (error: any) {
    console.error('Error en GET /api/frontend/carousel:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * GET /api/frontend/faq
 * Endpoint público consumido por la página de Contacto / Preguntas Frecuentes
 */
router.get('/faq', async (_req: Request, res: Response): Promise<void> => {
  try {
    const faqs = await getFaqItemsFromDb();
    const activeFaqs = faqs
      .filter((f) => {
        const esInactivo =
          (f as any).activo === false ||
          (f as any).activo === 'false' ||
          (f as any).activo === 0 ||
          (f as any).activo === '0';
        return !esInactivo;
      })
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
      ok: true,
      faqs: activeFaqs,
      total: activeFaqs.length,
    });
  } catch (error: any) {
    console.error('Error en GET /api/frontend/faq:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * GET /api/frontend/video-institucional
 * Retorna la configuración dinámica del video institucional y sección experiencia
 */
router.get('/video-institucional', async (_req: Request, res: Response): Promise<void> => {
  try {
    const videoConfig = await getVideoInstitucionalFromDb();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ ok: true, video: videoConfig });
  } catch (error: any) {
    console.error('Error en GET /api/frontend/video-institucional:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * GET /api/frontend/avisos
 * Retorna la configuración dinámica del anuncio "Avisos en Vivo del Congreso ETS 2026"
 */
router.get('/avisos', async (_req: Request, res: Response): Promise<void> => {
  try {
    const avisosConfig = await getAvisosConfigFromDb();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ ok: true, avisos: avisosConfig });
  } catch (error: any) {
    console.error('Error en GET /api/frontend/avisos:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

export default router;
