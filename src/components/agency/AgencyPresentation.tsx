import React from "react";
import { MapPin, Phone, Mail } from "lucide-react";

export function AgencyPresentation({ agency }: { agency: any }) {
  return (
    <section className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-10 items-center">
      <div className="flex-1 bg-white/80 rounded-3xl shadow-xl p-8 backdrop-blur-md">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-purple-700">Qui sommes-nous ?</h2>
        <p className="text-gray-700 text-lg mb-4">
          {agency?.long_description || agency?.description || "Agence immobilière de référence, nous accompagnons nos clients dans tous leurs projets immobiliers avec passion, expertise et transparence."}
        </p>
        <div className="flex flex-wrap gap-6 mt-6">
          <div className="flex items-center gap-2 bg-gradient-to-r from-pink-200 to-purple-200 px-4 py-2 rounded-full text-purple-800 font-medium">
            <MapPin className="w-5 h-5" />
            {agency?.address}, {agency?.city} {agency?.postal_code}
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-pink-200 to-purple-200 px-4 py-2 rounded-full text-purple-800 font-medium">
            <Phone className="w-5 h-5" />
            {agency?.contact_phone}
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-pink-200 to-purple-200 px-4 py-2 rounded-full text-purple-800 font-medium">
            <Mail className="w-5 h-5" />
            {agency?.contact_email}
          </div>
        </div>
      </div>
      <div className="flex-1 flex justify-center items-center">
        {agency?.logo_url && (
          <img src={agency.logo_url} alt={agency.agency_name} className="h-48 w-48 rounded-full shadow-2xl border-8 border-white bg-white object-contain" />
        )}
      </div>
    </section>
  );
}
