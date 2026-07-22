-- =====================================================================
-- DripHaus — Schéma initial
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
create type public.user_role            as enum ('particulier','createur','boutique');
create type public.user_status          as enum ('active','pending_kyc','suspended');
create type public.subscription_tier    as enum ('free','pro','premium');
create type public.boutique_status      as enum ('active','suspended','pending');
create type public.boutique_member_role as enum ('owner','manager');
create type public.article_condition    as enum ('new','very_good','good','fair');
create type public.article_status       as enum ('draft','active','sold','reserved','archived');
create type public.auction_status       as enum ('scheduled','active','ended','cancelled');
create type public.post_type            as enum ('organic','article_share','auction','promo');
create type public.post_status          as enum ('published','draft','removed');
create type public.payment_status       as enum ('pending','paid','held','refunded','failed');
create type public.payout_status        as enum ('pending','released','held','refunded');
create type public.dispute_reason       as enum ('not_received','not_as_described','damaged','other');
create type public.dispute_status       as enum ('open','under_review','resolved_buyer','resolved_seller','closed');
create type public.comment_status       as enum ('active','removed');
create type public.notification_type    as enum ('new_follower','new_like','new_comment','new_bid','auction_won','sale','payout','dispute');
create type public.reference_type       as enum ('post','article','auction','transaction','dispute');

-- ---------------------------------------------------------------------
-- USERS  (adossé à auth.users — pas de password_hash)
-- ---------------------------------------------------------------------
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         varchar not null unique,
  role          public.user_role   not null default 'particulier',
  username      varchar unique,
  status        public.user_status not null default 'pending_kyc',
  kyc_verified  boolean not null default false,
  stripe_account_id varchar unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint users_username_format check (
    username is null or username ~ '^[a-z0-9_]{3,30}$'
  )
);

create table public.profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references public.users(id) on delete cascade,
  display_name varchar,
  avatar_url   varchar,
  bio          text,
  location     varchar,
  website_url  varchar,
  social_links jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- BOUTIQUES
-- ---------------------------------------------------------------------
create table public.boutiques (
  id                uuid primary key default gen_random_uuid(),
  handle            varchar not null unique,
  name              varchar not null,
  description       text,
  logo_url          varchar,
  cover_url         varchar,
  address           jsonb,
  phone             varchar,
  email_contact     varchar,
  website_url       varchar,
  social_links      jsonb not null default '{}'::jsonb,
  business_hours    jsonb,
  siret_ide         varchar,
  kyc_verified      boolean not null default false,
  subscription_tier public.subscription_tier not null default 'free',
  status            public.boutique_status   not null default 'pending',
  stripe_account_id varchar unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint boutiques_handle_format check (handle ~ '^[a-z0-9-]{3,40}$')
);

create table public.boutique_members (
  user_id     uuid not null references public.users(id)     on delete cascade,
  boutique_id uuid not null references public.boutiques(id) on delete cascade,
  role        public.boutique_member_role not null default 'manager',
  joined_at   timestamptz not null default now(),
  primary key (user_id, boutique_id)
);

-- ---------------------------------------------------------------------
-- CATEGORIES / ARTICLES
-- ---------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       varchar not null,
  slug       varchar not null unique,
  parent_id  uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint categories_no_self_parent check (parent_id is null or parent_id <> id)
);

create table public.articles (
  id                 uuid primary key default gen_random_uuid(),
  seller_user_id     uuid references public.users(id)     on delete cascade,
  seller_boutique_id uuid references public.boutiques(id) on delete cascade,
  category_id        uuid references public.categories(id) on delete set null,
  title              varchar not null,
  description        text,
  brand              varchar,
  condition          public.article_condition,
  size               varchar,
  color              varchar,
  price              numeric(12,2) not null,
  currency           char(3) not null default 'CHF',
  images             jsonb not null default '[]'::jsonb,
  status             public.article_status not null default 'draft',
  is_auction         boolean not null default false,
  location           varchar,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint articles_seller_xor check (
    (seller_user_id is not null) <> (seller_boutique_id is not null)
  ),
  constraint articles_price_positive check (price > 0)
);

-- ---------------------------------------------------------------------
-- AUCTIONS
-- ---------------------------------------------------------------------
create table public.auctions (
  id                 uuid primary key default gen_random_uuid(),
  article_id         uuid not null unique references public.articles(id) on delete cascade,
  seller_user_id     uuid references public.users(id)     on delete cascade,
  seller_boutique_id uuid references public.boutiques(id) on delete cascade,
  starting_price     numeric(12,2) not null,
  current_price      numeric(12,2),
  reserve_price      numeric(12,2),
  bid_increment      numeric(12,2) not null default 1.00,
  starts_at          timestamptz not null default now(),
  ends_at            timestamptz not null,
  status             public.auction_status not null default 'scheduled',
  winner_user_id     uuid references public.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint auctions_seller_xor check (
    (seller_user_id is not null) <> (seller_boutique_id is not null)
  ),
  constraint auctions_prices_positive check (
    starting_price > 0
    and bid_increment > 0
    and (reserve_price is null or reserve_price >= starting_price)
    and (current_price is null or current_price >= starting_price)
  ),
  constraint auctions_window_valid check (ends_at > starts_at)
);

create table public.auction_bids (
  id              uuid primary key default gen_random_uuid(),
  auction_id      uuid not null references public.auctions(id) on delete cascade,
  bidder_user_id  uuid not null references public.users(id)    on delete cascade,
  amount          numeric(12,2) not null,
  created_at      timestamptz not null default now(),
  constraint auction_bids_amount_positive check (amount > 0),
  constraint auction_bids_unique_amount unique (auction_id, amount)
);

-- ---------------------------------------------------------------------
-- SOCIAL
-- ---------------------------------------------------------------------
create table public.posts (
  id                 uuid primary key default gen_random_uuid(),
  author_user_id     uuid references public.users(id)     on delete cascade,
  author_boutique_id uuid references public.boutiques(id) on delete cascade,
  content            text,
  media              jsonb not null default '[]'::jsonb,
  type               public.post_type   not null default 'organic',
  article_id         uuid references public.articles(id) on delete set null,
  auction_id         uuid references public.auctions(id) on delete set null,
  status             public.post_status not null default 'published',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint posts_author_xor check (
    (author_user_id is not null) <> (author_boutique_id is not null)
  ),
  constraint posts_has_body check (
    content is not null or media <> '[]'::jsonb or article_id is not null or auction_id is not null
  )
);

create table public.follows (
  id                   uuid primary key default gen_random_uuid(),
  follower_user_id     uuid not null references public.users(id)     on delete cascade,
  followed_user_id     uuid references public.users(id)              on delete cascade,
  followed_boutique_id uuid references public.boutiques(id)          on delete cascade,
  created_at           timestamptz not null default now(),
  constraint follows_target_xor check (
    (followed_user_id is not null) <> (followed_boutique_id is not null)
  ),
  constraint follows_no_self check (
    followed_user_id is null or followed_user_id <> follower_user_id
  )
);
create unique index follows_unique_user     on public.follows (follower_user_id, followed_user_id)     where followed_user_id is not null;
create unique index follows_unique_boutique on public.follows (follower_user_id, followed_boutique_id) where followed_boutique_id is not null;

create table public.likes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_unique unique (user_id, post_id)
);

create table public.comments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id)    on delete cascade,
  post_id           uuid not null references public.posts(id)    on delete cascade,
  parent_comment_id uuid references public.comments(id)          on delete cascade,
  content           text not null,
  status            public.comment_status not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint comments_no_self_parent check (parent_comment_id is null or parent_comment_id <> id),
  constraint comments_content_not_empty check (length(btrim(content)) > 0)
);

-- ---------------------------------------------------------------------
-- TRANSACTIONS / DISPUTES / REVIEWS
-- ---------------------------------------------------------------------
create table public.transactions (
  id                 uuid primary key default gen_random_uuid(),
  article_id         uuid references public.articles(id) on delete set null,
  auction_id         uuid references public.auctions(id) on delete set null,
  buyer_user_id      uuid not null references public.users(id) on delete restrict,
  seller_user_id     uuid references public.users(id)     on delete restrict,
  seller_boutique_id uuid references public.boutiques(id) on delete restrict,
  amount             numeric(12,2) not null,
  currency           char(3) not null default 'CHF',
  platform_fee       numeric(12,2) not null default 0,
  payout_amount      numeric(12,2),
  payment_status     public.payment_status not null default 'pending',
  payout_status      public.payout_status  not null default 'pending',
  stripe_payment_id  varchar unique,
  tracking_number    varchar,
  delivered_at       timestamptz,
  payout_released_at timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint transactions_seller_xor check (
    (seller_user_id is not null) <> (seller_boutique_id is not null)
  ),
  constraint transactions_has_subject check (
    article_id is not null or auction_id is not null
  ),
  constraint transactions_amounts check (
    amount > 0 and platform_fee >= 0 and (payout_amount is null or payout_amount >= 0)
  ),
  constraint transactions_buyer_not_seller check (
    seller_user_id is null or seller_user_id <> buyer_user_id
  )
);

create table public.disputes (
  id                uuid primary key default gen_random_uuid(),
  transaction_id    uuid not null references public.transactions(id) on delete cascade,
  raised_by_user_id uuid not null references public.users(id)        on delete cascade,
  reason            public.dispute_reason not null,
  description       text,
  status            public.dispute_status not null default 'open',
  resolution_notes  text,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint disputes_resolved_consistency check (
    (status in ('resolved_buyer','resolved_seller','closed')) = (resolved_at is not null)
  )
);

create table public.reviews (
  id                   uuid primary key default gen_random_uuid(),
  transaction_id       uuid not null references public.transactions(id) on delete cascade,
  reviewer_user_id     uuid not null references public.users(id)        on delete cascade,
  reviewed_user_id     uuid references public.users(id)                 on delete cascade,
  reviewed_boutique_id uuid references public.boutiques(id)             on delete cascade,
  rating               smallint not null,
  comment              text,
  created_at           timestamptz not null default now(),
  constraint reviews_target_xor check (
    (reviewed_user_id is not null) <> (reviewed_boutique_id is not null)
  ),
  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_no_self check (
    reviewed_user_id is null or reviewed_user_id <> reviewer_user_id
  ),
  constraint reviews_one_per_tx unique (transaction_id, reviewer_user_id)
);

create table public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  type           public.notification_type not null,
  title          varchar,
  body           text,
  reference_type public.reference_type,
  reference_id   uuid,
  is_read        boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint notifications_reference_pair check (
    (reference_type is null) = (reference_id is null)
  )
);

-- ---------------------------------------------------------------------
-- INDEX sur les FK et colonnes fréquemment filtrées
-- ---------------------------------------------------------------------
create index idx_profiles_user            on public.profiles (user_id);
create index idx_boutique_members_boutique on public.boutique_members (boutique_id);
create index idx_categories_parent        on public.categories (parent_id);

create index idx_articles_seller_user     on public.articles (seller_user_id);
create index idx_articles_seller_boutique on public.articles (seller_boutique_id);
create index idx_articles_category        on public.articles (category_id);
create index idx_articles_status_created  on public.articles (status, created_at desc);
create index idx_articles_brand           on public.articles (brand) where brand is not null;

create index idx_auctions_article         on public.auctions (article_id);
create index idx_auctions_seller_user     on public.auctions (seller_user_id);
create index idx_auctions_seller_boutique on public.auctions (seller_boutique_id);
create index idx_auctions_winner          on public.auctions (winner_user_id);
create index idx_auctions_status_ends     on public.auctions (status, ends_at);

create index idx_bids_auction_amount      on public.auction_bids (auction_id, amount desc);
create index idx_bids_bidder              on public.auction_bids (bidder_user_id);

create index idx_posts_author_user        on public.posts (author_user_id);
create index idx_posts_author_boutique    on public.posts (author_boutique_id);
create index idx_posts_article            on public.posts (article_id);
create index idx_posts_auction            on public.posts (auction_id);
create index idx_posts_status_created     on public.posts (status, created_at desc);

create index idx_follows_follower         on public.follows (follower_user_id);
create index idx_follows_followed_user    on public.follows (followed_user_id);
create index idx_follows_followed_boutique on public.follows (followed_boutique_id);

create index idx_likes_post               on public.likes (post_id);
create index idx_comments_post_created    on public.comments (post_id, created_at);
create index idx_comments_user            on public.comments (user_id);
create index idx_comments_parent          on public.comments (parent_comment_id);

create index idx_tx_article               on public.transactions (article_id);
create index idx_tx_auction               on public.transactions (auction_id);
create index idx_tx_buyer                 on public.transactions (buyer_user_id);
create index idx_tx_seller_user           on public.transactions (seller_user_id);
create index idx_tx_seller_boutique       on public.transactions (seller_boutique_id);
create index idx_tx_payment_status        on public.transactions (payment_status);

create index idx_disputes_transaction     on public.disputes (transaction_id);
create index idx_disputes_raised_by       on public.disputes (raised_by_user_id);

create index idx_reviews_transaction      on public.reviews (transaction_id);
create index idx_reviews_reviewer         on public.reviews (reviewer_user_id);
create index idx_reviews_reviewed_user    on public.reviews (reviewed_user_id);
create index idx_reviews_reviewed_boutique on public.reviews (reviewed_boutique_id);

create index idx_notifications_user_unread on public.notifications (user_id, is_read, created_at desc);

-- ---------------------------------------------------------------------
-- TRIGGERS updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'users','profiles','boutiques','articles','auctions',
    'posts','comments','transactions','disputes'
  ] loop
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$s
       for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Provisionnement automatique depuis auth.users
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.users (id, email, role)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'particulier')
  )
  on conflict (id) do nothing;

  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
