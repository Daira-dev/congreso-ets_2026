import Image, { StaticImageData } from "next/image";

interface CardProps {
    cardImg: StaticImageData;
    title: string;
    description: string;
    onClick?: () => void;
}


const Card = ({ cardImg, title, description, onClick }: CardProps) => {
    return (
        <div 
            onClick={onClick}
            className="bg-white rounded-lg shadow-[0_4px_20px_rgb(0,0,0,0.08)] p-8 md:p-10 flex flex-col items-center sm:items-start h-full cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-center sm:text-left select-none"
        >
            <div className="w-full h-48 bg-gray-300 rounded-lg mb-6 relative overflow-hidden flex-shrink-0">
                <Image 
                    src={cardImg} 
                    alt={title} 
                    fill
                    className="object-cover pointer-events-none"
                />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
        </div>
    )
}

export default Card