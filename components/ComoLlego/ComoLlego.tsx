import React from 'react';

const ComoLlego = () => {
  return (
    <section className="flex flex-col items-center justify-center py-16 px-4 bg-white text-[#1D3343]">
      <div className="max-w-4xl w-full flex flex-col gap-8">
        
        {/* Encabezado de la sección */}
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Cómo Llego</h2>
          <p className="text-lg text-[#1D3343]">
            Te esperamos en la <strong>Universidad de la Ciudad de Buenos Aires</strong>
            <br />
            Tte. Gral. Juan Domingo Perón 802, Ciudad Autónoma de Buenos Aires.
          </p>
        </div>

        {/* Mapa Embebido */}
        <div className="w-full h-80 md:h-96 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
          <iframe 
            src="https://www.google.com/maps?q=Universidad+de+la+Ciudad+de+Buenos+Aires,+Tte.+Gral.+Juan+Domingo+Per%C3%B3n+802,+Buenos+Aires&output=embed"
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa de ubicación de la Universidad de la Ciudad de Buenos Aires"
          ></iframe>
        </div>

        {/* Botón de Google Maps */}
        <div className="flex justify-center">
          <a 
            href="https://www.google.com/maps/search/?api=1&query=Universidad+de+la+Ciudad+de+Buenos+Aires,+Tte.+Gral.+Juan+Domingo+Per%C3%B3n+802,+Buenos+Aires"
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-[#FFCD02] text-[#1D3343] font-bold py-3 px-8 rounded-full hover:bg-[#1D3343] hover:text-[#FFCD02] transition cursor-pointer inline-block text-center"
          >
            Abrir en Google Maps
          </a>
        </div>

      </div>
    </section>
  );
};

export default ComoLlego;