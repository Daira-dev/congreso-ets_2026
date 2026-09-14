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
      <SectionExperiencia />
      <Footer />


    </div>
  );
}
