
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PropertyCardProps {
  id: string;
  title: string;
  photos: string[];
  price: number;
  bedrooms: number;
  surfaceArea: number;
  propertyOfferType: string;
  agencySlug: string;
  primaryColor?: string;
  onClick: (id: string) => void;
}

interface PropertyCategorySectionProps {
  title: string;
  properties: PropertyCardProps[];
  agencyPrimaryColor?: string;
}

export default function PropertyCategorySection({
  title,
  properties,
  agencyPrimaryColor = '#0066FF'
}: PropertyCategorySectionProps) {
  if (!properties || properties.length === 0) return null;

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Card
            key={property.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => property.onClick(property.id)}
          >
            <div className="relative">
              <img
                src={property.photos?.[0] || '/placeholder.svg'}
                alt={property.title}
                className="w-full h-48 object-cover"
              />
              <Badge 
                className="absolute top-4 right-4 text-white"
                style={{ backgroundColor: agencyPrimaryColor }}
              >
                {property.propertyOfferType === 'VENTE' ? 'À Vendre' : 'À Louer'}
              </Badge>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-2 line-clamp-1">{property.title}</h3>
              <div className="flex justify-between items-center text-gray-600 mb-2">
                <span>{property.price.toLocaleString()} FCFA</span>
                <span>•</span>
                <span>{property.bedrooms} Pièces</span>
                <span>•</span>
                <span>{property.surfaceArea} m²</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
