import Image, { StaticImageData } from "next/image";
import user from "@/assets/LOGOS/PARA WEB/user.jpg"; // Importá acá tu imagen por defecto

interface CardProgramaProps {
    cardImg?: StaticImageData;
    horario: string;
    duracion: string;
    categoria: string;
    title: string;
    expositor: string;
    descripcion?: string; // Opcional
}

const CardPrograma = ({ horario, duracion, categoria, title, expositor, descripcion, cardImg = user}: CardProgramaProps) => {
    return (
        <div className="border rounded-xl p-6 shadow-sm border-azul-oscuro mb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <span className="font-bold text-lg">{horario}</span>
                        <p className="text-xs text-gray-500">{duracion}</p>
                    </div>

                    <div className="h-14 border-l border-black-300 mx-2"></div>

                    {/* Imagen circular del expositor o categoría */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <Image
                            src={cardImg}
                            alt={title}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <span className="text-xs px-3 py-1 bg-gray-100 border border-black rounded-full">{categoria}</span>
                        <h3 className="font-semibold text-azul-claro text-lg mt-1">{title}</h3>
                        <p className="text-sm text-gray-600">{expositor}</p>
                    </div>
                </div>
                {/* Botones */}
                <div className="flex flex-col gap-2 min-w-[180px]">
                    <button className="bg-azul-oscuro text-blanco text-xs font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                        Agregar a mi agenda
                    </button>
                    <button className="border border-azul-claro text-azul-claro text-xs font-semibold py-2 px-4 rounded-lg hover:bg-azul-claro/5 transition-colors">
                        Ver perfil
                    </button>
                </div>
            </div>
            {descripcion && (
                <p className="mt-4 text-sm text-gray-600 border-t pt-4">{descripcion}</p>
            )}
        </div>
    );
};

export default CardPrograma;