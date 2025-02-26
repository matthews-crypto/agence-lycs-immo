import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, User, BedDouble } from "lucide-react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { useNavigate } from "react-router-dom";
import { AuthDrawer } from "@/components/agency/AuthDrawer";
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

export default function AgencyHomePage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [minBudget, setMinBudget] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<string>("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
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
    queryKey: ["agency-properties", agency?.id],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .eq("agency_id", agency?.id)
        .eq("is_available", true)
        .order("created_at", { ascending: false });

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

  const filteredProperties = properties?.filter(property => {
    const matchesZone = selectedZone === "all" || property.zone?.nom === selectedZone;
    const matchesType = selectedType === "all" || property.property_type === selectedType;
    const matchesRegion = selectedRegion === "all" || property.region === selectedRegion;
    const matchesMinBudget = !minBudget || property.price >= parseInt(minBudget);
    const matchesMaxBudget = !maxBudget || property.price <= parseInt(maxBudget);
    return matchesZone && matchesType && matchesRegion && matchesMinBudget && matchesMaxBudget;
  });

  const zones = [...new Set(properties?.map(p => p.zone?.nom).filter(Boolean))];

  const handleSearch = () => {
    if (!selectedZone && !minBudget && !maxBudget && selectedType === "all" && selectedRegion === "all") {
      toast.warning("Veuillez sélectionner au moins un critère de recherche");
      return;
    }
    toast.success("Recherche effectuée avec succès");
  };

  const handlePropertyClick = (propertyId: string) => {
    if (!agency?.slug) return;
    navigate(`/${agency.slug}/properties/${propertyId}/public`);
  };

  const loopedProperties = [...(properties || []), ...(properties || [])];

  const scrollToSection = (type: string) => {
    const section = document.getElementById(`section-${type}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b sticky top-0 z-50" style={{ backgroundColor: agency?.primary_color || '#000000' }}>
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
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

            <div className="hidden md:flex space-x-8">
              {Object.keys(propertyTypeLabels).map((type) => (
                <button
                  key={type}
                  onClick={() => scrollToSection(type)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  {propertyTypeLabels[type]}
                </button>
              ))}
            </div>

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

      {/* Hero Carousel */}
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

        {/* Search Bar */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col md:flex-row gap-4">
            <Select 
              value={selectedZone} 
              onValueChange={setSelectedZone}
            >
              <SelectTrigger className="w-full md:w-[200px] text-base font-medium">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-base">Zones</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone} value={zone || ''} className="text-base">
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedType} 
              onValueChange={setSelectedType}
            >
              <SelectTrigger className="w-full md:w-[200px] text-base font-medium">
                <SelectValue placeholder="Type de bien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-base">Types</SelectItem>
                {propertyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-base">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedRegion} 
              onValueChange={setSelectedRegion}
            >
              <SelectTrigger className="w-full md:w-[200px] text-base font-medium">
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-base">Toutes les régions</SelectItem>
                {filteredRegions?.map((region) => (
                  <SelectItem key={region.id} value={region.nom} className="text-base">
                    {region.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <input
                type="number"
                placeholder="Budget min"
                className="flex-1 px-3 py-2 border rounded-md text-base font-medium"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
              />
              <input
                type="number"
                placeholder="Budget max"
                className="flex-1 px-3 py-2 border rounded-md text-base font-medium"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
            </div>

            <Button 
              className="w-full md:w-auto px-8"
              style={{
                backgroundColor: agency?.primary_color || '#000000',
              }}
              onClick={handleSearch}
            >
              Rechercher
            </Button>
          </div>
        </div>
      </div>

      {/* Filtered Properties */}
      {filteredProperties && filteredProperties.length > 0 && (selectedZone !== "all" || minBudget || maxBudget || selectedType !== "all") && (
        <div className="container mx-auto px-4 mt-16">
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
                    {propertyTypeLabels[property.property_type] || property.property_type}
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
      )}

      {/* Properties Carousel */}
      <div className="py-32 container mx-auto px-4">
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
                        {propertyTypeLabels[property.property_type] || property.property_type}
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

      {/* Properties Gallery by Type */}
      <div className="pb-32 container mx-auto px-4">
        <h2 className="text-3xl font-light mb-12 text-center">
          Tous nos biens par catégorie
        </h2>

        {Object.entries(
          properties?.reduce((acc, property) => {
            const type = property.property_type;
            if (!acc[type]) {
              acc[type] = [];
            }
            acc[type].push(property);
            return acc;
          }, {} as { [key: string]: typeof properties })
        ).map(([type, typeProperties]) => (
          <div key={type} id={`section-${type}`} className="mb-16">
            <h3 className="text-2xl font-light mb-8">
              {propertyTypeLabels[type] || type}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {typeProperties.map((property) => (
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
                      className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{
                        backgroundColor: agency?.primary_color || '#000000',
                      }}
                    >
                      {property.property_offer_type === 'VENTE' ? 'À Vendre' : 'À Louer'}
                    </div>
                    <div 
                      className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: agency?.primary_color || '#000000',
                        color: 'white',
                      }}
                    >
                      {propertyTypeLabels[property.property_type] || property.property_type}
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
        ))}
      </div>

      {/* Auth Drawer */}
      <AuthDrawer 
        open={isAuthOpen} 
        onOpenChange={setIsAuthOpen}
      />
    </div>
  );
}
