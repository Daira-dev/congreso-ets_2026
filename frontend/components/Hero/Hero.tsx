'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import imgEdificio from "@/assets/IFTS_27/hero/Imagen del header.jpg";
import logoDefault from "@/assets/IFTS_27/hero/Logo en blanco.svg";
import { Barra, LineasHeader, Triangulos } from "../Miscelaneas";
import HeroButton from "./HeroButton";

interface HeroData {
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundOverlayOpacity: number;
  logoUrl: string | null;
  subtitle: string;
  title: string;
  address: string;
  ctaButtonText: string;
  ctaButtonUrl: string;
  mostrarLogo: boolean;
  mostrarMiscelaneas: boolean;
  mostrarBotonCta: boolean;
  fontSizeTitle?: number;
  fontSizeSubtitle?: number;
  colorTitle?: string;
  colorSubtitle?: string;
  colorAddress?: string;
  elements?: any[];
}

const DEFAULT_HERO: HeroData = {
  backgroundColor: '#1D3343',
  backgroundImage: null,
  backgroundOverlayOpacity: 0.6,
  logoUrl: null,
  subtitle: '1° Congreso',
  title: 'Educación Técnica Superior',
  address: 'Universidad de la Ciudad de Buenos Aires · Tte. Gral. Juan Domingo Perón 802, CABA.',
  ctaButtonText: 'INSCRIBITE',
  ctaButtonUrl: '/login',
  mostrarLogo: true,
  mostrarMiscelaneas: true,
  mostrarBotonCta: true,
  fontSizeTitle: 48,
  fontSizeSubtitle: 24,
  colorTitle: '#ffffff',
  colorSubtitle: '#ffffff',
  colorAddress: '#ffffff',
  elements: [],
};

const Hero = () => {
  const [data, setData] = useState<HeroData>(DEFAULT_HERO);

  useEffect(() => {
    let isMounted = true;
    async function loadHero() {
      try {
        const res = await fetch('/api/frontend/hero');
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.hero && isMounted) {
            setData(json.hero);
          }
        }
      } catch (err) {
        // Fallback predeterminado ya activo
      }
    }
    loadHero();

    const handleUpdate = () => loadHero();
    window.addEventListener('hero-updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('hero-updated', handleUpdate);
    };
  }, []);

  return (
    <section
      className="relative flex min-h-[600px] items-center justify-center overflow-hidden text-center text-white md:min-h-[680px]"
      style={{ backgroundColor: data.backgroundColor || '#1D3343' }}
    >
      {/* Foto del edificio / Fondo dinámico */}
      <div className="absolute right-0 top-0 h-full w-full opacity-30 md:w-[56%] md:opacity-100 [-webkit-mask-image:linear-gradient(to_right,transparent,black_45%)] [mask-image:linear-gradient(to_right,transparent,black_45%)]">
        {data.backgroundImage ? (
          <img
            src={data.backgroundImage}
            alt="Fondo Hero"
            className="h-full w-full object-cover object-[70%_25%]"
          />
        ) : (
          <Image
            src={imgEdificio}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 56vw, 100vw"
            className="object-cover object-[70%_25%]"
          />
        )}
      </div>

      {/* Máscara para contraste */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,0,0,${data.backgroundOverlayOpacity}) 0%, rgba(0,0,0,${
            data.backgroundOverlayOpacity * 0.75
          }) 50%, rgba(0,0,0,${data.backgroundOverlayOpacity * 0.35}) 100%)`,
        }}
      />

      {/* Misceláneas opcionales */}
      {data.mostrarMiscelaneas && (
        <>
          <LineasHeader className="absolute left-0 top-0 z-0 w-[110px] -translate-y-[19.8%] md:w-[16.5%]" />
          <Triangulos className="absolute left-[6%] top-[9%] z-[1] hidden w-[23%] md:block" />
          <Triangulos className="absolute bottom-[8%] right-[4%] z-[1] hidden w-[23%] md:block" />
          <Barra color="azul" className="absolute bottom-0 left-0 z-[1] w-[50%] md:w-[35%]" />
        </>
      )}

      {/* Contenido centrado */}
      <div className="relative z-10 flex flex-col items-center gap-3 px-5 py-12 max-w-4xl mx-auto">
        {data.mostrarLogo && (
          data.logoUrl ? (
            <img
              src={data.logoUrl}
              alt="Logotipo"
              className="h-auto max-h-[100px] w-auto max-w-[220px]"
            />
          ) : (
            <Image
              src={logoDefault}
              alt="Construyendo Futuros"
              priority
              className="h-auto w-[130px] md:w-[190px]"
            />
          )
        )}

        <p
          className="mt-2 text-xl md:text-2xl font-medium tracking-wide"
          style={{ color: data.colorSubtitle || '#ffffff' }}
        >
          {data.subtitle}
        </p>

        <h1
          className="text-4xl font-bold md:text-5xl lg:text-6xl tracking-tight leading-tight"
          style={{ color: data.colorTitle || '#ffffff' }}
        >
          {data.title}
        </h1>

        <p
          className="text-base md:text-lg opacity-90 max-w-2xl"
          style={{ color: data.colorAddress || '#ffffff' }}
        >
          {data.address}
        </p>

        {data.mostrarBotonCta && (
          <div className="mt-2">
            <HeroButton text={data.ctaButtonText || "INSCRIBITE"} />
          </div>
        )}

        {/* Widgets secundarios dinámicos WYSIWYG */}
        {Array.isArray(data.elements) && data.elements.length > 0 && (
          <div className="w-full flex flex-wrap justify-center gap-3 mt-4">
            {data.elements.map((el: any) => (
              <div
                key={el.id}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm shadow-sm"
                style={{
                  backgroundColor: el.styles?.bg || 'rgba(255,255,255,0.15)',
                  color: el.styles?.color || '#ffffff',
                }}
              >
                {el.content}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;