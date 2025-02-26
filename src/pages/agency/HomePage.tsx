
import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PropertyCarousel from "@/components/property/PropertyCarousel";
import PropertyCategorySection from "@/components/property/PropertyCategorySection";
import { useNavigate } from "react-router-dom";

export default function AgencyHomePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: agency } = useQuery({
    queryKey: ["agency", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: properties } = useQuery({
    queryKey: ["agency-properties", agency?.id],
    enabled: !!agency?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          zone (
            id,
            nom
          )
        `)
        .eq("agency_id", agency?.id)
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/${slug}/properties/${propertyId}/public`);
  };

  // Organize properties by type
  const propertiesByType = React.useMemo(() => {
    if (!properties) return {};
    
    return properties.reduce((acc: { [key: string]: any[] }, property) => {
      const type = property.property_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(property);
      return acc;
    }, {});
  }, [properties]);

  // Select featured properties for the carousel
  const featuredProperties = properties?.slice(0, 5) || [];

  return (
    <div>
      <div className="relative bg-background">
        <div className="container mx-auto py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{agency?.agency_name}</h1>
              <div className="flex gap-4">
                {agency?.city && (
                  <Badge variant="outline">
                    {agency.city}
                  </Badge>
                )}
                {agency?.license_number && (
                  <Badge variant="outline">
                    License: {agency.license_number}
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              onClick={() => navigate(`/${slug}/properties`)}
              style={{ backgroundColor: agency?.primary_color }}
              className="text-white"
            >
              Voir toutes les propriétés
            </Button>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Notre sélection d'annonces immobilières</h2>
            <PropertyCarousel
              properties={featuredProperties.map(prop => ({
                id: prop.id,
                title: prop.title,
                photos: prop.photos || [],
                price: prop.price,
                bedrooms: prop.bedrooms,
                surfaceArea: prop.surface_area,
                region: prop.zone?.nom,
                propertyOfferType: prop.property_offer_type,
                onClick: handlePropertyClick
              }))}
              agencyPrimaryColor={agency?.primary_color}
            />
          </div>

          {/* Property sections by type */}
          {Object.entries(propertiesByType).map(([type, typeProperties]) => (
            <PropertyCategorySection
              key={type}
              title={type}
              properties={typeProperties.map(prop => ({
                id: prop.id,
                title: prop.title,
                photos: prop.photos || [],
                price: prop.price,
                bedrooms: prop.bedrooms,
                surfaceArea: prop.surface_area,
                propertyOfferType: prop.property_offer_type,
                agencySlug: slug || '',
                primaryColor: agency?.primary_color,
                onClick: handlePropertyClick
              }))}
              agencyPrimaryColor={agency?.primary_color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
