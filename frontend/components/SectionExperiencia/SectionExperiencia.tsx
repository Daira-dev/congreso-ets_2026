'use client';

import React, { useState, useEffect } from 'react';
import { Barra } from "@/components/Miscelaneas";
import VideoIframe from './VideoIframe/VideoIframe';

interface VideoConfig {
  titulo: string;
  subtitulo?: string;
  videoUrl: string;
  activo: boolean;
}

const DEFAULT_CONFIG: VideoConfig = {
  titulo: 'Sumate a la experiencia ETS',
  subtitulo: '',
  videoUrl: 'https://www.youtube.com/embed/fFaAyN6sBus?si=7NMzlsDyW2jo-esW',
  activo: true,
};

const SectionExperiencia = () => {
  const [config, setConfig] = useState<VideoConfig>(DEFAULT_CONFIG);

  const fetchVideo = async () => {
    try {
      const res = await fetch('/api/frontend/video-institucional', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.video) {
          setConfig(data.video);
        }
      }
    } catch (err) {
      // Mantiene fallback por defecto
    }
  };

  useEffect(() => {
    fetchVideo();

    const handleUpdate = () => fetchVideo();
    window.addEventListener('video-institucional-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('video-institucional-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  if (config.activo === false) {
    return null;
  }

  return (
    /* Decoración superior */
    <div className="relative w-full">
      <Barra
        color="blanca"
        className="pointer-events-none absolute left-0 top-0 z-20 w-[42%] -translate-y-full"
      />

      <section id="experiencia" className="relative w-full overflow-hidden bg-[#FCFCFC] text-center scroll-mt-24">
        {/* Contenido */}
        <div className="relative z-10 px-5 py-8 sm:px-10 sm:py-12">
            <h4 className="mb-3 text-base font-bold text-azul-oscuro sm:text-2xl">
              {config.titulo || 'Sumate a la experiencia ETS'}
            </h4>

            {config.subtitulo && (
              <p className="mx-auto mb-5 max-w-2xl text-sm text-gray-600 sm:text-base">
                  {config.subtitulo}
              </p>
            )}

            <div className="mx-auto mt-3 w-full max-w-4xl">
              <VideoIframe
                  videoUrl={config.videoUrl || DEFAULT_CONFIG.videoUrl}
                  videoTitle={config.titulo || 'Video Institucional'}
              />
            </div>
        </div>
      </section>
    </div>
  );
};

export default SectionExperiencia;
