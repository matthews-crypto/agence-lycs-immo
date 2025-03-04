
import React, { useState, useEffect } from 'react';
import { useAgencyContext } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, Clock, Home, User, Phone, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { LoadingLayout } from "@/components/LoadingLayout";

interface Reservation {
  id: string;
  reservation_number: string;
  client_phone: string;
  status: string;
  type: string;
  created_at: string;
  updated_at: string;
  rental_start_date: string | null;
  rental_end_date: string | null;
  property: {
    id: string;
    title: string;
    address: string;
    reference_number: string;
  };
}

const ProspectionPage = () => {
  const { agency } = useAgencyContext();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchReservations = async () => {
      if (agency?.id) {
        try {
          setIsLoading(true);
          const { data, error } = await supabase
            .from('reservations')
            .select(`
              *,
              property:property_id (
                id,
                title,
                address,
                reference_number
              )
            `)
            .eq('agency_id', agency.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching reservations:', error);
            toast.error('Erreur lors du chargement des réservations');
            return;
          }

          setReservations(data || []);
        } catch (error) {
          console.error('Error in fetch operation:', error);
          toast.error('Une erreur est survenue');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchReservations();
  }, [agency?.id]);

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <LoadingLayout />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AgencySidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Gestion des Prospections</h1>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center p-10 border rounded-lg">
              <p className="text-lg text-gray-500">Aucune réservation trouvée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reservations.map((reservation) => (
                <Card key={reservation.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleReservationClick(reservation)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <span>{reservation.reservation_number}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-500" />
                        <span className="text-sm truncate">{reservation.property?.title || 'Bien non spécifié'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {format(new Date(reservation.created_at), 'PPP', { locale: fr })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="outline" className="w-full" onClick={(e) => {
                      e.stopPropagation();
                      handleReservationClick(reservation);
                    }}>
                      Voir les détails
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {selectedReservation && (
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex justify-between items-center">
                    <span>Réservation {selectedReservation.reservation_number}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedReservation.status)}`}>
                      {selectedReservation.status}
                    </span>
                  </DialogTitle>
                  <DialogDescription>
                    Détails de la réservation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold">Informations du bien</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedReservation.property?.title || 'Bien non spécifié'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                          Réf: {selectedReservation.property?.reference_number || 'N/A'}
                        </span>
                      </div>
                      {selectedReservation.property?.address && (
                        <div className="text-sm text-gray-500">
                          {selectedReservation.property?.address}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold">Contact client</h3>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedReservation.client_phone}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold">Dates</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Créée le: {format(new Date(selectedReservation.created_at), 'PPP', { locale: fr })}</span>
                      </div>
                      {selectedReservation.rental_start_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            Début: {format(new Date(selectedReservation.rental_start_date), 'PPP', { locale: fr })}
                          </span>
                        </div>
                      )}
                      {selectedReservation.rental_end_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            Fin: {format(new Date(selectedReservation.rental_end_date), 'PPP', { locale: fr })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold">Type de transaction</h3>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm capitalize">{selectedReservation.type.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ProspectionPage;
