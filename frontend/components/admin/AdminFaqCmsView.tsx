'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';

export interface FaqEnlace {
  id: string;
  titulo: string;
  url: string;
}

export interface FaqArchivo {
  id: string;
  nombre: string;
  url: string;
  tamano?: string;
}

export interface FaqMultimedia {
  id: string;
  tipo: 'imagen' | 'video';
  url: string;
  titulo?: string;
}

export interface FaqItem {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  activo: boolean;
  orden: number;
  enlaces?: FaqEnlace[];
  archivos?: FaqArchivo[];
  multimedia?: FaqMultimedia[];
}

interface Props {
  onNotice: (msg: string) => void;
}

const CATEGORIAS_SUGERIDAS = [
  'General',
  'Inscripción',
  'Sede y Acceso',
  'Acreditación',
  'Certificados',
  'Propuestas',
  'Modalidades',
  'Cronograma',
];

const PDF_PRESETS = [
  { path: '/PDF/1 Aula Abierta - demostraciones aplicadas.pdf', label: '1. Aula Abierta - Demostraciones aplicadas.pdf' },
  { path: '/PDF/2 Muestra permanente - Stands.pdf', label: '2. Muestra permanente - Stands.pdf' },
  { path: '/PDF/3 Presentaciones académico-aplicadas.pdf', label: '3. Presentaciones académico - aplicadas.pdf' },
  { path: '/PDF/4 Proyectos y producciones estudiantiles.pdf', label: '4. Proyectos y producciones estudiantiles.pdf' },
  { path: '/PDF/5 Talentos ETS.pdf', label: '5. Talentos ETS.pdf' },
];

function crearId(prefijo: string) {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getEmbedVideoUrl(url?: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  }
  return null;
}

export default function AdminFaqCmsView({ onNotice }: Props) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');

  // Modal de Creación / Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [modalTab, setModalTab] = useState<'texto' | 'enlaces' | 'archivos' | 'multimedia' | 'preview'>('texto');
  const [savingItem, setSavingItem] = useState(false);

  // Formulario temporal
  const [formData, setFormData] = useState<{
    pregunta: string;
    respuesta: string;
    categoria: string;
    activo: boolean;
    enlaces: FaqEnlace[];
    archivos: FaqArchivo[];
    multimedia: FaqMultimedia[];
  }>({
    pregunta: '',
    respuesta: '',
    categoria: 'General',
    activo: true,
    enlaces: [],
    archivos: [],
    multimedia: [],
  });

  // Estados temporales para agregar enlaces
  const [nuevoEnlaceTitulo, setNuevoEnlaceTitulo] = useState('');
  const [nuevoEnlaceUrl, setNuevoEnlaceUrl] = useState('');

  // Estados temporales para archivos
  const [subiendoPdf, setSubiendoPdf] = useState(false);
  const inputPdfRef = useRef<HTMLInputElement>(null);

  // Estados temporales para multimedia
  const [nuevoMediaTipo, setNuevoMediaTipo] = useState<'imagen' | 'video'>('imagen');
  const [nuevoMediaUrl, setNuevoMediaUrl] = useState('');
  const [nuevoMediaTitulo, setNuevoMediaTitulo] = useState('');
  const [subiendoImagenMedia, setSubiendoImagenMedia] = useState(false);
  const inputMediaRef = useRef<HTMLInputElement>(null);

  // Cargar FAQs desde el backend
  const loadFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/frontend-cms/faq');
      const data = await res.json();
      if (data.ok && Array.isArray(data.faqs)) {
        setFaqs(data.faqs);
      } else {
        throw new Error(data.message || 'Error al obtener FAQs');
      }
    } catch (err: any) {
      console.error(err);
      onNotice(`Error cargando FAQs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  // Categorías presentes
  const availableCategorias = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => {
      if (f.categoria) set.add(f.categoria);
    });
    return Array.from(set);
  }, [faqs]);

  // Lista filtrada
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch =
        faq.pregunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.respuesta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.categoria.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        selectedCategoria === 'TODAS' || faq.categoria.toLowerCase() === selectedCategoria.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [faqs, searchTerm, selectedCategoria]);

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setEditingFaq(null);
    setFormData({
      pregunta: '',
      respuesta: '',
      categoria: 'General',
      activo: true,
      enlaces: [],
      archivos: [],
      multimedia: [],
    });
    setModalTab('texto');
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (faq: FaqItem) => {
    setEditingFaq(faq);
    setFormData({
      pregunta: faq.pregunta,
      respuesta: faq.respuesta,
      categoria: faq.categoria || 'General',
      activo: faq.activo,
      enlaces: Array.isArray(faq.enlaces) ? [...faq.enlaces] : [],
      archivos: Array.isArray(faq.archivos) ? [...faq.archivos] : [],
      multimedia: Array.isArray(faq.multimedia) ? [...faq.multimedia] : [],
    });
    setModalTab('texto');
    setIsModalOpen(true);
  };

  // Subir Archivo PDF adjunto
  const handleSubirPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      Swal.fire('Archivo muy pesado', 'El archivo no debe exceder los 15 MB.', 'warning');
      return;
    }

    setSubiendoPdf(true);
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
          const nuevoArchivo: FaqArchivo = {
            id: crearId('arc'),
            nombre: file.name,
            url: data.url,
            tamano: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          };
          setFormData((prev) => ({
            ...prev,
            archivos: [...prev.archivos, nuevoArchivo],
          }));
          onNotice(`Archivo "${file.name}" cargado exitosamente.`);
        } else {
          throw new Error(data.message || 'Error al subir PDF');
        }
        setSubiendoPdf(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setSubiendoPdf(false);
      Swal.fire('Error al subir PDF', err.message, 'error');
    }
  };

  // Subir Imagen para Multimedia
  const handleSubirImagenMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoImagenMedia(true);
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
          const nuevoMedia: FaqMultimedia = {
            id: crearId('med'),
            tipo: 'imagen',
            url: data.url,
            titulo: file.name.replace(/\.[^/.]+$/, ''),
          };
          setFormData((prev) => ({
            ...prev,
            multimedia: [...prev.multimedia, nuevoMedia],
          }));
          onNotice(`Imagen multimedia "${file.name}" subida.`);
        } else {
          throw new Error(data.message || 'Error al subir imagen');
        }
        setSubiendoImagenMedia(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setSubiendoImagenMedia(false);
      Swal.fire('Error al subir imagen', err.message, 'error');
    }
  };

  // Agregar Enlace URL
  const handleAgregarEnlace = () => {
    if (!nuevoEnlaceUrl.trim()) {
      Swal.fire('Falta la URL', 'Ingresá una URL válida (ej: https://...).', 'warning');
      return;
    }
    const nuevo: FaqEnlace = {
      id: crearId('enl'),
      titulo: nuevoEnlaceTitulo.trim() || nuevoEnlaceUrl.trim(),
      url: nuevoEnlaceUrl.trim(),
    };
    setFormData((prev) => ({
      ...prev,
      enlaces: [...prev.enlaces, nuevo],
    }));
    setNuevoEnlaceTitulo('');
    setNuevoEnlaceUrl('');
  };

  // Agregar Video / URL Multimedia
  const handleAgregarMediaUrl = () => {
    if (!nuevoMediaUrl.trim()) {
      Swal.fire('Falta la URL', 'Ingresá un enlace de video o imagen válido.', 'warning');
      return;
    }
    const nuevo: FaqMultimedia = {
      id: crearId('med'),
      tipo: nuevoMediaTipo,
      url: nuevoMediaUrl.trim(),
      titulo: nuevoMediaTitulo.trim() || undefined,
    };
    setFormData((prev) => ({
      ...prev,
      multimedia: [...prev.multimedia, nuevo],
    }));
    setNuevoMediaUrl('');
    setNuevoMediaTitulo('');
  };

  // Guardar (Crear o Actualizar)
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pregunta.trim() || !formData.respuesta.trim()) {
      Swal.fire('Campos requeridos', 'Por favor ingresá tanto la pregunta como la respuesta.', 'warning');
      return;
    }

    setSavingItem(true);
    try {
      const isEditing = !!editingFaq;
      const url = isEditing
        ? `/api/admin/frontend-cms/faq/${editingFaq.id}`
        : '/api/admin/frontend-cms/faq';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.message || 'Error al guardar');

      setFaqs(data.faqs);
      setIsModalOpen(false);
      window.dispatchEvent(new CustomEvent('faq-updated'));
      onNotice(isEditing ? 'Pregunta frecuente actualizada.' : 'Pregunta frecuente creada exitosamente.');
      Swal.fire({
        icon: 'success',
        title: isEditing ? 'Pregunta Actualizada' : 'Pregunta Creada',
        text: 'Los cambios y sus contenidos se reflejan en tiempo real en el portal.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSavingItem(false);
    }
  };

  // Conmutar activo/inactivo directamente
  const handleToggleActive = async (faq: FaqItem) => {
    const updatedStatus = !faq.activo;
    // Actualización optimista
    setFaqs((prev) =>
      prev.map((f) => (f.id === faq.id ? { ...f, activo: updatedStatus } : f))
    );

    try {
      const res = await fetch(`/api/admin/frontend-cms/faq/${faq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: updatedStatus }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || 'Error al actualizar visibilidad');
      window.dispatchEvent(new CustomEvent('faq-updated'));
      onNotice(
        updatedStatus
          ? `Pregunta "${faq.pregunta.substring(0, 30)}..." visible en portal.`
          : `Pregunta "${faq.pregunta.substring(0, 30)}..." ocultada.`
      );
    } catch (err: any) {
      // Revertir optimismo
      setFaqs((prev) =>
        prev.map((f) => (f.id === faq.id ? { ...f, activo: faq.activo } : f))
      );
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Mover arriba / abajo
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const newFaqs = [...faqs];
    const [moved] = newFaqs.splice(index, 1);
    newFaqs.splice(targetIndex, 0, moved);

    setFaqs(newFaqs);

    try {
      const ids = newFaqs.map((f) => f.id);
      const res = await fetch('/api/admin/frontend-cms/faq/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || 'Error al guardar nuevo orden');
      setFaqs(data.faqs);
      window.dispatchEvent(new CustomEvent('faq-updated'));
      onNotice('Orden de preguntas frecuentes actualizado.');
    } catch (err: any) {
      setFaqs(faqs);
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Eliminar FAQ
  const handleDelete = (faq: FaqItem) => {
    Swal.fire({
      title: '¿Eliminar esta pregunta?',
      html: `<p class="text-sm text-gray-600 mb-2 font-medium">"${faq.pregunta}"</p><p class="text-xs text-red-500">Se eliminará la tarjeta y todos sus archivos, enlaces y multimedia.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/admin/frontend-cms/faq/${faq.id}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.message || 'Error al eliminar');

          setFaqs(data.faqs);
          window.dispatchEvent(new CustomEvent('faq-updated'));
          onNotice('Pregunta frecuente eliminada.');
          Swal.fire('Eliminada', 'La pregunta frecuente fue eliminada correctamente.', 'success');
        } catch (err: any) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    });
  };

  // Restablecer preguntas oficiales
  const handleReset = () => {
    Swal.fire({
      title: '¿Restablecer FAQs oficiales?',
      text: 'Se restablecerán las 11 preguntas oficiales con sus documentos, enlaces y multimedia integrados.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, restablecer',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch('/api/admin/frontend-cms/faq/reset', {
            method: 'POST',
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.message || 'Error al restablecer');

          setFaqs(data.faqs);
          window.dispatchEvent(new CustomEvent('faq-updated'));
          onNotice('Preguntas frecuentes oficiales restablecidas.');
          Swal.fire('Restablecido', 'Se han restaurado las 11 preguntas oficiales con éxito.', 'success');
        } catch (err: any) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    });
  };

  const totalActivas = faqs.filter((f) => f.activo).length;

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-xl">❓</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Gestión de Preguntas Frecuentes (FAQ)
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Administrá el catálogo de dudas comunes: visibilidad individual por tarjeta, textos explicativos, enlaces (URLs), PDFs y multimedia interactiva.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <a
            href="/contacto#faq"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5"
            title="Ver sección en una nueva pestaña"
          >
            <span>🌐</span> Ver en Portal
          </a>

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition flex items-center gap-1.5 cursor-pointer"
            title="Restaura las 11 preguntas oficiales con sus contenidos"
          >
            <span>🔄</span> Restablecer Oficiales
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>➕</span> Nueva Pregunta
          </button>
        </div>
      </div>

      {/* MÉTRICAS & FILTROS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Chips de estado */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
            Total: <strong className="text-gray-900 font-bold">{faqs.length}</strong>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-700">
            Públicas: <strong className="text-emerald-900 font-bold">{totalActivas}</strong>
          </div>
          <div className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-xs font-medium text-gray-600">
            Ocultas: <strong className="text-gray-800 font-bold">{faqs.length - totalActivas}</strong>
          </div>
        </div>

        {/* Buscador y Categorías */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="TODAS">Todas las categorías</option>
            {availableCategorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="relative flex-1 md:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar pregunta o contenido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* LISTADO DE PREGUNTAS FRECUENTES */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-3 text-xs text-gray-500 font-medium">Cargando preguntas frecuentes...</p>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <span className="text-4xl">📂</span>
          <h3 className="mt-2 text-sm font-bold text-gray-800">No se encontraron preguntas frecuentes</h3>
          <p className="mt-1 text-xs text-gray-500">
            {searchTerm || selectedCategoria !== 'TODAS'
              ? 'Probá ajustando los términos de búsqueda o el filtro de categoría.'
              : 'El catálogo está vacío. Podés agregar una nueva o restaurar las oficiales.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const originalIndex = faqs.findIndex((f) => f.id === faq.id);
            const isFirst = originalIndex === 0;
            const isLast = originalIndex === faqs.length - 1;

            const cantEnlaces = faq.enlaces?.length || 0;
            const cantArchivos = faq.archivos?.length || 0;
            const cantMedia = faq.multimedia?.length || 0;

            return (
              <div
                key={faq.id}
                className={`bg-white rounded-2xl border p-4.5 transition shadow-2xs hover:shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  faq.activo ? 'border-gray-200' : 'border-gray-300 bg-gray-50/70 opacity-80'
                }`}
              >
                {/* Columna Izquierda: Orden & Datos */}
                <div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold font-mono">
                      {originalIndex + 1}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMove(originalIndex, 'up')}
                        className={`w-6 h-5 rounded flex items-center justify-center text-[10px] ${
                          isFirst ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 cursor-pointer'
                        }`}
                        title="Subir posición"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMove(originalIndex, 'down')}
                        className={`w-6 h-5 rounded flex items-center justify-center text-[10px] ${
                          isLast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 cursor-pointer'
                        }`}
                        title="Bajar posición"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {faq.categoria || 'General'}
                      </span>
                      {faq.activo ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          Visible en Portal
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-200 text-gray-700">
                          Oculta
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 leading-snug">
                      {faq.pregunta}
                    </h3>

                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                      {faq.respuesta}
                    </p>

                    {/* Badges de Contenidos Anexos */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {cantEnlaces > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                          <span>🔗</span> {cantEnlaces} {cantEnlaces === 1 ? 'URL' : 'URLs'}
                        </span>
                      )}
                      {cantArchivos > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                          <span>📄</span> {cantArchivos} {cantArchivos === 1 ? 'PDF' : 'PDFs'}
                        </span>
                      )}
                      {cantMedia > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1">
                          <span>🎬</span> {cantMedia} Multimedia
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Acciones */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  {/* Switch Activo / Oculto Independiente */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(faq)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      faq.activo
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                    title={faq.activo ? 'Click para ocultar independientemente de la página' : 'Click para mostrar en la página'}
                  >
                    <span>{faq.activo ? '👁️' : '🙈'}</span>
                    <span>{faq.activo ? 'Pública' : 'Oculta'}</span>
                  </button>

                  {/* Editar Contenido Completo */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(faq)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 transition border border-gray-200 cursor-pointer flex items-center gap-1"
                    title="Editar texto, URLs, PDFs y multimedia"
                  >
                    <span>✏️</span>
                    <span>Editar Contenido</span>
                  </button>

                  {/* Eliminar */}
                  <button
                    type="button"
                    onClick={() => handleDelete(faq)}
                    className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition border border-gray-200 cursor-pointer flex items-center justify-center"
                    title="Eliminar tarjeta de pregunta"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL INTEGRAL DE GESTIÓN DE CONTENIDO (TEXTO, URLs, PDFs, MULTIMEDIA) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Cabecera del Modal */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl text-lg">
                  {editingFaq ? '✏️' : '➕'}
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {editingFaq ? 'Editar Pregunta y Contenidos' : 'Nueva Pregunta Frecuente'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Gestioná el texto explicativo y enriquecelo con enlaces externos, documentos PDF y multimedia.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Pestañas internas del Modal */}
            <div className="flex border-b border-gray-200 bg-white px-6 pt-2 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalTab('texto')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'texto'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>📝</span>
                <span>Texto & Datos</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('enlaces')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'enlaces'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>🔗</span>
                <span>URLs ({formData.enlaces.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('archivos')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'archivos'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>📄</span>
                <span>PDFs ({formData.archivos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('multimedia')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'multimedia'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>🎬</span>
                <span>Multimedia ({formData.multimedia.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('preview')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ml-auto ${
                  modalTab === 'preview'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>👁️</span>
                <span>Vista Previa</span>
              </button>
            </div>

            {/* Contenido del Formulario según subpestaña */}
            <form onSubmit={handleSaveFaq} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* SUBPESTAÑA 1: TEXTO & DATOS */}
              {modalTab === 'texto' && (
                <div className="space-y-4">
                  {/* Categoría */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Categoría
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {CATEGORIAS_SUGERIDAS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, categoria: sug }))}
                          className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition cursor-pointer ${
                            formData.categoria === sug
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={formData.categoria}
                      onChange={(e) => setFormData((prev) => ({ ...prev, categoria: e.target.value }))}
                      placeholder="Categoría..."
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Pregunta */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Pregunta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.pregunta}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pregunta: e.target.value }))}
                      placeholder="Ej: ¿Dónde se realiza el congreso?"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  {/* Respuesta */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Respuesta Principal <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.respuesta}
                      onChange={(e) => setFormData((prev) => ({ ...prev, respuesta: e.target.value }))}
                      placeholder="Redactá una respuesta clara, concisa y detallada..."
                      required
                      rows={6}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    />
                  </div>

                  {/* Switch de Visibilidad */}
                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={(e) => setFormData((prev) => ({ ...prev, activo: e.target.checked }))}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-800">
                          Tarjeta visible públicamente en el Portal
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Si se desmarca, se mantendrá guardada en el CMS pero no se mostrará a los visitantes.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* SUBPESTAÑA 2: URLs / ENLACES WEB */}
              {modalTab === 'enlaces' && (
                <div className="space-y-4">
                  <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900">
                    <p className="font-bold">Enlaces y URLs de Interés</p>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      Podés asociar enlaces a sitios web, formularios externos, ubicaciones en mapas o secciones internas del portal.
                    </p>
                  </div>

                  {/* Lista de enlaces existentes */}
                  {formData.enlaces.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">
                      No hay enlaces asociados a esta pregunta.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {formData.enlaces.map((enlace, idx) => (
                        <div key={enlace.id || idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                          <div className="min-w-0 flex-1 pr-2">
                            <strong className="text-gray-900 block truncate">{enlace.titulo}</strong>
                            <a href={enlace.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-[11px] truncate block">
                              {enlace.url} ↗
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                enlaces: prev.enlaces.filter((_, i) => i !== idx),
                              }));
                            }}
                            className="text-red-500 hover:text-red-700 font-bold p-1 cursor-pointer"
                            title="Quitar enlace"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar nuevo enlace */}
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <span className="block text-xs font-bold text-gray-700">Agregar nuevo enlace</span>
                    <input
                      type="text"
                      placeholder="Título o texto del botón (ej: Ver mapa en Google)"
                      value={nuevoEnlaceTitulo}
                      onChange={(e) => setNuevoEnlaceTitulo(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300"
                    />
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://maps.google.com/..."
                        value={nuevoEnlaceUrl}
                        onChange={(e) => setNuevoEnlaceUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleAgregarEnlace}
                        className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition cursor-pointer"
                      >
                        ➕ Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBPESTAÑA 3: ARCHIVOS PDF */}
              {modalTab === 'archivos' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-900">
                    <p className="font-bold">Archivos PDF y Documentos Descargables</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Subí archivos PDF o asigná documentos oficiales existentes para que los visitantes puedan descargarlos directamente al abrir la pregunta.
                    </p>
                  </div>

                  {/* Lista de archivos existentes */}
                  {formData.archivos.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">
                      No hay archivos PDF adjuntos a esta pregunta.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {formData.archivos.map((arc, idx) => (
                        <div key={arc.id || idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                            <span className="p-1.5 bg-red-100 text-red-700 rounded-lg text-sm">📄</span>
                            <div className="truncate">
                              <strong className="text-gray-900 block truncate">{arc.nombre}</strong>
                              <span className="text-[10px] text-gray-500 font-mono truncate block">{arc.url} {arc.tamano && `· ${arc.tamano}`}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={arc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                            >
                              Ver
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  archivos: prev.archivos.filter((_, i) => i !== idx),
                                }));
                              }}
                              className="text-red-500 hover:text-red-700 font-bold p-1 cursor-pointer"
                              title="Quitar archivo"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Opciones de carga de PDF */}
                  <div className="border-t border-gray-100 pt-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => inputPdfRef.current?.click()}
                        disabled={subiendoPdf}
                        className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer flex items-center gap-2"
                      >
                        <span>📥</span>
                        <span>{subiendoPdf ? 'Subiendo PDF...' : 'Subir nuevo archivo PDF'}</span>
                      </button>
                      <input
                        ref={inputPdfRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleSubirPdf}
                      />
                    </div>

                    {/* Presets oficiales de PDF */}
                    <div>
                      <span className="block text-[11px] font-bold text-gray-500 mb-1.5">O vincular documento existente:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PDF_PRESETS.map((p) => (
                          <button
                            key={p.path}
                            type="button"
                            onClick={() => {
                              if (formData.archivos.some((a) => a.url === p.path)) return;
                              setFormData((prev) => ({
                                ...prev,
                                archivos: [
                                  ...prev.archivos,
                                  { id: crearId('arc'), nombre: p.label, url: p.path },
                                ],
                              }));
                            }}
                            className="px-2 py-1 text-[10px] rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition cursor-pointer flex items-center gap-1"
                          >
                            <span>📎</span>
                            <span className="truncate max-w-[200px]">{p.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBPESTAÑA 4: MULTIMEDIA (IMÁGENES & VIDEOS) */}
              {modalTab === 'multimedia' && (
                <div className="space-y-4">
                  <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-100 text-xs text-purple-900">
                    <p className="font-bold">Multimedia (Imágenes y Videos)</p>
                    <p className="text-[11px] text-purple-800 mt-0.5">
                      Ilustrá la respuesta con capturas, planos de la sede o videos explicativos de YouTube/Vimeo.
                    </p>
                  </div>

                  {/* Lista de multimedia */}
                  {formData.multimedia.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">
                      No hay elementos multimedia asignados a esta pregunta.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {formData.multimedia.map((media, idx) => (
                        <div key={media.id || idx} className="relative group rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex flex-col">
                          <div className="aspect-video w-full bg-black/5 flex items-center justify-center overflow-hidden">
                            {media.tipo === 'video' ? (
                              <div className="text-center p-2">
                                <span className="text-2xl block mb-1">🎬</span>
                                <span className="text-[10px] text-gray-600 font-mono truncate block max-w-[150px]">{media.url}</span>
                              </div>
                            ) : (
                              <img src={media.url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="p-2 flex items-center justify-between bg-white text-[11px]">
                            <span className="font-semibold text-gray-800 truncate">{media.titulo || media.tipo}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  multimedia: prev.multimedia.filter((_, i) => i !== idx),
                                }));
                              }}
                              className="text-red-500 hover:text-red-700 font-bold px-1 cursor-pointer"
                              title="Quitar"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Carga de multimedia */}
                  <div className="border-t border-gray-100 pt-3 space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => inputMediaRef.current?.click()}
                        disabled={subiendoImagenMedia}
                        className="px-3.5 py-2 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl transition cursor-pointer"
                      >
                        {subiendoImagenMedia ? 'Subiendo imagen...' : '📸 Subir Imagen'}
                      </button>
                      <input
                        ref={inputMediaRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
                        className="hidden"
                        onChange={handleSubirImagenMedia}
                      />
                    </div>

                    {/* Agregar por URL de Video o Imagen */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <span className="block text-xs font-bold text-gray-700">O agregar por enlace / video de YouTube:</span>
                      <div className="flex gap-2">
                        <select
                          value={nuevoMediaTipo}
                          onChange={(e) => setNuevoMediaTipo(e.target.value as any)}
                          className="px-2 py-1.5 text-xs rounded-xl border border-gray-300"
                        >
                          <option value="video">Video (YouTube)</option>
                          <option value="imagen">Imagen (URL)</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Título opcional..."
                          value={nuevoMediaTitulo}
                          onChange={(e) => setNuevoMediaTitulo(e.target.value)}
                          className="w-1/3 px-3 py-1.5 text-xs rounded-xl border border-gray-300"
                        />
                        <input
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={nuevoMediaUrl}
                          onChange={(e) => setNuevoMediaUrl(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handleAgregarMediaUrl}
                          className="px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition cursor-pointer"
                        >
                          ➕ Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBPESTAÑA 5: VISTA PREVIA EN VIVO */}
              {modalTab === 'preview' && (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {formData.categoria}
                    </span>
                    <h2 className="text-base font-extrabold text-[var(--color-azul-claro)] mt-1.5">
                      {formData.pregunta || 'Pregunta de ejemplo'}
                    </h2>
                    <p className="text-xs text-gray-700 mt-2.5 leading-relaxed whitespace-pre-line border-t border-gray-100 pt-3">
                      {formData.respuesta || 'Respuesta de ejemplo...'}
                    </p>

                    {/* Preview Multimedia */}
                    {formData.multimedia.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                        <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Multimedia:</span>
                        {formData.multimedia.map((m, idx) => {
                          const embed = m.tipo === 'video' ? getEmbedVideoUrl(m.url) : null;
                          return (
                            <div key={idx} className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                              {embed ? (
                                <div className="aspect-video w-full">
                                  <iframe src={embed} title={m.titulo || 'Video'} className="w-full h-full" allowFullScreen />
                                </div>
                              ) : (
                                <img src={m.url} alt={m.titulo || ''} className="w-full max-h-56 object-contain p-2" />
                              )}
                              {m.titulo && <p className="p-2 text-xs text-gray-600 text-center font-medium">{m.titulo}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Preview PDFs */}
                    {formData.archivos.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                        <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Documentos para descargar:</span>
                        <div className="flex flex-wrap gap-2">
                          {formData.archivos.map((arc, idx) => (
                            <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
                              <span>📥</span>
                              <span>{arc.nombre}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview Enlaces */}
                    {formData.enlaces.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                        <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Enlaces relacionados:</span>
                        <div className="flex flex-wrap gap-2">
                          {formData.enlaces.map((enl, idx) => (
                            <div key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 font-bold">
                              <span>🔗</span>
                              <span>{enl.titulo}</span>
                              <span className="text-[10px]">↗</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botones de acción del pie */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingItem ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>{editingFaq ? 'Guardar Cambios y Contenidos' : 'Crear Pregunta'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
