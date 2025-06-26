import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  MapPin, User, BedDouble, Search, Filter, Home, Building, Check, Star, 
  Phone, Mail, MessageSquare, ArrowRight, Heart, Clock, ShieldCheck, 
  Users, Award, Briefcase, HelpCircle, ChevronRight, ChevronDown, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AgencyRegistrationDialog } from "@/components/agency-registration/AgencyRegistrationDialog";
import { HomeFloatingButtons } from "@/components/ui/home-floating-buttons";
import { Footer } from "@/components/ui/footer";
import { toast } from "@/components/ui/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";


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

interface CarouselApi {
  scrollNext: () => void;
  scrollTo: (index: number) => void;
  canScrollNext: () => boolean;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [heroApi, setHeroApi] = useState<CarouselApi | null>(null);
  const [propertiesApi, setPropertiesApi] = useState<CarouselApi | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [visibleSection, setVisibleSection] = useState<string | null>(null);
  const sectionsRef = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: ""
  });
  
  // Fonction de gestion du formulaire de contact
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulation d'envoi de message (à remplacer par l'appel API réel)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Envoi du message à la table contact_message_admin
      const { data, error } = await supabase
        .from('contact_message_admin')
        .insert([
          {
            nom_complet: contactForm.name,
            email: contactForm.email,
            message: contactForm.message
          }
        ]);
      
      if (error) throw error;
      
      // Réinitialisation du formulaire et notification de succès
      setContactForm({ name: "", email: "", message: "" });
      toast({
        title: "Message envoyé",
        description: "Nous vous répondrons dans les plus brefs délais.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du message. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        .eq("is_available", true)
        .eq("property_status", "DISPONIBLE");

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

  // Observer pour les animations au scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSection(entry.target.id);
            entry.target.classList.add('animate-fadeIn');
          }
        });
      },
      { threshold: 0.1 }
    );
        
    Object.values(sectionsRef.current).forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      Object.values(sectionsRef.current).forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  // Cette fonction a été remplacée par la version plus complète au début du composant

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation améliorée avec dégradé et animation */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-[#aa1ca0] to-[#c71585] shadow-md transition-all duration-300">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/4ba55583-9b92-4de1-9e56-db4c7b893b4d.png"
                alt="LycsImmo Logo"
                className="h-12 w-auto rounded-full transition-transform duration-300 hover:scale-105"
              />
              <span className="ml-3 text-white font-semibold text-lg hidden md:block">LYCS IMMO</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setIsRegistrationOpen(true)} className="text-white hover:bg-white/10 transition-colors">
                <User className="h-4 w-4 mr-2" />
                Inscription Agence
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section améliorée avec animation et superposition */}
      <section className="relative min-h-[85vh] bg-gradient-to-b from-[#aa1ca0]/10 to-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/lovable-uploads/pattern-bg.png')] opacity-5 bg-repeat"></div>
        </div>
        
        <div className="container mx-auto px-4 pt-16 pb-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
            <div className="space-y-6 animate-fadeInLeft">
              <Badge className="px-4 py-1.5 bg-[#aa1ca0]/10 text-[#aa1ca0] hover:bg-[#aa1ca0]/20 transition-colors">
                Bienvenue sur LYCS IMMO
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Trouvez le bien <span className="text-[#aa1ca0]">idéal</span> pour votre projet immobilier
              </h1>
              <p className="text-lg text-gray-600 max-w-xl">
                LYCS IMMO vous accompagne dans toutes vos démarches immobilières au Sénégal. Location, vente, gestion - nous sommes votre partenaire de confiance.
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-[#aa1ca0] hover:bg-[#c71585] text-white transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg"
                  onClick={() => {
                    const element = document.getElementById('properties-section');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Découvrir nos biens
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-[#aa1ca0] text-[#aa1ca0] hover:bg-[#aa1ca0]/10 transition-all duration-300"
                  onClick={() => setIsRegistrationOpen(true)}
                >
                  Inscrire mon agence
                  <User className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative h-[50vh] lg:h-[60vh] rounded-2xl overflow-hidden shadow-2xl animate-fadeInRight">
              <Carousel 
                className="h-full" 
                opts={{ 
                  loop: true,
                  align: "start",
                }}
                setApi={setHeroApi}
              >
                <CarouselContent className="h-full">
                  {properties?.slice(0, 5).map((property) => (
                    <CarouselItem 
                      key={property.id} 
                      className="h-full"
                    >
                      <div className="relative h-full group cursor-pointer"
                        onClick={() => handlePropertyClick(property.id, property.agencies?.slug)}
                      >
                        {property.photos?.[0] ? (
                          <img
                            src={property.photos[0]}
                            alt={property.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <BedDouble className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <Badge className="mb-3 bg-[#aa1ca0] hover:bg-[#aa1ca0]">
                            {property.property_offer_type === "location" ? "Location" : "Vente"}
                          </Badge>
                          <h2 className="text-white text-2xl font-semibold">
                            {property.title}
                          </h2>
                          <div className="flex items-center gap-2 text-white/80 mt-2">
                            <MapPin className="w-4 h-4" />
                            <p>{property.zone?.nom}</p>
                          </div>
                          <p className="text-white text-xl mt-2">
                            {property.price.toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                  <CarouselPrevious className="h-8 w-8 rounded-full bg-white/30 backdrop-blur-sm hover:bg-white/50" />
                  <CarouselNext className="h-8 w-8 rounded-full bg-white/30 backdrop-blur-sm hover:bg-white/50" />
                </div>
              </Carousel>
            </div>
          </div>
        </div>
        
        
      </section>

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

      {/* Section "Pourquoi nous choisir" */}
      <section 
        id="why-choose-us" 
        className="py-24 bg-gradient-to-b from-white to-gray-50"
        ref={el => sectionsRef.current['why-choose-us'] = el}
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-3 py-1 bg-[#aa1ca0]/10 text-[#aa1ca0] hover:bg-[#aa1ca0]/20">
              Nos avantages
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Pourquoi choisir LYCS IMMO ?</h2>
            <p className="text-gray-600 text-lg">
              Nous nous distinguons par notre expertise du marché immobilier sénégalais et notre engagement à offrir un service personnalisé et transparent.  
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Avantage 1 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#aa1ca0] to-[#c71585] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-[#aa1ca0]/10 flex items-center justify-center mb-4 group-hover:bg-[#aa1ca0] transition-colors duration-300">
                  <ShieldCheck className="w-6 h-6 text-[#aa1ca0] group-hover:text-white transition-colors duration-300" />
                </div>
                <CardTitle className="text-xl">Sécurité et confiance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Toutes nos transactions sont sécurisées et nos agences partenaires sont vérifiées pour vous garantir une expérience sans souci.
                </p>
              </CardContent>
            </Card>
            
            {/* Avantage 2 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#aa1ca0] to-[#c71585] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-[#aa1ca0]/10 flex items-center justify-center mb-4 group-hover:bg-[#aa1ca0] transition-colors duration-300">
                  <Clock className="w-6 h-6 text-[#aa1ca0] group-hover:text-white transition-colors duration-300" />
                </div>
                <CardTitle className="text-xl">Gain de temps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Notre plateforme vous permet de trouver rapidement le bien qui correspond à vos critères sans multiplier les déplacements.
                </p>
              </CardContent>
            </Card>
            
            {/* Avantage 3 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#aa1ca0] to-[#c71585] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-[#aa1ca0]/10 flex items-center justify-center mb-4 group-hover:bg-[#aa1ca0] transition-colors duration-300">
                  <Users className="w-6 h-6 text-[#aa1ca0] group-hover:text-white transition-colors duration-300" />
                </div>
                <CardTitle className="text-xl">Accompagnement personnalisé</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Nos conseillers immobiliers vous accompagnent à chaque étape de votre projet, de la recherche à la signature du contrat.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Section "Nos services" */}
      <section 
        id="services" 
        className="py-24 bg-white"
        ref={el => sectionsRef.current['services'] = el}
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-3 py-1 bg-[#aa1ca0]/10 text-[#aa1ca0] hover:bg-[#aa1ca0]/20">
              Ce que nous proposons
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Nos services immobiliers</h2>
            <p className="text-gray-600 text-lg">
              Découvrez notre gamme complète de services immobiliers adaptés à tous vos besoins au Sénégal.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {/* Service 1 */}
            <div className="group">
              <div className="mb-6 relative">
                <div className="w-16 h-16 rounded-2xl bg-[#aa1ca0]/10 flex items-center justify-center group-hover:bg-[#aa1ca0] transition-colors duration-300">
                  <Home className="w-8 h-8 text-[#aa1ca0] group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="absolute w-16 h-16 rounded-2xl border border-[#aa1ca0] -top-2 -right-2 opacity-0 group-hover:opacity-100 group-hover:top-1 group-hover:right-1 transition-all duration-300"></div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Achat et vente</h3>
               <p className="text-gray-600 mb-4">
                 Nous vous accompagnons dans l'achat ou la vente de votre bien immobilier avec une expertise du marché local.  
               </p>
            </div>
            
            {/* Service 2 - Gestion immobilière */}
<div className="group">
  <div className="mb-6 relative">
    <div className="w-16 h-16 rounded-2xl bg-[#aa1ca0]/10 flex items-center justify-center group-hover:bg-[#aa1ca0] transition-colors duration-300">
      <Home className="w-8 h-8 text-[#aa1ca0] group-hover:text-white transition-colors duration-300" />
    </div>
    <div className="absolute w-16 h-16 rounded-2xl border border-[#aa1ca0] -top-2 -right-2 opacity-0 group-hover:opacity-100 group-hover:top-1 group-hover:right-1 transition-all duration-300"></div>
  </div>
  <h3 className="text-xl font-semibold mb-3">Gestion immobilière</h3>
  <p className="text-gray-600 mb-4">
    Gestion complète de votre patrimoine immobilier : valorisation, entretien, suivi locatif, et reporting personnalisé.
  </p>
  <button
    className="inline-flex items-center text-[#aa1ca0] hover:text-[#c71585] transition-colors duration-300 focus:outline-none"
    onClick={() => navigate('/services/gestion-immobiliere#gestion-immobiliere')}
  >
    En savoir plus
    <ChevronRight className="w-4 h-4 ml-1" />
  </button>
</div>

{/* Service 3 - Gestion copropriété */}
<div className="group">
  <div className="mb-6 relative">
    <div className="w-16 h-16 rounded-2xl bg-[#aa1ca0]/10 flex items-center justify-center group-hover:bg-[#aa1ca0] transition-colors duration-300">
      <Building className="w-8 h-8 text-[#aa1ca0] group-hover:text-white transition-colors duration-300" />
    </div>
    <div className="absolute w-16 h-16 rounded-2xl border border-[#aa1ca0] -top-2 -right-2 opacity-0 group-hover:opacity-100 group-hover:top-1 group-hover:right-1 transition-all duration-300"></div>
  </div>
  <h3 className="text-xl font-semibold mb-3">Gestion copropriété</h3>
  <p className="text-gray-600 mb-4">
    Prise en charge administrative, financière et technique de vos immeubles en copropriété. Assemblées, budgets, travaux, communication avec les copropriétaires.
  </p>
  <button
    className="inline-flex items-center text-[#aa1ca0] hover:text-[#c71585] transition-colors duration-300 focus:outline-none"
    onClick={() => navigate('/services/gestion-copropriete#gestion-copropriete')}
  >
    En savoir plus
    <ChevronRight className="w-4 h-4 ml-1" />
  </button>
</div>
            
            {/* Service 3 */}
            <div className="group">
              <div className="mb-6 relative">
                <div className="w-16 h-16 rounded-2xl bg-[#aa1ca0]/10 flex items-center justify-center group-hover:bg-[#aa1ca0] transition-colors duration-300">
                  <Briefcase className="w-8 h-8 text-[#aa1ca0] group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="absolute w-16 h-16 rounded-2xl border border-[#aa1ca0] -top-2 -right-2 opacity-0 group-hover:opacity-100 group-hover:top-1 group-hover:right-1 transition-all duration-300"></div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Gestion locative</h3>
              <p className="text-gray-600 mb-4">
                Confiez-nous la gestion de votre bien et bénéficiez d'un suivi régulier et d'une rentabilité optimisée.
              </p>
              <button
                className="inline-flex items-center text-[#aa1ca0] hover:text-[#c71585] transition-colors duration-300 focus:outline-none"
                onClick={() => navigate('/services/gestion-locative#gestion-locative')}
              >
                En savoir plus
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Service 4 - Agent immobilier (bot WhatsApp) */}
            <div className="group">
              <div className="mb-6 relative">
                <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 flex items-center justify-center group-hover:bg-[#25D366] transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#25D366] group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.472-.148-.672.15-.197.297-.768.966-.941 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.52.151-.174.2-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.672-1.623-.922-2.222-.242-.583-.487-.503-.672-.513l-.573-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.099 3.205 5.077 4.372.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.174-1.414-.073-.124-.27-.198-.568-.347z"/><path d="M12.004 2.003c-5.514 0-9.997 4.484-9.997 9.998 0 1.76.464 3.468 1.348 4.974l-1.429 5.221 5.348-1.404c1.47.805 3.141 1.235 4.73 1.235 5.514 0 9.996-4.484 9.996-9.998s-4.482-9.998-9.996-9.998zm5.428 15.428c-.23.654-1.347 1.257-1.844 1.332-.497.075-1.13.107-1.834-.117-.438-.138-1.002-.322-1.726-.631-3.009-1.193-4.965-4.14-5.123-4.338-.157-.198-1.224-1.629-1.224-3.114 0-1.484.789-2.211 1.069-2.49.28-.28.613-.351.815-.351.202 0 .405.002.581.011.185.008.432-.07.678.513.246.583.836 2.011.909 2.16.073.149.122.322.024.521-.097.198-.173.322-.322.497-.149.174-.316.387-.447.52-.133.133-.184.228-.13.326.053.099.211.347.452.562.619.553 1.099.888 1.256.987.157.099.248.074.341-.045.093-.119.392-.454.497-.609.104-.154.208-.128.353-.073.144.055.915.432 1.074.512.159.08.265.119.304.186.04.067.04.385-.189 1.039z"/></svg>
                </div>
                <div className="absolute w-16 h-16 rounded-2xl border border-[#25D366] -top-2 -right-2 opacity-0 group-hover:opacity-100 group-hover:top-1 group-hover:right-1 transition-all duration-300"></div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Agent immobilier (bot WhatsApp)</h3>
              <p className="text-gray-600 mb-4">
                Un agent virtuel sur WhatsApp qui répond instantanément à vos critères et vous propose les biens adaptés, 24h/24.
              </p>
              <button
                className="inline-flex items-center text-[#25D366] hover:text-[#128C7E] transition-colors duration-300 focus:outline-none"
                onClick={() => navigate('/services/bot-whatsapp#bot-whatsapp')}
              >
                En savoir plus
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section "Témoignages" */}
      <section 
        id="testimonials" 
        className="py-24 bg-gray-50"
        ref={el => sectionsRef.current['testimonials'] = el}
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-3 py-1 bg-[#aa1ca0]/10 text-[#aa1ca0] hover:bg-[#aa1ca0]/20">
              Ce que disent nos clients
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Témoignages</h2>
            <p className="text-gray-600 text-lg">
              Découvrez l'expérience de nos clients qui nous ont fait confiance pour leur projet immobilier.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <Carousel 
              className="w-full" 
              opts={{
                align: "center",
                loop: true,
              }}
            >
              <CarouselContent>
                {/* Témoignage 1 */}
                <CarouselItem className="md:basis-1/2 lg:basis-1/2 p-4">
                  <Card className="border-none shadow-lg h-full">
                    <CardContent className="pt-6">
                      <div className="flex mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-gray-600 italic mb-6">
                        "J'ai trouvé l'appartement de mes rêves grâce à LYCS IMMO. L'équipe a été très professionnelle et à l'écoute de mes besoins. Je recommande vivement leurs services !"
                      </p>
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                          <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Fatou Diop" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Fatou Diop</h4>
                          <p className="text-sm text-gray-500">Dakar</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
                
                {/* Témoignage 2 */}
                <CarouselItem className="md:basis-1/2 lg:basis-1/2 p-4">
                  <Card className="border-none shadow-lg h-full">
                    <CardContent className="pt-6">
                      <div className="flex mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-gray-600 italic mb-6">
                        "Le processus de vente de ma maison a été simplifié grâce à l'expertise de LYCS IMMO. Leur connaissance du marché m'a permis d'obtenir le meilleur prix."
                      </p>
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                          <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Amadou Sall" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Amadou Sall</h4>
                          <p className="text-sm text-gray-500">Saint-Louis</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
                
                {/* Témoignage 3 */}
                <CarouselItem className="md:basis-1/2 lg:basis-1/2 p-4">
                  <Card className="border-none shadow-lg h-full">
                    <CardContent className="pt-6">
                      <div className="flex mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-gray-600 italic mb-6">
                        "En tant qu'investisseur étranger, j'avais besoin d'un partenaire fiable. LYCS IMMO m'a guidé dans mes investissements immobiliers au Sénégal avec professionnalisme."
                      </p>
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                          <img src="https://randomuser.me/api/portraits/men/67.jpg" alt="Jean Dupont" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Jean Dupont</h4>
                          <p className="text-sm text-gray-500">Saly</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              </CarouselContent>
              <div className="flex justify-center mt-8 gap-2">
                <CarouselPrevious className="static transform-none mx-2" />
                <CarouselNext className="static transform-none mx-2" />
              </div>
            </Carousel>
          </div>
        </div>
      </section>
      
      {/* Section "Nos biens" */}
      <section 
        id="properties-section" 
        className="py-24 bg-white"
        ref={el => sectionsRef.current['properties'] = el}
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-3 py-1 bg-[#aa1ca0]/10 text-[#aa1ca0] hover:bg-[#aa1ca0]/20">
              Découvrez nos offres
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Notre sélection de biens immobiliers</h2>
            <p className="text-gray-600 text-lg">
              Parcourez notre catalogue de propriétés soigneusement sélectionnées pour répondre à tous vos besoins.
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
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
                    className="md:basis-1/2 lg:basis-1/3 p-3"
                  >
                    <div 
                      className="relative group cursor-pointer bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                      onClick={() => handlePropertyClick(property.id, property.agencies?.slug)}
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        {property.photos?.[0] ? (
                          <img
                            src={property.photos[0]}
                            alt={property.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <BedDouble className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge className={`${property.property_offer_type === "location" ? "bg-blue-500" : "bg-[#aa1ca0]"} hover:${property.property_offer_type === "location" ? "bg-blue-600" : "bg-[#c71585]"}`}>
                            {property.property_offer_type === "location" ? "Location" : "Vente"}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-semibold truncate">{property.title}</h3>
                        <div className="flex items-center gap-2 text-gray-600 mt-2">
                          <MapPin className="w-4 h-4" />
                          <p className="text-sm">{property.zone?.nom}</p>
                        </div>
                        <div className="mt-3 flex justify-between items-center">
                          <p className="text-lg font-bold text-[#aa1ca0]">
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
                        <Separator className="my-3" />
                        <p className="text-sm text-gray-600 flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          {property.agencies?.agency_name}
                        </p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-end mt-8 gap-2">
                <CarouselPrevious />
                <CarouselNext />
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* Section FAQ */}
      <section 
        id="faq" 
        className="py-24 bg-gray-50"
        ref={el => sectionsRef.current['faq'] = el}
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-3 py-1 bg-[#aa1ca0]/10 text-[#aa1ca0] hover:bg-[#aa1ca0]/20">
              Questions fréquentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">FAQ</h2>
            <p className="text-gray-600 text-lg">
              Retrouvez les réponses aux questions les plus fréquemment posées sur nos services immobiliers.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-b border-gray-200 py-2">
                <AccordionTrigger className="hover:text-[#aa1ca0] transition-colors duration-300 text-left font-medium py-4">
                  Comment fonctionne le processus d'achat immobilier au Sénégal ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  Le processus d'achat immobilier au Sénégal comprend plusieurs étapes : recherche du bien, visite, négociation, signature d'un compromis de vente, versement d'un acompte, vérification des documents juridiques, signature de l'acte de vente devant notaire et paiement des frais d'enregistrement. Notre équipe vous accompagne à chaque étape pour faciliter votre acquisition.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border-b border-gray-200 py-2">
                <AccordionTrigger className="hover:text-[#aa1ca0] transition-colors duration-300 text-left font-medium py-4">
                  Quels sont les documents nécessaires pour louer un bien ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  Pour louer un bien au Sénégal, vous devrez généralement fournir une pièce d'identité valide, des justificatifs de revenus (bulletins de salaire, attestation d'emploi), un garant si nécessaire, et parfois des références de location précédentes. Les exigences peuvent varier selon les agences et les propriétaires.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border-b border-gray-200 py-2">
                <AccordionTrigger className="hover:text-[#aa1ca0] transition-colors duration-300 text-left font-medium py-4">
                  Comment inscrire mon agence sur LYCS IMMO ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  Pour inscrire votre agence sur notre plateforme, cliquez sur le bouton "Inscrire mon agence" en haut de la page d'accueil. Vous devrez remplir un formulaire avec les informations de votre agence, télécharger les documents requis et attendre la validation de votre compte par notre équipe. Une fois validée, vous pourrez publier vos annonces et gérer vos biens immobiliers.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4" className="border-b border-gray-200 py-2">
                <AccordionTrigger className="hover:text-[#aa1ca0] transition-colors duration-300 text-left font-medium py-4">
                  Quelles sont les zones les plus recherchées au Sénégal ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  Les zones les plus recherchées au Sénégal varient selon les besoins. À Dakar, les quartiers comme Almadies, Ngor, Mermoz et Plateau sont très prisés pour leur proximité avec les centres d'affaires et les commodités. Pour les investissements touristiques, Saly, Somone et Cap Skirring sont particulièrement populaires. Les villes comme Thiès et Saint-Louis connaissent également un développement immobilier important.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5" className="border-b border-gray-200 py-2">
                <AccordionTrigger className="hover:text-[#aa1ca0] transition-colors duration-300 text-left font-medium py-4">
                  Comment estimer la valeur de mon bien immobilier ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  L'estimation de la valeur d'un bien immobilier prend en compte plusieurs facteurs : l'emplacement, la superficie, l'état général, les prestations, l'environnement et les tendances du marché local. Nos experts immobiliers peuvent réaliser une estimation précise de votre bien en tenant compte de tous ces éléments et des transactions récentes dans votre secteur. Contactez-nous pour bénéficier d'une estimation professionnelle.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
      
      {/* Section Contact */}
      <section 
        id="contact" 
        className="py-24 bg-white"
        ref={el => sectionsRef.current['contact'] = el}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 px-3 py-1 bg-[#aa1ca0]/10 text-[#aa1ca0] hover:bg-[#aa1ca0]/20">
                  Contactez-nous
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Une question ? Besoin d'aide ?</h2>
                <p className="text-gray-600 text-lg mb-8">
                  Notre équipe est à votre disposition pour répondre à toutes vos questions concernant nos services immobiliers au Sénégal.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-[#aa1ca0]/10 flex items-center justify-center mr-4 shrink-0">
                      <MapPin className="w-6 h-6 text-[#aa1ca0]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Notre adresse</h3>
                      <p className="text-gray-600">123 Avenue Cheikh Anta Diop, Dakar, Sénégal</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-[#aa1ca0]/10 flex items-center justify-center mr-4 shrink-0">
                      <Phone className="w-6 h-6 text-[#aa1ca0]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Téléphone</h3>
                      <p className="text-gray-600">+221 78 123 45 67</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-[#aa1ca0]/10 flex items-center justify-center mr-4 shrink-0">
                      <Mail className="w-6 h-6 text-[#aa1ca0]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Email</h3>
                      <p className="text-gray-600">contact@lycsimmo.com</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Card className="border-none shadow-xl">
                  <CardHeader>
                    <CardTitle>Envoyez-nous un message</CardTitle>
                    <CardDescription>Nous vous répondrons dans les plus brefs délais.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input 
                          id="name" 
                          placeholder="Votre nom" 
                          value={contactForm.name}
                          onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="votre@email.com" 
                          value={contactForm.email}
                          onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea 
                          id="message" 
                          placeholder="Comment pouvons-nous vous aider ?" 
                          rows={4}
                          value={contactForm.message}
                          onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                          required
                        />
                      </div>
                      
                      <Button type="submit" className="w-full bg-[#aa1ca0] hover:bg-[#c71585] text-white">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : (
                          "Envoyer le message"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AgencyRegistrationDialog 
        open={isRegistrationOpen} 
        onOpenChange={setIsRegistrationOpen} 
      />

      <HomeFloatingButtons />
      <Footer />
    </div>
  );
}
