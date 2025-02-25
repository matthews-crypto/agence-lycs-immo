
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, StarIcon } from "lucide-react";
import PropertyMap from "@/components/PropertyMap";
import PropertyHeader from "@/components/property/PropertyHeader";
import PropertyImageGallery from "@/components/property/PropertyImageGallery";
import PropertyStats from "@/components/property/PropertyStats";
import SimilarProperties from "@/components/property/SimilarProperties";
import PropertyMetaTags from "@/components/property/PropertyMetaTags";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function PublicPropertyDetailPage() {
  const navigate = useNavigate();
  const { agencySlug, propertyId } = useParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  const { data: property } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          agencies(*),
          zone (
            id,
            nom,
            latitude,
            longitude,
            circle_radius
          )
        `)
        .eq("id", propertyId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: similarProperties } = useQuery({
    queryKey: ["similar-properties", property?.property_type, property?.price, property?.zone?.id, property?.property_offer_type],
    enabled: !!property,
    queryFn: async () => {
      const minPrice = property.price * 0.8;
      const maxPrice = property.price * 1.2;

      const query = supabase
        .from("properties")
        .select("*")
        .eq("property_type", property.property_type)
        .eq("property_offer_type", property.property_offer_type)
        .eq("agency_id", property.agency_id)
        .eq("zone_id", property.zone?.id)
        .neq("id", propertyId)
        .eq("is_available", true);

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

  const getPropertyConditionLabel = (condition: string) => {
    switch (condition) {
      case "VEFA":
        return "Vente en l'État Futur d'Achèvement";
      case "NEUF":
        return "Neuf";
      case "RENOVE":
        return "Rénové";
      case "USAGE":
        return "Usage";
      default:
        return condition;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PropertyMetaTags
        title={property.title}
        description={property.description || ""}
        price={property.price}
        photos={property.photos}
      />

      <PropertyHeader
        onBack={handleBack}
        agencyLogo={property.agencies?.logo_url}
        agencyName={property.agencies?.agency_name}
        primaryColor={property.agencies?.primary_color}
      />

      <div className="container mx-auto px-4 py-6">
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
          <Badge 
            className="text-sm text-white"
            style={{ backgroundColor: property.agencies?.primary_color || '#0066FF' }}
          >
            {property.property_offer_type === 'VENTE' ? 'À Vendre' : 'À Louer'}
          </Badge>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
        <p className="text-gray-600 mb-6">
          {property.zone?.nom}
        </p>

        {property.property_condition && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <StarIcon className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">État du bien :</span>
                  <span>{getPropertyConditionLabel(property.property_condition)}</span>
                </div>
                {property.property_condition === "VEFA" && property.vefa_availability_date && (
                  <div className="text-gray-600">
                    Date de disponibilité : {format(new Date(property.vefa_availability_date), 'dd MMMM yyyy', { locale: fr })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <PropertyImageGallery
              images={property.photos || []}
              title={property.title}
              onImageClick={handleImageClick}
            />
          </div>

          <div className="h-[300px]">
            <PropertyMap 
              latitude={property.zone?.latitude || null} 
              longitude={property.zone?.longitude || null}
              radius={property.zone?.circle_radius || 5000}
            />
          </div>
        </div>

        <PropertyStats
          price={property.price}
          bedrooms={property.bedrooms}
          surfaceArea={property.surface_area}
        />

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Description</h2>
          <p className="text-gray-600 leading-relaxed">{property.description}</p>
        </div>

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

        {similarProperties && similarProperties.length > 0 && (
          <SimilarProperties
            properties={similarProperties.map(prop => ({
              id: prop.id,
              title: prop.title,
              photos: prop.photos || [],
              price: prop.price,
              bedrooms: prop.bedrooms,
              surfaceArea: prop.surface_area,
              region: prop.region,
              propertyOfferType: prop.property_offer_type,
              onClick: handleSimilarPropertyClick
            }))}
            agencyPrimaryColor={property.agencies?.primary_color}
          />
        )}
      </div>

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

