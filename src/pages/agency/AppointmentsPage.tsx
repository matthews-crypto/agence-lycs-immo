
import { useParams } from "react-router-dom"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { AgencySidebar } from "@/components/agency/AgencySidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

interface Reservation {
  id: string
  appointment_date: string
  client_phone: string
  reservation_number: string
  property: {
    reference_number: string
  }
}

export default function AppointmentsPage() {
  const { agencySlug } = useParams()
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['agency-appointments', agencySlug],
    queryFn: async () => {
      console.log("Fetching agency appointments for agency:", agencySlug)
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          appointment_date,
          client_phone,
          reservation_number,
          property:property_id (
            reference_number
          )
        `)
        .not('appointment_date', 'is', null)
      
      if (error) {
        console.error("Error fetching reservations:", error)
        throw error
      }
      
      console.log("Fetched reservations:", data)
      return data as Reservation[]
    }
  })

  const handleDayClick = (date: Date) => {
    const formattedClickedDate = format(date, 'yyyy-MM-dd')
    console.log("Clicked date:", formattedClickedDate)
    setSelectedDate(date)
    
    const reservation = reservations.find(
      (r) => r.appointment_date && 
      format(new Date(r.appointment_date), 'yyyy-MM-dd') === formattedClickedDate
    )
    
    if (reservation) {
      setSelectedReservation(reservation)
      setIsDialogOpen(true)
    }
  }

  const getDayClassName = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd')
    
    const hasAppointment = reservations.some(
      (r) => r.appointment_date && 
      format(new Date(r.appointment_date), 'yyyy-MM-dd') === formattedDate
    )
    
    return hasAppointment ? 'bg-primary text-primary-foreground rounded-full font-bold' : ''
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AgencySidebar />
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">Rendez-vous</h1>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Chargement des rendez-vous...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Aucun rendez-vous n'a été programmé.</p>
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-4">
                <p>Total des rendez-vous:</p>
                <Badge variant="default">{reservations.length}</Badge>
              </div>
              
              <div className="bg-card rounded-lg border p-4">
                <Calendar 
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && handleDayClick(date)}
                  locale={fr}
                  className="rounded-md"
                  components={{
                    Day: ({ day, ...props }) => {
                      const customClass = getDayClassName(day)
                      return (
                        <button
                          {...props}
                          className={`${props.className || ''} ${customClass}`}
                        />
                      )
                    }
                  }}
                />
              </div>
            </div>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Détails du rendez-vous</DialogTitle>
              </DialogHeader>
              {selectedReservation && (
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Date:</p>
                    <p>{format(new Date(selectedReservation.appointment_date), 'PPP', { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="font-medium">Numéro de téléphone du client:</p>
                    <p>{selectedReservation.client_phone}</p>
                  </div>
                  <div>
                    <p className="font-medium">Référence du bien:</p>
                    <p>{selectedReservation.property?.reference_number || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Numéro de réservation:</p>
                    <p>{selectedReservation.reservation_number}</p>
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
