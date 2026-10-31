'use client';

import React, { useState, useEffect } from 'react';
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
    <section id="experiencia" className="scroll-mt-24 p-5 sm:p-10 text-center bg-white">
      <h4 className="text-azul-oscuro text-2xl sm:text-3xl font-bold mb-2">
        {config.titulo || 'Sumate a la experiencia ETS'}
      </h4>

      {config.subtitulo && (
        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto mb-6">
          {config.subtitulo}
        </p>
      )}

      <div className="mx-auto w-full max-w-4xl shadow-lg rounded-xl overflow-hidden mt-4">
        <VideoIframe
          videoUrl={config.videoUrl || DEFAULT_CONFIG.videoUrl}
          videoTitle={config.titulo || 'Video Institucional'}
        />
      </div>
    </section>
  );
};

export default SectionExperiencia;
