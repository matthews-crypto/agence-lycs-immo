-- Types personnalisés
CREATE TYPE public.property_status AS ENUM ('DISPONIBLE', 'OCCUPEE', 'VENDUE');
CREATE TYPE public.property_condition AS ENUM ('VEFA', 'NEUF', 'RENOVE', 'USAGE');
CREATE TYPE public.registration_status AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REJETEE');

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

-- Tables
create table public.admin_users (
  id uuid not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint admin_users_pkey primary key (id),
  constraint admin_users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_admin_users_updated_at BEFORE
update on admin_users for EACH row
execute FUNCTION update_updated_at_column ();



create table public.agencies (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  slug character varying(255) not null,
  agency_name character varying(255) not null,
  description text null,
  address text null,
  city character varying(100) null,
  postal_code character varying(20) null,
  license_number character varying(100) null,
  contact_email character varying(255) null,
  contact_phone character varying(50) null,
  logo_url text null,
  primary_color character varying(7) null,
  secondary_color character varying(7) null,
  theme_config jsonb null default '{}'::jsonb,
  settings jsonb null default '{}'::jsonb,
  is_active boolean null default true,
  must_change_password boolean null default true,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  admin_name character varying null,
  admin_email character varying null,
  admin_phone character varying null,
  admin_license character varying null,
  admin_first_name character varying null,
  admin_last_name character varying null,
  constraint agencies_pkey primary key (id),
  constraint agencies_license_number_key unique (license_number),
  constraint agencies_slug_key unique (slug),
  constraint agencies_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint check_primary_color check (
    ((primary_color)::text ~ '^#[0-9A-Fa-f]{6}$'::text)
  ),
  constraint check_secondary_color check (
    (
      (secondary_color)::text ~ '^#[0-9A-Fa-f]{6}$'::text
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_agencies_user_id on public.agencies using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_agencies_slug on public.agencies using btree (slug) TABLESPACE pg_default;

create trigger update_agencies_updated_at BEFORE
update on agencies for EACH row
execute FUNCTION update_updated_at_column ();



create table public.clients (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  agency_id uuid null,
  first_name character varying(100) null,
  last_name character varying(100) null,
  phone_number character varying(50) null,
  notifications_enabled boolean null default true,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  email character varying null,
  cin text null,
  id_document_url text null,
  constraint clients_pkey primary key (id),
  constraint clients_phone_number_key unique (phone_number),
  constraint clients_agency_id_fkey foreign KEY (agency_id) references agencies (id) on delete CASCADE,
  constraint clients_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_clients_user_id on public.clients using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_clients_agency_id on public.clients using btree (agency_id) TABLESPACE pg_default;

create trigger update_clients_updated_at BEFORE
update on clients for EACH row
execute FUNCTION update_updated_at_column ();




create table public.contact_messages (
  id uuid not null default extensions.uuid_generate_v4 (),
  agency_id uuid not null,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  firstname text null,
  phone text null,
  constraint contact_messages_pkey primary key (id),
  constraint contact_messages_agency_id_fkey foreign KEY (agency_id) references agencies (id)
) TABLESPACE pg_default;

create trigger update_contact_messages_updated_at BEFORE
update on contact_messages for EACH row
execute FUNCTION update_updated_at_column ();



create table public.demande_inscription (
  id uuid not null default extensions.uuid_generate_v4 (),
  agency_name character varying not null,
  slug character varying not null,
  description text null,
  address text null,
  city character varying null,
  postal_code character varying null,
  license_number character varying null,
  contact_email character varying null,
  contact_phone character varying null,
  logo_url text null,
  primary_color character varying null,
  secondary_color character varying null,
  theme_config jsonb null default '{}'::jsonb,
  settings jsonb null default '{}'::jsonb,
  admin_name character varying null,
  admin_email character varying null,
  admin_phone character varying null,
  admin_license character varying null,
  status public.registration_status null default 'EN_ATTENTE'::registration_status,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  password_hash character varying null,
  rejection_reason text null,
  constraint demande_inscription_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_demande_inscription_updated_at BEFORE
update on demande_inscription for EACH row
execute FUNCTION update_updated_at_column ();




-- Création de la table region avant la table zone qui en dépend
create table public.region (
  id serial not null,
  nom character varying(50) not null,
  constraint region_pkey primary key (id)
) TABLESPACE pg_default;

-- Création de la table zone
create table public.zone (
  id serial not null,
  nom character varying(255) not null,
  region_id integer null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  latitude numeric(10, 8) null,
  longitude numeric(11, 8) null,
  circle_radius integer null default 5000,
  constraint zone_pkey primary key (id),
  constraint zone_region_id_fkey foreign KEY (region_id) references region (id)
) TABLESPACE pg_default;

-- Création de la table proprietaire avant la table properties qui en dépend
create table public.proprietaire (
  id serial not null,
  prenom character varying(50) not null,
  nom character varying(50) not null,
  adresse text null,
  numero_telephone character varying(20) null,
  adresse_email character varying(100) null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint proprietaire_pkey primary key (id)
) TABLESPACE pg_default;

-- Création de la table lot avant la table properties qui en dépend
create table public.lot (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  nom text null,
  constraint lot_pkey primary key (id)
);

-- Création de la table properties
create table public.properties (
  id uuid not null default extensions.uuid_generate_v4 (),
  agency_id uuid null,
  title character varying(255) not null,
  description text null,
  price numeric not null,
  property_type character varying(50) not null,
  property_status public.property_status null default 'DISPONIBLE'::property_status,
  bedrooms integer null,
  bathrooms integer null,
  surface_area numeric null,
  address text null,
  postal_code character varying(20) null,
  location_lat numeric null,
  location_lng numeric null,
  year_built integer null,
  amenities text[] null,
  photos text[] null,
  virtual_tour_url text null,
  is_available boolean null default true,
  preview_description text null,
  detailed_description text null,
  view_count integer null default 0,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  region text null,
  zone_id integer null,
  is_furnished boolean null default false,
  property_offer_type text null default 'VENTE'::text,
  property_condition public.property_condition null,
  vefa_availability_date timestamp with time zone null,
  reference_number text null,
  type_location text null,
  proprio integer null,
  lot bigint null,
  constraint properties_pkey primary key (id),
  constraint unique_reference_per_agency unique (reference_number, agency_id),
  constraint properties_lot_fkey foreign KEY (lot) references lot (id),
  constraint properties_agency_id_fkey foreign KEY (agency_id) references agencies (id) on delete CASCADE,
  constraint properties_proprio_fkey foreign KEY (proprio) references proprietaire (id),
  constraint properties_zone_id_fkey foreign KEY (zone_id) references zone(id),
  constraint properties_property_offer_type_check check (
    (
      property_offer_type = any (array['LOCATION'::text, 'VENTE'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_properties_reference_number on public.properties using btree (reference_number) TABLESPACE pg_default;

create index IF not exists idx_properties_agency_id on public.properties using btree (agency_id) TABLESPACE pg_default;

create index IF not exists idx_properties_status on public.properties using btree (property_status) TABLESPACE pg_default;

create trigger set_property_reference BEFORE INSERT on properties for EACH row
execute FUNCTION generate_property_reference ();

create trigger update_properties_updated_at BEFORE
update on properties for EACH row
execute FUNCTION update_updated_at_column ();

-- Création de la table locations après properties et clients
create table public.locations (
  id uuid not null default gen_random_uuid (),
  property_id uuid not null,
  client_id uuid not null,
  client_cin text null,
  document_url text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  statut text not null default 'EN COURS'::text,
  rental_start_date timestamp with time zone null,
  rental_end_date timestamp with time zone null,
  effective_end_date timestamp with time zone null,
  paiement boolean null,
  mois_paye bigint null,
  constraint locations_pkey primary key (id),
  constraint locations_client_id_fkey foreign KEY (client_id) references clients (id),
  constraint locations_property_id_fkey foreign KEY (property_id) references properties (id),
  constraint check_locations_statut check (
    (
      statut = any (array['EN COURS'::text, 'TERMINE'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists locations_property_id_idx on public.locations using btree (property_id) TABLESPACE pg_default;

create index IF not exists locations_client_id_idx on public.locations using btree (client_id) TABLESPACE pg_default;

create trigger update_locations_updated_at BEFORE
update on locations for EACH row
execute FUNCTION update_updated_at_column ();

-- Création de la table reservations
create table public.reservations (
  id uuid not null default extensions.uuid_generate_v4 (),
  reservation_number text not null,
  client_phone text not null,
  property_id uuid not null,
  agency_id uuid not null,
  status text not null default 'PENDING'::text,
  type text not null default 'VENTE'::text,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  rental_start_date timestamp with time zone null,
  rental_end_date timestamp with time zone null,
  appointment_date timestamp with time zone null,
  note_rv text null,
  email text null,
  constraint reservations_pkey primary key (id),
  constraint reservations_reservation_number_key unique (reservation_number),
  constraint reservations_agency_id_fkey foreign KEY (agency_id) references agencies (id),
  constraint reservations_property_id_fkey foreign KEY (property_id) references properties (id)
) TABLESPACE pg_default;

create trigger update_reservations_updated_at BEFORE
update on reservations for EACH row
execute FUNCTION update_updated_at_column ();

-- Création de la table appel_de_fond
create table public.appel_de_fond (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  lot_id bigint not null,
  montant numeric(10, 2) not null,
  date_emission date not null,
  date_echeance date not null,
  statut text not null default 'En attente',
  description text null,
  document_url text null,
  constraint appel_de_fond_pkey primary key (id),
  constraint appel_de_fond_lot_id_fkey foreign key (lot_id) references lot (id) on delete cascade
);

-- Création du bucket pour stocker les documents des appels de fond
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true);

-- Politique pour permettre à tous les utilisateurs authentifiés de lire les fichiers
create policy "Documents accessibles par tous les utilisateurs authentifiés"
on storage.objects for select
using (bucket_id = 'documents' and auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de télécharger des fichiers
create policy "Les utilisateurs authentifiés peuvent télécharger des fichiers"
on storage.objects for insert
with check (bucket_id = 'documents' and auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de mettre à jour leurs propres fichiers
create policy "Les utilisateurs authentifiés peuvent mettre à jour leurs propres fichiers"
on storage.objects for update
using (bucket_id = 'documents' and auth.role() = 'authenticated' and owner = auth.uid());

-- Politique pour permettre aux utilisateurs authentifiés de supprimer leurs propres fichiers
create policy "Les utilisateurs authentifiés peuvent supprimer leurs propres fichiers"
on storage.objects for delete
using (bucket_id = 'documents' and auth.role() = 'authenticated' and owner = auth.uid());

-- Création du super admin
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Création de l'utilisateur dans auth.users
    INSERT INTO auth.users (
        email,
        email_confirmed_at,
        encrypted_password,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role
    ) VALUES (
        'mathieukhadimanoman@gmail.com',
        NOW(),
        -- Mot de passe 'passer2025' hashé (à remplacer par le hash correct)
        crypt('passer2025', gen_salt('bf')),
        '{"provider": "email", "providers": ["email"], "role": "ADMIN"}'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW(),
        'authenticated'
    )
    RETURNING id INTO user_id;

    -- Ajout de l'utilisateur dans la table admin_users
    INSERT INTO public.admin_users (id, created_at, updated_at)
    VALUES (user_id, NOW(), NOW());
END
$$;

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

-- Insertion des communes du Sénégal (exemple avec quelques communes)
INSERT INTO public.zone (nom, region_id, latitude, longitude) VALUES
-- Dakar (région 1)
('Dakar', 1, 14.6937, -17.4441),
('Pikine', 1, 14.7552, -17.3913),
('Guédiawaye', 1, 14.7687, -17.4083),
('Rufisque', 1, 14.7167, -17.2667),
('Bargny', 1, 14.6957, -17.2281),
('Diamniadio', 1, 14.7289, -17.1839),
('Sébikotane', 1, 14.7470, -17.1357),
('Yène', 1, 14.6500, -17.1167),
-- Thiès (région 2)
('Thiès', 2, 14.7833, -16.9333),
('Mbour', 2, 14.4167, -16.9667),
('Tivaouane', 2, 14.9500, -16.8167),
('Joal-Fadiouth', 2, 14.1667, -16.8333),
('Kayar', 2, 14.9167, -17.1167),
('Khombole', 2, 14.7667, -16.7000),
('Pout', 2, 14.7667, -17.0667),
-- Diourbel (région 3)
('Diourbel', 3, 14.7333, -16.2333),
('Bambey', 3, 14.7000, -16.4500),
('Mbacké', 3, 14.8000, -15.9167),
('Touba', 3, 14.8667, -15.8833),
-- Fatick (région 4)
('Fatick', 4, 14.3333, -16.4167),
('Foundiougne', 4, 14.1333, -16.4667),
('Gossas', 4, 14.4833, -16.0667),
('Sokone', 4, 13.8833, -16.3667),
-- Kaolack (région 5)
('Kaolack', 5, 14.1500, -16.0667),
('Guinguinéo', 5, 14.2667, -15.9500),
('Nioro du Rip', 5, 13.7500, -15.8000),
-- Kaffrine (région 6)
('Kaffrine', 6, 14.1000, -15.5500),
('Birkelane', 6, 14.1333, -15.7167),
('Koungheul', 6, 13.9833, -14.8000),
('Malem Hodar', 6, 14.0500, -15.1500),
-- Kédougou (région 7)
('Kédougou', 7, 12.5500, -12.1833),
('Salémata', 7, 12.6333, -12.8333),
('Saraya', 7, 12.8500, -11.7667),
-- Kolda (région 8)
('Kolda', 8, 12.9000, -14.9500),
('Médina Yoro Foulah', 8, 13.0667, -14.6500),
('Vélingara', 8, 13.1500, -14.1167),
-- Louga (région 9)
('Louga', 9, 15.6167, -16.2500),
('Kébémer', 9, 15.3667, -16.4500),
('Linguère', 9, 15.4000, -15.1167),
-- Matam (région 10)
('Matam', 10, 15.6500, -13.2500),
('Kanel', 10, 15.4833, -13.1833),
('Ranérou', 10, 15.3000, -13.9667),
-- Saint-Louis (région 11)
('Saint-Louis', 11, 16.0333, -16.5000),
('Dagana', 11, 16.5167, -15.5000),
('Podor', 11, 16.6500, -14.9667),
('Richard-Toll', 11, 16.4667, -15.7000),
-- Sédhiou (région 12)
('Sédhiou', 12, 12.7000, -15.5500),
('Bounkiling', 12, 13.0500, -15.7000),
('Goudomp', 12, 12.5333, -15.9500),
-- Tambacounda (région 13)
('Tambacounda', 13, 13.7667, -13.6667),
('Bakel', 13, 14.9000, -12.4667),
('Goudiry', 13, 14.1833, -12.7167),
('Koumpentoum', 13, 13.9833, -14.5500),
-- Ziguinchor (région 14)
('Ziguinchor', 14, 12.5667, -16.2667),
('Bignona', 14, 12.8167, -16.2333),
('Oussouye', 14, 12.4833, -16.5500);
