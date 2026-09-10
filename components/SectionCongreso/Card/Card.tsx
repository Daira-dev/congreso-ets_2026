import Image, { StaticImageData } from "next/image";

interface CardProps {
    cardImg: StaticImageData;
    title: string;
    description: string;
}


const Card = ({ cardImg, title, description }: CardProps) => {
    return (
        <div>
            <Image 
                src={cardImg} 
                alt="Card img description" 
                width={300} 
                height={200} 
            />
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    )
}

export default Card