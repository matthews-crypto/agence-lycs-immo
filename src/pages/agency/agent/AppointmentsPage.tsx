
import { useParams } from "react-router-dom"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
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

export default function AgentAppointmentsPage() {
  const { agencySlug } = useParams()
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['agent-appointments', agencySlug],
    queryFn: async () => {
      console.log("Fetching agent appointments for agency:", agencySlug)
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
      
      console.log("Fetched agent reservations:", data)
      console.log("Sample appointment date format:", data?.[0]?.appointment_date)
      return data as Reservation[]
    }
  })

  const handleDayClick = (date: Date) => {
    const formattedClickedDate = format(date, 'yyyy-MM-dd')
    console.log("Clicked date:", formattedClickedDate)
    setSelectedDate(date)
    
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
    
    return hasAppointment ? 'bg-primary text-primary-foreground rounded-full font-bold' : ''
  }

  console.log("Calendar rendering with:", {
    isLoading,
    reservationsCount: reservations.length,
    reservationDates: reservations.map(r => r.appointment_date ? format(new Date(r.appointment_date), 'yyyy-MM-dd') : 'no date')
  })

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Mes Rendez-vous</h1>
      
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
            selected={selectedDate}
            onSelect={(date) => date && handleDayClick(date)}
            locale={fr}
            classNames={{
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            }}
            className="rounded-md border shadow p-3"
            components={{
              Day: ({ date, ...props }) => {
                // Apply custom styling to days with appointments
                const customClass = getDayClassName(date);
                return (
                  <div
                    {...props}
                    className={`${props.className || ''} ${customClass}`}
                    role="button"
                  />
                );
              }
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
  )
}
