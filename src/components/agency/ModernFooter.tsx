import React from "react";

export function ModernFooter({ agency }: { agency: any }) {
  return (
    <footer className="w-full bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-700 text-white py-10 mt-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          {agency?.logo_url && (
            <img src={agency.logo_url} alt={agency.agency_name} className="h-12 w-12 rounded-full bg-white p-2 shadow-lg" />
          )}
          <span className="text-xl font-bold">{agency?.agency_name}</span>
        </div>
        <div className="flex gap-6 text-white/80 text-sm">
          <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
          <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
          <a href="#" className="hover:text-white transition-colors">CGU</a>
        </div>
        <div className="text-white/70 text-xs">© {new Date().getFullYear()} {agency?.agency_name}. Tous droits réservés.</div>
      </div>
    </footer>
  );
}
