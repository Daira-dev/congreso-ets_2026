import Image from "next/image";
import logoMinisterioGobierno from "@/assets/LOGOS/MINISTERIO DE EDUCACIÓN/Bajada_blanco.png";
import logoCongreso from "@/assets/LOGOS/Congreso/MARCA BLANCO.svg";

const Footer = () => {
    return (
        <footer className="bg-azul-oscuro px-6 pb-5 pt-8 text-blanco md:px-10">
            <div className="mx-auto flex flex-col items-center gap-6 border-b border-blanco/25 pb-6">
                {/* Logos centrados */}
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
                    {/* Logo Ministerio */}
                    <Image
                        src={logoMinisterioGobierno}
                        alt="Ministerio de Educación del Gobierno de la Ciudad de Buenos Aires"
                        className="h-12 w-auto sm:h-14 md:h-16"
                    />

                    {/* Logo Congreso + texto */}
                    <div className="flex items-center gap-3">
                        <Image
                            src={logoCongreso}
                            alt="Logo del Congreso de Educación Técnica Superior"
                            className="h-12 w-auto sm:h-14 md:h-16"
                        />

                        <p className="max-w-[180px] text-sm font-semibold leading-snug sm:max-w-[220px] sm:text-base">
                            1° Congreso de Educación
                            <br />
                            Técnica Superior
                        </p>
                    </div>
                </div>
            </div>

            {/* Contacto */}
            <div className="mx-auto max-w-7xl pt-5 text-center">
                <p className="text-sm leading-relaxed">
                    Consultas institucionales:
                    <a className="ml-2 font-semibold underline hover:no-underline" href="mailto:congreso.dets@bue.edu.ar">
                        congreso.dets@bue.edu.ar
                    </a>
                </p>
            </div>

            <div className="mx-auto max-w-5xl pt-4 text-center">
                <p className="text-xs text-blanco/60">
                    © 2026 · Todos los derechos reservados · Equipo Desarrollo IFTS°4 {/* Esto hay que comentarlo porque en la documentacion figura PENDIENTE*/}
                </p>
            </div>
        </footer>
    );
};

export default Footer;