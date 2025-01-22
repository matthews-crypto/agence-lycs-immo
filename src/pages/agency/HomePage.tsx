import { useAgencyContext } from "@/contexts/AgencyContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { House, MapPin, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AgencyHomePage() {
  const { agency } = useAgencyContext();
  const { session } = useAuth();
  const navigate = useNavigate();

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

  const uniqueCities = [...new Set(properties?.map(property => property.city))].filter(Boolean);

  const handleLogin = () => {
    if (session && agency?.user_id === session.user.id) {
      navigate(`/${agency.slug}/agency/dashboard`);
    } else {
      navigate(`/${agency?.slug}/auth`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Carousel Section */}
      {properties && properties.length > 0 && (
        <div className="w-full h-[80vh] relative mb-16">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full h-full"
          >
            <CarouselContent>
              {properties.slice(0, 3).map((property, index) => (
                <CarouselItem key={index} className="w-full h-full">
                  <div className="relative w-full h-full">
                    {property.photos?.[0] ? (
                      <img
                        src={property.photos[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <House className="w-20 h-20 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute bottom-20 left-20 text-white">
                      <h2 className="text-5xl font-light mb-4">{property.title}</h2>
                      <p className="text-2xl font-light">
                        {property.price.toLocaleString('fr-FR')} €
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-8" />
            <CarouselNext className="right-8" />
          </Carousel>
        </div>
      )}

      {/* Search Section */}
      <div className="container mx-auto px-4 mb-16">
        <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-light">
            Trouvez votre bien d'exception
          </h1>
          <div className="w-full flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Select>
                <SelectTrigger className="w-full h-14 pl-12 text-left">
                  <SelectValue placeholder="Sélectionnez une ville" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="h-14 px-8"
              style={{
                backgroundColor: agency?.primary_color || '#000000',
                color: '#ffffff'
              }}
            >
              Rechercher
            </Button>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-[300px] w-full" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
              </Card>
            ))
          ) : (
            properties?.map((property) => (
              <Card 
                key={property.id} 
                className="overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow duration-300"
                onClick={() => navigate(`/${agency?.slug}/properties/${property.id}`)}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {property.photos?.[0] ? (
                    <img
                      src={property.photos[0]}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <House className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div 
                    className="absolute bottom-0 left-0 right-0 p-6"
                    style={{
                      background: `linear-gradient(to top, ${agency?.primary_color || '#000000'}cc, transparent)`
                    }}
                  >
                    <p className="text-white text-xl font-light">
                      {property.price.toLocaleString('fr-FR')} €
                    </p>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-light mb-3 line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <p className="text-sm">
                      {property.city}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-4 text-sm text-gray-600">
                    {property.surface_area && (
                      <p>{property.surface_area} m²</p>
                    )}
                    {property.bedrooms && (
                      <p>{property.bedrooms} ch.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}