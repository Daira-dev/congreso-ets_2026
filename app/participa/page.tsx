import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export default function Participa() {
    return (
        <div className="min-h-screen bg-white pt-24 flex flex-col">
            <title>Participa | DETS 2026</title>
            <Header />

            <main className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center flex-1">
                <div className="text-center mb-10">
                    <h1 className="text-2xl text-[var(--color-azul-oscuro)] md:text-3xl font-extrabold">
                        ¡Asegurá tu lugar hoy mismo!
                    </h1>
                    <h2 className="text-sm uppercase tracking-widest text-[var(--color-azul-claro)] font-bold mb-1">
                        Gratuito, presencial y con streaming en vivo. Certificado oficial del GCBA incluido.
                    </h2>
                    <br /><br />
                    <p>
                        La inscripción para asistir al Congreso estará disponible próximamente. La participación es gratuita y estará sujeta a la capacidad de la sede.
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
