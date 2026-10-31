import Header from "../components/Header/Header";
import Footer from "@/components/Footer/Footer";
import PublicSectionsContainer from "@/components/PublicSectionsContainer";

export const metadata = {
  title: "Inicio | DETS 2026",
};

export const dynamic = 'force-dynamic';

async function getSeccionesVisibilidad() {
  const backendUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:4000';

  try {
    const res = await fetch(`${backendUrl}/api/frontend/secciones`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.secciones)) {
        return data.secciones;
      }
    }
  } catch (err) {
    // Retornar defaults si el backend estuviera momentáneamente offline
  }

  return [
    { key: 'hero', nombre: 'Sección Hero', enabled: true },
    { key: 'avisos', nombre: 'Avisos en Vivo (Push)', enabled: true },
    { key: 'sobre_congreso', nombre: 'El Congreso & Carrusel', enabled: true },
    { key: 'modalidades', nombre: 'Actividades & Modalidades', enabled: true },
    { key: 'programa', nombre: 'Programa del Congreso', enabled: true },
    { key: 'experiencia', nombre: '🎬 Video Institucional (Sumate a la experiencia ETS)', enabled: true },
  ];
}

export default async function Home() {
  const secciones = await getSeccionesVisibilidad();

  return (
    <div className="pt-24">
      {/* 1. NAV / HEADER: Estrictamente fijo e inmutable */}
      <Header />

      {/* 2. SECCIONES INTERMEDIAS: Visibilidad dinámica granular e inmediata */}
      <PublicSectionsContainer initialSecciones={secciones} />

      {/* 3. FOOTER: Estrictamente fijo e inmutable */}
      <Footer />
    </div>
  );
}