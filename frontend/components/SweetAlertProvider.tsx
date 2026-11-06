'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Swal from 'sweetalert2';

export interface LivePushNotice {
  id: string;
  title: string;
  body: string;
  url: string;
  urgente?: boolean;
  segmento?: string;
  createdAt: string;
}

function normalizeTargetPath(rawUrl?: string): string {
  if (!rawUrl || !rawUrl.trim()) return '/';
  const trimmed = rawUrl.trim();
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parsed = new URL(trimmed);
      return parsed.pathname || '/';
    }
  } catch (_) {}
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.split('?')[0].split('#')[0] || '/';
}

export default function SweetAlertProvider() {
  const pathname = usePathname();
  const [activePush, setActivePush] = useState<LivePushNotice | null>(null);

  const isDismissedOnPath = useCallback((noticeId: string, path: string): boolean => {
    try {
      const raw = sessionStorage.getItem('ets2026_dismissed_pushes');
      if (!raw) return false;
      const list: string[] = JSON.parse(raw);
      return list.includes(`${noticeId}:${path}`) || list.includes(`${noticeId}:*`);
    } catch {
      return false;
    }
  }, []);

  const markDismissed = useCallback((noticeId: string, path: string) => {
    try {
      const raw = sessionStorage.getItem('ets2026_dismissed_pushes');
      const list: string[] = raw ? JSON.parse(raw) : [];
      const key = `${noticeId}:${path}`;
      if (!list.includes(key)) {
        list.push(key);
        sessionStorage.setItem('ets2026_dismissed_pushes', JSON.stringify(list.slice(-50)));
      }
    } catch (_) {}
  }, []);

  const triggerNativeNotificationOnce = useCallback(async (notice: LivePushNotice) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const notifiedKey = `ets2026_native_push_${notice.id}`;
      if (localStorage.getItem(notifiedKey)) return;
      localStorage.setItem(notifiedKey, '1');

      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        if (reg && reg.showNotification) {
          await reg.showNotification(notice.title, {
            body: notice.body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `live-${notice.id}`,
            data: { url: notice.url || '/', urgente: Boolean(notice.urgente) },
          });
          return;
        }
      }

      const n = new Notification(notice.title, {
        body: notice.body,
        icon: '/icon-192.png',
        tag: `live-${notice.id}`,
      });
      n.onclick = () => {
        window.focus();
        if (notice.url) {
          window.location.href = notice.url;
        }
      };
    } catch (_) {}
  }, []);

  const evaluateIncomingNotice = useCallback(
    (notice: LivePushNotice | null, isInstantEvent = false) => {
      if (!notice || !notice.id) return;
      const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');
      const targetPath = normalizeTargetPath(notice.url);

      // Si llega por evento en vivo, disparar también notificación nativa del navegador (una sola vez por ID)
      if (isInstantEvent) {
        triggerNativeNotificationOnce(notice);
      }

      // No superponer el banner sobre el panel /admin a menos que la URL configurada sea explícitamente /admin
      if (currentPath.startsWith('/admin') && !targetPath.startsWith('/admin')) {
        return;
      }

      if (isDismissedOnPath(notice.id, currentPath)) {
        return;
      }

      const ageMs = Date.now() - new Date(notice.createdAt || Date.now()).getTime();
      const isRecent = ageMs < 60 * 60 * 1000; // Últimos 60 minutos
      const matchesTargetUrl =
        currentPath === targetPath ||
        (targetPath !== '/' && currentPath.startsWith(targetPath)) ||
        targetPath === '/';

      if (isInstantEvent || (isRecent && (matchesTargetUrl || currentPath === '/'))) {
        setActivePush(notice);
      }
    },
    [pathname, isDismissedOnPath, triggerNativeNotificationOnce]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Interceptar e instrumentar Swal.fire globalmente para estandarizar duración de avisos:
      // - Operación Exitosa ('success'): 3 segundos (3000 ms) y desaparece
      // - Operación No Exitosa ('error', 'warning', 'info' u otros): 6 segundos (6000 ms) y desaparece
      const originalFire = Swal.fire.bind(Swal);

      // Wrapper tipado compatible
      (Swal as any).fire = function (...args: any[]) {
        if (args.length === 0) {
          return originalFire();
        }

        // Si se llama con firma posicional: Swal.fire(title, html/text, icon)
        if (typeof args[0] === 'string') {
          const title = args[0];
          const text = args[1] || '';
          const icon = args[2];
          const isSuccess = icon === 'success';
          const timerDuration = isSuccess ? 3000 : 6000;

          return originalFire({
            title,
            text,
            icon,
            timer: timerDuration,
            timerProgressBar: true,
            confirmButtonColor: isSuccess ? '#005691' : '#d33',
            confirmButtonText: 'Aceptar',
          });
        }

        // Si se llama con objeto de opciones: Swal.fire({ ... })
        if (typeof args[0] === 'object' && args[0] !== null) {
          const opts = { ...args[0] };

          // Si es un diálogo de confirmación interactivo (tiene showCancelButton: true), no forzamos timer para no cerrar la pregunta
          const isConfirmation = Boolean(opts.showCancelButton || opts.showDenyButton);

          if (!isConfirmation) {
            const isSuccess = opts.icon === 'success';
            const defaultTimer = isSuccess ? 3000 : 6000;

            // Si el timer no está configurado explícitamente a false o null, aplicar regla institucional:
            // Éxito: 3 segundos | No éxito: 6 segundos
            opts.timer = defaultTimer;
            opts.timerProgressBar = true;
          }

          return originalFire(opts);
        }

        return originalFire(...args);
      };

      // 2. Interceptar alert nativo para que siempre se renderice como SweetAlert2 institucional
      window.alert = (message?: any) => {
        const text = typeof message === 'string' ? message : JSON.stringify(message);
        const isError = text.toLowerCase().includes('error') || text.toLowerCase().includes('rechazó') || text.toLowerCase().includes('fallo');
        const isWarning = text.toLowerCase().includes('advertencia') || text.toLowerCase().includes('atención') || text.toLowerCase().includes('conflicto');
        const isSuccess = text.toLowerCase().includes('éxito') || text.toLowerCase().includes('exitosamente') || text.toLowerCase().includes('correcto');

        Swal.fire({
          title: isError ? 'Error en la Operación' : isWarning ? 'Atención' : isSuccess ? 'Operación Exitosa' : 'Notificación Oficial',
          text,
          icon: isError ? 'error' : isWarning ? 'warning' : isSuccess ? 'success' : 'info',
          confirmButtonColor: '#005691',
          confirmButtonText: 'Entendido',
        });
      };
    }
  }, []);

  // Escucha en tiempo real de avisos Push despachados para la URL configurada
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkLatestFromServer = async () => {
      try {
        const res = await fetch('/api/push/latest', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && Array.isArray(data.avisos) && data.avisos.length > 0) {
          const currentPath = pathname || window.location.pathname || '/';
          // Priorizar el aviso más reciente que apunte específicamente a esta URL, o el último global
          const exactMatch = data.avisos.find(
            (a: LivePushNotice) => normalizeTargetPath(a.url) === currentPath
          );
          evaluateIncomingNotice(exactMatch || data.avisos[0], false);
        }
      } catch (_) {}
    };

    checkLatestFromServer();

    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('ets2026_push_channel');
        bc.onmessage = (ev) => {
          if (ev.data && ev.data.id) {
            evaluateIncomingNotice(ev.data as LivePushNotice, true);
          }
        };
      } catch (_) {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ets2026_last_push_broadcast' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          evaluateIncomingNotice(parsed, true);
        } catch (_) {}
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', checkLatestFromServer);
    const interval = setInterval(checkLatestFromServer, 6000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', checkLatestFromServer);
      clearInterval(interval);
      if (bc) {
        try {
          bc.close();
        } catch (_) {}
      }
    };
  }, [pathname, evaluateIncomingNotice]);

  if (!activePush) {
    return null;
  }

  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const targetPath = normalizeTargetPath(activePush.url);
  const isAlreadyOnTarget = currentPath === targetPath;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[420px] z-[9999] no-print animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div
        className={`rounded-2xl shadow-2xl border-2 p-4 backdrop-blur-md ${
          activePush.urgente
            ? 'bg-red-950/95 border-red-400 text-white'
            : 'bg-slate-900/95 border-amber-400 text-white'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{activePush.urgente ? '🚨' : '🔔'}</span>
            <div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  activePush.urgente
                    ? 'bg-red-500 text-white'
                    : 'bg-amber-400 text-slate-950'
                }`}
              >
                {activePush.urgente ? 'Alerta Push Urgente' : 'Aviso Push en Vivo · ETS 2026'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              markDismissed(activePush.id, currentPath);
              setActivePush(null);
            }}
            className="text-slate-300 hover:text-white text-xs font-bold px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer"
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>

        <h4 className="text-sm font-extrabold mt-2.5 text-white leading-snug">
          {activePush.title}
        </h4>
        <p className="text-xs text-slate-200 mt-1 leading-relaxed whitespace-pre-line">
          {activePush.body}
        </p>

        <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-300 font-mono truncate">
            Destino: {activePush.url || '/'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {!isAlreadyOnTarget && activePush.url && (
              <a
                href={activePush.url}
                onClick={() => markDismissed(activePush.id, currentPath)}
                className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition text-xs"
              >
                Ver ahora →
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                markDismissed(activePush.id, currentPath);
                setActivePush(null);
              }}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-lg transition text-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
