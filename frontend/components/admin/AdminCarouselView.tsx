'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export interface CarouselSlide {
  id: string;
  tipo: 'imagen' | 'video';
  url: string;
  titulo?: string;
  descripcion?: string;
  duracion_ms: number;
  orden: number;
  es_default: boolean;
  activo: boolean;
}

interface Props {
  onNotice: (msg: string) => void;
}

export default function AdminCarouselView({ onNotice }: Props) {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [uploadingSlideMedia, setUploadingSlideMedia] = useState(false);

  const loadCarousel = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/frontend-cms/carousel');
      const data = await res.json();
      if (data.ok && Array.isArray(data.slides)) {
        setSlides(data.slides);
      }
    } catch (err: any) {
      console.error('Error cargando carrusel:', err);
      onNotice(`Error cargando carrusel: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCarousel();
  }, []);

  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    const copy = [...slides];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);

    const reorderedIds = copy.map((s) => s.id);
    setSlides(copy.map((s, idx) => ({ ...s, orden: idx + 1 })));

    try {
      await fetch('/api/admin/frontend-cms/carousel/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideIds: reorderedIds }),
      });
      window.dispatchEvent(new CustomEvent('carousel-updated'));
    } catch (err) {
      console.error('Error reordenando slides:', err);
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar slide?',
      text: 'Esta diapositiva multimedia se eliminará del carrusel.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/admin/frontend-cms/carousel/${slideId}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.ok) {
          setSlides(data.slides);
          Swal.fire('Eliminado', 'Slide eliminado exitosamente.', 'success');
          window.dispatchEvent(new CustomEvent('carousel-updated'));
        }
      } catch (err: any) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const handleSetDefaultSlide = async (slideId: string) => {
    try {
      const res = await fetch(`/api/admin/frontend-cms/carousel/${slideId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ es_default: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setSlides(data.slides);
        onNotice('Slide predeterminado inicial actualizado.');
        window.dispatchEvent(new CustomEvent('carousel-updated'));
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleSaveSlideModal = async () => {
    if (!editingSlide) return;
    if (!editingSlide.url.trim()) {
      Swal.fire('URL Requerida', 'Ingresá una URL o subí un archivo para el slide.', 'warning');
      return;
    }

    try {
      const isNew = editingSlide.id.startsWith('new-');
      const endpoint = isNew
        ? '/api/admin/frontend-cms/carousel'
        : `/api/admin/frontend-cms/carousel/${editingSlide.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSlide),
      });
      const data = await res.json();
      if (data.ok) {
        setSlides(data.slides);
        setIsSlideModalOpen(false);
        setEditingSlide(null);
        Swal.fire({
          icon: 'success',
          title: isNew ? 'Slide Creado' : 'Slide Actualizado',
          timer: 1500,
          showConfirmButton: false,
        });
        window.dispatchEvent(new CustomEvent('carousel-updated'));
      } else {
        throw new Error(data.message || 'Error guardando slide.');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleSlideMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSlide) return;

    if (file.size > 25 * 1024 * 1024) {
      Swal.fire('Archivo muy pesado', 'El archivo no debe exceder los 25 MB.', 'warning');
      return;
    }

    setUploadingSlideMedia(true);
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
          const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4');
          setEditingSlide((prev) =>
            prev
              ? {
                  ...prev,
                  url: data.url,
                  tipo: isVideo ? 'video' : 'imagen',
                }
              : null
          );
          onNotice(`Medio "${file.name}" cargado con éxito.`);
        } else {
          throw new Error(data.message || 'Error al procesar archivo.');
        }
        setUploadingSlideMedia(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadingSlideMedia(false);
      Swal.fire('Error de subida', err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
        <div className="animate-spin text-3xl mb-3">⏳</div>
        <p className="text-sm">Cargando diapositivas del carrusel multimedia...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR DE ACCIONES */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xl">🎬</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Administración del Carrousel Multimedia
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Subí imágenes y videos sin límite, configurá temporizadores individuales y designá el slide inicial predeterminado.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingSlide({
              id: `new-${Date.now()}`,
              tipo: 'imagen',
              url: '',
              titulo: '',
              descripcion: '',
              duracion_ms: 5000,
              orden: slides.length + 1,
              es_default: slides.length === 0,
              activo: true,
            });
            setIsSlideModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>➕</span> Nuevo Slide Multimedia
        </button>
      </div>

      {/* LISTA DE SLIDES */}
      <div className="space-y-3">
        {slides.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-dashed border-gray-300">
            <p className="text-sm">No hay slides cargados en el carrusel.</p>
          </div>
        ) : (
          slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`bg-white rounded-2xl border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs ${
                slide.activo ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-24 h-16 rounded-xl bg-gray-100 overflow-hidden relative flex-shrink-0 flex items-center justify-center border border-gray-200">
                  {slide.tipo === 'video' ? (
                    <div className="flex flex-col items-center text-rose-600 text-xs font-bold">
                      <span className="text-xl">🎥</span>
                      <span>Video</span>
                    </div>
                  ) : (
                    <img
                      src={slide.url}
                      alt={slide.titulo || 'Slide'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/IFTS_27/hero/Imagen del header.jpg';
                      }}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-900 truncate">
                      {slide.titulo || `Slide #${slide.orden}`}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        slide.tipo === 'video' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {slide.tipo === 'video' ? '🎥 Video' : '🖼️ Imagen'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      ⏱️ {Math.round(slide.duracion_ms / 1000)} seg
                    </span>
                    {slide.es_default && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        ⭐ Slide Inicial Predeterminado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {slide.descripcion || slide.url}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                {!slide.es_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefaultSlide(slide.id)}
                    className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition cursor-pointer"
                    title="Designar como el slide que se muestra primero al abrir la página"
                  >
                    ⭐ Hacer Inicial
                  </button>
                )}

                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveSlide(idx, 'up')}
                  className={`p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition cursor-pointer ${
                    idx === 0 ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                  title="Subir orden"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={idx === slides.length - 1}
                  onClick={() => handleMoveSlide(idx, 'down')}
                  className={`p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition cursor-pointer ${
                    idx === slides.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                  title="Bajar orden"
                >
                  ▼
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingSlide({ ...slide });
                    setIsSlideModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSlide(slide.id)}
                  className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE EDICIÓN DE SLIDE DEL CARRUSEL */}
      {isSlideModalOpen && editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900">
                {editingSlide.id.startsWith('new-') ? '➕ Nuevo Slide del Carrusel' : '✏️ Editar Slide del Carrusel'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSlideModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tipo de Medio</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="slideTipo"
                      value="imagen"
                      checked={editingSlide.tipo === 'imagen'}
                      onChange={() => setEditingSlide({ ...editingSlide, tipo: 'imagen' })}
                    />
                    <span>🖼️ Imagen</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="slideTipo"
                      value="video"
                      checked={editingSlide.tipo === 'video'}
                      onChange={() => setEditingSlide({ ...editingSlide, tipo: 'video' })}
                    />
                    <span>🎥 Video (MP4 o Embed)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">URL o Archivo Multimedia <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingSlide.url}
                  onChange={(e) => setEditingSlide({ ...editingSlide, url: e.target.value })}
                  placeholder={editingSlide.tipo === 'video' ? 'https://youtube.com/embed/... o /uploads/video.mp4' : 'https://... o /uploads/imagen.jpg'}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <input
                  type="file"
                  accept={editingSlide.tipo === 'video' ? 'video/mp4,video/webm' : 'image/*'}
                  onChange={handleSlideMediaUpload}
                  className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 cursor-pointer"
                />
                {uploadingSlideMedia && <p className="text-blue-600 text-[11px] mt-1 animate-pulse">Subiendo archivo multimedia...</p>}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Título del Slide (Opcional)</label>
                <input
                  type="text"
                  value={editingSlide.titulo || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, titulo: e.target.value })}
                  placeholder="Ej: Auditorio Polo Saavedra"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  value={editingSlide.descripcion || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, descripcion: e.target.value })}
                  placeholder="Texto explicativo al pie del slide..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Temporizador (Segundos)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={Math.round(editingSlide.duracion_ms / 1000)}
                    onChange={(e) => {
                      const secs = Math.max(1, parseInt(e.target.value, 10) || 5);
                      setEditingSlide({ ...editingSlide, duracion_ms: secs * 1000 });
                    }}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  />
                  <span className="text-[10px] text-gray-400">Permanencia en autoplay</span>
                </div>

                <div className="flex flex-col justify-center space-y-2 pt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={editingSlide.es_default}
                      onChange={(e) => setEditingSlide({ ...editingSlide, es_default: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    <span>⭐ Slide Inicial</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={editingSlide.activo}
                      onChange={(e) => setEditingSlide({ ...editingSlide, activo: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Slide Activo</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsSlideModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSlideModal}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition cursor-pointer"
              >
                Guardar Slide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
