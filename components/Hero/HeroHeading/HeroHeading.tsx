import Image, {StaticImageData} from "next/image";

interface HeroHeadingProps {
    text: string;
    src: StaticImageData;
}


const HeroHeading = ({ src, text }: HeroHeadingProps) => {
    return (
        <div className="flex items-center justify-center w-50 pt-10">
            <h1 className="text-5xl font-bold uppercase">{text}</h1>
            <Image src={src} alt="Hero Image" width={300} height={200} />
        </div>
    )
}


export default HeroHeading