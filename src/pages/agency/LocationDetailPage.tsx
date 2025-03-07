
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
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderRadius: '0',
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Location non trouvée</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PropertyHeader 
        onBack={goBack} 
        agencyLogo={agency?.logo_url || undefined}
        agencyName={agency?.agency_name}
        primaryColor={agency?.primary_color || '#0066FF'}
      />
      
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">
          Détails de la location: {location.property.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails du bien</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><span className="font-medium">Référence:</span> {location.property.reference_number}</p>
                <p><span className="font-medium">Titre:</span> {location.property.title}</p>
                <p><span className="font-medium">Adresse:</span> {location.property.address || 'Non spécifiée'}</p>
                <p><span className="font-medium">Prix:</span> {location.property.price.toLocaleString()} TND</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détails du client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><span className="font-medium">Nom:</span> {location.client.first_name} {location.client.last_name}</p>
                <p><span className="font-medium">Email:</span> {location.client.email || 'Non spécifié'}</p>
                <p><span className="font-medium">Téléphone:</span> {location.client.phone_number || 'Non spécifié'}</p>
                <p><span className="font-medium">CIN:</span> {location.client_cin || 'Non spécifié'}</p>
                {location.document_url && (
                  <p>
                    <span className="font-medium">Document:</span>{' '}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Période de location</CardTitle>
              <CardDescription>
                Du {format(new Date(location.rental_start_date), 'dd/MM/yyyy')} au {format(new Date(location.rental_end_date), 'dd/MM/yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar 
                mode="default"
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                defaultMonth={new Date(location.rental_start_date)}
                selected={[
                  new Date(location.rental_start_date),
                  new Date(location.rental_end_date)
                ]}
                className="p-3 border rounded-lg"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4">
              <div>
                <p><span className="font-medium">Statut:</span> {location.statut}</p>
                <p><span className="font-medium">Date de début:</span> {format(new Date(location.rental_start_date), 'dd/MM/yyyy')}</p>
                <p><span className="font-medium">Date de fin prévue:</span> {format(new Date(location.rental_end_date), 'dd/MM/yyyy')}</p>
              </div>
              
              <Button 
                variant="destructive" 
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                Résilier le contrat
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation de résiliation</DialogTitle>
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
