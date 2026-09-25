interface HeroAddressProps {
    text: React.ReactNode;
}

const HeroAddress = ({ text }: HeroAddressProps) => (
    <p className="pt-5 text-center text-sm leading-relaxed tracking-wide text-white/80 md:pt-6 md:text-base">
        {text}
    </p>
);

export default HeroAddress;