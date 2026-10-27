import Image from "next/image";

// Imports de SVG del hero
import triangulos from "@/assets/IFTS_27/hero/Miscelanea triangulos.svg";
import lineasHeader from "@/assets/IFTS_27/hero/Miscelanea lineas header.svg";
import barraAzul from "@/assets/IFTS_27/hero/Miscelanea barra azul.svg";
import barraBlanca from "@/assets/IFTS_27/hero/Miscelanea barra blanca.svg";
import barraOscura from "@/assets/IFTS_27/hero/Miscelanea barra oscura.svg";


// className es opcional y permite que quien use el componente 
// defina el tamaño y la posición
type MiscelaneaProps = {
    className?: string;
};

// Decoración de triángulos.
// alt="" y aria-hidden="true" indican que es puramente decorativa:
export const Triangulos = ({ className = "" }: MiscelaneaProps) => {
    return (
        <Image
            src={triangulos}
            alt=""
            aria-hidden="true"
            className={className}
        />
    )
}

// Decoración de líneas.
export const LineasHeader = ({ className = "" }: MiscelaneaProps) => {
    return (
        <Image 
            src={lineasHeader}
            alt=""
            aria-hidden="true"
            className={className}
        />
    )
}

// Colores posibles para la barra. Typescript avisa con un error
// si se pasa un color que no existe
type ColorBarra = "azul" | "blanca" | "oscura";


// Asocia cada color con su imagen SVG importada al principio
const barras = {
    azul: barraAzul,
    blanca: barraBlanca,
    oscura: barraOscura,
}

//Props de la barra. color es obligatorio
type BarraProps = MiscelaneaProps & {
    color: ColorBarra;
}

//Barra decorativa. Recibe el color como texto ("azul", "blanca" u "oscura")
export const Barra = ({ color = "azul", className = "" }: BarraProps) => {
    return (
        <Image 
            src={barras[color]}
            alt=""
            aria-hidden="true"
            className={className}
        />
    )
}