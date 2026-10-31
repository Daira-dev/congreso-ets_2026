'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export interface SeccionVisibilidad {
  key: string;
  nombre: string;
  descripcion: string;
  enabled: boolean;
}

interface Props {
  onNotice: (msg: string) => void;
  onNavigateToVideo?: () => void;
}

export default function AdminSeccionesVisibilidadView({ onNotice, onNavigateToVideo }: Props) {
  const [secciones, setSecciones] = useState<SeccionVisibilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadSecciones = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/frontend-cms/secciones');
      const data = await res.json();
      if (data.ok && Array.isArray(data.secciones)) {
        setSecciones(data.secciones);
        setHasChanges(false);
      }
    } catch (err: any) {
      console.error('Error cargando Secciones:', err);
      onNotice(`Error cargando Secciones: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecciones();
  }, []);

  const toggleSeccion = async (key: string, forceState?: boolean) => {
    const updated = secciones.map((s) => {
      if (s.key === key) {
        return { ...s, enabled: forceState !== undefined ? forceState : !s.enabled };
      }
      return s;
    });

    setSecciones(updated);
    setHasChanges(false);

    // Guardado inmediato en base de datos para impacto instantáneo
    try {
      const res = await fetch('/api/admin/frontend-cms/secciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secciones: updated }),
      });
      const data = await res.json();
      if (data.ok) {
        window.dispatchEvent(new CustomEvent('secciones-updated'));
        const target = updated.find((s) => s.key === key);
        const estadoTxt = target?.enabled ? 'visible en el portal público' : 'completamente oculta del portal público';
        onNotice(`Sección "${target?.nombre}" ahora está ${estadoTxt}.`);
      }
    } catch (err: any) {
      console.error('Error guardando sección:', err);
    }
  };

  const setAllSecciones = async (enabled: boolean) => {
    const updated = secciones.map((s) => ({ ...s, enabled }));
    setSecciones(updated);
    setHasChanges(false);

    try {
      const res = await fetch('/api/admin/frontend-cms/secciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secciones: updated }),
      });
      const data = await res.json();
      if (data.ok) {
        window.dispatchEvent(new CustomEvent('secciones-updated'));
        Swal.fire({
          icon: 'success',
          title: enabled ? 'Todas las Secciones Visibles' : 'Todas las Secciones Ocultas',
          text: enabled
            ? 'Todas las secciones intermedias ahora se muestran en el portal público.'
            : 'Todas las secciones intermedias han sido ocultadas del portal público.',
          timer: 2000,
          showConfirmButton: false,
        });
        onNotice(enabled ? 'Todas las secciones ahora son visibles.' : 'Todas las secciones han sido ocultadas.');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const saveSecciones = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/frontend-cms/secciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secciones }),
      });
      const data = await res.json();
      if (data.ok) {
        setHasChanges(false);
        window.dispatchEvent(new CustomEvent('secciones-updated'));
        Swal.fire({
          icon: 'success',
          title: 'Visibilidad Actualizada',
          text: 'La configuración de visibilidad de las secciones intermedias fue persistida en la base de datos.',
          timer: 2000,
          showConfirmButton: false,
        });
        onNotice('Visibilidad de secciones guardada exitosamente.');
      } else {
        throw new Error(data.message || 'Error al guardar visibilidad.');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
        <div className="animate-spin text-3xl mb-3">⏳</div>
        <p className="text-sm">Cargando visibilidad de secciones públicas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ENCABEZADO Y ACCIONES PRINCIPALES */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-purple-50 text-purple-700 rounded-xl text-xl">👁️</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Visibilidad Dinámica de Secciones Públicas
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Activá o desactivá secciones completas del portal público con impacto instantáneo en el DOM.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5 cursor-pointer"
            title="Abrir portal público en nueva pestaña"
          >
            <span>🌐</span> Ver Portal en Vivo
          </a>

          <button
            type="button"
            onClick={() => setAllSecciones(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>👁️</span> Mostrar Todas
          </button>

          <button
            type="button"
            onClick={() => setAllSecciones(false)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>👁️‍🗨️</span> Ocultar Todas
          </button>

          <button
            type="button"
            onClick={saveSecciones}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>💾</span> {saving ? 'Guardando...' : 'Guardar Todo'}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex items-center justify-between text-xs text-amber-800">
          <span>⚠️ Tenés modificaciones pendientes de confirmación. Presioná <strong>&quot;Guardar Todo&quot;</strong> para persistirlas.</span>
          <button
            type="button"
            onClick={saveSecciones}
            className="bg-amber-600 text-white font-bold px-3 py-1 rounded-lg hover:bg-amber-700 cursor-pointer"
          >
            Guardar Ahora
          </button>
        </div>
      )}

      {/* NOTA INSTITUCIONAL DE NEGOCIO */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl text-xs text-blue-900 flex items-start gap-3">
        <span className="text-lg">ℹ️</span>
        <div>
          <strong className="block font-bold mb-0.5">Control de Visibilidad de Secciones Completas:</strong>
          Al presionar <strong>Ocultar</strong> o <strong>Mostrar</strong>, la sección intermedia completa se remueve o añade al DOM del portal público de forma inmediata.
          La <strong>Barra de Navegación (NAV)</strong> y el <strong>Pie de Página (FOOTER)</strong> permanecen siempre fijos por integridad institucional.
        </div>
      </div>

      {/* TARJETAS DE SECCIONES CON ACCIONES EXPLÍCITAS Y SWITCH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {secciones.map((sec) => {
          const isVideoSec = sec.key === 'experiencia';

          return (
            <div
              key={sec.key}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                isVideoSec
                  ? sec.enabled
                    ? 'bg-amber-50/40 border-amber-300 shadow-sm ring-2 ring-amber-200'
                    : 'bg-amber-50/20 border-amber-200'
                  : sec.enabled
                  ? 'bg-white border-emerald-200 shadow-xs ring-1 ring-emerald-100'
                  : 'bg-gray-50/90 border-gray-300 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-gray-900">{sec.nombre}</h3>
                    {isVideoSec && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                        Spot Oficial
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                      sec.enabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {sec.enabled ? '🟢 SECCIÓN MOSTRADA' : '🔴 SECCIÓN OCULTA'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{sec.descripcion}</p>

                {isVideoSec && !sec.enabled && (
                  <div className="mt-3 p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
                    <span>🎬 <strong>El Video Institucional está actualmente oculto.</strong></span>
                    <button
                      type="button"
                      onClick={() => toggleSeccion(sec.key, true)}
                      className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-lg text-xs cursor-pointer shadow-xs transition"
                    >
                      🔄 Recuperar Video Institucional
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-gray-100 gap-2">
                {/* Botón de acción directo para mostrar/ocultar sección completa */}
                <button
                  type="button"
                  onClick={() => toggleSeccion(sec.key)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                    sec.enabled
                      ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {sec.enabled ? (
                    <>
                      <span>👁️‍🗨️</span> Ocultar sección completa
                    </>
                  ) : (
                    <>
                      <span>👁️</span> Mostrar sección completa
                    </>
                  )}
                </button>

                {/* Si es el video institucional y existe el handler de navegación, mostrar botón de editor con el mismo amarillo */}
                {isVideoSec && onNavigateToVideo && (
                  <button
                    type="button"
                    onClick={onNavigateToVideo}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-gray-900 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title="Editar URL de YouTube/Vimeo, título y previsualización"
                  >
                    <span>🎬</span> Editar Video Institucional
                  </button>
                )}

                {/* Switch complementario */}
                <div className="flex items-center justify-end">
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0" title={sec.enabled ? 'Click para ocultar' : 'Click para mostrar'}>
                    <input
                      type="checkbox"
                      checked={sec.enabled}
                      onChange={() => toggleSeccion(sec.key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
