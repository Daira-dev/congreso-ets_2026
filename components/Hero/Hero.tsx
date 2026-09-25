import HeroAddress from "./HeroAddress";
import HeroHeading from "./HeroHeading";
import HeroButton from "./HeroButton";

import heroImage from "@/assets/LOGOS/CONGRESO ETS/Logo_Cong_ETS_blanco.svg";

const Hero = () => {
    return (
        <section className="bg-azul-oscuro">
            <div className="flex min-h-[520px] flex-col items-center justify-center text-white px-6 py-10">

                {/* Nombre del Congreso */}
                <h4 className="text-lg font-medium uppercase tracking-[0.2em] text-white/80 md:text-xl">
                    1° Congreso
                </h4>

                <HeroHeading
                    text="Educación Técnica Superior"
                    src={heroImage}
                />

                {/* Fecha y ubicación */}
                <HeroAddress
                    text={
                        <>
                            <span className="block md:inline">
                                6 de noviembre
                            </span>

                            <span className="hidden md:inline"> · </span>

                            <span className="block md:inline">
                                Universidad de la Ciudad de Buenos Aires · Tte. Gral. Juan Domingo Perón 802
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