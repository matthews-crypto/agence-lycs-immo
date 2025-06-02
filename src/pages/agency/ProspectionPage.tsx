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

// Fonction utilitaire pour normaliser les chaînes (suppression des accents et mise en minuscules)
const normalizeString = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Supprime les accents
};

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
  const [monthFilter, setMonthFilter] = useState("");
  const [clientDetails, setClientDetails] = useState<Client | null>(null);
  const [isClientReservationsOpen, setIsClientReservationsOpen] = useState(false);
  const [clientReservations, setClientReservations] = useState<Reservation[]>([]);
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [pendingOpportunitiesCount, setPendingOpportunitiesCount] = useState(0);
  
  const [showContractFields, setShowContractFields] = useState(false);
  const [clientCIN, setClientCIN] = useState('');
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
              note_rv,
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
  }, [searchQuery, propertyRefFilter, reservationRefFilter, statusFilter, opportunityTypeFilter, monthFilter, reservations]);

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
      console.log('Fetching location data for client:', clientId, 'and property:', propertyId);
      
      // Vérifier si les dates sont déjà présentes dans la réservation sélectionnée
      if (selectedReservation) {
        console.log('Selected reservation dates:', {
          start: selectedReservation.rental_start_date,
          end: selectedReservation.rental_end_date
        });
        
        // Si la réservation contient déjà les dates, les utiliser directement
        if (selectedReservation.rental_start_date) {
          setRentalStartDate(format(new Date(selectedReservation.rental_start_date), 'yyyy-MM-dd'));
          console.log('Using start date from reservation:', format(new Date(selectedReservation.rental_start_date), 'yyyy-MM-dd'));
        }
        
        if (selectedReservation.rental_end_date) {
          setRentalEndDate(format(new Date(selectedReservation.rental_end_date), 'yyyy-MM-dd'));
          console.log('Using end date from reservation:', format(new Date(selectedReservation.rental_end_date), 'yyyy-MM-dd'));
        }
      }
      
      // Continuer à récupérer les données de location pour les autres informations
      const { data, error } = await supabase
        .from('locations')
        .select('id, client_cin, document_url, rental_start_date, rental_end_date, client_id')
        .eq('property_id', propertyId);

      if (error) {
        console.error('Error fetching location data:', error);
        setLocationData(null);
        return;
      }
      
      console.log('Location data received:', data);
      
      // Filtrer pour trouver la location correspondant au client
      const clientLocation = data?.find(loc => loc.client_id === clientId);
      
      if (!clientLocation) {
        console.log('No location found for this client and property');
        setLocationData(null);
        return;
      }

      console.log('Client location found:', clientLocation);
      
      // Utiliser les données de la location trouvée
      setLocationData(clientLocation);
      
      if (clientLocation?.client_cin) {
        setClientCIN(clientLocation.client_cin);
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
      const normalizedFilter = normalizeString(propertyRefFilter);
      filtered = filtered.filter(res => 
        normalizeString(res.property?.reference_number).includes(normalizedFilter)
      );
    }

    if (reservationRefFilter) {
      const normalizedFilter = normalizeString(reservationRefFilter);
      filtered = filtered.filter(res => 
        normalizeString(res.reservation_number).includes(normalizedFilter)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(res => res.status.toUpperCase() === statusFilter.toUpperCase());
    }

    if (opportunityTypeFilter && opportunityTypeFilter !== "all") {
      filtered = filtered.filter(res => res.type.toUpperCase() === opportunityTypeFilter.toUpperCase());
    }

    // Filtre par mois
    if (monthFilter && monthFilter !== "all") {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // getMonth() retourne 0-11
      
      filtered = filtered.filter(res => {
        const creationDate = new Date(res.created_at);
        const creationMonth = creationDate.getMonth() + 1; // 1-12
        const creationYear = creationDate.getFullYear();
        
        if (monthFilter === "current") {
          // Mois en cours
          return creationMonth === currentMonth && creationYear === currentYear;
        } else if (monthFilter === "previous") {
          // Mois précédent
          const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
          const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
          return creationMonth === previousMonth && creationYear === previousMonthYear;
        } else {
          // Mois spécifique (01-12)
          const selectedMonth = parseInt(monthFilter);
          return creationMonth === selectedMonth && creationYear === currentYear;
        }
      });
    }

    if (searchQuery) {
      const normalizedQuery = normalizeString(searchQuery);
      filtered = filtered.filter(res => 
        normalizeString(res.client_phone).includes(normalizedQuery) ||
        normalizeString(res.property?.title).includes(normalizedQuery)
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
    if (!selectedReservation || !clientDetails) {
      toast.error('Informations manquantes');
      return;
    }
    
    if (!clientCIN.trim()) {
      toast.error('Le numéro CIN ou passeport est obligatoire');
      return;
    }
    
    if (!clientDocument) {
      toast.error('Le document d\'identité est obligatoire');
      return;
    }
    
    if (selectedReservation.type === 'LOCATION' && !rentalStartDate) {
      toast.error('La date de début est obligatoire pour une location');
      return;
    }
    
    if (selectedReservation.type === 'LOCATION' && selectedReservation.property.type_location === 'courte_duree' && !rentalEndDate) {
      toast.error('La date de fin est obligatoire pour une location courte durée');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload du document d'identité
      const fileExt = clientDocument.name.split('.').pop();
      const fileName = `${clientDetails.id}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`clients/${fileName}`, clientDocument);
      
      if (uploadError) {
        console.error('Error uploading document:', uploadError);
        toast.error('Erreur lors du téléchargement du document');
        setIsUploading(false);
        return;
      }
      
      const { data: documentUrl } = supabase.storage
        .from('documents')
        .getPublicUrl(`clients/${fileName}`);
      
      // Vérifier si une location existe déjà pour ce client et cette propriété
      const { data: existingLocation, error: locationCheckError } = await supabase
        .from('locations')
        .select('*')
        .eq('client_id', clientDetails.id)
        .eq('property_id', selectedReservation.property.id)
        .eq('statut', 'EN COURS')
        .maybeSingle();
      
      // Préparer les données pour l'insertion ou la mise à jour de la location
      const locationUpsertData = {
        property_id: selectedReservation.property.id,
        client_id: clientDetails.id,
        client_cin: clientCIN,
        document_url: documentUrl.publicUrl,
        rental_start_date: selectedReservation.type === 'LOCATION' && rentalStartDate ? new Date(rentalStartDate).toISOString() : null,
        rental_end_date: selectedReservation.type === 'LOCATION' && rentalEndDate ? new Date(rentalEndDate).toISOString() : null
      };
      
      console.log('Debug - Contract Finalization:', {
        type: selectedReservation.type,
        isLocation: selectedReservation.type === 'LOCATION',
        rentalStartDate,
        rentalEndDate
      });

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
        
        console.log('Debug - PDF - Type Location Check:', propertyTypeLocation);
        console.log('Debug - PDF - Is Long Term Rental:', isLongTermRental);
        
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
      
      // Check if email exists in reservations table
      const { data: emailData, error: emailError } = await supabase
        .from('reservations')
        .select('email')
        .eq('id', selectedReservation.id)
        .single();

      if (emailError || !emailData) {
        clientDetails.email = null;
      }
      
      if (selectedReservation.type === 'LOCATION') {
        // Pour les locations, essayer d'utiliser un modèle personnalisé
        await generateCustomContractPDF(
          selectedReservation, 
          clientDetails, 
          clientCIN, 
          rentalStartDate, 
          rentalEndDate
        );
      } else {
        // Pour les ventes, utiliser le modèle standard pour le moment
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

  // Fonction pour générer un contrat personnalisé à partir du modèle de l'agence
  const generateCustomContractPDF = async (
    reservation: Reservation, 
    client: Client, 
    cin: string,
    startDate?: string, 
    endDate?: string
  ) => {
    try {
      // Récupérer le modèle de contrat personnalisé pour cette agence
      // @ts-expect-error - La table contract_templates sera créée via SQL
      const { data: templateData, error: templateError } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('agency_id', agency?.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (templateError || !templateData) {
        console.log('Aucun modèle de contrat personnalisé trouvé, utilisation du modèle standard');
        // Fallback au modèle standard si aucun modèle personnalisé n'est trouvé
        generateContractPDF(reservation, client, cin, startDate, endDate);
        return;
      }
      
      console.log('Modèle de contrat personnalisé trouvé:', templateData);
      
      // Récupérer les données du propriétaire si disponible
      let proprietaireData = null;
      if (reservation.property?.proprio_id) {
        const { data: proprio, error: proprioError } = await supabase
          .from('proprietaire')
          .select('*')
          .eq('id', reservation.property.proprio_id)
          .single();
        
        if (!proprioError && proprio) {
          proprietaireData = proprio;
        }
      }
      // Récupérer les données de l'agence
      const agencyData = agency;
      
      // Créer un nouveau document PDF
      const doc = new jsPDF();
      
      // Interface pour les options de texte de jsPDF
      interface TextOptions {
        align?: 'left' | 'center' | 'right';
        baseline?: string;
        angle?: number;
        charSpace?: number;
        lineHeightFactor?: number;
        maxWidth?: number;
        flags?: { noBOM?: boolean; autoencode?: boolean };
      }
      
      // Dessiner un rectangle pour l'en-tête avec la couleur spécifiée
      const headerColor = templateData.template_json.settings.headerColor || '#f8f9fa';
      // Convertir la couleur hex en valeurs RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 248, g: 249, b: 250 }; // Valeur par défaut #f8f9fa
      };
      
      const headerRgb = hexToRgb(headerColor);
      doc.setFillColor(headerRgb.r, headerRgb.g, headerRgb.b);
      
      // Ajouter le logo de l'agence si disponible et si l'option est activée
      const showLogo = templateData.template_json.settings.showLogo !== false; // Par défaut true si non défini
      
      // Dessiner le rectangle de l'en-tête avec une hauteur dépendant du contenu
      doc.rect(0, 0, 210, showLogo ? 50 : 30, 'F'); // Dessiner un rectangle pour l'en-tête
      
      if (showLogo && agency?.logo_url) {
        try {
          // Position du logo selon les paramètres du modèle
          const logoPosition = templateData.template_json.settings.logoPosition || 'center';
          let xPos = 20; // Position par défaut (gauche)
          
          if (logoPosition === 'center') {
            xPos = 85; // Centre
          } else if (logoPosition === 'right') {
            xPos = 150; // Droite
          }
          
          doc.addImage(agency.logo_url, 'JPEG', xPos, 10, 40, 25);
        } catch (error) {
          console.error('Error adding logo to PDF:', error);
        }
      }
      
      // Ajouter le nom de l'agence si l'option est activée
      const showAgencyName = templateData.template_json.settings.showAgencyName !== false; // Par défaut true si non défini
      
      if (showAgencyName && agency?.agency_name) {
        const agencyNamePosition = templateData.template_json.settings.agencyNamePosition || 'center';
        let xPos = 20; // Position par défaut (gauche)
        const textOptions: TextOptions = { align: 'left' };
        
        if (agencyNamePosition === 'center') {
          xPos = 105; // Centre de la page (210/2)
          textOptions.align = 'center';
        } else if (agencyNamePosition === 'right') {
          xPos = 190; // Droite (marge de 20 depuis la droite)
          textOptions.align = 'right';
        }
        
        // Définir la couleur du texte pour le nom de l'agence
        const agencyNameColor = templateData.template_json.settings.agencyNameColor || '#000000';
        doc.setTextColor(agencyNameColor);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(agency.agency_name, xPos, showLogo ? 40 : 20, textOptions);
        
        // Réinitialiser la couleur du texte pour le reste du document
        doc.setTextColor(0, 0, 0); // Noir par défaut
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
      }
        
      // Créer un dictionnaire de valeurs pour remplacer les variables
      const valueMap: Record<string, Record<string, string>> = {
        client: {
          nom: client.last_name || '',
          prenom: client.first_name || '',
          email: client.email || '',
          telephone: client.phone_number || '',
          adresse: client.address || ''
        },
        properties: {
          title: reservation.property?.title || '',
          address: reservation.property?.address || '',
          price: new Intl.NumberFormat('fr-FR').format(reservation.property?.price || 0).replace(/\//g, ''),
          surface_area: reservation.property?.surface_area?.toString() || '',
          bedrooms: reservation.property?.bedrooms?.toString() || '',
          reference_number: reservation.property?.reference_number || ''
        },
        locations: {
          date_debut: startDate ? format(new Date(startDate), 'dd/MM/yyyy', { locale: fr }) : '',
          date_fin: endDate ? format(new Date(endDate), 'dd/MM/yyyy', { locale: fr }) : '',
          prix_location: new Intl.NumberFormat('fr-FR').format(reservation.property?.price || 0).replace(/\//g, ''),
          caution: new Intl.NumberFormat('fr-FR').format((reservation.property?.price || 0) * 2).replace(/\//g, '')
        },
        proprietaire: {
          nom: proprietaireData?.nom || '',
          prenom: proprietaireData?.prenom || '',
          email: proprietaireData?.email || '',
          telephone: proprietaireData?.telephone || '',
          adresse: proprietaireData?.adresse || ''
        },
        agencies: {
          agency_name: agencyData?.agency_name || '',
          contact_email: agencyData?.contact_email || '',
          contact_phone: agencyData?.contact_phone || '',
          address: agencyData?.address || '',
          city: agencyData?.city || '',
          postal_code: agencyData?.postal_code || ''
        }
      };
      
      // Fonction pour remplacer les variables dans un texte
      const replaceVariables = (text: string): string => {
        return text.replace(/\{\{([\w]+)\.([\w]+)\}\}/g, (match, table, field) => {
          if (valueMap[table] && valueMap[table][field] !== undefined) {
            return valueMap[table][field];
          }
          return match; // Garder la variable telle quelle si pas de correspondance
        });
      };
      
      // Parcourir les blocs du modèle et les ajouter au PDF
      // Définir la position verticale initiale en fonction de la hauteur de l'en-tête
      let yPosition = showLogo ? 60 : 40; // Position verticale initiale ajustée pour commencer après l'en-tête
      
      // Interface pour les blocs du modèle de contrat
      interface TemplateBlock {
        id: string;
        type: string;
        content: string;
        position: { x: number; y: number };
        style?: {
          fontSize?: string;
          fontWeight?: string;
          fontFamily?: string;
          color?: string;
          textAlign?: 'left' | 'center' | 'right';
        };
      }
      
      // Traiter chaque bloc de texte du modèle
      templateData.template_json.blocks.forEach((block: TemplateBlock) => {
        if (block.type === 'text' && block.content) {
          // Remplacer les variables dans le contenu du bloc
          const processedContent = replaceVariables(block.content);
          
          // Définir le style du texte
          const fontSize = block.style?.fontSize ? parseInt(block.style.fontSize) : 12;
          doc.setFontSize(fontSize);
          
          if (block.style?.fontWeight === 'bold') {
            doc.setFont('helvetica', 'bold');
          } else {
            doc.setFont('helvetica', 'normal');
          }
          
          // Ajouter le texte au PDF avec l'alignement approprié
          const lines = doc.splitTextToSize(processedContent, 170); // Largeur maximale
          
          // Déterminer l'alignement horizontal
          const textAlign = block.style?.textAlign || 'left';
          let xPosition = 20; // Position par défaut (gauche)
          
          // Interface pour les options de texte de jsPDF
          interface TextOptions {
            align?: 'left' | 'center' | 'right';
            baseline?: string;
            angle?: number;
            charSpace?: number;
            lineHeightFactor?: number;
            maxWidth?: number;
            flags?: { noBOM?: boolean; autoencode?: boolean };
          }
          
          const textOptions: TextOptions = {};
          
          if (textAlign === 'center') {
            xPosition = 105; // Centre de la page (210/2)
            textOptions.align = 'center';
          } else if (textAlign === 'right') {
            xPosition = 190; // Droite (marge de 20 depuis la droite)
            textOptions.align = 'right';
          }
          
          doc.text(lines, xPosition, yPosition, textOptions);
          
          // Mettre à jour la position verticale pour le prochain bloc
          yPosition += lines.length * (fontSize / 2) + 10;
        }
      });
      
      // Ajouter les signatures au bas de la page
      if (templateData.template_json.settings.signatures) {
        // Positionner les signatures au bas de la page
        const pageHeight = doc.internal.pageSize.height;
        const signatureY = pageHeight - 20; // 20 units from the bottom
        
        // Ajouter chaque signature activée
        templateData.template_json.settings.signatures
          .filter(signature => signature.enabled)
          .forEach(signature => {
            // Déterminer la position horizontale de la signature
            let xPos = 40; // Position par défaut (gauche)
            const textOptions: TextOptions = { align: 'left' };
            
            if (signature.position === 'center') {
              xPos = 105; // Centre de la page (210/2)
              textOptions.align = 'center';
            } else if (signature.position === 'right') {
              xPos = 170; // Droite
              textOptions.align = 'right';
            }
            
            // Ajouter le texte de la signature
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(signature.text, xPos, signatureY, textOptions);
            
            // Ajouter un trait sous la signature
            const lineWidth = 60; // Largeur du trait
            let lineStartX = xPos - lineWidth / 2;
            
            if (signature.position === 'left') {
              lineStartX = 20;
            } else if (signature.position === 'right') {
              lineStartX = 130;
            }
            
            doc.line(lineStartX, signatureY + 5, lineStartX + lineWidth, signatureY + 5);
          });
      }
      
      // Sauvegarder le PDF
      doc.save(`Contrat_${reservation.reservation_number}.pdf`);
      
      toast.success('Contrat personnalisé généré avec succès');
    } catch (error) {
      console.error('Error generating custom contract PDF:', error);
      toast.error('Erreur lors de la génération du contrat personnalisé');
      
      // Fallback au modèle standard en cas d'erreur
      generateContractPDF(reservation, client, cin, startDate, endDate);
    }
  };

  // Fonction standard de génération de contrat (utilisée comme fallback)
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
      doc.text(`CIN/Passeport: ${cin}`, 20, 190);
      
      if (client.email) {
        doc.text(`Email: ${client.email}`, 20, 200);
      }
      
      doc.setFontSize(14);
      doc.text("DÉTAILS DE LA TRANSACTION", 20, 220);
      doc.setFontSize(12);
      doc.text(`Numéro de ${reservation.type.toLowerCase()}: ${reservation.reservation_number}`, 20, 230);
      doc.text(`Date de création: ${format(new Date(reservation.created_at), 'PP', { locale: fr })}`, 20, 240);
      
      let signatureY = 260; // Position par défaut des signatures
      
      if (isLocationReservation && startDate && endDate) {
        doc.text(`Date de début: ${format(new Date(startDate), 'dd/MM/yyyy', { locale: fr })}`, 20, 250);
        doc.text(`Date de fin: ${format(new Date(endDate), 'dd/MM/yyyy', { locale: fr })}`, 20, 260);
        
        // Vérification du type de location et ajout de la mention pour les locations longue durée
        console.log('Debug - PDF - Type Location Check:', reservation.property.type_location);
        
        // Vérification case-insensitive du type de location
        const propertyTypeLocation = (reservation.property.type_location || '').toLowerCase();
        const isLongTermRental = propertyTypeLocation === 'longue_duree';
        
        console.log('Debug - PDF - Property Type Location (lowercase):', propertyTypeLocation);
        console.log('Debug - PDF - Is Long Term Rental:', isLongTermRental);
        
        if (isLongTermRental) {
          doc.text("Ce contrat est renouvelable chaque mois dès que l'acompte est versé.", 20, 270);
          console.log('Debug - PDF - Added renewal clause for long term rental');
          signatureY = 290; // Ajuster la position des signatures
        } else {
          signatureY = 290; // Pour les locations courte durée
        }
      }
      
      // Les signatures ont été supprimées à la demande du client
      
      doc.save(`Contrat_${reservation.reservation_number}.pdf`);
      
      toast.success('Contrat généré avec succès');
    } catch (error) {
      console.error('Error generating contract PDF:', error);
      toast.error('Erreur lors de la génération du contrat');
    }
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    
    // Initialiser la date de rendez-vous
    setAppointmentDate(reservation.appointment_date ? new Date(reservation.appointment_date) : null);
    
    // Initialiser la note de visite
    setVisitNote(reservation.note_rv || "");
    
    // Initialiser les dates de location
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
      
      // Créer une réservation mise à jour avec le nouveau statut
      const updatedReservation = { 
        ...selectedReservation, 
        appointment_date: date.toISOString(), 
        status: 'Visite programmée'
      };
      
      // Mettre à jour la réservation sélectionnée
      setSelectedReservation(updatedReservation);
      
      // Initialiser la note de visite (vide puisque c'est un nouveau rendez-vous)
      setVisitNote("");
      
      // Mettre à jour la liste des réservations
      const updatedReservations = reservations.map(res => 
        res.id === selectedReservation.id ? updatedReservation : res
      );
      setReservations(updatedReservations);
      
      // Mettre à jour le compteur d'opportunités en attente
      if (selectedReservation.status === 'En attente') {
        setPendingOpportunitiesCount(count => Math.max(0, count - 1));
      }
      
      // Appliquer les filtres pour mettre à jour l'affichage
      applyFilters();
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
      
      // Mettre à jour l'objet selectedReservation avec la nouvelle note
      // pour que la note persiste si on ferme et réouvre le dialogue
      setSelectedReservation({
        ...selectedReservation,
        note_rv: visitNote
      });
      
      // Mettre à jour la liste des réservations pour que les données soient cohérentes
      const updatedReservations = reservations.map(res => 
        res.id === selectedReservation.id ? {...res, note_rv: visitNote} : res
      );
      setReservations(updatedReservations);
      
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
              <div>
                <label className="text-sm font-medium mb-1 block">Période</label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les périodes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les périodes</SelectItem>
                    <SelectItem value="current">Mois en cours</SelectItem>
                    <SelectItem value="previous">Mois précédent</SelectItem>
                    <SelectItem value="01">Janvier</SelectItem>
                    <SelectItem value="02">Février</SelectItem>
                    <SelectItem value="03">Mars</SelectItem>
                    <SelectItem value="04">Avril</SelectItem>
                    <SelectItem value="05">Mai</SelectItem>
                    <SelectItem value="06">Juin</SelectItem>
                    <SelectItem value="07">Juillet</SelectItem>
                    <SelectItem value="08">Août</SelectItem>
                    <SelectItem value="09">Septembre</SelectItem>
                    <SelectItem value="10">Octobre</SelectItem>
                    <SelectItem value="11">Novembre</SelectItem>
                    <SelectItem value="12">Décembre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setPropertyRefFilter("");
                setReservationRefFilter("");
                setStatusFilter("");
                setOpportunityTypeFilter("");
                setMonthFilter("");
                // Réappliquer les filtres après réinitialisation
                setTimeout(() => {
                  applyFilters();
                }, 0);
              }} className="mr-2">
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

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
              // Si le dialogue est ouvert, on s'assure que les données sont correctement initialisées
              if (open && selectedReservation) {
                // Réinitialiser la date de rendez-vous
                setAppointmentDate(selectedReservation.appointment_date ? new Date(selectedReservation.appointment_date) : null);
                
                // Réinitialiser la note de visite
                setVisitNote(selectedReservation.note_rv || "");
                
                // Réinitialiser les dates de location
                if (selectedReservation.type === 'Location') {
                  if (selectedReservation.rental_start_date) {
                    setRentalStartDate(format(new Date(selectedReservation.rental_start_date), 'yyyy-MM-dd'));
                  } else {
                    setRentalStartDate("");
                  }
                  
                  if (selectedReservation.rental_end_date) {
                    setRentalEndDate(format(new Date(selectedReservation.rental_end_date), 'yyyy-MM-dd'));
                  } else {
                    setRentalEndDate("");
                  }
                }
                
                // Réexécuter les fonctions de récupération des données client et location
                // à chaque ouverture du dialogue, même si c'est pour la même réservation
                if (selectedReservation.client_phone) {
                  fetchClientDetails(selectedReservation.client_phone);
                  fetchClientReservations(selectedReservation.client_phone);
                }
              }
              setIsDialogOpen(open);
            }}>
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
                            Numéro CIN ou passeport du client
                          </label>
                          <Input
                            value={clientCIN}
                            onChange={(e) => setClientCIN(e.target.value)}
                            placeholder="Entrez le numéro CIN ou passeport"
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
