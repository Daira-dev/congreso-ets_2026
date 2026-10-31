'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export interface FrontendAvisosConfig {
  titulo: string;
  descripcion: string;
  botonTexto: string;
  icono: string;
  activo: boolean;
}

const DEFAULT_AVISOS: FrontendAvisosConfig = {
  titulo: 'Avisos en Vivo del Congreso ETS 2026',
  descripcion: 'Activa las notificaciones oficiales para recibir alertas de cambios de sala, horarios e inicio de charlas en tu dispositivo.',
  botonTexto: 'Activar Notificaciones',
  icono: '🔔',
  activo: true,
};

const ICON_OPTIONS = ['🔔', '📢', '⚡', 'ℹ️', '🚨', '✉️', '🎙️', '🎯'];

interface Props {
  onNotice: (msg: string) => void;
}

export default function AdminAvisosCmsView({ onNotice }: Props) {
  const [config, setConfig] = useState<FrontendAvisosConfig>(DEFAULT_AVISOS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/frontend-cms/avisos');
      const data = await res.json();
      if (data.ok && data.avisos) {
        setConfig(data.avisos);
        setHasChanges(false);
      }
    } catch (err: any) {
      console.error('Error cargando avisos:', err);
      onNotice(`Error cargando avisos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleChange = (field: keyof FrontendAvisosConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!config.titulo.trim()) {
      Swal.fire('Atención', 'El título del anuncio no puede estar vacío.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/frontend-cms/avisos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (data.ok) {
        setHasChanges(false);
        window.dispatchEvent(new CustomEvent('avisos-updated'));
        window.dispatchEvent(new CustomEvent('secciones-updated'));
        Swal.fire({
          icon: 'success',
          title: 'Avisos en Vivo Actualizados',
          text: 'El contenido y visibilidad del anuncio se han guardado exitosamente.',
          timer: 2000,
          showConfirmButton: false,
        });
        onNotice('Anuncio de Avisos en Vivo guardado en base de datos.');
      } else {
        throw new Error(data.message || 'Error al guardar avisos.');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirm = await Swal.fire({
      title: '¿Restablecer Anuncio Oficial?',
      text: 'Se restablecerán el título, descripción e ícono por defecto del anuncio de Avisos en Vivo.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, restablecer',
      cancelButtonText: 'Cancelar',
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch('/api/admin/frontend-cms/avisos/reset', {
          method: 'POST',
        });
        const data = await res.json();
        if (data.ok && data.avisos) {
          setConfig(data.avisos);
          setHasChanges(false);
          window.dispatchEvent(new CustomEvent('avisos-updated'));
          window.dispatchEvent(new CustomEvent('secciones-updated'));
          Swal.fire('Restablecido', 'El anuncio oficial ha sido restaurado.', 'success');
          onNotice('Anuncio oficial de Avisos en Vivo restablecido.');
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
        <p className="text-sm">Cargando gestor de Avisos en Vivo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-100 text-amber-900 rounded-xl text-xl">📢</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Gestión de Avisos en Vivo (Push)
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Configurá el texto del anuncio, la llamada a la acción y activá o desactivá su visualización en el portal público.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
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
            <span>Contenido del Anuncio</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                config.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {config.activo ? '🟢 ANUNCIO MOSTRADO' : '🔴 ANUNCIO OCULTO'}
            </span>
          </h3>

          {/* ESTADO DE VISIBILIDAD (MOSTRAR / OCULTAR) */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="font-bold text-sm text-gray-800">Mostrar Anuncio en el Portal</p>
              <p className="text-xs text-gray-500">
                Al desactivarlo, el banner de avisos se oculta inmediatamente del DOM del portal público.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.activo}
                onChange={(e) => handleChange('activo', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* SELECTOR DE ÍCONO */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Ícono Animado
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((ico) => (
                <button
                  key={ico}
                  type="button"
                  onClick={() => handleChange('icono', ico)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition cursor-pointer border ${
                    config.icono === ico
                      ? 'bg-amber-400 border-amber-500 shadow-xs ring-2 ring-amber-300 text-gray-900 scale-105'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  {ico}
                </button>
              ))}
            </div>
          </div>

          {/* TÍTULO */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Título del Anuncio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Ej: Avisos en Vivo del Congreso ETS 2026"
              className="w-full text-sm font-semibold border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Bajada / Mensaje Descriptivo
            </label>
            <textarea
              rows={3}
              value={config.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Ej: Activa las notificaciones oficiales para recibir alertas..."
              className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* TEXTO DEL BOTÓN */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Texto del Botón de Acción
            </label>
            <input
              type="text"
              value={config.botonTexto}
              onChange={(e) => handleChange('botonTexto', e.target.value)}
              placeholder="Ej: Activar Notificaciones"
              className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-bold text-gray-900 bg-amber-400 hover:bg-amber-500 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>💾</span> {saving ? 'Guardando...' : 'Guardar y Publicar Anuncio'}
            </button>
          </div>
        </div>

        {/* COLUMNA PREVIEW EN VIVO */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span>👁️</span> Previsualización en Vivo en el Portal
              </h3>
              <span className="text-xs text-gray-400 font-mono">Renderizado Público</span>
            </div>

            {/* SIMULACIÓN DEL CONTENEDOR EN LA LANDING */}
            <div className="p-6 bg-gray-100 border border-gray-200 rounded-2xl space-y-4">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Ubicación: Justo debajo de la Sección Hero
              </p>

              {config.activo ? (
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 border border-blue-700/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-bounce">{config.icono || '🔔'}</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200">
                        {config.titulo || 'Avisos en Vivo del Congreso ETS 2026'}
                      </h4>
                      <p className="text-xs text-blue-100 mt-0.5">
                        {config.descripcion || 'Activa las notificaciones oficiales para recibir alertas de cambios de sala, horarios e inicio de charlas en tu dispositivo.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {config.botonTexto || 'Activar Notificaciones'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 text-sm">
                  <span className="text-2xl block mb-2">👁️‍🗨️</span>
                  <strong>El anuncio de Avisos en Vivo está actualmente oculto.</strong>
                  <p className="text-xs text-gray-500 mt-1">
                    No se renderiza en el portal público para los visitantes.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <span>💡</span>
            <span>
              Los cambios en el título, descripción o estado de visibilidad impactan de forma instantánea en la página principal gracias a la sincronización en vivo.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
