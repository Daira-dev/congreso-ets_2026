'use client';

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { OperadorEntity, CatalogosConsolidados } from './types';

interface Props {
  catalogos: CatalogosConsolidados | null;
  onNotice: (msg: string) => void;
}

export default function AdminOperadoresView({ catalogos, onNotice }: Props) {
  const [operadores, setOperadores] = useState<OperadorEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [activoFiltro, setActivoFiltro] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [current, setCurrent] = useState<OperadorEntity | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email_institucional: '',
    password: '',
    punto_acceso_default_id: 1,
    rol_id: 5, // Operador por defecto
  });

  async function loadOperadores(queryOverride?: string) {
    setLoading(true);
    try {
      const activeQ = queryOverride !== undefined ? queryOverride : q;
      const params = new URLSearchParams();
      if (activeQ) params.set('q', activeQ);
      if (activoFiltro) params.set('activo', activoFiltro);

      const res = await fetch(`/api/admin/operadores?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOperadores(data.operadores || []);
      }
    } catch (err) {
      console.error('Error cargando operadores:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOperadores();
  }, [activoFiltro]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/operadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onNotice('Operador creado exitosamente con contraseña segura.');
        setIsCreateOpen(false);
        setFormData({
          nombre: '',
          apellido: '',
          email_institucional: '',
          password: '',
          punto_acceso_default_id: 1,
          rol_id: 5,
        });
        loadOperadores();
      } else {
        await Swal.fire({
          title: 'Error al Crear',
          text: data.message || data.error || 'Error al crear operador',
          icon: 'error',
          confirmButtonColor: '#dc3545',
        });
      }
    } catch {
      await Swal.fire({
        title: 'Error de Conexión',
        text: 'Error de conexión con el servidor.',
        icon: 'error',
        confirmButtonColor: '#dc3545',
      });
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;
    try {
      const res = await fetch(`/api/admin/operadores/${current.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: current.nombre,
          apellido: current.apellido,
          email_institucional: current.email_institucional,
          punto_acceso_default_id: current.punto_acceso_default_id,
          rol_id: current.rol_id,
          activo: current.activo,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onNotice('Operador actualizado correctamente.');
        setIsEditOpen(false);
        setCurrent(null);
        loadOperadores();
      } else {
        await Swal.fire({
          title: 'Error al Actualizar',
          text: data.message || 'Error al actualizar',
          icon: 'error',
          confirmButtonColor: '#dc3545',
        });
      }
    } catch {
      await Swal.fire({
        title: 'Error de Conexión',
        text: 'Error de conexión con el servidor.',
        icon: 'error',
        confirmButtonColor: '#dc3545',
      });
    }
  }

  async function handleDelete(id: number, nombre: string) {
    if (id === 1 || id === 4) {
      await Swal.fire({
        title: 'Acción Denegada',
        text: 'Por seguridad del sistema, no se puede eliminar al Superadmin raíz.',
        icon: 'warning',
        confirmButtonColor: '#005691',
      });
      return;
    }
    const confirmRes = await Swal.fire({
      title: '¿Dar de baja operador?',
      text: `¿Confirma dar de baja al operador "${nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    });
    if (!confirmRes.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/operadores/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.ok) {
        onNotice('Operador removido del sistema.');
        loadOperadores();
      } else {
        await Swal.fire({
          title: 'Error al Eliminar',
          text: data.message || 'Error al eliminar',
          icon: 'error',
          confirmButtonColor: '#dc3545',
        });
      }
    } catch {
      await Swal.fire({
        title: 'Error de Conexión',
        text: 'Error de conexión con el servidor.',
        icon: 'error',
        confirmButtonColor: '#dc3545',
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar por Nombre o Email institucional..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadOperadores()}
              className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  loadOperadores('');
                }}
                title="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs p-1 rounded-full hover:bg-gray-100 transition"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={activoFiltro}
            onChange={(e) => setActivoFiltro(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Todos los Estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>

          <button
            onClick={() => loadOperadores()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
          >
            🔍 Buscar
          </button>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1 shadow-sm"
        >
          ➕ Nuevo Operador
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Operador</th>
                <th className="px-4 py-3">Email Institucional</th>
                <th className="px-4 py-3">Rol / Jerarquía</th>
                <th className="px-4 py-3">Punto Asignado</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Cargando operadores del sistema...
                  </td>
                </tr>
              ) : operadores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No se encontraron operadores registrados.
                  </td>
                </tr>
              ) : (
                operadores.map((op) => (
                  <tr key={op.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {op.nombre} {op.apellido}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{op.email_institucional}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-800 rounded">
                        {op.rol_nombre || 'Operador'} (Nivel {op.jerarquia || 3})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{op.punto_acceso_nombre || 'General'}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded ${
                          op.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {op.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setCurrent(op);
                            setIsEditOpen(true);
                          }}
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(op.id, `${op.nombre} ${op.apellido}`)}
                          className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-semibold"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">➕ Nuevo Operador de Sistema</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Institucional *</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@buenosaires.gob.ar"
                  value={formData.email_institucional}
                  onChange={(e) => setFormData({ ...formData, email_institucional: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contraseña Inicial *</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Rol / Permisos</label>
                  <select
                    value={formData.rol_id}
                    onChange={(e) => setFormData({ ...formData, rol_id: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {(catalogos?.roles_operadores || catalogos?.roles.filter((r) => r.jerarquia > 4 || ['Operador', 'Verificador', 'Administrador', 'Superadmin'].includes(r.nombre)))?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} (Nivel {r.jerarquia})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Punto por Defecto</label>
                  <select
                    value={formData.punto_acceso_default_id}
                    onChange={(e) =>
                      setFormData({ ...formData, punto_acceso_default_id: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {catalogos?.puntos_acceso.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold shadow"
                >
                  Crear Operador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {isEditOpen && current && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">✏️ Editar Operador</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={current.nombre}
                    onChange={(e) => setCurrent({ ...current, nombre: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={current.apellido}
                    onChange={(e) => setCurrent({ ...current, apellido: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Institucional</label>
                <input
                  type="email"
                  required
                  value={current.email_institucional}
                  onChange={(e) => setCurrent({ ...current, email_institucional: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Rol / Permisos</label>
                  <select
                    value={current.rol_id}
                    onChange={(e) => setCurrent({ ...current, rol_id: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {(catalogos?.roles_operadores || catalogos?.roles.filter((r) => r.jerarquia > 4 || ['Operador', 'Verificador', 'Administrador', 'Superadmin'].includes(r.nombre)))?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} (Nivel {r.jerarquia})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Punto por Defecto</label>
                  <select
                    value={current.punto_acceso_default_id}
                    onChange={(e) =>
                      setCurrent({ ...current, punto_acceso_default_id: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {catalogos?.puntos_acceso.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo_operador"
                  checked={current.activo}
                  onChange={(e) => setCurrent({ ...current, activo: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <label htmlFor="activo_operador" className="text-sm font-semibold text-gray-700">
                  Operador habilitado en el sistema
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
