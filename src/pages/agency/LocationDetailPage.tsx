
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import PropertyHeader from "@/components/property/PropertyHeader";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { useIsMobile } from "@/hooks/use-mobile";

type LocationDetails = {
  id: string;
  rental_start_date: string;
  rental_end_date: string;
  client_cin: string | null;
  document_url: string | null;
  statut: string;
  property: {
    id: string;
    title: string;
    reference_number: string;
    address: string | null;
    price: number;
  };
  client: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
  };
};

export default function LocationDetailPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const [location, setLocation] = useState<LocationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { agency } = useAgencyContext();
  const isMobile = useIsMobile();

  const goBack = () => {
    navigate(`/${agency?.slug}/agency/planning`);
  };

  useEffect(() => {
    if (!locationId) return;

    const fetchLocationDetails = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("locations")
          .select(`
            id,
            rental_start_date,
            rental_end_date,
            client_cin,
            document_url,
            statut,
            property:properties(id, title, reference_number, address, price),
            client:clients(id, first_name, last_name, email, phone_number)
          `)
          .eq("id", locationId)
          .single();

        if (error) {
          throw error;
        }

        console.log("Location details:", data);
        setLocation(data as LocationDetails);
      } catch (error) {
        console.error("Error fetching location details:", error);
        toast.error("Erreur lors du chargement des détails de la location");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationDetails();
  }, [locationId]);

  const handleResiliationContract = async () => {
    if (!location?.id) return;

    try {
      const { error } = await supabase
        .from("locations")
        .update({
          statut: "TERMINÉ",
          effective_end_date: new Date().toISOString()
        })
        .eq("id", location.id);

      if (error) {
        throw error;
      }

      toast.success("Contrat résilié avec succès");
      goBack();
    } catch (error) {
      console.error("Error terminating contract:", error);
      toast.error("Erreur lors de la résiliation du contrat");
    }
    setIsDialogOpen(false);
  };

  // Modifiers for the calendar to highlight rental duration
  const modifiers = {
    rentalPeriod: (date: Date) => {
      if (!location?.rental_start_date || !location?.rental_end_date) return false;
      
      const startDate = new Date(location.rental_start_date);
      const endDate = new Date(location.rental_end_date);
      return date >= startDate && date <= endDate;
    }
  };

  const modifiersStyles = {
    rentalPeriod: {
      backgroundColor: 'rgba(155, 135, 245, 0.2)',
      borderRadius: '0',
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
          <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
          <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-red-500">Location non trouvée</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PropertyHeader 
        onBack={goBack} 
        agencyLogo={agency?.logo_url || undefined}
        agencyName={agency?.agency_name}
        primaryColor={agency?.primary_color || '#9b87f5'}
      />
      
      <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800">
          Détails de la location: {location.property.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <Card className="shadow-md border-purple-100 hover:border-purple-200 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-2">
              <CardTitle className="text-purple-800">Détails du bien</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p><span className="font-medium text-gray-700">Référence:</span> <span className="text-gray-600">{location.property.reference_number}</span></p>
                <p><span className="font-medium text-gray-700">Titre:</span> <span className="text-gray-600">{location.property.title}</span></p>
                <p><span className="font-medium text-gray-700">Adresse:</span> <span className="text-gray-600">{location.property.address || 'Non spécifiée'}</span></p>
                <p><span className="font-medium text-gray-700">Prix:</span> <span className="text-gray-600">{location.property.price.toLocaleString()} FCFA</span></p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-purple-100 hover:border-purple-200 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-2">
              <CardTitle className="text-purple-800">Détails du client</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p><span className="font-medium text-gray-700">Nom:</span> <span className="text-gray-600">{location.client.first_name} {location.client.last_name}</span></p>
                <p><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-600">{location.client.email || 'Non spécifié'}</span></p>
                <p><span className="font-medium text-gray-700">Téléphone:</span> <span className="text-gray-600">{location.client.phone_number || 'Non spécifié'}</span></p>
                <p><span className="font-medium text-gray-700">CIN:</span> <span className="text-gray-600">{location.client_cin || 'Non spécifié'}</span></p>
                {location.document_url && (
                  <p>
                    <span className="font-medium text-gray-700">Document:</span>{' '}
                    <a 
                      href={location.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Voir le document
                    </a>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="shadow-md border-purple-100 hover:border-purple-200 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-2">
              <CardTitle className="text-purple-800">Période de location</CardTitle>
              <CardDescription className="text-gray-600">
                Du {format(new Date(location.rental_start_date), 'dd/MM/yyyy')} au {format(new Date(location.rental_end_date), 'dd/MM/yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className={`overflow-hidden ${isMobile ? 'scale-75 -ml-8' : ''}`}>
                <Calendar 
                  mode="default"
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  defaultMonth={new Date(location.rental_start_date)}
                  selected={[
                    new Date(location.rental_start_date),
                    new Date(location.rental_end_date)
                  ]}
                  className="p-3 border rounded-lg mx-auto max-w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-purple-100 hover:border-purple-200 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-2">
              <CardTitle className="text-purple-800">Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col h-full">
              <div className="space-y-2">
                <p><span className="font-medium text-gray-700 inline-block w-36">Statut:</span> 
                  <span className="text-white bg-green-600 px-2 py-1 rounded-full text-xs ml-2">{location.statut}</span>
                </p>
                <p><span className="font-medium text-gray-700">Date de début:</span> <span className="text-gray-600">{format(new Date(location.rental_start_date), 'dd/MM/yyyy')}</span></p>
                <p><span className="font-medium text-gray-700">Date de fin prévue:</span> <span className="text-gray-600">{format(new Date(location.rental_end_date), 'dd/MM/yyyy')}</span></p>
              
                <Button 
                  variant="destructive" 
                  className="mt-4 bg-red-500 hover:bg-red-600 transition-colors shadow-md w-full"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Résilier le contrat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmation de résiliation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir résilier ce contrat de location ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleResiliationContract}>
              Confirmer la résiliation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
