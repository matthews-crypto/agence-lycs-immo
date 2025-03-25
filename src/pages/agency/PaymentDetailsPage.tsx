import { useEffect, useState } from "react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { format, addMonths, endOfMonth, startOfMonth, isAfter, isBefore, isSameMonth, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type LocationData = {
  id: string;
  rental_start_date: string;
  rental_end_date: string;
  paiement: boolean | null;
  property: {
    title: string;
    reference_number: string;
    type_location: string | null;
  };
  client: {
    first_name: string;
    last_name: string;
    phone_number: string;
  };
};

type MonthSelection = {
  date: Date;
  selected: boolean;
};

export default function PaymentDetailsPage() {
  const { agency } = useAgencyContext();
  const { locationId } = useParams<{ locationId: string }>();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [months, setMonths] = useState<MonthSelection[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const monthsPerPage = 12;
  const navigate = useNavigate();

  useEffect(() => {
    if (!agency?.id || !locationId) return;

    const fetchLocationDetails = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('locations')
          .select(`
            id,
            rental_start_date,
            rental_end_date,
            paiement,
            property:property_id (
              title,
              reference_number,
              type_location
            ),
            client:client_id (
              first_name,
              last_name,
              phone_number
            )
          `)
          .eq('id', locationId)
          .single();

        if (error) {
          throw error;
        }

        // Conversion sécurisée pour éviter les erreurs de type
        const locationData = data as unknown as LocationData;
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
  }, [agency?.id, locationId]);

  // Générer un calendrier de mois à partir de la date de début de location
  const generateMonthsCalendar = (locationData: LocationData) => {
    if (!locationData.rental_start_date) return;

    const startDate = parseISO(locationData.rental_start_date);
    const currentDate = new Date();
    const startMonth = startOfMonth(startDate > currentDate ? startDate : currentDate);
    
    // Générer 36 mois (3 ans) pour permettre une pagination
    const totalMonths = 36;
    setTotalPages(Math.ceil(totalMonths / monthsPerPage));
    
    const monthsArray: MonthSelection[] = [];
    
    for (let i = 0; i < totalMonths; i++) {
      const monthDate = addMonths(startMonth, i);
      
      // Vérifier si ce mois est déjà couvert par la date de fin actuelle
      let isSelected = false;
      if (locationData.rental_end_date) {
        const endDate = parseISO(locationData.rental_end_date);
        isSelected = isSameMonth(monthDate, endDate) || 
                    (isAfter(endDate, monthDate) && isBefore(monthDate, endDate));
      }
      
      monthsArray.push({
        date: monthDate,
        selected: isSelected
      });
    }
    
    setMonths(monthsArray);
  };

  const handleBackClick = () => {
    navigate(`/${agency?.slug}/agency/payments`);
  };

  const handleMonthClick = (index: number) => {
    // Calculer l'index réel en fonction de la page actuelle
    const realIndex = index + (currentPage * monthsPerPage);
    
    // Vérifier si on peut sélectionner ce mois
    const updatedMonths = [...months];
    
    // Si on clique sur un mois déjà sélectionné, on le désélectionne ainsi que tous les mois suivants
    if (updatedMonths[realIndex].selected) {
      for (let i = realIndex; i < updatedMonths.length; i++) {
        updatedMonths[i].selected = false;
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
        updatedMonths[i].selected = true;
      }
    }
    
    setMonths(updatedMonths);
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

  const handleSavePayment = async () => {
    if (!location) return;
    
    setIsSaving(true);
    
    try {
      // Trouver le dernier mois sélectionné
      const lastSelectedMonthIndex = months.map(m => m.selected).lastIndexOf(true);
      
      if (lastSelectedMonthIndex === -1) {
        toast.error("Veuillez sélectionner au moins un mois");
        return;
      }
      
      // Calculer la nouvelle date de fin (dernier jour du dernier mois sélectionné)
      const lastSelectedMonth = months[lastSelectedMonthIndex].date;
      const newEndDate = endOfMonth(lastSelectedMonth);
      
      // Mettre à jour la location avec la nouvelle date de fin et le statut de paiement
      const { error } = await supabase
        .from('locations')
        .update({
          rental_end_date: format(newEndDate, 'yyyy-MM-dd'),
          paiement: true
        })
        .eq('id', location.id);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour l'état local
      setLocation({
        ...location,
        rental_end_date: format(newEndDate, 'yyyy-MM-dd'),
        paiement: true
      });
      
      toast.success("Paiement enregistré avec succès");
    } catch (error) {
      console.error("Error saving payment:", error);
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

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h1 className="text-2xl font-bold">Détails du Paiement</h1>
            <Button 
              variant="outline" 
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux paiements
            </Button>
          </div>
          
          {isLoading ? (
            <p>Chargement...</p>
          ) : !location ? (
            <p>Location non trouvée</p>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{location.property?.title} ({location.property?.reference_number})</CardTitle>
                  {getPaymentStatusBadge(location.paiement)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Informations sur la location</h3>
                      <p>
                        <span className="font-medium">Client:</span> {location.client?.first_name} {location.client?.last_name}
                      </p>
                      <p>
                        <span className="font-medium">Téléphone:</span> {location.client?.phone_number || 'Non spécifié'}
                      </p>
                      <p>
                        <span className="font-medium">Date de début:</span> {location.rental_start_date ? format(new Date(location.rental_start_date), 'dd/MM/yyyy') : 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium">Date de fin:</span> {location.rental_end_date ? format(new Date(location.rental_end_date), 'dd/MM/yyyy') : 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium">Type de location:</span> {location.property?.type_location === 'longue_duree' ? 'Longue durée' : 'Courte durée'}
                      </p>
                    </div>
                  </div>
                  
                  {location.property?.type_location === 'longue_duree' ? (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">Gestion des paiements</h3>
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
                      
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                        {getCurrentPageMonths().map((month, index) => (
                          <div
                            key={index}
                            className={`border rounded-md p-2 text-center cursor-pointer transition-colors ${
                              month.selected 
                                ? 'bg-primary text-primary-foreground' 
                                : 'hover:bg-gray-100'
                            }`}
                            onClick={() => handleMonthClick(index)}
                          >
                            <CalendarIcon className="h-4 w-4 mx-auto mb-1" />
                            <span className="text-sm font-medium">
                              {format(month.date, 'MMMM yyyy', { locale: fr })}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        onClick={handleSavePayment} 
                        disabled={isSaving || !months.some(m => m.selected)}
                        className="w-full md:w-auto"
                      >
                        {isSaving ? 'Enregistrement...' : 'Enregistrer le paiement'}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">Gestion du paiement</h3>
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
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
