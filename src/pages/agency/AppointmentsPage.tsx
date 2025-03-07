
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { AgencySidebar } from "@/components/agency/AgencySidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Calendar } from "@/components/ui/calendar"
import { supabase } from "@/integrations/supabase/client"
import { useAgencyContext } from "@/contexts/AgencyContext"
import { format, isBefore, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Loader2, Clock, Phone, MapPin, FileText, User } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export default function AppointmentsPage() {
  const { agencySlug } = useParams()
  const { agency } = useAgencyContext()
  const [appointmentDates, setAppointmentDates] = useState<Date[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dateAppointments, setDateAppointments] = useState<any[]>([])
  const [pastAppointments, setPastAppointments] = useState<any[]>([])
  const isMobile = useIsMobile()
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>("upcoming")

  // Fetch all appointment dates for the agency
  useEffect(() => {
    async function fetchAppointmentDates() {
      if (!agency?.id) return
      
      setIsLoading(true)
      
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('appointment_date, property_id, client_phone, status, reservation_number, properties(title, id)')
          .eq('agency_id', agency.id)
          .not('appointment_date', 'is', null)

        if (error) {
          console.error('Error fetching appointments:', error)
          return
        }

        // Extract dates from the response
        const dates = data
          .filter(item => item.appointment_date && item.status === 'CONFIRMED')
          .map(item => new Date(item.appointment_date))
        
        setAppointmentDates(dates)
        
        // If we have a selected date, load appointments for that date
        if (selectedDate) {
          loadAppointmentsForDate(selectedDate, data)
        }

        // Fetch past appointments for history tab
        const today = startOfDay(new Date())
        const past = data.filter(app => {
          if (!app.appointment_date) return false
          const appDate = new Date(app.appointment_date)
          return isBefore(appDate, today)
        })
        
        setPastAppointments(past)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointmentDates()
  }, [agency?.id, selectedDate])

  // Load appointments for a specific date
  const loadAppointmentsForDate = (date: Date, allAppointments?: any[]) => {
    if (!date) return
    
    const selectedDateStr = format(date, 'yyyy-MM-dd')
    console.log('Loading appointments for date:', selectedDateStr)
    
    // Use the fetched data if available, otherwise use the state
    const appointments = allAppointments || []
    
    const filteredAppointments = appointments.filter(app => {
      if (!app.appointment_date) return false
      const appDate = format(new Date(app.appointment_date), 'yyyy-MM-dd')
      // Only show confirmed appointments in the main calendar view
      return appDate === selectedDateStr && app.status === 'CONFIRMED'
    })
    
    console.log('Filtered appointments:', filteredAppointments)
    setDateAppointments(filteredAppointments)
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    
    console.log('Selected date:', date)
    setSelectedDate(date)
    loadAppointmentsForDate(date)
  }

  // Open appointment details dialog and fetch client info
  const openAppointmentDetails = async (appointment: any) => {
    setSelectedAppointment(appointment)
    
    // Fetch client information based on the phone number
    if (appointment.client_phone) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('first_name, last_name, phone_number')
          .eq('phone_number', appointment.client_phone)
          .single()
        
        if (error) {
          console.error('Error fetching client info:', error)
          return
        }
        
        if (data) {
          setClientInfo(data)
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AgencySidebar />
        <div className="flex-1 p-4 md:p-8">
          <h1 className="text-2xl font-bold mb-4">Rendez-vous</h1>
          
          <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
              <TabsTrigger value="upcoming">Visites à venir</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4">
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <CalendarIcon className="h-5 w-5" />
                      <span>Calendrier des visites</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-center md:justify-start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        locale={fr}
                        className="rounded-md border p-2 pointer-events-auto w-full max-w-[350px]"
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
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg md:text-xl">
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
                            className="p-3 border rounded-md flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => openAppointmentDetails(appointment)}
                          >
                            <div>
                              <a 
                                href={`/${agencySlug}/agency/property/${appointment.property_id}`}
                                className="font-medium text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {appointment.properties?.title || "Propriété non spécifiée"}
                              </a>
                              <p className="text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {appointment.client_phone}
                                </span>
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
            </TabsContent>

            <TabsContent value="history" className="w-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Clock className="h-5 w-5" />
                    <span>Visites passées</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : pastAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {pastAppointments.map((appointment, index) => (
                        <div 
                          key={index} 
                          className="p-3 border rounded-md flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => openAppointmentDetails(appointment)}
                        >
                          <div>
                            <a 
                              href={`/${agencySlug}/agency/property/${appointment.property_id}`}
                              className="font-medium text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {appointment.properties?.title || "Propriété non spécifiée"}
                            </a>
                            <p className="text-sm text-gray-500 flex flex-col mt-1">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {appointment.client_phone}
                              </span>
                              <span className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {appointment.appointment_date && 
                                  format(new Date(appointment.appointment_date), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status === 'PENDING' ? 'En attente' :
                            appointment.status === 'CONFIRMED' ? 'Confirmé' :
                            appointment.status === 'COMPLETED' ? 'Terminé' :
                            appointment.status === 'CANCELLED' ? 'Annulé' :
                            appointment.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Aucune visite passée trouvée</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la visite</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  <a 
                    href={`/${agencySlug}/agency/property/${selectedAppointment.property_id}`}
                    className="text-primary hover:underline"
                  >
                    {selectedAppointment.properties?.title || "Propriété non spécifiée"}
                  </a>
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedAppointment.appointment_date && 
                      format(new Date(selectedAppointment.appointment_date), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Référence: {selectedAppointment.reservation_number || "N/A"}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Réserviste: {clientInfo ? 
                      `${clientInfo.first_name || ''} ${clientInfo.last_name || ''}`.trim() || 'Non spécifié' 
                      : 'Chargement...'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Téléphone: {selectedAppointment.client_phone}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedAppointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    selectedAppointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedAppointment.status === 'PENDING' ? 'En attente' :
                    selectedAppointment.status === 'CONFIRMED' ? 'Confirmé' :
                    selectedAppointment.status}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
