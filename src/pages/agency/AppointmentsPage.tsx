
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { AgencySidebar } from "@/components/agency/AgencySidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Calendar } from "@/components/ui/calendar"
import { supabase } from "@/integrations/supabase/client"
import { useAgencyContext } from "@/contexts/AgencyContext"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, ArrowRight } from "lucide-react"

export default function AppointmentsPage() {
  const { agencySlug } = useParams()
  const { agency } = useAgencyContext()
  const [appointmentDates, setAppointmentDates] = useState<Date[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dateAppointments, setDateAppointments] = useState<any[]>([])

  // Fetch all appointment dates for the agency
  useEffect(() => {
    async function fetchAppointmentDates() {
      if (!agency?.id) return
      
      setIsLoading(true)
      
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('appointment_date, property_id, client_phone, status, properties(title)')
          .eq('agency_id', agency.id)
          .not('appointment_date', 'is', null)

        if (error) {
          console.error('Error fetching appointments:', error)
          return
        }

        // Extract dates from the response
        const dates = data
          .filter(item => item.appointment_date)
          .map(item => new Date(item.appointment_date))
        
        setAppointmentDates(dates)
        
        // If we have a selected date, load appointments for that date
        if (selectedDate) {
          loadAppointmentsForDate(selectedDate, data)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointmentDates()
  }, [agency?.id])

  // Load appointments for a specific date
  const loadAppointmentsForDate = (date: Date, allAppointments?: any[]) => {
    const selectedDateStr = format(date, 'yyyy-MM-dd')
    
    const appointmentsData = allAppointments || appointmentDates
    
    const filteredAppointments = Array.isArray(allAppointments) 
      ? allAppointments.filter(app => {
          if (!app.appointment_date) return false
          const appDate = format(new Date(app.appointment_date), 'yyyy-MM-dd')
          return appDate === selectedDateStr
        })
      : []
    
    setDateAppointments(filteredAppointments)
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    
    setSelectedDate(date)
    loadAppointmentsForDate(date)
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AgencySidebar />
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">Rendez-vous</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  <span>Calendrier des visites</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={fr}
                  className="rounded-md border p-3 pointer-events-auto"
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
                <CardTitle className="flex items-center">
                  {selectedDate && `Visites du ${format(selectedDate, 'dd MMMM yyyy', { locale: fr })}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Chargement des rendez-vous...</p>
                ) : dateAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {dateAppointments.map((appointment, index) => (
                      <div key={index} className="p-3 border rounded-md flex items-center justify-between">
                        <div>
                          <p className="font-medium">{appointment.properties?.title || "Propriété non spécifiée"}</p>
                          <p className="text-sm text-gray-500">
                            Client: {appointment.client_phone}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status === 'PENDING' ? 'En attente' :
                          appointment.status === 'CONFIRMED' ? 'Confirmé' :
                          appointment.status}
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
      </div>
    </SidebarProvider>
  )
}
