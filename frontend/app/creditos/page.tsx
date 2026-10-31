import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import Image from 'next/image';
import logoIfts4 from '../../assets/LOGOS/IFTS/logo-ifts-4.png';
{/*import logoIfts15 from '../../assets/LOGOS/IFTS/logo-ifts-15.png'; Descomentar cuando haya logo*/ }
{/*import logoIfts27 from '../../assets/LOGOS/IFTS/logo-ifts-27.png';*/ }


export default function Creditos() {
    return (
        <div className="min-h-screen bg-slate-50/50 pt-24 flex flex-col">
            <title>Créditos | DETS 2026</title>
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center flex-1 w-full">
                <div className="text-center mb-8 max-w-2xl">
                    <h1 className="text-2xl text-[var(--color-azul-claro)] md:text-4xl font-extrabold tracking-tight mb-2">
                        Equipo del proyecto
                    </h1>
                    <br />
                    <p className="text-xs md:text-sm text-[var(--color-azul-oscuro)]">
                        El 1er Congreso de Educación Técnica Superior – ETS 2026 es una iniciativa de la Dirección de Educación Técnica Superior del Ministerio de Educación de la Ciudad de Buenos Aires. Su organización y desarrollo articulan el trabajo de equipos de la DETS y de los Institutos de Formación Técnica Superior.
                    </p>
                </div>

                { }
                <div className="space-y-4">

                    {/* Tarjeta 1 - IFTS 4 */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 md:p-6 text-left transition-shadow hover:shadow-md flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                        {/* Ejemplo con Logo provisorio IFTS 4 */}
                        <Image
                            src={logoIfts4}
                            alt="Logo IFTS Nº 4"
                            className="w-16 h-16 shrink-0 object-contain rounded-md"
                        />

                        <div className="flex-1 w-full">
                            <h3 className="font-bold text-[var(--color-azul-claro)] text-base md:text-lg border-b border-gray-100 pb-3 mb-3">
                                IFTS Nº 4 – Desarrollo del sistema web
                            </h3>
                            <div className="text-sm text-gray-600 flex flex-col gap-2">
                                <p className="font-medium text-[var(--color-azul-oscuro)] flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2 flex-shrink-0"></span>
                                    Equipo docente de la Práctica Profesionalizante.
                                </p>
                                <p className="font-medium text-[var(--color-azul-oscuro)] flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2 flex-shrink-0"></span>
                                    Estudiantes participantes del desarrollo web.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 2 - IFTS 15 */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 md:p-6 text-left transition-shadow hover:shadow-md flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                        <div className="w-16 h-16 bg-blue-50/80 text-[var(--color-azul-oscuro)] rounded-xl border border-blue-200/60 flex-shrink-0 flex flex-col items-center justify-center font-bold text-xs shadow-xs">
                            <span className="text-[10px] text-gray-500 font-medium">IFTS</span>
                            <span className="text-lg leading-none font-extrabold text-[var(--color-azul-claro)]">15</span>
                        </div>

                        <div className="flex-1 w-full">
                            <h3 className="font-bold text-[var(--color-azul-claro)] text-base md:text-lg border-b border-gray-100 pb-3 mb-3">
                                IFTS Nº 15 – Producción audiovisual
                            </h3>
                            <div className="text-sm text-gray-600 flex flex-col gap-2">
                                <p className="font-medium text-[var(--color-azul-oscuro)] flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2 flex-shrink-0"></span>
                                    Estudiantes participantes de la producción audiovisual.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 3 - IFTS 27 */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 md:p-6 text-left transition-shadow hover:shadow-md flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                        <div className="w-16 h-16 bg-blue-50/80 text-[var(--color-azul-oscuro)] rounded-xl border border-blue-200/60 flex-shrink-0 flex flex-col items-center justify-center font-bold text-xs shadow-xs">
                            <span className="text-[10px] text-gray-500 font-medium">IFTS</span>
                            <span className="text-lg leading-none font-extrabold text-[var(--color-azul-claro)]">27</span>
                        </div>

                        <div className="flex-1 w-full">
                            <h3 className="font-bold text-[var(--color-azul-claro)] text-base md:text-lg border-b border-gray-100 pb-3 mb-3">
                                IFTS Nº 27 – Producción de recursos gráficos y multimediales
                            </h3>
                            <div className="text-sm text-gray-600 flex flex-col gap-2">
                                <p className="font-medium text-[var(--color-azul-oscuro)] flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2 flex-shrink-0"></span>
                                    Estudiantes participantes de la producción de recursos.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 4 - Otros equipos */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 md:p-6 text-left transition-shadow hover:shadow-md flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                        <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 flex-shrink-0 flex flex-col items-center justify-center font-bold text-xs shadow-xs">
                            <span className="text-[10px] text-gray-500 font-medium">RED</span>
                            <span className="text-sm leading-none font-extrabold text-slate-700">DETS</span>
                        </div>

                        <div className="flex-1 w-full">
                            <h3 className="font-bold text-[var(--color-azul-claro)] text-base md:text-lg border-b border-gray-100 pb-3 mb-3">
                                Otros equipos y colaboraciones institucionales
                            </h3>
                            <div className="text-sm text-gray-600 flex flex-col gap-2">
                                <p className="font-medium text-[var(--color-azul-oscuro)] flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2 flex-shrink-0"></span>
                                    Comunidad educativa de los Institutos de Formación Técnica Superior y equipos técnicos del Ministerio de Educación.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

            </main>

            <Footer />
        </div>
    );
}