import Image from "next/image"
import logo from "@/assets/LOGOS/PARA WEB/LOGO PARA WEB.png"


const Logo = () => {
    return (
        <div className="text-2xl font-bold">
            <Image alt="Logo de congreso DETS" src={logo} width={200} height={40} />
        </div>
    )
}

export default Logo