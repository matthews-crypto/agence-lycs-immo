
import React from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';

interface AgencyFooterProps {
  agency: {
    agency_name: string;
    logo_url?: string | null;
  } | null;
}

const AgencyFooter: React.FC<AgencyFooterProps> = ({ agency }) => {
  return (
    <footer className="bg-slate-900 text-white py-12 mt-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-8 md:mb-0">
            {agency?.logo_url ? (
              <div className="mb-4">
                <img 
                  src={agency.logo_url} 
                  alt={`${agency.agency_name} logo`} 
                  className="h-16 object-contain"
                />
              </div>
            ) : (
              <h2 className="text-2xl font-semibold mb-4">{agency?.agency_name || 'Agence Immobilière'}</h2>
            )}
            <p className="text-slate-400 max-w-md">
              Votre partenaire de confiance pour tous vos projets immobiliers.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Suivez-nous</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-400 transition-colors">
                <Facebook />
              </a>
              <a href="#" className="hover:text-pink-400 transition-colors">
                <Instagram />
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                <Twitter />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-400">
          <p>&copy; {new Date().getFullYear()} {agency?.agency_name || 'Agence Immobilière'}. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default AgencyFooter;
