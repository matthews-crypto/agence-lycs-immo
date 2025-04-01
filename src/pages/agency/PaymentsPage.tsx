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
import { Search, DollarSign, CheckCircle, XCircle, ArrowLeft, AlertTriangle, User } from "lucide-react";
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
  created_at: string;
};

export default function PaymentsPage() {
  const { agency } = useAgencyContext();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("longue_duree");
  const [sortOrder, setSortOrder] = useState<string>("desc"); // Par défaut, du plus récent au plus ancien
  const [timeFilter, setTimeFilter] = useState<string>("all"); // Par défaut, tous les temps
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
            created_at,
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
          .not('rental_start_date', 'is', null)
          .order('created_at', { ascending: false }); // Par défaut, les plus récents en premier

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

  // Filtrer les locations en fonction du terme de recherche, du tri et de la période
  const filteredLocations = useMemo(() => {
    if (!locations) return [];

    // Filtrer par type de location (longue durée ou courte durée)
    let filtered = locations.filter(location => {
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

    // Filtrer par période
    if (timeFilter !== "all") {
      const now = new Date();
      const cutoffDate = new Date();
      
      if (timeFilter === "week") {
        // Dernière semaine
        cutoffDate.setDate(now.getDate() - 7);
      } else if (timeFilter === "month") {
        // Dernier mois
        cutoffDate.setMonth(now.getMonth() - 1);
      }
      
      filtered = filtered.filter(location => {
        const createdAt = new Date(location.created_at);
        return createdAt >= cutoffDate;
      });
    }

    // Trier par date de création
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      
      if (sortOrder === "asc") {
        return dateA.getTime() - dateB.getTime(); // Du plus ancien au plus récent
      } else {
        return dateB.getTime() - dateA.getTime(); // Du plus récent au plus ancien
      }
    });

    return filtered;
  }, [locations, searchTerm, activeTab, timeFilter, sortOrder]);

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
            {activeTab === "longue_duree" ? "À jour" : "Payé"}
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
            {activeTab === "longue_duree" ? "En retard" : "Non payé"}
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
          
          <div className="mb-6 space-y-4 bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-3">Recherche et filtres</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="flex justify-end mt-4">
              <Button 
                variant="default"
                className="flex items-center gap-2 bg-primary"
              >
                <DollarSign className="h-4 w-4" />
                Exporter les paiements
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="longue_duree" onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 w-full max-w-md mx-auto">
              <TabsTrigger value="longue_duree" className="flex-1">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>Location Longue Durée</span>
              </TabsTrigger>
              <TabsTrigger value="courte_duree" className="flex-1">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>Location Courte Durée</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="longue_duree">
              <Card>
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Locations Longue Durée en cours
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <p className="text-muted-foreground">Chargement des paiements...</p>
                    </div>
                  ) : filteredLocations.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">Aucune location longue durée en cours</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredLocations.map(location => (
                        <div 
                          key={location.id}
                          className={`border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer bg-white ${
                            isEndingSoon(location.rental_end_date) ? 'border-orange-300 border-2' : ''
                          }`}
                          onClick={() => handlePaymentDetailsClick(location.id)}
                        >
                          <div className="p-4 border-b bg-muted/10">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-lg truncate">
                                {location.property?.title}
                              </h3>
                              <div className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                Longue durée
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
                              <div className="flex-1">
                                {getPaymentStatusBadge(location.paiement, location.rental_end_date)}
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePaymentDetailsClick(location.id);
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
            
            <TabsContent value="courte_duree">
              <Card>
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Locations Courte Durée en cours
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <p className="text-muted-foreground">Chargement des paiements...</p>
                    </div>
                  ) : filteredLocations.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">Aucune location courte durée en cours</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredLocations.map(location => (
                        <div 
                          key={location.id}
                          className={`border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer bg-white ${
                            isEndingSoon(location.rental_end_date) ? 'border-orange-300 border-2' : ''
                          }`}
                          onClick={() => handlePaymentDetailsClick(location.id)}
                        >
                          <div className="p-4 border-b bg-muted/10">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-lg truncate">
                                {location.property?.title}
                              </h3>
                              <div className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                Courte durée
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
                              <div className="flex-1">
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
                                {isEndingSoon(location.rental_end_date) && (
                                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 ml-1">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Expire bientôt
                                  </Badge>
                                )}
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePaymentDetailsClick(location.id);
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
