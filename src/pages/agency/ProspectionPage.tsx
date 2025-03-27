import React, { useState, useEffect, useRef } from 'react';
import { useAgencyContext } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Home, User, Phone, CheckCircle, Search, MapPin, Tag, Mail, List, PieChart, FileText, Upload, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { toast } from "sonner";
import { LoadingLayout } from "@/components/LoadingLayout";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
    type_location: string;
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
  const [opportunityTypeFilter, setOpportunityTypeFilter] = useState("");
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
  const [visitNote, setVisitNote] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { agency } = useAgencyContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { agencySlug } = useParams();
  const queryParams = new URLSearchParams(location.search);
  const reservationParam = queryParams.get('reservation');

  const [clientsMap, setClientsMap] = useState<Record<string, Client>>({});

  useEffect(() => {
    const loadClientDetails = async () => {
      for (const reservation of reservations) {
        if (reservation.client_phone && !clientsMap[reservation.client_phone]) {
          try {
            const { data, error } = await supabase
              .from('clients')
              .select('*')
              .eq('phone_number', reservation.client_phone)
              .single();

            if (!error && data) {
              setClientsMap(prev => ({
                ...prev,
                [reservation.client_phone]: data
              }));
            }
          } catch (error) {
            console.error('Error fetching client details:', error);
          }
        }
      }
    };

    loadClientDetails();
  }, [reservations]);

  useEffect(() => {
    const fetchReservations = async () => {
      if (agency?.id) {
        try {
          setIsLoading(true);
          const { data, error } = await supabase
            .from('reservations')
            .select(`
              id,
              reservation_number,
              client_phone,
              status,
              type,
              created_at,
              updated_at,
              rental_start_date,
              rental_end_date,
              appointment_date,
              property:property_id (
                id,
                title,
                address,
                reference_number,
                price,
                type_location
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
  }, [searchQuery, propertyRefFilter, reservationRefFilter, statusFilter, opportunityTypeFilter, reservations]);

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

  useEffect(() => {
    if (selectedReservation?.type?.toLowerCase() === 'location') {
      // Format the dates as YYYY-MM-DD for the input fields
      const startDate = selectedReservation.rental_start_date 
        ? new Date(selectedReservation.rental_start_date).toISOString().split('T')[0]
        : '';
      const endDate = selectedReservation.rental_end_date
        ? new Date(selectedReservation.rental_end_date).toISOString().split('T')[0]
        : '';
      
      setRentalStartDate(startDate);
      setRentalEndDate(endDate);

      console.log('Dates from reservation:', { startDate, endDate });
    }
  }, [selectedReservation]);

  const fetchLocationData = async (clientId: string, propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, client_cin, document_url, rental_start_date, rental_end_date')
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
          id,
          reservation_number,
          client_phone,
          status,
          type,
          created_at,
          updated_at,
          rental_start_date,
          rental_end_date,
          appointment_date,
          property:property_id (
            id,
            title,
            address,
            reference_number,
            price,
            type_location
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

    if (opportunityTypeFilter && opportunityTypeFilter !== "all") {
      filtered = filtered.filter(res => res.type.toUpperCase() === opportunityTypeFilter.toUpperCase());
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
      
      console.log('Debug - Contract Finalization:', {
        type: selectedReservation.type,
        isLocation: selectedReservation.type === 'LOCATION',
        rentalStartDate,
        rentalEndDate
      });

      const locationUpsertData = {
        property_id: selectedReservation.property.id,
        client_id: clientDetails.id,
        client_cin: clientCIN,
        document_url: documentUrl,
        rental_start_date: selectedReservation.type === 'LOCATION' ? rentalStartDate : null,
        rental_end_date: selectedReservation.type === 'LOCATION' ? rentalEndDate : null
      };

      console.log('Debug - Location Data:', locationUpsertData);
      
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
          .insert([locationUpsertData]);

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
      
      // Mise à jour du statut du bien dans la table properties
      let newPropertyStatus = '';
      
      console.log('Debug - Reservation Type:', selectedReservation.type);
      console.log('Debug - Property:', selectedReservation.property);
      console.log('Debug - Type Location:', selectedReservation.property.type_location);
      
      // Vérification du type de réservation (case-insensitive)
      const isLocationReservation = selectedReservation.type.toLowerCase() === 'location';
      const isVenteReservation = selectedReservation.type.toLowerCase() === 'vente';
      
      console.log('Debug - Is Location Reservation:', isLocationReservation);
      console.log('Debug - Is Vente Reservation:', isVenteReservation);
      
      if (isLocationReservation) {
        // Pour les locations longue durée, le statut devient "OCCUPEE"
        // Vérification du type de location (case-insensitive)
        const propertyTypeLocation = (selectedReservation.property.type_location || '').toLowerCase();
        const isLongTermRental = propertyTypeLocation === 'longue_duree';
        
        console.log('Debug - Property Type Location (lowercase):', propertyTypeLocation);
        console.log('Debug - Is Long Term Rental:', isLongTermRental);
        
        if (isLongTermRental) {
          newPropertyStatus = 'OCCUPEE';
        }
      } else if (isVenteReservation) {
        // Pour les ventes, le statut devient "VENDUE"
        newPropertyStatus = 'VENDUE';
      }
      
      console.log('Debug - New Property Status:', newPropertyStatus);
      
      // Mettre à jour le statut du bien si nécessaire
      if (newPropertyStatus) {
        console.log('Debug - Updating property status to:', newPropertyStatus);
        console.log('Debug - Property ID:', selectedReservation.property.id);
        
        try {
          const { error: propertyUpdateError } = await supabase
            .from('properties')
            .update({ property_status: newPropertyStatus })
            .eq('id', selectedReservation.property.id);
            
          if (propertyUpdateError) {
            console.error('Error updating property status:', propertyUpdateError);
            toast.error('Erreur lors de la mise à jour du statut du bien');
            // Ne pas interrompre le processus si cette mise à jour échoue
          } else {
            console.log(`Statut du bien mis à jour: ${newPropertyStatus}`);
            toast.success(`Statut du bien mis à jour: ${newPropertyStatus}`);
          }
        } catch (updateError) {
          console.error('Exception during property status update:', updateError);
        }
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
      
      // Logs de débogage pour vérifier les données
      console.log('Debug - PDF Generation - Reservation:', reservation);
      console.log('Debug - PDF Generation - Property Type Location:', reservation.property.type_location);
      
      if (agency?.logo_url) {
        try {
          doc.addImage(agency.logo_url, 'JPEG', 20, 10, 40, 25);
        } catch (error) {
          console.error('Error adding logo to PDF:', error);
        }
      }
      
      // Vérification du type de réservation (case-insensitive)
      const isLocationReservation = reservation.type.toLowerCase() === 'location';
      const isVenteReservation = reservation.type.toLowerCase() === 'vente';
      
      const transactionType = isVenteReservation ? 'CONTRAT DE VENTE' : 'CONTRAT DE LOCATION';
      
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
      
      // Suppression des barres obliques dans l'affichage des prix
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
      doc.text(`Date de création: ${format(new Date(reservation.created_at), 'PP', { locale: fr })}`, 20, 230);
      
      let signatureY = 260; // Position par défaut des signatures
      
      if (isLocationReservation && startDate && endDate) {
        doc.text(`Date de début: ${format(new Date(startDate), 'dd/MM/yyyy', { locale: fr })}`, 20, 240);
        doc.text(`Date de fin: ${format(new Date(endDate), 'dd/MM/yyyy', { locale: fr })}`, 20, 250);
        
        // Vérification du type de location et ajout de la mention pour les locations longue durée
        console.log('Debug - PDF - Type Location Check:', reservation.property.type_location);
        
        // Vérification case-insensitive du type de location
        const propertyTypeLocation = (reservation.property.type_location || '').toLowerCase();
        const isLongTermRental = propertyTypeLocation === 'longue_duree';
        
        console.log('Debug - PDF - Property Type Location (lowercase):', propertyTypeLocation);
        console.log('Debug - PDF - Is Long Term Rental:', isLongTermRental);
        
        if (isLongTermRental) {
          doc.text("Ce contrat est renouvelable chaque mois dès que l'acompte est versé.", 20, 260);
          console.log('Debug - PDF - Added renewal clause for long term rental');
          signatureY = 280; // Ajuster la position des signatures
        } else {
          signatureY = 280; // Pour les locations courte durée
        }
      }
      
      // Position des signatures
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
    setOpportunityTypeFilter("");
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
        const updatedReservation = { ...selectedReservation, appointment_date: date.toISOString(), status: 'Visite programmée' };
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

  const handleVisitNoteChange = async () => {
    if (!selectedReservation) return;
    
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ note_rv: visitNote })
        .eq('id', selectedReservation.id);
      
      if (error) {
        console.error('Error updating visit note:', error);
        toast.error('Erreur lors de l\'enregistrement de la note');
        return;
      }
      
      toast.success('Note de visite enregistrée');
    } catch (error) {
      console.error('Error in visit note update:', error);
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
              <div>
                <label className="text-sm font-medium mb-1 block">Type d'opportunité</label>
                <Select value={opportunityTypeFilter} onValueChange={setOpportunityTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="Location">Location</SelectItem>
                    <SelectItem value="Vente">Vente</SelectItem>
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
                        <Tag className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {reservation.property?.price 
                            ? formatPrice(reservation.property.price)
                            : 'Prix non spécifié'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm truncate">
                          {clientsMap[reservation.client_phone] 
                            ? `${clientsMap[reservation.client_phone].first_name} ${clientsMap[reservation.client_phone].last_name}`
                            : 'Client non spécifié'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
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
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="text-sm font-medium mb-2">Détails du bien</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedReservation.property?.title || 'Bien non spécifié'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedReservation.property?.address || 'Adresse non spécifiée'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {selectedReservation.property?.price 
                            ? formatPrice(selectedReservation.property.price)
                            : 'Prix non spécifié'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-500" />
                        <button 
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => selectedReservation.property?.id && handlePropertyClick(selectedReservation.property.id)}
                        >
                          Réf: {selectedReservation.property?.reference_number || 'N/A'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {selectedReservation.type?.toLowerCase() === 'location' && (
                    <div className="bg-gray-50 rounded-md p-4">
                      <h3 className="text-sm font-medium mb-2">Dates de location</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Date de début</label>
                          <Input
                            type="date"
                            value={rentalStartDate}
                            onChange={(e) => setRentalStartDate(e.target.value)}
                            disabled={showContractFields}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Date de fin</label>
                          <Input
                            type="date"
                            value={rentalEndDate}
                            onChange={(e) => setRentalEndDate(e.target.value)}
                            disabled={showContractFields}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="text-sm font-medium mb-2">Détails client</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedReservation.client_phone}</span>
                      </div>
                      
                      {clientDetails && (
                        <>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{clientDetails.first_name} {clientDetails.last_name}</span>
                          </div>
                          {clientDetails.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <a 
                                href={`mailto:${clientDetails.email}`} 
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {clientDetails.email}
                              </a>
                            </div>
                          )}
                          {locationData?.client_cin && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">CIN: {locationData.client_cin}</span>
                            </div>
                          )}
                          {locationData?.document_url && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <a 
                                href={locationData.document_url} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Voir le document d'identité
                              </a>
                            </div>
                          )}
                          <div className="mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs"
                              onClick={handleClientReservationsClick}
                            >
                              <List className="h-4 w-4 mr-1" />
                              Voir toutes les réservations
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="text-sm font-medium mb-2">Détails de la réservation</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Créée le: {format(new Date(selectedReservation.created_at), 'PPP', { locale: fr })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Type: {selectedReservation.type}</span>
                      </div>
                      
                      {selectedReservation.appointment_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            Rendez-vous: {format(new Date(selectedReservation.appointment_date), 'PPP', { locale: fr })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!isReservationClosed(selectedReservation.status) && !showContractFields && (
                    <div className="bg-gray-50 rounded-md p-4">
                      <h3 className="text-sm font-medium mb-3">Actions</h3>
                      
                      <div className="mb-4">
                        <label className="text-sm font-medium mb-1 block">
                          {selectedReservation.appointment_date ? 'Modifier le rendez-vous' : 'Programmer un rendez-vous'}
                        </label>
                        <div className="flex space-x-2">
                          <Input
                            type="date"
                            value={appointmentDate ? format(appointmentDate, 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAppointmentDateChange(new Date(e.target.value));
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {selectedReservation.status === 'Visite programmée' && (
                        <div className="mb-4">
                          <label className="text-sm font-medium mb-1 block">
                            Note de visite
                          </label>
                          <div className="flex space-x-2">
                            <Textarea
                              value={visitNote}
                              onChange={(e) => setVisitNote(e.target.value)}
                              placeholder="Ajouter une note de visite (optionnel)"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={handleVisitNoteChange}
                              className="self-end"
                            >
                              Enregistrer
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange('Fermée Gagnée')}
                            className="bg-green-50 hover:bg-green-100 border-green-200"
                          >
                            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                            Fermée Gagnée
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange('Fermée Perdu')}
                            className="bg-red-50 hover:bg-red-100 border-red-200"
                          >
                            Fermée Perdu
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {showContractFields && (
                    <div className="bg-gray-50 rounded-md p-4">
                      <h3 className="text-sm font-medium mb-3">Finaliser le contrat</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Numéro CIN du client
                          </label>
                          <Input
                            value={clientCIN}
                            onChange={(e) => setClientCIN(e.target.value)}
                            placeholder="Entrez le numéro CIN"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Document d'identité (PDF)
                          </label>
                          <div className="flex items-center mt-1">
                            <Input
                              ref={fileInputRef}
                              type="file"
                              accept="application/pdf"
                              onChange={handleDocumentChange}
                              className="flex-1"
                            />
                          </div>
                          {clientDocument && (
                            <p className="text-xs text-green-600 mt-1">
                              Fichier sélectionné: {clientDocument.name}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={resetContractFields}
                          >
                            Annuler
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleContractFinalization}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>Traitement en cours...</>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-1" />
                                Finaliser
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            )}
          </Dialog>
          
          <Sheet open={isClientReservationsOpen} onOpenChange={setIsClientReservationsOpen}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Réservations du client</SheetTitle>
                <SheetDescription>
                  {clientDetails && `${clientDetails.first_name} ${clientDetails.last_name}`}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                {clientReservations.length === 0 ? (
                  <p className="text-center text-gray-500">Aucune réservation trouvée</p>
                ) : (
                  <div className="space-y-4">
                    {clientReservations.map(reservation => (
                      <div 
                        key={reservation.id}
                        className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                        onClick={() => handleClientReservationItemClick(reservation)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{reservation.reservation_number}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservation.status)}`}>
                            {reservation.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-1 mb-1">
                            <Home className="h-3 w-3" />
                            <span className="truncate">{reservation.property?.title || 'Bien non spécifié'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(reservation.created_at), 'PP', { locale: fr })}</span>
                          </div>
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
