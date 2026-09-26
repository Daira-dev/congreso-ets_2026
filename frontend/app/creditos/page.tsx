import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";


export default function Creditos() {
    return (
        <div className="min-h-screen bg-slate-50/50 pt-24 flex flex-col">
            <title>Créditos | DETS 2026</title>
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center flex-1 w-full">
                <div className="text-center mb-8 max-w-2xl">
                    <h1 className="text-2xl text-[var(--color-azul-oscuro)] md:text-4xl font-extrabold tracking-tight mb-2">
                        Equipo del proyecto
                    </h1>
                    <br />
                    <p className="text-xs md:text-sm text-gray-600">
                        El 1er Congreso de Educación Técnica Superior – ETS 2026 es una iniciativa de la Dirección de Educación Técnica Superior del Ministerio de Educación de la Ciudad de Buenos Aires. Su organización y desarrollo articulan el trabajo de equipos de la DETS y de los Institutos de Formación Técnica Superior.
                    </p>
                </div>

            </main>

            <Footer />
        </div>
    );
}