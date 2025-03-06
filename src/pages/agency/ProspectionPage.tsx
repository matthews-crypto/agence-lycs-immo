
import React, { useState, useEffect, useRef } from 'react';
import { useAgencyContext } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Clock, Home, User, Phone, CheckCircle, Search, MapPin, Tag, Mail, List, PieChart, FileText, Upload, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { toast } from "sonner";
import { LoadingLayout } from "@/components/LoadingLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

interface Location {
  id: string;
  property_id: string;
  client_id: string;
  client_cin: string;
  document_url: string;
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  created_at: string;
  updated_at: string;
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
  
  const [showContractFields, setShowContractFields] = useState(false);
  const [clientCIN, setClientCIN] = useState("");
  const [clientDocument, setClientDocument] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [locationData, setLocationData] = useState<Location | null>(null);
  const [rentalStartDate, setRentalStartDate] = useState<string>("");
  const [rentalEndDate, setRentalEndDate] = useState<string>("");
  
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
          
          data?.forEach(reservation => {
            loadClientName(reservation.client_phone, reservation.id);
          });
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
  
  const loadClientName = async (phone: string, reservationId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .eq('phone_number', phone)
        .single();
      
      const nameElement = document.getElementById(`client-name-${reservationId}`);
      
      if (error || !data) {
        if (nameElement) {
          nameElement.textContent = 'Client non identifié';
        }
        return;
      }
      
      if (nameElement) {
        nameElement.textContent = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Client sans nom';
      }
    } catch (error) {
      console.error('Error fetching client name:', error);
      const nameElement = document.getElementById(`client-name-${reservationId}`);
      if (nameElement) {
        nameElement.textContent = 'Client non identifié';
      }
    }
  };

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
      
      if (selectedReservation && data) {
        fetchLocationData(data.id, selectedReservation.property.id);
      }
      
    } catch (error) {
      console.error('Error in client fetch operation:', error);
      setClientDetails(null);
    }
  };

  const fetchLocationData = async (clientId: string, propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('client_id', clientId)
        .eq('property_id', propertyId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching location data:', error);
        }
        setLocationData(null);
        return;
      }

      setLocationData(data);
      if (data?.client_cin) {
        setClientCIN(data.client_cin);
      }
      
      if (data?.rental_start_date) {
        setRentalStartDate(format(new Date(data.rental_start_date), 'yyyy-MM-dd'));
      }
      
      if (data?.rental_end_date) {
        setRentalEndDate(format(new Date(data.rental_end_date), 'yyyy-MM-dd'));
      }
      
    } catch (error) {
      console.error('Error in location data fetch operation:', error);
      setLocationData(null);
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
    setRentalStartDate("");
    setRentalEndDate("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContractFinalization = async () => {
    if (!selectedReservation || !clientDetails) return;
    
    if (!clientCIN.trim()) {
      toast.error('Le numéro CIN est obligatoire');
      return;
    }
    
    if (!clientDocument) {
      toast.error('Le document d\'identité est obligatoire');
      return;
    }
    
    if (selectedReservation.type === 'Location') {
      if (!rentalStartDate) {
        toast.error('La date de début de location est obligatoire');
        return;
      }
      
      if (!rentalEndDate) {
        toast.error('La date de fin de location est obligatoire');
        return;
      }
      
      if (new Date(rentalEndDate) <= new Date(rentalStartDate)) {
        toast.error('La date de fin doit être postérieure à la date de début');
        return;
      }
    }
    
    try {
      setIsUploading(true);
      
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
      
      const { data: publicUrlData } = supabase.storage
        .from('client_documents')
        .getPublicUrl(filePath);
      
      const documentUrl = publicUrlData.publicUrl;
      
      const locationUpsertData: any = {
        property_id: selectedReservation.property.id,
        client_id: clientDetails.id,
        client_cin: clientCIN,
        document_url: documentUrl
      };
      
      if (selectedReservation.type === 'Location') {
        locationUpsertData.rental_start_date = rentalStartDate;
        locationUpsertData.rental_end_date = rentalEndDate;
      }
      
      if (locationData) {
        const { error: locationUpdateError } = await supabase
          .from('locations')
          .update(locationUpsertData)
          .eq('id', locationData.id);
          
        if (locationUpdateError) {
          console.error('Error updating location:', locationUpdateError);
          toast.error('Erreur lors de la mise à jour de la location');
          setIsUploading(false);
          return;
        }
      } else {
        const { error: locationInsertError } = await supabase
          .from('locations')
          .insert(locationUpsertData);
          
        if (locationInsertError) {
          console.error('Error creating location:', locationInsertError);
          toast.error('Erreur lors de la création de la location');
          setIsUploading(false);
          return;
        }
      }
      
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
      
      if (selectedReservation.type === 'Location') {
        generateContractPDF(
          selectedReservation, 
          clientDetails, 
          clientCIN, 
          rentalStartDate, 
          rentalEndDate
        );
      } else {
        generateContractPDF(selectedReservation, clientDetails, clientCIN);
      }
      
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
        
        fetchLocationData(clientDetails.id, selectedReservation.property.id);
        
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

  const generateContractPDF = (
    reservation: Reservation, 
    client: Client, 
    cin: string, 
    startDate?: string, 
    endDate?: string
  ) => {
    try {
      const doc = new jsPDF();
      
      if (agency?.logo_url) {
        try {
          doc.addImage(agency.logo_url, 'JPEG', 20, 10, 40, 25);
        } catch (error) {
          console.error('Error adding logo to PDF:', error);
        }
      }
      
      const transactionType = reservation.type === 'Vente' ? 'CONTRAT DE VENTE' : 'CONTRAT DE LOCATION';
      
      doc.setFontSize(18);
      doc.text(transactionType, 105, 40, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Agence: ${agency?.agency_name || ''}`, 20, 60);
      doc.text(`NINEA/RCC: ${agency?.license_number || 'Non spécifié'}`, 20, 70);
      doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 20, 80);
      
      doc.setFontSize(14);
      doc.text("DÉTAILS DU BIEN", 20, 100);
      doc.setFontSize(12);
      doc.text(`Référence: ${reservation.property.reference_number}`, 20, 110);
      doc.text(`Titre: ${reservation.property.title}`, 20, 120);
      doc.text(`Adresse: ${reservation.property.address || 'Non spécifiée'}`, 20, 130);
      
      const formattedPrice = new Intl.NumberFormat('fr-FR').format(reservation.property.price).replace(/\//g, '');
      doc.text(`Prix: ${formattedPrice} FCFA`, 20, 140);
      
      doc.setFontSize(14);
      doc.text("DÉTAILS DU CLIENT", 20, 160);
      doc.setFontSize(12);
      doc.text(`Nom complet: ${client.first_name || ''} ${client.last_name || ''}`, 20, 170);
      doc.text(`Téléphone: ${client.phone_number || ''}`, 20, 180);
      doc.text(`CIN: ${cin}`, 20, 190);
      
      doc.setFontSize(14);
      doc.text("DÉTAILS DE LA TRANSACTION", 20, 210);
      doc.setFontSize(12);
      doc.text(`Numéro de ${reservation.type.toLowerCase()}: ${reservation.reservation_number}`, 20, 220);
      doc.text(`Date de création: ${format(new Date(reservation.created_at), 'dd/MM/yyyy', { locale: fr })}`, 20, 230);
      
      if (reservation.type === 'Location' && startDate && endDate) {
        doc.text(`Date de début de location: ${format(new Date(startDate), 'dd/MM/yyyy', { locale: fr })}`, 20, 240);
        doc.text(`Date de fin de location: ${format(new Date(endDate), 'dd/MM/yyyy', { locale: fr })}`, 20, 250);
      }
      
      const signatureY = reservation.type === 'Location' ? 280 : 260;
      
      doc.setFontSize(12);
      doc.text("Signature du Client", 40, signatureY);
      doc.text("Signature de l'Agent", 150, signatureY);
      
      doc.line(20, signatureY + 10, 80, signatureY + 10);
      doc.line(130, signatureY + 10, 190, signatureY + 10);
      
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
    
    if (reservation.type === 'Location') {
      if (reservation.rental_start_date) {
        setRentalStartDate(format(new Date(reservation.rental_start_date), 'yyyy-MM-dd'));
      } else {
        setRentalStartDate("");
      }
      
      if (reservation.rental_end_date) {
        setRentalEndDate(format(new Date(reservation.rental_end_date), 'yyyy-MM-dd'));
      } else {
        setRentalEndDate("");
      }
    } else {
      setRentalStartDate("");
      setRentalEndDate("");
    }
    
    if (reservation.client_phone) {
      fetchClientDetails(reservation.client_phone);
      fetchClientReservations(reservation.client_phone);
    }
    
    setIsDialogOpen(true);
    
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

  const handleFinalizeContractClick = () => {
    setShowContractFields(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedReservation) return;
    
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
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Home className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{reservation.property?.title || 'Bien inconnu'}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm truncate">{reservation.property?.address || 'Adresse non spécifiée'}</span>
                      </div>
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{formatPrice(reservation.property?.price || 0)}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{reservation.client_phone}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm" id={`client-name-${reservation.id}`}>Chargement...</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{format(new Date(reservation.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
              {selectedReservation && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                      <span>{selectedReservation.reservation_number}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedReservation.status)}`}>
                        {selectedReservation.status}
                      </span>
                    </DialogTitle>
                    <DialogDescription>
                      Détails de la réservation {selectedReservation.type === 'Location' ? 'de location' : 'de vente'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Informations du bien</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium block">Titre</span>
                          <span className="text-base">{selectedReservation.property?.title || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium block">Adresse</span>
                          <span className="text-base">{selectedReservation.property?.address || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium block">Référence</span>
                          <span className="text-base">{selectedReservation.property?.reference_number || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium block">Prix</span>
                          <span className="text-base">{formatPrice(selectedReservation.property?.price || 0)}</span>
                        </div>
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handlePropertyClick(selectedReservation.property.id)}
                          >
                            Voir le bien
                          </Button>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Actions</h3>
                        {!isReservationClosed(selectedReservation.status) ? (
                          <div className="space-y-4">
                            <div>
                              <span className="text-sm font-medium block mb-2">Changer le statut</span>
                              <Select
                                value={selectedReservation.status}
                                onValueChange={handleStatusChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Statut" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="En attente">En attente</SelectItem>
                                  <SelectItem value="Visite programmée">Visite programmée</SelectItem>
                                  <SelectItem value="Fermée Gagnée">Fermée Gagnée</SelectItem>
                                  <SelectItem value="Fermée Perdu">Fermée Perdu</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {selectedReservation.status !== 'Visite programmée' && (
                              <div>
                                <span className="text-sm font-medium block mb-2">Programmer une visite</span>
                                <input
                                  type="datetime-local"
                                  className="w-full px-3 py-2 border rounded"
                                  onChange={(e) => handleAppointmentDateChange(e.target.valueAsDate || undefined)}
                                  defaultValue={appointmentDate ? format(appointmentDate, "yyyy-MM-dd'T'HH:mm") : ''}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-green-50 p-4 rounded border border-green-200">
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              <span className="text-sm font-medium text-green-700">
                                Cette réservation est fermée
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {showContractFields && (
                        <div className="mt-6 border-t pt-4">
                          <h3 className="text-lg font-semibold mb-4">Données du contrat</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium block mb-2">Numéro CIN</label>
                              <Input
                                value={clientCIN}
                                onChange={(e) => setClientCIN(e.target.value)}
                                placeholder="Numéro de CIN du client"
                              />
                            </div>
                            
                            {selectedReservation.type === 'Location' && (
                              <>
                                <div>
                                  <label className="text-sm font-medium block mb-2">Date de début de location</label>
                                  <Input
                                    type="date"
                                    value={rentalStartDate}
                                    onChange={(e) => setRentalStartDate(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium block mb-2">Date de fin de location</label>
                                  <Input
                                    type="date"
                                    value={rentalEndDate}
                                    onChange={(e) => setRentalEndDate(e.target.value)}
                                  />
                                </div>
                              </>
                            )}
                            
                            <div>
                              <label className="text-sm font-medium block mb-2">Document d'identité (PDF)</label>
                              <Input
                                type="file"
                                accept=".pdf"
                                ref={fileInputRef}
                                onChange={handleDocumentChange}
                              />
                            </div>
                            
                            <div className="flex space-x-2 mt-4">
                              <Button 
                                onClick={handleContractFinalization}
                                disabled={isUploading}
                              >
                                {isUploading ? "Traitement en cours..." : "Finaliser le contrat"}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={resetContractFields}
                                disabled={isUploading}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Informations du client</h3>
                        <Button variant="ghost" size="sm" onClick={handleClientReservationsClick}>
                          <List className="h-4 w-4 mr-1" />
                          Réservations
                        </Button>
                      </div>

                      {clientDetails ? (
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium block">Nom</span>
                            <span className="text-base">{clientDetails.first_name || 'N/A'} {clientDetails.last_name || ''}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium block">Téléphone</span>
                            <span className="text-base">{clientDetails.phone_number || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium block">Email</span>
                            <span className="text-base">{clientDetails.email || 'N/A'}</span>
                          </div>
                          {locationData && (
                            <div>
                              <span className="text-sm font-medium block">CIN</span>
                              <span className="text-base">{locationData.client_cin || 'N/A'}</span>
                            </div>
                          )}
                          
                          {locationData && locationData.document_url && (
                            <div className="mt-4">
                              <a 
                                href={locationData.document_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-600 hover:text-blue-800"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Voir le document d'identité
                              </a>
                            </div>
                          )}

                          {locationData && selectedReservation.type === 'Location' && (
                            <div className="mt-4 space-y-3">
                              <div>
                                <span className="text-sm font-medium block">Période de location</span>
                                {locationData.rental_start_date && locationData.rental_end_date ? (
                                  <span className="text-base">
                                    Du {format(new Date(locationData.rental_start_date), 'dd/MM/yyyy', { locale: fr })} 
                                    {' '}au{' '}
                                    {format(new Date(locationData.rental_end_date), 'dd/MM/yyyy', { locale: fr })}
                                  </span>
                                ) : (
                                  <span className="text-base text-gray-500">Non définie</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                          <User className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Client non trouvé dans la base de données</p>
                        </div>
                      )}

                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Détails de la réservation</h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium block">Type</span>
                            <span className="text-base">{selectedReservation.type}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium block">Date de création</span>
                            <span className="text-base">
                              {format(new Date(selectedReservation.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </span>
                          </div>
                          {selectedReservation.appointment_date && (
                            <div>
                              <span className="text-sm font-medium block">Rendez-vous programmé</span>
                              <span className="text-base">
                                {format(new Date(selectedReservation.appointment_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          <Sheet open={isClientReservationsOpen} onOpenChange={setIsClientReservationsOpen}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Historique des réservations</SheetTitle>
                <SheetDescription>
                  {clientDetails ? `${clientDetails.first_name || ''} ${clientDetails.last_name || ''}`.trim() : 'Client'}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6">
                {clientReservations.length === 0 ? (
                  <div className="text-center p-6">
                    <p className="text-gray-500">Aucune réservation trouvée pour ce client</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientReservations.map(reservation => (
                      <div 
                        key={reservation.id} 
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleClientReservationItemClick(reservation)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{reservation.reservation_number}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservation.status)}`}>
                            {reservation.status}
                          </span>
                        </div>
                        <div className="text-sm">{reservation.property?.title || 'Bien inconnu'}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(reservation.created_at), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ProspectionPage;
