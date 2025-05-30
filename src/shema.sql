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




create table public.region (
  id serial not null,
  nom character varying(50) not null,
  constraint region_pkey primary key (id)
) TABLESPACE pg_default;




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




create table public.lot (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  nom text null,
  constraint lot_pkey primary key (id)
);

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