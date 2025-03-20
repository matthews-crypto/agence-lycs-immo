import React, { useState, useMemo } from 'react';
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
import { User, Phone, Calendar, Home, MapPin, CreditCard, Clock, Tag, FileText, Search } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Banknote } from 'lucide-react';

type Client = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  cin: string | null;
};

type Location = {
  id: string;
  property_id: string;
  client_id: string;
  rental_start_date: string | null;
  rental_end_date: string | null;
  statut: string;
  properties: PropertyData;
};

type PropertyData = {
  title?: string | null;
  property_type?: string | null;
  price?: number | null;
  address?: string | null;
};

export default function ClientsPage() {
  const { agency } = useAgencyContext();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientLocations, setClientLocations] = useState<Location[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [locationsDialogOpen, setLocationsDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Nouveaux états pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all");
  // État pour stocker toutes les locations de tous les clients
  const [allLocations, setAllLocations] = useState<Location[]>([]);

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      
      // 1. Récupérer d'abord tous les clients de l'agence
      const { data: allClientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          first_name, 
          last_name,
          phone_number
        `)
        .eq('agency_id', agency.id);

      if (clientsError) {
        console.error("Error fetching clients:", clientsError);
        throw clientsError;
      }

      if (!allClientsData || allClientsData.length === 0) return [];

      // 2. Récupérer toutes les locations pour ces clients
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('client_id, client_cin')
        .in('client_id', allClientsData.map(c => c.id));

      if (locationError) {
        console.error("Error fetching locations:", locationError);
        throw locationError;
      }

      // 3. Ne garder que les clients qui ont des locations
      const clientsWithLocations = allClientsData.filter(client =>
        locationData.some(loc => loc.client_id === client.id)
      );

      // 4. Pour chaque client restant, prendre le CIN de sa dernière location
      const clientsWithCin = clientsWithLocations.map(client => {
        const clientLocations = locationData.filter(loc => loc.client_id === client.id);
        // Prendre le dernier CIN
        const lastCin = clientLocations[clientLocations.length - 1]?.client_cin;

        return {
          ...client,
          cin: lastCin || null
        };
      });

      return clientsWithCin;
    },
    enabled: !!agency?.id,
  });

  // Récupérer toutes les locations pour tous les clients
  useQuery({
    queryKey: ['all-locations', agency?.id],
    queryFn: async () => {
      if (!agency?.id || !clients || clients.length === 0) return [];
      
      const { data, error } = await supabase
        .from('locations')
        .select(`
          id,
          property_id,
          client_id,
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
        .in('client_id', clients.map(c => c.id))
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching all locations:", error);
        return [];
      }

      setAllLocations(data || []);
      return data || [];
    },
    enabled: !!agency?.id && !!clients && clients.length > 0,
  });

  // Fonction pour filtrer les clients
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    
    return clients.filter(client => {
      const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
      const matchesSearch = searchTerm === "" || fullName.includes(searchTerm.toLowerCase());
      
      // Filtre sur le type de client (acheteur ou locataire)
      let matchesClientType = true;
      if (clientTypeFilter !== "all" && client.id) {
        // Récupérer toutes les locations du client
        const clientTransactions = allLocations.filter(loc => loc.client_id === client.id);
        
        // Vérifier si le client a au moins une location (avec dates de début et fin)
        const hasRentals = clientTransactions.some(loc => loc.rental_start_date && loc.rental_end_date);
        
        // Vérifier si le client a au moins un achat (sans dates de début et fin)
        const hasPurchases = clientTransactions.some(loc => !loc.rental_start_date || !loc.rental_end_date);
        
        // Filtrer selon le type sélectionné
        if (clientTypeFilter === "rental" && !hasRentals) matchesClientType = false;
        if (clientTypeFilter === "buyer" && !hasPurchases) matchesClientType = false;
      }
      
      return matchesSearch && matchesClientType;
    });
  }, [clients, searchTerm, clientTypeFilter, allLocations]);

  const handleClientClick = async (client: Client) => {
    setSelectedClient(client);
    setDialogOpen(true);
    
    if (client.id) {
      // Récupérer toutes les locations/ventes du client
      const { data, error } = await supabase
        .from('locations')
        .select(`
          id,
          property_id,
          client_id,
          client_cin,
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
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching locations:", error);
        return;
      }

      setClientLocations(data || []);
    }
  };

  const handleLocationClick = (locationId: string) => {
    if (agency?.slug) {
      navigate(`/${agency.slug}/agency/planning/${locationId}`);
    }
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
        <div className="flex-1 p-4 md:p-8">
          <div className="h-full flex flex-col">
            <div className="flex-1 space-y-4 p-4 md:p-8">
              <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
              </div>

              {/* Contenu principal avec largeur maximale et centrage */}
              <div className="mx-auto w-full max-w-7xl space-y-6">
                {/* Filtres */}
                <div className="grid gap-4 md:gap-6">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Type de client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les clients</SelectItem>
                        <SelectItem value="rental">Locataires</SelectItem>
                        <SelectItem value="buyer">Acheteurs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <p>Chargement des clients...</p>
                  </div>
                ) : error ? (
                  <div className="rounded-lg border border-destructive p-4 md:p-8 text-center">
                    <h3 className="text-lg font-medium text-destructive">Erreur de chargement</h3>
                    <p className="text-muted-foreground">
                      Impossible de charger les clients. Veuillez réessayer.
                    </p>
                  </div>
                ) : filteredClients.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredClients.map((client) => (
                      <Card 
                        key={client.id} 
                        className="cursor-pointer hover:shadow-md transition-all duration-300 border-l-4 border-l-primary"
                        onClick={() => handleClientClick(client)}
                      >
                        <CardHeader className="pb-2 bg-muted/30">
                          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                            <User className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="truncate">
                              {client.first_name} {client.last_name}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{client.phone_number || "Non renseigné"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{client.cin || "Non renseigné"}</span>
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
                  <div className="rounded-lg border border-dashed p-4 md:p-8 text-center">
                    <h3 className="text-lg font-medium">Aucun client actif</h3>
                    <p className="text-muted-foreground">
                      Il n'y a pas de clients avec des locations en cours pour le moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className={cn(
              "max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6",
              isMobile && "w-full"
            )}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <User className="h-5 w-5 text-primary" /> 
                  Informations détaillées du client
                </DialogTitle>
              </DialogHeader>
              {selectedClient && (
                <div className="space-y-6 mt-2">
                  <div className="space-y-4 bg-muted/20 rounded-lg p-4">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Information personnelle
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Nom complet</p>
                          <p className="font-medium truncate">{selectedClient.first_name} {selectedClient.last_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Téléphone</p>
                          <p className="font-medium truncate">{selectedClient.phone_number || "Non renseigné"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">CIN</p>
                          <p className="font-medium truncate">{selectedClient.cin || "Non renseigné"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      className="w-full"
                      onClick={() => setLocationsDialogOpen(true)}
                    >
                      Voir les locations et ventes
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={locationsDialogOpen} onOpenChange={setLocationsDialogOpen}>
            <DialogContent className={cn(
              "max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6",
              isMobile && "w-full"
            )}>
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">Locations et Ventes</DialogTitle>
                <DialogDescription className="text-sm md:text-base">
                  Liste des locations et ventes associées à {selectedClient?.first_name} {selectedClient?.last_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {clientLocations.length > 0 ? (
                  clientLocations.map((location) => (
                    <div
                      key={location.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => location.statut === 'EN COURS' && handleLocationClick(location.id)}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{location.properties?.title}</h4>
                            <Badge variant="outline" className="shrink-0">
                              {location.rental_start_date && location.rental_end_date ? 'Location' : 'Vente'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full border whitespace-nowrap",
                              getStatusColor(location.statut)
                            )}>
                              {location.statut}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {location.properties?.property_type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {location.rental_start_date && location.rental_end_date && (
                          <>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">Début: {formatDate(location.rental_start_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">Fin: {formatDate(location.rental_end_date)}</span>
                            </div>
                          </>
                        )}
                        {location.properties?.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{location.properties.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            Prix: {location.properties?.price?.toLocaleString('fr-FR')} FCFA
                            {location.rental_start_date ? '/mois' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune location ou vente trouvée pour ce client.
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SidebarProvider>
  );
}
