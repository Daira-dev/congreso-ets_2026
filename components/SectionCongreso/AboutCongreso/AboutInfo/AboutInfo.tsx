interface AboutInfoProps {
    title: string;
    description1: string;
    description2: string;
}


const AboutInfo = ({ title, description1, description2 }: AboutInfoProps) => {
    return (
        <div>
            <h2>{title}</h2>
            <p>{description1}</p>
            <p>{description2}</p>
        </div>
    )
}


export default AboutInfo