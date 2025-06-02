import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, addMonths, endOfMonth, startOfMonth, isAfter, isBefore, isSameMonth, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PropertyHeader from "@/components/property/PropertyHeader";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type LocationDetails = {
  id: string;
  rental_start_date: string;
  rental_end_date: string;
  client_cin: string | null;
  document_url: string | null;
  statut: string;
  paiement: boolean | null;
  mois_paye?: number;
  paid_months?: string[] | any; // Pour stocker les mois payés au format ['2025-05', '2025-06', ...]
  property: {
    id: string;
    title: string;
    reference_number: string;
    address: string | null;
    price: number;
    type_location: string | null;
  };
  client: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
  };
};

type MonthSelection = {
  date: Date;
  selected: boolean;
  paid: boolean;
};

type PaymentMethod = 'wave' | 'espece' | 'carte_bancaire' | 'orange_money';

type PaymentDetails = {
  id?: string;
  payment_method: PaymentMethod;
  amount: number;
  payment_date: string;
  months_covered: number;
  created_at?: string;
};

export default function LocationDetailPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const [location, setLocation] = useState<LocationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { agency } = useAgencyContext();
  const isMobile = useIsMobile();
  
  // États pour la gestion des paiements
  const [months, setMonths] = useState<MonthSelection[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const monthsPerPage = 12;
  
  // États pour le dialogue de paiement
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('espece');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonthsCount, setSelectedMonthsCount] = useState<number>(0);
  
  // États pour le dialogue de détails d'un paiement existant
  const [isPaymentDetailsDialogOpen, setIsPaymentDetailsDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isLoadingPaymentDetails, setIsLoadingPaymentDetails] = useState(false);

  const goBack = () => {
    navigate(`/${agency?.slug}/agency/planning`);
  };

  useEffect(() => {
    if (!locationId) return;

    const fetchLocationDetails = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("locations")
          .select(`
            id,
            rental_start_date,
            rental_end_date,
            client_cin,
            document_url,
            statut,
            paiement,
            mois_paye,
            paid_months,
            property:properties(id, title, reference_number, address, price, type_location),
            client:clients(id, first_name, last_name, email, phone_number)
          `)
          .eq("id", locationId)
          .single();

        if (error) {
          throw error;
        }

        console.log("Location details:", data);
        const locationData = data as LocationDetails;
        setLocation(locationData);
        
        // Générer les mois pour le calendrier uniquement pour les locations longue durée
        if (locationData.property?.type_location === 'longue_duree') {
          generateMonthsCalendar(locationData);
        }
      } catch (error) {
        console.error("Error fetching location details:", error);
        toast.error("Erreur lors du chargement des détails de la location");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationDetails();
  }, [locationId]);
  
  // Générer un calendrier de mois à partir de la date de début de location
  const generateMonthsCalendar = (locationData: LocationDetails) => {
    if (!locationData.rental_start_date) return;

    const startDate = parseISO(locationData.rental_start_date);
    const currentDate = new Date();
    const startMonth = startOfMonth(startDate > currentDate ? startDate : currentDate);
    
    // Générer 36 mois (3 ans) pour permettre une pagination
    const totalMonths = 36;
    setTotalPages(Math.ceil(totalMonths / monthsPerPage));
    
    const monthsArray: MonthSelection[] = [];
    
    // Récupérer les mois déjà payés depuis la base de données
    // Format attendu: ['2025-05', '2025-06', ...]
    let paidMonths = [];
    
    // Vérifier si paid_months existe et le traiter selon son type
    if (locationData.paid_months) {
      try {
        if (typeof locationData.paid_months === 'string') {
          paidMonths = JSON.parse(locationData.paid_months);
        } else if (Array.isArray(locationData.paid_months)) {
          paidMonths = locationData.paid_months;
        } else if (typeof locationData.paid_months === 'object') {
          // Si c'est un objet JSON de Supabase
          paidMonths = Array.isArray(locationData.paid_months) ? locationData.paid_months : [];
        }
      } catch (error) {
        console.error("Erreur lors du parsing des mois payés:", error);
        paidMonths = [];
      }
    }
    
    console.log("Mois payés chargés:", paidMonths);
    
    for (let i = 0; i < totalMonths; i++) {
      const monthDate = addMonths(startMonth, i);
      const monthKey = format(monthDate, 'yyyy-MM');
      
      // Vérifier si ce mois est déjà couvert par la date de fin actuelle
      let isSelected = false;
      if (locationData.rental_end_date) {
        const endDate = parseISO(locationData.rental_end_date);
        isSelected = isSameMonth(monthDate, endDate) || 
                    (isAfter(endDate, monthDate) && isBefore(monthDate, endDate));
      }
      
      // Vérifier si ce mois est déjà payé
      const isPaid = Array.isArray(paidMonths) && paidMonths.includes(monthKey);
      
      monthsArray.push({
        date: monthDate,
        selected: isSelected,
        paid: isPaid
      });
    }
    
    setMonths(monthsArray);
  };

  const handleResiliationContract = async () => {
    if (!location?.id) return;

    try {
      // Mettre à jour le statut de la location à "TERMINE" (sans accent pour respecter la contrainte de la BD)
      const { error: locationError } = await supabase
        .from("locations")
        .update({
          statut: "TERMINE",
          rental_end_date: new Date().toISOString(),
          effective_end_date: new Date().toISOString()
        })
        .eq("id", location.id);

      if (locationError) {
        throw locationError;
      }

      // Mettre à jour le statut du bien à "DISPONIBLE"
      const { error: propertyError } = await supabase
        .from("properties")
        .update({
          property_status: "DISPONIBLE"
        })
        .eq("id", location.property.id);

      if (propertyError) {
        throw propertyError;
      }

      toast.success("Contrat résilié avec succès");
      setIsDialogOpen(false);
      
      // Mettre à jour l'état local
      setLocation({
        ...location,
        statut: "TERMINE",
        rental_end_date: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error resiliating contract:", error);
      toast.error("Erreur lors de la résiliation du contrat");
    }
  };
  
  // Fonctions pour la gestion des paiements
  const handleMonthClick = (index: number) => {
    // Calculer l'index réel en fonction de la page actuelle
    const realIndex = index + (currentPage * monthsPerPage);
    const month = months[realIndex];
    
    // Si le mois est déjà payé, afficher les détails du paiement
    if (month.paid) {
      const monthKey = format(month.date, 'yyyy-MM');
      fetchPaymentDetails(monthKey);
      return;
    }
    
    // Vérifier si on peut sélectionner ce mois
    const updatedMonths = [...months];
    
    // Si on clique sur un mois déjà sélectionné, on le désélectionne ainsi que tous les mois suivants
    if (updatedMonths[realIndex].selected) {
      for (let i = realIndex; i < updatedMonths.length; i++) {
        if (!updatedMonths[i].paid) { // Ne pas désélectionner les mois déjà payés
          updatedMonths[i].selected = false;
        }
      }
    } else {
      // Sinon, on sélectionne ce mois et tous les mois précédents jusqu'au premier mois sélectionné
      let firstSelectedIndex = -1;
      
      // Trouver le premier mois sélectionné
      for (let i = 0; i < realIndex; i++) {
        if (updatedMonths[i].selected) {
          firstSelectedIndex = i;
          break;
        }
      }
      
      // Si aucun mois n'est sélectionné, on commence à partir du premier mois
      if (firstSelectedIndex === -1) {
        firstSelectedIndex = 0;
      }
      
      // Sélectionner tous les mois entre le premier mois sélectionné et le mois cliqué
      for (let i = firstSelectedIndex; i <= realIndex; i++) {
        if (!updatedMonths[i].paid) { // Ne pas sélectionner les mois déjà payés
          updatedMonths[i].selected = true;
        }
      }
    }
    
    setMonths(updatedMonths);
    
    // Calculer le nombre de mois sélectionnés
    const selectedCount = updatedMonths.filter(m => m.selected && !m.paid).length;
    setSelectedMonthsCount(selectedCount);
    
    // Calculer le montant du paiement
    if (location && selectedCount > 0) {
      const monthlyPrice = location.property.price || 0;
      setPaymentAmount(monthlyPrice * selectedCount);
    } else {
      setPaymentAmount(0);
    }
  };
  
  // Fonction pour récupérer les détails d'un paiement pour un mois spécifique
  const fetchPaymentDetails = async (monthKey: string) => {
    if (!locationId) return;
    
    setIsLoadingPaymentDetails(true);
    setSelectedMonth(monthKey);
    
    try {
      // Récupérer le paiement qui couvre ce mois
      const { data, error } = await supabase
        .from('payment_details')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false })
        .limit(10); // Limiter aux 10 derniers paiements pour des raisons de performance
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        toast.error("Aucun détail de paiement trouvé pour ce mois");
        setIsLoadingPaymentDetails(false);
        return;
      }
      
      // Trouver le paiement le plus récent qui correspond à ce mois
      // Nous supposons que le paiement le plus récent est celui qui contient les informations les plus à jour
      const paymentDetail = data[0] as PaymentDetails;
      
      setPaymentDetails(paymentDetail);
      setIsPaymentDetailsDialogOpen(true);
    } catch (error) {
      console.error("Erreur lors de la récupération des détails du paiement:", error);
      toast.error("Erreur lors de la récupération des détails du paiement");
    } finally {
      setIsLoadingPaymentDetails(false);
    }
  };
  
  const openPaymentDialog = () => {
    // Vérifier s'il y a des mois sélectionnés
    const selectedCount = months.filter(m => m.selected && !m.paid).length;
    if (selectedCount === 0) {
      toast.error("Veuillez sélectionner au moins un mois pour effectuer un paiement");
      return;
    }
    
    // Initialiser les valeurs du dialogue
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentMethod('espece');
    
    // Calculer le montant du paiement
    if (location) {
      const monthlyPrice = location.property.price || 0;
      setPaymentAmount(monthlyPrice * selectedCount);
    }
    
    // Ouvrir le dialogue
    setIsPaymentDialogOpen(true);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const savePayment = async () => {
    if (!location || !locationId) return;
    setIsSaving(true);
    
    try {
      // Récupérer les mois sélectionnés qui ne sont pas encore payés
      const selectedMonths = months.filter(m => m.selected && !m.paid);
      
      if (selectedMonths.length === 0) {
        toast.error("Veuillez sélectionner au moins un mois non payé");
        setIsSaving(false);
        return;
      }
      
      // Formater les mois sélectionnés pour la base de données
      const selectedMonthsFormatted = selectedMonths.map(m => format(m.date, 'yyyy-MM'));
      
      // Récupérer les mois déjà payés
      let existingPaidMonths = [];
      
      if (location.paid_months) {
        try {
          if (typeof location.paid_months === 'string') {
            existingPaidMonths = JSON.parse(location.paid_months);
          } else if (Array.isArray(location.paid_months)) {
            existingPaidMonths = location.paid_months;
          } else if (typeof location.paid_months === 'object') {
            existingPaidMonths = Array.isArray(location.paid_months) ? location.paid_months : [];
          }
        } catch (error) {
          console.error("Erreur lors du parsing des mois payés existants:", error);
          existingPaidMonths = [];
        }
      }
      
      console.log("Mois déjà payés:", existingPaidMonths);
      console.log("Nouveaux mois sélectionnés:", selectedMonthsFormatted);
      
      // Fusionner les mois déjà payés avec les nouveaux mois sélectionnés
      const allPaidMonths = [...existingPaidMonths, ...selectedMonthsFormatted];
      console.log("Tous les mois payés après fusion:", allPaidMonths);
      
      // Calculer la nouvelle date de fin (dernier jour du dernier mois sélectionné)
      const lastSelectedMonth = [...selectedMonths].pop();
      const newEndDate = lastSelectedMonth ? endOfMonth(lastSelectedMonth.date) : null;
      
      // Créer l'entrée dans la table payment_details
      const { error: paymentError } = await supabase
        .from('payment_details')
        .insert({
          location_id: locationId,
          payment_date: new Date(paymentDate).toISOString(),
          amount: paymentAmount,
          payment_method: paymentMethod,
          months_covered: selectedMonths.length
        });
      
      if (paymentError) {
        console.error('Erreur lors de l\'enregistrement des détails du paiement:', paymentError);
        toast.error("Erreur lors de l'enregistrement des détails du paiement");
        setIsSaving(false);
        return;
      }
      
      // Mettre à jour la location avec les nouveaux mois payés
      const { error: locationError } = await supabase
        .from('locations')
        .update({
          rental_end_date: newEndDate ? newEndDate.toISOString() : location.rental_end_date,
          mois_paye: allPaidMonths.length,
          paiement: true,
          paid_months: allPaidMonths
        })
        .eq('id', locationId);
      
      if (locationError) {
        console.error('Erreur lors de la mise à jour de la location:', locationError);
        toast.error("Erreur lors de l'enregistrement du paiement");
      } else {
        toast.success("Paiement enregistré avec succès");
        // Mettre à jour les données locales
        if (location) {
          setLocation({
            ...location,
            rental_end_date: newEndDate ? newEndDate.toISOString() : location.rental_end_date,
            mois_paye: allPaidMonths.length,
            paiement: true,
            paid_months: allPaidMonths
          });
          
          // Mettre à jour l'état des mois
          const updatedMonths = [...months];
          selectedMonths.forEach(selectedMonth => {
            const monthKey = format(selectedMonth.date, 'yyyy-MM');
            const monthIndex = updatedMonths.findIndex(m => format(m.date, 'yyyy-MM') === monthKey);
            if (monthIndex !== -1) {
              updatedMonths[monthIndex].paid = true;
              updatedMonths[monthIndex].selected = false;
            }
          });
          setMonths(updatedMonths);
          
          // Réinitialiser le compteur de mois sélectionnés
          setSelectedMonthsCount(0);
        }
        
        // Fermer le dialogue de paiement
        setIsPaymentDialogOpen(false);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du paiement:', error);
      toast.error("Erreur lors de l'enregistrement du paiement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShortTermPaymentUpdate = async (paid: boolean) => {
    if (!location) return;
    
    setIsSaving(true);
    
    try {
      // Mettre à jour la location avec le statut de paiement
      const { error } = await supabase
        .from('locations')
        .update({
          paiement: paid
        })
        .eq('id', location.id);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour l'état local
      setLocation({
        ...location,
        paiement: paid
      });
      
      toast.success("Paiement mis à jour avec succès");
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Erreur lors de la mise à jour du paiement");
    } finally {
      setIsSaving(false);
    }
  };

  const getPaymentStatusBadge = (status: boolean | null) => {
    if (status === true) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Payé
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Non payé
        </Badge>
      );
    }
  };

  // Obtenir les mois à afficher pour la page actuelle
  const getCurrentPageMonths = () => {
    const startIndex = currentPage * monthsPerPage;
    return months.slice(startIndex, startIndex + monthsPerPage);
  };

  // Modifiers for the calendar to highlight rental duration
  const modifiers = {
    rentalPeriod: (date: Date) => {
      if (!location?.rental_start_date || !location?.rental_end_date) return false;
      
      const startDate = new Date(location.rental_start_date);
      const endDate = new Date(location.rental_end_date);
      return date >= startDate && date <= endDate;
    }
  };

  const modifiersStyles = {
    rentalPeriod: {
      backgroundColor: 'rgba(155, 135, 245, 0.2)',
      borderRadius: '0',
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
          <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
          <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-red-500">Location non trouvée</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PropertyHeader 
        onBack={goBack} 
        agencyLogo={agency?.logo_url || undefined}
        agencyName={agency?.agency_name}
        primaryColor={agency?.primary_color || '#9b87f5'}
      />
      
      <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800">
          Détails de la location: {location.property.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <Card className="shadow-md border-purple-100 hover:border-purple-200 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-2">
              <CardTitle className="text-purple-800">Détails du bien</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p><span className="font-medium text-gray-700">Référence:</span> <span className="text-gray-600">{location.property.reference_number}</span></p>
                <p><span className="font-medium text-gray-700">Titre:</span> <span className="text-gray-600">{location.property.title}</span></p>
                <p><span className="font-medium text-gray-700">Adresse:</span> <span className="text-gray-600">{location.property.address || 'Non spécifiée'}</span></p>
                <p><span className="font-medium text-gray-700">Prix:</span> <span className="text-gray-600">{location.property.price.toLocaleString()} FCFA</span></p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-purple-100 hover:border-purple-200 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-2">
              <CardTitle className="text-purple-800">Détails du client</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p><span className="font-medium text-gray-700">Nom:</span> <span className="text-gray-600">{location.client.first_name} {location.client.last_name}</span></p>
                <p><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-600">{location.client.email || 'Non spécifié'}</span></p>
                <p><span className="font-medium text-gray-700">Téléphone:</span> <span className="text-gray-600">{location.client.phone_number || 'Non spécifié'}</span></p>
                <p><span className="font-medium text-gray-700">CIN:</span> <span className="text-gray-600">{location.client_cin || 'Non spécifié'}</span></p>
                {location.document_url && (
                  <p>
                    <span className="font-medium text-gray-700">Document:</span>{' '}
                    <a 
                      href={location.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Voir le document
                    </a>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="shadow-md border-purple-100 hover:border-purple-200 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-2">
              <CardTitle className="text-purple-800">Période de location</CardTitle>
              <CardDescription className="text-gray-600">
                Du {format(new Date(location.rental_start_date), 'dd/MM/yyyy')} au {format(new Date(location.rental_end_date), 'dd/MM/yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className={`overflow-hidden ${isMobile ? 'scale-75 -ml-8' : ''}`}>
                <Calendar 
                  mode="default"
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  defaultMonth={new Date(location.rental_start_date)}
                  selected={[
                    new Date(location.rental_start_date),
                    new Date(location.rental_end_date)
                  ]}
                  className="p-3 border rounded-lg mx-auto max-w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-purple-100 hover:border-purple-200 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-2">
              <CardTitle className="text-purple-800">Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col h-full">
              <div className="space-y-2">
                <p><span className="font-medium text-gray-700 inline-block w-36">Statut:</span> 
                  <span className="text-white bg-green-600 px-2 py-1 rounded-full text-xs ml-2">{location.statut}</span>
                </p>
                <p><span className="font-medium text-gray-700 inline-block w-36">Paiement:</span> 
                  <span className="ml-2">{getPaymentStatusBadge(location.paiement)}</span>
                </p>
                <p><span className="font-medium text-gray-700">Date de début:</span> <span className="text-gray-600">{format(new Date(location.rental_start_date), 'dd/MM/yyyy')}</span></p>
                <p><span className="font-medium text-gray-700">Date de fin prévue:</span> <span className="text-gray-600">{format(new Date(location.rental_end_date), 'dd/MM/yyyy')}</span></p>
              
                <Button 
                  variant="destructive" 
                  className="mt-4 bg-red-500 hover:bg-red-600 transition-colors shadow-md w-full"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Résilier le contrat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Section de gestion des paiements */}
        <div className="mt-6">
          <Card className="shadow-md border-purple-100 hover:border-purple-200 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-2">
              <CardTitle className="text-purple-800">Gestion des paiements</CardTitle>
              <CardDescription className="text-gray-600">
                Gérez les paiements pour cette location
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {location.property?.type_location === 'longue_duree' ? (
                <div>
                  <p className="mb-4">Sélectionnez les mois à payer. La date de fin de location sera mise à jour au dernier jour du dernier mois sélectionné.</p>
                  
                  <div className="flex justify-between items-center mb-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <span className="text-sm">
                      Page {currentPage + 1} sur {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages - 1}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {months
                      .slice(currentPage * monthsPerPage, (currentPage + 1) * monthsPerPage)
                      .map((month, index) => (
                        <Button
                          key={format(month.date, 'yyyy-MM')}
                          variant={month.paid ? "default" : month.selected ? "secondary" : "outline"}
                          className={`h-12 ${month.paid ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                          onClick={() => handleMonthClick(index)}
                        >
                          {format(month.date, 'MMMM yyyy', { locale: fr })}
                        </Button>
                      ))}
                  </div>
                  
                  <Button 
                    onClick={openPaymentDialog} 
                    disabled={!months.some(m => m.selected && !m.paid)}
                    className="w-full md:w-auto mt-4"
                  >
                    Enregistrer {months.filter(m => m.selected && !m.paid).length} mois de paiement
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="mb-4">Pour les locations courte durée, indiquez simplement si le séjour a été payé ou non.</p>
                  
                  <div className="flex gap-4 mt-6">
                    <Button 
                      variant={location.paiement ? "default" : "outline"}
                      className="flex items-center gap-2"
                      onClick={() => handleShortTermPaymentUpdate(true)}
                      disabled={isSaving || location.paiement === true}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Marquer comme payé
                    </Button>
                    
                    <Button 
                      variant={!location.paiement ? "default" : "outline"}
                      className="flex items-center gap-2"
                      onClick={() => handleShortTermPaymentUpdate(false)}
                      disabled={isSaving || location.paiement === false}
                    >
                      <XCircle className="h-4 w-4" />
                      Marquer comme non payé
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmation de résiliation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir résilier ce contrat de location ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleResiliationContract}>
              Confirmer la résiliation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de paiement */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrement du paiement</DialogTitle>
            <DialogDescription>
              Veuillez saisir les détails du paiement pour {selectedMonthsCount} mois.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-amount" className="text-right">
                Montant
              </Label>
              <Input
                id="payment-amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="col-span-3"
                readOnly
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-method" className="text-right">
                Mode de paiement
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un mode de paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="espece">Espèce</SelectItem>
                  <SelectItem value="wave">Wave</SelectItem>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                  <SelectItem value="carte_bancaire">Carte bancaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-date" className="text-right">
                Date de paiement
              </Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={savePayment} 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Confirmer le paiement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de détails d'un paiement existant */}
      <Dialog open={isPaymentDetailsDialogOpen} onOpenChange={setIsPaymentDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader className="bg-gradient-to-r from-purple-50 to-white pb-2 rounded-t-lg">
            <DialogTitle className="text-purple-800 text-xl">
              Détails du paiement
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedMonth ? (
                <span className="font-medium">
                  Mois de {format(new Date(`${selectedMonth}-01`), 'MMMM yyyy', { locale: fr })}
                </span>
              ) : ''}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingPaymentDetails ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-500">Chargement des détails...</p>
              </div>
            </div>
          ) : paymentDetails ? (
            <div className="py-6 px-2 sm:px-4">
              {/* Montant du paiement avec badge coloré */}
              <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-100 shadow-sm">
                <p className="text-sm text-green-600 mb-1">Montant payé</p>
                <p className="text-2xl font-bold text-green-700">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(paymentDetails.amount)}
                </p>
              </div>
              
              {/* Détails du paiement en cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Mode de paiement */}
                <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center mb-2">
                    {paymentDetails.payment_method === 'espece' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    )}
                    {paymentDetails.payment_method === 'wave' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                      </svg>
                    )}
                    {paymentDetails.payment_method === 'orange_money' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    )}
                    {paymentDetails.payment_method === 'carte_bancaire' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    )}
                    <p className="text-sm text-gray-500">Mode de paiement</p>
                  </div>
                  <p className="text-base font-medium">
                    {paymentDetails.payment_method === 'espece' && 'Espèce'}
                    {paymentDetails.payment_method === 'wave' && 'Wave'}
                    {paymentDetails.payment_method === 'orange_money' && 'Orange Money'}
                    {paymentDetails.payment_method === 'carte_bancaire' && 'Carte bancaire'}
                  </p>
                </div>
                
                {/* Date de paiement */}
                <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-500">Date de paiement</p>
                  </div>
                  <p className="text-base font-medium">
                    {format(new Date(paymentDetails.payment_date), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                
                {/* Nombre de mois couverts */}
                <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-500">Mois couverts</p>
                  </div>
                  <p className="text-base font-medium">
                    {paymentDetails.months_covered} {paymentDetails.months_covered > 1 ? 'mois' : 'mois'}
                  </p>
                </div>
                
                {/* Date d'enregistrement */}
                {paymentDetails.created_at && (
                  <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-gray-500">Enregistré le</p>
                    </div>
                    <p className="text-base font-medium">
                      {format(new Date(paymentDetails.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 mb-2">Aucune information disponible</p>
              <p className="text-sm text-gray-400">Les détails de ce paiement n'ont pas pu être récupérés.</p>
            </div>
          )}
          
          <DialogFooter className="sm:justify-center border-t border-gray-100 pt-4 mt-2">
            <Button 
              onClick={() => setIsPaymentDetailsDialogOpen(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
