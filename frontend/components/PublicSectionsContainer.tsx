'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Hero from '@/components/Hero/Hero';
import SobreCongreso from '@/components/Congreso/SobreCongreso';
import SectionCongreso from '@/components/SectionCongreso/SectionCongreso';
import SectionExperiencia from '@/components/SectionExperiencia/SectionExperiencia';
import SectionPrograma from '@/components/SectionPrograma/SectionPrograma';
import PushSubscriptionBanner from '@/components/PushSubscriptionBanner';

export interface SeccionItem {
  key: string;
  nombre?: string;
  enabled: boolean;
}

interface Props {
  initialSecciones: SeccionItem[];
}

export default function PublicSectionsContainer({ initialSecciones }: Props) {
  const [secciones, setSecciones] = useState<SeccionItem[]>(initialSecciones);

  const fetchSecciones = async () => {
    try {
      const res = await fetch('/api/frontend/secciones', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.secciones)) {
          setSecciones(data.secciones);
        }
      }
    } catch (err) {
      console.error('Error al sincronizar visibilidad de secciones:', err);
    }
  };

  useEffect(() => {
    // Sincronización en vivo con eventos del CMS y cambio de foco de pestaña
    const handleUpdate = () => {
      fetchSecciones();
    };

    const handleFocus = () => {
      fetchSecciones();
    };

    window.addEventListener('secciones-updated', handleUpdate);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('secciones-updated', handleUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const isEnabled = (key: string) => {
    const item = secciones.find((s) => s.key === key);
    return item ? item.enabled !== false : true;
  };

  return (
    <>
      {/* 1. SECCIÓN HERO */}
      {isEnabled('hero') && <Hero />}

      {/* 2. SECCIÓN AVISOS / PUSH */}
      {isEnabled('avisos') && (
        <div className="max-w-7xl mx-auto px-4">
          <PushSubscriptionBanner />
        </div>
      )}

      {/* 3. SECCIÓN SOBRE EL CONGRESO & CARRUSEL */}
      {isEnabled('sobre_congreso') && <SobreCongreso />}

      {/* 4. SECCIÓN ACTIVIDADES & MODALIDADES */}
      {isEnabled('modalidades') && (
        <Suspense fallback={<div className="p-8 text-center text-gray-400">Cargando actividades...</div>}>
          <SectionCongreso />
        </Suspense>
      )}

      {/* 5. SECCIÓN PROGRAMA */}
      {isEnabled('programa') && <SectionPrograma />}

      {/* 6. SECCIÓN EXPERIENCIA */}
      {isEnabled('experiencia') && <SectionExperiencia />}
    </>
  );
}
