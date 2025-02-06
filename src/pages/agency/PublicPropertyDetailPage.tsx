import React, { useEffect, useState } from "react";
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

  // Fetch similar properties
  const { data: similarProperties } = useQuery({
    queryKey: ["similar-properties", property?.property_type, property?.region_id],
    enabled: !!property,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("property_type", property?.property_type)
        .eq("region_id", property?.region_id)
        .neq("id", propertyId)
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

  const handleBack = () => {
    navigate(`/${agencySlug}`);
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
          <Carousel className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {property.photos?.map((photo: string, index: number) => (
                <CarouselItem key={index}>
                  <Dialog>
                    <DialogTrigger>
                      <img
                        src={photo}
                        alt={`Property ${index + 1}`}
                        className="w-full h-[500px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-primary">{property.title}</h1>
            <p className="text-2xl font-semibold">{property.price.toLocaleString()} FCFA</p>
            
            <div className="space-y-2">
              <p className="text-muted-foreground">{property.address}</p>
              <p className="text-muted-foreground">{property.city}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-accent rounded-lg">
                <p className="font-semibold">{property.bedrooms}</p>
                <p className="text-sm text-muted-foreground">Chambres</p>
              </div>
              <div className="p-4 bg-accent rounded-lg">
                <p className="font-semibold">{property.bathrooms}</p>
                <p className="text-sm text-muted-foreground">Salles de bain</p>
              </div>
              <div className="p-4 bg-accent rounded-lg">
                <p className="font-semibold">{property.surface_area} m²</p>
                <p className="text-sm text-muted-foreground">Surface</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Description</h2>
            <p className="text-muted-foreground">{property.description}</p>

            <div>
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
          </div>
        </div>

        <Separator className="my-12" />

        {/* Similar Properties Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-8">Autres suggestions</h2>
          
          {similarProperties && similarProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <img
                    src={prop.photos?.[0]}
                    alt={prop.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{prop.title}</h3>
                    <p className="text-primary font-semibold">
                      {prop.price.toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-lg text-muted-foreground italic">
              Merci de bien reconsidérer cette offre car elle est unique dans cette ville
            </p>
          )}
        </div>
      </div>
    </div>
  );
}