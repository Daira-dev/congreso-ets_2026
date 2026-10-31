import { Router, Request, Response } from 'express';
import {
  getFrontendCardsFromDb,
  getHeroConfigFromDb,
  getSeccionesVisibilidadFromDb,
  getCarouselSlidesFromDb,
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
      .filter((c) => c.activo !== false)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));

    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
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
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
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
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
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

    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
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

export default router;
