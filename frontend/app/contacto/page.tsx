'use client';

import React, { useState, useEffect, useMemo } from "react";
import Header from "../../components/Header/Header";
import Footer from "@/components/Footer/Footer";

interface FAQItem {
    id: string | number;
    question: string;
    answer: string;
    categoria?: string;
}

const DEFAULT_FAQ_DATA: FAQItem[] = [
    {
        id: 'faq-1',
        question: '¿Qué es el Congreso ETS 2026?',
        answer:
            'Es una instancia institucional, académico-aplicada, demostrativa y formativa destinada a mostrar y poner en diálogo experiencias de enseñanza, prácticas profesionalizantes, proyectos, producciones estudiantiles y modelos de gestión y enseñanza de la Educación Técnica Superior.',
        categoria: 'General',
    },
    {
        id: 'faq-2',
        question: '¿Cuándo se realiza?',
        answer:
            'El 6 de noviembre de 2026.',
        categoria: 'General',
    },
    {
        id: 'faq-3',
        question: '¿Dónde se realiza?',
        answer:
            'La sede prevista es el Auditorio Polo Saavedra, Crisólogo Larralde 5085, Ciudad de Buenos Aires.',
        categoria: 'Sede y Acceso',
    },
    {
        id: 'faq-4',
        question: '¿La participación es gratuita?',
        answer:
            'Sí. El Congreso es una iniciativa pública, abierta y gratuita.',
        categoria: 'General',
    },
    {
        id: 'faq-5',
        question: '¿Cómo me inscribo como asistente?',
        answer:
            'La inscripción se realizará desde esta web. El formulario estará disponible próximamente.',
        categoria: 'Inscripción',
    },
    {
        id: 'faq-6',
        question: '¿Tengo que inscribirme en cada actividad?',
        answer:
            'No. La inscripción es general al Congreso. El formulario podrá relevar intereses, pero esa selección no constituye una reserva de lugar en actividades específicas.',
        categoria: 'Inscripción',
    },
    {
        id: 'faq-7',
        question: '¿La inscripción tiene cupo?',
        answer:
            'Sí. La cantidad de inscripciones confirmadas está sujeta a la capacidad de la sede. Una vez alcanzado el cupo, el sistema permitirá registrarse en lista de espera.',
        categoria: 'Inscripción',
    },
    {
        id: 'faq-8',
        question: '¿Para qué sirve el QR?',
        answer:
            'Las personas con inscripción confirmada recibirán un QR personal que se utilizará para acreditar el ingreso y registrar la asistencia a actividades durante la jornada.',
        categoria: 'Acreditación',
    },
    {
        id: 'faq-9',
        question: '¿Debo presentar el DNI al ingresar?',
        answer:
            'En principio, la acreditación se realizará mediante el QR generado por el sistema y no está previsto solicitar el documento al momento del ingreso.',
        categoria: 'Acreditación',
    },
    {
        id: 'faq-10',
        question: '¿Habrá constancia o microcredencial de participación?',
        answer:
            'Se prevé la emisión posterior de una constancia o microcredencial a partir de la participación efectiva. El criterio operativo definido requiere acreditación general al Congreso y registro de asistencia a al menos una actividad.',
        categoria: 'Certificados',
    },
    {
        id: 'faq-11',
        question: '¿Cómo se presentan propuestas institucionales?',
        answer:
            'Las instituciones de Formación Técnica Superior dependientes de la DETS cuentan con un circuito específico de carga de propuestas. Ese circuito es diferente de la inscripción de asistentes.',
        categoria: 'Propuestas',
    },
];

export default function Contacto() {
    const [faqList, setFaqList] = useState<FAQItem[]>(DEFAULT_FAQ_DATA);
    const [openId, setOpenId] = useState<string | number | null>(null);
    const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
    const [loading, setLoading] = useState<boolean>(true);

    const fetchFaqs = async () => {
        try {
            const res = await fetch('/api/frontend/faq', {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
            });
            const data = await res.json();
            if (data.ok && Array.isArray(data.faqs) && data.faqs.length > 0) {
                const mapped: FAQItem[] = data.faqs.map((f: any) => ({
                    id: f.id,
                    question: f.pregunta,
                    answer: f.respuesta,
                    categoria: f.categoria || 'General',
                }));
                setFaqList(mapped);
            }
        } catch (err) {
            console.error('Error fetching dynamic FAQs, using fallback:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();

        // Escuchar actualizaciones en caliente
        const handleUpdate = () => {
            fetchFaqs();
        };
        window.addEventListener('faq-updated', handleUpdate);
        return () => window.removeEventListener('faq-updated', handleUpdate);
    }, []);

    const toggleFAQ = (id: string | number) => {
        setOpenId(openId === id ? null : id);
    };

    // Categorías disponibles
    const categorias = useMemo(() => {
        const set = new Set<string>();
        faqList.forEach((f) => {
            if (f.categoria) set.add(f.categoria);
        });
        return Array.from(set);
    }, [faqList]);

    // Filtrar por categoría seleccionada
    const visibleFaqs = useMemo(() => {
        if (selectedCategoria === 'TODAS') return faqList;
        return faqList.filter(
            (f) => f.categoria?.toLowerCase() === selectedCategoria.toLowerCase()
        );
    }, [faqList, selectedCategoria]);

    return (
        <div className="min-h-screen bg-white pt-24" id="faq">
            <title>Contacto | DETS 2026</title>
            <Header />

            <main className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
                <div className="text-center mb-8">
                    <h2 className="text-sm uppercase tracking-widest text-[var(--color-azul-claro)] font-bold mb-1">
                        Preguntas Frecuentes
                    </h2>
                    <h1 className="text-2xl text-[var(--color-azul-oscuro)] md:text-3xl font-extrabold">
                        Todo lo que necesitás saber
                    </h1>
                    <p className="text-xs text-gray-500 mt-2 max-w-lg mx-auto">
                        Consultá las respuestas a las consultas más habituales sobre la realización, modalidades, acreditación y participación en el Congreso DETS 2026.
                    </p>
                </div>

                {/* Filtro por Categoría (Chips) si hay más de una categoría */}
                {categorias.length > 1 && (
                    <div className="w-full flex flex-wrap justify-center items-center gap-2 mb-8">
                        <button
                            type="button"
                            onClick={() => setSelectedCategoria('TODAS')}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                                selectedCategoria === 'TODAS'
                                    ? 'bg-[var(--color-azul-oscuro)] text-white shadow-xs'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                        >
                            Todas ({faqList.length})
                        </button>
                        {categorias.map((cat) => {
                            const count = faqList.filter(
                                (f) => f.categoria?.toLowerCase() === cat.toLowerCase()
                            ).length;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategoria(cat)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                                        selectedCategoria === cat
                                            ? 'bg-[var(--color-azul-oscuro)] text-white shadow-xs'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {cat} ({count})
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Desplegables de Preguntas */}
                <div className="w-full space-y-4">
                    {visibleFaqs.map((faq) => {
                        const isOpen = openId === faq.id;
                        return (
                            <div
                                key={faq.id}
                                className={`border rounded-xl transition-all duration-200 overflow-hidden bg-white ${
                                    isOpen
                                        ? 'border-gray-200 shadow-md ring-1 ring-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleFAQ(faq.id)}
                                    className="w-full p-5 text-left flex justify-between items-center focus:outline-none cursor-pointer"
                                >
                                    <div className="flex flex-col gap-1 pr-4">
                                        {faq.categoria && (
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                                                {faq.categoria}
                                            </span>
                                        )}
                                        <span className="font-bold text-[var(--color-azul-claro)] text-sm md:text-base leading-snug">
                                            {faq.question}
                                        </span>
                                    </div>

                                    {/* Icono + / X */}
                                    <span className="flex-shrink-0">
                                        {isOpen ? (
                                            <div className="w-6 h-6 rounded-full bg-[var(--color-amarillo)] text-white flex items-center justify-center text-xs font-bold transition">
                                                ✕
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-gray-100 text-[var(--color-azul-oscuro)] flex items-center justify-center text-sm font-bold transition">
                                                +
                                            </div>
                                        )}
                                    </span>
                                </button>

                                {/* Contenido desplegado */}
                                {isOpen && (
                                    <div className="px-5 pb-5 text-xs md:text-sm text-[var(--color-azul-oscuro)] leading-relaxed border-t border-gray-100 pt-3 animate-in fade-in">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="w-full mt-10 bg-gray-50/60 border border-gray-100 rounded-xl p-8 text-center">
                    <p className="font-medium text-[var(--color-azul-oscuro)] md:text-lg mb-1">
                        ¿Tenés alguna duda que no está respondida aquí?
                    </p>
                    <a
                        href="mailto:congreso.dets@bue.edu.ar"
                        className="font-bold underline text-[var(--color-azul-claro)] underline-offset-4 hover:text-gray-700 text-sm md:text-base"
                    >
                        Contactate con nosotros
                    </a>
                </div>
            </main>
            <Footer />
        </div>
    );
}
