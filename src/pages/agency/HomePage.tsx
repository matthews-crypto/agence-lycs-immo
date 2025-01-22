import { useAgencyContext } from "@/contexts/AgencyContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { House, MapPin, User } from "lucide-react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useState } from "react";
import { AuthDrawer } from "@/components/agency/AuthDrawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AgencyHomePage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { data: properties, isLoading } = useQuery({
    queryKey: ["agency-properties", agency?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("agency_id", agency?.id)
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!agency?.id,
  });

  // Get unique cities from properties
  const cities = [...new Set(properties?.map(p => p.city).filter(Boolean))];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex-1" />
          <div className="flex-1 flex justify-center">
            {agency?.logo_url ? (
              <img 
                src={agency.logo_url} 
                alt={agency.agency_name}
                className="h-16 object-contain"
              />
            ) : (
              <h1 
                className="text-2xl font-light"
                style={{ color: agency?.primary_color }}
              >
                {agency?.agency_name}
              </h1>
            )}
          </div>
          <div className="flex-1 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAuthOpen(true)}
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Carousel */}
      <div className="relative h-[60vh] bg-gray-100">
        <Carousel className="h-full" opts={{ loop: true }}>
          <CarouselContent className="h-full">
            {properties?.slice(0, 3).map((property) => (
              <CarouselItem key={property.id} className="h-full">
                <div className="relative h-full">
                  {property.photos?.[0] ? (
                    <img
                      src={property.photos[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <House className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8">
                    <h2 className="text-white text-2xl font-light">
                      {property.title}
                    </h2>
                    <p className="text-white/80 mt-2">
                      {property.city} - {property.property_type}, {property.bedrooms} chambres
                    </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Search Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4">
          <div className="bg-white rounded-lg shadow-lg p-4 flex gap-4">
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-4 flex-1">
              <input
                type="number"
                placeholder="Budget min"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="Budget max"
                className="flex-1 px-3 py-2 border rounded-md"
              />
            </div>

            <Button 
              className="px-8"
              style={{
                backgroundColor: agency?.primary_color || '#000000',
              }}
            >
              Rechercher
            </Button>
          </div>
        </div>
      </div>

      {/* Properties Carousel */}
      <div className="py-24 container mx-auto px-4">
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
          >
            <CarouselContent>
              {properties?.map((property) => (
                <CarouselItem key={property.id} className="md:basis-1/2 lg:basis-1/3">
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => navigate(`/${agency?.slug}/properties/${property.id}`)}
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
                          <House className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <h3 className="text-xl font-light">{property.title}</h3>
                      <div className="flex items-center gap-2 text-gray-600 mt-2">
                        <MapPin className="w-4 h-4" />
                        <p className="text-sm">{property.city}</p>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-lg">
                          {property.price.toLocaleString('fr-FR')} €
                        </p>
                        <p className="text-sm text-gray-600">
                          {property.surface_area} m² • {property.bedrooms} ch.
                        </p>
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

      {/* Auth Drawer */}
      <AuthDrawer 
        open={isAuthOpen} 
        onOpenChange={setIsAuthOpen}
      />
    </div>
  );
}