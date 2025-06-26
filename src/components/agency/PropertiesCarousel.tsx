import React from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

export function PropertiesCarousel({ properties, propertyTypeLabels, onPropertyClick }: {
  properties: any[];
  propertyTypeLabels: Record<string, string>;
  onPropertyClick: (id: string) => void;
}) {
  if (!properties || properties.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16" id="properties">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-purple-700">Nos biens disponibles</h2>
      <Carousel>
        <CarouselContent>
          {properties.map((property) => (
            <CarouselItem key={property.id} className="p-4">
              <div className="bg-white/90 rounded-3xl shadow-xl overflow-hidden hover:scale-105 hover:shadow-2xl transition-transform duration-300 cursor-pointer" onClick={() => onPropertyClick(property.id)}>
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img src={property.photos?.[0] || '/placeholder.jpg'} alt={property.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-purple-700">{property.title}</h3>
                  <div className="flex flex-wrap gap-2 text-xs mb-2">
                    <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full">{propertyTypeLabels[property.type] || property.type}</span>
                    {property.surface_area && <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full">{property.surface_area} m²</span>}
                    {property.bedrooms && <span className="bg-fuchsia-100 text-fuchsia-600 px-3 py-1 rounded-full">{property.bedrooms} pièces</span>}
                  </div>
                  <div className="text-xl font-bold text-pink-500">{property.price?.toLocaleString('fr-FR')} FCFA</div>
                  <Button className="mt-2 w-full bg-gradient-to-r from-pink-400 to-purple-600 text-white rounded-full">Voir le bien</Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
}
