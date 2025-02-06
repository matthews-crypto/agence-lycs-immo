import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PublicPropertyDetailPage() {
  const navigate = useNavigate();
  const { agencySlug, propertyId } = useParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

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

      let query = supabase
        .from("properties")
        .select("*")
        .eq("property_type", property.property_type)
        .eq("agency_id", property.agency_id)
        .neq("id", propertyId)
        .eq("is_available", true);

      // Handle the OR conditions properly
      if (property.bedrooms === null) {
        query = query.or(`price.gte.${minPrice},price.lte.${maxPrice},bedrooms.is.null,region.eq.${property.region}`);
      } else {
        query = query.or(`price.gte.${minPrice},price.lte.${maxPrice},bedrooms.eq.${property.bedrooms},region.eq.${property.region}`);
      }

      const { data, error } = await query.limit(6);

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

  const handleImageClick = (imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
  };

  const handleNextImage = () => {
    if (property?.photos) {
      setCurrentImageIndex((prev) => 
        prev === property.photos.length - 1 ? 0 : prev + 1
      );
      setSelectedImage(property.photos[currentImageIndex + 1] || property.photos[0]);
    }
  };

  const handlePrevImage = () => {
    if (property?.photos) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.photos.length - 1 : prev - 1
      );
      setSelectedImage(property.photos[currentImageIndex - 1] || property.photos[property.photos.length - 1]);
    }
  };

  if (!property) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <div 
        className="w-full h-16 flex items-center px-4 relative"
        style={{ backgroundColor: property.agencies?.primary_color || '#9b87f5' }}
      >
        <Button
          variant="ghost"
          className="absolute left-4 text-white hover:text-white/80"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex-1 flex justify-center items-center">
          {property.agencies?.logo_url ? (
            <img 
              src={property.agencies.logo_url} 
              alt={property.agencies.agency_name} 
              className="h-10 object-contain"
            />
          ) : (
            <span className="text-white text-lg font-semibold">
              {property.agencies?.agency_name}
            </span>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Property Title and Status */}
        <div className="mb-6">
          <div className="flex gap-2 mb-2">
            <Badge variant="secondary">{property.property_type}</Badge>
            <Badge 
              style={{
                backgroundColor: property.agencies?.primary_color || '#9b87f5',
                color: 'white'
              }}
            >
              {property.property_status}
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-primary">{property.title}</h1>
          <p className="text-lg text-muted-foreground mt-2">
            {property.region && `${property.region}, `}{property.city}
          </p>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <div className="col-span-2 relative">
              <div 
                className="cursor-pointer"
                onClick={() => property.photos && handleImageClick(property.photos[0], 0)}
              >
                <img
                  src={property.photos?.[0]}
                  alt={property.title}
                  className="w-full aspect-[16/9] object-cover rounded-lg"
                />
                {property.photos && property.photos.length > 1 && property.photos.length <= 4 && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full flex items-center">
                    <Plus className="h-4 w-4 mr-1" />
                    {property.photos.length - 1}
                  </div>
                )}
              </div>
            </div>
            {property.photos && property.photos.length >= 5 && (
              property.photos.slice(1, 5).map((photo: string, index: number) => (
                <div 
                  key={index}
                  className="cursor-pointer"
                  onClick={() => handleImageClick(photo, index + 1)}
                >
                  <img
                    src={photo}
                    alt={`${property.title} ${index + 2}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))
            )}
            <DialogContent className="max-w-5xl max-h-[90vh]">
              <div className="relative">
                {selectedImage && (
                  <>
                    <img
                      src={selectedImage}
                      alt={property.title}
                      className="w-full h-auto"
                    />
                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full">
                      {currentImageIndex + 1}/{property.photos?.length}
                    </div>
                    <Button
                      variant="ghost"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
                      onClick={handlePrevImage}
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white rotate-180"
                      onClick={handleNextImage}
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-lg">
                {property.price.toLocaleString()} FCFA
              </Badge>
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