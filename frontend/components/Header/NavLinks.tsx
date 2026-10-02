"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Secciones disponibles en la navegación principal
const links = [
    { href: "/", label: "Inicio", section: "inicio" },
    { href: "/#congreso", label: "El Congreso", section: "congreso" },
    { href: "/#programa", label: "Programa", section: "programa" },
    { href: "/participa", label: "Participa" },
    { href: "/contacto", label: "Contacto" },
    { href: "/materiales", label: "Materiales" },
];

interface NavLinksProps {
    mobile?: boolean;
    onLinkClick?: () => void;
}

const NavLinks = ({ mobile = false, onLinkClick }: NavLinksProps) => {
    const pathname = usePathname();
    const [seccionActiva, setSeccionActiva] = useState("inicio");

    useEffect(() => {
        /* En páginas internas se marca directamente la página actual */
        if (pathname !== "/") {
            setSeccionActiva(pathname);
            return;
        }

        const actualizarSeccion = () => {
            const headerOffset = 140;

            const programa = document.getElementById("programa");
            const congreso = document.getElementById("congreso");

            const posicionPrograma = programa
                ? programa.getBoundingClientRect().top
                : Infinity;

            const posicionCongreso = congreso
                ? congreso.getBoundingClientRect().top
                : Infinity;

            /* La última sección que ya pasó el punto de referencia es la activa */
            if (posicionPrograma <= headerOffset) {
                setSeccionActiva("programa");
            } else if (posicionCongreso <= headerOffset) {
                setSeccionActiva("congreso");
            } else {
                setSeccionActiva("inicio");
            }
        };

        actualizarSeccion();

        window.addEventListener("scroll", actualizarSeccion, { passive: true });
        window.addEventListener("resize", actualizarSeccion);

        return () => {
            window.removeEventListener("scroll", actualizarSeccion);
            window.removeEventListener("resize", actualizarSeccion);
        };
    }, [pathname]);

    const estaActivo = (link: (typeof links)[number]) => {
        if (pathname !== "/") {
            return pathname === link.href;
        }

        if (link.section) {
            return seccionActiva === link.section;
        }

        return false;
    };

    return (
        <div
            className={
                mobile
                    ? "flex flex-col items-start gap-3"
                    : "hidden items-center gap-10 xl:flex"
            }
        >
            {links.map((link) => {
                const activo = estaActivo(link);

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={onLinkClick}
                        aria-current={activo ? "page" : undefined}
                        className={`
                            relative inline-flex w-fit
                            font-bold text-gray-800 transition hover:text-amber-300
                            ${mobile ? "py-2" : "pb-1"}
                        `}
                    >
                        {link.label}

                        {/* Indicador de sección activa */}
                        <span
                            className={`
                                absolute left-0 h-0.5 bg-amber-400
                                transition-all duration-200
                                ${mobile ? "bottom-0" : "-bottom-1"}
                                ${activo ? "w-full" : "w-0"}
                            `}
                        />
                    </Link>
                );
            })}
        </div>
    );
};

export default NavLinks;