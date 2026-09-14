// Header.tsx — Barra de navegación principal

"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logos";
import NavLinks from "./NavLinks";
import MenuButton from "./MenuBoton";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <header className="fixed left-0 top-0 z-50 w-full border-b border-gray-200 bg-white">
            <div className="px-8 py-4">

                {/* Navegación principal: links, ingreso y menú mobile */}
                <div className="flex items-center justify-between gap-6">
                    <Logo />

                    <div className="flex items-center gap-10">
                        <NavLinks />

                        {/* Botón de acceso. Apunta a /login */}
                        <Link href="/login"
                            className="hidden rounded bg-amber-400 px-4 py-2 font-bold text-gray-800 transition hover:bg-black hover:text-white xl:inline-flex"
                        >
                            Ingresar
                        </Link>

                        <MenuButton
                            isOpen={isMenuOpen}
                            onClick={() => setIsMenuOpen((open) => !open)}
                        />
                    </div>
                </div>
            </div>

            {/* Cerrar el menú al dar click fuera */}
            {isMenuOpen && (
                <button
                    type="button"
                    aria-label="Cerrar menú"
                    onClick={closeMenu}
                    className="fixed inset-0 z-40 bg-black/20 xl:hidden"
                />
            )}

            {/* Menú lateral para pantallas menores a xl */}
            <aside
                className={`fixed right-0 top-0 z-50 h-full w-[280px] bg-white shadow-xl transition-transform duration-300 xl:hidden ${
                    isMenuOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex h-full flex-col p-6">

                    {/* Botón para cerrar el menú */}
                    <div className="flex items-center justify-end border-b border-gray-200 pb-5">
                        <MenuButton isOpen={isMenuOpen} onClick={closeMenu} />
                    </div>

                    <div className="mt-5">
                        <NavLinks mobile onLinkClick={closeMenu} />
                    </div>

                    {/* Mantener sincronizado con el botón de acceso del navbar */}
                    <Link href="/login" onClick={closeMenu}
                        className="mt-6 inline-flex rounded bg-amber-400 px-4 py-2 font-bold text-gray-800 transition hover:bg-black hover:text-white"
                    >
                        Ingresar
                    </Link>
                </div>
            </aside>
        </header>
    );
};

export default Header;