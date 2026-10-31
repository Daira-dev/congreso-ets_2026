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
}

export default function AdminSeccionesVisibilidadView({ onNotice }: Props) {
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

  const toggleSeccion = (key: string) => {
    setSecciones((prev) =>
      prev.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s))
    );
    setHasChanges(true);
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
      {/* ENCABEZADO Y ACCIÓN DE GUARDADO */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-purple-50 text-purple-700 rounded-xl text-xl">👁️</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Visibilidad Dinámica de Secciones Públicas
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Habilitá o deshabilitá de forma granular cada sección intermedia del layout público.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={saveSecciones}
          disabled={saving}
          className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition flex items-center gap-2 cursor-pointer"
        >
          <span>💾</span> {saving ? 'Guardando...' : 'Guardar Visibilidad de Secciones'}
        </button>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex items-center justify-between text-xs text-amber-800">
          <span>⚠️ Tenés modificaciones pendientes de confirmación. Presioná <strong>&quot;Guardar Visibilidad de Secciones&quot;</strong> para persistirlas.</span>
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
          <strong className="block font-bold mb-0.5">Regla Institucional de Layout:</strong>
          Las secciones intermedias pueden encenderse o apagarse con impacto inmediato en el DOM.
          La <strong>Barra de Navegación (NAV)</strong> y el <strong>Pie de Página (FOOTER)</strong> se mantienen fijos permanentemente por integridad institucional y legal.
        </div>
      </div>

      {/* TARJETAS DE SECCIONES CON SWITCH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {secciones.map((sec) => (
          <div
            key={sec.key}
            className={`p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
              sec.enabled
                ? 'bg-white border-gray-200 shadow-xs'
                : 'bg-gray-50/80 border-gray-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-gray-900">{sec.nombre}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sec.enabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {sec.enabled ? '🟢 Visible en el DOM' : '⚪ Oculto en el DOM'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{sec.descripcion}</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={sec.enabled}
                onChange={() => toggleSeccion(sec.key)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
