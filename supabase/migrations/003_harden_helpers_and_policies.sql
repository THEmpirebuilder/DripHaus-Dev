-- =====================================================================
-- DripHaus — Durcissement : helpers hors API publique
-- =====================================================================

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- Déplacer les helpers SECURITY DEFINER hors du schéma exposé par PostgREST
alter function public.is_boutique_member(uuid)   set schema private;
alter function public.is_boutique_owner(uuid)    set schema private;
alter function public.boutique_has_members(uuid) set schema private;
alter function public.owns_article(uuid)         set schema private;
alter function public.is_transaction_party(uuid) set schema private;
alter function public.handle_new_user()          set schema private;
alter function public.set_updated_at()           set schema private;

-- Réécrire les corps avec les références et search_path corrigés
create or replace function private.is_boutique_member(p_boutique_id uuid)
returns boolean language sql security definer stable set search_path = private, public as $$
  select p_boutique_id is not null and exists (
    select 1 from public.boutique_members bm
    where bm.boutique_id = p_boutique_id and bm.user_id = auth.uid()
  );
$$;

create or replace function private.is_boutique_owner(p_boutique_id uuid)
returns boolean language sql security definer stable set search_path = private, public as $$
  select p_boutique_id is not null and exists (
    select 1 from public.boutique_members bm
    where bm.boutique_id = p_boutique_id
      and bm.user_id = auth.uid()
      and bm.role = 'owner'
  );
$$;

create or replace function private.boutique_has_members(p_boutique_id uuid)
returns boolean language sql security definer stable set search_path = private, public as $$
  select exists (select 1 from public.boutique_members bm where bm.boutique_id = p_boutique_id);
$$;

create or replace function private.owns_article(p_article_id uuid)
returns boolean language sql security definer stable set search_path = private, public as $$
  select exists (
    select 1 from public.articles a
    where a.id = p_article_id
      and (a.seller_user_id = auth.uid() or private.is_boutique_member(a.seller_boutique_id))
  );
$$;

create or replace function private.is_transaction_party(p_tx_id uuid)
returns boolean language sql security definer stable set search_path = private, public as $$
  select exists (
    select 1 from public.transactions t
    where t.id = p_tx_id
      and (t.buyer_user_id = auth.uid()
        or t.seller_user_id = auth.uid()
        or private.is_boutique_member(t.seller_boutique_id))
  );
$$;

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = private, public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = private, public, auth as $$
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

-- Le trigger d'auth ne doit pas être appelable en RPC ni directement
revoke all on function private.handle_new_user() from anon, authenticated;
revoke all on function private.set_updated_at() from anon, authenticated;

-- Resserrer l'INSERT sur boutiques (plus de WITH CHECK (true))
drop policy boutiques_insert_auth on public.boutiques;
create policy boutiques_insert_auth on public.boutiques
  for insert to authenticated
  with check (auth.uid() is not null and status = 'pending');
