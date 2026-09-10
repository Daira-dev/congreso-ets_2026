import HeroAddress from "./HeroAddress/HeroAddress"
import HeroHeading from "./HeroHeading/HeroHeading"
import HeroButton from "./HeroButton/HeroButton"

import heroImage from "@/assets/LOGOS/BUENOS AIRES CIUDAD/Logo_escudo_vertical_blanco.png"

const Hero = () => {
    return (
        <section className="bg-azul-oscuro h-120">
            <div className="flex flex-col items-center h-full text-white">
                <h4 className="text-2xl font-bold uppercase pt-8">1° congreso</h4>
                <HeroHeading 
                    text="educacion tecnica superior"  
                    src={heroImage}
                />
                <HeroAddress text="6 de Noviembre . Auditorio Polo Saavedra 5085 . Buenos Aires" />
                <HeroButton text="Inscribirse" />
            </div>
        </section>
    )
}

export default Hero