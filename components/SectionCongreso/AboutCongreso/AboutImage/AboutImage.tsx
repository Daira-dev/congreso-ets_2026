import Image, { StaticImageData } from "next/image";

interface AboutImageProps {
    src: StaticImageData;
}

const AboutImage = ({ src }: AboutImageProps) => {
    return (
        <div>
            <Image 
                src={src} 
                alt="About Image" 
                width={300} 
                height={150}  
            />
        </div>
    )
}

export default AboutImage