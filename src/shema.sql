-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_users (
  id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.agencies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  slug character varying NOT NULL UNIQUE,
  agency_name character varying NOT NULL,
  description text,
  address text,
  city character varying,
  postal_code character varying,
  license_number character varying UNIQUE,
  contact_email character varying,
  contact_phone character varying,
  logo_url text,
  primary_color character varying CHECK (primary_color::text ~ '^#[0-9A-Fa-f]{6}$'::text),
  secondary_color character varying CHECK (secondary_color::text ~ '^#[0-9A-Fa-f]{6}$'::text),
  theme_config jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  must_change_password boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  admin_name character varying,
  admin_email character varying,
  admin_phone character varying,
  admin_license character varying,
  admin_first_name character varying,
  admin_last_name character varying,
  commercial_phone character varying,
  isImmo boolean DEFAULT true,
  isLocative boolean DEFAULT false,
  isCopro boolean DEFAULT false,
  CONSTRAINT agencies_pkey PRIMARY KEY (id),
  CONSTRAINT agencies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.appel_de_fond (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  lot_id bigint NOT NULL,
  montant numeric NOT NULL,
  date_emission date NOT NULL,
  date_echeance date NOT NULL,
  statut text NOT NULL DEFAULT 'En attente'::text,
  description text,
  document_url text,
  CONSTRAINT appel_de_fond_pkey PRIMARY KEY (id),
  CONSTRAINT appel_de_fond_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lot(id)
);
CREATE TABLE public.appels_de_fond (
  id integer NOT NULL DEFAULT nextval('appels_de_fond_id_seq'::regclass),
  titre character varying NOT NULL,
  description text,
  montant_total numeric NOT NULL,
  date_creation timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  date_echeance date,
  statut character varying NOT NULL DEFAULT 'en_cours'::character varying CHECK (statut::text = ANY (ARRAY['en_cours'::character varying, 'termine'::character varying]::text[])),
  fichiers_joints text,
  agence_id uuid NOT NULL,
  CONSTRAINT appels_de_fond_pkey PRIMARY KEY (id),
  CONSTRAINT appels_de_fond_agence_id_fkey FOREIGN KEY (agence_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.appels_de_fond_proprietaires (
  id integer NOT NULL DEFAULT nextval('appels_de_fond_proprietaires_id_seq'::regclass),
  appel_de_fond_id integer NOT NULL,
  proprietaire_id integer NOT NULL,
  montant_du numeric NOT NULL,
  statut_paiement character varying NOT NULL DEFAULT 'non_paye'::character varying CHECK (statut_paiement::text = ANY (ARRAY['paye'::character varying, 'non_paye'::character varying]::text[])),
  date_paiement timestamp with time zone,
  date_relance timestamp with time zone,
  agence_id uuid NOT NULL,
  bien_concerne uuid,
  montant_restant numeric,
  CONSTRAINT appels_de_fond_proprietaires_pkey PRIMARY KEY (id),
  CONSTRAINT appels_de_fond_proprietaires_proprietaire_fkey FOREIGN KEY (proprietaire_id) REFERENCES public.proprietaire(id),
  CONSTRAINT appels_de_fond_proprietaires_appel_fkey FOREIGN KEY (appel_de_fond_id) REFERENCES public.appels_de_fond(id),
  CONSTRAINT appels_de_fond_proprietaires_agence_id_fkey FOREIGN KEY (agence_id) REFERENCES public.agencies(id),
  CONSTRAINT appels_de_fond_proprietaires_bien_concerne_fkey FOREIGN KEY (bien_concerne) REFERENCES public.properties(id)
);
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  agency_id uuid,
  first_name character varying,
  last_name character varying,
  phone_number character varying UNIQUE,
  notifications_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  email character varying,
  cin text,
  id_document_url text,
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id),
  CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.contact_message_admin (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  email text,
  nom_complet text,
  message text,
  CONSTRAINT contact_message_admin_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  agency_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  firstname text,
  phone text,
  isRead boolean DEFAULT false,
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id),
  CONSTRAINT contact_messages_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.contract_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  agency_id uuid NOT NULL,
  name text NOT NULL,
  template_json jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contract_templates_pkey PRIMARY KEY (id),
  CONSTRAINT contract_templates_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.demande_inscription (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  agency_name character varying NOT NULL,
  slug character varying NOT NULL,
  description text,
  address text,
  city character varying,
  postal_code character varying,
  license_number character varying,
  contact_email character varying,
  contact_phone character varying,
  logo_url text,
  primary_color character varying,
  secondary_color character varying,
  theme_config jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  admin_name character varying,
  admin_email character varying,
  admin_phone character varying,
  admin_license character varying,
  status USER-DEFINED DEFAULT 'EN_ATTENTE'::registration_status,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  password_hash character varying,
  rejection_reason text,
  admin_first_name character varying,
  admin_last_name character varying,
  CONSTRAINT demande_inscription_pkey PRIMARY KEY (id)
);
CREATE TABLE public.demandes (
  id integer NOT NULL DEFAULT nextval('demandes_id_seq'::regclass),
  proprietaire_id integer NOT NULL,
  type_demande character varying NOT NULL CHECK (type_demande::text = ANY (ARRAY['paiements_charges'::character varying, 'declaration_depannage'::character varying, 'entretien_menuiserie'::character varying, 'entretien_electricite'::character varying, 'entretien_plomberie'::character varying]::text[])),
  description text,
  fichier_joint character varying,
  statut character varying NOT NULL DEFAULT 'non_traitee'::character varying CHECK (statut::text = ANY (ARRAY['traitee'::character varying, 'non_traitee'::character varying]::text[])),
  date_creation timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  date_traitement timestamp with time zone,
  agence_id uuid NOT NULL,
  CONSTRAINT demandes_pkey PRIMARY KEY (id),
  CONSTRAINT demandes_agence_id_fkey FOREIGN KEY (agence_id) REFERENCES public.agencies(id),
  CONSTRAINT demandes_proprietaire_id_fkey FOREIGN KEY (proprietaire_id) REFERENCES public.proprietaire(id)
);
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  client_id uuid NOT NULL,
  client_cin text,
  document_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  statut text NOT NULL DEFAULT 'EN COURS'::text CHECK (statut = ANY (ARRAY['EN COURS'::text, 'TERMINE'::text])),
  rental_start_date timestamp with time zone,
  rental_end_date timestamp with time zone,
  effective_end_date timestamp with time zone,
  paiement boolean,
  mois_paye bigint,
  paid_months jsonb DEFAULT '[]'::jsonb,
  url_recu_loc text,
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT locations_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id)
);
CREATE TABLE public.lot (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  nom text,
  numero bigint,
  CONSTRAINT lot_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lots (
  id integer NOT NULL DEFAULT nextval('lots_id_seq'::regclass),
  numero_lot character varying NOT NULL,
  proprietaire_id integer NOT NULL,
  type_lot character varying DEFAULT 'appartement'::character varying,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  agence_id uuid NOT NULL,
  CONSTRAINT lots_pkey PRIMARY KEY (id),
  CONSTRAINT lots_proprietaire_id_fkey FOREIGN KEY (proprietaire_id) REFERENCES public.proprietaire(id),
  CONSTRAINT lots_agence_id_fkey FOREIGN KEY (agence_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  proprietaire_id integer NOT NULL,
  appel_de_fond_id integer,
  message text NOT NULL,
  lu boolean NOT NULL DEFAULT false,
  date_creation timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  agence_id uuid NOT NULL,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_appel_de_fond_id_fkey FOREIGN KEY (appel_de_fond_id) REFERENCES public.appels_de_fond(id),
  CONSTRAINT notifications_proprietaire_id_fkey FOREIGN KEY (proprietaire_id) REFERENCES public.proprietaire(id),
  CONSTRAINT notifications_agence_id_fkey FOREIGN KEY (agence_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.paiements (
  id integer NOT NULL DEFAULT nextval('paiements_id_seq'::regclass),
  proprietaire_id integer NOT NULL,
  type_paiement character varying NOT NULL CHECK (type_paiement::text = ANY (ARRAY['appel_de_fond'::character varying, 'travaux_entretien'::character varying]::text[])),
  appel_de_fond_id integer,
  montant numeric NOT NULL,
  description text,
  date_ajout timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  statut character varying NOT NULL DEFAULT 'non_paye'::character varying CHECK (statut::text = ANY (ARRAY['paye'::character varying, 'non_paye'::character varying]::text[])),
  fichier_facture_recu character varying,
  agence_id uuid NOT NULL,
  CONSTRAINT paiements_pkey PRIMARY KEY (id),
  CONSTRAINT paiements_agence_id_fkey FOREIGN KEY (agence_id) REFERENCES public.agencies(id),
  CONSTRAINT paiements_proprietaire_id_fkey FOREIGN KEY (proprietaire_id) REFERENCES public.proprietaire(id),
  CONSTRAINT paiements_appel_de_fond_id_fkey FOREIGN KEY (appel_de_fond_id) REFERENCES public.appels_de_fond(id)
);
CREATE TABLE public.payment_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  payment_date timestamp with time zone NOT NULL DEFAULT now(),
  amount numeric NOT NULL,
  payment_method USER-DEFINED NOT NULL,
  months_covered integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  receipt_url text,
  CONSTRAINT payment_details_pkey PRIMARY KEY (id),
  CONSTRAINT payment_details_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.pending_webhooks (
  id integer NOT NULL DEFAULT nextval('pending_webhooks_id_seq'::regclass),
  reservation_id integer NOT NULL,
  appointment_date timestamp without time zone NOT NULL,
  sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pending_webhooks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  agency_id uuid,
  title character varying NOT NULL,
  description text,
  price numeric NOT NULL,
  property_type character varying NOT NULL,
  property_status USER-DEFINED DEFAULT 'DISPONIBLE'::property_status,
  bedrooms integer,
  bathrooms integer,
  surface_area numeric,
  address text,
  postal_code character varying,
  location_lat numeric,
  location_lng numeric,
  year_built integer,
  amenities ARRAY,
  photos ARRAY,
  virtual_tour_url text,
  is_available boolean DEFAULT true,
  preview_description text,
  detailed_description text,
  view_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  region text,
  zone_id integer,
  is_furnished boolean DEFAULT false,
  property_offer_type text DEFAULT 'VENTE'::text CHECK (property_offer_type = ANY (ARRAY['LOCATION'::text, 'VENTE'::text])),
  property_condition USER-DEFINED,
  vefa_availability_date timestamp with time zone,
  reference_number text,
  type_location text,
  proprio integer,
  lot bigint,
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_lot_fkey FOREIGN KEY (lot) REFERENCES public.lot(id),
  CONSTRAINT properties_proprio_fkey FOREIGN KEY (proprio) REFERENCES public.proprietaire(id),
  CONSTRAINT properties_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zone(id),
  CONSTRAINT properties_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.proprietaire (
  id integer NOT NULL DEFAULT nextval('proprietaire_id_seq'::regclass),
  prenom character varying NOT NULL,
  nom character varying NOT NULL,
  adresse text,
  numero_telephone character varying,
  adresse_email character varying,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  agenceID uuid,
  CONSTRAINT proprietaire_pkey PRIMARY KEY (id),
  CONSTRAINT proprietaire_agenceID_fkey FOREIGN KEY (agenceID) REFERENCES public.agencies(id)
);
CREATE TABLE public.region (
  id integer NOT NULL DEFAULT nextval('region_id_seq'::regclass),
  nom character varying NOT NULL,
  CONSTRAINT region_pkey PRIMARY KEY (id)
);
CREATE TABLE public.relances (
  id integer NOT NULL DEFAULT nextval('relances_id_seq'::regclass),
  appel_de_fond_id integer NOT NULL,
  proprietaire_id integer NOT NULL,
  date_relance timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  type_relance character varying NOT NULL DEFAULT 'email'::character varying CHECK (type_relance::text = ANY (ARRAY['email'::character varying, 'sms'::character varying, 'whatsApp'::character varying]::text[])),
  admin_user_id integer,
  agence_id uuid NOT NULL,
  CONSTRAINT relances_pkey PRIMARY KEY (id),
  CONSTRAINT relances_appel_de_fond_id_fkey FOREIGN KEY (appel_de_fond_id) REFERENCES public.appels_de_fond(id),
  CONSTRAINT relances_agence_id_fkey FOREIGN KEY (agence_id) REFERENCES public.agencies(id),
  CONSTRAINT relances_proprietaire_id_fkey FOREIGN KEY (proprietaire_id) REFERENCES public.proprietaire(id)
);
CREATE TABLE public.reservations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reservation_number text NOT NULL UNIQUE,
  client_phone text NOT NULL,
  property_id uuid NOT NULL,
  agency_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'::text,
  type text NOT NULL DEFAULT 'VENTE'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  rental_start_date timestamp with time zone,
  rental_end_date timestamp with time zone,
  appointment_date timestamp with time zone,
  note_rv text,
  email text,
  offer_document_url text,
  promise_document_url text,
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT reservations_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.ventes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reservation_id uuid NOT NULL,
  contract_url text NOT NULL,
  amount numeric NOT NULL,
  advance_payment numeric,
  sale_date timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by uuid,
  clientID uuid,
  CONSTRAINT ventes_pkey PRIMARY KEY (id),
  CONSTRAINT ventes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT ventes_clientID_fkey FOREIGN KEY (clientID) REFERENCES public.clients(id),
  CONSTRAINT ventes_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.zone (
  id integer NOT NULL DEFAULT nextval('zone_id_seq'::regclass),
  nom character varying NOT NULL,
  region_id integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  latitude numeric,
  longitude numeric,
  circle_radius integer DEFAULT 5000,
  CONSTRAINT zone_pkey PRIMARY KEY (id),
  CONSTRAINT zone_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.region(id)
);