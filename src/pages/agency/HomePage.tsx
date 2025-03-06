
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, User, BedDouble, ChevronUp, Phone, Mail, ChevronDown, Briefcase, Search, Filter, Home, Tags, Info } from "lucide-react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { useNavigate } from "react-router-dom";
import { AuthDrawer } from "@/components/agency/AuthDrawer";
import { FilterSidebar, FilterType } from "@/components/property/FilterSidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const propertyTypeLabels: { [key: string]: string } = {
  "APARTMENT": "Appartement",
  "HOUSE": "Maison",
  "LAND": "Terrain",
  "COMMERCIAL": "Local commercial",
  "OFFICE": "Bureau",
  "OTHER": "Autre"
};

const propertyTypes = [
  { value: "APARTMENT", label: "Appartement" },
  { value: "HOUSE", label: "Maison" },
  { value: "LAND", label: "Terrain" },
  { value: "COMMERCIAL", label: "Local commercial" },
  { value: "OFFICE", label: "Bureau" },
  { value: "OTHER", label: "Autre" },
];

function useIntersectionObserver(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (ref.current) observer.unobserve(ref.current);
      }
    }, { threshold: 0.1, ...options });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return { ref, isVisible };
}

function useTypewriter(text, startTyping, typingSpeed = 50) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (!startTyping) {
      setDisplayText('');
      setCurrentIndex(0);
      return;
    }
    
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, typingSpeed);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, startTyping, typingSpeed]);
  
  return displayText;
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
    </div>
  );
}

export default function AgencyHomePage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [heroApi, setHeroApi] = useState<any>();
  const [propertiesApi, setPropertiesApi] = useState<any>();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const [isServicesVisible, setIsServicesVisible] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(null);
  const [minSurfaceArea, setMinSurfaceArea] = useState<number | null>(null);
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

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
    queryKey: ["agency-properties", agency?.id, selectedRegion, selectedZone, selectedPropertyType, minSurfaceArea, selectedBedrooms, maxPrice],
    queryFn: async () => {
      if (!agency?.id) throw new Error("Agency ID required");
      
      let query = supabase
        .from("properties")
        .select(`
          *,
          zone (
            id,
            nom,
            latitude,
            longitude,
            circle_radius
          )
        `)
        .eq("agency_id", agency.id)
        .eq("is_available", true);
      
      if (selectedZone) {
        query = query.eq("zone_id", selectedZone);
      }
      else if (selectedRegion) {
        const { data: regionZones, error: zonesError } = await supabase
          .from("zone")
          .select("id")
          .eq("region_id", selectedRegion);
        
        if (zonesError) throw zonesError;
        
        if (regionZones.length > 0) {
          const zoneIds = regionZones.map(z => z.id);
          query = query.in("zone_id", zoneIds);
        }
      }
      
      if (selectedPropertyType) {
        query = query.eq("property_type", selectedPropertyType);
      }
      
      if (minSurfaceArea) {
        query = query.gte("surface_area", minSurfaceArea);
      }
      
      if (selectedBedrooms) {
        query = query.eq("bedrooms", selectedBedrooms);
      }
      
      if (maxPrice) {
        query = query.lte("price", maxPrice);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!agency?.id,
  });

  const agencyRegions = [...new Set(properties?.map(p => p.region).filter(Boolean))];

  const filteredRegions = regions?.filter(region => 
    agencyRegions.includes(region.nom)
  );

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

  useEffect(() => {
    const handleScroll = () => {
      const nav = document.querySelector('nav');
      if (nav) {
        const navBottom = nav.getBoundingClientRect().bottom;
        setShowScrollTop(navBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setShowCategoryMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

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

  const zones = [...new Set(properties?.map(p => p.zone?.nom).filter(Boolean))];

  const propertyTypeGroups = properties?.reduce((groups: { [key: string]: any[] }, property) => {
    const type = property.property_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(property);
    return groups;
  }, {});

  const scrollToSection = (sectionId: string) => {
    setShowCategoryMenu(false);
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    if (!agency?.slug) return;
    navigate(`/${agency.slug}/properties/${propertyId}/public`);
  };

  const loopedProperties = [...(properties || []), ...(properties || [])];

  const typewriterText = `Chez ${agency?.agency_name}, nous vous accompagnons dans toutes les étapes de votre projet immobilier, que ce soit pour acheter ou louer un bien.`;
  const displayText = useTypewriter(typewriterText, isServicesVisible, 30);

  useEffect(() => {
    const servicesSection = servicesRef.current;
    if (!servicesSection) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsServicesVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );
    
    observer.observe(servicesSection);
    
    return () => {
      if (servicesSection) {
        observer.unobserve(servicesSection);
      }
    };
  }, [servicesRef]);

  const handleApplyFilters = (filters: FilterType) => {
    setSelectedRegion(filters.regionId);
    setSelectedZone(filters.zoneId);
    setSelectedPropertyType(filters.propertyType);
    setMinSurfaceArea(filters.minSurfaceArea);
    setSelectedBedrooms(filters.bedroomsCount);
    setMaxPrice(filters.maxPrice);
    
    if (filters.regionId || filters.zoneId || filters.propertyType || 
        filters.minSurfaceArea || filters.bedroomsCount || filters.maxPrice) {
      toast.success("Filtres appliqués");
    } else {
      toast.info("Filtres réinitialisés");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b relative" style={{ backgroundColor: agency?.primary_color || '#000000' }}>
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            {agency?.logo_url ? (
              <img 
                src={agency.logo_url} 
                alt={agency.agency_name}
                className="h-16 object-contain rounded-full"
              />
            ) : (
              <h1 className="text-2xl font-light text-white">
                {agency?.agency_name}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-8">
            <button
              onClick={() => scrollToTop()}
              className="text-white hover:text-white/90 transition-colors flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              <span>Accueil</span>
            </button>
            
            <div className="relative group">
              <button
                className="text-white hover:text-white/90 transition-colors flex items-center gap-2"
              >
                <Tags className="h-4 w-4" />
                <span>Catégorie Offre</span>
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              
              <div 
                className="absolute left-0 right-0 mt-2 py-4 bg-white shadow-lg rounded-b-lg w-[20rem] -left-1/4 
                        opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                        transition-all duration-300 ease-in-out transform origin-top scale-95 group-hover:scale-100"
                style={{ zIndex: 50 }}
              >
                <div className="p-2">
                  {propertyTypeGroups && Object.entries(propertyTypeGroups).map(([type, typeProperties]) => (
                    typeProperties.length > 0 && (
                      <div 
                        key={type} 
                        onClick={() => scrollToSection(`section-${type}`)}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer relative"
                        style={{ color: agency?.primary_color || '#000000' }}
                      >
                        <span className="font-medium relative inline-block after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-current after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">
                          {propertyTypeLabels[type] || type}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => scrollToSection('services')}
              className="text-white hover:text-white/90 transition-colors flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              <span>À propos</span>
            </button>
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 text-white"
            >
              <span>Compte</span>
              <User className="h-5 w-5" />
            </Button>
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
              onClick={() => setIsFilterSidebarOpen(true)}
            >
              <Filter className="h-4 w-4" />
              Plus de filtres
            </Button>
          </div>
        </div>
      </div>

      {(searchTerm.length > 0 || selectedRegion !== null || selectedZone !== null) && filteredProperties && (
        <div className="container mx-auto px-4 mt-16">
          {filteredProperties.length > 0 ? (
            <>
              <h2 className="text-2xl font-light mb-8">Résultats de votre recherche</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((property) => (
                  <div 
                    key={property.id} 
                    className="cursor-pointer"
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

      <div className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-light mb-12 text-center">
          Notre sélection d'annonces immobilières
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
                    onClick={() => handlePropertyClick(property.id)}
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-lg relative">
                      {property.photos?.[0] ? (
                        <img
                          src={property.photos[0]}
                          alt={property.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg cursor-pointer">
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
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>

      {propertyTypeGroups && Object.entries(propertyTypeGroups).map(([type, typeProperties]) => 
        Array.isArray(typeProperties) && typeProperties.length > 0 && (
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

      <div id="services" className="py-16 bg-gray-50" ref={servicesRef}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Briefcase className="w-8 h-8" style={{ color: agency?.primary_color || '#000000' }} />
                <h2 className="text-3xl font-light">Nos Services</h2>
              </div>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto min-h-[56px]">
                {displayText}
                <span className={isServicesVisible && displayText.length < typewriterText.length ? "animate-pulse" : "hidden"}>|</span>
              </p>
            </div>
            
            <div className="max-w-lg mx-auto w-full mt-8 bg-white p-8 rounded-lg shadow-lg">
              <h3 
                className="text-lg font-medium mb-4 text-center"
                style={{ color: agency?.primary_color || '#000000' }}
              >
                CONTACTEZ-NOUS
              </h3>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                const data = {
                  name: formData.get('name') as string,
                  firstname: formData.get('firstname') as string,
                  email: formData.get('email') as string,
                  phone: formData.get('phone') as string,
                  message: formData.get('message') as string,
                };

                if (!agency?.id) {
                  toast.error("Une erreur s'est produite");
                  return;
                }

                const { error } = await supabase
                  .from('contact_messages')
                  .insert([
                    {
                      agency_id: agency.id,
                      ...data
                    }
                  ]);

                if (error) {
                  console.error('Error sending message:', error);
                  toast.error("Une erreur s'est produite lors de l'envoi du message");
                  return;
                }

                toast.success("Cher(e) client votre demande est prise en compte nos agents vous contacterons dans les plus brief délais.");
                
                form.reset();
                
                const inputs = form.querySelectorAll('input, textarea');
                inputs.forEach((input: HTMLInputElement | HTMLTextAreaElement) => {
                  input.value = '';
                });
              }}>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">Nom</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Votre nom"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstname" className="text-gray-700">Prénom</Label>
                  <Input 
                    id="firstname" 
                    name="firstname" 
                    placeholder="Votre prénom"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="Votre email"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">Téléphone</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    placeholder="Votre numéro de téléphone"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-gray-700">Message</Label>
                  <Textarea 
                    id="message" 
                    name="message"
                    placeholder="Votre message"
                    className="min-h-[100px]"
                    required
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full"
                  style={{
                    backgroundColor: agency?.primary_color || '#000000',
                    color: 'white',
                  }}
                >
                  Envoyer
                </Button>
              </form>
              <Button
                className="w-full mt-4 flex items-center justify-center gap-2"
                onClick={() => {
                  if (agency?.contact_phone) {
                    window.location.href = `tel:${agency.contact_phone}`;
                  }
                }}
                style={{
                  backgroundColor: agency?.secondary_color || '#ffffff',
                  color: agency?.primary_color || '#000000',
                }}
              >
                <Phone className="w-5 h-5" />
                Appelez
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full transition-all hover:scale-110 z-50"
          style={{
            backgroundColor: agency?.primary_color || '#000000'
          }}
        >
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
      )}

      <AuthDrawer 
        open={isAuthOpen} 
        onOpenChange={setIsAuthOpen}
      />
      
      <FilterSidebar
        agencyId={agency?.id}
        onFilterApply={handleApplyFilters}
        open={isFilterSidebarOpen}
        onOpenChange={setIsFilterSidebarOpen}
      />
      
      <footer 
        id="about"
        className="py-12"
        style={{ backgroundColor: agency?.primary_color || '#000000' }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-white" />
                  <h3 
                    className="text-lg font-medium"
                    style={{ color: agency?.secondary_color || '#ffffff' }}
                  >
                    ADRESSE
                  </h3>
                </div>
                <p className="text-white">
                  {agency?.address}<br />
                  {agency?.city} {agency?.postal_code}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-white" />
                  <h3 
                    className="text-lg font-medium"
                    style={{ color: agency?.secondary_color || '#ffffff' }}
                  >
                    TÉLÉPHONE
                  </h3>
                </div>
                <p className="text-white">
                  {agency?.contact_phone}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-white" />
                  <h3 
                    className="text-lg font-medium"
                    style={{ color: agency?.secondary_color || '#ffffff' }}
                  >
                    E-MAIL
                  </h3>
                </div>
                <p className="text-white">
                  {agency?.contact_email}
                </p>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              {agency?.logo_url ? (
                <img 
                  src={agency.logo_url} 
                  alt={agency.agency_name}
                  className="h-20 object-contain rounded-full bg-white p-2"
                />
              ) : (
                <h2 className="text-2xl font-light text-white">
                  {agency?.agency_name}
                </h2>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
