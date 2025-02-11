
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import PropertyMap from "@/components/PropertyMap";
import PropertyHeader from "@/components/property/PropertyHeader";
import PropertyImageGallery from "@/components/property/PropertyImageGallery";
import PropertyStats from "@/components/property/PropertyStats";
import SimilarProperties from "@/components/property/SimilarProperties";
import { getAbsoluteUrl } from "@/utils/urlUtils";

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
        .select("*, agencies(*)")
        .eq("id", propertyId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (property) {
      const head = document.head;

      // Fonction pour mettre à jour un meta tag
      const updateMetaTag = (property: string, content: string) => {
        const meta = head.querySelector(`meta[property="${property}"]`) ||
                    head.querySelector(`meta[name="${property}"]`);
        if (meta) {
          meta.setAttribute('content', content);
        }
      };

      // Mise à jour des meta tags
      updateMetaTag('og:title', `${property.title} | LYCS Immobilier`);
      updateMetaTag('og:description', property.description?.substring(0, 160) || '');
      updateMetaTag('og:image', property.photos?.[0] ? getAbsoluteUrl(property.photos[0]) : '');
      updateMetaTag('og:url', window.location.href);
      updateMetaTag('og:price:amount', property.price?.toString() || '0');
      updateMetaTag('og:image:secure_url', property.photos?.[0] ? getAbsoluteUrl(property.photos[0]) : '');
      updateMetaTag('twitter:title', `${property.title} | LYCS Immobilier`);
      updateMetaTag('twitter:description', property.description?.substring(0, 160) || '');
      updateMetaTag('twitter:image', property.photos?.[0] ? getAbsoluteUrl(property.photos[0]) : '');

      // Mise à jour du titre
      document.title = `${property.title} | LYCS Immobilier`;

      // Log pour debug
      console.log('Meta tags updated:', {
        title: property.title,
        description: property.description,
        image: property.photos?.[0] ? getAbsoluteUrl(property.photos[0]) : '',
        url: window.location.href,
        price: property.price
      });

      // Nettoyage au démontage du composant
      return () => {
        document.title = 'LYCS Immobilier';
        updateMetaTag('og:title', 'LYCS Immobilier');
        updateMetaTag('og:description', 'Découvrez nos biens immobiliers de qualité');
        updateMetaTag('og:image', 'https://preview--agence-lycs-immo.lovable.app/og-image.png');
        updateMetaTag('og:url', 'https://preview--agence-lycs-immo.lovable.app');
        updateMetaTag('og:price:amount', '0');
        updateMetaTag('twitter:title', 'LYCS Immobilier');
        updateMetaTag('twitter:description', 'Découvrez nos biens immobiliers de qualité');
        updateMetaTag('twitter:image', 'https://preview--agence-lycs-immo.lovable.app/og-image.png');
      };
    }
  }, [property]);

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
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
        <p className="text-gray-600 mb-6">
          {property.region && `${property.region}, `}{property.city}
        </p>

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
              latitude={property.location_lat} 
              longitude={property.location_lng}
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
