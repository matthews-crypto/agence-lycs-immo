
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Home, User, Phone, CheckCircle, Search, MapPin, Tag, Mail, List } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

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

interface Client {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  email: string | null;
}

export default function PropertyReservationsDialog({
  open,
  onOpenChange,
  propertyId,
  agencyPrimaryColor
}: PropertyReservationsDialogProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isReservationDetailOpen, setIsReservationDetailOpen] = useState(false);
  const [clientDetails, setClientDetails] = useState<Client | null>(null);
  const [clientReservations, setClientReservations] = useState<Reservation[]>([]);
  const [isClientReservationsOpen, setIsClientReservationsOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);
  
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { agencySlug } = useParams();

  const form = useForm({
    defaultValues: {
      appointmentDate: undefined as Date | undefined,
    }
  });

  useEffect(() => {
    if (open && propertyId) {
      fetchReservations();
    }
  }, [open, propertyId]);

  useEffect(() => {
    if (selectedReservation?.appointment_date) {
      setAppointmentDate(new Date(selectedReservation.appointment_date));
      form.setValue("appointmentDate", new Date(selectedReservation.appointment_date));
    } else {
      setAppointmentDate(undefined);
      form.setValue("appointmentDate", undefined);
    }
  }, [selectedReservation]);

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
      case "EN ATTENTE":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
      case "CONFIRMÉE":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
      case "ANNULÉE":
      case "FERMÉE PERDU":
        return "bg-red-100 text-red-800";
      case "FERMÉE GAGNÉE":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const fetchClientDetails = async (phoneNumber: string) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("phone_number", phoneNumber)
        .maybeSingle();

      if (error) {
        console.error("Error fetching client details:", error);
        setClientDetails(null);
        return;
      }

      setClientDetails(data);
    } catch (error) {
      console.error("Error in client fetch operation:", error);
      setClientDetails(null);
    }
  };

  const fetchClientReservations = async (phoneNumber: string) => {
    if (!agencySlug) return;
    
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("client_phone", phoneNumber)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching client reservations:", error);
        return;
      }

      setClientReservations(data || []);
    } catch (error) {
      console.error("Error in client reservations fetch operation:", error);
    }
  };

  const handleReservationClick = (reservation: Reservation) => {
    // Close the main dialog
    onOpenChange(false);
    
    setSelectedReservation(reservation);
    
    // Fetch client details when opening the dialog
    if (reservation.client_phone) {
      fetchClientDetails(reservation.client_phone);
      // Also fetch client's reservations
      fetchClientReservations(reservation.client_phone);
    }
    
    setIsReservationDetailOpen(true);
  };

  const handlePropertyClick = (propertyId: string) => {
    if (agencySlug) {
      navigate(`/${agencySlug}/properties/${propertyId}`);
    }
  };

  const handleClientReservationsClick = () => {
    setIsReservationDetailOpen(false);
    setIsClientReservationsOpen(true);
  };

  const handleClientReservationItemClick = (reservation: Reservation) => {
    setIsClientReservationsOpen(false);
    setSelectedReservation(reservation);
    setIsReservationDetailOpen(true);
  };

  const updateReservationStatus = async (status: string) => {
    if (!selectedReservation) return;

    try {
      const updateData: { status: string; appointment_date?: string | null } = { status };
      
      // If status is confirmed and appointment date is set, update it
      if (status === "CONFIRMÉE" && appointmentDate) {
        updateData.appointment_date = appointmentDate.toISOString();
      }

      const { error } = await supabase
        .from("reservations")
        .update(updateData)
        .eq("id", selectedReservation.id);

      if (error) {
        console.error("Error updating reservation:", error);
        toast.error("Erreur lors de la mise à jour de la réservation");
        return;
      }

      // Update the local reservation data
      setSelectedReservation({
        ...selectedReservation,
        status,
        appointment_date: updateData.appointment_date || selectedReservation.appointment_date
      });

      // Also update in the reservations list
      setReservations(prevReservations => 
        prevReservations.map(res => 
          res.id === selectedReservation.id 
            ? { ...res, status, appointment_date: updateData.appointment_date || res.appointment_date } 
            : res
        )
      );

      // Also update in client reservations if needed
      if (clientReservations.length > 0) {
        setClientReservations(prevReservations => 
          prevReservations.map(res => 
            res.id === selectedReservation.id 
              ? { ...res, status, appointment_date: updateData.appointment_date || res.appointment_date } 
              : res
          )
        );
      }

      toast.success(`Statut de la réservation mis à jour: ${status}`);
    } catch (error) {
      console.error("Error in update operation:", error);
      toast.error("Une erreur est survenue");
    }
  };

  const handleCloseLost = () => {
    updateReservationStatus("FERMÉE PERDU");
  };

  const handleCloseWon = () => {
    updateReservationStatus("FERMÉE GAGNÉE");
  };

  const handleSetAppointment = () => {
    if (appointmentDate) {
      updateReservationStatus("CONFIRMÉE");
    } else {
      toast.error("Veuillez sélectionner une date de rendez-vous");
    }
  };

  const translateStatus = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "En attente";
      case "EN ATTENTE":
        return "En attente";
      case "CONFIRMED":
        return "Confirmée";
      case "CONFIRMÉE":
        return "Confirmée";
      case "CANCELLED":
        return "Annulée";
      case "FERMÉE PERDU":
        return "Fermée Perdu";
      case "FERMÉE GAGNÉE":
        return "Fermée Gagnée";
      default:
        return status;
    }
  };

  return (
    <>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow 
                      key={reservation.id} 
                      className="cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleReservationClick(reservation)}
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
                          {translateStatus(reservation.status)}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reservation Detail Dialog */}
      <Dialog open={isReservationDetailOpen} onOpenChange={setIsReservationDetailOpen}>
        {selectedReservation && (
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-white z-10 pb-2 border-b">
              <DialogTitle className="flex justify-between items-center flex-wrap gap-2">
                <span>Réservation {selectedReservation.reservation_number}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(selectedReservation.status)}`}>
                  {translateStatus(selectedReservation.status)}
                </span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-5 mt-2">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Informations du bien</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p 
                        className="font-medium cursor-pointer hover:text-blue-600 hover:underline"
                        onClick={() => propertyId && handlePropertyClick(propertyId)}
                      >
                        {/* Property title would be fetched from property table */}
                        Voir les détails du bien
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Contact client</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{selectedReservation.client_phone}</p>
                      <p className="text-xs text-muted-foreground">Numéro de téléphone</p>
                    </div>
                  </div>

                  {clientDetails && (
                    <>
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium">
                            {clientDetails.first_name || ''} {clientDetails.last_name || ''}
                          </p>
                          <p className="text-xs text-muted-foreground">Nom complet</p>
                        </div>
                      </div>

                      {clientDetails.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{clientDetails.email}</p>
                            <p className="text-xs text-muted-foreground">Email</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {clientReservations.length > 1 && (
                    <div className="flex items-center gap-3 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={handleClientReservationsClick}
                      >
                        <List className="h-4 w-4" />
                        Voir toutes les réservations
                      </Button>
                    </div>
                  )}
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

                  {selectedReservation.appointment_date && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium">
                          {format(new Date(selectedReservation.appointment_date), 'PPP', { locale: fr })}
                        </p>
                        <p className="text-xs text-muted-foreground">Date de rendez-vous</p>
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

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Date de rendez-vous</h3>
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Sélectionner une date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: fr })
                                ) : (
                                  <span>Sélectionner une date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                setAppointmentDate(date);
                              }}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                </Form>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button variant="outline" className="bg-red-50 hover:bg-red-100 border-red-200" onClick={handleCloseLost}>
                    Fermée Perdu
                  </Button>
                  
                  {appointmentDate ? (
                    <Button variant="outline" className="bg-green-50 hover:bg-green-100 border-green-200" onClick={handleSetAppointment}>
                      Fixer rendez-vous
                    </Button>
                  ) : (
                    <Button variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200" onClick={handleCloseWon}>
                      Fermée Gagnée
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Client Reservations Dialog */}
      <Dialog open={isClientReservationsOpen} onOpenChange={setIsClientReservationsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Toutes les réservations du client
              {clientDetails && (
                <span className="block text-sm font-normal mt-1">
                  {clientDetails.first_name || ''} {clientDetails.last_name || ''} - {clientDetails.phone_number || ''}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  {clientReservations.some(r => r.appointment_date) && (
                    <TableHead>Date de RDV</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientReservations.map(reservation => (
                  <TableRow 
                    key={reservation.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleClientReservationItemClick(reservation)}
                  >
                    <TableCell className="font-medium">{reservation.reservation_number}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(reservation.status)}`}>
                        {translateStatus(reservation.status)}
                      </span>
                    </TableCell>
                    <TableCell>{reservation.type}</TableCell>
                    <TableCell>{format(new Date(reservation.created_at), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                    {clientReservations.some(r => r.appointment_date) && (
                      <TableCell>
                        {reservation.appointment_date 
                          ? format(new Date(reservation.appointment_date), 'dd/MM/yyyy', { locale: fr })
                          : "-"}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
