import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { useNavigate } from "react-router-dom";
import { Home, ChevronUp, ChevronDown, MapPin, BedDouble, Tags, Info, MessageCircle, Phone, Mail, User, Search, Filter, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { FilterSidebar, FilterType } from "@/components/property/FilterSidebar";
import { AuthDrawer } from "@/components/agency/AuthDrawer";
import { AgencyChatDialog } from "@/components/ui/agency-chat-dialog";
import { HeroSection } from "@/components/agency/HeroSection";
import { AgencyPresentation } from "@/components/agency/AgencyPresentation";
import { ServicesSection } from "@/components/agency/ServicesSection";
import { PropertiesCarousel } from "@/components/agency/PropertiesCarousel";
import { TestimonialsSection } from "@/components/agency/TestimonialsSection";
import { ContactSection } from "@/components/agency/ContactSection";
import { ModernFooter } from "@/components/agency/ModernFooter";

const propertyTypeLabels: { [key: string]: string } = {
  "APARTMENT": "Appartement",
  "HOUSE": "Maison",
  "LAND": "Terrain",
  "COMMERCIAL": "Local commercial",
  "OFFICE": "Bureau",
  "OTHER": "Autre"
};


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
                  {property.property_offer_type === 'LOCATION' && property.type_location === 'longue_duree' && ' /mois'}
                  {property.property_offer_type === 'LOCATION' && property.type_location === 'courte_duree' && ' /jour'}
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

interface CarouselApi {
  scrollNext: () => void;
  scrollTo: (index: number) => void;
  canScrollNext: () => boolean;
}

export default function AgencyHomePage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Log pour vérifier l'objet agency
  useEffect(() => {
    console.log('Agency object in HomePage:', agency);
  }, [agency]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [heroApi, setHeroApi] = useState<CarouselApi | null>(null);
  const [propertiesApi, setPropertiesApi] = useState<CarouselApi | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [isServicesVisible, setIsServicesVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'bot', content: string, timestamp?: string}>>([]);

  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(null);
  const [minSurfaceArea, setMinSurfaceArea] = useState<number | null>(null);
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

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
        .eq("is_available", true)
        .eq("property_status", "DISPONIBLE");
      
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsServicesVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (servicesRef.current) {
      observer.observe(servicesRef.current);
    }

    return () => observer.disconnect();
  }, []);

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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handlePropertyClick = (propertyId: string) => {
    if (!agency?.slug) return;
    navigate(`/${agency.slug}/properties/${propertyId}/public`);
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
    
    const valueContainsSearchWord = (value: any, words: string[]) => {
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

  const loopedProperties = [...(properties || []), ...(properties || [])];

  const typewriterText = `Chez ${agency?.agency_name}, nous vous accompagnons dans toutes les étapes de votre projet immobilier, que ce soit pour acheter ou louer un bien.`;
  const displayText = useTypewriter(typewriterText, isServicesVisible, 30);

  const handleApplyFilters = (filters: FilterType) => {
    setSelectedRegion(filters.regionId);
    setSelectedZone(filters.zoneId);
    setSelectedPropertyType(filters.propertyType);
    setMinSurfaceArea(filters.minSurfaceArea);
    setSelectedBedrooms(filters.bedrooms);
    setMaxPrice(filters.maxPrice);
    setIsFilterSidebarOpen(false);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agency?.id || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Enregistrer le message de contact dans la base de données
      const { error } = await supabase.from('contact_messages').insert({
        agency_id: agency.id,
        name: name,
        email: email,
        message: message,
        firstname: '', // On laisse vide car on utilise juste le champ name
        phone: phone,
      });

      if (error) throw error;

      // Envoyer les données au webhook spécifique à l'agence
      try {
        const response = await fetch('https://lycs.app.n8n.cloud/webhook/specAg', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-is-trusted': 'yes'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            phone: phone,
            message: message,
            agencyName: agency?.agency_name,
            agencyId: agency?.id
          })
        });

        await response.json(); // On attend la réponse mais on ne la traite pas
      } catch (webhookError) {
        console.error('Erreur lors de l\'envoi au webhook:', webhookError);
        // On continue même si le webhook échoue, car les données sont déjà sauvegardées dans la base de données
      }

      // Réinitialiser les champs du formulaire
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setSelectedPropertyType(null);
      setMaxPrice(null);
      setMinSurfaceArea(null);
      setSelectedBedrooms(null);
      setSelectedZone(null);

      toast({
        title: "Demande envoyée",
        description: "Nous vous contacterons dans les plus brefs délais.",
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du formulaire.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b relative" style={{ backgroundColor: agency?.primary_color || '#000000' }}>
        <div className="container mx-auto py-3 px-4 flex justify-between items-center">
          <div className="flex items-center">
            {agency?.logo_url ? (
              <img 
                src={agency.logo_url} 
                alt={agency.agency_name}
                className="h-14 object-contain rounded-full"
              />
            ) : (
              <h1 className="text-2xl font-light text-white">
                {agency?.agency_name}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-6">
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
                className="absolute mt-2 py-4 bg-white shadow-lg rounded-b-lg w-auto min-w-[180px] 
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
                        <span className="font-medium relative inline-block after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">
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
            
            <Button
              variant="ghost"
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center justify-center text-white p-2 h-9 w-9"
              size="icon"
            >
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
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <h3 className="text-white font-semibold truncate">{property.title}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-white/90 text-sm">
                          {property.property_offer_type === 'VENTE' ? 'À vendre' : 'À louer'}
                        </span>
                        <span className="text-white font-bold">
                          {property.price.toLocaleString('fr-FR')} FCFA
                          {property.property_offer_type === 'LOCATION' && property.type_location === 'longue_duree' && ' /mois'}
                          {property.property_offer_type === 'LOCATION' && property.type_location === 'courte_duree' && ' /jour'}
                        </span>
                      </div>
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
                placeholder="Rechercher par titre, type ou localisation..."
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
                          {property.property_offer_type === 'LOCATION' && property.type_location === 'longue_duree' && ' /mois'}
                          {property.property_offer_type === 'LOCATION' && property.type_location === 'courte_duree' && ' /jour'}
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
                          {property.property_offer_type === 'LOCATION' && property.type_location === 'longue_duree' && ' /mois'}
                          {property.property_offer_type === 'LOCATION' && property.type_location === 'courte_duree' && ' /jour'}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {/* Carte 1 - Vente et Location */}
              <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80" 
                    alt="Vente et Location" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <h3 className="text-white text-xl font-semibold p-4">Vente & Location</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700">
                    Trouvez votre bien idéal parmi notre sélection exclusive de propriétés premium. Notre expertise du marché immobilier sénégalais vous garantit un accompagnement personnalisé pour concrétiser votre projet d'achat ou de location.
                  </p>
                </div>
              </div>

              {/* Carte 2 - Gestion Immobilière */}
              <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
                    alt="Gestion Immobilière" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <h3 className="text-white text-xl font-semibold p-4">Gestion Immobilière</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700">
                    Confiez-nous la gestion de votre patrimoine immobilier. De la recherche de locataires qualifiés à la maintenance régulière, nous veillons sur vos biens comme s'ils étaient les nôtres, vous garantissant tranquillité d'esprit et rentabilité optimale.
                  </p>
                </div>
              </div>

              {/* Carte 3 - Conseil & Investissement */}
              <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1573164574572-cb89e39749b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80" 
                    alt="Conseil et Investissement" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <h3 className="text-white text-xl font-semibold p-4">Conseil & Investissement</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700">
                    Bénéficiez de notre expertise pour vos projets d'investissement immobilier. Notre connaissance approfondie du marché sénégalais vous permet d'identifier les opportunités les plus prometteuses et de maximiser le rendement de vos investissements.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="max-w-lg mx-auto w-full mt-16 bg-white p-8 rounded-lg shadow-lg">
              <h3 
                className="text-lg font-medium mb-4 text-center"
                style={{ color: agency?.primary_color || '#000000' }}
              >
                CONTACTEZ-NOUS
              </h3>
              <form className="space-y-4" onSubmit={handleContactSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">Nom</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Votre nom"
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full"
                  style={{
                    backgroundColor: agency?.primary_color || '#000000',
                    color: 'white',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer"}
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

      <Button
        onClick={() => {
          // Marquer tous les messages comme lus en les mettant à jour
          if (chatMessages.length > 0) {
            setChatMessages(prev => prev.map(msg => ({
              ...msg,
              read: true
            })));
          }
          // Ouvrir le chat
          setIsChatOpen(true);
        }}
        className="fixed bottom-4 right-4 rounded-full p-3 hover:opacity-90"
        size="icon"
        style={{ backgroundColor: agency?.primary_color || '#000000' }}
      >
        <MessageCircle className="h-4 w-4 text-white" />
        {!isChatOpen && chatMessages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {chatMessages.filter(m => m.role === 'bot' && !m.read).length}
          </span>
        )}
      </Button>

      <AgencyChatDialog
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        agency={agency}
        messages={chatMessages}
        setMessages={setChatMessages}
        onClickOutside={(e) => {
          // Si on clique en dehors du chat, on le ferme sans perdre les messages
          if (!(e.target as HTMLElement).closest('button')) {
            setIsChatOpen(false);
          }
        }}
      />

      <FilterSidebar
        open={isFilterSidebarOpen}
        onOpenChange={setIsFilterSidebarOpen}
        onFilterApply={handleApplyFilters}
        agencyId={agency?.id}
      />

      <AuthDrawer 
        open={isAuthOpen} 
        onOpenChange={setIsAuthOpen}
      />

      {/* Suppression du composant FloatingButtons pour éviter le conflit avec AgencyChatDialog */}

      <footer 
        id="about"
        className="pt-16 pb-8"
        style={{
          backgroundColor: agency?.primary_color || '#000000',
          backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%)',
          color: 'white'
        }}
      >
        <div className="container mx-auto px-4">
          {/* Vagues décoratives en haut du footer */}
          <div className="absolute left-0 right-0 -top-10 overflow-hidden">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-10">
              <path 
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                style={{ fill: agency?.primary_color || '#000000' }}
              ></path>
            </svg>
          </div>

          {/* Section principale */}
          <div className="flex flex-col space-y-12">
            {/* Logos et sponsors avec informations de contact */}
            <div className="flex flex-col items-center justify-center gap-8 mt-6">
              {/* Logo de l'agence avec informations de contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-center">
                {/* Téléphone et Email (à gauche sur desktop) */}
                <div className="flex flex-col space-y-6 order-2 md:order-1">
                  {/* Téléphone */}
                  <div className="transform transition-transform duration-300 hover:-translate-y-2 bg-white/10 backdrop-blur-sm p-4 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-white/20 animate-pulse">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
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
                    <button 
                      className="mt-3 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-2 text-sm"
                      onClick={() => {
                        if (agency?.contact_phone) {
                          window.location.href = `tel:${agency.contact_phone}`;
                        }
                      }}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Appeler maintenant</span>
                    </button>
                  </div>
                  
                  {/* Email */}
                  <div className="transform transition-transform duration-300 hover:-translate-y-2 bg-white/10 backdrop-blur-sm p-4 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-white/20 animate-pulse">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
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
                    <button 
                      className="mt-3 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-2 text-sm"
                      onClick={() => {
                        if (agency?.contact_email) {
                          window.location.href = `mailto:${agency.contact_email}`;
                        }
                      }}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Envoyer un email</span>
                    </button>
                  </div>
                </div>
                
                {/* Logo de l'agence (au centre) */}
                <div className="transform transition-all duration-500 hover:scale-110 flex justify-center order-1 md:order-2">
                  {agency?.logo_url ? (
                    <img 
                      src={agency.logo_url} 
                      alt={agency.agency_name}
                      className="h-24 object-contain rounded-full bg-white p-3 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    />
                  ) : (
                    <h2 className="text-3xl font-light text-white bg-white/10 p-6 rounded-full">
                      {agency?.agency_name}
                    </h2>
                  )}
                </div>
                
                {/* Adresse (à droite sur desktop) */}
                <div className="transform transition-transform duration-300 hover:-translate-y-2 bg-white/10 backdrop-blur-sm p-4 rounded-xl shadow-lg order-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-white/20 animate-pulse">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
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
              </div>
              
              {/* Séparateur stylisé */}
              <div className="flex items-center w-full max-w-md my-6 border-t border-white/20 pt-8">
                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
                <span className="px-4 text-sm text-white/70">Propulsé par</span>
                <div className="flex-grow h-px bg-gradient-to-r from-white to-transparent"></div>
              </div>

              {/* Logo LYCS IMMO comme sponsor */}
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-4">
                <img 
                  src="public/lovable-uploads/4ba55583-9b92-4de1-9e56-db4c7b893b4d.png" 
                  alt="LYCS IMMO"
                  className="h-12 object-contain"
                />
                <div>
                  <h4 className="text-lg font-medium" style={{ color: agency?.secondary_color || '#ffffff' }}>LYCS IMMO</h4>
                  <p className="text-sm text-white/80">La plateforme immobilière de référence au Sénégal</p>
                </div>
              </div>
            </div>

            {/* Copyright et liens légaux */}
            <div className="mt-12 pt-6 border-t border-white/10 text-center text-sm text-white/60">
              <p>© {new Date().getFullYear()} {agency?.agency_name}. Tous droits réservés.</p>
              <div className="flex justify-center gap-4 mt-2">
                <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">CGU</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <Button
        onClick={scrollToTop}
        className={`fixed bottom-4 left-4 rounded-full p-3 hover:opacity-90 ${showScrollTop ? 'block' : 'hidden'}`}
        size="icon"
        style={{ backgroundColor: agency?.primary_color || '#000000' }}
      >
        <ChevronUp className="h-4 w-4 text-white" />
      </Button>
    </div>
  );
}
