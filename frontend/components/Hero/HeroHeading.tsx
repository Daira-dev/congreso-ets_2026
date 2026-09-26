import Image, { StaticImageData } from "next/image";

interface HeroHeadingProps {
    text: string;
    src: StaticImageData;
}

const HeroHeading = ({ src, text }: HeroHeadingProps) => {
    return (
        <div className="flex w-full flex-col items-center justify-center gap-3 pt-3 md:flex-row md:gap-3 md:pt-5">
            <h1 className="max-w-[320px] text-center text-3xl font-bold uppercase leading-tight md:max-w-[360px] md:text-5xl">
                {text}
            </h1>

            <Image
                src={src}
                alt="Logo del Congreso de Educación Técnica Superior"
                width={300}
                height={200}
                priority
                className="w-32 sm:w-36 md:w-60"
            />
        </div>
    );
};

export default HeroHeading;