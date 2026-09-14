import Header from "../components/Header/Header";
import Hero from "@/components/Hero/Hero";
import SectionCongreso from "@/components/SectionCongreso/SectionCongreso";
import SectionExperiencia from "@/components/SectionExperiencia/SectionExperiencia";
import SectionPrograma from "@/components/SectionPrograma/SectionPrograma";
import Footer from "@/components/Footer/Footer";

export default function Home() {
  return (
    <div className="pt-24">
      <title>Inicio | DETS 2026</title>
      <Header />
      <Hero />
      <SectionCongreso />
      <SectionPrograma />
      <SectionExperiencia />
      <Footer />
    </div>
  );
}