
import React from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';

interface AgencyNavbarProps {
  agency: {
    agency_name: string;
    logo_url?: string | null;
    primary_color?: string;
    id: string;
  };
}

const AgencyNavbar: React.FC<AgencyNavbarProps> = ({ agency }) => {
  const { slug } = useParams<{ slug: string }>();
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {agency?.logo_url ? (
              <img 
                src={agency.logo_url} 
                alt={`${agency.agency_name} logo`} 
                className="h-10 object-contain"
              />
            ) : (
              <span 
                className="text-xl font-semibold"
                style={{ color: agency?.primary_color || '#000000' }}
              >
                {agency.agency_name}
              </span>
            )}
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-6">
              <Link 
                to={`/${slug}`} 
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                Accueil
              </Link>
              <a 
                href="#nos-services" 
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                À propos
              </a>
              <Link 
                to={`/${slug}/properties`} 
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                Propriétés
              </Link>
              <Link 
                to={`/${slug}/contact`} 
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AgencyNavbar;
