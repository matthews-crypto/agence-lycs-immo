
import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AgencySidebar } from "@/components/agency/AgencySidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon, Home, Info, User, Phone } from "lucide-react"
import { toast } from "sonner"

export default function AppointmentsPage() {
  const { agencySlug } = useParams()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [appointmentDetailsOpen, setAppointmentDetailsOpen] = useState(false)

  // Fetch agency ID from slug
  const { data: agency } = useQuery({
    queryKey: ["agency", agencySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("id")
        .eq("slug", agencySlug)
        .single()

      if (error) {
        toast.error("Erreur lors du chargement de l'agence")
        throw error
      }

      return data
    },
  })

  // Fetch all appointments with reservation and property details
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", agency?.id],
    enabled: !!agency?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_time,
          notes,
          status,
          property_id,
          client_id,
          agent_id,
          properties:property_id (
            id,
            title,
            reference_number,
            address,
            zone_id,
            zone:zone_id (
              nom
            )
          ),
          clients:client_id (
            first_name,
            last_name,
            phone_number
          ),
          reservations (
            id,
            reservation_number,
            client_phone
          )
        `)
        .eq("agency_id", agency.id)

      if (error) {
        toast.error("Erreur lors du chargement des rendez-vous")
        throw error
      }

      return data || []
    },
  })

  // Format appointments by date for calendar highlighting
  const appointmentDates = appointments?.reduce((dates: Record<string, any[]>, appointment) => {
    const dateStr = format(new Date(appointment.appointment_time), "yyyy-MM-dd")
    if (!dates[dateStr]) {
      dates[dateStr] = []
    }
    dates[dateStr].push(appointment)
    return dates
  }, {})

  const appointmentsForSelectedDate = selectedDate 
    ? (appointmentDates?.[format(selectedDate, "yyyy-MM-dd")] || [])
    : []

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment)
    setAppointmentDetailsOpen(true)
  }

  const navigateToPropertyDetails = (propertyId: string) => {
    navigate(`/${agencySlug}/properties/${propertyId}`)
  }

  const navigateToProspection = (reservationId: string) => {
    navigate(`/${agencySlug}/agency/prospection?reservationId=${reservationId}`)
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AgencySidebar />
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">Rendez-vous</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Calendrier</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={fr}
                    modifiers={{
                      highlighted: Object.keys(appointmentDates || {}).map(
                        (date) => new Date(date)
                      ),
                    }}
                    modifiersClassNames={{
                      highlighted: "bg-primary text-primary-foreground font-bold",
                    }}
                    className="mx-auto"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDate
                      ? `Rendez-vous du ${format(selectedDate, "dd MMMM yyyy", { locale: fr })}`
                      : "Sélectionnez une date"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Chargement des rendez-vous...</p>
                  ) : appointmentsForSelectedDate.length > 0 ? (
                    <div className="space-y-4">
                      {appointmentsForSelectedDate.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="p-4 border rounded-lg cursor-pointer hover:bg-muted"
                          onClick={() => handleAppointmentClick(appointment)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              {format(new Date(appointment.appointment_time), "HH:mm")}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              <span>Réf. bien: {appointment.properties?.reference_number || "N/A"}</span>
                            </div>
                            
                            {appointment.reservations && appointment.reservations[0] && (
                              <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <span>Réf. réservation: {appointment.reservations[0].reservation_number}</span>
                              </div>
                            )}
                            
                            {appointment.properties?.zone && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground ml-6">
                                  Zone: {appointment.properties.zone.nom || "N/A"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun rendez-vous pour cette date
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Appointment Details Dialog */}
          <Dialog 
            open={appointmentDetailsOpen} 
            onOpenChange={setAppointmentDetailsOpen}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Détails du rendez-vous</DialogTitle>
              </DialogHeader>
              
              {selectedAppointment && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Informations du bien</h3>
                    <div 
                      className="flex items-center gap-2 text-primary cursor-pointer hover:underline"
                      onClick={() => {
                        setAppointmentDetailsOpen(false)
                        navigateToPropertyDetails(selectedAppointment.properties.id)
                      }}
                    >
                      <Home className="h-4 w-4" />
                      <span>{selectedAppointment.properties?.title || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span>Réf. bien: {selectedAppointment.properties?.reference_number || "N/A"}</span>
                    </div>
                  </div>
                  
                  {selectedAppointment.reservations && selectedAppointment.reservations[0] && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Informations de réservation</h3>
                      <div 
                        className="flex items-center gap-2 text-primary cursor-pointer hover:underline"
                        onClick={() => {
                          setAppointmentDetailsOpen(false)
                          navigateToProspection(selectedAppointment.reservations[0].id)
                        }}
                      >
                        <CalendarIcon className="h-4 w-4" />
                        <span>Réf. réservation: {selectedAppointment.reservations[0].reservation_number}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Informations du client</h3>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedAppointment.clients 
                          ? `${selectedAppointment.clients.first_name || ""} ${selectedAppointment.clients.last_name || ""}`
                          : "Client non enregistré"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedAppointment.clients?.phone_number || 
                         (selectedAppointment.reservations && selectedAppointment.reservations[0]
                          ? selectedAppointment.reservations[0].client_phone
                          : "N/A")}
                      </span>
                    </div>
                  </div>
                  
                  {selectedAppointment.notes && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Notes</h3>
                      <p className="text-sm">{selectedAppointment.notes}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Date et heure</h3>
                    <p>
                      {format(
                        new Date(selectedAppointment.appointment_time),
                        "dd MMMM yyyy 'à' HH:mm",
                        { locale: fr }
                      )}
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SidebarProvider>
  )
}
