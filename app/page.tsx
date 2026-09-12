// import Image from "next/image";
import Header from "../components/Header/Header";
import Hero from "@/components/Hero/Hero";
import SectionCongreso from "@/components/SectionCongreso/SectionCongreso";
import SectionExperiencia from "@/components/SectionExperiencia/SectionExperiencia";
import Footer from "@/components/Footer/Footer";

export default function Home() {
  return (
    <div>
      <Header />
      <Hero />
      <SectionCongreso />
      
      {/*Provisorio - Las props se reciben x aca */}
      <SectionExperiencia 
        videoUrl="https://www.youtube.com/embed/fFaAyN6sBus?si=7NMzlsDyW2jo-esW"
        videoTitle="Prueba"/> 
      <Footer />


    </div>
  );
}
