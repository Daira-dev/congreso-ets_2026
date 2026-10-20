// Header.tsx — Barra de navegación principal

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "./Logos";
import NavLinks from "./NavLinks";
import MenuButton from "./MenuBoton";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSynced, setIsSynced] = useState<boolean | null>(null);

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    useEffect(() => {
        const checkSync = () => {
            fetch('/api/vacantes/evento-activo')
                .then(res => {
                    if (res.ok) setIsSynced(true);
                    else setIsSynced(false);
                })
                .catch(() => setIsSynced(false));
        };
        checkSync();
        const interval = setInterval(checkSync, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="fixed left-0 top-0 z-50 w-full border-b border-gray-200 bg-white">
            <div className="px-8 py-4">

                {/* Navegación principal: links, ingreso y menú mobile */}
                <div className="flex items-center justify-between gap-6">
                    <Logo />

                    <div className="flex items-center gap-10">
                        <NavLinks />

                        {/* Botón de acceso y punto de estado */}
                        <div className="hidden xl:flex items-center gap-2">
                            <Link href="/login" className="hidden rounded bg-amber-400 px-4 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-black hover:text-white xl:inline-flex">
                                Ingresar
                            </Link>
                            <div 
                                className={`w-3 h-3 rounded-full ${isSynced === null ? 'bg-gray-300' : isSynced ? 'bg-green-500' : 'bg-red-500'}`} 
                                title={isSynced ? 'Sincronizado con el servidor' : 'Sin conexión con el servidor'}
                            />
                        </div>

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
                    <div className="mt-6 flex items-center justify-start gap-2">
                        <Link href="/login" onClick={closeMenu} className="inline-flex shrink-0 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-black hover:text-white">
                            Ingresar
                        </Link>
                        <div 
                            className={`w-3 h-3 rounded-full ${isSynced === null ? 'bg-gray-300' : isSynced ? 'bg-green-500' : 'bg-red-500'}`} 
                            title={isSynced ? 'Sincronizado con el servidor' : 'Sin conexión con el servidor'}
                        />
                    </div>
                </div>
            </aside>
        </header>
    );
};

export default Header;