import HeroAddress from "./HeroAddress";
import HeroHeading from "./HeroHeading";
import HeroButton from "./HeroButton";

import heroImage from "@/assets/LOGOS/CONGRESO ETS/Logo_Cong_ETS_blanco.svg";

const Hero = () => {
    return (
        <section className="relative overflow-hidden bg-azul-oscuro text-white">

            {/* Decoración -círculitos- */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full border border-white/10" />

            <div className="relative mx-auto flex min-h-[540px] max-w-5xl flex-col items-center px-6 pb-10 pt-12 text-center sm:px-8 md:pt-16">

                {/* Identificación del evento */}
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-amarillo sm:text-sm">
                    1° Congreso
                </p>

                {/* Nombre del Congreso */}
                <div className="w-full max-w-2xl">
                    <HeroHeading
                        text="Educación Técnica Superior"
                        src={heroImage}
                    />
                </div>

                {/* Lema */}
                <div className="mt-4 max-w-2xl">
                    <p className="text-base font-medium leading-relaxed text-white/90 sm:text-lg md:text-xl">
                        Construyendo Futuros desde la Educación Técnica Superior
                    </p>

                    {/* Línea decorativa */}
                    <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-[#FFCD02]" />
                </div>

                {/* Fecha y ubicación */}
                <div className="mt-2 w-full max-w-3xl">
                    <HeroAddress
                        text={
                            <>
                                {/* Desktop */}
                                <span className="hidden md:block">
                                    6 de noviembre de 2026 · 10:30 a 20:30 hs.
                                    <br />
                                    Universidad de la Ciudad de Buenos Aires · Tte. Gral. Juan Domingo Perón 802, CABA.
                                </span>

                                {/* Mobile */}
                                <span className="block md:hidden">
                                    <span className="block">
                                        6 de noviembre de 2026 · 10:30 a 20:30 hs.
                                    </span>

                                    <span className="mt-1 block">
                                        Universidad de la Ciudad de Buenos Aires
                                    </span>

                                    <span className="mt-1 block">
                                        Tte. Gral. Juan Domingo Perón 802, Ciudad Autónoma de Buenos Aires
                                    </span>
                                </span>
                            </>
                        }
                    />
                </div>

                {/* Acción principal */}
                <div className="mt-3">
                    <HeroButton text="Inscribirse" />
                </div>
            </div>
        </section>
    );
};

export default Hero;