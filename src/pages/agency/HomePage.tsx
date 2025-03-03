
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BedDouble, MapPin } from 'lucide-react';
import AgencyFooter from '@/components/agency/AgencyFooter';
import AgencyNavbar from '@/components/agency/AgencyNavbar';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import ContactForm from '@/components/agency/ContactForm';

// Define a type for the property to fix the 'length' error
interface Property {
  id: string;
  title: string;
  photos?: string[];
  property_offer_type?: string;
  address?: string;
  region?: string;
  price: number;
  surface_area?: number;
  bedrooms?: number;
  property_type: string;
}

function PropertyCategorySection({ type, properties, propertyTypeLabels, agency, handlePropertyClick }) {
  const { ref, isVisible } = useIntersectionObserver();
  
  return (
    <div 
      id={`section-${type}`}
      ref={ref}
      className={`container mx-auto px-4 mt-16 transition-all duration-1000 ease-out ${
        isVisible 
          ? 'opacity-100 transform-none' 
          : 'opacity-0 transform scale-95'
      }`}
    >
      <h2 className="text-2xl font-light mb-8">{propertyTypeLabels[type] || type}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((property, index) => (
          <div 
            key={property.id} 
            className={`cursor-pointer transition-all duration-700 ease-out ${
              isVisible 
                ? 'opacity-100 transform-none' 
                : 'opacity-0 transform scale-95'
            }`}
            style={{ 
              transitionDelay: isVisible ? `${index * 100}ms` : '0ms'
            }}
            onClick={() => handlePropertyClick(property.id)}
          >
            <div className="aspect-[4/3] overflow-hidden rounded-lg relative">
              {property.photos?.[0] ? (
                <img
                  src={property.photos[0]}
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <BedDouble className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div 
                className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: agency?.primary_color || '#000000',
                  color: 'white',
                }}
              >
                {property.property_offer_type === 'VENTE' ? 'À Vendre' : 'À Louer'}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-light">{property.title}</h3>
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <MapPin className="w-4 h-4" />
                <p className="text-sm">{property.address || property.region || 'Emplacement non spécifié'}</p>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <p className="text-lg">
                  {property.price.toLocaleString('fr-FR')} FCFA
                </p>
                <div className="flex items-center gap-1 text-gray-600">
                  <span>{property.surface_area} m²</span>
                  {property.bedrooms && (
                    <div className="flex items-center gap-1 ml-2">
                      <BedDouble className="w-4 h-4" />
                      <span>{property.bedrooms}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const HomePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const { ref: heroRef, isVisible: isHeroVisible } = useIntersectionObserver();

  // Fetch agency data
  const { data: agency, isLoading: isAgencyLoading } = useQuery({
    queryKey: ['agency', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch properties for the agency and specify the return type
  const { data: properties, isLoading: isPropertiesLoading } = useQuery<Property[]>({
    queryKey: ['properties', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          zone:zone_id (
            id,
            nom
          )
        `)
        .eq('agency_id', agency.id)
        .eq('is_available', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!agency?.id,
  });

  useEffect(() => {
    // Set a hero image from properties if available
    if (properties && Array.isArray(properties) && properties.length > 0) {
      for (const property of properties) {
        if (property.photos && property.photos.length > 0) {
          setHeroImage(property.photos[0]);
          break;
        }
      }
    }
  }, [properties]);

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/${slug}/property/${propertyId}`);
  };

  // Group properties by type with proper type checking
  const propertyTypeGroups = properties?.reduce<Record<string, Property[]>>((groups, property) => {
    const type = property.property_type || 'Autre';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(property);
    return groups;
  }, {});

  const propertyTypeLabels = {
    APPARTEMENT: 'Appartements',
    MAISON: 'Maisons',
    VILLA: 'Villas',
    TERRAIN: 'Terrains',
    BUREAU: 'Bureaux',
    COMMERCE: 'Commerces',
    IMMEUBLE: 'Immeubles',
    PARKING: 'Parkings',
    AUTRE: 'Autres'
  };

  if (isAgencyLoading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!agency) {
    return <div className="flex items-center justify-center h-screen">Agence non trouvée</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AgencyNavbar agency={agency} />
      
      {/* Hero Section */}
      <div 
        ref={heroRef}
        className={`h-[70vh] relative overflow-hidden transition-all duration-1000 ease-out ${
          isHeroVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{ 
            backgroundImage: heroImage ? `url(${heroImage})` : 'none',
            backgroundColor: heroImage ? undefined : '#f3f4f6'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6">
                {agency.agency_name}
              </h1>
              <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light">
                Votre partenaire de confiance pour tous vos projets immobiliers
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Property Type Sections with animations Fade In & Scale */}
      {propertyTypeGroups && Object.entries(propertyTypeGroups).map(([type, typeProperties]) => 
        typeProperties.length > 0 && (
          <PropertyCategorySection
            key={type}
            type={type}
            properties={typeProperties}
            propertyTypeLabels={propertyTypeLabels}
            agency={agency}
            handlePropertyClick={handlePropertyClick}
          />
        )
      )}

      {/* Nos Services Section */}
      <div id="nos-services" className="container mx-auto px-4 mt-24 py-16 bg-gray-50">
        <h2 className="text-3xl font-light text-center mb-8">Nos Services</h2>
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-lg text-gray-700">
            Chez {agency.agency_name}, nous vous accompagnons dans toutes les étapes de votre projet immobilier, que ce soit pour acheter ou louer un bien.
          </p>
        </div>
        
        {/* Contact Form */}
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-light mb-6 text-center">Contactez-nous</h3>
          <ContactForm agencyId={agency.id} />
        </div>
      </div>
      
      <AgencyFooter agency={agency} />
    </div>
  );
};

export default HomePage;
