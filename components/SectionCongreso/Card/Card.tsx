import Image, { StaticImageData } from "next/image";

interface CardProps {
    cardImg: StaticImageData;
    title: string;
    description: string;
    pdfUrl?: string;
}


const Card = ({ cardImg, title, description, pdfUrl }: CardProps) => {
    return (
        <div className="bg-[#FCFCFC] rounded-xl shadow-sm border border-[#1D3343]/20 p-6 flex flex-col h-full transition-all duration-300 hover:shadow-md hover:-translate-y-2 select-none">
           
           <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full flex-shrink-0 relative overflow-hidden bg-white border border-gray-100 shadow-inner flex items-center justify-center p-3">
                    <Image src={cardImg} alt={title} fill className="object-contain p-1 pointer-events-none"/>
                </div>
                
                <h3 className="font-bold text-lg text-[#1D3343] leading-tight">{title}</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            
            <div className="mt-auto pt-2">
                {pdfUrl && (
                    <a 
                    href={pdfUrl || "#"}
                    target={pdfUrl ? "_blank" : "_self"} 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-bold text-[#035C80] hover:text-[#FFCD02] transition-colors cursor-pointer">
                        Saber más &rarr;
                    </a>
                )}
            </div>
        </div>
    )
    
}


export default Card