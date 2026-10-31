'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';

type TipoMaterial = 'novedad' | 'documento' | 'video' | 'flyer' | 'foto' | 'recurso';
type EstadoMaterial = 'borrador' | 'publicado' | 'archivado';

interface EnlaceExterno {
  id: string;
  titulo: string;
  url: string;
}

interface Material {
  id: string;
  titulo: string;
  descripcion: string;
  fecha_publicacion: string;
  tipo_contenido: TipoMaterial;
  archivo_nombre: string;
  archivo_url: string;
  portada_nombre: string;
  portada_url: string;
  enlaces_externos: EnlaceExterno[];
  etiquetas: string[];
  estado: EstadoMaterial;
  contenido_detalle: string;
  imagenes_galeria: string[];
}

const TIPOS: { value: TipoMaterial; label: string }[] = [
  { value: 'novedad', label: 'Novedad' },
  { value: 'documento', label: 'Documento' },
  { value: 'video', label: 'Video' },
  { value: 'flyer', label: 'Flyer' },
  { value: 'foto', label: 'Foto' },
  { value: 'recurso', label: 'Recurso' },
];

const PRESETS_ICONOS = [
  { path: '/assets/icons/card1.svg', label: 'Aula Abierta (Card 1)' },
  { path: '/assets/icons/card2.svg', label: 'Stands (Card 2)' },
  { path: '/assets/icons/card3.svg', label: 'Académico (Card 3)' },
  { path: '/assets/icons/card4.svg', label: 'Estudiantes (Card 4)' },
  { path: '/assets/icons/card5.svg', label: 'Talentos (Card 5)' },
];

const campo =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const etiquetaCampo = 'mb-1.5 block text-xs font-bold text-gray-700';

function crearId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatearFecha(fecha: string) {
  if (!fecha) return 'Sin fecha';
  const date = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(date.getTime())) return fecha;
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function nombreTipo(tipo: TipoMaterial) {
  return TIPOS.find((item) => item.value === tipo)?.label ?? tipo;
}

export default function AdminMaterialesView() {
  const [subvistaMateriales, setSubvistaMateriales] = useState<'tarjetas' | 'categorias'>('tarjetas');
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [categoriasImagenes, setCategoriasImagenes] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoMaterial>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoMaterial>('todos');

  // MODAL NIVEL 1: CRUD de Tarjeta con su Imagen
  const [modalTarjetaAbierto, setModalTarjetaAbierto] = useState(false);
  const [tarjetaEditandoId, setTarjetaEditandoId] = useState<string | null>(null);
  const [tarjetaForm, setTarjetaForm] = useState({
    titulo: '',
    descripcion: '',
    fecha_publicacion: new Date().toISOString().slice(0, 10),
    tipo_contenido: 'novedad' as TipoMaterial,
    portada_url: '/assets/icons/card1.svg',
    publicado: true,
  });
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const inputPortadaRef = useRef<HTMLInputElement>(null);

  // MODAL NIVEL 2: CRUD de Contenido Anidado para el botón "Ver"
  const [modalContenidoAbierto, setModalContenidoAbierto] = useState(false);
  const [materialDetalleActual, setMaterialDetalleActual] = useState<Material | null>(null);
  const [detalleForm, setDetalleForm] = useState({
    contenido_detalle: '',
    archivo_url: '',
    archivo_nombre: '',
    video_url: '',
    imagenes_galeria: [] as string[],
    enlaces_externos: [] as EnlaceExterno[],
  });
  const [nuevoEnlaceTitulo, setNuevoEnlaceTitulo] = useState('');
  const [nuevoEnlaceUrl, setNuevoEnlaceUrl] = useState('');
  const [subiendoArchivoDetalle, setSubiendoArchivoDetalle] = useState(false);
  const [subiendoFotoGaleria, setSubiendoFotoGaleria] = useState(false);
  const inputGaleriaRef = useRef<HTMLInputElement>(null);
  const inputArchivoDetalleRef = useRef<HTMLInputElement>(null);

  // Cargar Categorías Imágenes
  async function cargarCategoriasImagenes() {
    try {
      const res = await fetch('/api/materiales/categorias-imagenes');
      const data = await res.json();
      if (data.success && data.categorias) {
        setCategoriasImagenes(data.categorias);
      }
    } catch (err) {
      console.error('Error cargando imágenes de categorías:', err);
    }
  }

  // Cargar Materiales completos
  async function cargarMateriales() {
    setCargando(true);
    try {
      const token = localStorage.getItem('congreso_token');
      const res = await fetch('/api/materiales/admin', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No se pudieron cargar los materiales.');

      const lista = data.materiales ?? [];
      setMateriales(
        lista.map((item: any) => ({
          id: String(item.id),
          titulo: item.title ?? '',
          descripcion: item.description ?? '',
          fecha_publicacion: item.date ?? '',
          tipo_contenido: item.type as TipoMaterial,
          archivo_nombre: item.fileUrl?.split('/').pop() ?? '',
          archivo_url: item.fileUrl ?? '',
          portada_nombre: item.image?.split('/').pop() ?? '',
          portada_url: item.image ?? '',
          enlaces_externos: Array.isArray(item.enlacesExternos) ? item.enlacesExternos : [],
          etiquetas: [],
          estado: item.publicado ? 'publicado' : 'borrador',
          contenido_detalle: item.contenidoDetalle ?? '',
          imagenes_galeria: Array.isArray(item.images) ? item.images : [],
        }))
      );
    } catch (error: any) {
      console.error('Error al cargar materiales:', error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarMateriales();
    cargarCategoriasImagenes();
  }, []);

  // Filtros
  const materialesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es');
    return materiales.filter((material) => {
      const coincideTexto =
        !texto ||
        material.titulo.toLocaleLowerCase('es').includes(texto) ||
        material.descripcion.toLocaleLowerCase('es').includes(texto);
      const coincideTipo = filtroTipo === 'todos' || material.tipo_contenido === filtroTipo;
      const coincideEstado = filtroEstado === 'todos' || material.estado === filtroEstado;
      return coincideTexto && coincideTipo && coincideEstado;
    });
  }, [materiales, busqueda, filtroTipo, filtroEstado]);

  // ========================================================
  // NIVEL 1: GESTIÓN DE TARJETA CON SU IMAGEN
  // ========================================================
  const abrirNuevaTarjeta = () => {
    setTarjetaEditandoId(null);
    setTarjetaForm({
      titulo: '',
      descripcion: '',
      fecha_publicacion: new Date().toISOString().slice(0, 10),
      tipo_contenido: 'novedad',
      portada_url: categoriasImagenes['novedad'] || '/assets/icons/card1.svg',
      publicado: true,
    });
    setModalTarjetaAbierto(true);
  };

  const abrirEditarTarjeta = (m: Material) => {
    setTarjetaEditandoId(m.id);
    setTarjetaForm({
      titulo: m.titulo,
      descripcion: m.descripcion,
      fecha_publicacion: m.fecha_publicacion,
      tipo_contenido: m.tipo_contenido,
      portada_url: m.portada_url || categoriasImagenes[m.tipo_contenido] || '/assets/icons/card1.svg',
      publicado: m.estado === 'publicado',
    });
    setModalTarjetaAbierto(true);
  };

  const handleSubirPortada = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoPortada(true);
    try {
      const token = localStorage.getItem('congreso_token');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/materiales/upload-imagen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          filename: file.name,
          fileBase64: base64,
          mimeType: file.type,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Error subiendo portada.');

      setTarjetaForm((prev) => ({ ...prev, portada_url: data.url }));
      Swal.fire({
        icon: 'success',
        title: 'Portada guardada',
        text: 'La imagen fue almacenada en imagenes_de_materiales/ sin compresión.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSubiendoPortada(false);
    }
  };

  const guardarTarjeta = async (e: FormEvent) => {
    e.preventDefault();
    if (!tarjetaForm.titulo.trim()) {
      Swal.fire('Falta el título', 'Por favor ingresá un título para la tarjeta.', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('congreso_token');
      const isEditing = tarjetaEditandoId !== null;

      if (isEditing) {
        // Usar endpoint especializado de tarjeta
        const res = await fetch(`/api/materiales/${tarjetaEditandoId}/tarjeta`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: tarjetaForm.titulo,
            type: tarjetaForm.tipo_contenido,
            description: tarjetaForm.descripcion,
            date: tarjetaForm.fecha_publicacion,
            image: tarjetaForm.portada_url,
            publicado: tarjetaForm.publicado,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Error al actualizar tarjeta.');
      } else {
        // Crear nuevo material con los datos de tarjeta
        const res = await fetch('/api/materiales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: tarjetaForm.titulo,
            type: tarjetaForm.tipo_contenido,
            description: tarjetaForm.descripcion,
            date: tarjetaForm.fecha_publicacion,
            image: tarjetaForm.portada_url,
            publicado: tarjetaForm.publicado,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Error al crear tarjeta.');
      }

      setModalTarjetaAbierto(false);
      window.dispatchEvent(new CustomEvent('materiales-updated'));
      await cargarMateriales();

      Swal.fire({
        icon: 'success',
        title: isEditing ? 'Tarjeta Actualizada' : 'Tarjeta Creada',
        text: 'La tarjeta y su imagen se han guardado exitosamente en PostgreSQL.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Error al guardar', err.message, 'error');
    }
  };

  // Conmutar Publicado / Borrador con un clic
  const togglePublicado = async (m: Material) => {
    const nuevoEstado = m.estado !== 'publicado';
    try {
      const token = localStorage.getItem('congreso_token');
      const res = await fetch(`/api/materiales/${m.id}/tarjeta`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: m.titulo,
          type: m.tipo_contenido,
          description: m.descripcion,
          date: m.fecha_publicacion,
          image: m.portada_url,
          publicado: nuevoEstado,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error conmutando estado.');

      setMateriales((prev) =>
        prev.map((item) =>
          item.id === m.id ? { ...item, estado: nuevoEstado ? 'publicado' : 'borrador' } : item
        )
      );
      window.dispatchEvent(new CustomEvent('materiales-updated'));
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Eliminar Tarjeta
  const eliminarMaterial = async (m: Material) => {
    const conf = await Swal.fire({
      title: '¿Eliminar tarjeta de material?',
      html: `<p class="text-sm text-gray-600 mb-2 font-semibold">"${m.titulo}"</p><p class="text-xs text-red-500">Se eliminará la tarjeta y todo su contenido anidado.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!conf.isConfirmed) return;

    try {
      const token = localStorage.getItem('congreso_token');
      const res = await fetch(`/api/materiales/${m.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Error al eliminar.');

      setMateriales((prev) => prev.filter((item) => item.id !== m.id));
      window.dispatchEvent(new CustomEvent('materiales-updated'));
      Swal.fire('Eliminado', 'La tarjeta de material fue eliminada.', 'success');
    } catch (err: any) {
      Swal.fire('Error al eliminar', err.message, 'error');
    }
  };

  // ========================================================
  // NIVEL 2: GESTIÓN DE CONTENIDO ANIDADO (BOTÓN "VER")
  // ========================================================
  const abrirGestionContenido = (m: Material) => {
    setMaterialDetalleActual(m);
    setDetalleForm({
      contenido_detalle: m.contenido_detalle || '',
      archivo_url: m.archivo_url || '',
      archivo_nombre: m.archivo_nombre || '',
      video_url: m.tipo_contenido === 'video' ? m.archivo_url : '',
      imagenes_galeria: [...m.imagenes_galeria],
      enlaces_externos: m.enlaces_externos.map((e) => ({ ...e })),
    });
    setNuevoEnlaceTitulo('');
    setNuevoEnlaceUrl('');
    setModalContenidoAbierto(true);
  };

  const handleSubirFotoGaleria = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoFotoGaleria(true);
    try {
      const token = localStorage.getItem('congreso_token');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/materiales/upload-imagen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          filename: file.name,
          fileBase64: base64,
          mimeType: file.type,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al subir foto a la galería.');

      setDetalleForm((prev) => ({
        ...prev,
        imagenes_galeria: [...prev.imagenes_galeria, data.url],
      }));
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSubiendoFotoGaleria(false);
    }
  };

  const eliminarFotoGaleria = (index: number) => {
    setDetalleForm((prev) => ({
      ...prev,
      imagenes_galeria: prev.imagenes_galeria.filter((_, i) => i !== index),
    }));
  };

  const handleSubirArchivoDetalle = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoArchivoDetalle(true);
    try {
      const token = localStorage.getItem('congreso_token');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/admin/frontend-cms/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          filename: file.name,
          fileBase64: base64,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || 'Error al subir archivo adjunto.');

      setDetalleForm((prev) => ({
        ...prev,
        archivo_url: data.url,
        archivo_nombre: file.name,
      }));
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSubiendoArchivoDetalle(false);
    }
  };

  const agregarEnlaceExterno = () => {
    if (!nuevoEnlaceUrl.trim()) {
      Swal.fire('Falta la URL', 'Ingresá una URL válida para el enlace externo.', 'warning');
      return;
    }
    const nuevo: EnlaceExterno = {
      id: crearId(),
      titulo: nuevoEnlaceTitulo.trim() || nuevoEnlaceUrl.trim(),
      url: nuevoEnlaceUrl.trim(),
    };
    setDetalleForm((prev) => ({
      ...prev,
      enlaces_externos: [...prev.enlaces_externos, nuevo],
    }));
    setNuevoEnlaceTitulo('');
    setNuevoEnlaceUrl('');
  };

  const quitarEnlaceExterno = (id: string) => {
    setDetalleForm((prev) => ({
      ...prev,
      enlaces_externos: prev.enlaces_externos.filter((e) => e.id !== id),
    }));
  };

  const guardarContenidoDetalle = async (e: FormEvent) => {
    e.preventDefault();
    if (!materialDetalleActual) return;

    try {
      const token = localStorage.getItem('congreso_token');
      const res = await fetch(`/api/materiales/${materialDetalleActual.id}/contenido`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          contenidoDetalle: detalleForm.contenido_detalle,
          fileUrl: detalleForm.archivo_url,
          videoUrl: detalleForm.video_url,
          images: detalleForm.imagenes_galeria,
          enlacesExternos: detalleForm.enlaces_externos,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Error al guardar contenido.');

      setModalContenidoAbierto(false);
      window.dispatchEvent(new CustomEvent('materiales-updated'));
      await cargarMateriales();

      Swal.fire({
        icon: 'success',
        title: 'Contenido Guardado',
        text: 'Los detalles para el botón "Ver" fueron actualizados exitosamente.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* CABECERA PRINCIPAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-50 text-blue-700 rounded-xl text-xl">📁</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Gestión de Materiales y Contenidos
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                CRUD Anidado: Administrá las tarjetas con su imagen y, de manera independiente, el contenido detallado que despliega cada botón &quot;Ver&quot;.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <a
            href="/materiales"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5"
            title="Ver sección en una nueva pestaña"
          >
            <span>🌐</span> Ver en Portal
          </a>

          {subvistaMateriales === 'tarjetas' && (
            <button
              type="button"
              onClick={abrirNuevaTarjeta}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>➕</span> Nueva Tarjeta de Material
            </button>
          )}
        </div>
      </div>

      {/* SUBPESTAÑAS: Tarjetas vs Imágenes por Categoría */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          type="button"
          onClick={() => setSubvistaMateriales('tarjetas')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            subvistaMateriales === 'tarjetas'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>🎴</span>
          <span>Tarjetas y Contenidos ({materiales.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubvistaMateriales('categorias')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            subvistaMateriales === 'categorias'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>🖼️</span>
          <span>Imágenes Base por Categoría (6)</span>
        </button>
      </div>

      {subvistaMateriales === 'categorias' ? (
        /* VISTA DE IMÁGENES BASE POR CATEGORÍA */
        <section className="space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <h3 className="font-bold text-blue-900 text-xs uppercase tracking-wider">
              Imágenes de Respaldo por Categoría
            </h3>
            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
              Las imágenes asignadas a cada categoría sirven como carátula por defecto cuando una tarjeta no tiene una portada personalizada.
              Se almacenan en <code className="bg-white/80 px-1 py-0.5 rounded font-mono">imagenes_de_materiales/</code> sin compresión destructiva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TIPOS.map((tipo) => {
              const urlActual = categoriasImagenes[tipo.value] || '';
              return (
                <div key={tipo.value} className="bg-white rounded-xl border border-gray-200 shadow-2xs p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-extrabold text-gray-900 text-sm capitalize">{tipo.label}</span>
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        800x800 px
                      </span>
                    </div>

                    <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center mb-3">
                      {urlActual ? (
                        <img
                          src={urlActual}
                          alt={`Categoría ${tipo.label}`}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="text-center p-4 text-gray-400">
                          <span className="text-3xl block mb-1">🖼️</span>
                          <span className="text-xs">Sin imagen personalizada</span>
                        </div>
                      )}
                    </div>

                    {urlActual && (
                      <p className="text-[11px] text-gray-500 truncate mb-2" title={urlActual}>
                        <strong>Ruta:</strong> {urlActual}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <label className="flex-1 cursor-pointer text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-xl transition shadow-2xs">
                      <span>{urlActual ? 'Cambiar imagen' : 'Subir imagen'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const token = localStorage.getItem('congreso_token');
                            const base64 = await new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onload = () => resolve(reader.result as string);
                              reader.onerror = reject;
                              reader.readAsDataURL(file);
                            });

                            const upRes = await fetch('/api/materiales/upload-imagen', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                              },
                              body: JSON.stringify({
                                filename: file.name,
                                fileBase64: base64,
                                mimeType: file.type,
                              }),
                            });
                            const upData = await upRes.json();
                            if (!upRes.ok || !upData.success) throw new Error(upData.error || 'Error subiendo imagen.');

                            const catRes = await fetch('/api/materiales/categorias-imagenes', {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                              },
                              body: JSON.stringify({ tipo: tipo.value, url_imagen: upData.url }),
                            });
                            const catData = await catRes.json();
                            if (catData.success) {
                              setCategoriasImagenes(catData.categorias);
                              Swal.fire('Imagen actualizada', '', 'success');
                            }
                          } catch (err: any) {
                            Swal.fire('Error', err.message, 'error');
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* VISTA PRINCIPAL DEL CRUD ANIDADO DE TARJETAS */
        <div className="space-y-4">
          {/* BARRA DE FILTROS Y BÚSQUEDA */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
                Total: <strong className="text-gray-900 font-bold">{materiales.length}</strong>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-700">
                Publicados: <strong className="text-emerald-900 font-bold">{materiales.filter((m) => m.estado === 'publicado').length}</strong>
              </div>
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-700">
                Borradores: <strong className="text-amber-900 font-bold">{materiales.filter((m) => m.estado !== 'publicado').length}</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Filtro por tipo */}
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos los tipos</option>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              {/* Filtro por estado */}
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="publicado">Publicados</option>
                <option value="borrador">Borradores</option>
              </select>

              {/* Búsqueda */}
              <div className="relative flex-1 md:w-60">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-xs">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar material..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* LISTADO DE TARJETAS */}
          {cargando ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-3 text-xs text-gray-500 font-medium">Cargando catálogo de materiales...</p>
            </div>
          ) : materialesFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <span className="text-4xl">📂</span>
              <h3 className="mt-2 text-sm font-bold text-gray-800">No se encontraron materiales</h3>
              <p className="mt-1 text-xs text-gray-500">
                Probá ajustando la búsqueda o creá una nueva tarjeta de material.
              </p>
              <button
                type="button"
                onClick={abrirNuevaTarjeta}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition"
              >
                ➕ Nueva Tarjeta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {materialesFiltrados.map((m) => {
                const tieneGaleria = m.imagenes_galeria && m.imagenes_galeria.length > 0;
                const tieneVideo = !!m.archivo_url && m.tipo_contenido === 'video';
                const tieneArchivo = !!m.archivo_url && m.tipo_contenido !== 'video';
                const tieneEnlaces = m.enlaces_externos && m.enlaces_externos.length > 0;
                const tieneDetalle = !!m.contenido_detalle?.trim();

                return (
                  <div
                    key={m.id}
                    className={`bg-white rounded-2xl border p-5 transition shadow-2xs hover:shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
                      m.estado === 'publicado' ? 'border-gray-200' : 'border-gray-300 bg-gray-50/60 opacity-85'
                    }`}
                  >
                    {/* Tarjeta con su Imagen (Nivel 1) */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Portada de la Tarjeta */}
                      <div className="w-24 h-24 rounded-xl border border-gray-200 bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                        {m.portada_url ? (
                          <img
                            src={m.portada_url}
                            alt={m.titulo}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-2xl">📁</span>
                        )}
                        <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white">
                          Portada
                        </span>
                      </div>

                      {/* Metadatos de la Tarjeta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                            {nombreTipo(m.tipo_contenido)}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {formatearFecha(m.fecha_publicacion)}
                          </span>
                          {m.estado === 'publicado' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              Publicado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                              Borrador
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-gray-900 leading-snug">
                          {m.titulo}
                        </h3>

                        <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                          {m.descripcion || 'Sin descripción breve en la tarjeta.'}
                        </p>

                        {/* Indicadores de Contenido Anidado del Botón "Ver" */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold text-gray-400 mr-1">
                            Contenido del botón &quot;Ver&quot;:
                          </span>
                          {tieneDetalle ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700">
                              📄 Texto detallado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-gray-400 border border-dashed border-gray-200">
                              Sin texto extendido
                            </span>
                          )}
                          {tieneGaleria && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                              📸 {m.imagenes_galeria.length} fotos
                            </span>
                          )}
                          {tieneVideo && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100">
                              🎬 Video
                            </span>
                          )}
                          {tieneArchivo && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              📎 Documento
                            </span>
                          )}
                          {tieneEnlaces && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              🔗 {m.enlaces_externos.length} enlaces
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones del CRUD Anidado */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                      {/* Botón Nivel 1: Editar Tarjeta e Imagen */}
                      <button
                        type="button"
                        onClick={() => abrirEditarTarjeta(m)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Modificar los datos de la tarjeta (título, tipo, fecha, resumen e imagen de portada)"
                      >
                        <span>✏️</span>
                        <span>Editar Tarjeta</span>
                      </button>

                      {/* Botón Nivel 2: CRUD de Contenido del botón "Ver" */}
                      <button
                        type="button"
                        onClick={() => abrirGestionContenido(m)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Gestionar los elementos que se mostrarán cuando el usuario presione 'Ver' en esta tarjeta"
                      >
                        <span>👁️</span>
                        <span>Contenido botón &quot;Ver&quot;</span>
                      </button>

                      {/* Switch rápido de Publicado */}
                      <button
                        type="button"
                        onClick={() => togglePublicado(m)}
                        className={`p-2 rounded-xl text-xs font-semibold transition flex items-center justify-center cursor-pointer ${
                          m.estado === 'publicado'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                        }`}
                        title={m.estado === 'publicado' ? 'Ocultar del portal público' : 'Publicar en el portal'}
                      >
                        {m.estado === 'publicado' ? '🟢' : '⚪'}
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => eliminarMaterial(m)}
                        className="p-2 rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 transition border border-gray-200 cursor-pointer flex items-center justify-center"
                        title="Eliminar tarjeta y su contenido"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL NIVEL 1: CRUD DE TARJETA CON SU IMAGEN
          ======================================================== */}
      {modalTarjetaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl text-lg">🎴</span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {tarjetaEditandoId ? 'Editar Tarjeta con su Imagen' : 'Nueva Tarjeta con su Imagen'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Configurá la tarjeta visible en el catálogo de materiales del portal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalTarjetaAbierto(false)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarTarjeta} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Tipo de Contenido */}
              <div>
                <label className={etiquetaCampo}>Tipo de Contenido / Categoría</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIPOS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setTarjetaForm((prev) => ({
                          ...prev,
                          tipo_contenido: t.value,
                          portada_url: prev.portada_url || categoriasImagenes[t.value] || '/assets/icons/card1.svg',
                        }));
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        tarjetaForm.tipo_contenido === t.value
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título de la Tarjeta */}
              <div>
                <label className={etiquetaCampo}>
                  Título de la Tarjeta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tarjetaForm.titulo}
                  onChange={(e) => setTarjetaForm((prev) => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ej: Documento general de participación"
                  className={campo}
                />
              </div>

              {/* Fecha de Publicación */}
              <div>
                <label className={etiquetaCampo}>Fecha de Publicación</label>
                <input
                  type="date"
                  value={tarjetaForm.fecha_publicacion}
                  onChange={(e) => setTarjetaForm((prev) => ({ ...prev, fecha_publicacion: e.target.value }))}
                  className={campo}
                />
              </div>

              {/* Descripción Breve / Resumen */}
              <div>
                <label className={etiquetaCampo}>
                  Descripción Breve (Resumen visible en la tarjeta)
                </label>
                <textarea
                  rows={3}
                  value={tarjetaForm.descripcion}
                  onChange={(e) => setTarjetaForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Breve resumen que acompaña a la tarjeta antes de presionar 'Ver'..."
                  className={campo}
                />
              </div>

              {/* Imagen de Portada de la Tarjeta */}
              <div className="border-t border-gray-100 pt-4">
                <label className={etiquetaCampo}>Imagen de la Tarjeta (Portada)</label>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {tarjetaForm.portada_url ? (
                      <img src={tarjetaForm.portada_url} alt="Portada preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-gray-400 text-xs">Sin imagen</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => inputPortadaRef.current?.click()}
                        disabled={subiendoPortada}
                        className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition cursor-pointer border border-blue-200"
                      >
                        {subiendoPortada ? 'Subiendo...' : '📤 Subir imagen'}
                      </button>
                      <input
                        ref={inputPortadaRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
                        className="hidden"
                        onChange={handleSubirPortada}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Formatos: PNG, JPG, WebP, SVG, AVIF. Se guardará sin compresión destructiva en <code className="font-mono">imagenes_de_materiales/</code>.
                    </p>
                  </div>
                </div>

                {/* Presets rápidos */}
                <div>
                  <span className="block text-[11px] font-bold text-gray-500 mb-1.5">O elegir de los presets oficiales:</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS_ICONOS.map((p) => (
                      <button
                        key={p.path}
                        type="button"
                        onClick={() => setTarjetaForm((prev) => ({ ...prev, portada_url: p.path }))}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                          tarjetaForm.portada_url === p.path
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <img src={p.path} alt="" className="w-3.5 h-3.5" />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estado de Publicación */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tarjetaForm.publicado}
                    onChange={(e) => setTarjetaForm((prev) => ({ ...prev, publicado: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-800">Tarjeta publicada en el Portal</span>
                    <p className="text-[11px] text-gray-500">
                      Si está desmarcada, quedará en borrador y solo será visible en el Panel de Administración.
                    </p>
                  </div>
                </label>
              </div>

              {/* Botones */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalTarjetaAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <span>💾</span>
                  <span>{tarjetaEditandoId ? 'Guardar Cambios de Tarjeta' : 'Crear Tarjeta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL NIVEL 2: CRUD DE CONTENIDO DEL BOTÓN "VER"
          ======================================================== */}
      {modalContenidoAbierto && materialDetalleActual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Cabecera */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-indigo-50/70">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl text-lg">👁️</span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Contenido para el Botón &quot;Ver&quot;
                  </h3>
                  <p className="text-xs text-indigo-800 font-medium">
                    Editando contenido anidado de: <strong className="text-gray-900">&quot;{materialDetalleActual.titulo}&quot;</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalContenidoAbierto(false)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarContenidoDetalle} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Sección A: Cuerpo / Texto Extendido */}
              <div>
                <label className={etiquetaCampo}>
                  Texto Extendido / Cuerpo del Artículo
                </label>
                <textarea
                  rows={5}
                  value={detalleForm.contenido_detalle}
                  onChange={(e) => setDetalleForm((prev) => ({ ...prev, contenido_detalle: e.target.value }))}
                  placeholder="Escribí el contenido completo, notas pedagógicas, detalles organizativos o información detallada que se leerá al presionar 'Ver'..."
                  className={campo}
                />
              </div>

              {/* Sección B: Video Relacionado */}
              <div className="border-t border-gray-100 pt-4">
                <label className={etiquetaCampo}>Video Relacionado (YouTube / Vimeo / MP4)</label>
                <input
                  type="text"
                  value={detalleForm.video_url}
                  onChange={(e) => setDetalleForm((prev) => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={campo}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Si se ingresa un enlace de YouTube, se renderizará automáticamente un reproductor interactivo en el detalle.
                </p>
              </div>

              {/* Sección C: Documento Adjunto */}
              <div className="border-t border-gray-100 pt-4">
                <label className={etiquetaCampo}>Documento Oficial para Descargar (PDF u otros)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={detalleForm.archivo_url}
                    onChange={(e) => setDetalleForm((prev) => ({ ...prev, archivo_url: e.target.value }))}
                    placeholder="/PDF/documento.pdf o URL externa"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => inputArchivoDetalleRef.current?.click()}
                    disabled={subiendoArchivoDetalle}
                    className="px-3.5 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition cursor-pointer flex-shrink-0"
                  >
                    {subiendoArchivoDetalle ? 'Subiendo...' : '📥 Subir Archivo'}
                  </button>
                  <input
                    ref={inputArchivoDetalleRef}
                    type="file"
                    className="hidden"
                    onChange={handleSubirArchivoDetalle}
                  />
                </div>
              </div>

              {/* Sección D: Galería de Fotos Anidada (CRUD interno) */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className={etiquetaCampo}>
                    Galería de Fotos del Ítem ({detalleForm.imagenes_galeria.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => inputGaleriaRef.current?.click()}
                    disabled={subiendoFotoGaleria}
                    className="px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition cursor-pointer border border-indigo-200"
                  >
                    {subiendoFotoGaleria ? 'Subiendo...' : '➕ Agregar Foto'}
                  </button>
                  <input
                    ref={inputGaleriaRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
                    className="hidden"
                    onChange={handleSubirFotoGaleria}
                  />
                </div>

                {detalleForm.imagenes_galeria.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No hay imágenes en la galería de este ítem.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {detalleForm.imagenes_galeria.map((imgUrl, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center">
                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => eliminarFotoGaleria(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Eliminar de la galería"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sección E: Enlaces Externos Asociados (CRUD interno) */}
              <div className="border-t border-gray-100 pt-4">
                <label className={etiquetaCampo}>
                  Enlaces y Recursos de Interés ({detalleForm.enlaces_externos.length})
                </label>
                <div className="space-y-2 mb-3">
                  {detalleForm.enlaces_externos.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                      <div>
                        <strong className="text-gray-800">{link.titulo}</strong>
                        <span className="text-gray-500 ml-2 font-mono text-[11px]">{link.url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => quitarEnlaceExterno(link.id)}
                        className="text-red-600 hover:text-red-800 font-bold px-2 cursor-pointer"
                        title="Quitar enlace"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Form para agregar enlace */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={nuevoEnlaceTitulo}
                    onChange={(e) => setNuevoEnlaceTitulo(e.target.value)}
                    placeholder="Título del enlace (ej: Portal DETS)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300"
                  />
                  <input
                    type="url"
                    value={nuevoEnlaceUrl}
                    onChange={(e) => setNuevoEnlaceUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={agregarEnlaceExterno}
                    className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition cursor-pointer"
                  >
                    Agregar Enlace
                  </button>
                </div>
              </div>

              {/* Botones del pie */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalContenidoAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <span>💾</span>
                  <span>Guardar Contenido del Ítem</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
