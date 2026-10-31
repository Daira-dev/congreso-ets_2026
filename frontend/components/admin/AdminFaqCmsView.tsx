'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';

export interface FaqItem {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  activo: boolean;
  orden: number;
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

export default function AdminFaqCmsView({ onNotice }: Props) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');

  // Modal de Creación / Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // Formulario temporal
  const [formData, setFormData] = useState({
    pregunta: '',
    respuesta: '',
    categoria: 'General',
    activo: true,
  });

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
    });
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
    });
    setIsModalOpen(true);
  };

  // Guardar (Crear o Actualizar)
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pregunta.trim() || !formData.respuesta.trim()) {
      Swal.fire('Campos requeridos', 'Por favor ingresa tanto la pregunta como la respuesta.', 'warning');
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
        text: 'Los cambios se reflejan de inmediato en el portal.',
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

    // Actualización optimista
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
      setFaqs(faqs); // revertir
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Eliminar FAQ
  const handleDelete = (faq: FaqItem) => {
    Swal.fire({
      title: '¿Eliminar esta pregunta?',
      html: `<p class="text-sm text-gray-600 mb-2 font-medium">"${faq.pregunta}"</p><p class="text-xs text-red-500">Esta acción no se puede deshacer.</p>`,
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
      text: 'Se restablecerán las 11 preguntas frecuentes originales del congreso.',
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
                Administrá el catálogo de dudas comunes, categorías, ordenamiento y respuestas del portal público.
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
            title="Restaura las 11 preguntas oficiales por defecto"
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
            Total:{' '}
            <strong className="text-gray-900 font-bold">{faqs.length}</strong>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-700">
            Públicas:{' '}
            <strong className="text-emerald-900 font-bold">{totalActivas}</strong>
          </div>
          <div className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-xs font-medium text-gray-600">
            Ocultas:{' '}
            <strong className="text-gray-800 font-bold">
              {faqs.length - totalActivas}
            </strong>
          </div>
        </div>

        {/* Buscador y Categorías */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Selector de Categoría */}
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

          {/* Caja de Búsqueda */}
          <div className="relative flex-1 md:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar pregunta o respuesta..."
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
          <div className="mt-4 flex justify-center gap-3">
            {searchTerm || selectedCategoria !== 'TODAS' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategoria('TODAS');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
              >
                Limpiar Filtros
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
              >
                Restaurar 11 Preguntas Oficiales
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const originalIndex = faqs.findIndex((f) => f.id === faq.id);
            const isFirst = originalIndex === 0;
            const isLast = originalIndex === faqs.length - 1;

            return (
              <div
                key={faq.id}
                className={`bg-white rounded-xl border p-4 transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  faq.activo ? 'border-gray-200' : 'border-gray-300 bg-gray-50/70 opacity-80'
                }`}
              >
                {/* Columna Izquierda: Orden & Drag indicators */}
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
                          isFirst
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-200 cursor-pointer'
                        }`}
                        title="Subir de posición"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMove(originalIndex, 'down')}
                        className={`w-6 h-5 rounded flex items-center justify-center text-[10px] ${
                          isLast
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-200 cursor-pointer'
                        }`}
                        title="Bajar de posición"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {/* Datos de la Pregunta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {faq.categoria || 'General'}
                      </span>
                      {faq.activo ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          Visible
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
                  </div>
                </div>

                {/* Columna Derecha: Acciones Rápidas */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  {/* Switch Activo / Oculto */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(faq)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      faq.activo
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                    title={faq.activo ? 'Click para ocultar del portal' : 'Click para mostrar en el portal'}
                  >
                    <span>{faq.activo ? '👁️' : '🙈'}</span>
                    <span>{faq.activo ? 'Pública' : 'Oculta'}</span>
                  </button>

                  {/* Editar */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(faq)}
                    className="p-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition border border-gray-200 cursor-pointer"
                    title="Editar pregunta y respuesta"
                  >
                    ✏️
                  </button>

                  {/* Eliminar */}
                  <button
                    type="button"
                    onClick={() => handleDelete(faq)}
                    className="p-2 rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 transition border border-gray-200 cursor-pointer"
                    title="Eliminar pregunta"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Cabecera del Modal */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl text-lg">
                  {editingFaq ? '✏️' : '➕'}
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {editingFaq ? 'Editar Pregunta Frecuente' : 'Nueva Pregunta Frecuente'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Completá los campos para actualizar la sección de soporte del congreso.
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

            {/* Formulario */}
            <form onSubmit={handleSaveFaq} className="flex-1 overflow-y-auto p-6 space-y-4">
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
                  placeholder="O escribe una categoría personalizada..."
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
                  Respuesta <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.respuesta}
                  onChange={(e) => setFormData((prev) => ({ ...prev, respuesta: e.target.value }))}
                  placeholder="Redactá una respuesta clara, concisa y detallada..."
                  required
                  rows={5}
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
                      Pregunta visible públicamente en el Portal
                    </span>
                    <p className="text-[11px] text-gray-500">
                      Si se desmarca, se mantendrá guardada en el CMS pero no se mostrará a los visitantes.
                    </p>
                  </div>
                </label>
              </div>

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
                      <span>{editingFaq ? 'Guardar Cambios' : 'Crear Pregunta'}</span>
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
