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
import { Search, History, Calendar, DollarSign, User } from "lucide-react";
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
  created_at: string;
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
  // Sorting and time filtering states
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [timeFilter, setTimeFilter] = useState<string>("all");

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
            created_at,
            property:properties(title, reference_number, type_location),
            client:clients(first_name, last_name, phone_number)
          `)
          .not("rental_start_date", "is", null)
          .not("rental_end_date", "is", null)
          .eq("statut", "EN COURS")
          .order("created_at", { ascending: false }); // Most recent first by default

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
            created_at,
            property:properties(title, reference_number, type_location),
            client:clients(first_name, last_name, phone_number)
          `)
          .eq("statut", "TERMINÉ")
          .order("created_at", { ascending: false }); // Most recent first by default

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

  // Handle filtering based on search term, type_location, sort order, and time filter
  useEffect(() => {
    const filterLocations = () => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const now = new Date();
      const cutoffDate = new Date();
      
      if (timeFilter === "week") {
        // Last week
        cutoffDate.setDate(now.getDate() - 7);
      } else if (timeFilter === "month") {
        // Last month
        cutoffDate.setMonth(now.getMonth() - 1);
      }
      
      // Filter active locations
      let activeFiltered = locations.filter(location => {
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
        
        // Check if matches time filter
        let matchesTimeFilter = true;
        if (timeFilter !== "all") {
          const createdAt = new Date(location.created_at);
          matchesTimeFilter = createdAt >= cutoffDate;
        }
        
        return matchesSearch && matchesTypeLocation && matchesTimeFilter;
      });
      
      // Filter historical locations
      let historicalFiltered = historicalLocations.filter(location => {
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
        
        // Check if matches time filter
        let matchesTimeFilter = true;
        if (timeFilter !== "all") {
          const createdAt = new Date(location.created_at);
          matchesTimeFilter = createdAt >= cutoffDate;
        }
        
        return matchesSearch && matchesTypeLocation && matchesTimeFilter;
      });
      
      // Apply sorting
      activeFiltered = [...activeFiltered].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
      
      historicalFiltered = [...historicalFiltered].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
      
      setFilteredActiveLocations(activeFiltered);
      setFilteredHistoricalLocations(historicalFiltered);
    };
    
    filterLocations();
  }, [searchTerm, typeLocationFilter, locations, historicalLocations, sortOrder, timeFilter]);

  const handleLocationClick = (locationId: string) => {
    navigate(`/${agency?.slug}/agency/planning/${locationId}`);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <h1 className="text-2xl font-bold mb-4 md:mb-6">Planning des Locations</h1>
          
          <div className="mb-6 space-y-4 bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-3">Filtres et recherche</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="search" 
                  placeholder="Rechercher par client, bien, téléphone..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
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
              <div>
                <select
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Plus récents d'abord</option>
                  <option value="asc">Plus anciens d'abord</option>
                </select>
              </div>
              <div>
                <select
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option value="all">Tous les temps</option>
                  <option value="week">Dernière semaine</option>
                  <option value="month">Dernier mois</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
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
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Locations actives
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <p className="text-muted-foreground">Chargement des locations...</p>
                    </div>
                  ) : filteredActiveLocations.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">Aucune location en cours</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredActiveLocations.map(location => (
                        <div 
                          key={location.id} 
                          className="border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer bg-white"
                          onClick={() => handleLocationClick(location.id)}
                        >
                          <div className="p-4 border-b bg-muted/10">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-lg truncate">
                                {location.property?.title}
                              </h3>
                              <div className={`px-2 py-1 rounded-full text-xs ${location.property?.type_location === 'longue_duree' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                {location.property?.type_location === 'longue_duree' ? 'Longue durée' : 'Courte durée'}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Réf: {location.property?.reference_number}
                            </p>
                          </div>
                          
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {location.client?.first_name} {location.client?.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {location.client?.phone_number || 'Non spécifié'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <div className="bg-muted/20 p-2 rounded">
                                <p className="text-xs text-muted-foreground">Début</p>
                                <p className="font-medium">
                                  {location.rental_start_date ? format(new Date(location.rental_start_date), 'dd/MM/yyyy') : 'N/A'}
                                </p>
                              </div>
                              <div className="bg-muted/20 p-2 rounded">
                                <p className="text-xs text-muted-foreground">Fin</p>
                                <p className="font-medium">
                                  {location.rental_end_date ? format(new Date(location.rental_end_date), 'dd/MM/yyyy') : 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              className="w-full mt-4 hover:bg-primary hover:text-white transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLocationClick(location.id);
                              }}
                            >
                              Voir détails
                            </Button>
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
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Historique des locations
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {isHistoryLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <p className="text-muted-foreground">Chargement de l'historique...</p>
                    </div>
                  ) : filteredHistoricalLocations.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">Aucune location terminée</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredHistoricalLocations.map(location => (
                        <div 
                          key={location.id} 
                          className="border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer bg-white"
                          onClick={() => handleLocationClick(location.id)}
                        >
                          <div className="p-4 border-b bg-muted/10">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-lg truncate">
                                {location.property?.title}
                              </h3>
                              <div className={`px-2 py-1 rounded-full text-xs ${location.property?.type_location === 'longue_duree' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                {location.property?.type_location === 'longue_duree' ? 'Longue durée' : 'Courte durée'}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Réf: {location.property?.reference_number}
                            </p>
                          </div>
                          
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {location.client?.first_name} {location.client?.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {location.client?.phone_number || 'Non spécifié'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <div className="bg-muted/20 p-2 rounded">
                                <p className="text-xs text-muted-foreground">Début</p>
                                <p className="font-medium">
                                  {location.rental_start_date ? format(new Date(location.rental_start_date), 'dd/MM/yyyy') : 'N/A'}
                                </p>
                              </div>
                              <div className="bg-muted/20 p-2 rounded">
                                <p className="text-xs text-muted-foreground">Fin</p>
                                <p className="font-medium">
                                  {location.rental_end_date ? format(new Date(location.rental_end_date), 'dd/MM/yyyy') : 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-4 flex justify-between items-center">
                              <div className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                Terminée
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLocationClick(location.id);
                                }}
                              >
                                Détails
                              </Button>
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
