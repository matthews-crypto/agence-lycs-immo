import React, { useState, useEffect } from 'react';
import { useAgencyContext } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, Clock, Home, User, Phone, CheckCircle, Search, MapPin, Tag } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { LoadingLayout } from "@/components/LoadingLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useLocation } from 'react-router-dom';

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
    price: number;
  };
}

const ProspectionPage = () => {
  const { agency } = useAgencyContext();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyRefFilter, setPropertyRefFilter] = useState("");
  const [reservationRefFilter, setReservationRefFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const reservationParam = queryParams.get('reservation');

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
                reference_number,
                price
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
          setFilteredReservations(data || []);
          
          if (reservationParam) {
            setReservationRefFilter(reservationParam);
          }
        } catch (error) {
          console.error('Error in fetch operation:', error);
          toast.error('Une erreur est survenue');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchReservations();
  }, [agency?.id, reservationParam]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, propertyRefFilter, reservationRefFilter, statusFilter, reservations]);

  const applyFilters = () => {
    let filtered = [...reservations];

    if (propertyRefFilter) {
      filtered = filtered.filter(res => 
        res.property?.reference_number?.toLowerCase().includes(propertyRefFilter.toLowerCase())
      );
    }

    if (reservationRefFilter) {
      filtered = filtered.filter(res => 
        res.reservation_number.toLowerCase().includes(reservationRefFilter.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(res => res.status.toUpperCase() === statusFilter.toUpperCase());
    }

    if (searchQuery) {
      filtered = filtered.filter(res => 
        res.client_phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.property?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredReservations(filtered);
    
    if (filtered.length === 1 && reservationParam && !isDialogOpen) {
      setSelectedReservation(filtered[0]);
      setIsDialogOpen(true);
    }
  };

  const handleReservationRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (value && !value.startsWith("RES-")) {
      value = "RES-" + value;
    }
    
    if (value.startsWith("RES-")) {
      const input = value.substring(4).replace(/[^0-9]/g, "");
      
      if (input.length > 0) {
        value = "RES-" + input;
        
        if (input.length >= 4) {
          const firstPart = input.substring(0, 4);
          const secondPart = input.substring(4);
          
          if (secondPart.length > 0) {
            value = `RES-${firstPart}-${secondPart}`;
          } else {
            value = `RES-${firstPart}-`;
          }
        }
      } else {
        value = "RES-";
      }
    }
    
    setReservationRefFilter(value);
  };

  const handlePropertyRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (value && !value.startsWith("AGE-")) {
      value = "AGE-" + value;
    }
    
    if (value.startsWith("AGE-")) {
      const input = value.substring(4).replace(/[^0-9]/g, "");
      
      if (input.length > 0) {
        value = "AGE-" + input;
        
        if (input.length >= 4) {
          const firstPart = input.substring(0, 4);
          const secondPart = input.substring(4);
          
          if (secondPart.length > 0) {
            value = `AGE-${firstPart}-${secondPart}`;
          } else {
            value = `AGE-${firstPart}-`;
          }
        }
      } else {
        value = "AGE-";
      }
    }
    
    setPropertyRefFilter(value);
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPropertyRefFilter("");
    setReservationRefFilter("");
    setStatusFilter("");
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  if (isLoading) {
    return <LoadingLayout />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AgencySidebar />
        <div className="flex-1 p-4 md:p-8">
          <div className="flex flex-col items-start mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Gestion des Prospections</h1>
            <p className="text-muted-foreground mt-2">Consultez et gérez vos demandes de prospection</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <h2 className="text-lg font-medium mb-4">Filtres</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Téléphone client ou bien..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Référence du bien</label>
                <Input
                  placeholder="AGE-"
                  value={propertyRefFilter}
                  onChange={handlePropertyRefChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Référence de réservation</label>
                <Input
                  placeholder="RES-"
                  value={reservationRefFilter}
                  onChange={handleReservationRefChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Statut</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmé</SelectItem>
                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                    <SelectItem value="COMPLETED">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters} className="mr-2">
                Réinitialiser
              </Button>
            </div>
          </div>

          {filteredReservations.length === 0 ? (
            <div className="text-center p-10 border rounded-lg">
              <p className="text-lg text-gray-500">Aucune réservation trouvée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReservations.map((reservation) => (
                <Card key={reservation.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleReservationClick(reservation)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <span className="truncate">{reservation.reservation_number}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm truncate">{reservation.property?.title || 'Bien non spécifié'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {reservation.property?.price 
                            ? formatPrice(reservation.property.price)
                            : 'Prix non spécifié'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600">
                          Réf: {reservation.property?.reference_number || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm">
                          {format(new Date(reservation.created_at), 'PP', { locale: fr })}
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
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader className="sticky top-0 bg-white z-10 pb-2 border-b">
                  <DialogTitle className="flex justify-between items-center flex-wrap gap-2">
                    <span>Réservation {selectedReservation.reservation_number}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedReservation.status)}`}>
                      {selectedReservation.status}
                    </span>
                  </DialogTitle>
                  <DialogDescription>
                    Détails de la réservation
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-5 mt-2">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Informations du bien</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Home className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{selectedReservation.property?.title || 'Bien non spécifié'}</p>
                          <p className="text-sm text-muted-foreground">
                            Réf: {selectedReservation.property?.reference_number || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Tag className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium">
                            {selectedReservation.property?.price 
                              ? formatPrice(selectedReservation.property.price)
                              : 'Prix non spécifié'}
                          </p>
                        </div>
                      </div>
                      
                      {selectedReservation.property?.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{selectedReservation.property?.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Contact client</h3>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{selectedReservation.client_phone}</p>
                        <p className="text-xs text-muted-foreground">Numéro de téléphone</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Dates</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{format(new Date(selectedReservation.created_at), 'PPP', { locale: fr })}</p>
                          <p className="text-xs text-muted-foreground">Date de création</p>
                        </div>
                      </div>
                      
                      {selectedReservation.rental_start_date && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          <div>
                            <p className="font-medium">
                              {format(new Date(selectedReservation.rental_start_date), 'PPP', { locale: fr })}
                            </p>
                            <p className="text-xs text-muted-foreground">Date de début</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedReservation.rental_end_date && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          <div>
                            <p className="font-medium">
                              {format(new Date(selectedReservation.rental_end_date), 'PPP', { locale: fr })}
                            </p>
                            <p className="text-xs text-muted-foreground">Date de fin</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Type de transaction</h3>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium capitalize">{selectedReservation.type.toLowerCase()}</p>
                        <p className="text-xs text-muted-foreground">Type de prospection</p>
                      </div>
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
