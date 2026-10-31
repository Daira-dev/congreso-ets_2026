'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export interface FrontendVideoInstitucionalConfig {
  titulo: string;
  subtitulo?: string;
  videoUrl: string;
  activo: boolean;
}

const DEFAULT_VIDEO: FrontendVideoInstitucionalConfig = {
  titulo: 'Sumate a la experiencia ETS',
  subtitulo: 'Conocé la propuesta formativa y el espíritu del Congreso de Educación Técnica Superior',
  videoUrl: 'https://www.youtube.com/embed/fFaAyN6sBus?si=7NMzlsDyW2jo-esW',
  activo: true,
};

interface Props {
  onNotice: (msg: string) => void;
}

// Transforma URLs comunes de YouTube / Vimeo a sus URLs embebibles estándar
function toEmbedUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // YouTube Shorts
  const shortsMatch = trimmed.match(/(?:youtube\.com\/shorts\/)([\w-]+)/);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }

  // YouTube watch?v=
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([\w-]+)/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  // YouTube youtu.be/
  const shortMatch = trimmed.match(/(?:youtu\.be\/)([\w-]+)/);
  if (shortMatch && shortMatch[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)([\d]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return trimmed;
}

export default function AdminVideoInstitucionalView({ onNotice }: Props) {
  const [config, setConfig] = useState<FrontendVideoInstitucionalConfig>(DEFAULT_VIDEO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/frontend-cms/video-institucional');
      const data = await res.json();
      if (data.ok && data.video) {
        setConfig(data.video);
        setHasChanges(false);
      }
    } catch (err: any) {
      console.error('Error cargando video institucional:', err);
      onNotice(`Error cargando video institucional: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleChange = (field: keyof FrontendVideoInstitucionalConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Conmutador directo de visibilidad con impacto inmediato en BD y portal público
  const handleToggleVisibilidad = async (forceState?: boolean) => {
    const nuevoEstado = forceState !== undefined ? forceState : !config.activo;
    const updatedConfig = { ...config, activo: nuevoEstado };
    setConfig(updatedConfig);

    try {
      const res = await fetch('/api/admin/frontend-cms/video-institucional', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      const data = await res.json();
      if (data.ok) {
        setHasChanges(false);
        window.dispatchEvent(new CustomEvent('video-institucional-updated'));
        window.dispatchEvent(new CustomEvent('secciones-updated'));
        const estadoTxt = nuevoEstado ? 'visible en el portal público' : 'completamente oculta del portal público';
        Swal.fire({
          icon: 'success',
          title: nuevoEstado ? 'Video Institucional Visible' : 'Video Institucional Oculto',
          text: `La sección del video institucional ahora está ${estadoTxt}.`,
          timer: 1800,
          showConfirmButton: false,
        });
        onNotice(`Video institucional ahora está ${estadoTxt}.`);
      }
    } catch (err: any) {
      console.error('Error conmutando visibilidad de video:', err);
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleUrlBlur = () => {
    const embed = toEmbedUrl(config.videoUrl);
    if (embed !== config.videoUrl) {
      handleChange('videoUrl', embed);
    }
  };

  const handleSave = async () => {
    if (!config.titulo.trim()) {
      Swal.fire('Atención', 'El título de la sección de video es obligatorio.', 'warning');
      return;
    }
    if (!config.videoUrl.trim()) {
      Swal.fire('Atención', 'La URL del video es obligatoria.', 'warning');
      return;
    }

    const embedUrl = toEmbedUrl(config.videoUrl);

    setSaving(true);
    try {
      const res = await fetch('/api/admin/frontend-cms/video-institucional', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          videoUrl: embedUrl,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setHasChanges(false);
        window.dispatchEvent(new CustomEvent('video-institucional-updated'));
        window.dispatchEvent(new CustomEvent('secciones-updated'));
        Swal.fire({
          icon: 'success',
          title: 'Video Institucional Actualizado',
          text: 'La configuración y visibilidad del video institucional se han guardado exitosamente.',
          timer: 2000,
          showConfirmButton: false,
        });
        onNotice('Video institucional guardado exitosamente en base de datos.');
      } else {
        throw new Error(data.message || 'Error al guardar video institucional.');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirm = await Swal.fire({
      title: '¿Restablecer Video Oficial?',
      text: 'Se restablecerá el video institucional al Spot Oficial de Buenos Aires ETS 2026.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, restablecer',
      cancelButtonText: 'Cancelar',
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch('/api/admin/frontend-cms/video-institucional/reset', {
          method: 'POST',
        });
        const data = await res.json();
        if (data.ok && data.video) {
          setConfig(data.video);
          setHasChanges(false);
          window.dispatchEvent(new CustomEvent('video-institucional-updated'));
          window.dispatchEvent(new CustomEvent('secciones-updated'));
          Swal.fire('Restablecido', 'El video oficial ha sido restaurado.', 'success');
          onNotice('Video institucional oficial restablecido.');
        }
      } catch (err: any) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
        <div className="animate-spin text-3xl mb-3">⏳</div>
        <p className="text-sm">Cargando configuración del Video Institucional...</p>
      </div>
    );
  }

  const embedUrl = toEmbedUrl(config.videoUrl);

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-100 text-amber-900 rounded-xl text-xl">🎬</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Editor del Video Institucional (Sumate a la experiencia ETS)
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Configurá el video oficial embebido de YouTube/Vimeo, sus textos descriptivos y su visibilidad en el portal.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* BOTÓN DIRECTO DE VISIBILIDAD (MOSTRAR / OCULTAR EN UN CLIC) */}
          <button
            type="button"
            onClick={() => handleToggleVisibilidad()}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              config.activo
                ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title={config.activo ? 'Hacer clic para ocultar del portal público' : 'Hacer clic para mostrar en el portal público'}
          >
            {config.activo ? (
              <>
                <span>👁️‍🗨️</span> Ocultar del Portal
              </>
            ) : (
              <>
                <span>👁️</span> Mostrar en el Portal
              </>
            )}
          </button>

          <a
            href="/#congreso"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🌐</span> Ver en Portal
          </a>

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔄</span> Restablecer Oficial
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-900 bg-amber-400 hover:bg-amber-500 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>💾</span> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex items-center justify-between text-xs text-amber-800">
          <span>⚠️ Tenés modificaciones pendientes de confirmación. Presioná <strong>&quot;Guardar Cambios&quot;</strong> para persistirlas.</span>
          <button
            type="button"
            onClick={handleSave}
            className="bg-amber-600 text-white font-bold px-3 py-1 rounded-lg hover:bg-amber-700 cursor-pointer"
          >
            Guardar Ahora
          </button>
        </div>
      )}

      {/* PANEL PRINCIPAL: FORMULARIO + PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA FORMULARIO DE EDICIÓN */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3 flex items-center justify-between">
            <span>Parámetros de la Sección</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                config.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {config.activo ? '🟢 SECCIÓN VISIBLE' : '🔴 SECCIÓN OCULTA'}
            </span>
          </h3>

          {/* ESTADO DE VISIBILIDAD CON ACCIÓN DIRECTA */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-gray-800">Visibilidad en el Portal Público</p>
                <p className="text-xs text-gray-500">
                  {config.activo
                    ? 'La sección del video se renderiza actualmente en la página principal.'
                    : 'La sección del video está actualmente oculta del DOM del portal.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0" title={config.activo ? 'Clic para ocultar' : 'Clic para mostrar'}>
                <input
                  type="checkbox"
                  checked={config.activo}
                  onChange={() => handleToggleVisibilidad()}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* BOTÓN EXPLÍCITO DE CONMUTACIÓN INMEDIATA */}
            <button
              type="button"
              onClick={() => handleToggleVisibilidad()}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                config.activo
                  ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {config.activo ? (
                <>
                  <span>👁️‍🗨️</span> Clic aquí para Ocultar Video (Impacto Inmediato)
                </>
              ) : (
                <>
                  <span>👁️</span> Clic aquí para Mostrar Video (Impacto Inmediato)
                </>
              )}
            </button>
          </div>

          {/* TÍTULO */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Título de la Sección <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Ej: Sumate a la experiencia ETS"
              className="w-full text-sm font-semibold border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* SUBTÍTULO */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Subtítulo / Bajada Descriptiva (Opcional)
            </label>
            <textarea
              rows={2}
              value={config.subtitulo || ''}
              onChange={(e) => handleChange('subtitulo', e.target.value)}
              placeholder="Ej: Conocé la propuesta formativa y el espíritu del Congreso..."
              className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* URL DEL VIDEO */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              URL del Video (YouTube o Vimeo) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.videoUrl}
              onChange={(e) => handleChange('videoUrl', e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
              className="w-full text-xs font-mono border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Acepta enlaces directos de YouTube (<code>watch?v=</code>, <code>youtu.be/</code>, <code>shorts/</code> o <code>embed/</code>) y Vimeo. Se autoconvierten a formato embebible.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-bold text-gray-900 bg-amber-400 hover:bg-amber-500 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>💾</span> {saving ? 'Guardando...' : 'Guardar y Publicar Video'}
            </button>
          </div>
        </div>

        {/* COLUMNA PREVIEW EN VIVO */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span>👁️</span> Previsualización en Vivo de la Sección
              </h3>
              <span className="text-xs text-gray-400 font-mono">Aspecto 16:9 HD</span>
            </div>

            {/* SIMULACIÓN DEL CONTENEDOR EN LA LANDING */}
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center space-y-4">
              <div>
                <h4 className="text-xl sm:text-2xl font-bold text-[#1D3343]">
                  {config.titulo || 'Sumate a la experiencia ETS'}
                </h4>
                {config.subtitulo && (
                  <p className="mt-2 text-sm text-gray-600 max-w-xl mx-auto">
                    {config.subtitulo}
                  </p>
                )}
              </div>

              <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl shadow-md border border-gray-200 bg-black aspect-video flex items-center justify-center">
                {embedUrl ? (
                  <iframe
                    className="w-full h-full"
                    src={embedUrl}
                    title={config.titulo || 'Video Institucional'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-gray-400 text-sm">Ingresá una URL válida de video</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
            <span>💡</span>
            <span>
              Cualquier cambio guardado se refleja de forma instantánea en la página principal sin necesidad de recompilar ni reiniciar el servidor.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
