import AboutCongreso from "./AboutCongreso/AboutCongreso"
import Card from "./Card/Card"
import cardImg from "@/assets/LOGOS/PARA WEB/flecha_7.png"

const SectionCongreso = () => {
    return (
        <section>
            <AboutCongreso />

            {/* CARDS */}
            <Card cardImg={cardImg} title="Lorem" description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus nec justo eget ipsum ultrices placerat quis eu urna."/>
        </section>
    )
}


export default SectionCongreso