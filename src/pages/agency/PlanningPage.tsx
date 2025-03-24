import { useEffect, useState } from "react";
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
import { Search, History, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

type LocationData = {
  id: string;
  rental_start_date: string;
  rental_end_date: string;
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

export default function PlanningPage() {
  const { agency } = useAgencyContext();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [historicalLocations, setHistoricalLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const navigate = useNavigate();

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [typeLocationFilter, setTypeLocationFilter] = useState<string | null>(null);
  const [filteredActiveLocations, setFilteredActiveLocations] = useState<LocationData[]>([]);
  const [filteredHistoricalLocations, setFilteredHistoricalLocations] = useState<LocationData[]>([]);

  useEffect(() => {
    if (!agency?.id) return;

    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("locations")
          .select(`
            id,
            rental_start_date,
            rental_end_date,
            property_id,
            client_id,
            property:properties(title, reference_number, type_location),
            client:clients(first_name, last_name, phone_number)
          `)
          .not("rental_start_date", "is", null)
          .not("rental_end_date", "is", null)
          .eq("statut", "EN COURS")
          .order("rental_start_date", { ascending: true });

        if (error) {
          throw error;
        }

        setLocations(data as LocationData[]);
        setFilteredActiveLocations(data as LocationData[]);
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error("Erreur lors du chargement des locations");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchHistoricalLocations = async () => {
      setIsHistoryLoading(true);
      try {
        const { data, error } = await supabase
          .from("locations")
          .select(`
            id,
            rental_start_date,
            rental_end_date,
            property_id,
            client_id,
            property:properties(title, reference_number, type_location),
            client:clients(first_name, last_name, phone_number)
          `)
          .eq("statut", "TERMINÉ")
          .order("rental_end_date", { ascending: false });

        if (error) {
          throw error;
        }

        setHistoricalLocations(data as LocationData[]);
        setFilteredHistoricalLocations(data as LocationData[]);
      } catch (error) {
        console.error("Error fetching historical locations:", error);
        toast.error("Erreur lors du chargement de l'historique des locations");
      } finally {
        setIsHistoryLoading(false);
      }
    };

    fetchLocations();
    fetchHistoricalLocations();
  }, [agency?.id]);

  // Handle filtering based on search term and type_location
  useEffect(() => {
    const filterLocations = () => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      // Filter active locations
      const activeFiltered = locations.filter(location => {
        const clientName = `${location.client?.first_name || ""} ${location.client?.last_name || ""}`.toLowerCase();
        const propertyTitle = location.property?.title.toLowerCase() || "";
        const phoneNumber = location.client?.phone_number?.toLowerCase() || "";
        
        // Check if matches search term
        const matchesSearch = clientName.includes(lowerSearchTerm) || 
                              propertyTitle.includes(lowerSearchTerm) || 
                              phoneNumber.includes(lowerSearchTerm);
        
        // Check if matches type_location filter
        const matchesTypeLocation = !typeLocationFilter || 
                                   location.property?.type_location === typeLocationFilter;
        
        return matchesSearch && matchesTypeLocation;
      });
      
      // Filter historical locations
      const historicalFiltered = historicalLocations.filter(location => {
        const clientName = `${location.client?.first_name || ""} ${location.client?.last_name || ""}`.toLowerCase();
        const propertyTitle = location.property?.title.toLowerCase() || "";
        const phoneNumber = location.client?.phone_number?.toLowerCase() || "";
        
        // Check if matches search term
        const matchesSearch = clientName.includes(lowerSearchTerm) || 
                              propertyTitle.includes(lowerSearchTerm) || 
                              phoneNumber.includes(lowerSearchTerm);
        
        // Check if matches type_location filter
        const matchesTypeLocation = !typeLocationFilter || 
                                   location.property?.type_location === typeLocationFilter;
        
        return matchesSearch && matchesTypeLocation;
      });
      
      setFilteredActiveLocations(activeFiltered);
      setFilteredHistoricalLocations(historicalFiltered);
    };
    
    filterLocations();
  }, [searchTerm, typeLocationFilter, locations, historicalLocations]);

  const handleLocationClick = (locationId: string) => {
    navigate(`/${agency?.slug}/agency/planning/${locationId}`);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <h1 className="text-2xl font-bold mb-4 md:mb-6">Planning des Locations</h1>
          
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
              <div className="w-full md:w-auto">
                <select
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  value={typeLocationFilter || ""}
                  onChange={(e) => setTypeLocationFilter(e.target.value || null)}
                >
                  <option value="">Tous types de location</option>
                  <option value="courte_duree">Courte durée</option>
                  <option value="longue_duree">Longue durée</option>
                </select>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-4 w-full max-w-md mx-auto">
              <TabsTrigger value="active" className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Locations actives</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                <History className="h-4 w-4 mr-2" />
                <span>Historique</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <CardTitle>Locations actives</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Chargement...</p>
                  ) : filteredActiveLocations.length === 0 ? (
                    <p>Aucune location en cours</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredActiveLocations.map(location => (
                        <div 
                          key={location.id} 
                          className="border p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleLocationClick(location.id)}
                        >
                          <h3 className="font-medium">
                            {location.property?.title} ({location.property?.reference_number})
                          </h3>
                          <p>
                            Client: {location.client?.first_name} {location.client?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Téléphone: {location.client?.phone_number || 'Non spécifié'}
                          </p>
                          <div className="flex justify-between text-sm text-gray-500 mt-2">
                            <p>Début: {location.rental_start_date ? format(new Date(location.rental_start_date), 'dd/MM/yyyy') : 'N/A'}</p>
                            <p>Fin: {location.rental_end_date ? format(new Date(location.rental_end_date), 'dd/MM/yyyy') : 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Historique des locations</CardTitle>
                </CardHeader>
                <CardContent>
                  {isHistoryLoading ? (
                    <p>Chargement...</p>
                  ) : filteredHistoricalLocations.length === 0 ? (
                    <p>Aucune location terminée</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredHistoricalLocations.map(location => (
                        <div 
                          key={location.id} 
                          className="border p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleLocationClick(location.id)}
                        >
                          <h3 className="font-medium">
                            {location.property?.title} ({location.property?.reference_number})
                          </h3>
                          <p>
                            Client: {location.client?.first_name} {location.client?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Téléphone: {location.client?.phone_number || 'Non spécifié'}
                          </p>
                          <div className="flex justify-between text-sm text-gray-500 mt-2">
                            <p>Début: {location.rental_start_date ? format(new Date(location.rental_start_date), 'dd/MM/yyyy') : 'N/A'}</p>
                            <p>Fin: {location.rental_end_date ? format(new Date(location.rental_end_date), 'dd/MM/yyyy') : 'N/A'}</p>
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
