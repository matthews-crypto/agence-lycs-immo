
import { useEffect, useState } from "react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

type LocationData = {
  id: string;
  rental_start_date: string;
  rental_end_date: string;
  property: {
    title: string;
    reference_number: string;
  };
  client: {
    first_name: string;
    last_name: string;
  };
};

export default function PlanningPage() {
  const { agency } = useAgencyContext();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
            property:properties(title, reference_number),
            client:clients(first_name, last_name)
          `)
          .not("rental_start_date", "is", null)
          .not("rental_end_date", "is", null)
          .eq("statut", "EN COURS")
          .order("rental_start_date", { ascending: true });

        if (error) {
          throw error;
        }

        console.log("Fetched locations:", data);
        setLocations(data as LocationData[]);
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error("Erreur lors du chargement des locations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [agency?.id]);

  const handleLocationClick = (locationId: string) => {
    navigate(`/${agency?.slug}/agency/planning/${locationId}`);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-8 overflow-auto">
          <h1 className="text-2xl font-bold mb-6">Planning des Locations</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Locations actives</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Chargement...</p>
              ) : locations.length === 0 ? (
                <p>Aucune location en cours</p>
              ) : (
                <div className="space-y-4">
                  {locations.map(location => (
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
        </main>
      </div>
    </SidebarProvider>
  );
}
