-- ============================================================
-- SEED 01 — Taxonomie catégories
-- Idempotent : upsert sur `slug` (clé unique). Rejouable sans doublon.
-- 5 familles de premier niveau + sous-catégories (2 niveaux).
-- Inspiré DeepFashion2 / Fashionpedia, adapté marketplace mode indépendante suisse.
-- ============================================================

-- 1) Familles de premier niveau (parent_id null)
insert into public.categories (name, slug, parent_id) values
  ('Vêtements',            'vetements',            null),
  ('Chaussures',           'chaussures',           null),
  ('Sacs & Maroquinerie',  'sacs-maroquinerie',    null),
  ('Accessoires',          'accessoires',          null),
  ('Bijoux & Montres',     'bijoux-montres',       null)
on conflict (slug) do update set name = excluded.name, parent_id = null;

-- 2) Sous-catégories (parent_id résolu par slug → idempotent)
insert into public.categories (name, slug, parent_id)
select v.name, v.slug, (select id from public.categories where slug = v.parent_slug)
from (values
  -- Vêtements
  ('T-shirts & Tops',        't-shirts-tops',        'vetements'),
  ('Chemises & Blouses',     'chemises-blouses',     'vetements'),
  ('Pulls & Gilets',         'pulls-gilets',         'vetements'),
  ('Sweats & Hoodies',       'sweats-hoodies',       'vetements'),
  ('Robes',                  'robes',                'vetements'),
  ('Jupes',                  'jupes',                'vetements'),
  ('Pantalons',              'pantalons',            'vetements'),
  ('Jeans',                  'jeans',                'vetements'),
  ('Shorts',                 'shorts',               'vetements'),
  ('Vestes & Manteaux',      'vestes-manteaux',      'vetements'),
  ('Costumes & Tailleurs',   'costumes-tailleurs',   'vetements'),
  ('Sportswear',             'sportswear',           'vetements'),
  -- Chaussures
  ('Baskets & Sneakers',     'baskets-sneakers',     'chaussures'),
  ('Bottes & Bottines',      'bottes-bottines',      'chaussures'),
  ('Escarpins & Talons',     'escarpins-talons',     'chaussures'),
  ('Mocassins & Derbies',    'mocassins-derbies',    'chaussures'),
  ('Sandales',               'sandales',             'chaussures'),
  ('Chaussures plates',      'chaussures-plates',    'chaussures'),
  -- Sacs & Maroquinerie
  ('Sacs à main',            'sacs-a-main',          'sacs-maroquinerie'),
  ('Sacs à dos',             'sacs-a-dos',           'sacs-maroquinerie'),
  ('Sacs bandoulière',       'sacs-bandouliere',     'sacs-maroquinerie'),
  ('Pochettes & Clutches',   'pochettes-clutches',   'sacs-maroquinerie'),
  ('Portefeuilles & Petite maroquinerie', 'portefeuilles', 'sacs-maroquinerie'),
  -- Accessoires
  ('Ceintures',              'ceintures',            'accessoires'),
  ('Écharpes & Foulards',    'echarpes-foulards',    'accessoires'),
  ('Chapeaux & Bonnets',     'chapeaux-bonnets',     'accessoires'),
  ('Lunettes de soleil',     'lunettes-soleil',      'accessoires'),
  ('Gants',                  'gants',                'accessoires'),
  -- Bijoux & Montres
  ('Colliers',               'colliers',             'bijoux-montres'),
  ('Bagues',                 'bagues',               'bijoux-montres'),
  ('Boucles d''oreilles',    'boucles-oreilles',     'bijoux-montres'),
  ('Bracelets',              'bracelets',            'bijoux-montres'),
  ('Montres',                'montres',              'bijoux-montres')
) as v(name, slug, parent_slug)
on conflict (slug) do update
  set name = excluded.name,
      parent_id = excluded.parent_id;
