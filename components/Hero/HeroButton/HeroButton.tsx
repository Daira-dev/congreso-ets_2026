"use client"

interface HeroButtonProps {
    text: string,
}


const HeroButton = ({ text }: HeroButtonProps) => {
    
    const onClickHandler = () => {
        console.log("Inscribirse: Boton clickeado")
    }

    return (
        <button 
            onClick={onClickHandler}
            className="cursor-pointer bg-white text-blue-950 font-bold py-2 px-16 rounded mt-8 hover:bg-amber-300 hover:text-white transition-colors duration-300"
        >
            {text}
        </button>
    )
}

export default HeroButton