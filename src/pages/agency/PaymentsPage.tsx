import { useEffect, useState, useMemo } from "react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, CheckCircle, XCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkAndUpdatePaymentStatus } from "@/utils/paymentUtils";

type LocationData = {
  id: string;
  rental_start_date: string;
  rental_end_date: string;
  paiement: boolean | null;
  property: {
    title: string;
    reference_number: string;
    type_location: string | null;
  };
  client: {
    first_name: string;
    last_name: string;
    phone_number: string;
  };
};

export default function PaymentsPage() {
  const { agency } = useAgencyContext();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("longue_duree");
  const navigate = useNavigate();

  useEffect(() => {
    if (!agency?.id) return;

    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        // Vérifier et mettre à jour les statuts de paiement des locations dont la date de fin est dépassée
        await checkAndUpdatePaymentStatus();
        
        // Récupérer les locations avec le statut "EN COURS" et qui ont une date de début
        const { data, error } = await supabase
          .from('locations')
          .select(`
            id,
            rental_start_date,
            rental_end_date,
            paiement,
            statut,
            property:property_id (
              title,
              reference_number,
              type_location
            ),
            client:client_id (
              first_name,
              last_name,
              phone_number
            )
          `)
          .eq('statut', 'EN COURS')
          .not('rental_start_date', 'is', null);

        if (error) {
          throw error;
        }

        // Conversion sécurisée pour éviter les erreurs de type
        const locationsData = data as unknown as LocationData[];
        setLocations(locationsData);
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error("Erreur lors du chargement des locations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [agency?.id]);

  // Filtrer les locations en fonction du terme de recherche
  const filteredLocations = useMemo(() => {
    if (!locations) return [];

    return locations.filter(location => {
      // Filtrer par type de location (longue durée ou courte durée)
      const matchesType = location.property?.type_location === activeTab;
      
      if (!matchesType) return false;
      
      // Filtrer par terme de recherche
      if (searchTerm === "") return true;

      const searchLower = searchTerm.toLowerCase();
      
      // Recherche dans le titre du bien
      const titleMatch = location.property?.title?.toLowerCase().includes(searchLower);
      
      // Recherche dans le nom du client
      const clientNameMatch = `${location.client?.first_name} ${location.client?.last_name}`.toLowerCase().includes(searchLower);
      
      // Recherche dans la référence du bien
      const referenceMatch = location.property?.reference_number?.toLowerCase().includes(searchLower);
      
      // Recherche dans le numéro de téléphone du client
      const phoneMatch = location.client?.phone_number?.toLowerCase().includes(searchLower);
      
      return titleMatch || clientNameMatch || referenceMatch || phoneMatch;
    });
  }, [locations, searchTerm, activeTab]);

  const handlePaymentDetailsClick = (locationId: string) => {
    navigate(`/${agency?.slug}/agency/payments/${locationId}`);
  };

  const handleBackToPlanningClick = () => {
    navigate(`/${agency?.slug}/agency/planning`);
  };

  // Fonction pour vérifier si une location se termine bientôt (dans les 5 jours)
  const isEndingSoon = (endDate: string | null) => {
    if (!endDate) return false;
    
    const today = new Date();
    const end = new Date(endDate);
    
    // Réinitialiser les heures pour comparer uniquement les dates
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    // Calculer la différence en jours
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Afficher l'alerte si la date de fin est dans 5 jours ou moins
    return diffDays >= 0 && diffDays <= 5;
  };

  // Fonction pour obtenir le badge de statut de paiement
  const getPaymentStatusBadge = (status: boolean | null, endDate: string | null) => {
    // Vérifier si la location se termine bientôt
    const endingSoon = isEndingSoon(endDate);
    
    if (status === true) {
      return (
        <div className="flex items-center gap-1">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Payé
          </Badge>
          {endingSoon && (
            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Expire bientôt
            </Badge>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1">
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Non payé
          </Badge>
          {endingSoon && (
            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Expire bientôt
            </Badge>
          )}
        </div>
      );
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h1 className="text-2xl font-bold">Gestion des Paiements</h1>
            <Button 
              variant="outline" 
              onClick={handleBackToPlanningClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au planning
            </Button>
          </div>
          
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="search" 
                  placeholder="Rechercher par client, bien, téléphone..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="longue_duree" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="longue_duree">Location Longue Durée</TabsTrigger>
              <TabsTrigger value="courte_duree">Location Courte Durée</TabsTrigger>
            </TabsList>
            
            <TabsContent value="longue_duree">
              <Card>
                <CardHeader>
                  <CardTitle>Locations Longue Durée en cours</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Chargement...</p>
                  ) : filteredLocations.length === 0 ? (
                    <p>Aucune location longue durée en cours</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredLocations.map(location => (
                        <div 
                          key={location.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                            isEndingSoon(location.rental_end_date) ? 'border-orange-300 border-2' : ''
                          }`}
                          onClick={() => handlePaymentDetailsClick(location.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">
                                {location.property?.title} ({location.property?.reference_number})
                              </h3>
                              <p>
                                Client: {location.client?.first_name} {location.client?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                Tél: {location.client?.phone_number || 'Non spécifié'}
                              </p>
                              <div className="mt-2 text-sm">
                                <p>
                                  Début: {location.rental_start_date ? format(new Date(location.rental_start_date), 'dd/MM/yyyy') : 'N/A'}
                                </p>
                                <p>
                                  Fin: {location.rental_end_date ? format(new Date(location.rental_end_date), 'dd/MM/yyyy') : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              {getPaymentStatusBadge(location.paiement, location.rental_end_date)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="courte_duree">
              <Card>
                <CardHeader>
                  <CardTitle>Locations Courte Durée en cours</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Chargement...</p>
                  ) : filteredLocations.length === 0 ? (
                    <p>Aucune location courte durée en cours</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredLocations.map(location => (
                        <div 
                          key={location.id}
                          className="p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                          onClick={() => handlePaymentDetailsClick(location.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">
                                {location.property?.title} ({location.property?.reference_number})
                              </h3>
                              <p>
                                Client: {location.client?.first_name} {location.client?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                Tél: {location.client?.phone_number || 'Non spécifié'}
                              </p>
                              <div className="mt-2 text-sm">
                                <p>
                                  Début: {location.rental_start_date ? format(new Date(location.rental_start_date), 'dd/MM/yyyy') : 'N/A'}
                                </p>
                                <p>
                                  Fin: {location.rental_end_date ? format(new Date(location.rental_end_date), 'dd/MM/yyyy') : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              {location.paiement ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Séjour payé
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Séjour non payé
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
}
