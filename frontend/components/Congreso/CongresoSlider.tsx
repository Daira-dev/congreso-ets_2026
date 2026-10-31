"use client";

import React, { useState, useEffect, useRef } from "react";

export interface CarouselSlide {
  id: string;
  tipo: "imagen" | "video";
  url: string;
  titulo?: string;
  descripcion?: string;
  duracion_ms: number;
  orden: number;
  es_default: boolean;
  activo: boolean;
}

const DEFAULT_FALLBACK_SLIDES: CarouselSlide[] = [
  {
    id: "default-1",
    tipo: "imagen",
    url: "/assets/IFTS_27/hero/Imagen del header.jpg",
    titulo: "Sede Congreso ETS 2026",
    descripcion: "Auditorio Polo Saavedra - Crisólogo Larralde 5085",
    duracion_ms: 5000,
    orden: 1,
    es_default: true,
    activo: true,
  },
  {
    id: "default-2",
    tipo: "video",
    url: "https://www.youtube.com/embed/fFaAyN6sBus?autoplay=1&mute=1&loop=1",
    titulo: "Spot Institucional Buenos Aires",
    descripcion: "Formación Técnica de Vanguardia",
    duracion_ms: 8000,
    orden: 2,
    es_default: false,
    activo: true,
  },
];

const CongresoSlider = () => {
  const [slides, setSlides] = useState<CarouselSlide[]>(DEFAULT_FALLBACK_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mediaError, setMediaError] = useState<Record<string, boolean>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar slides desde el backend
  useEffect(() => {
    let isMounted = true;
    async function fetchSlides() {
      try {
        const res = await fetch("/api/frontend/carousel");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.slides) && data.slides.length > 0 && isMounted) {
            setSlides(data.slides);
            // Iniciar en el slide designado como default
            const defaultIdx = data.slides.findIndex((s: CarouselSlide) => s.es_default);
            setCurrentIndex(defaultIdx >= 0 ? defaultIdx : 0);
          }
        }
      } catch (err) {
        // Mantiene los fallbacks predeterminados
      }
    }
    fetchSlides();

    const handleUpdate = () => fetchSlides();
    window.addEventListener("carousel-updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("carousel-updated", handleUpdate);
    };
  }, []);

  const total = slides.length;
  const currentSlide = slides[currentIndex] || slides[0];

  // Temporizador individual por slide con soporte para pausar en hover
  useEffect(() => {
    if (total <= 1 || isHovered) return;

    const duration = currentSlide.duracion_ms && currentSlide.duracion_ms >= 1000
      ? currentSlide.duracion_ms
      : 5000;

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, total, isHovered, currentSlide]);

  const previousSlide = () => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const nextSlide = () => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handleMediaError = (slideId: string) => {
    setMediaError((prev) => ({ ...prev, [slideId]: true }));
  };

  if (total === 0) {
    return null;
  }

  const isVideoUrl = currentSlide.tipo === "video";
  const isEmbed = isVideoUrl && (currentSlide.url.includes("youtube") || currentSlide.url.includes("vimeo"));

  return (
    <div
      className="relative group rounded-2xl overflow-hidden shadow-xl border border-azul-oscuro/15 bg-black"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Contenedor con relación de aspecto 16/9 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900 flex items-center justify-center">
        {mediaError[currentSlide.id] ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-white/80">
            <span className="text-4xl mb-2">🎬</span>
            <p className="text-sm font-semibold">Contenido multimedia temporalmente no disponible</p>
            <span className="text-xs text-white/50 mt-1">{currentSlide.titulo || "Diapositiva del Congreso"}</span>
          </div>
        ) : isEmbed ? (
          <iframe
            src={currentSlide.url}
            title={currentSlide.titulo || "Video del Congreso"}
            className="w-full h-full border-0 pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : isVideoUrl ? (
          <video
            src={currentSlide.url}
            autoPlay
            muted
            loop
            playsInline
            onError={() => handleMediaError(currentSlide.id)}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={currentSlide.url}
            alt={currentSlide.titulo || "Imagen del Congreso"}
            onError={() => handleMediaError(currentSlide.id)}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        )}

        {/* Gradiente y Pie informativo del Slide */}
        {(currentSlide.titulo || currentSlide.descripcion) && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 sm:p-6 text-white pointer-events-none">
            {currentSlide.titulo && (
              <h4 className="font-bold text-base sm:text-lg text-white drop-shadow-md">
                {currentSlide.titulo}
              </h4>
            )}
            {currentSlide.descripcion && (
              <p className="text-xs sm:text-sm text-white/90 line-clamp-2 mt-0.5 max-w-xl drop-shadow-xs">
                {currentSlide.descripcion}
              </p>
            )}
          </div>
        )}

        {/* Indicador de duración / temporizador individual en esquina superior derecha */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white/90 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
          ⏱️ {Math.round(currentSlide.duracion_ms / 1000)}s
        </div>
      </div>

      {/* Botón para volver a la imagen anterior */}
      {total > 1 && (
        <button
          type="button"
          onClick={previousSlide}
          aria-label="Diapositiva anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl text-azul-oscuro transition hover:bg-amarillo shadow-lg hover:scale-105 cursor-pointer z-20"
        >
          ‹
        </button>
      )}

      {/* Botón para avanzar a la siguiente imagen */}
      {total > 1 && (
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Diapositiva siguiente"
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl text-azul-oscuro transition hover:bg-amarillo shadow-lg hover:scale-105 cursor-pointer z-20"
        >
          ›
        </button>
      )}

      {/* Indicadores inferiores */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
          {slides.map((s, index) => (
            <button
              key={s.id || index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ver diapositiva ${index + 1}: ${s.titulo || s.tipo}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                index === currentIndex
                  ? "w-6 bg-amarillo shadow-xs"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CongresoSlider;