interface CardProgramaProps {
    horario: string;
    duracion: string;
    categoria: string;
    title: string;
    expositor: string;
    descripcion?: string;
    estado: string;
    sala: string;
}

const CardPrograma = ({
    horario,
    duracion,
    categoria,
    title,
    expositor,
    descripcion,
    estado,
    sala
}: CardProgramaProps) => {

    /* Separa inicio y fin del horario para desktop */
    const partesHorario = horario.split(/\s*[–-]\s*/);

    const horaInicio = partesHorario[0] || horario;
    const horaFin = partesHorario[1] || "";

    return (
        <article className="mb-4 rounded-xl border border-azul-oscuro bg-white shadow-sm">

            <div className="p-4 md:p-5">

                {/* DESKTOP */}
                <div className="hidden md:grid md:grid-cols-[max-content_1px_minmax(0,1fr)_220px] md:items-center md:gap-x-6">
                    {/* Horario */}
                    <div className="w-max text-left leading-none">
                        <p className="text-lg font-bold text-azul-oscuro">
                            {horaInicio}
                        </p>

                        {horaFin && (
                            <p className="text-lg font-bold text-azul-oscuro">
                                {horaFin}
                            </p>
                        )}

                        <p className="mt-0.5 text-xs leading-none text-gray-500">
                            {duracion}
                        </p>
                    </div>

                    {/* Separador */}
                    <div className="h-full min-h-[65px] border-l border-gray-300"></div>

                    {/* Información */}
                    <div className="min-w-0">
                        <span className="inline-block max-w-full break-words rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-xs leading-tight">
                            {categoria}
                        </span>

                        <h3 className="mt-3 break-words text-lg font-semibold leading-snug text-azul-claro">
                            {title}
                        </h3>

                        <p className="mt-1 break-words text-sm text-gray-600">
                            {expositor}
                        </p>
                    </div>

                    {/* Estado + Sala */}
                    <div className="min-w-0 text-sm">
                        <p>
                            <span className="text-xs text-gray-500">
                                Estado:
                            </span>{" "}
                            <span className="font-semibold">
                                {estado}
                            </span>
                        </p>

                        <p className="mt-2 break-words">
                            <span className="text-xs text-gray-500">
                                Sala:
                            </span>{" "}
                            <span className="font-semibold">
                                {sala}
                            </span>
                        </p>
                    </div>
                </div>

                {/* MOBILE */}
                <div className="md:hidden">

                    {/* Horario + estado */}
                    <div className="flex items-start justify-between gap-2">

                        <div className="min-w-0 leading-tight">
                            <p className="text-sm font-bold text-azul-oscuro sm:text-base">
                                {horario}
                            </p>

                            <p className="mt-0 text-xs leading-tight text-gray-500">
                                {duracion}
                            </p>
                        </div>

                        <p className="shrink-0 text-xs font-semibold leading-tight">
                            {estado}
                        </p>
                    </div>

                    {/* Información */}
                    <div className="mt-1 min-w-0">

                        <span className="inline-block max-w-full break-words rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-xs leading-tight">
                            {categoria}
                        </span>

                        <h3 className="mt-2 break-words text-base font-semibold leading-snug text-azul-claro">
                            {title}
                        </h3>

                        <p className="mt-1 break-words text-sm text-gray-600">
                            {expositor}
                        </p>

                        <p className="mt-2 break-words text-xs text-gray-600">
                            <span className="font-semibold text-gray-700">
                                Sala:
                            </span>{" "}
                            {sala}
                        </p>
                    </div>
                </div>
            </div>

            {/* Descripción */}
            {descripcion && (
                <div className="border-t border-gray-200 px-4 py-3 md:px-5">
                    <p className="break-words text-xs leading-relaxed text-gray-600">
                        {descripcion}
                    </p>
                </div>
            )}

        </article>
    );
};

export default CardPrograma;