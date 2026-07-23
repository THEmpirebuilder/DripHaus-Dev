-- =====================================================================
-- DripHaus — Génération automatique des notifications (triggers)
-- L'insert client sur `notifications` est interdit par la RLS ; ces
-- fonctions SECURITY DEFINER (schéma privé) créent les notifications à la
-- place, sur événement. Elles ne sont pas appelables en RPC.
--
-- Couvre : new_follower, new_like, new_comment, new_bid.
-- (sale / payout sont émises par le webhook Stripe ; auction_won par la
--  migration 007 lors de la clôture.)
--
-- À APPLIQUER sur Supabase (aucune régénération de types nécessaire).
-- =====================================================================

-- ---------------------------------------------------------------------
-- NEW_FOLLOWER
-- ---------------------------------------------------------------------
create or replace function private.notify_new_follower()
returns trigger language plpgsql security definer set search_path = private, public as $$
declare
  v_actor text;
begin
  select coalesce(display_name, username, 'Une personne') into v_actor
  from public.profiles where user_id = new.follower_user_id;

  if new.followed_user_id is not null then
    insert into public.notifications (user_id, type, title, body, reference_type, reference_id)
    values (new.followed_user_id, 'new_follower', 'Nouvel abonné',
            v_actor || ' te suit désormais.', null, null);
  elsif new.followed_boutique_id is not null then
    insert into public.notifications (user_id, type, title, body, reference_type, reference_id)
    select bm.user_id, 'new_follower', 'Nouvel abonné',
           v_actor || ' suit désormais ta boutique.', null, null
    from public.boutique_members bm
    where bm.boutique_id = new.followed_boutique_id and bm.user_id <> new.follower_user_id;
  end if;
  return new;
end; $$;

-- ---------------------------------------------------------------------
-- NEW_LIKE
-- ---------------------------------------------------------------------
create or replace function private.notify_new_like()
returns trigger language plpgsql security definer set search_path = private, public as $$
declare
  v_author_user uuid;
  v_author_boutique uuid;
  v_actor text;
begin
  select author_user_id, author_boutique_id into v_author_user, v_author_boutique
  from public.posts where id = new.post_id;

  select coalesce(display_name, username, 'Une personne') into v_actor
  from public.profiles where user_id = new.user_id;

  if v_author_user is not null and v_author_user <> new.user_id then
    insert into public.notifications (user_id, type, title, body, reference_type, reference_id)
    values (v_author_user, 'new_like', 'Nouveau like',
            v_actor || ' a aimé ta publication.', 'post', new.post_id);
  elsif v_author_boutique is not null then
    insert into public.notifications (user_id, type, title, body, reference_type, reference_id)
    select bm.user_id, 'new_like', 'Nouveau like',
           v_actor || ' a aimé une publication de la boutique.', 'post', new.post_id
    from public.boutique_members bm
    where bm.boutique_id = v_author_boutique and bm.user_id <> new.user_id;
  end if;
  return new;
end; $$;

-- ---------------------------------------------------------------------
-- NEW_COMMENT
-- ---------------------------------------------------------------------
create or replace function private.notify_new_comment()
returns trigger language plpgsql security definer set search_path = private, public as $$
declare
  v_author_user uuid;
  v_author_boutique uuid;
  v_actor text;
begin
  select author_user_id, author_boutique_id into v_author_user, v_author_boutique
  from public.posts where id = new.post_id;

  select coalesce(display_name, username, 'Une personne') into v_actor
  from public.profiles where user_id = new.user_id;

  if v_author_user is not null and v_author_user <> new.user_id then
    insert into public.notifications (user_id, type, title, body, reference_type, reference_id)
    values (v_author_user, 'new_comment', 'Nouveau commentaire',
            v_actor || ' a commenté ta publication.', 'post', new.post_id);
  elsif v_author_boutique is not null then
    insert into public.notifications (user_id, type, title, body, reference_type, reference_id)
    select bm.user_id, 'new_comment', 'Nouveau commentaire',
           v_actor || ' a commenté une publication de la boutique.', 'post', new.post_id
    from public.boutique_members bm
    where bm.boutique_id = v_author_boutique and bm.user_id <> new.user_id;
  end if;
  return new;
end; $$;

-- ---------------------------------------------------------------------
-- NEW_BID
-- ---------------------------------------------------------------------
create or replace function private.notify_new_bid()
returns trigger language plpgsql security definer set search_path = private, public as $$
declare
  v_seller_user uuid;
  v_seller_boutique uuid;
  v_actor text;
begin
  select seller_user_id, seller_boutique_id into v_seller_user, v_seller_boutique
  from public.auctions where id = new.auction_id;

  select coalesce(display_name, username, 'Une personne') into v_actor
  from public.profiles where user_id = new.bidder_user_id;

  if v_seller_user is not null and v_seller_user <> new.bidder_user_id then
    insert into public.notifications (user_id, type, title, body, reference_type, reference_id)
    values (v_seller_user, 'new_bid', 'Nouvelle offre',
            v_actor || ' a enchéri sur ta vente.', 'auction', new.auction_id);
  elsif v_seller_boutique is not null then
    insert into public.notifications (user_id, type, title, body, reference_type, reference_id)
    select bm.user_id, 'new_bid', 'Nouvelle offre',
           v_actor || ' a enchéri sur une vente de la boutique.', 'auction', new.auction_id
    from public.boutique_members bm
    where bm.boutique_id = v_seller_boutique and bm.user_id <> new.bidder_user_id;
  end if;
  return new;
end; $$;

-- ---------------------------------------------------------------------
-- Verrouillage RPC + triggers
-- ---------------------------------------------------------------------
revoke all on function private.notify_new_follower() from anon, authenticated;
revoke all on function private.notify_new_like()     from anon, authenticated;
revoke all on function private.notify_new_comment()  from anon, authenticated;
revoke all on function private.notify_new_bid()      from anon, authenticated;

create trigger trg_follow_notify
  after insert on public.follows
  for each row execute function private.notify_new_follower();

create trigger trg_like_notify
  after insert on public.likes
  for each row execute function private.notify_new_like();

create trigger trg_comment_notify
  after insert on public.comments
  for each row execute function private.notify_new_comment();

create trigger trg_bid_notify
  after insert on public.auction_bids
  for each row execute function private.notify_new_bid();
