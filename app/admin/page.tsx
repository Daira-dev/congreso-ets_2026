import prisma from "@/lib/prisma";

export default async function AdminDashboard() {
  const total = await prisma.registrant.count();
  const confirmados = await prisma.registrant.count({ where: { estado: "CONFIRMADA" } });
  const listaEspera = await prisma.registrant.count({ where: { estado: "LISTA_ESPERA" } });
  const asistencias = await prisma.registrant.count({ where: { asistencia: true } });

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1D3343] mb-8">Dashboard General</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-[#1D3343]">
          <p className="text-sm text-gray-500 font-semibold uppercase">Total Inscriptos</p>
          <p className="text-3xl font-bold text-[#1D3343] mt-2">{total}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-[#035C80]">
          <p className="text-sm text-gray-500 font-semibold uppercase">Confirmados</p>
          <p className="text-3xl font-bold text-[#035C80] mt-2">{confirmados}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-[#FFCD02]">
          <p className="text-sm text-gray-500 font-semibold uppercase">En Lista de Espera</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{listaEspera}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-green-600">
          <p className="text-sm text-gray-500 font-semibold uppercase">Acreditados (Check-in)</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{asistencias}</p>
        </div>
      </div>
    </div>
  );
}
