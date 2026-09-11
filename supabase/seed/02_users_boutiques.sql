-- ============================================================
-- SEED 02 — Comptes bots (auth + profils) + boutiques bots
-- Idempotent. Rejouable sans doublon.
--
-- Marqueur des comptes de démo : email en @demo.driphaus.ch
-- Mot de passe démo commun (comptes jetables) : DripHausDemo2026!
-- Avatars/logos : placeholders DiceBear (URLs, remplaçables au branding).
--
-- Mécanisme :
--   * on insère dans auth.users → le trigger handle_new_user() provisionne
--     automatiquement public.users + public.profiles.
--   * id déterministe = __demo_uid(email) → stable entre deux exécutions.
--   * conflits gérés par on conflict do nothing / do update.
-- ============================================================

-- Helper : UUID déterministe depuis un texte (stable → idempotent)
create or replace function public.__demo_uid(p text) returns uuid language sql immutable as $$
  select (substr(md5(p),1,8)||'-'||substr(md5(p),9,4)||'-'||substr(md5(p),13,4)||'-'||substr(md5(p),17,4)||'-'||substr(md5(p),21,12))::uuid
$$;

-- ---------- COMPTES BOTS ----------
create temp table _defs (
  email text, username text, role text, display_name text, bio text, location text, avatar text
) on commit drop;

insert into _defs (email, username, role, display_name, bio, location, avatar) values
 ('owner.rivegauche@demo.driphaus.ch','atelier_rive_gauche','boutique','Atelier Rive Gauche','Atelier de mode responsable à Genève — pièces upcyclées en séries limitées.','Genève','https://api.dicebear.com/9.x/initials/png?seed=Atelier%20Rive%20Gauche'),
 ('owner.duflon@demo.driphaus.ch','friperie_du_flon','boutique','Friperie du Flon','Friperie vintage sélective au cœur de Lausanne.','Lausanne','https://api.dicebear.com/9.x/initials/png?seed=Friperie%20du%20Flon'),
 ('owner.hirondelle@demo.driphaus.ch','maison_hirondelle','boutique','Maison Hirondelle','Maison de créateurs sur la Riviera vaudoise.','Vevey','https://api.dicebear.com/9.x/initials/png?seed=Maison%20Hirondelle'),
 ('camille.beguin@demo.driphaus.ch','camille_beguin','particulier','Camille Béguin','Dressing perso trié avec soin — pièces portées avec amour, prêtes pour une seconde vie.','Lausanne','https://api.dicebear.com/9.x/notionists/png?seed=camille_beguin'),
 ('julien.rochat@demo.driphaus.ch','julien_rochat','particulier','Julien Rochat','Streetwear et sneakers en bon état. Envois rapides depuis Genève.','Genève','https://api.dicebear.com/9.x/notionists/png?seed=julien_rochat'),
 ('lea.progin@demo.driphaus.ch','lea_progin','particulier','Léa Progin','Fan de mode responsable. Je donne une seconde vie à mes vêtements de qualité.','Fribourg','https://api.dicebear.com/9.x/notionists/png?seed=lea_progin'),
 ('thomas.aebischer@demo.driphaus.ch','thomas_aebischer','particulier','Thomas Aebischer','Vintage, workwear et bonnes affaires. Tout est détaillé et authentifié.','Neuchâtel','https://api.dicebear.com/9.x/notionists/png?seed=thomas_aebischer'),
 ('noe.girard@demo.driphaus.ch','noe_girard','particulier','Noé Girard','Sneakerhead valaisan. Paires rares et éditions limitées.','Sion','https://api.dicebear.com/9.x/notionists/png?seed=noe_girard'),
 ('elodie.favre@demo.driphaus.ch','elodie_favre','particulier','Élodie Favre','Garde-robe minimaliste — je vends ce que je ne porte plus. Qualité avant tout.','Nyon','https://api.dicebear.com/9.x/notionists/png?seed=elodie_favre'),
 ('marine.dubois@demo.driphaus.ch','marine_dubois','particulier','Marine Dubois','Pièces créateurs et seconde main premium. Sélection pointue.','Morges','https://api.dicebear.com/9.x/notionists/png?seed=marine_dubois'),
 ('sofia.moret@demo.driphaus.ch','sofia_moret','particulier','Sofia Moret','Mode féminine, robes et accessoires. Coups de cœur garantis.','Fribourg','https://api.dicebear.com/9.x/notionists/png?seed=sofia_moret'),
 ('yasmine.haddad@demo.driphaus.ch','yasmine_haddad','createur','Yasmine Haddad','Créatrice de bijoux à Genève — pièces faites main, séries limitées.','Genève','https://api.dicebear.com/9.x/notionists/png?seed=yasmine_haddad'),
 ('loic.chappuis@demo.driphaus.ch','loic_chappuis','createur','Loïc Chappuis','Créateur streetwear lausannois. Drops maison, coupes oversize.','Lausanne','https://api.dicebear.com/9.x/notionists/png?seed=loic_chappuis');

-- 1) Comptes auth (déclenche handle_new_user → public.users + profiles)
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  public.__demo_uid(d.email), '00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated', d.email,
  crypt('DripHausDemo2026!', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('role', d.role, 'display_name', d.display_name),
  now(), now()
from _defs d
on conflict (id) do nothing;

-- 2) Compléter public.users (username, rôle, statut, kyc)
update public.users u
set username = d.username, role = d.role::public.user_role,
    status = 'active', kyc_verified = true
from _defs d where u.id = public.__demo_uid(d.email);

-- 3) Compléter profiles (avatar, bio, localisation)
update public.profiles p
set display_name = d.display_name, avatar_url = d.avatar, bio = d.bio, location = d.location
from _defs d where p.user_id = public.__demo_uid(d.email);

-- ---------- BOUTIQUES BOTS ----------
create temp table _bdefs (
  handle text, name text, owner_email text, description text, tier text,
  logo text, phone text, email_contact text, website text,
  city text, street text, zip text, ide text, hours jsonb
) on commit drop;

insert into _bdefs values
 ('atelier-rive-gauche','Atelier Rive Gauche','owner.rivegauche@demo.driphaus.ch',
  'Atelier de mode responsable à Genève. Pièces upcyclées et créations en séries limitées, confectionnées à la main dans notre atelier des Eaux-Vives.',
  'pro','https://api.dicebear.com/9.x/initials/png?seed=Atelier%20Rive%20Gauche',
  '+41 22 340 12 08','contact@atelier-rive-gauche.demo','https://atelier-rive-gauche.demo',
  'Genève','Rue des Eaux-Vives 24','1207','CHE-142.318.207',
  '{"lun":"11:00-18:30","mar":"11:00-18:30","mer":"11:00-18:30","jeu":"11:00-19:00","ven":"11:00-19:00","sam":"10:00-17:00","dim":"fermé"}'::jsonb),
 ('friperie-du-flon','Friperie du Flon','owner.duflon@demo.driphaus.ch',
  'Friperie vintage sélective au cœur du Flon à Lausanne. Sélection pointue de pièces des années 70 à 2000, chinées et contrôlées une à une.',
  'free','https://api.dicebear.com/9.x/initials/png?seed=Friperie%20du%20Flon',
  '+41 21 311 44 90','hello@friperie-du-flon.demo','https://friperie-du-flon.demo',
  'Lausanne','Voie du Chariot 3','1003','CHE-209.417.556',
  '{"lun":"fermé","mar":"12:00-19:00","mer":"12:00-19:00","jeu":"12:00-19:00","ven":"12:00-19:00","sam":"11:00-18:00","dim":"fermé"}'::jsonb),
 ('maison-hirondelle','Maison Hirondelle','owner.hirondelle@demo.driphaus.ch',
  'Maison de créateurs sur la Riviera vaudoise. Vêtements féminins et accessoires d''artisans suisses et européens, dans un esprit slow fashion.',
  'premium','https://api.dicebear.com/9.x/initials/png?seed=Maison%20Hirondelle',
  '+41 21 921 63 40','bonjour@maison-hirondelle.demo','https://maison-hirondelle.demo',
  'Vevey','Rue du Lac 41','1800','CHE-318.552.104',
  '{"lun":"10:00-18:30","mar":"10:00-18:30","mer":"10:00-18:30","jeu":"10:00-18:30","ven":"10:00-19:00","sam":"09:30-17:00","dim":"fermé"}'::jsonb);

insert into public.boutiques (
  handle, name, description, logo_url, phone, email_contact, website_url,
  address, business_hours, siret_ide, subscription_tier, status, kyc_verified
)
select
  b.handle, b.name, b.description, b.logo, b.phone, b.email_contact, b.website,
  jsonb_build_object('street',b.street,'city',b.city,'zip',b.zip,'country','CH'),
  b.hours, b.ide, b.tier::public.subscription_tier, 'active', true
from _bdefs b
on conflict (handle) do update set
  name = excluded.name, description = excluded.description, logo_url = excluded.logo_url,
  phone = excluded.phone, email_contact = excluded.email_contact, website_url = excluded.website_url,
  address = excluded.address, business_hours = excluded.business_hours, siret_ide = excluded.siret_ide,
  subscription_tier = excluded.subscription_tier, status = excluded.status, kyc_verified = excluded.kyc_verified;

-- Rattacher les propriétaires (owner)
insert into public.boutique_members (user_id, boutique_id, role)
select public.__demo_uid(b.owner_email), bo.id, 'owner'
from _bdefs b join public.boutiques bo on bo.handle = b.handle
on conflict (user_id, boutique_id) do nothing;
