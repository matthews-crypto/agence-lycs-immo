
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { getAbsoluteUrl } from "@/utils/urlUtils";

interface PropertyReservationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string | undefined;
  agencyPrimaryColor?: string;
}

interface Reservation {
  id: string;
  reservation_number: string;
  client_phone: string;
  status: string;
  type: string;
  created_at: string;
  rental_start_date: string | null;
  rental_end_date: string | null;
  appointment_date: string | null;
}

export default function PropertyReservationsDialog({
  open,
  onOpenChange,
  propertyId,
  agencyPrimaryColor
}: PropertyReservationsDialogProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { agencySlug } = useParams();

  useEffect(() => {
    if (open && propertyId) {
      fetchReservations();
    }
  }, [open, propertyId]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "En attente";
      case "CONFIRMED":
        return "Confirmée";
      case "CANCELLED":
        return "Fermée Perdu";
      case "COMPLETED":
        return "Fermée Gagnée";
      default:
        return status;
    }
  };

  const handleReservationClick = (reservationNumber: string) => {
    // Close the dialog
    onOpenChange(false);
    
    // Navigate to agency prospection page with the reservation filter pre-set
    // Use the agencySlug from params to construct the proper URL
    navigate(`/${agencySlug}/agency/prospection?reservation=${reservationNumber}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'w-[95vw] max-w-full p-4' : 'max-w-4xl'}`}>
        <DialogHeader>
          <DialogTitle>Réservations pour ce bien</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : reservations.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            Aucune réservation trouvée pour ce bien.
          </p>
        ) : (
          <div className="overflow-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={isMobile ? "text-xs" : ""}>Référence</TableHead>
                  {!isMobile && <TableHead>Téléphone</TableHead>}
                  {!isMobile && <TableHead>Type</TableHead>}
                  <TableHead className={isMobile ? "text-xs" : ""}>Statut</TableHead>
                  <TableHead className={isMobile ? "text-xs" : ""}>Date de création</TableHead>
                  {!isMobile && reservations.some(r => r.rental_start_date || r.rental_end_date) && (
                    <>
                      <TableHead>Début location</TableHead>
                      <TableHead>Fin location</TableHead>
                    </>
                  )}
                  {!isMobile && reservations.some(r => r.appointment_date) && (
                    <TableHead>Rendez-vous</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow 
                    key={reservation.id} 
                    className="cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleReservationClick(reservation.reservation_number)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell className={`font-medium ${isMobile ? "text-xs" : ""}`}>
                      {reservation.reservation_number}
                    </TableCell>
                    {!isMobile && <TableCell>{reservation.client_phone}</TableCell>}
                    {!isMobile && (
                      <TableCell>
                        {reservation.type === "VENTE" ? "Vente" : "Location"}
                      </TableCell>
                    )}
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(reservation.status)}`}>
                        {getStatusLabel(reservation.status)}
                      </span>
                    </TableCell>
                    <TableCell className={isMobile ? "text-xs" : ""}>
                      {format(new Date(reservation.created_at), isMobile ? "dd/MM/yy" : "dd MMMM yyyy", { locale: fr })}
                    </TableCell>
                    {!isMobile && reservations.some(r => r.rental_start_date || r.rental_end_date) && (
                      <>
                        <TableCell>
                          {reservation.rental_start_date
                            ? format(new Date(reservation.rental_start_date), "dd MMMM yyyy", { locale: fr })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {reservation.rental_end_date
                            ? format(new Date(reservation.rental_end_date), "dd MMMM yyyy", { locale: fr })
                            : "-"}
                        </TableCell>
                      </>
                    )}
                    {!isMobile && reservations.some(r => r.appointment_date) && (
                      <TableCell>
                        {reservation.appointment_date
                          ? format(new Date(reservation.appointment_date), "dd MMMM yyyy", { locale: fr })
                          : "-"}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
