"use client";


interface NavButtonProps {
    text: string;
}

const NavButton = ({ text }: NavButtonProps) => {
    
    const onClickHandler = () => {
        console.log("Ingresar: Boton clickeado")
    }
    return (
        <button
            onClick={onClickHandler}
            className="bg-amber-400 text-gray-800 font-bold py-2 px-4 rounded hover:bg-black hover:text-white hover:text-gray-800 transition cursor-pointer"
        >
            {text}
        </button>
    )
}

export default NavButton