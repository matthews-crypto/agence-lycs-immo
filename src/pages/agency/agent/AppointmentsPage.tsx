import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useAgencyContext } from "@/contexts/AgencyContext"
import { Calendar } from "@/components/ui/calendar"
import { format, startOfDay, isBefore } from "date-fns"
import { fr } from "date-fns/locale"
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card"
import { 
  CalendarIcon, Loader2, Clock, Phone, User 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AgentAppointmentsPage() {
  const { agencySlug } = useParams()
  const { agency } = useAgencyContext()
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [appointmentDates, setAppointmentDates] = useState<Date[]>([])
  const [dateAppointments, setDateAppointments] = useState<any[]>([])

  useEffect(() => {
    if (agency?.id) {
      fetchAppointments()
    }
  }, [agency?.id])

  const fetchAppointments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('appointment_date, property_id, client_phone, status, reservation_number, properties(title, id)')
        .eq('agency_id', agency.id)
        .not('appointment_date', 'is', null)

      if (error) throw error

      // Consider both 'CONFIRMED' and 'Visite programmée' as valid appointments
      const validAppointments = data.filter(item => 
        item.appointment_date && 
        (item.status === 'CONFIRMED' || item.status === 'Visite programmée')
      )
      
      setAppointments(validAppointments)
      
      // Extract dates for the calendar
      const dates = validAppointments.map(item => new Date(item.appointment_date))
      setAppointmentDates(dates)
      
      if (selectedDate) {
        loadAppointmentsForDate(selectedDate, validAppointments)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAppointmentsForDate = (date: Date, allAppointments?: any[]) => {
    if (!date) return
    
    const selectedDateStr = format(date, 'yyyy-MM-dd')
    const appointmentsToFilter = allAppointments || appointments
    
    const filteredAppointments = appointmentsToFilter.filter(app => {
      if (!app.appointment_date) return false
      const appDate = format(new Date(app.appointment_date), 'yyyy-MM-dd')
      return appDate === selectedDateStr
    })
    
    setDateAppointments(filteredAppointments)
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
    loadAppointmentsForDate(date)
  }

  const renderStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "success" | "destructive" | "outline" = "default";
    let label = status;

    if (status === 'PENDING') {
      variant = "secondary";
      label = 'En attente';
    } else if (status === 'CONFIRMED') {
      variant = "success";
      label = 'Confirmé';
    } else if (status === 'Visite programmée') {
      variant = "success";
      label = 'Visite programmée';
    } else if (status === 'COMPLETED') {
      variant = "default";
      label = 'Terminé';
    } else if (status === 'CANCELLED') {
      variant = "destructive";
      label = 'Annulé';
    }

    return <Badge variant={variant}>{label}</Badge>;
  }

  const isPastDate = (date: string) => {
    const appointmentDate = new Date(date)
    return isBefore(appointmentDate, startOfDay(new Date()))
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Mes Visites</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Calendrier des visites</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={fr}
              className="rounded-md border p-2 w-full max-w-[350px] mx-auto"
              modifiers={{
                appointment: appointmentDates
              }}
              modifiersStyles={{
                appointment: { 
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderColor: 'rgb(59, 130, 246)',
                  color: 'rgb(59, 130, 246)' 
                }
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate && `Visites du ${format(selectedDate, 'dd MMMM yyyy', { locale: fr })}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dateAppointments.length > 0 ? (
              <div className="space-y-3">
                {dateAppointments.map((appointment, index) => (
                  <div 
                    key={index} 
                    className="p-3 border rounded-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-primary">
                        {appointment.properties?.title || "Propriété non spécifiée"}
                      </p>
                      {renderStatusBadge(appointment.status)}
                    </div>
                    <div className="text-sm text-gray-500 flex flex-col gap-1">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {appointment.client_phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {appointment.appointment_date && 
                          format(new Date(appointment.appointment_date), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                      {isPastDate(appointment.appointment_date) && (
                        <span className="text-xs italic text-amber-600 mt-1">
                          Cette visite est passée
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune visite programmée pour cette date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
