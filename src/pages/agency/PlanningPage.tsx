
import { useEffect, useState } from "react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // Function to determine if a date has any rental locations
  const getDayHighlight = (date: Date) => {
    const hasRentals = locations.some(location => {
      if (!location.rental_start_date || !location.rental_end_date) return false;
      
      const startDate = new Date(location.rental_start_date);
      const endDate = new Date(location.rental_end_date);
      return date >= startDate && date <= endDate;
    });

    return hasRentals ? "bg-blue-100 rounded-md" : "";
  };

  // Function to get all locations for a specific date
  const getLocationsForDate = (date: Date) => {
    return locations.filter(location => {
      if (!location.rental_start_date || !location.rental_end_date) return false;
      
      const startDate = new Date(location.rental_start_date);
      const endDate = new Date(location.rental_end_date);
      return date >= startDate && date <= endDate;
    });
  };

  // Function to display locations when a date is selected
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const locationsForDate = getLocationsForDate(date);
    console.log(`Locations for ${format(date, 'dd/MM/yyyy')}:`, locationsForDate);
    
    if (locationsForDate.length === 0) {
      toast.info(`Aucune location pour le ${format(date, 'dd/MM/yyyy')}`);
    }
  };

  // Custom modifiers for the calendar
  const modifiers = {
    rental: (date: Date) => {
      return locations.some(location => {
        if (!location.rental_start_date || !location.rental_end_date) return false;
        
        const startDate = new Date(location.rental_start_date);
        const endDate = new Date(location.rental_end_date);
        return date >= startDate && date <= endDate;
      });
    }
  };

  const modifiersStyles = {
    rental: {
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderRadius: '0',
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-8 overflow-auto">
          <h1 className="text-2xl font-bold mb-6">Planning des Locations</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Calendrier des locations</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar 
                  mode="single"
                  onSelect={handleDateSelect}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  className="p-3 pointer-events-auto border rounded-lg"
                />
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
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
                      <div key={location.id} className="border p-4 rounded-lg">
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
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
