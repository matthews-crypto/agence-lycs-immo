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
import { Badge } from "@/components/ui/badge"

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

  useEffect(() => {
    async function fetchAppointmentDates() {
      if (!agency?.id) return
      
      setIsLoading(true)
      
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('appointment_date, property_id, client_phone, status, reservation_number, note_rv, properties(title, id)')
          .eq('agency_id', agency.id)
          .not('appointment_date', 'is', null)

        if (error) {
          console.error('Error fetching appointments:', error)
          return
        }

        const dates = data
          .filter(item => item.appointment_date && 
                 (item.status === 'CONFIRMED' || item.status === 'Visite programmée'))
          .map(item => new Date(item.appointment_date))
        
        setAppointmentDates(dates)
        
        if (selectedDate) {
          loadAppointmentsForDate(selectedDate, data)
        }

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

  const loadAppointmentsForDate = (date: Date, allAppointments?: any[]) => {
    if (!date) return
    
    const selectedDateStr = format(date, 'yyyy-MM-dd')
    console.log('Loading appointments for date:', selectedDateStr)
    
    const appointments = allAppointments || []
    
    const filteredAppointments = appointments.filter(app => {
      if (!app.appointment_date) return false
      const appDate = format(new Date(app.appointment_date), 'yyyy-MM-dd')
      return appDate === selectedDateStr && 
             (app.status === 'CONFIRMED' || app.status === 'Visite programmée')
    })
    
    console.log('Filtered appointments:', filteredAppointments)
    setDateAppointments(filteredAppointments)
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    
    console.log('Selected date:', date)
    setSelectedDate(date)
    loadAppointmentsForDate(date)
  }

  const openAppointmentDetails = async (appointment: any) => {
    setSelectedAppointment(appointment)
    
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
                              <p className="font-medium text-primary">
                                {appointment.properties?.title || "Propriété non spécifiée"}
                              </p>
                              <p className="text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {appointment.client_phone}
                                </span>
                              </p>
                            </div>
                            {renderStatusBadge(appointment.status)}
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
                            <p className="font-medium text-primary">
                              {appointment.properties?.title || "Propriété non spécifiée"}
                            </p>
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
                          {renderStatusBadge(appointment.status)}
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

      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la visite</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedAppointment.properties?.title || "Propriété non spécifiée"}
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
                  <span>
                    Référence: 
                    <a 
                      href={`/${agencySlug}/agency/prospection?reservation=${selectedAppointment.reservation_number}`}
                      className="ml-1 text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {selectedAppointment.reservation_number || "N/A"}
                    </a>
                  </span>
                </div>
                
                {selectedAppointment.note_rv && (
                  <div className="flex gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    <div className="bg-gray-50 p-3 rounded-md w-full">
                      <p className="text-sm font-medium mb-1">Note de visite</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedAppointment.note_rv}</p>
                    </div>
                  </div>
                )}

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
                  <div>Statut: {renderStatusBadge(selectedAppointment.status)}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
