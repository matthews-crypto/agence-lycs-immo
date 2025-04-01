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
import { Search, ShoppingBag, User, Home, MapPin, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SaleData = {
  id: string;
  rental_start_date: string | null;
  property: {
    id: string;
    title: string;
    reference_number: string;
    address: string | null;
    price: number;
    property_type: string;
  };
  client: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string | null;
  };
  created_at: string;
  statut: string;
};

export default function SalesPage() {
  const { agency } = useAgencyContext();
  const [sales, setSales] = useState<SaleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [timeFilter, setTimeFilter] = useState<string>("all");

  useEffect(() => {
    if (!agency?.id) return;

    const fetchSales = async () => {
      setIsLoading(true);
      try {
        // Récupérer les ventes (locations sans date de fin)
        const { data, error } = await supabase
          .from('locations')
          .select(`
            id,
            rental_start_date,
            statut,
            created_at,
            property:property_id (
              id,
              title,
              reference_number,
              address,
              price,
              property_type
            ),
            client:client_id (
              id,
              first_name,
              last_name,
              phone_number,
              email
            )
          `)
          .is('rental_end_date', null)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Conversion sécurisée pour éviter les erreurs de type
        const salesData = data as unknown as SaleData[];
        setSales(salesData);
      } catch (error) {
        console.error("Error fetching sales:", error);
        toast.error("Erreur lors du chargement des ventes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSales();
  }, [agency?.id]);

  // Filtrer les ventes en fonction des critères
  const filteredSales = useMemo(() => {
    if (!sales) return [];

    // Filtrer par terme de recherche et type de propriété
    let filtered = sales.filter(sale => {
      // Filtrer par type de propriété
      if (propertyTypeFilter !== "all" && sale.property?.property_type) {
        if (propertyTypeFilter !== sale.property.property_type) {
          return false;
        }
      }
      
      // Filtrer par terme de recherche
      if (searchTerm === "") return true;

      const searchLower = searchTerm.toLowerCase();
      
      // Recherche dans le titre du bien
      const titleMatch = sale.property?.title?.toLowerCase().includes(searchLower);
      
      // Recherche dans le nom du client
      const clientNameMatch = `${sale.client?.first_name} ${sale.client?.last_name}`.toLowerCase().includes(searchLower);
      
      // Recherche dans la référence du bien
      const referenceMatch = sale.property?.reference_number?.toLowerCase().includes(searchLower);
      
      // Recherche dans le numéro de téléphone du client
      const phoneMatch = sale.client?.phone_number?.toLowerCase().includes(searchLower);
      
      // Recherche dans l'adresse du bien
      const addressMatch = sale.property?.address?.toLowerCase().includes(searchLower);
      
      return titleMatch || clientNameMatch || referenceMatch || phoneMatch || addressMatch;
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
      
      filtered = filtered.filter(sale => {
        const createdAt = new Date(sale.created_at);
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
  }, [sales, searchTerm, propertyTypeFilter, timeFilter, sortOrder]);

  // Obtenir la liste unique des types de propriétés pour le filtre
  const propertyTypes = useMemo(() => {
    const types = new Set<string>();
    
    sales.forEach(sale => {
      if (sale.property?.property_type) {
        types.add(sale.property.property_type);
      }
    });
    
    return Array.from(types);
  }, [sales]);

  const handleSaleClick = (saleId: string) => {
    navigate(`/${agency?.slug}/agency/sales/${saleId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(price) + ' FCFA';
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <h1 className="text-2xl font-bold mb-4 md:mb-6">Gestion des Ventes</h1>
          
          <div className="mb-6 space-y-4 bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-3">Recherche et filtres</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="search" 
                  placeholder="Rechercher par client, bien, référence..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  value={propertyTypeFilter}
                  onChange={(e) => setPropertyTypeFilter(e.target.value)}
                >
                  <option value="all">Tous types de biens</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
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
          </div>
          
          <Card>
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Liste des ventes ({filteredSales.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-muted-foreground">Chargement des ventes...</p>
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">Aucune vente trouvée</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSales.map(sale => (
                    <div 
                      key={sale.id} 
                      className="border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer bg-white flex flex-col"
                      onClick={() => handleSaleClick(sale.id)}
                    >
                      <div className="p-4 border-b bg-muted/10">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-lg truncate">
                            {sale.property?.title}
                          </h3>
                          <Badge className="bg-green-100 text-green-800">
                            Vente
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Réf: {sale.property?.reference_number}
                        </p>
                      </div>
                      
                      <div className="p-4 flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {sale.client?.first_name} {sale.client?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {sale.client?.phone_number || 'Non spécifié'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          <div className="flex items-start gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                            <span className="font-medium">{formatPrice(sale.property?.price || 0)}</span>
                          </div>
                          
                          {sale.property?.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                              <span className="line-clamp-2">{sale.property.address}</span>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-2">
                            <Home className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                            <span>{sale.property?.property_type || 'Non spécifié'}</span>
                          </div>
                          
                          {sale.rental_start_date && (
                            <div className="flex items-start gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                              <span>Date: {format(new Date(sale.rental_start_date), 'dd/MM/yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Vendu le {format(new Date(sale.created_at), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
