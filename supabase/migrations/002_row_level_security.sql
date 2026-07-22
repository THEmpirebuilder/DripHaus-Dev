-- =====================================================================
-- DripHaus — Row Level Security
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helpers (SECURITY DEFINER pour éviter la récursion des policies)
-- NB : déplacés dans le schéma `private` par la migration 003.
-- ---------------------------------------------------------------------
create or replace function public.is_boutique_member(p_boutique_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select p_boutique_id is not null and exists (
    select 1 from public.boutique_members bm
    where bm.boutique_id = p_boutique_id and bm.user_id = auth.uid()
  );
$$;

create or replace function public.is_boutique_owner(p_boutique_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select p_boutique_id is not null and exists (
    select 1 from public.boutique_members bm
    where bm.boutique_id = p_boutique_id
      and bm.user_id = auth.uid()
      and bm.role = 'owner'
  );
$$;

create or replace function public.boutique_has_members(p_boutique_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.boutique_members bm where bm.boutique_id = p_boutique_id);
$$;

create or replace function public.owns_article(p_article_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.articles a
    where a.id = p_article_id
      and (a.seller_user_id = auth.uid() or public.is_boutique_member(a.seller_boutique_id))
  );
$$;

create or replace function public.is_transaction_party(p_tx_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.transactions t
    where t.id = p_tx_id
      and (t.buyer_user_id = auth.uid()
        or t.seller_user_id = auth.uid()
        or public.is_boutique_member(t.seller_boutique_id))
  );
$$;

-- ---------------------------------------------------------------------
-- Activation RLS sur les 16 tables
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'users','profiles','boutiques','boutique_members','categories','articles',
    'auctions','auction_bids','posts','follows','likes','comments',
    'transactions','disputes','reviews','notifications'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- USERS — données privées (email). L'identité publique vit dans profiles.
-- ---------------------------------------------------------------------
create policy users_select_self on public.users
  for select to authenticated using (id = auth.uid());

create policy users_update_self on public.users
  for update to authenticated using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- PROFILES — lecture publique
-- ---------------------------------------------------------------------
create policy profiles_select_public on public.profiles
  for select to anon, authenticated using (true);

create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (user_id = auth.uid());

create policy profiles_update_own on public.profiles
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- BOUTIQUES
-- ---------------------------------------------------------------------
create policy boutiques_select_public on public.boutiques
  for select to anon, authenticated
  using (status = 'active' or public.is_boutique_member(id));

create policy boutiques_insert_auth on public.boutiques
  for insert to authenticated with check (true);

create policy boutiques_update_member on public.boutiques
  for update to authenticated using (public.is_boutique_member(id))
  with check (public.is_boutique_member(id));

create policy boutiques_delete_owner on public.boutiques
  for delete to authenticated using (public.is_boutique_owner(id));

-- ---------------------------------------------------------------------
-- BOUTIQUE_MEMBERS
-- ---------------------------------------------------------------------
create policy bm_select on public.boutique_members
  for select to anon, authenticated using (true);

-- 1er membre = créateur de la boutique (owner), ensuite réservé aux owners
create policy bm_insert on public.boutique_members
  for insert to authenticated with check (
    public.is_boutique_owner(boutique_id)
    or (not public.boutique_has_members(boutique_id) and user_id = auth.uid() and role = 'owner')
  );

create policy bm_update_owner on public.boutique_members
  for update to authenticated using (public.is_boutique_owner(boutique_id))
  with check (public.is_boutique_owner(boutique_id));

create policy bm_delete on public.boutique_members
  for delete to authenticated
  using (public.is_boutique_owner(boutique_id) or user_id = auth.uid());

-- ---------------------------------------------------------------------
-- CATEGORIES — lecture publique, écriture réservée au service_role
-- ---------------------------------------------------------------------
create policy categories_select_public on public.categories
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- ARTICLES
-- ---------------------------------------------------------------------
create policy articles_select_public on public.articles
  for select to anon, authenticated using (
    status in ('active','sold','reserved')
    or seller_user_id = auth.uid()
    or public.is_boutique_member(seller_boutique_id)
  );

create policy articles_insert_own on public.articles
  for insert to authenticated with check (
    seller_user_id = auth.uid() or public.is_boutique_member(seller_boutique_id)
  );

create policy articles_update_own on public.articles
  for update to authenticated
  using (seller_user_id = auth.uid() or public.is_boutique_member(seller_boutique_id))
  with check (seller_user_id = auth.uid() or public.is_boutique_member(seller_boutique_id));

create policy articles_delete_own on public.articles
  for delete to authenticated
  using (seller_user_id = auth.uid() or public.is_boutique_member(seller_boutique_id));

-- ---------------------------------------------------------------------
-- AUCTIONS
-- ---------------------------------------------------------------------
create policy auctions_select_public on public.auctions
  for select to anon, authenticated using (true);

create policy auctions_insert_own on public.auctions
  for insert to authenticated with check (
    (seller_user_id = auth.uid() or public.is_boutique_member(seller_boutique_id))
    and public.owns_article(article_id)
  );

create policy auctions_update_own on public.auctions
  for update to authenticated
  using (seller_user_id = auth.uid() or public.is_boutique_member(seller_boutique_id))
  with check (seller_user_id = auth.uid() or public.is_boutique_member(seller_boutique_id));

create policy auctions_delete_own on public.auctions
  for delete to authenticated
  using (seller_user_id = auth.uid() or public.is_boutique_member(seller_boutique_id));

-- ---------------------------------------------------------------------
-- AUCTION_BIDS — immuables une fois posées
-- ---------------------------------------------------------------------
create policy bids_select_public on public.auction_bids
  for select to anon, authenticated using (true);

create policy bids_insert_self on public.auction_bids
  for insert to authenticated with check (
    bidder_user_id = auth.uid()
    and exists (
      select 1 from public.auctions a
      where a.id = auction_id
        and a.status = 'active'
        and now() between a.starts_at and a.ends_at
        and a.seller_user_id is distinct from auth.uid()
        and not public.is_boutique_member(a.seller_boutique_id)
    )
  );

-- ---------------------------------------------------------------------
-- POSTS
-- ---------------------------------------------------------------------
create policy posts_select_public on public.posts
  for select to anon, authenticated using (
    status = 'published'
    or author_user_id = auth.uid()
    or public.is_boutique_member(author_boutique_id)
  );

create policy posts_insert_own on public.posts
  for insert to authenticated with check (
    author_user_id = auth.uid() or public.is_boutique_member(author_boutique_id)
  );

create policy posts_update_own on public.posts
  for update to authenticated
  using (author_user_id = auth.uid() or public.is_boutique_member(author_boutique_id))
  with check (author_user_id = auth.uid() or public.is_boutique_member(author_boutique_id));

create policy posts_delete_own on public.posts
  for delete to authenticated
  using (author_user_id = auth.uid() or public.is_boutique_member(author_boutique_id));

-- ---------------------------------------------------------------------
-- FOLLOWS / LIKES / COMMENTS
-- ---------------------------------------------------------------------
create policy follows_select_public on public.follows
  for select to anon, authenticated using (true);

create policy follows_insert_self on public.follows
  for insert to authenticated with check (follower_user_id = auth.uid());

create policy follows_delete_self on public.follows
  for delete to authenticated using (follower_user_id = auth.uid());

create policy likes_select_public on public.likes
  for select to anon, authenticated using (true);

create policy likes_insert_self on public.likes
  for insert to authenticated with check (user_id = auth.uid());

create policy likes_delete_self on public.likes
  for delete to authenticated using (user_id = auth.uid());

create policy comments_select_public on public.comments
  for select to anon, authenticated
  using (status = 'active' or user_id = auth.uid());

create policy comments_insert_self on public.comments
  for insert to authenticated with check (user_id = auth.uid());

create policy comments_update_self on public.comments
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy comments_delete_self on public.comments
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- TRANSACTIONS — visibles des seules parties, muables par Stripe uniquement
-- ---------------------------------------------------------------------
create policy tx_select_party on public.transactions
  for select to authenticated using (
    buyer_user_id = auth.uid()
    or seller_user_id = auth.uid()
    or public.is_boutique_member(seller_boutique_id)
  );

create policy tx_insert_buyer on public.transactions
  for insert to authenticated with check (
    buyer_user_id = auth.uid()
    and payment_status = 'pending'
    and payout_status = 'pending'
  );

-- Pas d'UPDATE/DELETE client : réservé au webhook Stripe (service_role).

-- ---------------------------------------------------------------------
-- DISPUTES
-- ---------------------------------------------------------------------
create policy disputes_select_party on public.disputes
  for select to authenticated using (public.is_transaction_party(transaction_id));

create policy disputes_insert_party on public.disputes
  for insert to authenticated with check (
    raised_by_user_id = auth.uid()
    and public.is_transaction_party(transaction_id)
    and status = 'open'
  );

-- Résolution réservée à l'administration (service_role).

-- ---------------------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------------------
create policy reviews_select_public on public.reviews
  for select to anon, authenticated using (true);

create policy reviews_insert_party on public.reviews
  for insert to authenticated with check (
    reviewer_user_id = auth.uid()
    and public.is_transaction_party(transaction_id)
  );

create policy reviews_update_own on public.reviews
  for update to authenticated using (reviewer_user_id = auth.uid())
  with check (reviewer_user_id = auth.uid());

create policy reviews_delete_own on public.reviews
  for delete to authenticated using (reviewer_user_id = auth.uid());

-- ---------------------------------------------------------------------
-- NOTIFICATIONS — lecture et marquage lu par le destinataire
-- ---------------------------------------------------------------------
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());

create policy notifications_update_own on public.notifications
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_delete_own on public.notifications
  for delete to authenticated using (user_id = auth.uid());
