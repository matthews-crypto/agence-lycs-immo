import { supabase } from "@/integrations/supabase/client";
import { format, isAfter, parseISO } from "date-fns";

type LocationPayment = {
  id: string;
  rental_end_date: string;
  paiement: boolean;
};

// Type pour les mises à jour de la table locations
type LocationUpdate = {
  paiement: boolean;
};

/**
 * Vérifie les locations dont la date de fin est dépassée et met à jour leur statut de paiement à "non payé"
 */
export const checkAndUpdatePaymentStatus = async () => {
  try {
    const today = new Date();
    
    // Récupérer toutes les locations avec le statut "EN COURS" et qui sont marquées comme payées
    const { data, error } = await supabase
      .from('locations')
      .select('id, rental_end_date, paiement')
      .eq('statut', 'EN COURS')
      .eq('paiement', true);
    
    if (error) {
      console.error("Erreur lors de la récupération des locations:", error);
      return { success: false, error };
    }
    
    // Conversion sécurisée pour éviter les erreurs de type
    const locationsData = data as unknown as LocationPayment[];
    
    // Filtrer les locations dont la date de fin est dépassée
    const locationsToUpdate = locationsData.filter(location => {
      if (!location.rental_end_date) return false;
      
      const endDate = parseISO(location.rental_end_date);
      return isAfter(today, endDate);
    });
    
    // Mettre à jour le statut de paiement des locations concernées
    if (locationsToUpdate.length > 0) {
      // Définir les données à mettre à jour avec un type spécifique
      const updateData: LocationUpdate = { paiement: false };
      
      const { error: updateError } = await supabase
        .from('locations')
        .update(updateData as unknown as Record<string, unknown>)
        .in('id', locationsToUpdate.map(loc => loc.id));
      
      if (updateError) {
        console.error("Erreur lors de la mise à jour des statuts de paiement:", updateError);
        return { success: false, error: updateError };
      }
      
      console.log(`${locationsToUpdate.length} locations ont été marquées comme non payées car leur date de fin est dépassée.`);
    }
    
    return { success: true, updatedCount: locationsToUpdate.length };
  } catch (error) {
    console.error("Erreur lors de la mise à jour des statuts de paiement:", error);
    return { success: false, error };
  }
};
