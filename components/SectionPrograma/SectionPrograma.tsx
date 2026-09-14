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
            horario: "09:00",
            duracion: "60 min",
            categoria: "Plenaria",
            title: "Apertura Institucional",
            expositor: "Dra. Lucía Fernández",
            descripcion: "Conferencia magistral sobre el rol de la educación pública y los desafíos del desarrollo estratégico en la región."
        },
        {
            horario: "10:30",
            duracion: "90 min",
            categoria: "Talleres",
            title: "IA en el Aula",
            expositor: "Ing. Marcos Delgado",
            descripcion: "Instancia abierta para el intercambio de experiencias institucionales y rondas de vinculación entre referentes del sector."
        },
        {
            horario: "12:00",
            duracion: "60 min",
            categoria: "Networking",
            title: "Espacio de Encuentro y Colaboración Federal",
            expositor: "Equipo de Innovación",
            descripcion: "Instancia abierta para el intercambio de experiencias institucionales y rondas de vinculación entre referentes del sector."
        },
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
                    />
                ))}
            </div>
        </section>
    );
}