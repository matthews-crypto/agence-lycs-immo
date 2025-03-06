
import React, { useState } from 'react';
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';

type Client = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  cin: string | null;
  property_id: string | null;
  property_title: string | null;
  rental_start_date: string | null;
  rental_end_date: string | null;
  statut: string;
  property_type: string | null;
  property_price: number | null;
  property_address: string | null;
};

export default function ClientsPage() {
  const { agency } = useAgencyContext();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['activeClients', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      
      console.log("Fetching clients for agency:", agency.id);
      
      // Get all active locations first with full property details
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select(`
          id,
          client_id,
          client_cin,
          property_id,
          rental_start_date,
          rental_end_date,
          statut,
          properties:property_id (
            title,
            property_type,
            price,
            address
          )
        `)
        .eq('statut', 'EN COURS');

      if (locationsError) {
        console.error("Error fetching locations:", locationsError);
        throw locationsError;
      }
      
      console.log("Locations data:", locationsData);
      
      if (!locationsData || locationsData.length === 0) {
        return [];
      }
      
      // Get the client IDs from active locations
      const clientIds = locationsData.map(location => location.client_id);
      
      // Get client details
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          first_name, 
          last_name,
          phone_number
        `)
        .eq('agency_id', agency.id)
        .in('id', clientIds);
      
      if (clientsError) {
        console.error("Error fetching clients:", clientsError);
        throw clientsError;
      }
      
      console.log("Clients data:", clientsData);
      
      // Map clients with their location info
      const formattedClients = clientsData.map(client => {
        // Find the corresponding location for this client
        const clientLocation = locationsData.find(loc => loc.client_id === client.id);
        
        if (!clientLocation) {
          return null; // Skip clients without locations
        }
        
        // Get property data safely
        const propertyData = clientLocation.properties || {};
        
        return {
          id: client.id,
          first_name: client.first_name,
          last_name: client.last_name,
          phone_number: client.phone_number,
          // Use CIN from locations table as specified
          cin: clientLocation.client_cin,
          property_id: clientLocation.property_id,
          property_title: propertyData.title || null,
          rental_start_date: clientLocation.rental_start_date,
          rental_end_date: clientLocation.rental_end_date,
          statut: clientLocation.statut || 'N/A',
          property_type: propertyData.property_type || null,
          property_price: propertyData.price || null,
          property_address: propertyData.address || null
        };
      }).filter(Boolean) as Client[]; // Filter out null values and cast to Client[]
      
      console.log("Formatted client data:", formattedClients);
      return formattedClients;
    },
    enabled: !!agency?.id,
  });

  const handleClientClick = (client: Client) => {
    console.log("Selected client:", client);
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non spécifiée";
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Date invalide";
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AgencySidebar />
        <div className="flex-1 overflow-auto p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Clients de l'Agence</h1>
            <p className="text-muted-foreground">Gérer et consulter les informations sur vos clients</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Chargement des clients...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive p-8 text-center">
              <h3 className="text-lg font-medium text-destructive">Erreur de chargement</h3>
              <p className="text-muted-foreground">
                Impossible de charger les clients. Veuillez réessayer.
              </p>
            </div>
          ) : clients && clients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <Card 
                  key={client.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleClientClick(client)}
                >
                  <CardHeader>
                    <CardTitle>{client.first_name} {client.last_name}</CardTitle>
                    <CardDescription>
                      {client.property_title ? `Loue: ${client.property_title}` : "Aucun bien associé"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Téléphone:</strong> {client.phone_number || "Non renseigné"}</p>
                      <p><strong>CIN:</strong> {client.cin || "Non renseigné"}</p>
                      {client.rental_start_date && (
                        <p><strong>Début de location:</strong> {formatDate(client.rental_start_date)}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => handleClientClick(client)}>
                      Voir détails
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="text-lg font-medium">Aucun client actif</h3>
              <p className="text-muted-foreground">
                Il n'y a pas de clients avec des locations en cours pour le moment.
              </p>
            </div>
          )}
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Informations détaillées du client</DialogTitle>
                <DialogDescription>
                  Toutes les informations concernant le client et sa location.
                </DialogDescription>
              </DialogHeader>
              {selectedClient && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Information personnelle</h3>
                    <p><strong>Nom complet:</strong> {selectedClient.first_name} {selectedClient.last_name}</p>
                    <p><strong>Téléphone:</strong> {selectedClient.phone_number || "Non renseigné"}</p>
                    <p><strong>CIN:</strong> {selectedClient.cin || "Non renseigné"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Information sur le bien</h3>
                    <p><strong>Titre:</strong> {selectedClient.property_title || "Non renseigné"}</p>
                    <p><strong>Type:</strong> {selectedClient.property_type || "Non renseigné"}</p>
                    <p><strong>Prix:</strong> {selectedClient.property_price ? `${selectedClient.property_price} DH` : "Non renseigné"}</p>
                    <p><strong>Adresse:</strong> {selectedClient.property_address || "Non renseignée"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Information sur la location</h3>
                    <p><strong>Statut:</strong> {selectedClient.statut || "Non renseigné"}</p>
                    <p><strong>Date de début:</strong> {formatDate(selectedClient.rental_start_date)}</p>
                    <p><strong>Date de fin:</strong> {formatDate(selectedClient.rental_end_date)}</p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SidebarProvider>
  );
}
