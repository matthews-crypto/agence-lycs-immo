import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bath, BedDouble, Home, Ruler, Calendar, MapPin } from "lucide-react";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AgencyPropertyDetailPage() {
  const { propertyId, agencySlug } = useParams();
  const navigate = useNavigate();
  const { agency } = useAgencyContext();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [api, setApi] = useState<any>();

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

  const { data: similarProperties } = useQuery({
    queryKey: ["similar-properties", property?.property_type, property?.region_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("property_type", property?.property_type)
        .eq("region_id", property?.region_id)
        .neq("id", propertyId)
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!property?.property_type && !!property?.region_id,
  });

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/${agencySlug}/properties`)}
            className="mb-4"
            style={{ color: agency?.primary_color }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux biens
          </Button>
          <h1 className="text-4xl font-bold mb-2 text-foreground/90">{property.title}</h1>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            <p className="text-lg">{property.city}</p>
          </div>
        </div>

        {/* Carousel */}
        <div className="mb-8 relative rounded-lg overflow-hidden shadow-xl">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent>
              {property.photos?.length > 0 ? (
                property.photos.map((photo, index) => (
                  <CarouselItem key={index}>
                    <div 
                      className="relative aspect-video cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => setSelectedImage(photo)}
                    >
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
                  <div className="relative aspect-video bg-muted flex items-center justify-center rounded-lg">
                    <Home className="h-20 w-20 text-muted-foreground" />
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>

        {/* Image Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Property"
                className="w-full h-full object-contain"
              />
            )}
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-8">
            <Card className="overflow-hidden border-none shadow-lg">
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
                  <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                  {property.detailed_description && (
                    <p className="text-muted-foreground mt-4 leading-relaxed">
                      {property.detailed_description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="overflow-hidden border-none shadow-lg">
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
              <Card className="overflow-hidden border-none shadow-lg">
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
            <Card className="overflow-hidden border-none shadow-lg">
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

            <Card className="overflow-hidden border-none shadow-lg">
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

        {/* Similar Properties Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8">Autres suggestions</h2>
          {similarProperties && similarProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProperties.map((similarProperty) => (
                <Card 
                  key={similarProperty.id} 
                  className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => navigate(`/${agencySlug}/properties/${similarProperty.id}`)}
                >
                  <div 
                    className="h-48 bg-cover bg-center"
                    style={{
                      backgroundImage: similarProperty.photos?.length 
                        ? `url(${similarProperty.photos[0]})` 
                        : "url(/placeholder.svg)"
                    }}
                  />
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1">{similarProperty.title}</h3>
                    <p className="text-muted-foreground mb-2">{similarProperty.city}</p>
                    <p className="font-medium">{similarProperty.price.toLocaleString()} FCFA</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                Merci de bien reconsidérer cette offre car elle est unique dans cette ville.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}