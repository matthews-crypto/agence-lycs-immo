
import { useState, useEffect } from "react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Phone, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Reservation = {
  id: string;
  reservation_number: string;
  client_phone: string;
  status: string;
  type: string;
  created_at: string;
  property_id: string;
  property: {
    title: string;
    address: string;
    price: number;
    property_type: string;
  };
};

export default function AgentDashboardPage() {
  const { agency } = useAgencyContext();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!agency?.id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            property:property_id (
              title,
              address,
              price,
              property_type
            )
          `)
          .eq('agency_id', agency.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching reservations:", error);
          return;
        }

        setReservations(data || []);
      } catch (error) {
        console.error("Error in reservation fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [agency?.id]);

  const handleOpenDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
  };

  const handleCloseDetails = () => {
    setSelectedReservation(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: fr });
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Prospection</h1>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : reservations.length === 0 ? (
            <Card className="w-full">
              <CardContent className="py-10">
                <p className="text-center text-muted-foreground">
                  Aucune réservation n'a été trouvée.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reservations.map((reservation) => (
                <Card 
                  key={reservation.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOpenDetails(reservation)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {reservation.property?.title || "Bien immobilier"}
                      </CardTitle>
                      <span className={`text-xs rounded-full px-2 py-1 ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="line-clamp-1">{reservation.property?.address || "Adresse non spécifiée"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.client_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(reservation.created_at)}</span>
                      </div>
                      <div className="pt-2 font-semibold text-primary">
                        {reservation.property?.price ? formatPrice(reservation.property.price) : "Prix non spécifié"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={!!selectedReservation} onOpenChange={(open) => !open && handleCloseDetails()}>
          {selectedReservation && (
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Détails de la réservation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium text-lg mb-2">{selectedReservation.property?.title}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedReservation.property?.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{selectedReservation.property?.property_type}</span>
                    </div>
                    <div className="text-primary font-semibold">
                      {selectedReservation.property?.price ? formatPrice(selectedReservation.property.price) : "Prix non spécifié"}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Informations de réservation</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Numéro de réservation</span>
                      <span className="text-sm font-medium">{selectedReservation.reservation_number}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className="text-sm font-medium">{selectedReservation.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Statut</span>
                      <span className={`text-xs rounded-full px-2 py-1 ${getStatusColor(selectedReservation.status)}`}>
                        {selectedReservation.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Date de création</span>
                      <span className="text-sm font-medium">{formatDate(selectedReservation.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Contact client</h4>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${selectedReservation.client_phone}`} className="text-sm text-primary">
                      {selectedReservation.client_phone}
                    </a>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={handleCloseDetails}>
                    Fermer
                  </Button>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </main>
    </div>
  );
}
