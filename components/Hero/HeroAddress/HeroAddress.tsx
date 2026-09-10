interface HeroAddressProps {
    text: React.ReactNode;
}

const HeroAddress = ({ text }: HeroAddressProps) => {
    return (
        <>
            <h4 className="text-lg font-semibold pt-8">{text}</h4>
        </>
    )
}

export default HeroAddress