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
import { User, Phone, Calendar, Home, MapPin, CreditCard, Clock, Tag, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Define the structure of property data to ensure type safety
type PropertyData = {
  title?: string | null;
  property_type?: string | null;
  price?: number | null;
  address?: string | null;
};

export default function ClientsPage() {
  const { agency } = useAgencyContext();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isMobile = useIsMobile();

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
        
        // Get property data safely - explicitly cast to PropertyData type
        const propertyData = clientLocation.properties as PropertyData || {};
        
        return {
          id: client.id,
          first_name: client.first_name,
          last_name: client.last_name,
          phone_number: client.phone_number,
          // Use CIN from locations table as specified
          cin: clientLocation.client_cin,
          property_id: clientLocation.property_id,
          property_title: propertyData?.title || null,
          rental_start_date: clientLocation.rental_start_date,
          rental_end_date: clientLocation.rental_end_date,
          statut: clientLocation.statut || 'N/A',
          property_type: propertyData?.property_type || null,
          property_price: propertyData?.price || null,
          property_address: propertyData?.address || null
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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'EN COURS':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AgencySidebar />
        <div className="flex-1 overflow-auto p-4 md:p-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {clients.map((client) => (
                <Card 
                  key={client.id} 
                  className="cursor-pointer hover:shadow-md transition-all duration-300 border-l-4 border-l-primary"
                  onClick={() => handleClientClick(client)}
                >
                  <CardHeader className="pb-2 bg-muted/30">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-primary" />
                      <span className="truncate">
                        {client.first_name} {client.last_name}
                      </span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      {client.property_title ? (
                        <span className="truncate">
                          {client.property_title}
                        </span>
                      ) : (
                        "Aucun bien associé"
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{client.phone_number || "Non renseigné"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{client.cin || "Non renseigné"}</span>
                      </div>
                      {client.rental_start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">Début: {formatDate(client.rental_start_date)}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 mt-2">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className={cn("text-xs px-2 py-1 rounded-full border", getStatusColor(client.statut))}>
                          {client.statut}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full hover:bg-primary hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClientClick(client);
                      }}
                    >
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
            <DialogContent className={cn(
              "sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto",
              isMobile && "w-[95vw] p-4"
            )}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-primary" /> 
                  Informations détaillées du client
                </DialogTitle>
                <DialogDescription>
                  Toutes les informations concernant le client et sa location.
                </DialogDescription>
              </DialogHeader>
              {selectedClient && (
                <div className="space-y-6 mt-2">
                  <div className="space-y-4 bg-muted/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Information personnelle
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Nom complet</p>
                          <p className="font-medium">{selectedClient.first_name} {selectedClient.last_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Téléphone</p>
                          <p className="font-medium">{selectedClient.phone_number || "Non renseigné"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">CIN</p>
                          <p className="font-medium">{selectedClient.cin || "Non renseigné"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 bg-muted/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      Information sur le bien
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Titre</p>
                          <p className="font-medium">{selectedClient.property_title || "Non renseigné"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="font-medium">{selectedClient.property_type || "Non renseigné"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Prix</p>
                          <p className="font-medium">{selectedClient.property_price ? `${selectedClient.property_price} DH` : "Non renseigné"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Adresse</p>
                          <p className="font-medium">{selectedClient.property_address || "Non renseignée"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 bg-muted/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Information sur la location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Statut</p>
                          <p className={cn("inline-flex px-2 py-1 text-sm rounded-full border mt-1", getStatusColor(selectedClient.statut))}>
                            {selectedClient.statut || "Non renseigné"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date de début</p>
                          <p className="font-medium">{formatDate(selectedClient.rental_start_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date de fin</p>
                          <p className="font-medium">{formatDate(selectedClient.rental_end_date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={() => setDialogOpen(false)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Fermer
                    </Button>
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
