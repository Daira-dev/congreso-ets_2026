"use client";
import { useState, useEffect } from "react";

interface AdminUser {
  id: string;
  usuario: string;
  rol: string;
  createdAt: string;
}

export default function UsuariosAdmin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [nuevoRol, setNuevoRol] = useState("ACOMPAÑADOR");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        throw new Error("No autorizado para ver o crear usuarios (Se requiere SUPER_ADMIN)");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: nuevoUsuario, clave: nuevaClave, rol: nuevoRol }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear usuario");
      }
      setNuevoUsuario("");
      setNuevaClave("");
      setNuevoRol("ACOMPAÑADOR");
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string, usuario: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${usuario}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8">Cargando usuarios...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1D3343] mb-8">Gestión de Usuarios</h1>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded font-bold">{error}</div>}

      {!error && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8 border-l-4 border-l-[#FFCD02]">
          <h2 className="text-xl font-bold text-[#035C80] mb-4">Crear Nuevo Usuario</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-[#1D3343] mb-1">Usuario</label>
              <input required type="text" value={nuevoUsuario} onChange={e => setNuevoUsuario(e.target.value)} className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-[#035C80]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1D3343] mb-1">Clave</label>
              <input required type="password" value={nuevaClave} onChange={e => setNuevaClave(e.target.value)} className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-[#035C80]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1D3343] mb-1">Rol</label>
              <select value={nuevoRol} onChange={e => setNuevoRol(e.target.value)} className="w-full border border-gray-300 p-2 rounded bg-white focus:outline-none focus:border-[#035C80]">
                <option value="ACOMPAÑADOR">ACOMPAÑADOR (Lector QR)</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>
            <button type="submit" className="bg-[#1D3343] text-white font-bold py-2.5 px-4 rounded hover:bg-[#035C80] transition-colors">
              Crear
            </button>
          </form>
        </div>
      )}

      {!error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#1D3343]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Fecha Creación</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-[#1D3343]">{user.usuario}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.rol === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' : user.rol === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.usuario !== 'superadmin' && (
                      <button onClick={() => handleDelete(user.id, user.usuario)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded hover:bg-red-100 transition-colors">
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
