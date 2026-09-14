-- =====================================================================
-- DripHaus — Migration 009 : socle STOCKAGE & DONNÉES du Studio IA
-- ---------------------------------------------------------------------
-- ⚠️  NON APPLIQUÉE AUTOMATIQUEMENT. À jouer manuellement sur le projet
--     Supabase (dhinegywctxmhepgempp) APRÈS validation de Yann.
--     Réversible : voir le bloc « ROLLBACK » commenté en fin de fichier.
--
-- Ce que pose cette migration (le « cœur propriétaire », étape 0 de
-- STUDIO_IA_ARCHITECTURE_MODELE.md) — voir aussi cerveau/STUDIO_IA_STOCKAGE_DONNEES.md :
--   1. La monnaie du Studio          → studio_credit_ledger (grand-livre)
--   2. La file d'exécution (fam. J)  → studio_jobs (queue + statut + retry + coût)
--   3. Les assets versionnés (fam. J)→ studio_assets (+ CONTRAT JSON inter-couches)
--   4. Les mannequins maîtres (fam.C)→ mannequins (identité verrouillée + versioning)
--   5. Les presets / thèmes (E, H)   → studio_presets
--   6. Le matching live (fam. L)     → pgvector + article_embeddings (le moat)
--
-- Principe : l'app n'appelle JAMAIS les modèles. Elle enfile un job
-- (status=queued) ; le « DripHaus Studio Engine » (service_role) exécute,
-- écrit les assets, débite les crédits. Mêmes garde-fous que transactions :
-- aucune écriture client sur les statuts ni sur le grand-livre de crédits.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Extension pgvector (matching famille L)
-- ---------------------------------------------------------------------
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
create type public.studio_job_status  as enum ('queued', 'running', 'succeeded', 'failed', 'canceled');
create type public.studio_asset_kind  as enum ('input', 'mannequin', 'tryon', 'scene', 'packshot', 'video', 'cover', 'theme', 'text', 'other');
create type public.studio_preset_kind as enum ('scene_decor', 'style_da', 'brand_theme', 'pose');
create type public.mannequin_status   as enum ('draft', 'locked', 'archived');
create type public.credit_reason      as enum ('grant_free', 'purchase', 'consume', 'refund', 'adjustment');

-- ---------------------------------------------------------------------
-- 2. Helper RLS : accès à une ligne « propriétaire » (user XOR boutique)
--    Réutilise private.is_boutique_member (migration 003).
-- ---------------------------------------------------------------------
create or replace function private.owns_studio_row(p_user_id uuid, p_boutique_id uuid)
returns boolean language sql security definer stable set search_path = private, public as $$
  select
    (p_user_id is not null and p_user_id = auth.uid())
    or (p_boutique_id is not null and private.is_boutique_member(p_boutique_id));
$$;

-- ---------------------------------------------------------------------
-- 3. studio_credit_ledger — grand-livre de crédits (append-only)
--    Solde = somme(delta). delta < 0 = consommation, > 0 = octroi/achat.
--    AUCUNE écriture client : alimenté par l'Engine (service_role) et WB4.
--    Crédits PONDÉRÉS par coût compute (image=1, try-on≈2, vidéo≈12–19…).
-- ---------------------------------------------------------------------
create table public.studio_credit_ledger (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id     uuid references public.users(id)     on delete cascade,
  owner_boutique_id uuid references public.boutiques(id) on delete cascade,
  delta         numeric(12,2) not null,
  reason        public.credit_reason not null,
  job_id        uuid,  -- FK ajoutée après création de studio_jobs (cycle)
  note          text,
  created_at    timestamptz not null default now(),
  constraint credit_owner_xor check (
    (owner_user_id is not null) <> (owner_boutique_id is not null)
  ),
  constraint credit_delta_nonzero check (delta <> 0)
);

-- ---------------------------------------------------------------------
-- 4. studio_jobs — file d'exécution (famille J : queue + statut + retry)
--    C'est la frontière app ↔ Engine. L'app INSÈRE (queued) ; l'Engine
--    (service_role) fait évoluer status/output/engine/credits_charged.
--    `skill` = clé du registre de skills (source de vérité = lib/studio/skills.ts).
--    `is_draft` = itération basse-déf (offerte / quasi gratuite) vs rendu final.
-- ---------------------------------------------------------------------
create table public.studio_jobs (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id     uuid references public.users(id)     on delete cascade,
  owner_boutique_id uuid references public.boutiques(id) on delete cascade,
  created_by    uuid not null references public.users(id) on delete cascade,
  family        char(1) not null,                     -- 'A'..'L'
  skill         text not null,                        -- ex. 'tryon.image', 'scene.editorial', 'video.i2v'
  status        public.studio_job_status not null default 'queued',
  is_draft      boolean not null default false,
  params        jsonb not null default '{}'::jsonb,   -- entrées de la skill (validées côté Engine)
  input_asset_ids uuid[] not null default '{}',       -- assets consommés (lineage)
  output_asset_id uuid,                               -- asset produit (FK ajoutée plus bas)
  engine        text,                                 -- moteur/fournisseur réel (audit + swap)
  credits_cost  numeric(12,2) not null default 0,     -- coût pondéré estimé/effectif
  credits_charged boolean not null default false,     -- l'Engine a débité le grand-livre ?
  attempts      integer not null default 0,
  max_attempts  integer not null default 3,
  error         text,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint job_owner_xor check (
    (owner_user_id is not null) <> (owner_boutique_id is not null)
  ),
  constraint job_family_valid check (family ~ '^[A-L]$')
);

-- ---------------------------------------------------------------------
-- 5. studio_assets — artefacts produits & versionnés (famille J)
--    `contract` = LE CONTRAT D'ASSETS JSON (métadonnées inter-couches :
--    mannequin, seed, prompt, moteur, zones à préserver, QA, provenance
--    C2PA, ai_generated). C'est ce qui rend un job « rejouable » et auditable.
--    `parent_asset_id` = lineage (image canonique → scène → vidéo).
-- ---------------------------------------------------------------------
create table public.studio_assets (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id     uuid references public.users(id)     on delete cascade,
  owner_boutique_id uuid references public.boutiques(id) on delete cascade,
  kind          public.studio_asset_kind not null,
  bucket        text not null,                        -- 'studio-in' | 'studio-draft' | 'studio-out'
  path          text not null,                        -- chemin objet Storage ({uid}/...)
  mime          text,
  width         integer,
  height        integer,
  duration_ms   integer,                              -- vidéos
  parent_asset_id uuid references public.studio_assets(id) on delete set null,
  job_id        uuid references public.studio_jobs(id) on delete set null,
  article_id    uuid references public.articles(id) on delete set null,  -- si rattaché à une fiche
  contract      jsonb not null default '{}'::jsonb,   -- CONTRAT D'ASSETS JSON (cf. doc §Contrat)
  version       integer not null default 1,
  is_final      boolean not null default false,       -- brouillon vs rendu validé
  created_at    timestamptz not null default now(),
  constraint asset_owner_xor check (
    (owner_user_id is not null) <> (owner_boutique_id is not null)
  ),
  constraint asset_bucket_valid check (bucket in ('studio-in', 'studio-draft', 'studio-out'))
);

-- FK croisées (résolution du cycle jobs ↔ assets ↔ ledger)
alter table public.studio_jobs
  add constraint studio_jobs_output_fk
  foreign key (output_asset_id) references public.studio_assets(id) on delete set null;

alter table public.studio_credit_ledger
  add constraint studio_credit_job_fk
  foreign key (job_id) references public.studio_jobs(id) on delete set null;

-- ---------------------------------------------------------------------
-- 6. mannequins — assets maîtres d'identité (famille C)
--    is_system = catalogue DripHaus (diversité inclusive), lisible par tous.
--    Sinon = mannequin custom d'un vendeur/créateur (consentement requis).
--    Identité VERROUILLÉE : un changement crée une nouvelle version.
-- ---------------------------------------------------------------------
create table public.mannequins (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id     uuid references public.users(id)     on delete cascade,
  owner_boutique_id uuid references public.boutiques(id) on delete cascade,
  is_system     boolean not null default false,
  name          text not null,
  attributes    jsonb not null default '{}'::jsonb,   -- morphotype, âge, carnation…
  identity      jsonb not null default '{}'::jsonb,   -- seed, prompt, embeddings de réf, lora_ref
  consent       jsonb,                                -- custom : consentement explicite / droit à l'image
  status        public.mannequin_status not null default 'draft',
  version       integer not null default 1,
  preview_asset_id uuid references public.studio_assets(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Système = pas de propriétaire ; custom = user XOR boutique
  constraint mannequin_owner_valid check (
    (is_system and owner_user_id is null and owner_boutique_id is null)
    or (not is_system and ((owner_user_id is not null) <> (owner_boutique_id is not null)))
  )
);

-- ---------------------------------------------------------------------
-- 7. studio_presets — décors, presets de DA, thèmes boutique, poses (E, H)
--    brand_theme relie au thème de vitrine (VITRINE_BOUTIQUE.md → tokens).
-- ---------------------------------------------------------------------
create table public.studio_presets (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id     uuid references public.users(id)     on delete cascade,
  owner_boutique_id uuid references public.boutiques(id) on delete cascade,
  is_system     boolean not null default false,
  kind          public.studio_preset_kind not null,
  name          text not null,
  config        jsonb not null default '{}'::jsonb,   -- prompt/params ; tokens pour brand_theme
  preview_asset_id uuid references public.studio_assets(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint preset_owner_valid check (
    (is_system and owner_user_id is null and owner_boutique_id is null)
    or (not is_system and ((owner_user_id is not null) <> (owner_boutique_id is not null)))
  )
);

-- ---------------------------------------------------------------------
-- 8. article_embeddings — matching live sur l'inventaire (famille L, le moat)
--    Vecteur Marqo-FashionSigLIP (768 dims). Table séparée = re-embed sans
--    toucher articles. Alimente « complète le look » / « shop the look ».
-- ---------------------------------------------------------------------
create table public.article_embeddings (
  article_id    uuid primary key references public.articles(id) on delete cascade,
  embedding     extensions.vector(768) not null,
  model         text not null default 'marqo-fashionsiglip',
  updated_at    timestamptz not null default now()
);

-- Index ANN (cosinus). ivfflat requiert des données pour être efficace ;
-- hnsw est plus robuste à froid → retenu pour la démo.
create index article_embeddings_hnsw
  on public.article_embeddings using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------
-- 9. Index d'exploitation
-- ---------------------------------------------------------------------
create index studio_jobs_owner_user_idx     on public.studio_jobs (owner_user_id, created_at desc);
create index studio_jobs_owner_boutique_idx on public.studio_jobs (owner_boutique_id, created_at desc);
create index studio_jobs_status_idx         on public.studio_jobs (status) where status in ('queued', 'running');
create index studio_assets_owner_user_idx     on public.studio_assets (owner_user_id, created_at desc);
create index studio_assets_owner_boutique_idx on public.studio_assets (owner_boutique_id, created_at desc);
create index studio_assets_article_idx        on public.studio_assets (article_id);
create index studio_ledger_owner_user_idx     on public.studio_credit_ledger (owner_user_id);
create index studio_ledger_owner_boutique_idx on public.studio_credit_ledger (owner_boutique_id);
create index mannequins_owner_user_idx        on public.mannequins (owner_user_id) where not is_system;
create index studio_presets_kind_idx          on public.studio_presets (kind);

-- ---------------------------------------------------------------------
-- 10. Triggers updated_at (réutilise private.set_updated_at, migration 003)
-- ---------------------------------------------------------------------
create trigger studio_jobs_set_updated_at     before update on public.studio_jobs     for each row execute function private.set_updated_at();
create trigger mannequins_set_updated_at      before update on public.mannequins      for each row execute function private.set_updated_at();
create trigger studio_presets_set_updated_at  before update on public.studio_presets  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- 11. RLS — mêmes garde-fous que transactions :
--     lecture = propriétaire ; statuts/crédits = service_role uniquement.
-- ---------------------------------------------------------------------
alter table public.studio_credit_ledger enable row level security;
alter table public.studio_jobs          enable row level security;
alter table public.studio_assets        enable row level security;
alter table public.mannequins           enable row level security;
alter table public.studio_presets       enable row level security;
alter table public.article_embeddings   enable row level security;

-- Grand-livre : lecture seule pour le propriétaire ; AUCUNE écriture client.
create policy credit_select_own on public.studio_credit_ledger
  for select to authenticated
  using (private.owns_studio_row(owner_user_id, owner_boutique_id));

-- Jobs : le propriétaire lit ses jobs et peut EN ENFILER un (queued, non débité).
-- Toute évolution de statut/sortie/crédits passe par l'Engine (service_role).
create policy job_select_own on public.studio_jobs
  for select to authenticated
  using (private.owns_studio_row(owner_user_id, owner_boutique_id));

create policy job_insert_own on public.studio_jobs
  for insert to authenticated
  with check (
    private.owns_studio_row(owner_user_id, owner_boutique_id)
    and created_by = auth.uid()
    and status = 'queued'
    and credits_charged = false
    and output_asset_id is null
    and attempts = 0
  );

-- Assets : lecture propriétaire. Écriture = Engine (service_role). Le
-- catalogue système (mannequins/presets) reste lisible par tous (policies dédiées).
create policy asset_select_own on public.studio_assets
  for select to authenticated
  using (private.owns_studio_row(owner_user_id, owner_boutique_id));

-- Mannequins : catalogue système lisible par tous ; custom = propriétaire (CRUD).
create policy mannequin_select_system_or_own on public.mannequins
  for select to authenticated
  using (is_system or private.owns_studio_row(owner_user_id, owner_boutique_id));

create policy mannequin_write_own on public.mannequins
  for all to authenticated
  using (not is_system and private.owns_studio_row(owner_user_id, owner_boutique_id))
  with check (not is_system and private.owns_studio_row(owner_user_id, owner_boutique_id));

-- Presets : idem (système lisible par tous ; custom = propriétaire).
create policy preset_select_system_or_own on public.studio_presets
  for select to authenticated
  using (is_system or private.owns_studio_row(owner_user_id, owner_boutique_id));

create policy preset_write_own on public.studio_presets
  for all to authenticated
  using (not is_system and private.owns_studio_row(owner_user_id, owner_boutique_id))
  with check (not is_system and private.owns_studio_row(owner_user_id, owner_boutique_id));

-- Embeddings : lecture par tout utilisateur connecté (matching public inventaire).
-- Écriture = Engine (service_role) au (re)calcul.
create policy article_embeddings_read on public.article_embeddings
  for select to authenticated using (true);

commit;

-- =====================================================================
-- 12. STORAGE — buckets Studio (à jouer DANS le dashboard Storage ou via SQL
--     séparé, comme 005_storage_media.sql). Tous PRIVÉS : le rendu propre
--     vit sur DripHaus ; l'export externe applique filigrane + mention IA
--     (famille I). Service externe = URL signée générée côté serveur après
--     contrôle d'accès en base.
-- ---------------------------------------------------------------------
--   studio-in    : uploads bruts vendeur (packshot/porté/étiquette). Privé.
--   studio-draft : itérations basse-déf éphémères (purge auto pg_cron).
--   studio-out   : rendus validés + mannequins + previews presets. Privé, persistant.
-- =====================================================================
--
-- insert into storage.buckets (id, name, public) values
--   ('studio-in',    'studio-in',    false),
--   ('studio-draft', 'studio-draft', false),
--   ('studio-out',   'studio-out',   false)
-- on conflict (id) do nothing;
--
-- -- Lecture/écriture réservées au dossier de l'utilisateur ({auth.uid}/...).
-- -- (répéter pour chaque bucket ; service_role contourne la RLS.)
-- create policy "studio_in_rw_own" on storage.objects for all to authenticated
--   using  (bucket_id = 'studio-in'  and (storage.foldername(name))[1] = auth.uid()::text)
--   with check (bucket_id = 'studio-in' and (storage.foldername(name))[1] = auth.uid()::text);
-- -- … idem studio-draft, studio-out …
--
-- -- Purge des brouillons > 7 jours (pg_cron, cf. 007_close_auctions_cron.sql) :
-- -- select cron.schedule('studio_draft_purge', '0 3 * * *', $$
-- --   delete from storage.objects where bucket_id = 'studio-draft' and created_at < now() - interval '7 days';
-- -- $$);

-- =====================================================================
-- ROLLBACK (si besoin de défaire cette migration)
-- ---------------------------------------------------------------------
-- begin;
--   drop table if exists public.article_embeddings cascade;
--   drop table if exists public.studio_presets    cascade;
--   drop table if exists public.mannequins        cascade;
--   drop table if exists public.studio_assets     cascade;
--   drop table if exists public.studio_jobs       cascade;
--   drop table if exists public.studio_credit_ledger cascade;
--   drop function if exists private.owns_studio_row(uuid, uuid);
--   drop type if exists public.credit_reason, public.mannequin_status,
--     public.studio_preset_kind, public.studio_asset_kind, public.studio_job_status;
-- commit;
-- =====================================================================
