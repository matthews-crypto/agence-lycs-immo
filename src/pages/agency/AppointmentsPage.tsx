
import { useParams } from "react-router-dom"
import { AgencySidebar } from "@/components/agency/AgencySidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

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

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['agency-appointments', agencySlug],
    queryFn: async () => {
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
    
    // Find reservation that matches the clicked date
    const reservation = reservations.find(
      (r) => r.appointment_date && 
      format(new Date(r.appointment_date), 'yyyy-MM-dd') === formattedClickedDate
    )
    
    console.log("Found reservation:", reservation)
    
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
    
    return hasAppointment ? 'bg-primary text-primary-foreground rounded-full cursor-pointer' : ''
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AgencySidebar />
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">Rendez-vous</h1>
          
          {isLoading ? (
            <p>Chargement des rendez-vous...</p>
          ) : reservations.length === 0 ? (
            <div className="text-center py-10">
              <p>Aucun rendez-vous n'a été programmé.</p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="mb-4">Total des rendez-vous: <Badge variant="default">{reservations.length}</Badge></p>
              <Calendar 
                mode="single"
                onDayClick={handleDayClick}
                modifiersClassNames={{
                  selected: 'bg-primary text-primary-foreground'
                }}
                className="rounded-md border shadow-sm max-w-full pointer-events-auto"
                components={{
                  Day: ({ date, ...props }: { date: Date } & React.HTMLAttributes<HTMLDivElement>) => (
                    <div
                      {...props}
                      className={`${props.className || ''} ${getDayClassName(date)}`}
                    />
                  )
                }}
              />
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
                    <p>{format(new Date(selectedReservation.appointment_date), 'PPP')}</p>
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
