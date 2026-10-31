'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export interface FrontendHeroConfig {
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundOverlayOpacity: number;
  logoUrl: string | null;
  subtitle: string;
  title: string;
  address: string;
  ctaButtonText: string;
  ctaButtonUrl: string;
  mostrarLogo: boolean;
  mostrarMiscelaneas: boolean;
  mostrarBotonCta: boolean;
  fontSizeTitle?: number;
  fontSizeSubtitle?: number;
  colorTitle?: string;
  colorSubtitle?: string;
  colorAddress?: string;
  elements?: any[];
}

const DEFAULT_HERO_STATE: FrontendHeroConfig = {
  backgroundColor: '#1D3343',
  backgroundImage: null,
  backgroundOverlayOpacity: 0.6,
  logoUrl: null,
  subtitle: '1° Congreso',
  title: 'Educación Técnica Superior',
  address: 'Universidad de la Ciudad de Buenos Aires · Tte. Gral. Juan Domingo Perón 802, CABA.',
  ctaButtonText: 'INSCRIBITE',
  ctaButtonUrl: '/login',
  mostrarLogo: true,
  mostrarMiscelaneas: true,
  mostrarBotonCta: true,
  fontSizeTitle: 48,
  fontSizeSubtitle: 24,
  colorTitle: '#ffffff',
  colorSubtitle: '#ffffff',
  colorAddress: '#ffffff',
  elements: [],
};

interface Props {
  onNotice: (msg: string) => void;
}

export default function AdminHeroWysiwygEditor({ onNotice }: Props) {
  const [hero, setHero] = useState<FrontendHeroConfig>(DEFAULT_HERO_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingField, setUploadingField] = useState<'background' | 'logo' | null>(null);

  const loadHero = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/frontend-cms/hero');
      const data = await res.json();
      if (data.ok && data.hero) {
        setHero(data.hero);
        setHasChanges(false);
      }
    } catch (err: any) {
      console.error('Error cargando Hero:', err);
      onNotice(`Error cargando Hero: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHero();
  }, []);

  const saveHero = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/frontend-cms/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero }),
      });
      const data = await res.json();
      if (data.ok) {
        setHasChanges(false);
        Swal.fire({
          icon: 'success',
          title: 'Hero Guardado',
          text: 'La configuración y contenidos del Hero se guardaron exitosamente en PostgreSQL y ya impactan en el portal público.',
          timer: 2000,
          showConfirmButton: false,
        });
        onNotice('Sección HERO actualizada con éxito.');
        window.dispatchEvent(new CustomEvent('hero-updated'));
      } else {
        throw new Error(data.message || 'Error al guardar el Hero.');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetHero = async () => {
    const result = await Swal.fire({
      title: '¿Restablecer Hero Oficial?',
      text: 'Se revertirán títulos, subtítulos, fondo y enlaces a los valores oficiales del congreso.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, restablecer',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f59e0b',
    });
    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/admin/frontend-cms/hero/reset', { method: 'POST' });
        const data = await res.json();
        if (data.ok && data.hero) {
          setHero(data.hero);
          setHasChanges(false);
          Swal.fire('Restablecido', 'El Hero ha sido restablecido a los valores oficiales.', 'success');
          window.dispatchEvent(new CustomEvent('hero-updated'));
        }
      } catch (err: any) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'backgroundImage' | 'logoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      Swal.fire('Archivo muy pesado', 'El archivo no debe exceder los 15 MB.', 'warning');
      return;
    }

    setUploadingField(field === 'backgroundImage' ? 'background' : 'logo');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileBase64 = reader.result as string;
        const res = await fetch('/api/admin/frontend-cms/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            fileBase64,
          }),
        });
        const data = await res.json();
        if (data.ok && data.url) {
          setHero((prev) => ({ ...prev, [field]: data.url }));
          setHasChanges(true);
          onNotice(`Activo "${file.name}" cargado exitosamente.`);
        } else {
          throw new Error(data.message || 'Error al procesar archivo.');
        }
        setUploadingField(null);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadingField(null);
      Swal.fire('Error de subida', err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
        <div className="animate-spin text-3xl mb-3">⏳</div>
        <p className="text-sm">Cargando editor WYSIWYG de la sección Hero...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR DE ACCIONES */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-xl">🎨</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Editor Visual WYSIWYG para Sección HERO
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Modificá fondos, tipografías, textos, logotipo y llamadas a la acción con vista previa interactiva en tiempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={resetHero}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔄</span> Restablecer Original
          </button>
          <button
            type="button"
            onClick={saveHero}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <span>💾</span> {saving ? 'Guardando en BD...' : 'Guardar Hero en Base de Datos'}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex items-center justify-between text-xs text-amber-800">
          <span>⚠️ Tenés modificaciones pendientes en el Hero. Recordá pulsar <strong>&quot;Guardar Hero en Base de Datos&quot;</strong> para persistirlas.</span>
          <button
            type="button"
            onClick={saveHero}
            className="bg-amber-600 text-white font-bold px-3 py-1 rounded-lg hover:bg-amber-700 cursor-pointer"
          >
            Guardar Ahora
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: CONTROLES DE EDICIÓN */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
            <span>🎛️</span> Propiedades y Contenidos
          </h3>

          {/* TÍTULO H1 */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Título Principal (H1)</label>
            <input
              type="text"
              value={hero.title}
              onChange={(e) => {
                setHero({ ...hero, title: e.target.value });
                setHasChanges(true);
              }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* SUBTÍTULO */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Subtítulo Superior</label>
            <input
              type="text"
              value={hero.subtitle}
              onChange={(e) => {
                setHero({ ...hero, subtitle: e.target.value });
                setHasChanges(true);
              }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* DIRECCIÓN / CUERPO */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Dirección / Texto Secundario</label>
            <textarea
              rows={2}
              value={hero.address}
              onChange={(e) => {
                setHero({ ...hero, address: e.target.value });
                setHasChanges(true);
              }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* COLORES Y MÁSCARA */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Color Fondo</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={hero.backgroundColor}
                  onChange={(e) => {
                    setHero({ ...hero, backgroundColor: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <span className="font-mono text-[11px] text-gray-600">{hero.backgroundColor}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Opacidad Máscara</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={hero.backgroundOverlayOpacity}
                  onChange={(e) => {
                    setHero({ ...hero, backgroundOverlayOpacity: parseFloat(e.target.value) });
                    setHasChanges(true);
                  }}
                  className="w-full accent-blue-600"
                />
                <span className="text-[11px] font-bold text-gray-600">{Math.round(hero.backgroundOverlayOpacity * 100)}%</span>
              </div>
            </div>
          </div>

          {/* IMAGEN DE FONDO */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block font-bold text-gray-700 mb-1">Imagen de Fondo (Background)</label>
            <input
              type="text"
              value={hero.backgroundImage || ''}
              placeholder="URL o subí un archivo abajo"
              onChange={(e) => {
                setHero({ ...hero, backgroundImage: e.target.value || null });
                setHasChanges(true);
              }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'backgroundImage')}
              className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 cursor-pointer"
            />
            {uploadingField === 'background' && <p className="text-blue-600 text-[11px] mt-1 animate-pulse">Subiendo imagen de fondo...</p>}
          </div>

          {/* LOGOTIPO */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-gray-700">Logotipo Institucional</label>
              <label className="flex items-center gap-1 cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={hero.mostrarLogo}
                  onChange={(e) => {
                    setHero({ ...hero, mostrarLogo: e.target.checked });
                    setHasChanges(true);
                  }}
                  className="rounded text-blue-600"
                />
                <span>Mostrar Logo</span>
              </label>
            </div>
            <input
              type="text"
              value={hero.logoUrl || ''}
              placeholder="URL del logo en SVG/PNG"
              onChange={(e) => {
                setHero({ ...hero, logoUrl: e.target.value || null });
                setHasChanges(true);
              }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'logoUrl')}
              className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 cursor-pointer"
            />
            {uploadingField === 'logo' && <p className="text-blue-600 text-[11px] mt-1 animate-pulse">Subiendo logotipo...</p>}
          </div>

          {/* BOTÓN CTA */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-gray-700">Botón de Llamada a la Acción (CTA)</label>
              <label className="flex items-center gap-1 cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={hero.mostrarBotonCta}
                  onChange={(e) => {
                    setHero({ ...hero, mostrarBotonCta: e.target.checked });
                    setHasChanges(true);
                  }}
                  className="rounded text-blue-600"
                />
                <span>Mostrar Botón</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={hero.ctaButtonText}
                placeholder="Texto botón"
                onChange={(e) => {
                  setHero({ ...hero, ctaButtonText: e.target.value });
                  setHasChanges(true);
                }}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={hero.ctaButtonUrl}
                placeholder="URL destino"
                onChange={(e) => {
                  setHero({ ...hero, ctaButtonUrl: e.target.value });
                  setHasChanges(true);
                }}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* MISCELÁNEAS */}
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
              <input
                type="checkbox"
                checked={hero.mostrarMiscelaneas}
                onChange={(e) => {
                  setHero({ ...hero, mostrarMiscelaneas: e.target.checked });
                  setHasChanges(true);
                }}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>Mostrar Misceláneas Geométricas (Triángulos, barra y líneas)</span>
            </label>
          </div>
        </div>

        {/* COLUMNA DERECHA: LIENZO WYSIWYG EN VIVO */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
            <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span>👁️</span> Previsualización en Vivo (WYSIWYG)
            </span>
            <span className="text-[11px] text-gray-500 font-mono">Reactivo en tiempo real</span>
          </div>

          <div
            className="relative flex min-h-[460px] flex-col items-center justify-center rounded-xl overflow-hidden p-8 text-center text-white border border-gray-300 shadow-inner flex-1"
            style={{ backgroundColor: hero.backgroundColor }}
          >
            {/* Imagen de fondo */}
            {hero.backgroundImage ? (
              <img
                src={hero.backgroundImage}
                alt="Fondo Hero"
                className="absolute inset-0 w-full h-full object-cover object-[70%_25%]"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 to-black/60 pointer-events-none" />
            )}

            {/* Máscara */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: `rgba(0,0,0,${hero.backgroundOverlayOpacity})`,
              }}
            />

            {/* Misceláneas simuladas */}
            {hero.mostrarMiscelaneas && (
              <>
                <div className="absolute top-2 left-2 text-[10px] text-white/40 font-mono tracking-widest pointer-events-none">
                  /// LÍNEAS HEADER ///
                </div>
                <div className="absolute bottom-0 left-0 h-1.5 w-1/3 bg-blue-500 pointer-events-none" />
              </>
            )}

            {/* Contenido centrado reactivo */}
            <div className="relative z-10 flex flex-col items-center gap-2 max-w-lg">
              {hero.mostrarLogo && (
                <div className="mb-2">
                  {hero.logoUrl ? (
                    <img
                      src={hero.logoUrl}
                      alt="Logotipo"
                      className="h-14 w-auto object-contain"
                    />
                  ) : (
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-xs rounded text-xs font-bold uppercase tracking-wider">
                      Logotipo Oficial
                    </div>
                  )}
                </div>
              )}

              <p
                className="text-base font-semibold tracking-wide"
                style={{ color: hero.colorSubtitle }}
              >
                {hero.subtitle}
              </p>

              <h2
                className="text-3xl font-extrabold tracking-tight leading-tight"
                style={{ color: hero.colorTitle }}
              >
                {hero.title}
              </h2>

              <p
                className="text-xs opacity-90 max-w-md mt-1"
                style={{ color: hero.colorAddress }}
              >
                {hero.address}
              </p>

              {hero.mostrarBotonCta && (
                <div className="mt-4">
                  <button
                    type="button"
                    className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-extrabold rounded-full text-xs uppercase tracking-wider shadow-lg transition"
                  >
                    {hero.ctaButtonText}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>Al guardar, el frontend público actualizará estos textos e imágenes de inmediato.</span>
            <span className="font-semibold text-emerald-600">✓ Conectado a PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
