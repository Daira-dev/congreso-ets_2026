import Image from "next/image";
import Header from "../components/Header/Header";
import Hero from "@/components/Hero/Hero";
import SectionCongreso from "@/components/SectionCongreso/SectionCongreso";
import SectionPrograma from "@/components/SectionPrograma/SectionPrograma";

export default function Home() {
  return (
    <div>
      <Header />
      <Hero />
      <SectionCongreso />
      <SectionPrograma />

    </div>
  );
}
