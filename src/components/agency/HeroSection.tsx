import React from "react";
import { Button } from "@/components/ui/button";

export function HeroSection({ agency, onContactClick, onScrollToProperties }: {
  agency: any;
  onContactClick: () => void;
  onScrollToProperties: () => void;
}) {
  return (
    <section
      className="relative flex flex-col items-center justify-center min-h-[60vh] w-full overflow-hidden bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-700 text-white"
      style={{ backgroundImage: agency?.cover_url ? `url(${agency.cover_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-pink-400/70 via-fuchsia-500/60 to-purple-700/80 z-10" />
      <div className="relative z-20 flex flex-col items-center justify-center text-center gap-4 p-8">
        {agency?.logo_url && (
          <img src={agency.logo_url} alt={agency.agency_name} className="h-28 w-28 rounded-full shadow-xl border-4 border-white bg-white/80 object-contain mb-4" />
        )}
        <h1 className="text-3xl md:text-5xl font-bold drop-shadow-xl mb-2">
          {agency?.agency_name}
        </h1>
        <p className="max-w-xl text-lg md:text-2xl font-light drop-shadow-lg mb-4">
          {agency?.description || "Découvrez l'agence et ses biens immobiliers d'exception."}
        </p>
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <Button onClick={onScrollToProperties} className="bg-gradient-to-r from-pink-400 to-purple-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition-transform">
            Découvrir les biens
          </Button>
          <Button variant="outline" onClick={onContactClick} className="border-white text-white hover:bg-white/10 px-8 py-3 rounded-full text-lg font-semibold shadow-lg">
            Contacter l'agence
          </Button>
        </div>
      </div>
    </section>
  );
}
