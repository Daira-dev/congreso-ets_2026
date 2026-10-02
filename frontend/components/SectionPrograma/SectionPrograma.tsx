"use client";
import { useState, useEffect, useMemo } from "react";
import CardPrograma from "./Card/Card";
import FiltrosPrograma from "./FiltrosPrograma/FiltrosPrograma";

interface ActividadPublica {
  id: number;
  title: string;
  descripcion: string;
  categoria: string;
  expositor: string;
  sala: string;
  ubicacion: string;
  horario_inicio: string;
  horario_fin: string;
  fecha_actividad?: string;
  hora_inicio?: string;
  hora_fin?: string;
  cupo_maximo: number;
  ocupacion_actual: number;
  activo: boolean;
}

export default function SectionPrograma() {
  const [filtroActivo, setFiltroActivo] = useState("Todos");
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState("Todas");
  const [actividades, setActividades] = useState<ActividadPublica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrograma() {
      try {
        const res = await fetch("/api/actividades");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.actividades) && data.actividades.length > 0) {
            setActividades(data.actividades);
          }
        }
      } catch (err) {
        console.error("Error al cargar programa:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrograma();
  }, []);

  // Extraer las fechas distintas para las jornadas del evento
  const jornadasDisponibles = useMemo(() => {
    const dates = new Set<string>();
    actividades.forEach((a) => {
      const f = a.fecha_actividad || (a.horario_inicio ? a.horario_inicio.slice(0, 10) : "");
      if (f) dates.add(f);
    });
    return Array.from(dates).sort();
  }, [actividades]);

  // Filtrar por jornada (fecha) y categoría
  const actividadesFiltradas = useMemo(() => {
    return actividades.filter((a) => {
      const f = a.fecha_actividad || (a.horario_inicio ? a.horario_inicio.slice(0, 10) : "");
      const matchJornada = jornadaSeleccionada === "Todas" || f === jornadaSeleccionada;
      const matchCategoria = filtroActivo === "Todos" || a.categoria.toLowerCase().includes(filtroActivo.toLowerCase()) || filtroActivo.toLowerCase().includes(a.categoria.toLowerCase());
      return matchJornada && matchCategoria;
    });
  }, [actividades, jornadaSeleccionada, filtroActivo]);

  // Formato para mostrar duración estimada
  function calcularDuracion(inicio: string, fin: string) {
    const dIni = new Date(inicio).getTime();
    const dFin = new Date(fin).getTime();
    if (isNaN(dIni) || isNaN(dFin) || dFin <= dIni) return "";
    const mins = Math.round((dFin - dIni) / (1000 * 60));
    if (mins >= 60) {
      const hs = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `${hs}h ${rem}m` : `${hs}h`;
    }
    return `${mins} min`;
  }

  function formatearRangoHorario(a: ActividadPublica) {
    if (a.hora_inicio && a.hora_fin) {
      return `${a.hora_inicio} – ${a.hora_fin}`;
    }
    const dIni = new Date(a.horario_inicio);
    const dFin = new Date(a.horario_fin);
    const h1 = !isNaN(dIni.getTime())
      ? dIni.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
      : "";
    const h2 = !isNaN(dFin.getTime())
      ? dFin.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
      : "";
    return `${h1} – ${h2}`;
  }

  return (
    <section id="programa" className="scroll-mt-32 max-w-4xl mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-2">
        <div>
          <h2 className="text-3xl font-bold text-azul-oscuro">Programa del Congreso</h2>
          <p className="text-sm text-gray-500 mt-1">
            Cronograma oficial de ponencias, talleres y masterclasses por jornada
          </p>
        </div>
      </div>

      {/* Selector de Jornada / Día Multidía */}
      {jornadasDisponibles.length > 0 && (
        <div className="mb-6 bg-slate-50 p-3 rounded-2xl border border-gray-200 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider mr-1 flex items-center gap-1">
            <span>📅</span> Jornada:
          </span>
          <button
            type="button"
            onClick={() => setJornadaSeleccionada("Todas")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-xs ${
              jornadaSeleccionada === "Todas"
                ? "bg-azul-oscuro text-white shadow-sm"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            Todas las Jornadas
          </button>
          {jornadasDisponibles.map((f, idx) => {
            const dateObj = new Date(f + "T00:00:00");
            const labelDia = isNaN(dateObj.getTime())
              ? f
              : dateObj.toLocaleDateString("es-AR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                });
            return (
              <button
                key={f}
                type="button"
                onClick={() => setJornadaSeleccionada(f)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 ${
                  jornadaSeleccionada === f
                    ? "bg-azul-oscuro text-white shadow-sm"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="opacity-80">Día {idx + 1}:</span>
                <span className="capitalize">{labelDia}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Barra de botones de filtro por categoría */}
      <FiltrosPrograma
        categoriaSeleccionada={filtroActivo}
        onSelectCategoria={setFiltroActivo}
      />

      {/* Listado dinámico de actividades */}
      <div>
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            Cargando cronograma oficial del congreso...
          </div>
        ) : actividadesFiltradas.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm border border-dashed rounded-xl">
            No se encontraron actividades registradas para esta jornada o categoría.
          </div>
        ) : (
          actividadesFiltradas.map((act) => {
            const fechaStr = act.fecha_actividad
              ? new Date(act.fecha_actividad + "T00:00:00").toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })
              : "";

            return (
              <div key={act.id} className="relative">
                {jornadaSeleccionada === "Todas" && fechaStr && (
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50/80 px-3 py-1 rounded-md inline-block mb-2">
                    📅 {fechaStr}
                  </div>
                )}
                <CardPrograma
                  horario={formatearRangoHorario(act)}
                  duracion={calcularDuracion(act.horario_inicio, act.horario_fin)}
                  categoria={act.categoria}
                  title={act.title}
                  expositor={act.expositor}
                  descripcion={act.descripcion}
                  estado={act.activo ? "Vigente" : "Inactiva"}
                  sala={act.sala ? `${act.sala}${act.ubicacion ? ` (${act.ubicacion})` : ""}` : "Aula a confirmar"}
                />
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}