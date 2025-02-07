
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
import PropertyMap from "@/components/PropertyMap";

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

  // Fetch similar properties
  const { data: similarProperties } = useQuery({
    queryKey: ["similar-properties", property?.property_type, property?.price, property?.bedrooms, property?.region],
    enabled: !!property,
    queryFn: async () => {
      const minPrice = property.price * 0.8;
      const maxPrice = property.price * 1.2;

      let query = supabase
        .from("properties")
        .select("*")
        .eq("property_type", property.property_type)
        .eq("agency_id", property.agency_id)
        .neq("id", propertyId)
        .eq("is_available", true);

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
        style={{ backgroundColor: property.agencies?.primary_color || '#0066FF' }}
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

      <div className="container mx-auto px-4 py-6">
        {/* Property Type and Status Badges */}
        <div className="flex gap-2 mb-4">
          <Badge variant="secondary" className="text-sm">
            {property.property_type}
          </Badge>
          <Badge 
            className="text-sm text-white"
            style={{ backgroundColor: property.agencies?.primary_color || '#0066FF' }}
          >
            {property.property_status}
          </Badge>
        </div>

        {/* Property Title and Location */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
        <p className="text-gray-600 mb-6">
          {property.region && `${property.region}, `}{property.city}
        </p>

        {/* Image Gallery and Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Image Gallery */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {property.photos && property.photos.length > 0 && (
                <>
                  <div className="col-span-full relative">
                    <img
                      src={property.photos[0]}
                      alt={property.title}
                      className="w-full aspect-[16/9] object-cover rounded-lg cursor-pointer"
                      onClick={() => handleImageClick(property.photos[0], 0)}
                    />
                    {property.photos.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full flex items-center">
                        <Plus className="h-4 w-4 mr-1" />
                        {property.photos.length - 1}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="h-[300px]">
            <PropertyMap 
              latitude={property.location_lat} 
              longitude={property.location_lng}
            />
          </div>
        </div>

        {/* Main Info Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-900">
              {property.price.toLocaleString()} FCFA
            </p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-900">
              {property.bedrooms} Pièces
            </p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-900">
              {property.surface_area} m²
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Description</h2>
          <p className="text-gray-600 leading-relaxed">{property.description}</p>
        </div>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Équipements</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.amenities.map((amenity, index) => (
                <div key={index} className="bg-gray-100 p-4 rounded-lg">
                  {amenity}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Properties */}
        {similarProperties && similarProperties.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Biens Similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => handleSimilarPropertyClick(prop.id)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <img
                    src={prop.photos?.[0]}
                    alt={prop.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{prop.title}</h3>
                    <div className="flex justify-between items-center text-gray-600 mb-2">
                      <span>{prop.price.toLocaleString()} FCFA</span>
                      <span>•</span>
                      <span>{prop.bedrooms} Pièces</span>
                      <span>•</span>
                      <span>{prop.surface_area} m²</span>
                    </div>
                    <p style={{ color: property.agencies?.primary_color }}>{prop.region}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Gallery Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          {selectedImage && (
            <div className="relative">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
