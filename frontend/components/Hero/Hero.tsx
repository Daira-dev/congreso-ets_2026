import Image from "next/image";
import imgEdificio from "@/assets/IFTS_27/hero/Imagen del header.jpg";
import logo from "@/assets/IFTS_27/hero/Logo en blanco.svg";

// import de las miscelaneas
import { Barra, LineasHeader, Triangulos } from "../Miscelaneas";

// import HeroAddress from "./HeroAddress";
// import HeroHeading from "./HeroHeading";

import HeroButton from "./HeroButton";

const Hero = () => {
    return (
        <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden bg-[#1D3343] text-center text-white md:min-h-[680px]">

            {/* Foto del edificio */}
            <div className="absolute right-0 top-0 h-full w-full opacity-30 md:w-[56%] md:opacity-100 [-webkit-mask-image:linear-gradient(to_right,transparent,black_45%)] [mask-image:linear-gradient(to_right,transparent,black_45%)]">
                <Image
                    src={imgEdificio}
                    alt=""
                    fill
                    priority
                    sizes="(min-width: 768px) 56vw, 100vw"
                    className="object-cover object-[70%_25%]"
                />
            </div>

            {/* Mascara negra para contraste */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.45)_50%,rgba(0,0,0,0.2)_100%)]" />

            {/* Misceláneas */}
            <LineasHeader className="absolute left-0 top-0 z-0 w-[110px] -translate-y-[19.8%] md:w-[16.5%]" />
            <Triangulos className="absolute left-[6%] top-[9%] z-[1] hidden w-[23%] md:block" />
            <Triangulos className="absolute bottom-[8%] right-[4%] z-[1] hidden w-[23%] md:block" />
            <Barra color="azul" className="absolute bottom-0 left-0 z-[1] w-[50%] md:w-[35%]" />

            {/* Contenido centrado */}
            <div className="relative z-10 flex flex-col items-center gap-3 px-5 py-12">
                <Image
                    src={logo}
                    alt="Construyendo Futuros"
                    priority
                    className="h-auto w-[130px] md:w-[190px]"
                />
                <p className="mt-2 text-xl md:text-2xl">1° Congreso</p>
                <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl">
                    Educación Técnica Superior
                </h1>
                <p className="text-base md:text-lg">
                    Universidad de la Ciudad de Buenos Aires · Tte. Gral. Juan Domingo Perón 802, CABA.
                </p>
                <HeroButton text="INSCRIBITE" />
            </div>
        </section>
    );
};

         {/* HERO VERSION ANTERIOR */}

        // <section className="bg-azul-oscuro">
        // <div className="flex min-h-[520px] flex-col items-center justify-center text-white px-6 py-10">

        //         {/* Nombre del Congreso */}
        //         <h4 className="text-lg font-medium uppercase tracking-[0.2em] text-white/80 md:text-xl">
        //             1° Congreso
        //         </h4>

        //         <HeroHeading
        //             text="Educación Técnica Superior"
        //             src={heroImage}
        //         />

        //         {/* Fecha y ubicación */}
        //         <HeroAddress text="6 de noviembre · Auditorio Polo Saavedra 5085 · Buenos Aires" />

        //         {/* Botón de inscripción */}
        //         <HeroButton text="Inscribirse" />
        //     </div>
        // </section>

export default Hero;