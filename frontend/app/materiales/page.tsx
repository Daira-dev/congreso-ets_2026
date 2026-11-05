// page.tsx — Página de materiales y novedades del Congreso con soporte de contenido anidado dinámico

"use client";

import { useMemo, useState, useEffect } from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import CardMateriales, {
    type Content,
} from "../../components/CardMateriales/cardmateriales";

// Contenidos oficiales iniciales como fallback resiliente
const DEFAULT_CONTENTS: Content[] = [
    {
        id: "1",
        type: "novedad",
        date: "2026-09-11",
        title: "Novedades del Congreso ETS 2026",
        description:
            "En este espacio se publicarán las novedades relacionadas con el Congreso de Educación Técnica Superior.",
        contenidoDetalle:
            "El Congreso de Educación Técnica Superior 2026 reunirá a directivos, docentes, especialistas y estudiantes para compartir innovaciones pedagógicas, prácticas profesionalizantes y modelos de enseñanza aplicados en el ámbito técnico superior.",
        image: "/assets/icons/card1.svg",
    },
    {
        id: "2",
        type: "documento",
        date: "2026-09-10",
        title: "Documento general de participación",
        description:
            "Información orientativa para participar del 1er Congreso de Educación Técnica Superior.",
        contenidoDetalle:
            "Descargá el documento institucional orientativo con las bases y condiciones, lineamientos pedagógicos y pautas de participación para instituciones, equipos de cátedra y estudiantes del sistema técnico superior.",
        fileUrl: "/PDF/1 Aula Abierta - demostraciones aplicadas.pdf",
        image: "/assets/icons/card2.svg",
    },
    {
        id: "3",
        type: "video",
        date: "2026-09-09",
        title: "Conocé el Congreso ETS 2026",
        description:
            "Contenido audiovisual institucional relacionado con el Congreso.",
        contenidoDetalle:
            "Video de presentación y recorrido sobre los ejes temáticos, los dispositivos de muestra permanente y las actividades académicas proyectadas para la jornada.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        image: "/assets/icons/card3.svg",
    },
    {
        id: "4",
        type: "flyer",
        date: "2026-09-08",
        title: "Flyer oficial del Congreso",
        description:
            "Pieza gráfica institucional del Congreso de Educación Técnica Superior.",
        contenidoDetalle:
            "Pieza gráfica y afiche institucional para difusión en carteleras institucionales, portales educativos y comunidades académicas.",
        image: "/assets/icons/card4.svg",
    },
    {
        id: "5",
        type: "foto",
        date: "2026-09-07",
        title: "Fotografías del Congreso",
        description:
            "Registro fotográfico de las actividades del Congreso de Educación Técnica Superior.",
        contenidoDetalle:
            "Colección de imágenes del espacio de exposición, auditorios y stands tecnológicos preparados para el desarrollo del Congreso.",
        image: "/assets/icons/card5.svg",
        images: ["/assets/icons/card1.svg", "/assets/icons/card2.svg", "/assets/icons/card3.svg"],
    },
    {
        id: "6",
        type: "recurso",
        date: "2026-09-06",
        title: "Recursos para participantes",
        description:
            "Materiales y recursos vinculados con el programa y los dispositivos de participación.",
        contenidoDetalle:
            "Repositorio de recursos, plantillas descargables y enlaces útiles para los participantes acreditados.",
        image: "/assets/icons/card1.svg",
        enlacesExternos: [
            { id: "enlace-1", titulo: "Portal de la Dirección de Educación Técnica Superior", url: "https://buenosaires.gob.ar/educacion" },
            { id: "enlace-2", titulo: "Programa y Cronograma Oficial", url: "/#actividades" },
        ],
    },
];

type FilterType = "todos" | Content["type"];

function getEmbedVideoUrl(url?: string): string | null {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) {
        return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
    }
    return null;
}

const FilterButton = ({
    active,
    children,
    onClick,
}: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`text-left text-sm transition cursor-pointer ${active
                ? "font-bold text-azul-claro"
                : "text-azul-oscuro/60 hover:text-azul-claro"
                }`}
        >
            {children}
        </button>
    );
};

export default function Materiales() {
    const [materials, setMaterials] = useState<Content[]>(DEFAULT_CONTENTS);
    const [_loading, setLoading] = useState<boolean>(true);
    const [selectedType, setSelectedType] = useState<FilterType>("todos");
    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState<"recientes" | "antiguos">("recientes");
    const [selectedContent, setSelectedContent] = useState<Content | null>(null);

    const cargarMateriales = async () => {
        try {
            const res = await fetch("/api/materiales", { cache: "no-store" });
            const data = await res.json();
            if (data.success && Array.isArray(data.materiales) && data.materiales.length > 0) {
                const mapped: Content[] = data.materiales.map((item: any) => ({
                    id: String(item.id),
                    type: item.type,
                    title: item.title,
                    description: item.description,
                    date: item.date,
                    image: item.image,
                    fileUrl: item.fileUrl,
                    videoUrl: item.videoUrl,
                    images: Array.isArray(item.images) ? item.images : [],
                    contenidoDetalle: item.contenidoDetalle || item.description,
                    enlacesExternos: Array.isArray(item.enlacesExternos) ? item.enlacesExternos : [],
                }));
                setMaterials(mapped);
            }
        } catch (err) {
            console.error("Error al cargar materiales dinámicos, usando fallback:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarMateriales();

        const handleUpdate = () => {
            cargarMateriales();
        };
        window.addEventListener("materiales-updated", handleUpdate);
        return () => window.removeEventListener("materiales-updated", handleUpdate);
    }, []);

    // Filtra por tipo y búsqueda, y luego ordena los resultados por fecha
    const filteredContents = useMemo(() => {
        const filtered = materials.filter((content) => {
            const matchesType =
                selectedType === "todos" ||
                content.type === selectedType;

            const searchText = search.toLowerCase().trim();

            const matchesSearch =
                searchText === "" ||
                content.title.toLowerCase().includes(searchText) ||
                content.description?.toLowerCase().includes(searchText) ||
                content.contenidoDetalle?.toLowerCase().includes(searchText);

            return matchesType && matchesSearch;
        });

        return [...filtered].sort((a, b) => {
            if (!a.date || !b.date) {
                return 0;
            }

            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();

            return sortOrder === "recientes"
                ? dateB - dateA
                : dateA - dateB;
        });
    }, [materials, selectedType, search, sortOrder]);

    const embedUrl = selectedContent ? getEmbedVideoUrl(selectedContent.videoUrl) : null;

    return (
        <>
            <title>Materiales | DETS 2026</title>
            <Header />

            <main className="min-h-screen bg-blanco pt-24">

                {/* Encabezado de la sección */}
                <section className="bg-azul-claro/10">
                    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 md:px-10 md:py-12">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-azul-claro sm:text-xs">
                            Congreso ETS 2026
                        </p>

                        <h1 className="text-2xl font-bold tracking-tight text-azul-oscuro sm:text-3xl md:text-4xl">
                            Materiales y novedades
                        </h1>

                        <p suppressHydrationWarning className="mt-3 max-w-2xl text-sm leading-relaxed text-azul-oscuro/70 sm:text-base">
                            Accedé a los recursos, publicaciones, fotos, videos y documentos oficiales del Congreso de Educación Técnica Superior.
                        </p>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:px-10 md:py-14">
                    <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
                        {/* Filtros y búsqueda */}
                        <aside>
                            <div className="lg:sticky lg:top-8">
                                <div>
                                    <label htmlFor="buscar" className="mb-3 block text-base font-bold uppercase tracking-widest text-azul-oscuro">
                                        Buscar materiales
                                    </label>

                                    <div className="relative">
                                        <input
                                            id="buscar"
                                            type="text"
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(event.target.value)
                                            }
                                            placeholder="Buscar materiales..."
                                            className="w-full border border-azul-oscuro/20 bg-white pl-4 pr-10 py-3 text-sm text-azul-oscuro outline-none transition focus:border-azul-claro"
                                        />
                                        {search && (
                                            <button
                                                type="button"
                                                onClick={() => setSearch("")}
                                                title="Limpiar búsqueda"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-azul-oscuro/50 hover:text-azul-oscuro font-bold text-xs p-1 rounded-full hover:bg-azul-oscuro/5 transition cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Tipos disponibles */}
                                <div className="mt-6 lg:mt-10">
                                    <label htmlFor="tipo-contenido" className="mb-3 block text-base font-bold uppercase tracking-widest text-azul-oscuro">
                                        Tipo de contenido
                                    </label>

                                    <select
                                        id="tipo-contenido"
                                        value={selectedType}
                                        onChange={(event) => {
                                            setSelectedContent(null);
                                            setSelectedType(event.target.value as FilterType);
                                        }}
                                        className="w-full border border-azul-oscuro/20 bg-white px-3 py-3 text-sm text-azul-oscuro outline-none focus:border-azul-claro lg:hidden"
                                    >
                                        <option value="todos">Todos</option>
                                        <option value="novedad">Novedades</option>
                                        <option value="documento">Documentos</option>
                                        <option value="video">Videos</option>
                                        <option value="flyer">Flyers</option>
                                        <option value="foto">Fotos</option>
                                        <option value="recurso">Recursos</option>
                                    </select>

                                    <div className="hidden lg:flex lg:flex-col lg:gap-3">
                                        <FilterButton
                                            active={selectedType === "todos"}
                                            onClick={() => {
                                                setSelectedContent(null);
                                                setSelectedType("todos");
                                            }}
                                        >
                                            Todos ({materials.length})
                                        </FilterButton>

                                        <FilterButton
                                            active={selectedType === "novedad"}
                                            onClick={() => {
                                                setSelectedContent(null);
                                                setSelectedType("novedad");
                                            }}
                                        >
                                            Novedades
                                        </FilterButton>

                                        <FilterButton
                                            active={selectedType === "documento"}
                                            onClick={() => {
                                                setSelectedContent(null);
                                                setSelectedType("documento");
                                            }}
                                        >
                                            Documentos
                                        </FilterButton>

                                        <FilterButton
                                            active={selectedType === "video"}
                                            onClick={() => {
                                                setSelectedContent(null);
                                                setSelectedType("video");
                                            }}
                                        >
                                            Videos
                                        </FilterButton>

                                        <FilterButton
                                            active={selectedType === "flyer"}
                                            onClick={() => {
                                                setSelectedContent(null);
                                                setSelectedType("flyer");
                                            }}
                                        >
                                            Flyers
                                        </FilterButton>

                                        <FilterButton
                                            active={selectedType === "foto"}
                                            onClick={() => {
                                                setSelectedContent(null);
                                                setSelectedType("foto");
                                            }}
                                        >
                                            Fotos
                                        </FilterButton>

                                        <FilterButton
                                            active={selectedType === "recurso"}
                                            onClick={() => {
                                                setSelectedContent(null);
                                                setSelectedType("recurso");
                                            }}
                                        >
                                            Recursos
                                        </FilterButton>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <section className="min-w-0 w-full">
                            {selectedContent ? (

                                /* Detalle Anidado del contenido seleccionado (Botón "Ver") */
                                <article className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-xs animate-in fade-in">
                                    <div className="mb-8 flex items-center justify-between border-b border-azul-oscuro/15 pb-4">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedContent(null)}
                                            className="text-left text-sm font-semibold text-azul-oscuro/70 transition hover:text-azul-claro flex items-center gap-2 cursor-pointer"
                                        >
                                            <span>←</span> Volver a resultados
                                        </button>
                                        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-azul-claro/10 text-azul-claro rounded-full">
                                            {selectedContent.type}
                                        </span>
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-azul-claro">
                                            {selectedContent.date && `Publicado el ${selectedContent.date}`}
                                        </p>

                                        <h2 className="mt-2 text-3xl font-extrabold text-azul-oscuro md:text-4xl leading-tight">
                                            {selectedContent.title}
                                        </h2>

                                        {/* Portada / Imagen principal de la tarjeta */}
                                        {selectedContent.image && (
                                            <div className="mt-8 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center max-h-[460px]">
                                                <img
                                                    src={selectedContent.image}
                                                    alt={selectedContent.title}
                                                    className="w-full h-full object-contain max-h-[460px]"
                                                />
                                            </div>
                                        )}

                                        {/* Descripción / Resumen */}
                                        {selectedContent.description && (
                                            <div className="mt-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-sm font-medium text-azul-oscuro/90 leading-relaxed">
                                                {selectedContent.description}
                                            </div>
                                        )}

                                        {/* Cuerpo extendido / Contenido detallado del ítem */}
                                        {selectedContent.contenidoDetalle && (
                                            <div className="mt-8 text-base leading-relaxed text-azul-oscuro/85 whitespace-pre-line border-t border-gray-100 pt-6">
                                                {selectedContent.contenidoDetalle}
                                            </div>
                                        )}

                                        {/* Video embebido interactivo si existe */}
                                        {selectedContent.videoUrl && (
                                            <div className="mt-8 border-t border-gray-100 pt-6">
                                                <h3 className="text-sm font-bold uppercase tracking-wide text-azul-oscuro mb-3 flex items-center gap-2">
                                                    <span>🎬</span> Video Relacionado
                                                </h3>
                                                {embedUrl ? (
                                                    <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 shadow-xs">
                                                        <iframe
                                                            src={embedUrl}
                                                            title={selectedContent.title}
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                ) : (
                                                    <a
                                                        href={selectedContent.videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition shadow-xs"
                                                    >
                                                        <span>▶️</span> Ver video en plataforma externa
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {/* Galería de imágenes anidada */}
                                        {selectedContent.images && selectedContent.images.length > 0 && (
                                            <div className="mt-8 border-t border-gray-100 pt-6">
                                                <h3 className="text-sm font-bold uppercase tracking-wide text-azul-oscuro mb-3 flex items-center gap-2">
                                                    <span>📸</span> Galería de Imágenes ({selectedContent.images.length})
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                    {selectedContent.images.map((imgUrl, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={imgUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center hover:shadow-md transition"
                                                        >
                                                            <img
                                                                src={imgUrl}
                                                                alt={`Foto ${idx + 1}`}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                            />
                                                            <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                                                                🔍 Ver completa
                                                            </span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Archivo adjunto descargable */}
                                        {selectedContent.fileUrl && (
                                            <div className="mt-8 border-t border-gray-100 pt-6">
                                                <h3 className="text-sm font-bold uppercase tracking-wide text-azul-oscuro mb-3 flex items-center gap-2">
                                                    <span>📎</span> Documento Oficial Adjunto
                                                </h3>
                                                <a
                                                    href={selectedContent.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-azul-oscuro text-white text-sm font-bold transition hover:bg-azul-claro shadow-xs"
                                                >
                                                    <span>📥</span> Descargar Documento
                                                </a>
                                            </div>
                                        )}

                                        {/* Enlaces externos y recursos asociados */}
                                        {selectedContent.enlacesExternos && selectedContent.enlacesExternos.length > 0 && (
                                            <div className="mt-8 border-t border-gray-100 pt-6">
                                                <h3 className="text-sm font-bold uppercase tracking-wide text-azul-oscuro mb-3 flex items-center gap-2">
                                                    <span>🔗</span> Enlaces y Recursos de Interés
                                                </h3>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {selectedContent.enlacesExternos.map((enlace) => (
                                                        <a
                                                            key={enlace.id || enlace.url}
                                                            href={enlace.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-azul-claro/40 bg-white text-xs font-bold text-azul-claro hover:bg-azul-claro hover:text-white transition shadow-2xs"
                                                        >
                                                            <span>🌐</span>
                                                            <span>{enlace.titulo || enlace.url}</span>
                                                            <span className="text-[10px]">↗</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-12 pt-6 border-t border-gray-100 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedContent(null)}
                                                className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                                            >
                                                ← Volver al listado
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ) : (

                                /* Lista de Tarjetas de Materiales */
                                <>
                                    <div className="mb-8 flex items-center justify-between border-b border-azul-oscuro/15 pb-4">
                                        <h2 className="text-2xl font-bold text-azul-oscuro">
                                            Resultados ({filteredContents.length})
                                        </h2>

                                        <select
                                            value={sortOrder}
                                            onChange={(event) =>
                                                setSortOrder(
                                                    event.target.value as
                                                    | "recientes"
                                                    | "antiguos"
                                                )
                                            }
                                            className="border border-azul-oscuro/20 bg-white px-3 py-2 text-sm text-azul-oscuro outline-none focus:border-azul-claro cursor-pointer rounded-lg"
                                            aria-label="Ordenar resultados"
                                        >
                                            <option value="recientes">
                                                Más recientes
                                            </option>
                                            <option value="antiguos">
                                                Más antiguos
                                            </option>
                                        </select>
                                    </div>

                                    {filteredContents.length > 0 ? (
                                        <div className="flex flex-col gap-6">
                                            {filteredContents.map((content) => (
                                                <CardMateriales
                                                    key={content.id}
                                                    content={content}
                                                    onView={setSelectedContent}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex min-h-[320px] items-center justify-center text-center">
                                            <div>
                                                <h3 className="text-lg font-bold text-azul-oscuro">
                                                    {search
                                                        ? "No encontramos contenidos con esa búsqueda"
                                                        : "Todavía no hay contenidos publicados"}
                                                </h3>

                                                <p className="mt-2 max-w-md text-sm leading-relaxed text-azul-oscuro/60">
                                                    {search
                                                        ? "Probá con otra palabra o limpiando los filtros."
                                                        : "Próximamente encontrarás aquí las novedades y recursos del Congreso."}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
