
import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { AgencySidebar } from "@/components/agency/AgencySidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAgencyContext } from "@/contexts/AgencyContext"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar as CalendarIcon, MapPin, User, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface AppointmentDay {
  date: Date
  appointments: AppointmentData[]
}

interface AppointmentData {
  id: string
  reservation_number: string
  property_id: string
  property_reference: string
  property_title: string
  property_zone: string
  client_name: string
  client_phone: string
  appointment_date: string
}

export default function AppointmentsPage() {
  const { agencySlug } = useParams()
  const { agency } = useAgencyContext()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [appointmentDays, setAppointmentDays] = useState<AppointmentDay[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Récupérer les rendez-vous de l'agence
  const { isLoading, error } = useQuery({
    queryKey: ["appointments", agency?.id],
    queryFn: async () => {
      if (!agency?.id) return []

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id, 
          reservation_number, 
          appointment_date, 
          client_phone,
          property_id, 
          properties(id, reference_number, title, zone_id, zone(nom))
        `)
        .eq("agency_id", agency.id)
        .not("appointment_date", "is", null)
        .order("appointment_date", { ascending: true })

      if (error) {
        console.error("Error fetching appointments:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les rendez-vous",
          variant: "destructive",
        })
        throw error
      }

      // Transforme les données en format AppointmentData
      const appointments: AppointmentData[] = data.map((reservation) => ({
        id: reservation.id,
        reservation_number: reservation.reservation_number,
        property_id: reservation.property_id,
        property_reference: reservation.properties?.reference_number || "N/A",
        property_title: reservation.properties?.title || "Propriété sans titre",
        property_zone: reservation.properties?.zone?.nom || "Zone inconnue",
        client_name: "Client", // Pas d'informations sur le client dans la table reservations
        client_phone: reservation.client_phone || "N/A",
        appointment_date: reservation.appointment_date,
      }))

      // Regroupe les rendez-vous par date
      const days: { [key: string]: AppointmentDay } = {}
      appointments.forEach((appointment) => {
        if (!appointment.appointment_date) return

        const date = new Date(appointment.appointment_date)
        const dateKey = format(date, "yyyy-MM-dd")

        if (!days[dateKey]) {
          days[dateKey] = {
            date,
            appointments: [],
          }
        }

        days[dateKey].appointments.push(appointment)
      })

      const appointmentDaysArray = Object.values(days)
      setAppointmentDays(appointmentDaysArray)
      return appointmentDaysArray
    },
    enabled: !!agency?.id,
  })

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  const handleAppointmentClick = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment)
    setIsDialogOpen(true)
  }

  // Récupère les rendez-vous pour la date sélectionnée
  const appointmentsForSelectedDate = appointmentDays.find(
    (day) => selectedDate && format(day.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
  )?.appointments || []

  // Définit les dates qui ont des rendez-vous pour les mettre en surbrillance dans le calendrier
  const datesWithAppointments = appointmentDays.map((day) => day.date)
  
  // Fonction pour styliser le jour du calendrier avec le nombre de rendez-vous
  const getDayContent = (day: Date) => {
    const matchingDay = appointmentDays.find(
      (appDay) => format(appDay.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    )
    
    if (matchingDay && matchingDay.appointments.length > 0) {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {day.getDate()}
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center"
          >
            {matchingDay.appointments.length}
          </Badge>
        </div>
      )
    }
    
    return day.getDate()
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AgencySidebar />
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">Rendez-vous</h1>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Calendrier des rendez-vous
                </CardTitle>
                <CardDescription>
                  Sélectionnez une date pour voir les rendez-vous programmés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={fr}
                  className="rounded-md border"
                  modifiers={{
                    appointment: datesWithAppointments
                  }}
                  modifiersStyles={{
                    appointment: { 
                      backgroundColor: "rgba(59, 130, 246, 0.1)", 
                      fontWeight: "bold",
                      border: "1px solid rgba(59, 130, 246, 0.5)",
                      borderRadius: "4px"
                    }
                  }}
                  components={{
                    DayContent: ({ date }) => getDayContent(date)
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Rendez-vous du {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: fr }) : "jour"}
                </CardTitle>
                <CardDescription>
                  {appointmentsForSelectedDate.length 
                    ? `${appointmentsForSelectedDate.length} rendez-vous programmés`
                    : "Aucun rendez-vous programmé pour cette date"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Chargement des rendez-vous...</p>
                ) : error ? (
                  <p className="text-red-500">Erreur lors du chargement des rendez-vous</p>
                ) : (
                  <div className="space-y-4">
                    {appointmentsForSelectedDate.length === 0 ? (
                      <p className="text-gray-500 italic">Aucun rendez-vous à afficher pour cette date</p>
                    ) : (
                      appointmentsForSelectedDate.map((appointment) => (
                        <div 
                          key={appointment.id}
                          onClick={() => handleAppointmentClick(appointment)}
                          className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{appointment.property_title}</p>
                              <p className="text-sm text-gray-500">Ref: {appointment.property_reference}</p>
                              <div className="flex items-center text-sm text-gray-500 mt-2">
                                <MapPin className="h-4 w-4 mr-1" />
                                {appointment.property_zone}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.appointment_date && 
                                format(new Date(appointment.appointment_date), "HH:mm", { locale: fr })}
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-blue-600">Réservation: {appointment.reservation_number}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dialog pour afficher les détails d'un rendez-vous */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Détails du rendez-vous</DialogTitle>
              </DialogHeader>
              
              {selectedAppointment && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">
                      <Link 
                        to={`/${agencySlug}/properties/${selectedAppointment.property_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedAppointment.property_title}
                      </Link>
                    </h3>
                    <p className="text-sm">Référence bien: {selectedAppointment.property_reference}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Réservation</h4>
                    <p className="text-sm">
                      <Link 
                        to={`/${agencySlug}/agency/prospection`} 
                        className="text-blue-600 hover:underline"
                        state={{ openReservation: selectedAppointment.id }}
                      >
                        {selectedAppointment.reservation_number}
                      </Link>
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Client</h4>
                    <p className="text-sm flex items-center">
                      <User className="h-4 w-4 mr-2" /> {selectedAppointment.client_name}
                    </p>
                    <p className="text-sm flex items-center mt-1">
                      <Phone className="h-4 w-4 mr-2" /> {selectedAppointment.client_phone}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Date et heure</h4>
                    <p className="text-sm flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {selectedAppointment.appointment_date && 
                        format(new Date(selectedAppointment.appointment_date), "PPP 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Lieu</h4>
                    <p className="text-sm flex items-center">
                      <MapPin className="h-4 w-4 mr-2" /> {selectedAppointment.property_zone}
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
