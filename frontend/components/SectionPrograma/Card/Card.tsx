interface CardProgramaProps {
    
    horario: string;
    duracion: string;
    categoria: string;
    title: string;
    expositor: string;
    descripcion?: string; // Opcional
    estado: string;
    sala: string
}

const CardPrograma = ({ horario, duracion, categoria, title, expositor, descripcion, estado, sala}: CardProgramaProps) => {
    return (
        <div className="border rounded-xl p-6 shadow-sm border-azul-oscuro mb-4">

            {/* VISTA DESKTOP */}
            <div className="hidden md:flex md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <span className="font-bold text-lg">{horario}</span>
                        <p className="text-xs text-gray-500">{duracion}</p>
                    </div>

                    <div className="h-14 border-l border-black-300 mx-2"></div>

                    <div>
                        <span className="text-xs px-3 py-1 bg-gray-100 border border-black rounded-full">
                            {categoria}
                        </span>

                        <h3 className="font-semibold text-azul-claro text-lg mt-1">
                            {title}
                        </h3>

                        <p className="text-sm text-gray-600">
                            {expositor}
                        </p>
                    </div>
                </div>

                {/* Sala y Estado */}
                <div className="flex flex-col gap-2 min-w-[180px]">
                    <div className="text-xs font-semibold py-2 px-4 rounded-lg">
                        <p className="text-xs">Estado: {estado}</p>
                    </div>

                    <div className="text-xs font-semibold py-2 px-4 rounded-lg">
                        <p className="text-xs">Sala: {sala}</p>
                    </div>
                </div>
            </div>

            {/* VISTA DESDE EL CELU */}
            <div className="md:hidden">

                {/* Horario + Estado/Sala */}
                <div className="grid w-full grid-cols-[120px_1px_1fr] items-center gap-x-4">

                    {/* Horario */}
                    <div className="text-left">
                        <span className="whitespace-nowrap font-bold text-base">
                            {horario}
                        </span>

                        <p className="text-xs text-gray-500">
                            {duracion}
                        </p>
                    </div>

                    {/* Separador */}
                    <div className="h-8 border-l border-black-300"></div>

                    {/* Estado + Sala */}
                    <div className="text-left">
                        <p className="text-xs font-semibold leading-5">
                            Estado: {estado}
                        </p>

                        <p className="text-xs font-semibold leading-5">
                            Sala: {sala}
                        </p>
                    </div>

                </div>

                {/* Categoría + título + expositor */}
                <div className="mt-7">
                    <span className="inline-block max-w-full break-words text-xs px-3 py-1 bg-gray-100 border border-black rounded-full leading-tight">
                        {categoria}
                    </span>

                    <h3 className="font-semibold text-azul-claro text-lg mt-2 break-words">
                        {title}
                    </h3>

                    <p className="text-sm text-gray-600 break-words">
                        {expositor}
                    </p>
                </div>

            </div>

            {descripcion && (
                <p className="mt-4 text-sm text-gray-600 border-t pt-4">
                    {descripcion}
                </p>
            )}

        </div>
    );
};

export default CardPrograma;