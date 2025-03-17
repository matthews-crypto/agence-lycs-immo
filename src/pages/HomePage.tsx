import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, User, BedDouble, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AgencyRegistrationDialog } from "@/components/agency-registration/AgencyRegistrationDialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const propertyTypes = [
  { value: "APARTMENT", label: "Appartement" },
  { value: "HOUSE", label: "Maison" },
  { value: "LAND", label: "Terrain" },
  { value: "COMMERCIAL", label: "Local commercial" },
  { value: "OFFICE", label: "Bureau" },
  { value: "OTHER", label: "Autre" },
];

const propertyTypeLabels: { [key: string]: string } = {
  "APARTMENT": "Appartement",
  "HOUSE": "Maison",
  "LAND": "Terrain",
  "COMMERCIAL": "Local commercial",
  "OFFICE": "Bureau",
  "OTHER": "Autre"
};

export default function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [heroApi, setHeroApi] = useState<any>();
  const [propertiesApi, setPropertiesApi] = useState<any>();

  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("region")
        .select("*")
        .order("nom");

      if (error) throw error;
      return data;
    },
  });

  const { data: properties } = useQuery({
    queryKey: ["all-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          agencies(*),
          zone (
            id,
            nom,
            latitude,
            longitude,
            circle_radius
          )
        `)
        .eq("is_available", true);

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!heroApi || !propertiesApi) return;

    const heroAutoplay = setInterval(() => {
      if (heroApi.canScrollNext()) heroApi.scrollNext();
      else heroApi.scrollTo(0);
    }, 5000);

    const propertiesAutoplay = setInterval(() => {
      if (propertiesApi.canScrollNext()) propertiesApi.scrollNext();
      else propertiesApi.scrollTo(0);
    }, 3000);

    return () => {
      clearInterval(heroAutoplay);
      clearInterval(propertiesAutoplay);
    };
  }, [heroApi, propertiesApi]);

  const filteredProperties = properties?.filter(property => {
    if (!searchTerm) return true;
    
    const prepositionsToIgnore = ['a', 'à', 'au', 'aux', 'avec', 'de', 'des', 'du', 'en', 'et', 
      'dans', 'par', 'pour', 'sans', 'sur', 'le', 'la', 'les', 'un', 'une'];
    
    const searchWords = searchTerm.toLowerCase()
      .split(' ')
      .map(word => word.trim())
      .filter(word => word.length > 0 && !prepositionsToIgnore.includes(word));
    
    if (searchWords.length === 0) return true;
    
    const valueContainsSearchWord = (value, words) => {
      if (!value) return false;
      const normalizedValue = value.toString().toLowerCase();
      return words.some(word => normalizedValue.includes(word));
    };

    const transactionMapping = {
      'louer': 'location',
      'location': 'location',
      'vendre': 'vente',
      'vente': 'vente'
    };
    
    return searchWords.every(word => {
      const isTransactionTerm = Object.keys(transactionMapping).includes(word);
      if (isTransactionTerm) {
        const mappedTerm = transactionMapping[word];
        const offerType = property.property_offer_type?.toLowerCase();
        if (offerType === 'vente' && mappedTerm === 'vente') return true;
        if (offerType === 'location' && mappedTerm === 'location') return true;
      }

      for (const [typeKey, typeLabel] of Object.entries(propertyTypeLabels)) {
        const typeLabelLower = typeLabel.toLowerCase();
        const wordLower = word.toLowerCase();
        if (typeLabelLower.includes(wordLower) || wordLower.includes(typeLabelLower)) {
          if (property.property_type === typeKey) {
            return true;
          }
        }
      }
      
      return (
        valueContainsSearchWord(property.title, [word]) || 
        valueContainsSearchWord(property.description, [word]) ||
        valueContainsSearchWord(property.zone?.nom, [word]) ||
        valueContainsSearchWord(property.region, [word])
      );
    });
  });

  const handlePropertyClick = (propertyId: string, agencySlug: string) => {
    if (!agencySlug) {
      console.error('No agency slug found for this property');
      return;
    }
    navigate(`/${agencySlug}/properties/${propertyId}/public`);
  };

  const loopedProperties = [...(properties || []), ...(properties || [])];

  return (
    <div className="min-h-screen bg-white">
      <nav style={{ backgroundColor: '#aa1ca0' }} className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div>
              <img 
                src="/lovable-uploads/4ba55583-9b92-4de1-9e56-db4c7b893b4d.png"
                alt="LycsImmo Logo"
                className="h-12 w-auto rounded-full"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setIsRegistrationOpen(true)} className="text-white hover:text-white/90">
                <User className="h-4 w-4 mr-2" />
                Inscription Agence
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 mt-8">
        <div className="relative h-[40vh] max-w-5xl mx-auto bg-gray-100 rounded-lg overflow-hidden">
          <Carousel 
            className="h-full" 
            opts={{ 
              loop: true,
              align: "start",
            }}
            setApi={setHeroApi}
          >
            <CarouselContent className="h-full">
              {properties?.slice(0, 3).map((property) => (
                <CarouselItem 
                  key={property.id} 
                  className="h-full"
                >
                  <div className="relative h-full">
                    {property.photos?.[0] ? (
                      <img
                        src={property.photos[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <BedDouble className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8">
                      <h2 className="text-white text-2xl font-light">
                        {property.title}
                      </h2>
                      <p className="text-white/80 mt-2">
                        {property.zone?.nom}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                placeholder="Rechercher un bien..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline"
              className="w-full md:w-auto gap-2"
            >
              <Filter className="h-4 w-4" />
              Plus de filtres
            </Button>
          </div>
        </div>
      </div>

      {searchTerm.length > 0 && filteredProperties && (
        <div className="container mx-auto px-4 mt-16">
          {filteredProperties.length > 0 ? (
            <>
              <h2 className="text-2xl font-light mb-8">Résultats de votre recherche</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((property) => (
                  <div 
                    key={property.id} 
                    className="cursor-pointer"
                    onClick={() => handlePropertyClick(property.id, property.agencies?.slug)}
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-lg">
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
                    </div>
                    <div className="mt-4">
                      <h3 className="text-xl font-light">{property.title}</h3>
                      <div className="flex items-center gap-2 text-gray-600 mt-2">
                        <MapPin className="w-4 h-4" />
                        <p className="text-sm">{property.zone?.nom}</p>
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
            </>
          ) : (
            <h2 className="text-2xl font-light mb-8 text-center">Aucune propriété ne correspond à votre sélection</h2>
          )}
        </div>
      )}

      <div className="py-32 container mx-auto px-4">
        <h2 className="text-3xl font-light mb-12 text-center">
          Notre sélection d'annonces immobilière
        </h2>
        
        <div className="max-w-5xl mx-auto">
          <Carousel 
            className="w-full" 
            opts={{
              align: "start",
              loop: true,
            }}
            setApi={setPropertiesApi}
          >
            <CarouselContent>
              {loopedProperties.map((property, index) => (
                <CarouselItem 
                  key={`${property.id}-${index}`} 
                  className="md:basis-1/2 lg:basis-1/3"
                >
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => handlePropertyClick(property.id, property.agencies?.slug)}
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-lg">
                      {property.photos?.[0] ? (
                        <img
                          src={property.photos[0]}
                          alt={property.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <BedDouble className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <h3 className="text-xl font-light">{property.title}</h3>
                      <div className="flex items-center gap-2 text-gray-600 mt-2">
                        <MapPin className="w-4 h-4" />
                        <p className="text-sm">{property.zone?.nom}</p>
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
                      <p className="text-sm text-gray-600 mt-2">
                        {property.agencies?.agency_name}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>

      <AgencyRegistrationDialog 
        open={isRegistrationOpen} 
        onOpenChange={setIsRegistrationOpen}
      />
    </div>
  );
}
