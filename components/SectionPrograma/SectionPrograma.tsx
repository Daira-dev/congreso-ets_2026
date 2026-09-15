"use client";
import { NONAME } from "dns";
import { useState } from "react";
import CardPrograma from "./Card/Card";
import FiltrosPrograma from "./FiltrosPrograma/FiltrosPrograma";

export default function SectionPrograma() {
    const [filtroActivo, setFiltroActivo] = useState("Todos");

    // Lista de ejemplo de tus charlas
    const charlas = [
        {
            horario: "14:00 – 14:30",
            duracion: "30 min",
            categoria: "Institucional",
            title: "Acreditación",
            expositor: "",
            descripcion: "Recepción de asistentes, entrega de acreditaciones y acreditación oficial para dar inicio al congreso.",
            estado:"",
            sala:""
        },
        {
            horario: "14:30 – 15:00",
            duracion: "30 min",
            categoria: "Institucional",
            title: "Apertura",
            expositor: "",
            descripcion: "Palabras de bienvenida a cargo de autoridades institucionales y presentación general de los ejes del evento.",
            estado:"",
            sala:""
        },
        {
            horario: "15:00 – 15:45",
            duracion: "45 min",
            categoria: "Masterclass",
            title: "Masterclass 1",
            expositor: "Dos Santos",
            descripcion: "Conferencia magistral inaugural dictada por el especialista invitado, abordando tendencias clave y perspectivas del área.",
            estado:"",
            sala:""
        },
        {
            horario: "15:50 – 17:20",
            duracion: "90 min",
            categoria: "Talleres / Actividades simultáneas",
            title: "Bloque de actividades simultáneas",
            expositor: "",
            descripcion: "Talentos ETS / Presentaciones académico-aplicadas / Proyectos y producciones estudiantiles / Aula Abierta",
            estado:"",
            sala:""
        },
        {
            horario: "17:25 – 18:10",
            duracion: "45 min",
            categoria: "Masterclass",
            title: "Masterclass 2",
            expositor: "A confirmar",
            descripcion: "A confirmar",
            estado:"",
            sala:""
        },
        {
            horario: "18:15–19:00",
            duracion: "45 min",
            categoria: "Talleres / Actividades simultáneas",
            title: "Bloque de actividades simultáneas",
            expositor: "",
            descripcion: "Talentos ETS / Presentaciones académico-aplicadas / Proyectos y producciones estudiantiles / Aula Abierta",
            estado:"",
            sala:""
        },
        {
            horario: "19:10 – 20:00",
            duracion: "50 min",
            categoria: "Masterclass",
            title: "Masterclass 3",
            expositor: "A confirmar",
            descripcion: "A confirmar",
            estado:"",
            sala:""
        },
        {
            horario: "20:00 – 20:30",
            duracion: "30 min",
            categoria: "Institucional",
            title: "Cierre",
            expositor: "",
            descripcion: "Conclusiones generales del congreso, agradecimientos y palabras de cierre institucional.",
            estado:"",
            sala:""
        }
    ];

    // Lógica para filtrar: si es "Todos" muestra todo, sino filtra por categoría
    const charlasFiltradas = filtroActivo === "Todos"
        ? charlas
        : charlas.filter(charla => charla.categoria === filtroActivo);

    return (
        <section className="max-w-4xl mx-auto py-10 px-4">
            <h2 className="text-3xl font-bold text-azul-oscuro mb-6">Programa del Congreso</h2>

            {/* Barra de botones de filtro */}
            <FiltrosPrograma
                categoriaSeleccionada={filtroActivo}
                onSelectCategoria={setFiltroActivo}
            />

            {/* Listado dinámico de tarjetas */}
            <div>
                {charlasFiltradas.map((charla, index) => (
                    <CardPrograma
                        key={index}
                        horario={charla.horario}
                        duracion={charla.duracion}
                        categoria={charla.categoria}
                        title={charla.title}
                        expositor={charla.expositor}
                        descripcion={charla.descripcion}
                        estado={charla.estado}
                        sala = {charla.sala}
                    />
                ))}
            </div>
        </section>
    );
}