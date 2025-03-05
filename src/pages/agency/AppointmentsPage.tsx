
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Appointment {
  id: string;
  appointment_time: string;
  property: {
    title: string;
    address: string;
    region: string;
  };
  client: {
    first_name: string;
    last_name: string;
  };
}

export default function AppointmentsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { agency } = useAgencyContext();

  // Fetch appointments for the agency
  useEffect(() => {
    if (!agency?.id) return;

    const fetchAppointments = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("appointments")
          .select(`
            id,
            appointment_time,
            property:properties(
              title,
              address,
              region
            ),
            client:clients(
              first_name,
              last_name
            )
          `)
          .eq("agency_id", agency.id);

        if (error) {
          throw error;
        }

        setAppointments(data as any);
      } catch (error: any) {
        console.error("Error fetching appointments:", error);
        toast.error("Erreur lors du chargement des rendez-vous");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [agency?.id]);

  // Group appointments by date
  const getAppointmentsForDate = (selectedDate: Date) => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.appointment_time);
      return format(appointmentDate, "yyyy-MM-dd") === formattedDate;
    });
  };

  const appointmentsForSelectedDate = date ? getAppointmentsForDate(date) : [];

  return (
    <div className="flex h-screen">
      <AgencySidebar />
      <div className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-8">Rendez-vous</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Calendrier</CardTitle>
              <CardDescription>Sélectionnez une date pour voir les rendez-vous</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>
                {date ? format(date, "d MMMM yyyy") : "Tous les rendez-vous"}
              </CardTitle>
              <CardDescription>
                {appointmentsForSelectedDate.length} rendez-vous trouvés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : appointmentsForSelectedDate.length > 0 ? (
                <div className="space-y-4">
                  {appointmentsForSelectedDate.map((appointment) => {
                    const appointmentTime = new Date(appointment.appointment_time);
                    
                    return (
                      <Card key={appointment.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-lg">{appointment.property?.title || "Propriété non spécifiée"}</h3>
                            <p className="text-sm text-muted-foreground">
                              Client: {appointment.client?.first_name || "Non spécifié"} {appointment.client?.last_name || ""}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{format(appointmentTime, "HH:mm")}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {appointment.property?.address || "Adresse non spécifiée"}, {appointment.property?.region || ""}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  Aucun rendez-vous programmé pour cette date
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
