import AboutImage from "./AboutImage/AboutImage"
import AboutInfo from "./AboutInfo/AboutInfo"
import congresoImg from "@/assets/LOGOS/AGENCIA DE HABILIDADES PARA EL FUTURO/azul.png"

const AboutCongreso = () => {
    return (
        <div>
            <AboutInfo 
                title="Sobre el Congreso" 
                description1="El 1er Congreso de Educacion Tecnica Superior ETS 2026 es un espacio institucional de encuentro, intercambio y participacion en torno a la Educacion Tecnica Superior."
                description2="Lorem impsum dolor sit amet, consectetur adipiscing elit. Sed do Eiusmod tempor incididunt ut labore et dolore magna aliqua."    
            />
            <AboutImage src={congresoImg} />
        </div>
    )
}


export default AboutCongreso