-- =====================================================================
-- DripHaus — username dénormalisé dans profiles (lecture publique)
-- users.username reste la source de vérité ; profiles.username est un miroir
-- non modifiable directement par le client.
-- =====================================================================

alter table public.profiles
  add column username varchar;

create unique index idx_profiles_username
  on public.profiles (username) where username is not null;

-- Backfill (no-op sur base vide, utile en cas de rejeu)
update public.profiles p
set username = u.username
from public.users u
where u.id = p.user_id and p.username is distinct from u.username;

-- users.username -> profiles.username
create or replace function private.sync_username_to_profile()
returns trigger language plpgsql security definer set search_path = private, public as $$
begin
  update public.profiles
  set username = new.username
  where user_id = new.id and username is distinct from new.username;
  return new;
end;
$$;

revoke all on function private.sync_username_to_profile() from anon, authenticated;

create trigger trg_users_sync_username
  after insert or update of username on public.users
  for each row execute function private.sync_username_to_profile();

-- Toute écriture sur profiles.username est écrasée par la valeur de users
create or replace function private.enforce_profile_username()
returns trigger language plpgsql security definer set search_path = private, public as $$
begin
  select u.username into new.username
  from public.users u
  where u.id = new.user_id;
  return new;
end;
$$;

revoke all on function private.enforce_profile_username() from anon, authenticated;

create trigger trg_profiles_enforce_username
  before insert or update on public.profiles
  for each row execute function private.enforce_profile_username();
