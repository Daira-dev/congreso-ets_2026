import Image, { StaticImageData } from "next/image";

interface CardProps {
    cardImg: StaticImageData;
    title: string;
    description: string;
    pdfUrl?: string;
}


const Card = ({ cardImg, title, description, pdfUrl }: CardProps) => {
    return (
        <div className="bg-[#FCFCFC] rounded-xl shadow-sm border border-[#1D3343]/20 p-6 flex flex-col h-full transition-all duration-300 hover:shadow-md hover:-translate-y-2 select-none overflow-hidden">
           
           <div className="flex items-center gap-4 mb-4 w-full min-h-[4rem]">
                <div className="w-12 h-12 flex-shrink-0 relative flex items-center justify-center">
                    <Image src={cardImg} alt={title} fill className="object-contain pointer-events-none"/>
                </div>
                
                <h4 className="font-bold text-lg text-[#1D3343] leading-tight flex-1 break-words mt-1 whitespace-pre-line">{title}</h4>
            </div>
            <div className="gap-1 mb-4">
                <p className="text-sm text-gray-600 leading-relaxed mb-2">{description}</p>
            </div>
            
            
            <div className="mt-auto pt-2 flex w-full justify-center">
                {pdfUrl && (
                    <button 
                        onClick={() => window.open(pdfUrl, "_blank")}
                        className="inline-flex items-center text-sm font-bold text-[#035C80] hover:text-[#FFCD02] transition-colors cursor-pointer bg-transparent border-none p-0">
                        Saber más
                    </button>
                )}
            </div>
        </div>
    )
    
}


export default Card