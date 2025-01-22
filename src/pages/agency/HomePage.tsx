import { useAgencyContext } from "@/contexts/AgencyContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { House, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

  const handleLogin = () => {
    if (session && agency?.user_id === session.user.id) {
      navigate(`/${agency.slug}/agency/dashboard`);
    } else {
      navigate(`/${agency?.slug}/auth`);
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: agency?.primary_color || '#ffffff',
        color: agency?.secondary_color || '#000000'
      }}
    >
      <div className="container mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            {agency?.logo_url && (
              <img 
                src={agency.logo_url} 
                alt={agency.agency_name} 
                className="h-16 object-contain"
              />
            )}
            <h1 className="text-3xl font-light">
              Nos biens d'exception
            </h1>
          </div>
          <Button 
            onClick={handleLogin}
            variant="outline"
            className="px-6"
            style={{
              borderColor: agency?.secondary_color || '#000000',
              color: agency?.secondary_color || '#000000'
            }}
          >
            {session && agency?.user_id === session.user.id ? 'Accéder au tableau de bord' : 'Se connecter'}
          </Button>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-[300px] w-full" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties?.map((property) => (
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
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <House className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}