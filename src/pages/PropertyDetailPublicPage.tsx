import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bath, BedDouble, Home, Ruler, MapPin, Phone, Mail } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";

export default function PropertyDetailPublicPage() {
  const { propertyId, agencySlug } = useParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [api, setApi] = useState<any>();

  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, agencies(*)")
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
    enabled: !!property,
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

  if (propertyLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-96 bg-gray-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold">Propriété non trouvée</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Carousel Section */}
        <div className="mb-8 relative rounded-xl overflow-hidden shadow-2xl">
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
                      className="relative aspect-[16/9] cursor-pointer transition-transform hover:scale-[1.02]"
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
                  <div className="relative aspect-[16/9] bg-muted flex items-center justify-center rounded-lg">
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">{property.title}</h1>
              <div className="flex flex-wrap gap-3 mb-6">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {property.price.toLocaleString()} FCFA
                </Badge>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {property.property_type}
                </Badge>
              </div>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                <p className="text-gray-600 leading-relaxed">
                  {property.description}
                </p>
                {property.detailed_description && (
                  <p className="text-gray-600 leading-relaxed mt-4">
                    {property.detailed_description}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Caractéristiques</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {property.bedrooms && (
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-5 w-5 text-gray-500" />
                      <span>{property.bedrooms} chambre{property.bedrooms > 1 && "s"}</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-2">
                      <Bath className="h-5 w-5 text-gray-500" />
                      <span>{property.bathrooms} salle{property.bathrooms > 1 && "s"} de bain</span>
                    </div>
                  )}
                  {property.surface_area && (
                    <div className="flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-gray-500" />
                      <span>{property.surface_area} m²</span>
                    </div>
                  )}
                  {property.year_built && (
                    <div className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-gray-500" />
                      <span>Construit en {property.year_built}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {property.amenities && property.amenities.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-6">Équipements</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span>• {amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Contact & Location */}
          <div className="space-y-6">
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Localisation</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                    <div>
                      <p className="text-gray-600">{property.address}</p>
                      <p className="text-gray-600">{property.city}, {property.postal_code}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Contact Agence</h2>
                <div className="space-y-4">
                  {property.agencies?.contact_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <a href={`tel:${property.agencies.contact_phone}`} className="text-blue-600 hover:underline">
                        {property.agencies.contact_phone}
                      </a>
                    </div>
                  )}
                  {property.agencies?.contact_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <a href={`mailto:${property.agencies.contact_email}`} className="text-blue-600 hover:underline">
                        {property.agencies.contact_email}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Properties Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8">Autres suggestions</h2>
          {similarProperties && similarProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {similarProperties.map((prop) => (
                <Card key={prop.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[16/9] relative">
                    <img
                      src={prop.photos?.[0] || "/placeholder.svg"}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{prop.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{prop.description}</p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">
                        {prop.price.toLocaleString()} FCFA
                      </Badge>
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = `/${agencySlug}/properties/${prop.id}`}
                      >
                        Voir les détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center bg-gradient-to-r from-purple-50 to-pink-50">
              <p className="text-xl text-gray-700 italic">
                "Merci de bien reconsidérer cette offre car elle est unique dans cette ville"
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}