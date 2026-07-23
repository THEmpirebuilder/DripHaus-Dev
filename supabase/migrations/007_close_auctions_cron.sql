-- =====================================================================
-- DripHaus — Clôture automatique des enchères échues
-- Aucun trigger ne peut le faire (la RLS réserve l'update au vendeur) : on
-- passe par une fonction SECURITY DEFINER planifiée avec pg_cron.
--
-- Effet à l'échéance (ends_at <= now, status 'active') :
--   - plus haute offre + réserve atteinte -> status 'ended', winner_user_id,
--     current_price ; article passé en 'reserved' ; notifs auction_won (gagnant)
--     et sale (vendeur ou membres de la boutique) ;
--   - sinon -> status 'ended' sans gagnant.
--
-- À APPLIQUER sur Supabase. pg_cron doit être activé (Dashboard > Database >
-- Extensions, ou le create extension ci-dessous si l'instance l'autorise).
-- =====================================================================

create extension if not exists pg_cron;

create or replace function private.close_due_auctions()
returns void language plpgsql security definer set search_path = private, public as $$
declare
  a record;
  v_bidder uuid;
  v_amount numeric(12,2);
begin
  for a in
    select id, article_id, seller_user_id, seller_boutique_id, reserve_price
    from public.auctions
    where status = 'active' and ends_at <= now()
    for update skip locked
  loop
    v_bidder := null;
    v_amount := null;

    select bidder_user_id, amount into v_bidder, v_amount
    from public.auction_bids
    where auction_id = a.id
    order by amount desc
    limit 1;

    if v_bidder is not null and (a.reserve_price is null or v_amount >= a.reserve_price) then
      -- Vente conclue
      update public.auctions
        set status = 'ended', winner_user_id = v_bidder, current_price = v_amount
        where id = a.id;

      update public.articles set status = 'reserved' where id = a.article_id;

      -- Gagnant
      insert into public.notifications (user_id, type, title, body, reference_type, reference_id)
      values (v_bidder, 'auction_won', 'Enchère remportée',
              'Tu as remporté cette enchère. Finalise ton achat.', 'auction', a.id);

      -- Vendeur (user OU membres de la boutique)
      if a.seller_user_id is not null then
        insert into public.notifications (user_id, type, title, body, reference_type, reference_id)
        values (a.seller_user_id, 'sale', 'Enchère terminée',
                'Ton article a trouvé preneur.', 'auction', a.id);
      elsif a.seller_boutique_id is not null then
        insert into public.notifications (user_id, type, title, body, reference_type, reference_id)
        select bm.user_id, 'sale', 'Enchère terminée',
               'Un article de la boutique a trouvé preneur.', 'auction', a.id
        from public.boutique_members bm
        where bm.boutique_id = a.seller_boutique_id;
      end if;
    else
      -- Aucune offre valable (ou réserve non atteinte)
      update public.auctions set status = 'ended' where id = a.id;
    end if;
  end loop;
end; $$;

revoke all on function private.close_due_auctions() from anon, authenticated;

-- Planification toutes les minutes (idempotent : on retire l'ancien job d'abord)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'close-due-auctions') then
    perform cron.unschedule('close-due-auctions');
  end if;
  perform cron.schedule('close-due-auctions', '* * * * *', $cron$ select private.close_due_auctions(); $cron$);
end $$;
