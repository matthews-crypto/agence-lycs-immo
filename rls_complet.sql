-- Activation de RLS pour toutes les tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demande_inscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proprietaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appel_de_fond ENABLE ROW LEVEL SECURITY;

-- Politiques pour admin_users
-- Les administrateurs peuvent tout voir
CREATE POLICY "Les administrateurs peuvent voir tous les admin_users"
ON public.admin_users
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Politiques pour agencies
-- Les administrateurs peuvent tout voir
CREATE POLICY "Les administrateurs peuvent voir toutes les agences"
ON public.agencies
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Les utilisateurs ne peuvent voir que leur propre agence
CREATE POLICY "Les utilisateurs ne peuvent voir que leur propre agence"
ON public.agencies
FOR SELECT
USING (
  user_id = auth.uid()
);

-- Les utilisateurs ne peuvent modifier que leur propre agence
CREATE POLICY "Les utilisateurs ne peuvent modifier que leur propre agence"
ON public.agencies
FOR UPDATE
USING (
  user_id = auth.uid()
);

-- Politiques pour clients
-- Les administrateurs peuvent tout voir
CREATE POLICY "Les administrateurs peuvent voir tous les clients"
ON public.clients
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Les utilisateurs ne peuvent voir que les clients de leur agence
CREATE POLICY "Les utilisateurs ne voient que les clients de leur agence"
ON public.clients
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Les utilisateurs ne peuvent modifier que les clients de leur agence
CREATE POLICY "Les utilisateurs ne peuvent modifier que les clients de leur agence"
ON public.clients
FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Les utilisateurs ne peuvent supprimer que les clients de leur agence
CREATE POLICY "Les utilisateurs ne peuvent supprimer que les clients de leur agence"
ON public.clients
FOR DELETE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Les utilisateurs ne peuvent insérer que des clients liés à leur agence
CREATE POLICY "Les utilisateurs ne peuvent insérer que des clients liés à leur agence"
ON public.clients
FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politiques pour contact_messages
-- Les administrateurs peuvent tout voir
CREATE POLICY "Les administrateurs peuvent voir tous les messages de contact"
ON public.contact_messages
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Les utilisateurs ne peuvent voir que les messages de leur agence
CREATE POLICY "Les utilisateurs ne voient que les messages de leur agence"
ON public.contact_messages
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Les utilisateurs ne peuvent modifier que les messages de leur agence
CREATE POLICY "Les utilisateurs ne peuvent modifier que les messages de leur agence"
ON public.contact_messages
FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Les utilisateurs ne peuvent supprimer que les messages de leur agence
CREATE POLICY "Les utilisateurs ne peuvent supprimer que les messages de leur agence"
ON public.contact_messages
FOR DELETE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politiques pour demande_inscription
-- Seuls les administrateurs peuvent voir/modifier les demandes d'inscription
CREATE POLICY "Seuls les administrateurs peuvent voir les demandes d'inscription"
ON public.demande_inscription
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

CREATE POLICY "Seuls les administrateurs peuvent modifier les demandes d'inscription"
ON public.demande_inscription
FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

CREATE POLICY "Seuls les administrateurs peuvent supprimer les demandes d'inscription"
ON public.demande_inscription
FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Tout le monde peut créer une demande d'inscription
CREATE POLICY "Tout le monde peut créer une demande d'inscription"
ON public.demande_inscription
FOR INSERT
WITH CHECK (true);

-- Politiques pour region
-- Tout le monde peut voir les régions
CREATE POLICY "Tout le monde peut voir les régions"
ON public.region
FOR SELECT
USING (true);

-- Seuls les administrateurs peuvent modifier les régions
CREATE POLICY "Seuls les administrateurs peuvent modifier les régions"
ON public.region
FOR ALL
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Politiques pour zone
-- Tout le monde peut voir les zones
CREATE POLICY "Tout le monde peut voir les zones"
ON public.zone
FOR SELECT
USING (true);

-- Seuls les administrateurs peuvent modifier les zones
CREATE POLICY "Seuls les administrateurs peuvent modifier les zones"
ON public.zone
FOR ALL
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Politiques pour proprietaire
-- Les administrateurs peuvent tout voir
CREATE POLICY "Les administrateurs peuvent voir tous les propriétaires"
ON public.proprietaire
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Les utilisateurs peuvent voir tous les propriétaires (car ils sont partagés entre agences)
CREATE POLICY "Les utilisateurs peuvent voir tous les propriétaires"
ON public.proprietaire
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

-- Les utilisateurs authentifiés peuvent ajouter des propriétaires
CREATE POLICY "Les utilisateurs authentifiés peuvent ajouter des propriétaires"
ON public.proprietaire
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

-- Les utilisateurs authentifiés peuvent modifier des propriétaires
CREATE POLICY "Les utilisateurs authentifiés peuvent modifier des propriétaires"
ON public.proprietaire
FOR UPDATE
USING (
  auth.role() = 'authenticated'
);

-- Politiques pour lot
-- Les administrateurs peuvent tout voir
CREATE POLICY "Les administrateurs peuvent voir tous les lots"
ON public.lot
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Les utilisateurs authentifiés peuvent voir tous les lots
CREATE POLICY "Les utilisateurs authentifiés peuvent voir tous les lots"
ON public.lot
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

-- Les utilisateurs authentifiés peuvent ajouter des lots
CREATE POLICY "Les utilisateurs authentifiés peuvent ajouter des lots"
ON public.lot
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

-- Les utilisateurs authentifiés peuvent modifier des lots
CREATE POLICY "Les utilisateurs authentifiés peuvent modifier des lots"
ON public.lot
FOR UPDATE
USING (
  auth.role() = 'authenticated'
);

-- Politiques pour properties
-- Les administrateurs peuvent tout voir
CREATE POLICY "Les administrateurs peuvent voir toutes les propriétés"
ON public.properties
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Les utilisateurs ne peuvent voir que les propriétés de leur agence
CREATE POLICY "Les utilisateurs ne voient que les propriétés de leur agence"
ON public.properties
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Les utilisateurs ne peuvent modifier que les propriétés de leur agence
CREATE POLICY "Les utilisateurs ne peuvent modifier que les propriétés de leur agence"
ON public.properties
FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Les utilisateurs ne peuvent supprimer que les propriétés de leur agence
CREATE POLICY "Les utilisateurs ne peuvent supprimer que les propriétés de leur agence"
ON public.properties
FOR DELETE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Les utilisateurs ne peuvent insérer que des propriétés liées à leur agence
CREATE POLICY "Les utilisateurs ne peuvent insérer que des propriétés liées à leur agence"
ON public.properties
FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politiques pour locations
-- Les administrateurs peuvent tout voir
CREATE POLICY "Les administrateurs peuvent voir toutes les locations"
ON public.locations
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Les utilisateurs ne peuvent voir que les locations liées à leur agence
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

-- Les utilisateurs ne peuvent modifier que les locations liées à leur agence
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

-- Les utilisateurs ne peuvent supprimer que les locations liées à leur agence
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

-- Les utilisateurs ne peuvent insérer que des locations liées à leur agence
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

-- Politiques pour reservations
-- Les administrateurs peuvent tout voir
CREATE POLICY "Les administrateurs peuvent voir toutes les réservations"
ON public.reservations
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Les utilisateurs ne peuvent voir que les réservations liées à leur agence
CREATE POLICY "Les utilisateurs ne voient que les réservations liées à leur agence"
ON public.reservations
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Les utilisateurs ne peuvent modifier que les réservations liées à leur agence
CREATE POLICY "Les utilisateurs ne peuvent modifier que les réservations liées à leur agence"
ON public.reservations
FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Les utilisateurs ne peuvent supprimer que les réservations liées à leur agence
CREATE POLICY "Les utilisateurs ne peuvent supprimer que les réservations liées à leur agence"
ON public.reservations
FOR DELETE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Les utilisateurs ne peuvent insérer que des réservations liées à leur agence
CREATE POLICY "Les utilisateurs ne peuvent insérer que des réservations liées à leur agence"
ON public.reservations
FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT id FROM agencies WHERE user_id = auth.uid()
  )
);

-- Politiques pour appel_de_fond
-- Les administrateurs peuvent tout voir
CREATE POLICY "Les administrateurs peuvent voir tous les appels de fond"
ON public.appel_de_fond
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Les utilisateurs ne peuvent voir que les appels de fond liés aux lots de leurs propriétés
CREATE POLICY "Les utilisateurs ne voient que les appels de fond liés à leurs propriétés"
ON public.appel_de_fond
FOR SELECT
USING (
  lot_id IN (
    SELECT lot FROM properties WHERE agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    ) AND lot IS NOT NULL
  )
);

-- Les utilisateurs ne peuvent modifier que les appels de fond liés aux lots de leurs propriétés
CREATE POLICY "Les utilisateurs ne peuvent modifier que les appels de fond liés à leurs propriétés"
ON public.appel_de_fond
FOR UPDATE
USING (
  lot_id IN (
    SELECT lot FROM properties WHERE agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    ) AND lot IS NOT NULL
  )
);

-- Les utilisateurs ne peuvent supprimer que les appels de fond liés aux lots de leurs propriétés
CREATE POLICY "Les utilisateurs ne peuvent supprimer que les appels de fond liés à leurs propriétés"
ON public.appel_de_fond
FOR DELETE
USING (
  lot_id IN (
    SELECT lot FROM properties WHERE agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    ) AND lot IS NOT NULL
  )
);

-- Les utilisateurs ne peuvent insérer que des appels de fond liés aux lots de leurs propriétés
CREATE POLICY "Les utilisateurs ne peuvent insérer que des appels de fond liés à leurs propriétés"
ON public.appel_de_fond
FOR INSERT
WITH CHECK (
  lot_id IN (
    SELECT lot FROM properties WHERE agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    ) AND lot IS NOT NULL
  )
);

-- Politiques pour le bucket de stockage 'documents'
-- Ces politiques sont déjà définies dans le fichier schema_complet_avec_donnees.sql
-- Rappel des politiques pour le stockage:
-- 1. Tous les utilisateurs authentifiés peuvent lire les fichiers
-- 2. Les utilisateurs authentifiés peuvent télécharger des fichiers
-- 3. Les utilisateurs ne peuvent mettre à jour/supprimer que leurs propres fichiers
