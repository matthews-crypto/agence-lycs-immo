import React from 'react';
import { Link } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, MapPin, Euro } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type ProprietairePropertiesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proprietaireId: number | null;
  proprietaireName: string;
};

type Property = {
  id: string;
  title: string;
  address: string | null;
  price: number;
  property_type: string;
  surface_area: number | null;
  photos: string[] | null;
};

export function ProprietairePropertiesDialog({
  open,
  onOpenChange,
  proprietaireId,
  proprietaireName
}: ProprietairePropertiesDialogProps) {
  const { agency } = useAgencyContext();
  const isMobile = useIsMobile();

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['proprietaire-properties', proprietaireId],
    queryFn: async () => {
      if (!proprietaireId) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          address,
          price,
          property_type,
          surface_area,
          photos
        `)
        .eq('proprio', proprietaireId);

      if (error) {
        console.error("Error fetching properties:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!proprietaireId && open,
  });

  const handlePropertyClick = (propertyId: string) => {
    // Le lien sera géré par le composant Link de react-router-dom
    onOpenChange(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-[95vw] sm:max-w-lg md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6",
        isMobile && "w-full"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Home className="h-5 w-5 text-primary" /> 
            Biens de {proprietaireName}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Chargement des biens...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive p-4 md:p-8 text-center">
            <h3 className="text-lg font-medium text-destructive">Erreur de chargement</h3>
            <p className="text-muted-foreground">
              Impossible de charger les biens. Veuillez réessayer.
            </p>
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {properties.map((property) => (
              <Card 
                key={property.id} 
                className="cursor-pointer hover:shadow-md transition-all duration-300 border-l-4 border-l-primary"
                onClick={() => handlePropertyClick(property.id)}
              >
                <CardHeader className="pb-2 bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Home className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="truncate">{property.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{formatPrice(property.price)}</span>
                    </div>
                    {property.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{property.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{property.property_type}</span>
                      {property.surface_area && (
                        <span className="text-muted-foreground">
                          ({property.surface_area} m²)
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full hover:bg-primary hover:text-white transition-colors"
                    asChild
                  >
                    <Link to={`/${agency?.slug}/properties/${property.id}`}>
                      Voir détails
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 md:p-8 text-center">
            <h3 className="text-lg font-medium">Aucun bien trouvé</h3>
            <p className="text-muted-foreground">
              Ce propriétaire n'a pas de biens enregistrés pour le moment.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
