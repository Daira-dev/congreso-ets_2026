"use client";
import { useState, useRef } from "react";
import AboutCongreso from "../AboutCongreso/AboutCongreso";
import Card from "./Card";
import imgCard1 from "@/assets/LOGOS/IFTS/logo-ifts-4.png";
import imgCard2 from "@/assets/LOGOS/IFTS/logo-ifts-4.png";
import imgCard3 from "@/assets/LOGOS/IFTS/logo-ifts-4.png";
import imgCard4 from "@/assets/LOGOS/IFTS/logo-ifts-4.png";
import Link from "next/link";

const CardsInfo = () => {
    const cardsData = [
        {
            id: 1,
            image: imgCard1,
            title: "Aula Abierta",
            description: "Orientaciones para presentar trabajos desarrollados durante la trayectoria formativa"
        },
        {
            id: 2,
            image: imgCard2,
            title: "Muestra permanente/Stands",
            description: "Orientaciones para presentar experiencias, proyectos y producciones de manera continua"
        },
        {
            id: 3,
            image: imgCard3,
            title: "Presentaciones académico-aplicadas",
            description: "Orientaciones para experiencias, sistematizaciones, investigaciones situadas y espacios de intercambio"
        },
        {
            id: 4,
            image: imgCard4,
            title: "Proyectos y producciones estudiantiles",
            description: "Orientaciones para la presentación en mesa académica de proyectos estudiantiles"
        }
    ];

    // REFERENCIAS Y ESTADOS PARA EL CARRUSEL
    const carouselRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // LOGICA PARA ARRASTRAR CON EL MOUSE
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        if (carouselRef.current) {
            setStartX(e.pageX - carouselRef.current.offsetLeft);
            setScrollLeft(carouselRef.current.scrollLeft);
        }
    };

    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !carouselRef.current) return;
        e.preventDefault();
        const x = e.pageX - carouselRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        carouselRef.current.scrollLeft = scrollLeft - walk;
    };

    // ACTUALIZAR PUNTOS AL HACER SCROLL (Mouse o Táctil)
    const handleScroll = () => {
        if (carouselRef.current) {
            const scrollPosition = carouselRef.current.scrollLeft;
            const cardWidth = carouselRef.current.children[0].clientWidth;
            const newIndex = Math.round(scrollPosition / cardWidth);
            setActiveIndex(newIndex);
        }
    };

    // CLICK EN LOS PUNTOS PARA NAVEGAR
    const scrollToCard = (index: number) => {
        if (carouselRef.current) {
            const container = carouselRef.current;
            const card = container.children[index] as HTMLElement;
            
            if (card) {
                container.scrollTo({
                    left: card.offsetLeft - container.offsetLeft,
                    behavior: "smooth"
                });
            }
            setActiveIndex(index);
        }
    };

    return (
        <section className="flex flex-col items-center w-full pb-10 overflow-hidden">
            

            {/* SECCIÓN DE CARDS Y CARRUSEL */}
            <div className="max-w-6xl w-full mx-auto px-4 py-16">
                
                {/* Contenedor del Carrusel */}
                <div 
                    ref={carouselRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-6 md:gap-8 pt-8 pb-8 mt-8 [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {cardsData.map((card, index) => (
                        <div 
                            key={index} 
                            className="min-w-[85%] sm:min-w-[calc(50%-1rem)] md:min-w-[calc(33.333%-1.5rem)] snap-center flex-shrink-0"
                        >
                            <Card 
                                cardImg={card.image} 
                                title={card.title} 
                                description={card.description}
                            />
                        </div>
                    ))}
                </div>

                {/* PUNTOS DINÁMICOS */}
                <div className="flex justify-center items-center gap-2 sm:gap-3 mt-4">
                    {cardsData.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollToCard(index)}
                            className={`transition-all duration-300 rounded-full ${
                                activeIndex === index 
                                    ? "w-8 sm:w-10 h-2.5 sm:h-3 bg-[#2A2B3A]" // Punto activo
                                    : "w-2.5 sm:w-3 h-2.5 sm:h-3 bg-gray-300 hover:bg-gray-400" // Puntos inactivos
                            }`}
                            aria-label={`Ir a la tarjeta ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* SECCIÓN DE INFORMACIÓN Y MAPA */}
            <div className="w-full bg-[#E8E8E8] flex flex-col md:flex-row justify-between items-stretch min-h-[220px] mt-8">
                
                {/* Info Izquierda */}
                <div className="flex flex-col md:flex-row items-center justify-center flex-1 py-10 px-8 gap-8 md:gap-12">
                    
                    {/* Fecha */}
                    <div className="flex items-start gap-4">
                        <div className="mt-1 text-black">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8Z"/>
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-[17px]">Fecha</h4>
                            <p className="text-gray-700 text-sm mt-1 leading-snug">Viernes 6 de<br/>noviembre 2026</p>
                        </div>
                    </div>
                    
                    {/* Divisores */}
                    <div className="hidden md:block w-px h-16 bg-gray-400"></div>
                    <div className="block md:hidden w-1/2 h-px bg-gray-400"></div>

                    {/* Ubicación */}
                    <div className="flex items-start gap-4">
                        <div className="mt-1 text-black">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"/>
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-[17px]">Auditorio Polo Saavedra</h4>
                            <p className="text-gray-700 text-sm mt-1 leading-snug">Crisólogo Larralde 5085<br/>Buenos Aires</p>
                        </div>
                    </div>
                </div>

                {/* Mapa Derecha */}
                <div className="flex-1 relative min-h-[300px] md:min-h-full bg-gray-200">
                    
                    <iframe 
                        src="https://maps.google.com/maps?q=Cris%C3%B3logo+Larralde+5085,+Buenos+Aires&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                        className="absolute inset-0 w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                    
                    {/* boton */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>

                    <Link 
                        href="/como-llego" 
                        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10"
                    >
                        <button className="bg-white px-6 py-2 rounded text-gray-800 text-sm font-semibold shadow-[0_4px_12px_rgb(0,0,0,0.15)] flex items-center gap-2 hover:bg-[#FFCD02] hover:scale-105 transition-all cursor-pointer">
                            Cómo llegar &rarr;
                        </button>
                    </Link>
                </div>

            </div>
        </section>
    );
};

export default CardsInfo;