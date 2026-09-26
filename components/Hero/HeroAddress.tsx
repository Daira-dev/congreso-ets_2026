interface HeroAddressProps {
    text: React.ReactNode;
}

const HeroAddress = ({ text }: HeroAddressProps) => (
    <p className="max-w-3xl px-2 pt-5 text-center text-sm leading-relaxed tracking-wide text-white/75 md:pt-6 md:text-base">
        {text}
    </p>
);

export default HeroAddress;