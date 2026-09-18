import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1D3343] text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-[#035C80]">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <p className="text-xs text-[#FFCD02] mt-1">Congreso ETS 2026</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="block px-4 py-2 rounded hover:bg-[#035C80] transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/usuarios" className="block px-4 py-2 rounded hover:bg-[#035C80] transition-colors">
            Gestión de Usuarios
          </Link>
          <Link href="/login" className="block px-4 py-2 mt-8 rounded hover:bg-red-700 transition-colors">
            Cerrar Sesión
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Mobile */}
        <header className="md:hidden bg-[#1D3343] text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold">Admin Panel</h2>
          <Link href="/login" className="text-sm bg-red-700 px-3 py-1 rounded">Salir</Link>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
