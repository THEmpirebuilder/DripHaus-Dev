-- =====================================================================
-- DripHaus — 008 : verrouillage des données sensibles (correctifs P0 audit)
-- 1) Masquer stripe_account_id / siret_ide des boutiques aux rôles publics
-- 2) Interdire toute insertion client dans transactions (montant arbitraire)
-- 3) Restreindre le bucket media (types MIME image + taille max)
-- Idempotent, transactionnel.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) Fuite de colonnes boutiques publiques
--    RLS filtre les LIGNES ; les privilèges de colonne filtrent les COLONNES.
--    `stripe_account_id` et `siret_ide` ne sont lus que par le webhook Stripe
--    et le checkout, qui passent en service_role (bypass des privilèges).
--    Tous les autres champs restent lisibles (vitrine publique).
-- ---------------------------------------------------------------------
revoke select on public.boutiques from anon, authenticated;

grant select (
  id, handle, name, description, logo_url, cover_url, address, phone,
  email_contact, website_url, social_links, business_hours, kyc_verified,
  subscription_tier, status, created_at, updated_at
) on public.boutiques to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Insertion transactions trop permissive
--    `tx_insert_buyer` autorisait un amount/seller/article arbitraires depuis
--    le client. On supprime toute écriture client : la création passe
--    désormais par le server action `startCheckout` en service_role, avec un
--    montant dérivé côté serveur du prix de l'article.
-- ---------------------------------------------------------------------
drop policy if exists tx_insert_buyer on public.transactions;

-- ---------------------------------------------------------------------
-- 3) Uploads non validés (bucket public `media`)
--    Restreint aux images courantes, 8 Mo max. Double défense avec la
--    validation applicative dans lib/storage/media.ts.
-- ---------------------------------------------------------------------
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
       file_size_limit    = 8388608 -- 8 Mo
 where id = 'media';

commit;
