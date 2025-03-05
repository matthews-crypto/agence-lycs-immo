
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card"
import { Calendar as CalendarIcon, Home, Info, User, Phone } from "lucide-react"

export default function AppointmentsPage() {
  const { agencySlug } = useParams()
  const { agency } = useAgencyContext()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch reservations for this agency
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['agency-reservations', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return []
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          property:properties(
            id,
            title,
            reference_number,
            zone:zone_id(nom)
          )
        `)
        .eq('agency_id', agency.id)
        .eq('type', 'VISITE')
        .not('appointment_date', 'is', null)
        
      if (error) {
        console.error("Error fetching reservations:", error)
        throw error
      }
      
      return data || []
    },
    enabled: !!agency?.id
  })

  // Function to get reservations for a specific date
  const getReservationsForDate = (date: Date) => {
    if (!reservations) return []
    
    return reservations.filter(reservation => {
      if (!reservation.appointment_date) return false
      const appointmentDate = new Date(reservation.appointment_date)
      return (
        appointmentDate.getDate() === date.getDate() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getFullYear() === date.getFullYear()
      )
    })
  }

  // Current day's reservations
  const currentDayReservations = selectedDate ? getReservationsForDate(selectedDate) : []

  // Highlighted dates for the calendar
  const highlightedDates = reservations?.reduce((dates: Date[], reservation) => {
    if (reservation.appointment_date) {
      dates.push(new Date(reservation.appointment_date))
    }
    return dates
  }, []) || []

  const handleReservationClick = (reservation: any) => {
    setSelectedReservation(reservation)
    setIsDialogOpen(true)
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AgencySidebar />
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">Rendez-vous</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" /> 
                  Calendrier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  locale={fr}
                  modifiers={{
                    highlighted: highlightedDates
                  }}
                  modifiersStyles={{
                    highlighted: {
                      backgroundColor: "rgba(59, 130, 246, 0.1)", 
                      fontWeight: "bold",
                      color: "#2563eb"
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Reservations List */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedDate && (
                    <>Rendez-vous du {format(selectedDate, "dd MMMM yyyy", { locale: fr })}</>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Chargement des rendez-vous...</p>
                ) : currentDayReservations.length > 0 ? (
                  <div className="space-y-4">
                    {currentDayReservations.map((reservation) => (
                      <div 
                        key={reservation.id}
                        className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleReservationClick(reservation)}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <div className="text-sm font-medium text-gray-500">Référence réservation</div>
                            <div>{reservation.reservation_number}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Référence bien</div>
                            <div>{reservation.property?.reference_number || "N/A"}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Zone</div>
                            <div>{reservation.property?.zone?.nom || "N/A"}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          {reservation.appointment_date && (
                            <>Heure: {format(new Date(reservation.appointment_date), "HH:mm", { locale: fr })}</>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Aucun rendez-vous pour cette date.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reservation Details Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Détails du rendez-vous</DialogTitle>
              </DialogHeader>
              
              {selectedReservation && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start gap-2">
                      <Home className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Bien immobilier</div>
                        <Link 
                          to={`/${agencySlug}/properties/${selectedReservation.property?.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedReservation.property?.title || "N/A"}
                        </Link>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Référence bien</div>
                        <div>{selectedReservation.property?.reference_number || "N/A"}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <CalendarIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Référence réservation</div>
                        <Link 
                          to={`/${agencySlug}/agency/prospection`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedReservation.reservation_number}
                        </Link>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Client</div>
                        <div>{selectedReservation.client_name || "Non spécifié"}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Phone className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Numéro client</div>
                        <div>{selectedReservation.client_phone || "Non spécifié"}</div>
                      </div>
                    </div>
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
