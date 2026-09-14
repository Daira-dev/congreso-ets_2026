import AboutCongreso from "./AboutCongreso/AboutCongreso";
import Card from "./Card/CardsInfo";
import cardImg from "@/assets/LOGOS/PARA WEB/flecha_7.png";

const SectionCongreso = () => {
    return (
        <section className="flex flex-col items-center w-full pb-10 overflow-hidden">
            <AboutCongreso />
            <Card />
        </section>
    );
};

export default SectionCongreso;