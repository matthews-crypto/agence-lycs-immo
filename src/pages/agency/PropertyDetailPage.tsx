import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bath, BedDouble, Home, Ruler, Calendar } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgencyPropertyDetailPage() {
  const { propertyId, slug } = useParams();
  const navigate = useNavigate();
  const { agency } = useAgencyContext();

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!propertyId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Propriété non trouvée</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/${slug}/properties`)}
          className="mb-4"
          style={{ color: agency?.primary_color }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux biens
        </Button>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
          <Button
            onClick={() => navigate(`/${slug}/properties/${propertyId}/images`)}
            style={{
              backgroundColor: agency?.primary_color,
              color: "white",
            }}
          >
            Gérer les images
          </Button>
        </div>
        <p className="text-muted-foreground text-lg">{property.city}</p>
      </div>

      {/* Carousel */}
      <div className="mb-8 relative rounded-lg overflow-hidden">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {property.photos?.length > 0 ? (
              property.photos.map((photo, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-[16/9]">
                    <img
                      src={photo}
                      alt={`${property.title} - Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem>
                <div className="relative aspect-[16/9] bg-muted flex items-center justify-center rounded-lg">
                  <Home className="h-20 w-20 text-muted-foreground" />
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <Badge
                  variant="secondary"
                  className="text-lg px-4 py-2"
                  style={{
                    backgroundColor: agency?.primary_color,
                    color: "white",
                  }}
                >
                  {property.price.toLocaleString()} FCFA
                </Badge>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {property.property_type}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-lg px-4 py-2"
                  style={{ borderColor: agency?.secondary_color }}
                >
                  {property.property_status}
                </Badge>
              </div>

              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                <p className="text-muted-foreground">{property.description}</p>
                {property.detailed_description && (
                  <p className="text-muted-foreground mt-4">
                    {property.detailed_description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Caractéristiques</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {property.bedrooms && (
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-5 w-5 text-muted-foreground" />
                    <span>
                      {property.bedrooms} chambre{property.bedrooms > 1 && "s"}
                    </span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <span>
                      {property.bathrooms} salle{property.bathrooms > 1 && "s"} de
                      bain
                    </span>
                  </div>
                )}
                {property.surface_area && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-muted-foreground" />
                    <span>{property.surface_area} m²</span>
                  </div>
                )}
                {property.year_built && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span>Construit en {property.year_built}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Équipements</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Localisation</h2>
              <div className="space-y-2">
                <p className="text-muted-foreground">{property.address}</p>
                <p className="text-muted-foreground">
                  {property.city}, {property.postal_code}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Informations supplémentaires
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ajouté le{" "}
                  {format(new Date(property.created_at), "Pp", {
                    locale: fr,
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Référence: {property.id}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
