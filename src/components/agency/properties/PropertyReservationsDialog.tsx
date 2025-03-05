
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

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
}

export default function PropertyReservationsDialog({
  open,
  onOpenChange,
  propertyId,
  agencyPrimaryColor
}: PropertyReservationsDialogProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
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
                  <TableHead>Référence</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date de création</TableHead>
                  {reservations.some(r => r.rental_start_date || r.rental_end_date) && (
                    <>
                      <TableHead>Début location</TableHead>
                      <TableHead>Fin location</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">
                      {reservation.reservation_number}
                    </TableCell>
                    <TableCell>{reservation.client_phone}</TableCell>
                    <TableCell>
                      {reservation.type === "VENTE" ? "Vente" : "Location"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(reservation.status)}`}>
                        {reservation.status === "PENDING" && "En attente"}
                        {reservation.status === "CONFIRMED" && "Confirmée"}
                        {reservation.status === "CANCELLED" && "Annulée"}
                        {!["PENDING", "CONFIRMED", "CANCELLED"].includes(reservation.status) && reservation.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(reservation.created_at), "dd MMMM yyyy", { locale: fr })}
                    </TableCell>
                    {reservations.some(r => r.rental_start_date || r.rental_end_date) && (
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
