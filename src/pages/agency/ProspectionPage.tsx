
import { useState, useEffect } from "react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Reservation = {
  id: string;
  reservation_number: string;
  client_phone: string;
  status: string;
  type: string;
  created_at: string;
  property_id: string;
  property?: {
    title: string;
    reference_number: string;
    address: string;
    price: number;
    property_type: string;
  }
};

export default function ProspectionPage() {
  const { agency } = useAgencyContext();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchReservations = async () => {
      if (!agency?.id) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            property:property_id (
              title,
              reference_number,
              address,
              price,
              property_type
            )
          `)
          .eq('agency_id', agency.id);
          
        if (error) {
          throw error;
        }
        
        setReservations(data || []);
      } catch (error) {
        console.error("Error fetching reservations:", error);
        toast.error("Erreur lors du chargement des réservations");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReservations();
  }, [agency?.id]);
  
  const handleOpenDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return "bg-yellow-100 text-yellow-800";
      case 'CONFIRMED':
        return "bg-green-100 text-green-800";
      case 'CANCELLED':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">Prospection</h1>
            
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">Aucune réservation trouvée</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reservations.map((reservation) => (
                  <Card 
                    key={reservation.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleOpenDetails(reservation)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between items-center">
                        <span className="truncate">{reservation.property?.title || "Bien immobilier"}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservation.status)}`}>
                          {reservation.status}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>Tél. client :</strong> {reservation.client_phone}</p>
                        <p><strong>Type :</strong> {reservation.type}</p>
                        <p><strong>Date :</strong> {formatDate(reservation.created_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      
      <Dialog open={!!selectedReservation} onOpenChange={(open) => !open && setSelectedReservation(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la réservation</DialogTitle>
            <DialogDescription>
              Réservation #{selectedReservation?.reservation_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-muted-foreground">Informations client</h3>
                  <div className="mt-2 space-y-2">
                    <p><strong>Téléphone :</strong> {selectedReservation.client_phone}</p>
                    <p><strong>Statut :</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedReservation.status)}`}>
                        {selectedReservation.status}
                      </span>
                    </p>
                    <p><strong>Date de création :</strong> {formatDate(selectedReservation.created_at)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-muted-foreground">Informations du bien</h3>
                  <div className="mt-2 space-y-2">
                    <p><strong>Titre :</strong> {selectedReservation.property?.title}</p>
                    <p><strong>Réf :</strong> {selectedReservation.property?.reference_number}</p>
                    <p><strong>Type :</strong> {selectedReservation.property?.property_type}</p>
                    <p><strong>Prix :</strong> {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(selectedReservation.property?.price || 0)}</p>
                    <p><strong>Adresse :</strong> {selectedReservation.property?.address}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-muted-foreground">Type de réservation</h3>
                <p className="mt-2">{selectedReservation.type}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
