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
  "agenceID" uuid null,
  constraint proprietaire_pkey primary key (id),
  constraint proprietaire_agenceID_fkey foreign KEY ("agenceID") references agencies (id)
) TABLESPACE pg_default;


create table public.appels_de_fond_proprietaires (
  id serial not null,
  appel_de_fond_id integer not null,
  proprietaire_id integer not null,
  montant_du numeric(10, 2) not null,
  statut_paiement character varying(20) not null default 'non_paye'::character varying,
  date_paiement timestamp with time zone null,
  date_relance timestamp with time zone null,
  agence_id uuid not null,
  bien_concerne uuid null,
  montant_restant numeric null,
  constraint appels_de_fond_proprietaires_pkey primary key (id),
  constraint appels_de_fond_proprietaires_unique unique (appel_de_fond_id, proprietaire_id),
  constraint appels_de_fond_proprietaires_appel_fkey foreign KEY (appel_de_fond_id) references appels_de_fond (id),
  constraint appels_de_fond_proprietaires_bien_concerne_fkey foreign KEY (bien_concerne) references properties (id),
  constraint appels_de_fond_proprietaires_agence_id_fkey foreign KEY (agence_id) references agencies (id),
  constraint appels_de_fond_proprietaires_proprietaire_fkey foreign KEY (proprietaire_id) references proprietaire (id),
  constraint appels_de_fond_proprietaires_statut_check check (
    (
      (statut_paiement)::text = any (
        (
          array[
            'paye'::character varying,
            'non_paye'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_appels_de_fond_proprietaires_appel_id on public.appels_de_fond_proprietaires using btree (appel_de_fond_id) TABLESPACE pg_default;

create index IF not exists idx_appels_de_fond_proprietaires_proprietaire_id on public.appels_de_fond_proprietaires using btree (proprietaire_id) TABLESPACE pg_default;

create index IF not exists idx_appels_de_fond_proprietaires_agence_id on public.appels_de_fond_proprietaires using btree (agence_id) TABLESPACE pg_default;

-- Suppression de la contrainte d'unicité pour permettre plusieurs biens par propriétaire dans un appel de fond
ALTER TABLE public.appels_de_fond_proprietaires DROP CONSTRAINT IF EXISTS appels_de_fond_proprietaires_unique;


create table public.appels_de_fond (
  id serial not null,
  titre character varying(255) not null,
  description text null,
  montant_total numeric(12, 2) not null,
  date_creation timestamp with time zone not null default timezone ('utc'::text, now()),
  date_echeance date null,
  statut character varying(20) not null default 'en_cours'::character varying,
  fichiers_joints text null,
  agence_id uuid not null,
  constraint appels_de_fond_pkey primary key (id),
  constraint appels_de_fond_agence_id_fkey foreign KEY (agence_id) references agencies (id),
  constraint appels_de_fond_statut_check check (
    (
      (statut)::text = any (
        (
          array[
            'en_cours'::character varying,
            'termine'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_appels_de_fond_statut on public.appels_de_fond using btree (statut) TABLESPACE pg_default;

create index IF not exists idx_appels_de_fond_agence_id on public.appels_de_fond using btree (agence_id) TABLESPACE pg_default;



create table public.demandes (
  id serial not null,
  proprietaire_id integer not null,
  type_demande character varying(50) not null,
  description text null,
  fichier_joint character varying(500) null,
  statut character varying(20) not null default 'non_traitee'::character varying,
  date_creation timestamp with time zone not null default timezone ('utc'::text, now()),
  date_traitement timestamp with time zone null,
  agence_id uuid not null,
  constraint demandes_pkey primary key (id),
  constraint demandes_agence_id_fkey foreign KEY (agence_id) references agencies (id),
  constraint demandes_proprietaire_id_fkey foreign KEY (proprietaire_id) references proprietaire (id),
  constraint demandes_statut_check check (
    (
      (statut)::text = any (
        (
          array[
            'traitee'::character varying,
            'non_traitee'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint demandes_type_check check (
    (
      (type_demande)::text = any (
        (
          array[
            'paiements_charges'::character varying,
            'declaration_depannage'::character varying,
            'entretien_menuiserie'::character varying,
            'entretien_electricite'::character varying,
            'entretien_plomberie'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_demandes_proprietaire_id on public.demandes using btree (proprietaire_id) TABLESPACE pg_default;

create index IF not exists idx_demandes_statut on public.demandes using btree (statut) TABLESPACE pg_default;

create index IF not exists idx_demandes_type on public.demandes using btree (type_demande) TABLESPACE pg_default;

create index IF not exists idx_demandes_agence_id on public.demandes using btree (agence_id) TABLESPACE pg_default;



create table public.lot (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  nom text null,
  numero bigint null,
  constraint lot_pkey primary key (id)
) TABLESPACE pg_default;


create table public.paiements (
  id serial not null,
  proprietaire_id integer not null,
  type_paiement character varying(50) not null,
  appel_de_fond_id integer null,
  montant numeric(10, 2) not null,
  description text null,
  date_ajout timestamp with time zone not null default timezone ('utc'::text, now()),
  statut character varying(20) not null default 'non_paye'::character varying,
  fichier_facture_recu character varying(500) null,
  agence_id uuid not null,
  constraint paiements_pkey primary key (id),
  constraint paiements_agence_id_fkey foreign KEY (agence_id) references agencies (id),
  constraint paiements_appel_de_fond_id_fkey foreign KEY (appel_de_fond_id) references appels_de_fond (id),
  constraint paiements_proprietaire_id_fkey foreign KEY (proprietaire_id) references proprietaire (id),
  constraint paiements_statut_check check (
    (
      (statut)::text = any (
        (
          array[
            'paye'::character varying,
            'non_paye'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint paiements_type_check check (
    (
      (type_paiement)::text = any (
        (
          array[
            'appel_de_fond'::character varying,
            'travaux_entretien'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_paiements_proprietaire_id on public.paiements using btree (proprietaire_id) TABLESPACE pg_default;

create index IF not exists idx_paiements_type on public.paiements using btree (type_paiement) TABLESPACE pg_default;

create index IF not exists idx_paiements_statut on public.paiements using btree (statut) TABLESPACE pg_default;

create index IF not exists idx_paiements_agence_id on public.paiements using btree (agence_id) TABLESPACE pg_default;

nom du bucket public : copro-doc
