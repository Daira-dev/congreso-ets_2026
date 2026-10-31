"use client";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Card from "./Card";
import imgCard1 from "@/assets/IFTS_27/iconos_card/icono=aulaabierta.svg";
import imgCard2 from "@/assets/IFTS_27/iconos_card/icono=muestrapermanente.svg";
import imgCard3 from "@/assets/IFTS_27/iconos_card/icono=presentacionacademica.svg";
import imgCard4 from "@/assets/IFTS_27/iconos_card/icono=proyectos.svg";
import imgCard5 from "@/assets/IFTS_27/iconos_card/icono=talentos.svg";
import miscelaneaBarraBlanca from "@/assets/IFTS_27/hero/Miscelanea barra blanca.svg";
import miscelaneaPuntos from "@/assets/IFTS_27/hero/Miscelanea puntos.svg";
import Link from "next/link";
import Image from "next/image";
import miscelanea_azul from "@/assets/IFTS_27/hero/Miscelanea barra azul.svg" ;
import miscelanea_oscura from "@/assets/IFTS_27/hero/Miscelanea barra oscura.svg";

const CardsInfo = () => {
    const [evento, setEvento] = useState<any>(null);
    const searchParams = useSearchParams();

    const DEFAULT_CARDS = [
        {
            id: 1,
            image: imgCard1,
            builtinKey: "card1",
            title: "Aula Abierta",
            badge: "Demostración Práctica",
            description: "Instancias programadas para mostrar el saber hacer técnico-profesional en acción. Permiten presentar procedimientos, prácticas, simulaciones, intervenciones, uso de herramientas, resolución de problemas o secuencias de trabajo que necesitan ser observadas de manera dinámica y contextualizada.",
            pdfUrl: "/PDF/1 Aula Abierta - demostraciones aplicadas.pdf"
        },
        {
            id: 2,
            image: imgCard2,
            builtinKey: "card2",
            title: "Muestra permanente / Stands",
            badge: "Exhibición Permanente",
            description: "Espacio institucional de muestra permanente destinado a exhibir experiencias, proyectos, producciones y evidencias formativas. El foco no está solamente en el resultado final, sino también en el proceso, las decisiones técnicas, la participación estudiantil y los aprendizajes construidos.",
            pdfUrl: "/PDF/2 Muestra permanente - Stands.pdf"
        },
        {
            id: 3,
            image: imgCard3,
            builtinKey: "card3",
            title: "Presentaciones académico - aplicadas",
            badge: "Académico",
            description: "Espacios para explicar, analizar y sistematizar experiencias reales vinculadas con la Educación Técnica Superior. Pueden incluir experiencias de enseñanza, prácticas profesionalizantes, investigaciones situadas, sistematizaciones, análisis de casos y modelos de gestión o enseñanza, siempre vinculados con procesos institucionales concretos.",
            pdfUrl: "/PDF/3 Presentaciones académico-aplicadas.pdf"
        },
        {
            id: 4,
            image: imgCard4,
            builtinKey: "card4",
            title: "Proyectos y producciones de estudiantes",
            badge: "Estudiantil",
            description: "Espacio de presentación de proyectos, producciones y desarrollos realizados por estudiantes en el marco de sus trayectorias formativas. Las presentaciones deberán permitir comprender el problema abordado, el proceso de trabajo, las decisiones tomadas, las evidencias producidas y los aprendizajes construidos, con acompañamiento institucional.",
            pdfUrl: "/PDF/4 Proyectos y producciones estudiantiles.pdf"
        },
        {
            id: 5,
            image: imgCard5,
            builtinKey: "card5",
            title: "Talentos ETS",
            badge: "Pitch / Panel",
            description: "Dispositivo de presentación breve de proyectos aplicados con preguntas y devolución formativa de un panel. Su finalidad es enriquecer los proyectos y fortalecer capacidades de comunicación, argumentación y mejora. No constituye una competencia: no hay ranking, ganadores, premiación, reclutamiento ni promesas de oportunidades posteriores.",
            pdfUrl: "/PDF/5 Talentos ETS.pdf"
        }
    ];

    const [cardsData, setCardsData] = useState<any[]>([]);
    const [cardsLoaded, setCardsLoaded] = useState(false);

    useEffect(() => {
        const previewId = searchParams?.get('preview_id');
        const url = previewId ? `/api/vacantes/evento-activo?preview_id=${previewId}` : '/api/vacantes/evento-activo';
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.evento) {
                    setEvento(data.evento);
                }
            })
            .catch(console.error);

        // Cargar tarjetas dinámicas del CMS
        const cargarTarjetas = () => {
            fetch('/api/frontend/cards', { cache: 'no-store' })
                .then(res => res.json())
                .then(data => {
                    if (data.ok && Array.isArray(data.cards)) {
                        // Mapear íconos integrados si corresponde
                        const iconMap: Record<string, any> = {
                            card1: imgCard1,
                            card2: imgCard2,
                            card3: imgCard3,
                            card4: imgCard4,
                            card5: imgCard5,
                        };
                        const resolved = data.cards
                            .filter((c: any) => c.activo !== false && (c as any).visible !== false)
                            .map((c: any) => ({
                                ...c,
                                image: (c.builtinKey && iconMap[c.builtinKey]) || c.image || imgCard1,
                            }));
                        setCardsData(resolved);
                        setCardsLoaded(true);
                    } else {
                        setCardsLoaded(true);
                    }
                })
                .catch((err) => {
                    console.error('Error cargando tarjetas:', err);
                    setCardsData(DEFAULT_CARDS);
                    setCardsLoaded(true);
                });
        };

        cargarTarjetas();

        const handleCardsUpdated = () => {
            cargarTarjetas();
        };

        window.addEventListener('cards-updated', handleCardsUpdated);
        return () => window.removeEventListener('cards-updated', handleCardsUpdated);
    }, [searchParams]);

    const formatearFecha = (fechaStr: string) => {
        if (!fechaStr) return '';
        const justDate = fechaStr.split('T')[0];
        const f = new Date(justDate + 'T12:00:00Z');
        return new Intl.DateTimeFormat('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(f).replace(',', '');
    };

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

    // ACTUALIZAR PUNTOS AL HACER SCROLL
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
        <section className="relative flex flex-col items-center w-full pb-10 bg-white">
            {/* CONTENEDOR DE ACTIVIDADES */}
            <div className="relative w-full">

                {/* ENCABEZADO DECORATIVO (Noelia-Cards) */}
                <div className="w-full relative" style={{ backgroundColor: 'var(--color-blanco)' }}>
                    {/* 1. Fondo azul superior */}
                    <div className="relative w-full pt-3 md:pt-4 overflow-hidden" style={{ backgroundColor: 'var(--color-azul-claro)' }}>
                        <div className="w-1/2 md:w-1/3 flex items-end">
                            <img
                                src={miscelaneaBarraBlanca.src || miscelaneaBarraBlanca}
                                alt=""
                                className="w-full h-auto block align-bottom pointer-events-none object-contain"
                            />
                        </div>
                    </div>

                    {/* 2. Franja de puntos continuos */}
                    <div className="relative z-10 w-full pt-3 pb-2 overflow-hidden -mt-[1px]" style={{ backgroundColor: 'var(--color-blanco)' }}>
                        <div className="flex w-full items-center justify-start gap-0 overflow-hidden">
                            {Array.from({ length: 45 }).map((_, i) => (
                                <img
                                    key={i}
                                    src={miscelaneaPuntos.src || miscelaneaPuntos}
                                    alt=""
                                    className="h-3 md:h-3.5 shrink-0 block object-contain pointer-events-none"
                                />
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="max-w-6xl w-full mx-auto px-4 pt-16 pb-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1D3343] text-left">
                        Actividades
                    </h2>
                    <p className="text-gray-600 text-base mt-2 text-left"> Conocé las diferentes modalidades de participación y presentación previstas para el congreso.</p>
                </div>

                {/* SECCION DE CARDS Y CARRUSEL */}
                <div className="relative max-w-6xl w-full mx-auto px-4 pb-16">
                    {cardsData.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 my-4">
                            <p className="text-gray-500 text-sm font-semibold">
                                Actualmente no hay modalidades de participación activas para mostrar.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Contenedor del Carrusel */}
                            <div 
                                ref={carouselRef}
                                onMouseDown={handleMouseDown}
                                onMouseLeave={handleMouseLeave}
                                onMouseUp={handleMouseUp}
                                onMouseMove={handleMouseMove}
                                onScroll={handleScroll}
                                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-6 pt-4 pb-8 [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
                                style={{ scrollbarWidth: 'none' }}
                            >
                                {cardsData.map((card, index) => (
                                    <div 
                                        key={card.id ?? index} 
                                        className="w-[290px] sm:w-[330px] shrink-0 snap-center flex flex-col"
                                    >
                                        <Card 
                                            cardImg={card.image} 
                                            title={card.title} 
                                            description={card.description}
                                            pdfUrl={card.pdfUrl}
                                            badge={card.badge}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* PUNTOS */}
                            {cardsData.length > 1 && (
                                <div className="flex justify-center items-center gap-2 sm:gap-3 mt-2">
                                    {cardsData.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => scrollToCard(index)}
                                            className={`transition-all duration-300 rounded-full ${
                                                activeIndex === index 
                                                    ? "w-8 sm:w-10 h-2.5 sm:h-3 bg-[#1D3343]" // Azul Oscuro para el activo
                                                    : "w-2.5 sm:w-3 h-2.5 sm:h-3 bg-gray-300 hover:bg-[#035C80]" // Azul Claro en hover
                                            }`}
                                            aria-label={`Ir a la tarjeta ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* MISCELANEA BARRA OSCURA */}
                <div className="absolute pointer-events-none bottom-[-25px] md:bottom-[-15px] left-[-0.5px] z-20 w-[min(720px,90vw)] translate-y-1/2">
                    <Image
                        src={miscelanea_oscura}
                        alt=""
                        aria-hidden={true}
                        width={720}
                        height={200}
                        className="block h-auto w-full"
                    />
                </div>
            </div>
            

            {/* SECCION DE INFORMACION Y MAPA */}
            <div className="relative mt-8 min-h-[460px] w-full overflow-hidden bg-[#1c3342]">

                <div className="relative z-10 grid min-h-[460px] grid-cols-1 items-center gap-10 px-6 py-12 sm:px-10 md:grid-cols-[1.05fr_0.95fr] md:gap-8 md:px-8 md:py-16 lg:px-14 xl:px-16">

                    {/* INFO IZQUIERDA */}
                    <div className="flex flex-col items-start justify-center gap-8 sm:flex-row sm:gap-6 md:gap-5 lg:gap-8">

                        {/* FECHA */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 shrink-0 text-white">
                                <svg className="w-full h-auto" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8Z"/>
                                </svg>
                            </div>
                            <div className="min-w-[130px]">
                                <h4 className="text-[17px] font-bold text-white">Fecha</h4>
                                <p className="mt-1 text-sm leading-snug text-white">
                                    {evento && evento.fecha_inicio ? (
                                        <>
                                            {formatearFecha(evento.fecha_inicio)}
                                            {evento.fecha_fin && evento.fecha_fin !== evento.fecha_inicio && (
                                                <>
                                                    <br />
                                                    al {formatearFecha(evento.fecha_fin)}
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>Viernes 6 de<br />noviembre 2026</>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* DIVISORES */}
                        <div className="hidden h-24 w-px shrink-0 bg-white/60 sm:block" />
                        {/* <div className="block md:hidden w-1/2 h-px bg-gray-300"></div> */}

                        {/* UBICACIÓN */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 shrink-0 text-white">
                                <svg className="w-full h-auto fill-none stroke-white" strokeWidth="1.5" viewBox="0 0 24 24" stroke="white" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"/>
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-[17px] font-bold text-white">
                                    {evento?.sede_nombre || "Auditorio Polo Saavedra"}
                                </h4>
                                <p className="mt-1 text-sm leading-snug text-white">
                                    {evento?.sede_direccion ? (
                                        evento.sede_direccion.split(",").map((line: string, i: number) => (
                                            <span key={i}>
                                                {line.trim()}
                                                {i === 0 && <br />}
                                            </span>
                                        ))
                                    ) : (
                                        <>Crisólogo Larralde 5085<br />Buenos Aires</>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* MAPA Y BOTÓN DERECHOS*/}
                    <div className="mx-auto flex w-full max-w-[590px] flex-col items-center gap-6 md:ml-auto">
                        <div className="relative h-[280px] w-full overflow-hidden rounded-xl bg-gray-200 sm:h-[300px] md:h-[290px] lg:h-[320px]">
                            <iframe
                                src={evento?.sede_mapa_url || "https://maps.google.com/maps?q=Cris%C3%B3logo+Larralde+5085,+Buenos+Aires&t=&z=15&ie=UTF8&iwloc=&output=embed"}
                                title="Ubicación del evento"
                                className="absolute inset-0 h-full w-full border-0"
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>

                        <Link
                            href={evento?.sede_mapa_url || "https://maps.google.com/?q=Crisólogo+Larralde+5085,+Ciudad+Autónoma+de+Buenos+Aires"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#FFCD02] px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-[#f5bd00] no-underline"
                        >
                            Cómo llegar <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>

                {/* MISCELÁNEA BARRA AZUL */}
                <div className="pointer-events-none absolute bottom-0 left-0 z-10 w-[min(720px,90vw)]">
                    <Image
                        src={miscelanea_azul}
                        alt=""
                        aria-hidden={true}
                        width={720}
                        height={200}
                        className="block h-auto w-full"
                    />
                </div>
            </div>
        </section>
    );
};

export default CardsInfo;
