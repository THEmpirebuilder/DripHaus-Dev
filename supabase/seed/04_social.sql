-- ============================================================
-- SEED 04 — Activité sociale + 1 enchère (démo)
-- Idempotent. Les triggers (migration 006) émettent les notifications.
--   * posts/comments : id déterministe __demo_uid('post:...') + on conflict (id)
--   * follows        : garde NOT EXISTS (index uniques partiels)
--   * likes          : on conflict (user_id, post_id)
--   * auction/bids   : on conflict (article_id) / (auction_id, amount)
-- ============================================================

create or replace function public.__demo_uid(p text) returns uuid language sql immutable as $$
  select (substr(md5(p),1,8)||'-'||substr(md5(p),9,4)||'-'||substr(md5(p),13,4)||'-'||substr(md5(p),17,4)||'-'||substr(md5(p),21,12))::uuid
$$;

-- ---------- POSTS ----------
insert into public.posts (id, author_user_id, author_boutique_id, content, type, article_id, status, created_at) values
  (public.__demo_uid('post:hir-robe'),   null, (select id from public.boutiques where handle='maison-hirondelle'), 'Nouvelle arrivée : notre robe midi plissée Sézane, l''intemporel de la saison. 🌿 Dispo en boutique et ici.', 'article_share', public.__demo_uid('article:38652624'), 'published', now() - interval '3 days'),
  (public.__demo_uid('post:hir-sac'),    null, (select id from public.boutiques where handle='maison-hirondelle'), 'Le sac cabas en cuir Longchamp, parfait pour tous les jours. Pièce chinée, état neuf.', 'article_share', public.__demo_uid('article:27046146'), 'published', now() - interval '6 days'),
  (public.__demo_uid('post:arg-manteau'),null, (select id from public.boutiques where handle='atelier-rive-gauche'), 'Coup de cœur atelier : manteau en laine COS, coupe droite. Confection revalorisée dans notre atelier des Eaux-Vives. ♻️', 'article_share', public.__demo_uid('article:13094233'), 'published', now() - interval '1 days'),
  (public.__demo_uid('post:arg-promo'),  null, (select id from public.boutiques where handle='atelier-rive-gauche'), '-15% sur toute la sélection upcyclée ce week-end. Passez nous voir à Genève !', 'promo', null, 'published', now() - interval '2 days'),
  (public.__demo_uid('post:flon-jean'),  null, (select id from public.boutiques where handle='friperie-du-flon'), 'Arrivage denim vintage : Levi''s, Wrangler, Nudie… tailles W28 à W33. Premier arrivé, premier servi. 👖', 'article_share', public.__demo_uid('article:20143795'), 'published', now() - interval '4 days'),
  (public.__demo_uid('post:julien-snkr'),public.__demo_uid('julien.rochat@demo.driphaus.ch'), null, 'Je me sépare de mes sneakers Nike basses en cuir, très bon état, taille 39. MP pour les détails !', 'article_share', public.__demo_uid('article:1464625'), 'published', now() - interval '2 days'),
  (public.__demo_uid('post:noe-snkr'),   public.__demo_uid('noe.girard@demo.driphaus.ch'), null, 'Petite pépite du dressing : Converse chunky turquoise, taille 43. Rare dans cette couleur.', 'article_share', public.__demo_uid('article:19869760'), 'published', now() - interval '5 days'),
  (public.__demo_uid('post:yasmine-org'),public.__demo_uid('yasmine.haddad@demo.driphaus.ch'), null, 'Nouvelle mini-série de bijoux faits main disponible bientôt. Restez connectés ✨', 'organic', null, 'published', now() - interval '7 days'),
  (public.__demo_uid('post:loic-org'),   public.__demo_uid('loic.chappuis@demo.driphaus.ch'), null, 'Drop maison la semaine prochaine — coupes oversize, édition limitée. Lausanne représente. 🔥', 'organic', null, 'published', now() - interval '1 days'),
  (public.__demo_uid('post:camille-org'),public.__demo_uid('camille.beguin@demo.driphaus.ch'), null, 'Grand tri de printemps dans mon dressing : plein de belles pièces à petits prix ce mois-ci.', 'organic', null, 'published', now() - interval '8 days')
on conflict (id) do update set content=excluded.content, type=excluded.type, article_id=excluded.article_id, author_user_id=excluded.author_user_id, author_boutique_id=excluded.author_boutique_id;

-- ---------- FOLLOWS ----------
-- Chaque particulier/créateur suit les 3 boutiques
insert into public.follows (follower_user_id, followed_boutique_id)
select u.id, b.id
from public.users u
cross join public.boutiques b
where u.email like '%@demo.driphaus.ch' and u.role <> 'boutique'
  and b.handle in ('atelier-rive-gauche','friperie-du-flon','maison-hirondelle')
  and not exists (select 1 from public.follows f where f.follower_user_id = u.id and f.followed_boutique_id = b.id);

-- Quelques follows entre utilisateurs (fans de créateurs)
with uf(a,b) as (values
  ('camille.beguin@demo.driphaus.ch','yasmine.haddad@demo.driphaus.ch'),
  ('elodie.favre@demo.driphaus.ch','yasmine.haddad@demo.driphaus.ch'),
  ('marine.dubois@demo.driphaus.ch','loic.chappuis@demo.driphaus.ch'),
  ('julien.rochat@demo.driphaus.ch','loic.chappuis@demo.driphaus.ch'),
  ('noe.girard@demo.driphaus.ch','loic.chappuis@demo.driphaus.ch'),
  ('sofia.moret@demo.driphaus.ch','camille.beguin@demo.driphaus.ch'),
  ('lea.progin@demo.driphaus.ch','camille.beguin@demo.driphaus.ch')
)
insert into public.follows (follower_user_id, followed_user_id)
select public.__demo_uid(a), public.__demo_uid(b) from uf
where not exists (
  select 1 from public.follows f
  where f.follower_user_id = public.__demo_uid(uf.a) and f.followed_user_id = public.__demo_uid(uf.b)
);

-- ---------- LIKES ----------
-- ~1 particulier sur 2 like chaque post démo (sélection pseudo-aléatoire stable)
insert into public.likes (user_id, post_id)
select u.id, p.id
from public.users u
cross join public.posts p
where u.email like '%@demo.driphaus.ch' and u.role <> 'boutique'
  and (('x' || substr(md5(u.id::text || p.id::text), 1, 4))::bit(16)::int % 2) = 0
on conflict (user_id, post_id) do nothing;

-- ---------- COMMENTS ----------
insert into public.comments (id, user_id, post_id, content, status, created_at) values
  (public.__demo_uid('cmt:1'), public.__demo_uid('sofia.moret@demo.driphaus.ch'),  public.__demo_uid('post:hir-robe'),    'Elle est magnifique cette robe 😍 elle taille comment ?', 'active', now() - interval '2 days'),
  (public.__demo_uid('cmt:2'), public.__demo_uid('marine.dubois@demo.driphaus.ch'),public.__demo_uid('post:hir-sac'),     'Toujours au top vos sélections !', 'active', now() - interval '5 days'),
  (public.__demo_uid('cmt:3'), public.__demo_uid('camille.beguin@demo.driphaus.ch'),public.__demo_uid('post:arg-manteau'),'Belle démarche l''upcycling, bravo 👏', 'active', now() - interval '20 hours'),
  (public.__demo_uid('cmt:4'), public.__demo_uid('thomas.aebischer@demo.driphaus.ch'),public.__demo_uid('post:flon-jean'),'Vous avez du 501 en W32 ?', 'active', now() - interval '3 days'),
  (public.__demo_uid('cmt:5'), public.__demo_uid('elodie.favre@demo.driphaus.ch'), public.__demo_uid('post:julien-snkr'), 'Intéressée si tu as la pointure au-dessus !', 'active', now() - interval '1 days'),
  (public.__demo_uid('cmt:6'), public.__demo_uid('julien.rochat@demo.driphaus.ch'),public.__demo_uid('post:loic-org'),   'Hâte de voir ça 🔥', 'active', now() - interval '18 hours')
on conflict (id) do update set content=excluded.content;

-- ---------- ENCHÈRE (1) ----------
-- Met le trench-coat Burberry (Atelier Rive Gauche) aux enchères
update public.articles set is_auction = true where id = public.__demo_uid('article:5970834');

insert into public.auctions (id, article_id, seller_boutique_id, starting_price, current_price, reserve_price, bid_increment, starts_at, ends_at, status)
values (
  public.__demo_uid('auction:5970834'), public.__demo_uid('article:5970834'),
  (select id from public.boutiques where handle='atelier-rive-gauche'),
  40.00, 52.00, 45.00, 2.00, now() - interval '2 days', now() + interval '3 days', 'active'
)
on conflict (article_id) do update set
  current_price=excluded.current_price, reserve_price=excluded.reserve_price,
  starts_at=excluded.starts_at, ends_at=excluded.ends_at, status=excluded.status;

insert into public.auction_bids (auction_id, bidder_user_id, amount) values
  (public.__demo_uid('auction:5970834'), public.__demo_uid('julien.rochat@demo.driphaus.ch'), 42.00),
  (public.__demo_uid('auction:5970834'), public.__demo_uid('noe.girard@demo.driphaus.ch'),    46.00),
  (public.__demo_uid('auction:5970834'), public.__demo_uid('marine.dubois@demo.driphaus.ch'), 50.00),
  (public.__demo_uid('auction:5970834'), public.__demo_uid('julien.rochat@demo.driphaus.ch'), 52.00)
on conflict (auction_id, amount) do nothing;

-- Post d'annonce de l'enchère
insert into public.posts (id, author_boutique_id, content, type, auction_id, article_id, status, created_at) values
  (public.__demo_uid('post:arg-auction'), (select id from public.boutiques where handle='atelier-rive-gauche'),
   'Enchère en cours 🔨 Trench-coat Burberry vintage, mise à prix 40 CHF. Les offres montent, à vous de jouer !',
   'auction', public.__demo_uid('auction:5970834'), public.__demo_uid('article:5970834'), 'published', now() - interval '2 days')
on conflict (id) do update set content=excluded.content, auction_id=excluded.auction_id;
