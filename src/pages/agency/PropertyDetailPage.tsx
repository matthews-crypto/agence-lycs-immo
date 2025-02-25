import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bath, BedDouble, Home, Ruler, Calendar } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import ModifyPropertyDialog from "@/components/agency/properties/ModifyProperty.tsx";

export default function AgencyPropertyDetailPage() {
  const { propertyId, agencySlug } = useParams();
  const navigate = useNavigate();
  const { agency } = useAgencyContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [api, setApi] = useState<any>();

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
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
    enabled: !!propertyId,
  });

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Propriété non trouvée</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/${agencySlug}/properties`)}
          className="mb-4"
          style={{ color: agency?.primary_color }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux offres
        </Button>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
          <div className="align-text-bottom space-x-2">
            <Button
              onClick={() => setIsDialogOpen(true)}
              style={{
                backgroundColor: agency?.secondary_color,
                color: "white",
              }}
            >
              Modifier Offre
            </Button>
            <Button
              onClick={() => navigate(`/${agencySlug}/properties/${propertyId}/images`)}
              style={{
                backgroundColor: agency?.primary_color,
                color: "white",
              }}
            >
              Gérer les images
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-lg">{property.zone?.nom}</p>
      </div>

      <div className="mb-8 relative rounded-lg overflow-hidden">
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
                    className="relative aspect-[16/9] cursor-pointer"
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
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

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

      {property.reference_number && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Référence</h2>
              <span className="text-muted-foreground">{property.reference_number}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <Badge
                  variant="secondary"
                  className="text-lg px-4 py-2"
                  style={{
                    backgroundColor: agency?.primary_color,
                    color: "white",
                  }}
                >
                  {property.price.toLocaleString()} FCFA
                </Badge>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {property.property_type}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-lg px-4 py-2"
                  style={{ borderColor: agency?.secondary_color }}
                >
                  {property.property_status}
                </Badge>
              </div>

              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                <p className="text-muted-foreground">{property.description}</p>
                {property.detailed_description && (
                  <p className="text-muted-foreground mt-4">
                    {property.detailed_description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Caractéristiques</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {property.bedrooms && (
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-5 w-5 text-muted-foreground" />
                    <span>
                      {property.bedrooms} pièce{property.bedrooms > 1 && "s"}
                    </span>
                  </div>
                )}
                {property.surface_area && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-muted-foreground" />
                    <span>{property.surface_area} m²</span>
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
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Informations supplémentaires</h2>
                <div className="space-y-2">
                  {property.reference_number && (
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">Référence:</strong>
                      <span className="text-muted-foreground">{property.reference_number}</span>
                    </div>
                  )}
                  {property.property_condition && (
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">État du bien:</strong>
                      <span className="text-muted-foreground">
                        {property.property_condition === "VEFA" && "Vente en l'État Futur d'Achèvement"}
                        {property.property_condition === "NEUF" && "Neuf"}
                        {property.property_condition === "RENOVE" && "Rénové"}
                        {property.property_condition === "USAGE" && "Usage"}
                      </span>
                    </div>
                  )}
                  {property.property_condition === "VEFA" && property.vefa_availability_date && (
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">Date de disponibilité:</strong>
                      <span className="text-muted-foreground">
                        {format(new Date(property.vefa_availability_date), "dd MMMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Localisation</h2>
              <div className="space-y-2">
                {property.region && (
                  <p className="text-muted-foreground">Région de {property.region}</p>
                )}
                {property.zone?.nom && property.address && property.postal_code && (
                  <p className="text-muted-foreground">
                    {property.zone.nom}, {property.address}, {property.postal_code}
                  </p>
                )}
                {property.zone?.latitude && property.zone?.longitude && (
                  <p className="text-muted-foreground text-black">
                    <strong>Coordonnées GPS</strong>: {property.zone.latitude}, {property.zone.longitude}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Informations supplémentaires
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ajouté le{" "}
                  {format(new Date(property.created_at), "Pp", {
                    locale: fr,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ModifyPropertyDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          propertyId={propertyId}
      />
    </div>
  );
}
