import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function PublicPropertyDetailPage() {
  const navigate = useNavigate();
  const { agencySlug, propertyId } = useParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch property details
  const { data: property } = useQuery({
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
  });

  // Fetch similar properties with enhanced similarity criteria
  const { data: similarProperties } = useQuery({
    queryKey: ["similar-properties", property?.property_type, property?.price, property?.bedrooms, property?.region],
    enabled: !!property,
    queryFn: async () => {
      // Calculate price range (±20% of the current property's price)
      const minPrice = property.price * 0.8;
      const maxPrice = property.price * 1.2;

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("property_type", property.property_type)
        .eq("agency_id", property.agency_id)
        .neq("id", propertyId)
        .eq("is_available", true)
        .or(
          `and(price.gte.${minPrice},price.lte.${maxPrice}),and(bedrooms.eq.${property.bedrooms}),and(region.eq.${property.region})`
        )
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  const handleBack = () => {
    navigate(`/${agencySlug}`);
  };

  const handleSimilarPropertyClick = (propertyId: string) => {
    navigate(`/${agencySlug}/properties/${propertyId}/public`);
  };

  if (!property) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <Button
        variant="ghost"
        className="m-4"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <div className="container mx-auto px-4 py-8">
        {/* Image Carousel */}
        <div className="mb-8">
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {property.photos?.map((photo: string, index: number) => (
                <CarouselItem key={index}>
                  <Dialog>
                    <DialogTrigger>
                      <img
                        src={photo}
                        alt={`Property ${index + 1}`}
                        className="w-full h-[600px] object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
                        onClick={() => setSelectedImage(photo)}
                      />
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl">
                      <img
                        src={selectedImage || ""}
                        alt="Enlarged view"
                        className="w-full h-auto"
                      />
                    </DialogContent>
                  </Dialog>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-5xl mx-auto">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-primary">{property.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-lg">
                {property.price.toLocaleString()} FCFA
              </Badge>
              <Badge variant="outline" className="text-lg">
                {property.property_type}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-lg text-muted-foreground">
                {property.region && `${property.region}, `}{property.city}
              </p>
              <p className="text-muted-foreground">{property.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-accent rounded-lg text-center">
                <p className="font-semibold text-xl">{property.bedrooms}</p>
                <p className="text-sm text-muted-foreground">Pièces</p>
              </div>
              <div className="p-4 bg-accent rounded-lg text-center">
                <p className="font-semibold text-xl">{property.surface_area} m²</p>
                <p className="text-sm text-muted-foreground">Surface</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{property.description}</p>
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Caractéristiques</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {property.amenities?.map((amenity: string, index: number) => (
                    <li key={index} className="flex items-center text-muted-foreground">
                      <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-12 max-w-5xl mx-auto" />

        {/* Similar Properties Section */}
        {similarProperties && similarProperties.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-semibold mb-8">Biens similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => handleSimilarPropertyClick(prop.id)}
                >
                  <img
                    src={prop.photos?.[0]}
                    alt={prop.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{prop.title}</h3>
                    <p className="text-primary font-semibold mb-2">
                      {prop.price.toLocaleString()} FCFA
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>{prop.bedrooms} pièces</span>
                      <span>•</span>
                      <span>{prop.surface_area} m²</span>
                      <span>•</span>
                      <span>{prop.region}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}