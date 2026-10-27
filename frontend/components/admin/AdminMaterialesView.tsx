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
  cantidad_tarjetas: number;
  estado: EstadoMaterial;
}

type MaterialForm = Omit<Material, 'id'>;

const TIPOS: { value: TipoMaterial; label: string }[] = [
  { value: 'novedad', label: 'Novedad' },
  { value: 'documento', label: 'Documento' },
  { value: 'video', label: 'Video' },
  { value: 'flyer', label: 'Flyer' },
  { value: 'foto', label: 'Foto' },
  { value: 'recurso', label: 'Recurso' },
];

const ESTADOS: { value: EstadoMaterial; label: string }[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'archivado', label: 'Archivado' },
];

const CLASES_ESTADO: Record<EstadoMaterial, string> = {
  borrador: 'bg-amber-100 text-amber-800',
  publicado: 'bg-green-100 text-green-800',
  archivado: 'bg-gray-100 text-gray-700',
};

const FORMULARIO_VACIO: MaterialForm = {
  titulo: '',
  descripcion: '',
  fecha_publicacion: new Date().toISOString().slice(0, 10),
  tipo_contenido: 'documento',
  archivo_nombre: '',
  archivo_url: '',
  portada_nombre: '',
  portada_url: '',
  enlaces_externos: [],
  etiquetas: [],
  cantidad_tarjetas: 1,
  estado: 'borrador',
};

// Datos de ejemplo únicamente para desarrollar la interfaz. No se persisten.
const MATERIALES_INICIALES: Material[] = [
  {
    id: 'demo-1',
    titulo: 'Información general de participación',
    descripcion: 'Documento orientativo con información útil para las personas participantes del Congreso.',
    fecha_publicacion: '2026-09-11',
    tipo_contenido: 'documento',
    archivo_nombre: 'participacion.pdf',
    archivo_url: '/documentos/participacion.pdf',
    portada_nombre: '',
    portada_url: '',
    enlaces_externos: [],
    etiquetas: ['Congreso', 'Participación'],
    cantidad_tarjetas: 1,
    estado: 'publicado',
  },
  {
    id: 'demo-2',
    titulo: 'Conocé el Congreso ETS 2026',
    descripcion: 'Contenido audiovisual institucional relacionado con el Congreso.',
    fecha_publicacion: '2026-09-09',
    tipo_contenido: 'video',
    archivo_nombre: '',
    archivo_url: '',
    portada_nombre: '',
    portada_url: '',
    enlaces_externos: [{ id: 'enlace-demo-1', titulo: 'Ver video', url: 'https://www.youtube.com/' }],
    etiquetas: ['Congreso', 'Video'],
    cantidad_tarjetas: 1,
    estado: 'publicado',
  },
  {
    id: 'demo-3',
    titulo: 'Recursos para participantes',
    descripcion: 'Materiales y recursos vinculados con el programa y los dispositivos de participación.',
    fecha_publicacion: '2026-09-06',
    tipo_contenido: 'recurso',
    archivo_nombre: '',
    archivo_url: '',
    portada_nombre: '',
    portada_url: '',
    enlaces_externos: [],
    etiquetas: ['Recursos'],
    cantidad_tarjetas: 3,
    estado: 'borrador',
  },
];

const campo =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const etiquetaCampo = 'mb-1.5 block text-xs font-bold text-gray-600';

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
  const [materiales, setMateriales] = useState<Material[]>([]);  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoMaterial>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoMaterial>('todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [materialEditando, setMaterialEditando] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<MaterialForm>(FORMULARIO_VACIO);
  const [etiquetaInput, setEtiquetaInput] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [portadaSeleccionada, setPortadaSeleccionada] = useState<File | null>(null);
  const [arrastrandoArchivo, setArrastrandoArchivo] = useState(false);
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const inputPortadaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function cargarMateriales() {
      try {
        const token = localStorage.getItem('congreso_token');

        const res = await fetch('/api/materiales/admin', {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'No se pudieron cargar los materiales.');
        }

        const lista = data.materiales ?? [];

        setMateriales(
          lista.map((item: any) => ({
            id: String(item.id),
            titulo: item.title ?? '',
            descripcion: item.description ?? '',
            fecha_publicacion: item.date ?? '',
            tipo_contenido: item.type,
            archivo_nombre: item.fileUrl?.split('/').pop() ?? '',
            archivo_url: item.fileUrl ?? item.videoUrl ?? '',
            portada_nombre: item.image?.split('/').pop() ?? '',
            portada_url: item.image ?? '',
            enlaces_externos: [],
            etiquetas: [],
            cantidad_tarjetas: 1,
            estado: item.publicado ? 'publicado' : 'borrador',
          })),
        );
      } catch (error) {
        Swal.fire({
          title: 'Error al cargar materiales',
          text: error instanceof Error
            ? error.message
            : 'Error inesperado.',
          icon: 'error',
        });
      }
    }

    cargarMateriales();
  }, []);

  const materialesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es');
    return materiales.filter((material) => {
      const coincideTexto =
        !texto ||
        material.titulo.toLocaleLowerCase('es').includes(texto) ||
        material.descripcion.toLocaleLowerCase('es').includes(texto) ||
        material.etiquetas.some((tag) => tag.toLocaleLowerCase('es').includes(texto));
      const coincideTipo = filtroTipo === 'todos' || material.tipo_contenido === filtroTipo;
      const coincideEstado = filtroEstado === 'todos' || material.estado === filtroEstado;
      return coincideTexto && coincideTipo && coincideEstado;
    });
  }, [materiales, busqueda, filtroTipo, filtroEstado]);

  function actualizar<K extends keyof MaterialForm>(campoForm: K, valor: MaterialForm[K]) {
    setFormulario((actual) => ({ ...actual, [campoForm]: valor }));
  }

  function abrirNuevo() {
    setMaterialEditando(null);
    setFormulario({ ...FORMULARIO_VACIO, fecha_publicacion: new Date().toISOString().slice(0, 10) });
    setEtiquetaInput('');
    setArchivoSeleccionado(null);
    setPortadaSeleccionada(null);
    setModalAbierto(true);
  }

  function abrirEdicion(material: Material) {
    setMaterialEditando(material.id);
    const { id: _id, ...datos } = material;
    setFormulario({ ...datos, enlaces_externos: datos.enlaces_externos.map((link) => ({ ...link })) });
    setEtiquetaInput('');
    setArchivoSeleccionado(null);
    setPortadaSeleccionada(null);
    setModalAbierto(true);
  }

  function agregarEtiqueta() {
    const etiquetasNuevas = etiquetaInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!etiquetasNuevas.length) return;
    actualizar('etiquetas', Array.from(new Set([...formulario.etiquetas, ...etiquetasNuevas])));
    setEtiquetaInput('');
  }

  function quitarEtiqueta(etiqueta: string) {
    actualizar('etiquetas', formulario.etiquetas.filter((tag) => tag !== etiqueta));
  }

  function agregarEnlace() {
    actualizar('enlaces_externos', [
      ...formulario.enlaces_externos,
      { id: crearId(), titulo: '', url: '' },
    ]);
  }

  function actualizarEnlace(id: string, campoEnlace: 'titulo' | 'url', valor: string) {
    actualizar(
      'enlaces_externos',
      formulario.enlaces_externos.map((enlace) =>
        enlace.id === id ? { ...enlace, [campoEnlace]: valor } : enlace,
      ),
    );
  }

  function quitarEnlace(id: string) {
    actualizar('enlaces_externos', formulario.enlaces_externos.filter((enlace) => enlace.id !== id));
  }

  function seleccionarArchivo(evento: ChangeEvent<HTMLInputElement>, tipo: 'archivo' | 'portada') {
    const file = evento.target.files?.[0] ?? null;
    if (tipo === 'archivo') setArchivoSeleccionado(file);
    else setPortadaSeleccionada(file);
  }

  function manejarSoltarArchivo(evento: React.DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastrandoArchivo(false);
    const file = evento.dataTransfer.files?.[0];
    if (file) setArchivoSeleccionado(file);
  }

  async function guardarMaterial(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const titulo = formulario.titulo.trim();

    if (!titulo) {
      await Swal.fire({
        title: 'Falta el título',
        text: 'Ingresá un título para el material.',
        icon: 'warning',
      });
      return;
    }

    if (archivoSeleccionado || portadaSeleccionada) {
      await Swal.fire({
        title: 'Archivos no cargados',
        text: 'Por ahora, ingresá las URLs de los archivos. La carga directa todavía no está implementada.',
        icon: 'warning',
      });
      return;
    }

    try {
      const token = localStorage.getItem('congreso_token');
      const editando = materialEditando !== null;

      const payload = {
        type: formulario.tipo_contenido,
        title: titulo,
        description: formulario.descripcion.trim(),
        date: formulario.fecha_publicacion,
        image: formulario.portada_url,
        fileUrl: formulario.archivo_url,
        videoUrl: formulario.tipo_contenido === 'video'
          ? formulario.archivo_url
          : '',
        images: [],
        publicado: formulario.estado === 'publicado',
      };

      const res = await fetch(
        editando
          ? `/api/materiales/${materialEditando}`
          : '/api/materiales',
        {
          method: editando ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'No se pudo guardar el material.');
      }

      setModalAbierto(false);

      await Swal.fire({
        title: editando ? 'Material actualizado' : 'Material creado',
        text: 'Los cambios se guardaron en la base de datos.',
        icon: 'success',
        confirmButtonColor: '#2563eb',
      });

      window.location.reload();
    } catch (error) {
      await Swal.fire({
        title: 'Error al guardar',
        text: error instanceof Error ? error.message : 'Error inesperado.',
        icon: 'error',
      });
    }
  }

  async function eliminarMaterial(material: Material) {
    const resultado = await Swal.fire({
      title: '¿Eliminar material?',
      text: `Se eliminará "${material.titulo}" de la base de datos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      reverseButtons: true,
    });

    if (!resultado.isConfirmed) return;

    try {
      const token = localStorage.getItem('congreso_token');

      const res = await fetch(`/api/materiales/${material.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'No se pudo eliminar el material.');
      }

      setMateriales((actuales) =>
        actuales.filter((item) => item.id !== material.id)
      );

      await Swal.fire({
        title: 'Material eliminado',
        icon: 'success',
        confirmButtonColor: '#2563eb',
      });
    } catch (error) {
      await Swal.fire({
        title: 'Error al eliminar',
        text: error instanceof Error ? error.message : 'Error inesperado.',
        icon: 'error',
      });
    }
  }

  const totalPublicados = materiales.filter((material) => material.estado === 'publicado').length;
  const totalBorradores = materiales.filter((material) => material.estado === 'borrador').length;
  const totalArchivados = materiales.filter((material) => material.estado === 'archivado').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Gestión de materiales</h2>
          <p className="mt-1 text-sm text-gray-500">
            Administrá las tarjetas y los recursos que se mostrarán en la sección pública.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
        >
          <span className="text-lg leading-none">+</span> Nuevo material
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Total de materiales</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900">{materiales.length}</p>
        </div>
        <div className="rounded-xl border border-green-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-green-700">Publicados</p>
          <p className="mt-1 text-2xl font-extrabold text-green-700">{totalPublicados}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Borradores</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">{totalBorradores}</p>
          <p className="mt-1 text-xs text-gray-500">{totalArchivados} archivados</p>
        </div>
      </div>

      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_200px_200px]">
          <div>
            <label htmlFor="materiales-busqueda" className={etiquetaCampo}>Buscar material</label>
            <input
              id="materiales-busqueda"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Título, descripción o etiqueta..."
              className={campo}
            />
          </div>
          <div>
            <label htmlFor="materiales-tipo-filtro" className={etiquetaCampo}>Tipo de contenido</label>
            <select id="materiales-tipo-filtro" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)} className={campo}>
              <option value="todos">Todos los tipos</option>
              {TIPOS.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="materiales-estado-filtro" className={etiquetaCampo}>Estado</label>
            <select id="materiales-estado-filtro" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)} className={campo}>
              <option value="todos">Todos los estados</option>
              {ESTADOS.map((estado) => <option key={estado.value} value={estado.value}>{estado.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500">
            {materialesFiltrados.length} resultado{materialesFiltrados.length === 1 ? '' : 's'}
          </p>
          {(busqueda || filtroTipo !== 'todos' || filtroEstado !== 'todos') && (
            <button type="button" onClick={() => { setBusqueda(''); setFiltroTipo('todos'); setFiltroEstado('todos'); }} className="text-xs font-semibold text-blue-700 hover:text-blue-900">
              Limpiar filtros
            </button>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-700">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">Material</th>
                <th className="px-4 py-3 font-bold">Tipo</th>
                <th className="px-4 py-3 font-bold">Fecha</th>
                <th className="px-4 py-3 font-bold">Estado</th>
                <th className="px-4 py-3 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materialesFiltrados.map((material) => (
                <tr key={material.id} className="transition hover:bg-gray-50">
                  <td className="max-w-md px-4 py-3">
                    <p className="font-bold text-gray-900">{material.titulo}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{material.descripcion || 'Sin descripción'}</p>
                    {material.etiquetas.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {material.etiquetas.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-600">{tag}</span>
                        ))}
                        {material.etiquetas.length > 3 && <span className="text-[10px] text-gray-400">+{material.etiquetas.length - 3}</span>}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{nombreTipo(material.tipo_contenido)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">{formatearFecha(material.fecha_publicacion)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${CLASES_ESTADO[material.estado]}`}>
                      {ESTADOS.find((estado) => estado.value === material.estado)?.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => abrirEdicion(material)} className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">Editar</button>
                      <button type="button" onClick={() => eliminarMaterial(material)} className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {materialesFiltrados.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center">
                  <p className="font-semibold text-gray-700">No hay materiales para mostrar</p>
                  <p className="mt-1 text-xs text-gray-500">Probá cambiar los filtros o crear un material nuevo.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalAbierto(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="material-modal-titulo" className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
              <div>
                <h3 id="material-modal-titulo" className="text-lg font-extrabold text-gray-900">{materialEditando ? 'Editar material' : 'Nuevo material'}</h3>
                <p className="mt-1 text-xs text-gray-500">Completá los datos y revisá cómo quedará la tarjeta pública.</p>
              </div>
              <button type="button" onClick={() => setModalAbierto(false)} aria-label="Cerrar formulario" className="rounded-lg px-2 py-1 text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700">×</button>
            </div>

            <form onSubmit={guardarMaterial} className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:p-6">
                <div className="space-y-5">
                  <section className="space-y-3">
                    <h4 className="border-b border-gray-100 pb-2 text-sm font-extrabold text-gray-800">Información general</h4>
                    <div>
                      <label htmlFor="material-titulo" className={etiquetaCampo}>Título <span className="text-red-600">*</span></label>
                      <input id="material-titulo" required maxLength={180} value={formulario.titulo} onChange={(e) => actualizar('titulo', e.target.value)} className={campo} placeholder="Ej. Documento general de participación" />
                      <p className="mt-1 text-right text-[10px] text-gray-400">{formulario.titulo.length}/180</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="material-fecha" className={etiquetaCampo}>Fecha de publicación</label>
                        <input id="material-fecha" type="date" value={formulario.fecha_publicacion} onChange={(e) => actualizar('fecha_publicacion', e.target.value)} className={campo} />
                      </div>
                      <div>
                        <label htmlFor="material-tipo" className={etiquetaCampo}>Tipo de contenido</label>
                        <select id="material-tipo" value={formulario.tipo_contenido} onChange={(e) => actualizar('tipo_contenido', e.target.value as TipoMaterial)} className={campo}>
                          {TIPOS.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="material-descripcion" className={etiquetaCampo}>Descripción</label>
                      <textarea id="material-descripcion" rows={4} maxLength={1000} value={formulario.descripcion} onChange={(e) => actualizar('descripcion', e.target.value)} className={`${campo} resize-y`} placeholder="Descripción breve que aparecerá en la tarjeta..." />
                      <p className="mt-1 text-right text-[10px] text-gray-400">{formulario.descripcion.length}/1000</p>
                    </div>
                    <div>
                      <label htmlFor="material-estado" className={etiquetaCampo}>Estado editorial</label>
                      <select id="material-estado" value={formulario.estado} onChange={(e) => actualizar('estado', e.target.value as EstadoMaterial)} className={campo}>
                        {ESTADOS.map((estado) => <option key={estado.value} value={estado.value}>{estado.label}</option>)}
                      </select>
                      <p className="mt-1 text-[11px] text-gray-400">Solo los materiales publicados deberían mostrarse en la web pública.</p>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="border-b border-gray-100 pb-2 text-sm font-extrabold text-gray-800">Multimedia y archivos</h4>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setArrastrandoArchivo(true); }}
                      onDragLeave={() => setArrastrandoArchivo(false)}
                      onDrop={manejarSoltarArchivo}
                      className={`rounded-xl border-2 border-dashed p-4 transition ${arrastrandoArchivo ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
                    >
                      <input ref={inputArchivoRef} type="file" className="hidden" onChange={(e) => seleccionarArchivo(e, 'archivo')} />
                      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-sm font-bold text-gray-800">Archivo principal</p>
                          <p className="mt-1 text-xs text-gray-500">Arrastrá un archivo acá o seleccioná uno desde tu equipo.</p>
                          <p className="mt-2 break-all text-xs font-semibold text-blue-700">{archivoSeleccionado?.name ?? formulario.archivo_nombre ?? 'Ningún archivo seleccionado'}</p>
                          {archivoSeleccionado && <p className="mt-1 text-[10px] text-amber-700">Seleccionado localmente; todavía no se subió al servidor.</p>}
                        </div>
                        <button type="button" onClick={() => inputArchivoRef.current?.click()} className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100">Seleccionar archivo</button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <input ref={inputPortadaRef} type="file" accept="image/*" className="hidden" onChange={(e) => seleccionarArchivo(e, 'portada')} />
                      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-sm font-bold text-gray-800">Imagen de portada</p>
                          <p className="mt-1 text-xs text-gray-500">Imagen opcional que identifica visualmente la tarjeta.</p>
                          <p className="mt-2 break-all text-xs font-semibold text-blue-700">{portadaSeleccionada?.name ?? formulario.portada_nombre ?? 'Ninguna portada seleccionada'}</p>
                          {portadaSeleccionada && <p className="mt-1 text-[10px] text-amber-700">Seleccionada localmente; todavía no se subió al servidor.</p>}
                        </div>
                        <button type="button" onClick={() => inputPortadaRef.current?.click()} className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100">Seleccionar imagen</button>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
                      <h4 className="text-sm font-extrabold text-gray-800">Enlaces externos</h4>
                      <button type="button" onClick={agregarEnlace} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100">+ Añadir enlace</button>
                    </div>
                    {formulario.enlaces_externos.length === 0 && <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">No hay enlaces agregados.</p>}
                    {formulario.enlaces_externos.map((enlace, indice) => (
                      <div key={enlace.id} className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]">
                        <div>
                          <label className={etiquetaCampo}>Título del enlace {indice + 1}</label>
                          <input value={enlace.titulo} onChange={(e) => actualizarEnlace(enlace.id, 'titulo', e.target.value)} className={campo} placeholder="Ver más" />
                        </div>
                        <div>
                          <label className={etiquetaCampo}>URL</label>
                          <input type="url" value={enlace.url} onChange={(e) => actualizarEnlace(enlace.id, 'url', e.target.value)} className={campo} placeholder="https://..." />
                        </div>
                        <button type="button" onClick={() => quitarEnlace(enlace.id)} className="self-end rounded-lg px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Quitar</button>
                      </div>
                    ))}
                  </section>

                  <section className="space-y-3">
                    <h4 className="border-b border-gray-100 pb-2 text-sm font-extrabold text-gray-800">Metadatos</h4>
                    <div>
                      <label htmlFor="material-etiquetas" className={etiquetaCampo}>Etiquetas</label>
                      <div className="flex gap-2">
                        <input id="material-etiquetas" value={etiquetaInput} onChange={(e) => { if (e.target.value.includes(',')) { const parts = e.target.value.split(','); const last = parts.pop() ?? ''; const tags = parts.map((tag) => tag.trim()).filter(Boolean); if (tags.length) actualizar('etiquetas', Array.from(new Set([...formulario.etiquetas, ...tags]))); setEtiquetaInput(last); } else setEtiquetaInput(e.target.value); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarEtiqueta(); } }} className={campo} placeholder="Escribí una etiqueta y presioná coma o Enter" />
                        <button type="button" onClick={agregarEtiqueta} className="rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50">Agregar</button>
                      </div>
                      {formulario.etiquetas.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{formulario.etiquetas.map((tag) => <button key={tag} type="button" onClick={() => quitarEtiqueta(tag)} title={`Quitar ${tag}`} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-red-50 hover:text-red-700">{tag} ×</button>)}</div>}
                    </div>
                    <div className="max-w-xs">
                      <label htmlFor="material-cantidad" className={etiquetaCampo}>Cantidad de tarjetas o elementos relacionados</label>
                      <input id="material-cantidad" type="number" min={1} max={100} value={formulario.cantidad_tarjetas} onChange={(e) => actualizar('cantidad_tarjetas', Math.max(1, Number(e.target.value) || 1))} className={campo} />
                    </div>
                  </section>
                </div>

                <aside className="space-y-3 lg:sticky lg:top-0 lg:self-start">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="text-sm font-extrabold text-gray-800">Vista previa en vivo</h4>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-800">PREVIEW</span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
                        {portadaSeleccionada ? (
                          <div className="px-4 text-center">
                            <span className="text-3xl">▧</span>
                            <p className="mt-1 max-w-[220px] break-all text-xs font-semibold text-gray-700">{portadaSeleccionada.name}</p>
                            <p className="text-[10px] text-gray-500">Vista de archivo local</p>
                          </div>
                        ) : formulario.portada_nombre ? (
                          <div className="px-4 text-center text-xs text-gray-500">Portada: {formulario.portada_nombre}</div>
                        ) : (
                          <div className="text-center text-gray-400">
                            <div className="text-4xl">▤</div>
                            <p className="mt-1 text-xs">Sin imagen de portada</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">{nombreTipo(formulario.tipo_contenido)}</span>
                          <span className="text-[10px] text-gray-400">{formatearFecha(formulario.fecha_publicacion)}</span>
                        </div>
                        <h5 className="break-words text-base font-extrabold leading-snug text-gray-900">{formulario.titulo || 'Título del material'}</h5>
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600">{formulario.descripcion || 'La descripción del material aparecerá en este espacio.'}</p>
                        {formulario.etiquetas.length > 0 && <div className="flex flex-wrap gap-1.5">{formulario.etiquetas.map((tag) => <span key={tag} className="rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-600">{tag}</span>)}</div>}
                        {archivoSeleccionado?.name || formulario.archivo_nombre ? <div className="break-all rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">Archivo: {archivoSeleccionado?.name ?? formulario.archivo_nombre}</div> : null}
                        {formulario.enlaces_externos.filter((link) => link.titulo.trim() || link.url.trim()).map((link) => <div key={link.id} className="break-all rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">{link.titulo || link.url || 'Enlace externo'}</div>)}
                        <div className="border-t border-gray-100 pt-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${CLASES_ESTADO[formulario.estado]}`}>{ESTADOS.find((estado) => estado.value === formulario.estado)?.label}</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-gray-500">Esta vista previa representa la información cargada; el diseño definitivo se ajustará al componente público cuando se integre con el modelo de datos.</p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                    <strong>Modo de desarrollo.</strong> Guardar aplica los cambios solo a esta sesión. Los archivos seleccionados no se envían al servidor.
                  </div>
                </aside>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button type="button" onClick={() => setModalAbierto(false)} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700">{materialEditando ? 'Guardar cambios' : 'Crear material'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
