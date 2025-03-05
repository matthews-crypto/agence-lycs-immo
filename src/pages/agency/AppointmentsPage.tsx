
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, Home, Clock, User } from "lucide-react";

// Define the appointment type
type Appointment = {
  id: string;
  property_id: string;
  property_title: string;
  appointment_date: string;
  client_name: string;
  start_time: string;
  property_address?: string;
};

export default function AgencyAppointmentsPage() {
  const { agency } = useAgencyContext();
  const { session } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedAppointments, setSelectedAppointments] = useState<Appointment[]>([]);

  // Fetch appointments when the component mounts
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!agency) return;

      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            property_id,
            appointment_time,
            status,
            notes,
            agent_id,
            client_id,
            properties(title, address),
            clients(first_name, last_name)
          `)
          .eq('agency_id', agency.id);

        if (error) {
          console.error('Error fetching appointments:', error);
          return;
        }

        if (!data) {
          console.log('No appointments found');
          return;
        }

        // Transform the data to match our Appointment type
        const formattedAppointments = data.map(item => {
          // Format appointment date and time
          const appointmentDateTime = new Date(item.appointment_time);
          
          return {
            id: item.id,
            property_id: item.property_id,
            property_title: item.properties?.title || 'Propriété inconnue',
            property_address: item.properties?.address,
            appointment_date: format(appointmentDateTime, 'yyyy-MM-dd'),
            client_name: item.clients ? `${item.clients.first_name} ${item.clients.last_name}` : 'Client inconnu',
            start_time: format(appointmentDateTime, 'HH:mm'),
          };
        });

        setAppointments(formattedAppointments);
        if (date) {
          filterAppointmentsByDate(date, formattedAppointments);
        }
      } catch (error) {
        console.error('Error in appointment fetching:', error);
      }
    };

    fetchAppointments();
  }, [agency]);

  // Filter appointments by selected date
  const filterAppointmentsByDate = (selectedDate: Date, appointmentList = appointments) => {
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const filtered = appointmentList.filter(
      appointment => appointment.appointment_date === formattedDate
    );
    setSelectedAppointments(filtered);
  };

  // Handle date change in calendar
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      filterAppointmentsByDate(newDate);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Rendez-vous de l'agence</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calendrier</CardTitle>
            <CardDescription>Sélectionnez une date pour voir les rendez-vous</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              locale={fr}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              Rendez-vous du {date ? format(date, 'dd MMMM yyyy', { locale: fr }) : ''}
            </CardTitle>
            <CardDescription>
              {selectedAppointments.length 
                ? `${selectedAppointments.length} rendez-vous programmés` 
                : 'Aucun rendez-vous programmé pour cette date'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun rendez-vous n'est programmé pour cette date.
              </div>
            ) : (
              <div className="space-y-4">
                {selectedAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{appointment.property_title}</h3>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{appointment.start_time}</span>
                      </div>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.client_name}</span>
                      </div>
                      
                      {appointment.property_address && (
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.property_address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
