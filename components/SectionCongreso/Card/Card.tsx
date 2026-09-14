import Image, { StaticImageData } from "next/image";

interface CardProps {
    cardImg: StaticImageData;
    title: string;
    description: string;
}


const Card = ({ cardImg, title, description }: CardProps) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#1D3343] p-6 md:p-8 flex flex-col h-full transition-all duration-300 hover:shadow-md hover:-translate-y-2">
            <Image 
                src={cardImg} 
                alt="Card img description" 
                width={300} 
                height={200} 
                
            />
            <h3 className="font-bold text-xl text-azul-oscuro mb-2">{title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
    )
}

export default Card