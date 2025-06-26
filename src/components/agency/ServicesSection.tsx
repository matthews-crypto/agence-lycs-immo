import React from "react";
import { Briefcase, Home, Tag, Users } from "lucide-react";

const SERVICES = [
  {
    icon: <Home className="w-8 h-8 text-pink-500" />,
    title: "Vente & Location",
    desc: "Trouvez le bien idéal ou confiez-nous la vente de votre propriété en toute sérénité.",
  },
  {
    icon: <Briefcase className="w-8 h-8 text-purple-600" />,
    title: "Gestion Immobilière",
    desc: "Gestion complète de votre patrimoine : locataires, entretien, rentabilité garantie.",
  },
  {
    icon: <Tag className="w-8 h-8 text-fuchsia-500" />,
    title: "Conseil & Investissement",
    desc: "Accompagnement personnalisé pour investir intelligemment dans l’immobilier.",
  },
  {
    icon: <Users className="w-8 h-8 text-pink-400" />,
    title: "Relation Client Premium",
    desc: "Un suivi humain, réactif et transparent à chaque étape de votre projet.",
  },
];

export function ServicesSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-purple-700">Nos services</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {SERVICES.map((service, idx) => (
          <div
            key={service.title}
            className="bg-white/80 rounded-3xl shadow-lg p-8 flex flex-col items-center gap-4 hover:scale-105 hover:shadow-2xl transition-transform duration-300 backdrop-blur-md"
          >
            <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-full p-4 mb-2">
              {service.icon}
            </div>
            <h3 className="text-lg font-semibold text-purple-700 mb-2 text-center">{service.title}</h3>
            <p className="text-gray-600 text-center">{service.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
