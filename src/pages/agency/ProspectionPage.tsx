import React, { useState, useEffect, useRef } from 'react';
import { useAgencyContext } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Clock, Home, User, Phone, CheckCircle, Search, MapPin, Tag, Mail, List, PieChart, FileText, Upload } from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { toast } from "sonner";
import { LoadingLayout } from "@/components/LoadingLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { jsPDF } from 'jspdf';

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
  appointment_date: string | null;
  property: {
    id: string;
    title: string;
    address: string;
    reference_number: string;
    price: number;
  };
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  cin?: string;
  id_document_url?: string;
}

const ProspectionPage = () => {
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyRefFilter, setPropertyRefFilter] = useState("");
  const [reservationRefFilter, setReservationRefFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientDetails, setClientDetails] = useState<Client | null>(null);
  const [isClientReservationsOpen, setIsClientReservationsOpen] = useState(false);
  const [clientReservations, setClientReservations] = useState<Reservation[]>([]);
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [pendingOpportunitiesCount, setPendingOpportunitiesCount] = useState(0);
  
  // New state variables for CIN and document upload
  const [showContractFields, setShowContractFields] = useState(false);
  const [clientCIN, setClientCIN] = useState("");
  const [clientDocument, setClientDocument] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { agency } = useAgencyContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { agencySlug } = useParams();
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
          
          const pendingCount = data ? data.filter(r => r.status === 'En attente').length : 0;
          setPendingOpportunitiesCount(pendingCount);
          
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
    if (!agency?.id) return;
    
    const channel = supabase
      .channel('prospection-reservations')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations',
          filter: `agency_id=eq.${agency.id}`
        },
        (payload) => {
          console.log('New reservation detected:', payload);
          setReservations(prev => {
            const newReservation = payload.new as Reservation;
            if (prev.find(r => r.id === newReservation.id)) return prev;
            
            if (newReservation.status === 'En attente') {
              setPendingOpportunitiesCount(count => count + 1);
            }
            
            return [newReservation, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agency?.id]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, propertyRefFilter, reservationRefFilter, statusFilter, reservations]);

  const fetchClientDetails = async (phoneNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (error) {
        console.error('Error fetching client details:', error);
        setClientDetails(null);
        return;
      }

      setClientDetails(data);
      
      // Set CIN if available from client details
      if (data?.cin) {
        setClientCIN(data.cin);
      }
      
    } catch (error) {
      console.error('Error in client fetch operation:', error);
      setClientDetails(null);
    }
  };

  const fetchClientReservations = async (phoneNumber: string) => {
    if (!agency?.id) return;
    
    try {
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
        .eq('client_phone', phoneNumber)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client reservations:', error);
        return;
      }

      setClientReservations(data || []);
    } catch (error) {
      console.error('Error in client reservations fetch operation:', error);
    }
  };

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

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Only allow PDF files
      if (file.type === 'application/pdf') {
        setClientDocument(file);
      } else {
        toast.error('Seuls les fichiers PDF sont acceptés');
        e.target.value = '';
      }
    }
  };

  const resetContractFields = () => {
    setShowContractFields(false);
    setClientCIN("");
    setClientDocument(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContractFinalization = async () => {
    if (!selectedReservation || !clientDetails) return;
    
    // Validation
    if (!clientCIN.trim()) {
      toast.error('Le numéro CIN est obligatoire');
      return;
    }
    
    if (!clientDocument) {
      toast.error('Le document d\'identité est obligatoire');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload document to Supabase Storage
      const fileName = `${clientDetails.id}_${Date.now()}.pdf`;
      const filePath = `${selectedReservation.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(filePath, clientDocument, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error uploading document:', uploadError);
        toast.error('Erreur lors du téléchargement du document');
        setIsUploading(false);
        return;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('client_documents')
        .getPublicUrl(filePath);
      
      const documentUrl = publicUrlData.publicUrl;
      
      // Update client with CIN and document URL
      const { error: clientUpdateError } = await supabase
        .from('clients')
        .update({ 
          cin: clientCIN, 
          id_document_url: documentUrl 
        })
        .eq('id', clientDetails.id);
      
      if (clientUpdateError) {
        console.error('Error updating client details:', clientUpdateError);
        toast.error('Erreur lors de la mise à jour des informations du client');
        setIsUploading(false);
        return;
      }
      
      // Update property with client_id (as in the original handleStatusChange)
      const { error: propertyError } = await supabase
        .from('properties')
        .update({ client_id: clientDetails.id })
        .eq('id', selectedReservation.property.id);
      
      if (propertyError) {
        console.error('Error updating property with client_id:', propertyError);
        toast.error('Erreur lors de l\'association du client au bien');
        setIsUploading(false);
        return;
      }
      
      // Update reservation status
      const { error: statusError } = await supabase
        .from('reservations')
        .update({ status: 'Fermée Gagnée' })
        .eq('id', selectedReservation.id);
      
      if (statusError) {
        console.error('Error updating reservation status:', statusError);
        toast.error('Erreur lors de la mise à jour du statut');
        setIsUploading(false);
        return;
      }
      
      // Generate contract PDF
      generateContractPDF(selectedReservation, clientDetails, clientCIN);
      
      // Update local state
      if (selectedReservation) {
        const wasStatusPending = selectedReservation.status === 'En attente';
        
        if (wasStatusPending) {
          setPendingOpportunitiesCount(count => Math.max(0, count - 1));
        }
        
        const updatedReservation = { ...selectedReservation, status: 'Fermée Gagnée' };
        setSelectedReservation(updatedReservation);
        
        const updatedReservations = reservations.map(res => 
          res.id === selectedReservation.id ? updatedReservation : res
        );
        setReservations(updatedReservations);
        
        // Update client details in local state
        setClientDetails({
          ...clientDetails,
          cin: clientCIN,
          id_document_url: documentUrl
        });
        
        applyFilters();
      }
      
      toast.success('Contrat finalisé avec succès');
      setShowContractFields(false);
      
    } catch (error) {
      console.error('Error in contract finalization:', error);
      toast.error('Une erreur est survenue lors de la finalisation du contrat');
    } finally {
      setIsUploading(false);
    }
  };
  
  const generateContractPDF = (reservation: Reservation, client: Client, cin: string) => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Set font size and add title
      doc.setFontSize(18);
      doc.text("CONTRAT DE RÉSERVATION", 105, 20, { align: 'center' });
      
      // Add agency details
      doc.setFontSize(12);
      doc.text(`Agence: ${agency?.agency_name || ''}`, 20, 40);
      doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 20, 50);
      
      // Add property details
      doc.setFontSize(14);
      doc.text("DÉTAILS DU BIEN", 20, 70);
      doc.setFontSize(12);
      doc.text(`Référence: ${reservation.property.reference_number}`, 20, 80);
      doc.text(`Titre: ${reservation.property.title}`, 20, 90);
      doc.text(`Adresse: ${reservation.property.address || 'Non spécifiée'}`, 20, 100);
      doc.text(`Prix: ${new Intl.NumberFormat('fr-FR').format(reservation.property.price)} FCFA`, 20, 110);
      
      // Add client details
      doc.setFontSize(14);
      doc.text("DÉTAILS DU CLIENT", 20, 130);
      doc.setFontSize(12);
      doc.text(`Nom complet: ${client.first_name || ''} ${client.last_name || ''}`, 20, 140);
      doc.text(`Téléphone: ${client.phone_number || ''}`, 20, 150);
      doc.text(`Email: ${client.email || ''}`, 20, 160);
      doc.text(`CIN: ${cin}`, 20, 170);
      
      // Add reservation details
      doc.setFontSize(14);
      doc.text("DÉTAILS DE LA RÉSERVATION", 20, 190);
      doc.setFontSize(12);
      doc.text(`Numéro de réservation: ${reservation.reservation_number}`, 20, 200);
      doc.text(`Type: ${reservation.type}`, 20, 210);
      doc.text(`Date de création: ${format(new Date(reservation.created_at), 'dd/MM/yyyy', { locale: fr })}`, 20, 220);
      
      // Add signature sections
      doc.setFontSize(12);
      doc.text("Signature du Client", 40, 250);
      doc.text("Signature de l'Agent", 150, 250);
      
      doc.line(20, 260, 80, 260); // Client signature line
      doc.line(130, 260, 190, 260); // Agent signature line
      
      // Save the PDF
      doc.save(`Contrat_${reservation.reservation_number}.pdf`);
      
      toast.success('Contrat généré avec succès');
    } catch (error) {
      console.error('Error generating contract PDF:', error);
      toast.error('Erreur lors de la génération du contrat');
    }
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    
    setAppointmentDate(reservation.appointment_date ? new Date(reservation.appointment_date) : null);
    
    if (reservation.client_phone) {
      fetchClientDetails(reservation.client_phone);
      fetchClientReservations(reservation.client_phone);
    }
    
    setIsDialogOpen(true);
    
    // Reset contract fields when opening a new reservation
    resetContractFields();
  };

  const handleClientReservationsClick = () => {
    setIsDialogOpen(false);
    setIsClientReservationsOpen(true);
  };
  
  const handleClientReservationItemClick = (reservation: Reservation) => {
    setIsClientReservationsOpen(false);
    setSelectedReservation(reservation);
    setIsDialogOpen(true);
  };
  
  const handlePropertyClick = (propertyId: string) => {
    if (agencySlug) {
      navigate(`/${agencySlug}/properties/${propertyId}`);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPropertyRefFilter("");
    setReservationRefFilter("");
    setStatusFilter("");
  };

  const handleAppointmentDateChange = async (date: Date | undefined) => {
    if (!date || !selectedReservation) return;
    
    setAppointmentDate(date);
    
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          appointment_date: date.toISOString(),
          status: 'Visite programmée'
        })
        .eq('id', selectedReservation.id);

      if (error) {
        console.error('Error updating reservation:', error);
        toast.error('Erreur lors de la mise à jour de la réservation');
        return;
      }

      toast.success('Rendez-vous programmé avec succès');
      
      if (selectedReservation) {
        const updatedReservation = { 
          ...selectedReservation, 
          appointment_date: date.toISOString(),
          status: 'Visite programmée'
        };
        setSelectedReservation(updatedReservation);
        
        const updatedReservations = reservations.map(res => 
          res.id === selectedReservation.id ? updatedReservation : res
        );
        setReservations(updatedReservations);
        
        if (selectedReservation.status === 'En attente') {
          setPendingOpportunitiesCount(count => Math.max(0, count - 1));
        }
        
        applyFilters();
      }
    } catch (error) {
      console.error('Error in appointment update operation:', error);
      toast.error('Une erreur est survenue');
    }
  };

  // Modified to show contract fields instead of immediately changing status
  const handleFinalizeContractClick = () => {
    setShowContractFields(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedReservation) return;
    
    // If user clicked "Fermée Gagnée", we show the CIN/document upload form
    if (newStatus === 'Fermée Gagnée') {
      handleFinalizeContractClick();
      return;
    }
    
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', selectedReservation.id);

      if (error) {
        console.error('Error updating reservation status:', error);
        toast.error('Erreur lors de la mise à jour du statut');
        return;
      }

      toast.success('Statut mis à jour avec succès');
      
      if (selectedReservation) {
        const wasStatusPending = selectedReservation.status === 'En attente';
        const isNewStatusPending = newStatus === 'En attente';
        
        if (wasStatusPending && !isNewStatusPending) {
          setPendingOpportunitiesCount(count => Math.max(0, count - 1));
        } else if (!wasStatusPending && isNewStatusPending) {
          setPendingOpportunitiesCount(count => count + 1);
        }
        
        const updatedReservation = { ...selectedReservation, status: newStatus };
        setSelectedReservation(updatedReservation);
        
        const updatedReservations = reservations.map(res => 
          res.id === selectedReservation.id ? updatedReservation : res
        );
        setReservations(updatedReservations);
        applyFilters();
      }
    } catch (error) {
      console.error('Error in status update operation:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Visite programmée':
        return 'bg-blue-100 text-blue-800';
      case 'Fermée Gagnée':
        return 'bg-green-100 text-green-800';
      case 'Fermée Perdu':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const isReservationClosed = (status: string) => {
    return status === 'Fermée Gagnée' || status === 'Fermée Perdu';
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
            <h1 className="text-2xl md:text-3xl font-bold">Gestion des Opportunités</h1>
            <p className="text-muted-foreground mt-2">Consultez et gérez vos demandes d'opportunités</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 p-3 rounded-full">
                <PieChart className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{pendingOpportunitiesCount}</h2>
                <p className="text-sm text-gray-500">Opportunités en attente à traiter</p>
              </div>
            </div>
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
                    <SelectItem value="En attente">En attente</SelectItem>
                    <SelectItem value="Visite programmée">Visite programmée</SelectItem>
                    <SelectItem value="Fermée Gagnée">Fermée Gagnée</SelectItem>
                    <SelectItem value="Fermée Perdu">Fermée Perdu</SelectItem>
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
                          <p 
                            className="font-medium cursor-pointer hover:text-blue-600 hover:underline"
                            onClick={() => handlePropertyClick(selectedReservation.property?.id)}
                          >
                            {selectedReservation.property?.title || 'Bien non spécifié'}
                          </p>
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
                          <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          <p className="text-sm">{selectedReservation.property?.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Contact client</h3>
                    <div className="space-y-3">
