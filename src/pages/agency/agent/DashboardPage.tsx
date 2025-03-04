
import { useState, useEffect } from "react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Phone, User, Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgencySidebar } from "@/components/agency/AgencySidebar";

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
    reference_number: string;
  };
};

export default function AgentDashboardPage() {
  const { agency } = useAgencyContext();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyRefFilter, setPropertyRefFilter] = useState("");
  const [reservationRefFilter, setReservationRefFilter] = useState("");
  const [availablePropertyRefs, setAvailablePropertyRefs] = useState<string[]>([]);
  const [availableReservationRefs, setAvailableReservationRefs] = useState<string[]>([]);

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
              property_type,
              reference_number
            )
          `)
          .eq('agency_id', agency.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching reservations:", error);
          return;
        }

        setReservations(data || []);
        setFilteredReservations(data || []);
        
        // Extract unique property references
        const propertyRefs = [...new Set(data?.map(res => res.property?.reference_number).filter(Boolean) || [])];
        setAvailablePropertyRefs(propertyRefs);
        
        // Extract unique reservation numbers
        const reservationRefs = [...new Set(data?.map(res => res.reservation_number).filter(Boolean) || [])];
        setAvailableReservationRefs(reservationRefs);
      } catch (error) {
        console.error("Error in reservation fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [agency?.id]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, propertyRefFilter, reservationRefFilter, reservations]);

  const applyFilters = () => {
    let filtered = [...reservations];
    
    // Filter by property reference
    if (propertyRefFilter) {
      filtered = filtered.filter(res => 
        res.property?.reference_number === propertyRefFilter
      );
    }
    
    // Filter by reservation reference
    if (reservationRefFilter) {
      filtered = filtered.filter(res => 
        res.reservation_number === reservationRefFilter
      );
    }
    
    // Filter by search term (phone or property title)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(res => 
        res.client_phone.toLowerCase().includes(term) || 
        res.property?.title.toLowerCase().includes(term)
      );
    }
    
    setFilteredReservations(filtered);
  };

  const handleOpenDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
  };

  const handleCloseDetails = () => {
    setSelectedReservation(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPropertyRefFilter("");
    setReservationRefFilter("");
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
      <AgencySidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Prospection</h1>
          
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Filtres</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Téléphone ou nom du bien"
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence bien</label>
                <Select value={propertyRefFilter} onValueChange={setPropertyRefFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les références" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les références</SelectItem>
                    {availablePropertyRefs.map(ref => (
                      <SelectItem key={ref} value={ref}>{ref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence réservation</label>
                <Select value={reservationRefFilter} onValueChange={setReservationRefFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les réservations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les réservations</SelectItem>
                    {availableReservationRefs.map(ref => (
                      <SelectItem key={ref} value={ref}>{ref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Effacer les filtres
                </Button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredReservations.length === 0 ? (
            <Card className="w-full">
              <CardContent className="py-10">
                <p className="text-center text-muted-foreground">
                  Aucune réservation n'a été trouvée.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReservations.map((reservation) => (
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="line-clamp-1">{reservation.property?.address || "Adresse non spécifiée"}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reservation.property?.reference_number}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.client_phone}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reservation.reservation_number}
                        </div>
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
                      <span className="text-sm text-muted-foreground">Référence du bien</span>
                      <span className="text-sm font-medium">{selectedReservation.property?.reference_number}</span>
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
