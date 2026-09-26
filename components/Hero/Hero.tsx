import HeroAddress from "./HeroAddress";
import HeroHeading from "./HeroHeading";
import HeroButton from "./HeroButton";

import heroImage from "@/assets/LOGOS/CONGRESO ETS/Logo_Cong_ETS_blanco.svg";

const Hero = () => {
    return (
        <section className="bg-azul-oscuro">
            <div className="flex min-h-[520px] flex-col items-center justify-center px-6 py-10 text-white">

                {/* Nombre del Congreso */}
                <h4 className="text-sm font-medium uppercase tracking-[0.18em] text-white/70 md:text-base">
                    1° Congreso
                </h4>

                <HeroHeading
                    text="Educación Técnica Superior"
                    src={heroImage}
                />

                {/* Lema */}
                <p className="mt-4 max-w-2xl text-center text-base font-medium leading-relaxed text-white/90 sm:text-lg md:text-xl">
                    Construyendo Futuros desde la Educación Técnica Superior
                </p>

                {/* Fecha y ubicación */}
                <HeroAddress
                    text={
                        <>
                            {/* Desktop */}
                            <span className="hidden md:block">
                                6 de noviembre de 2026 · 10:30 a 20:30 h
                                <br />
                                Universidad de la Ciudad de Buenos Aires · Tte. Gral. Juan Domingo Perón 802, CABA.
                            </span>

                            {/* Mobile */}
                            <span className="block md:hidden">
                                <span className="block">
                                    6 de noviembre de 2026 · 10:30 a 20:30 h
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

                {/* Botón de inscripción */}
                <HeroButton text="Inscribirse" />
            </div>
        </section>
    );
};

export default Hero;