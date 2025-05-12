-- Fonction pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer une référence de propriété
CREATE OR REPLACE FUNCTION public.generate_property_reference()
RETURNS TRIGGER AS $$
DECLARE
    agency_prefix TEXT;
    property_count INTEGER;
    new_reference TEXT;
BEGIN
    -- Récupérer le préfixe de l'agence (premières lettres du nom)
    SELECT SUBSTRING(agency_name, 1, 3) INTO agency_prefix
    FROM agencies
    WHERE id = NEW.agency_id;
    
    -- Compter le nombre de propriétés existantes pour cette agence
    SELECT COUNT(*) + 1 INTO property_count
    FROM properties
    WHERE agency_id = NEW.agency_id;
    
    -- Générer la référence au format PREFIX-COUNT
    new_reference := UPPER(agency_prefix) || '-' || LPAD(property_count::TEXT, 4, '0');
    
    -- Assigner la référence à la nouvelle propriété
    NEW.reference_number := new_reference;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si une location expire bientôt (dans les 5 jours)
CREATE OR REPLACE FUNCTION public.is_ending_soon(end_date TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN end_date IS NOT NULL AND end_date BETWEEN NOW() AND NOW() + INTERVAL '5 days';
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le montant total des appels de fonds pour un lot
CREATE OR REPLACE FUNCTION public.calculate_total_appels_de_fond(lot_id BIGINT)
RETURNS NUMERIC AS $$
DECLARE
    total NUMERIC(10,2);
BEGIN
    SELECT COALESCE(SUM(montant), 0) INTO total
    FROM appel_de_fond
    WHERE lot_id = $1;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le statut de paiement d'une location
CREATE OR REPLACE FUNCTION public.get_location_payment_status(location_id UUID)
RETURNS TEXT AS $$
DECLARE
    loc_record RECORD;
    current_month INTEGER;
    status TEXT;
BEGIN
    SELECT * INTO loc_record FROM locations WHERE id = location_id;
    
    IF loc_record IS NULL THEN
        RETURN 'INCONNU';
    END IF;
    
    IF loc_record.rental_end_date IS NULL THEN
        -- C'est une vente, pas une location
        RETURN 'PAYÉ';
    END IF;
    
    IF loc_record.effective_end_date IS NOT NULL THEN
        -- La location est terminée
        RETURN 'TERMINÉ';
    END IF;
    
    IF loc_record.rental_end_date < NOW() THEN
        -- La location a expiré
        RETURN 'NON PAYÉ';
    END IF;
    
    IF loc_record.paiement = TRUE THEN
        -- Le paiement est à jour
        RETURN 'PAYÉ';
    ELSE
        -- Le paiement n'est pas à jour
        RETURN 'NON PAYÉ';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un numéro de réservation unique
CREATE OR REPLACE FUNCTION public.generate_reservation_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_already BOOLEAN;
BEGIN
    LOOP
        -- Générer un numéro de format RES-XXXXX où X est un chiffre aléatoire
        new_number := 'RES-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
        
        -- Vérifier si ce numéro existe déjà
        SELECT EXISTS(
            SELECT 1 FROM reservations WHERE reservation_number = new_number
        ) INTO exists_already;
        
        -- Sortir de la boucle si le numéro n'existe pas déjà
        EXIT WHEN NOT exists_already;
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour automatiquement le statut d'une propriété lors d'une vente ou location longue durée
CREATE OR REPLACE FUNCTION public.update_property_status_on_contract()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier si c'est une vente (rental_end_date est NULL) ou une location longue durée
    IF NEW.rental_end_date IS NULL THEN
        -- C'est une vente, mettre à jour le statut de la propriété à "VENDUE"
        UPDATE properties 
        SET property_status = 'VENDUE'
        WHERE id = NEW.property_id;
    ELSIF EXISTS (
        SELECT 1 FROM properties 
        WHERE id = NEW.property_id 
        AND type_location = 'longue_duree'
    ) THEN
        -- C'est une location longue durée, mettre à jour le statut de la propriété à "OCCUPEE"
        UPDATE properties 
        SET property_status = 'OCCUPEE'
        WHERE id = NEW.property_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour mettre à jour le statut de la propriété lors de la création d'un contrat
CREATE TRIGGER update_property_status_on_contract_insert
AFTER INSERT ON locations
FOR EACH ROW
EXECUTE FUNCTION update_property_status_on_contract();

-- Fonction pour mettre à jour le statut d'une propriété lors de la résiliation d'un contrat
CREATE OR REPLACE FUNCTION public.update_property_status_on_contract_termination()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le statut passe à "TERMINE", remettre la propriété à "DISPONIBLE"
    IF NEW.statut = 'TERMINE' AND OLD.statut = 'EN COURS' THEN
        UPDATE properties 
        SET property_status = 'DISPONIBLE'
        WHERE id = NEW.property_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour mettre à jour le statut de la propriété lors de la résiliation d'un contrat
CREATE TRIGGER update_property_status_on_contract_termination
AFTER UPDATE ON locations
FOR EACH ROW
WHEN (NEW.statut = 'TERMINE' AND OLD.statut = 'EN COURS')
EXECUTE FUNCTION update_property_status_on_contract_termination();
