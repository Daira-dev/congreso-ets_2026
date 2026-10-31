import { Suspense } from "react";
import Header from "../components/Header/Header";
import Hero from "@/components/Hero/Hero";
import SobreCongreso from "@/components/Congreso/SobreCongreso";
import SectionCongreso from "@/components/SectionCongreso/SectionCongreso";
import SectionExperiencia from "@/components/SectionExperiencia/SectionExperiencia";
import SectionPrograma from "@/components/SectionPrograma/SectionPrograma";
import Footer from "@/components/Footer/Footer";
import PushSubscriptionBanner from "@/components/PushSubscriptionBanner";

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
    { key: 'hero', enabled: true },
    { key: 'avisos', enabled: true },
    { key: 'sobre_congreso', enabled: true },
    { key: 'modalidades', enabled: true },
    { key: 'programa', enabled: true },
    { key: 'experiencia', enabled: true },
  ];
}

export default async function Home() {
  const secciones = await getSeccionesVisibilidad();
  const isEnabled = (key: string) =>
    secciones.find((s: any) => s.key === key)?.enabled !== false;

  return (
    <div className="pt-24">
      {/* 1. NAV / HEADER: Estrictamente fijo e inmutable */}
      <Header />

      {/* 2. SECCIONES INTERMEDIAS: Visibilidad dinámica granular */}
      {isEnabled('hero') && <Hero />}

      {isEnabled('avisos') && (
        <div className="max-w-7xl mx-auto px-4">
          <PushSubscriptionBanner />
        </div>
      )}

      {isEnabled('sobre_congreso') && <SobreCongreso />}

      {isEnabled('modalidades') && (
        <Suspense fallback={<div>Cargando actividades...</div>}>
          <SectionCongreso />
        </Suspense>
      )}

      {isEnabled('programa') && <SectionPrograma />}

      {isEnabled('experiencia') && <SectionExperiencia />}

      {/* 3. FOOTER: Estrictamente fijo e inmutable */}
      <Footer />
    </div>
  );
}