-- Insertion des 14 régions du Sénégal
INSERT INTO public.region (nom) VALUES
('Dakar'),
('Thiès'),
('Diourbel'),
('Fatick'),
('Kaolack'),
('Kaffrine'),
('Kédougou'),
('Kolda'),
('Louga'),
('Matam'),
('Saint-Louis'),
('Sédhiou'),
('Tambacounda'),
('Ziguinchor');

-- Insertion des 100 zones du Sénégal avec leur rayon
INSERT INTO public.zone (nom, region_id, latitude, longitude, circle_radius) VALUES
-- Dakar (région 1)
('Dakar', 1, 14.6937, -17.4441, 5000),
('Pikine', 1, 14.7552, -17.3913, 4500),
('Guédiawaye', 1, 14.7687, -17.4083, 4000),
('Rufisque', 1, 14.7167, -17.2667, 5000),
('Bargny', 1, 14.6957, -17.2281, 3500),
('Diamniadio', 1, 14.7289, -17.1839, 4000),
('Sébikotane', 1, 14.7470, -17.1357, 3500),
('Yène', 1, 14.6500, -17.1167, 3000),
('Sangalkam', 1, 14.7778, -17.2275, 3500),
('Jaxaay', 1, 14.7694, -17.3250, 3000),
('Keur Massar', 1, 14.7861, -17.3222, 4000),
('Malika', 1, 14.8000, -17.3333, 3000),
('Mbao', 1, 14.7333, -17.3333, 3500),
('Parcelles Assainies', 1, 14.7667, -17.4167, 3000),
('Gorée', 1, 14.6667, -17.4000, 1000),

-- Thiès (région 2)
('Thiès', 2, 14.7833, -16.9333, 6000),
('Mbour', 2, 14.4167, -16.9667, 5500),
('Tivaouane', 2, 14.9500, -16.8167, 5000),
('Joal-Fadiouth', 2, 14.1667, -16.8333, 4000),
('Kayar', 2, 14.9167, -17.1167, 3500),
('Khombole', 2, 14.7667, -16.7000, 4000),
('Pout', 2, 14.7667, -17.0667, 4000),
('Mboro', 2, 15.1333, -16.8833, 4500),
('Ngoundiane', 2, 14.6333, -16.8500, 3500),
('Saly Portudal', 2, 14.4500, -17.0167, 4000),
('Somone', 2, 14.4833, -17.0500, 3000),
('Popenguine', 2, 14.5500, -17.1167, 3000),
('Nguékhokh', 2, 14.5167, -17.0000, 3500),

-- Diourbel (région 3)
('Diourbel', 3, 14.7333, -16.2333, 5500),
('Bambey', 3, 14.7000, -16.4500, 5000),
('Mbacké', 3, 14.8000, -15.9167, 5000),
('Touba', 3, 14.8667, -15.8833, 6000),
('Ndoulo', 3, 14.7833, -16.3333, 3500),
('Ndindy', 3, 14.6500, -16.2833, 3000),
('Taïf', 3, 14.8000, -16.0667, 3500),

-- Fatick (région 4)
('Fatick', 4, 14.3333, -16.4167, 5000),
('Foundiougne', 4, 14.1333, -16.4667, 4500),
('Gossas', 4, 14.4833, -16.0667, 4000),
('Sokone', 4, 13.8833, -16.3667, 4000),
('Diofior', 4, 14.1833, -16.6667, 3500),
('Passy', 4, 14.0500, -16.4500, 3500),
('Karang', 4, 13.7833, -16.6000, 3000),

-- Kaolack (région 5)
('Kaolack', 5, 14.1500, -16.0667, 6000),
('Guinguinéo', 5, 14.2667, -15.9500, 4500),
('Nioro du Rip', 5, 13.7500, -15.8000, 4500),
('Gandiaye', 5, 14.2333, -16.2667, 3500),
('Ndoffane', 5, 14.0000, -15.9333, 3500),
('Sibassor', 5, 14.1833, -16.1833, 3000),

-- Kaffrine (région 6)
('Kaffrine', 6, 14.1000, -15.5500, 5000),
('Birkelane', 6, 14.1333, -15.7167, 4000),
('Koungheul', 6, 13.9833, -14.8000, 4500),
('Malem Hodar', 6, 14.0500, -15.1500, 4000),
('Nganda', 6, 13.8500, -15.7000, 3500),
('Maka Yop', 6, 14.0833, -15.4000, 3000),

-- Kédougou (région 7)
('Kédougou', 7, 12.5500, -12.1833, 5000),
('Salémata', 7, 12.6333, -12.8333, 4000),
('Saraya', 7, 12.8500, -11.7667, 4000),
('Bandafassi', 7, 12.5333, -12.3167, 3500),
('Fongolimbi', 7, 12.4167, -12.0167, 3000),

-- Kolda (région 8)
('Kolda', 8, 12.9000, -14.9500, 5500),
('Médina Yoro Foulah', 8, 13.0667, -14.6500, 4500),
('Vélingara', 8, 13.1500, -14.1167, 5000),
('Dabo', 8, 12.7667, -14.9667, 3500),
('Salikégné', 8, 12.6333, -15.2833, 3000),
('Kounkané', 8, 12.9333, -14.0833, 3500),

-- Louga (région 9)
('Louga', 9, 15.6167, -16.2500, 5500),
('Kébémer', 9, 15.3667, -16.4500, 4500),
('Linguère', 9, 15.4000, -15.1167, 5000),
('Dahra', 9, 15.3500, -15.4833, 4500),
('Mbeuleukhé', 9, 15.5500, -15.2333, 3500),
('Guéoul', 9, 15.2000, -16.3500, 3500),

-- Matam (région 10)
('Matam', 10, 15.6500, -13.2500, 5000),
('Kanel', 10, 15.4833, -13.1833, 4500),
('Ranérou', 10, 15.3000, -13.9667, 4500),
('Ourossogui', 10, 15.6000, -13.3167, 4000),
('Thilogne', 10, 15.6333, -13.6000, 3500),
('Semme', 10, 15.2000, -13.4500, 3000),

-- Saint-Louis (région 11)
('Saint-Louis', 11, 16.0333, -16.5000, 6000),
('Dagana', 11, 16.5167, -15.5000, 5000),
('Podor', 11, 16.6500, -14.9667, 5000),
('Richard-Toll', 11, 16.4667, -15.7000, 5000),
('Rosso', 11, 16.5000, -15.8000, 4500),
('Ndioum', 11, 16.5167, -14.6500, 4000),
('Mpal', 11, 15.9167, -16.3000, 3500),

-- Sédhiou (région 12)
('Sédhiou', 12, 12.7000, -15.5500, 5000),
('Bounkiling', 12, 13.0500, -15.7000, 4500),
('Goudomp', 12, 12.5333, -15.9500, 4500),
('Marsassoum', 12, 12.8333, -15.9833, 4000),
('Tanaff', 12, 12.8167, -15.8000, 3500),
('Diattacounda', 12, 12.5667, -15.6667, 3500),

-- Tambacounda (région 13)
('Tambacounda', 13, 13.7667, -13.6667, 6000),
('Bakel', 13, 14.9000, -12.4667, 5000),
('Goudiry', 13, 14.1833, -12.7167, 4500),
('Koumpentoum', 13, 13.9833, -14.5500, 4500),
('Kidira', 13, 14.4667, -12.2167, 4000),
('Maka Coulibantang', 13, 13.8500, -14.2500, 3500),
('Kothiary', 13, 13.2167, -13.9333, 3500),

-- Ziguinchor (région 14)
('Ziguinchor', 14, 12.5667, -16.2667, 5500),
('Bignona', 14, 12.8167, -16.2333, 5000),
('Oussouye', 14, 12.4833, -16.5500, 4000),
('Thionck Essyl', 14, 12.7833, -16.5167, 3500),
('Diouloulou', 14, 13.0333, -16.6167, 3500),
('Cap Skirring', 14, 12.4000, -16.7500, 3000),
('Kafountine', 14, 12.9333, -16.6667, 3500);

-- Politiques RLS (Row Level Security) pour les tables principales

-- Politique pour properties: les utilisateurs ne peuvent voir que les propriétés de leur agence
CREATE POLICY "Les utilisateurs ne voient que les propriétés de leur agence"
ON public.properties
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politique pour properties: les utilisateurs ne peuvent modifier que les propriétés de leur agence
CREATE POLICY "Les utilisateurs ne peuvent modifier que les propriétés de leur agence"
ON public.properties
FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politique pour properties: les utilisateurs ne peuvent supprimer que les propriétés de leur agence
CREATE POLICY "Les utilisateurs ne peuvent supprimer que les propriétés de leur agence"
ON public.properties
FOR DELETE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politique pour properties: les utilisateurs ne peuvent insérer que des propriétés liées à leur agence
CREATE POLICY "Les utilisateurs ne peuvent insérer que des propriétés liées à leur agence"
ON public.properties
FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politique pour clients: les utilisateurs ne peuvent voir que les clients de leur agence
CREATE POLICY "Les utilisateurs ne voient que les clients de leur agence"
ON public.clients
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politique pour clients: les utilisateurs ne peuvent modifier que les clients de leur agence
CREATE POLICY "Les utilisateurs ne peuvent modifier que les clients de leur agence"
ON public.clients
FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politique pour clients: les utilisateurs ne peuvent supprimer que les clients de leur agence
CREATE POLICY "Les utilisateurs ne peuvent supprimer que les clients de leur agence"
ON public.clients
FOR DELETE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politique pour clients: les utilisateurs ne peuvent insérer que des clients liés à leur agence
CREATE POLICY "Les utilisateurs ne peuvent insérer que des clients liés à leur agence"
ON public.clients
FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politique pour locations: les utilisateurs ne peuvent voir que les locations liées à leur agence
CREATE POLICY "Les utilisateurs ne voient que les locations liées à leur agence"
ON public.locations
FOR SELECT
USING (
  property_id IN (
    SELECT id FROM properties WHERE agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  )
);

-- Politique pour locations: les utilisateurs ne peuvent modifier que les locations liées à leur agence
CREATE POLICY "Les utilisateurs ne peuvent modifier que les locations liées à leur agence"
ON public.locations
FOR UPDATE
USING (
  property_id IN (
    SELECT id FROM properties WHERE agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  )
);

-- Politique pour locations: les utilisateurs ne peuvent supprimer que les locations liées à leur agence
CREATE POLICY "Les utilisateurs ne peuvent supprimer que les locations liées à leur agence"
ON public.locations
FOR DELETE
USING (
  property_id IN (
    SELECT id FROM properties WHERE agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  )
);

-- Politique pour locations: les utilisateurs ne peuvent insérer que des locations liées à leur agence
CREATE POLICY "Les utilisateurs ne peuvent insérer que des locations liées à leur agence"
ON public.locations
FOR INSERT
WITH CHECK (
  property_id IN (
    SELECT id FROM properties WHERE agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  )
);

-- Politique pour reservations: les utilisateurs ne peuvent voir que les réservations liées à leur agence
CREATE POLICY "Les utilisateurs ne voient que les réservations liées à leur agence"
ON public.reservations
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politique pour reservations: les utilisateurs ne peuvent modifier que les réservations liées à leur agence
CREATE POLICY "Les utilisateurs ne peuvent modifier que les réservations liées à leur agence"
ON public.reservations
FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politique pour reservations: les utilisateurs ne peuvent supprimer que les réservations liées à leur agence
CREATE POLICY "Les utilisateurs ne peuvent supprimer que les réservations liées à leur agence"
ON public.reservations
FOR DELETE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politique pour reservations: les utilisateurs ne peuvent insérer que des réservations liées à leur agence
CREATE POLICY "Les utilisateurs ne peuvent insérer que des réservations liées à leur agence"
ON public.reservations
FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);
