import React from "react";
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Button } from "./button";
import { Separator } from "./separator";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-bold mb-4">LYCS IMMO</h3>
            <p className="text-gray-300 mb-4">
              Votre partenaire immobilier de confiance au Sénégal. Nous vous accompagnons dans tous vos projets immobiliers.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full">
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-300 hover:text-white transition-colors">Accueil</a>
              </li>
              <li>
                <a href="#properties-section" className="text-gray-300 hover:text-white transition-colors">Nos biens</a>
              </li>
              <li>
                <a href="#services" className="text-gray-300 hover:text-white transition-colors">Services</a>
              </li>
              <li>
                <a href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</a>
              </li>
              <li>
                <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Nos services</h3>
            <ul className="space-y-2">
              <li className="text-gray-300">Achat et vente de biens</li>
              <li className="text-gray-300">Location saisonnière</li>
              <li className="text-gray-300">Location longue durée</li>
              <li className="text-gray-300">Gestion locative</li>
              <li className="text-gray-300">Conseil immobilier</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 text-[#aa1ca0]" />
                <span className="text-gray-300">123 Avenue Cheikh Anta Diop, Dakar, Sénégal</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-[#aa1ca0]" />
                <span className="text-gray-300">+221 78 123 45 67</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-[#aa1ca0]" />
                <span className="text-gray-300">contact@lycsimmo.com</span>
              </div>
            </div>
          </div>
        </div>
        
        <Separator className="bg-gray-700 my-6" />
        
        <div className="text-center text-gray-400 text-sm">
          <p>&copy; {currentYear} LYCS IMMO. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
