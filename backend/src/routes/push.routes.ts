import { Router, Request, Response } from 'express';
import {
  getVapidPublicKey,
  savePushSubscription,
  removePushSubscription,
  sendToSubscription,
  getRecentDispatchedPushes,
} from '../lib/pushService';
import { pushSubscriptionSchema } from '../lib/schemas';
import { query } from '../lib/db';

const router = Router();

/**
 * GET /api/push/public-key y /api/push/vapid-key
 * Devuelve la clave pública VAPID para suscripción en el navegador
 */
router.get(['/public-key', '/vapid-key'], async (_req: Request, res: Response): Promise<void> => {
  try {
    const publicKey = await getVapidPublicKey();
    res.json({ ok: true, publicKey });
  } catch (error: any) {
    console.error('Error al obtener clave pública VAPID:', error);
    res.status(500).json({ ok: false, error: 'ERR_VAPID_KEY', message: error.message });
  }
});

/**
 * GET /api/push/latest
 * Devuelve los últimos avisos Push despachados en tiempo real para que las URLs de destino los muestren
 */
router.get('/latest', async (_req: Request, res: Response): Promise<void> => {
  try {
    const avisos = await getRecentDispatchedPushes();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
      ok: true,
      latest: avisos[0] || null,
      avisos,
    });
  } catch (error: any) {
    console.error('Error al consultar avisos push recientes:', error);
    res.status(500).json({ ok: false, error: 'ERR_PUSH_LATEST', message: error.message });
  }
});

/**
 * POST /api/push/subscribe
 * Registra una suscripción Web Push en la base de datos (para participantes registrados o dispositivos generales)
 */
router.post('/subscribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = pushSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: 'ERR_VALIDATION',
        details: parsed.error.format(),
      });
      return;
    }

    const { endpoint, keys, usuario_id } = parsed.data;
    let validUsuarioId: string | null = null;

    if (usuario_id) {
      // Validar existencia del usuario en la base de datos si se proveyó usuario_id
      const userCheck = await query(
        `SELECT u.id
         FROM usuarios u
         WHERE u.id = $1`,
        [usuario_id]
      );

      if ((userCheck.rowCount ?? 0) > 0) {
        validUsuarioId = usuario_id;
      }
    }

    const userAgent = req.headers['user-agent'] || null;

    await savePushSubscription({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      usuario_id: validUsuarioId,
      user_agent: userAgent,
    });

    // Enviar notificación push de confirmación inmediata al dispositivo del usuario
    const welcomePayload = JSON.stringify({
      title: '🔔 ¡Notificaciones Oficiales Activadas!',
      body: 'Recibirás avisos en tiempo real sobre cambios de sala, horarios y reconfirmaciones del Congreso ETS 2026.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      url: '/mi-credencial',
      tag: 'bienvenida-push',
      urgente: false,
    });

    sendToSubscription({ endpoint, p256dh: keys.p256dh, auth: keys.auth }, welcomePayload).catch(
      (err) => console.warn('Aviso push inicial no enviado (puede completarse en segundo plano):', err)
    );

    res.json({ ok: true, mensaje: 'Dispositivo suscrito exitosamente a notificaciones oficiales.' });
  } catch (error: any) {
    console.error('Error al registrar suscripción push:', error);
    res.status(500).json({ ok: false, error: 'ERR_PUSH_SUBSCRIBE', message: error.message });
  }
});

/**
 * POST /api/push/unsubscribe
 * Cancela una suscripción Web Push
 */
router.post('/unsubscribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { endpoint } = req.body;
    if (!endpoint || typeof endpoint !== 'string') {
      res.status(400).json({ ok: false, error: 'ERR_ENDPOINT_REQUIRED' });
      return;
    }

    await removePushSubscription(endpoint);
    res.json({ ok: true, mensaje: 'Suscripción dada de baja correctamente.' });
  } catch (error: any) {
    console.error('Error al dar de baja suscripción push:', error);
    res.status(500).json({ ok: false, error: 'ERR_PUSH_UNSUBSCRIBE', message: error.message });
  }
});

export default router;
