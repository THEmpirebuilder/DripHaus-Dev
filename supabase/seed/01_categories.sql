-- ============================================================
-- SEED 01 — Taxonomie catégories (macro / micro)
-- ------------------------------------------------------------
-- Arbre à 3 niveaux : Famille -> Macro-catégorie -> Micro-catégorie.
-- Idempotent : upsert sur `slug` (clé unique). Rejouable sans doublon.
-- Le GENRE (femme/homme/fille/garcon/unisexe/bebe) n'est PAS dans l'arbre :
-- c'est une facette de l'article (colonne `articles.genre`, migration 009).
-- Inspiré DeepFashion2 / Fashionpedia, adapté marketplace mode indép. suisse.
-- ============================================================

-- 0) Nettoyage des anciens slugs de niveau 2 remplacés par des macros mieux
--    nommées. Les articles qui pointaient dessus sont réaffectés dans le seed
--    03 (macro puis micro). `on delete set null` évite toute rupture de FK.
delete from public.categories
where slug in ('t-shirts-tops', 'pulls-gilets', 'vestes-manteaux', 'sportswear');

-- ------------------------------------------------------------
-- NIVEAU 1 — Familles (parent_id null)
-- ------------------------------------------------------------
insert into public.categories (name, slug, parent_id) values
  ('Vêtements',           'vetements',         null),
  ('Chaussures',          'chaussures',        null),
  ('Sacs & Maroquinerie', 'sacs-maroquinerie', null),
  ('Accessoires',         'accessoires',       null),
  ('Bijoux & Montres',    'bijoux-montres',    null)
on conflict (slug) do update set name = excluded.name, parent_id = null;

-- ------------------------------------------------------------
-- NIVEAU 2 — Macro-catégories (parent = famille, résolu par slug)
-- ------------------------------------------------------------
insert into public.categories (name, slug, parent_id)
select v.name, v.slug, (select id from public.categories where slug = v.parent_slug)
from (values
  -- Vêtements
  ('Hauts',                    'hauts',                     'vetements'),
  ('Chemises & blouses',       'chemises-blouses',          'vetements'),
  ('Pulls & maille',           'pulls-maille',              'vetements'),
  ('Sweats & hoodies',         'sweats-hoodies',            'vetements'),
  ('Robes',                    'robes',                     'vetements'),
  ('Combinaisons',             'combinaisons',              'vetements'),
  ('Jupes',                    'jupes',                     'vetements'),
  ('Pantalons',                'pantalons',                 'vetements'),
  ('Jeans',                    'jeans',                     'vetements'),
  ('Shorts & bermudas',        'shorts',                    'vetements'),
  ('Vestes',                   'vestes',                    'vetements'),
  ('Manteaux',                 'manteaux',                  'vetements'),
  ('Costumes & tailleurs',     'costumes-tailleurs',        'vetements'),
  ('Sport & performance',      'sport-performance',         'vetements'),
  ('Lingerie & sous-vêtements','lingerie-sous-vetements',   'vetements'),
  ('Nuit & homewear',          'nuit-homewear',             'vetements'),
  ('Maillots de bain',         'maillots-de-bain',          'vetements'),
  ('Ensembles & co-ords',      'ensembles-coords',          'vetements'),
  -- Chaussures
  ('Baskets & sneakers',       'baskets-sneakers',          'chaussures'),
  ('Bottes & bottines',        'bottes-bottines',           'chaussures'),
  ('Escarpins & talons',       'escarpins-talons',          'chaussures'),
  ('Mocassins & derbies',      'mocassins-derbies',         'chaussures'),
  ('Sandales & nu-pieds',      'sandales',                  'chaussures'),
  ('Ballerines & plates',      'chaussures-plates',         'chaussures'),
  ('Espadrilles',              'espadrilles',               'chaussures'),
  ('Chaussons & pantoufles',   'chaussons-pantoufles',      'chaussures'),
  -- Sacs & Maroquinerie
  ('Sacs à main',              'sacs-a-main',               'sacs-maroquinerie'),
  ('Sacs à dos',               'sacs-a-dos',                'sacs-maroquinerie'),
  ('Sacs bandoulière',         'sacs-bandouliere',          'sacs-maroquinerie'),
  ('Pochettes & clutches',     'pochettes-clutches',        'sacs-maroquinerie'),
  ('Sacs de voyage & sport',   'sacs-voyage-sport',         'sacs-maroquinerie'),
  ('Porte-documents & cartables','porte-documents-cartables','sacs-maroquinerie'),
  ('Portefeuilles & petite maroquinerie', 'portefeuilles',  'sacs-maroquinerie'),
  -- Accessoires
  ('Ceintures',                'ceintures',                 'accessoires'),
  ('Écharpes & foulards',      'echarpes-foulards',         'accessoires'),
  ('Chapeaux & bonnets',       'chapeaux-bonnets',          'accessoires'),
  ('Casquettes',               'casquettes',                'accessoires'),
  ('Lunettes de soleil',       'lunettes-soleil',           'accessoires'),
  ('Gants & moufles',          'gants',                     'accessoires'),
  ('Cravates & nœuds papillon','cravates-noeuds',           'accessoires'),
  ('Accessoires cheveux',      'accessoires-cheveux',       'accessoires'),
  ('Parapluies & divers',      'parapluies-divers',         'accessoires'),
  -- Bijoux & Montres
  ('Colliers',                 'colliers',                  'bijoux-montres'),
  ('Bagues',                   'bagues',                    'bijoux-montres'),
  ('Boucles d''oreilles',      'boucles-oreilles',          'bijoux-montres'),
  ('Bracelets',                'bracelets',                 'bijoux-montres'),
  ('Broches & pin''s',         'broches-pins',              'bijoux-montres'),
  ('Montres',                  'montres',                   'bijoux-montres'),
  ('Parures & ensembles',      'parures',                   'bijoux-montres')
) as v(name, slug, parent_slug)
on conflict (slug) do update
  set name = excluded.name, parent_id = excluded.parent_id;

-- ------------------------------------------------------------
-- NIVEAU 3 — Micro-catégories (parent = macro, résolu par slug)
-- ------------------------------------------------------------
insert into public.categories (name, slug, parent_id)
select v.name, v.slug, (select id from public.categories where slug = v.parent_slug)
from (values
  -- Vêtements > Hauts
  ('T-shirt',                    't-shirt',              'hauts'),
  ('T-shirt manches longues',    't-shirt-ml',           'hauts'),
  ('Débardeur & caraco',         'debardeur-caraco',     'hauts'),
  ('Marcel',                     'marcel',               'hauts'),
  ('Polo',                       'polo',                 'hauts'),
  ('Top habillé',                'top-habille',          'hauts'),
  ('Body',                       'body-haut',            'hauts'),
  ('Crop top',                   'crop-top',             'hauts'),
  ('Tunique',                    'tunique',              'hauts'),
  -- Vêtements > Chemises & blouses
  ('Chemise',                    'chemise',              'chemises-blouses'),
  ('Surchemise',                 'surchemise',           'chemises-blouses'),
  ('Chemise en jean',            'chemise-jean',         'chemises-blouses'),
  ('Blouse',                     'blouse',               'chemises-blouses'),
  ('Chemisier',                  'chemisier',            'chemises-blouses'),
  -- Vêtements > Pulls & maille
  ('Pull col rond',              'pull-col-rond',        'pulls-maille'),
  ('Pull col V',                 'pull-col-v',           'pulls-maille'),
  ('Pull col roulé',             'pull-col-roule',       'pulls-maille'),
  ('Cardigan & gilet',           'cardigan-gilet',       'pulls-maille'),
  ('Grosse maille / torsadé',    'pull-grosse-maille',   'pulls-maille'),
  ('Débardeur en maille',        'debardeur-maille',     'pulls-maille'),
  ('Poncho & cape en maille',    'poncho-cape-maille',   'pulls-maille'),
  -- Vêtements > Sweats & hoodies
  ('Hoodie (à capuche)',         'hoodie',               'sweats-hoodies'),
  ('Sweat col rond',             'sweat-col-rond',       'sweats-hoodies'),
  ('Sweat zippé',                'sweat-zippe',          'sweats-hoodies'),
  ('Sweat oversize',             'sweat-oversize',       'sweats-hoodies'),
  -- Vêtements > Robes
  ('Robe courte / mini',         'robe-courte',          'robes'),
  ('Robe midi',                  'robe-midi',            'robes'),
  ('Robe longue / maxi',         'robe-longue',          'robes'),
  ('Robe chemise',               'robe-chemise',         'robes'),
  ('Robe pull',                  'robe-pull',            'robes'),
  ('Robe de soirée & cocktail',  'robe-soiree',          'robes'),
  ('Robe de mariée',             'robe-mariee',          'robes'),
  -- Vêtements > Combinaisons
  ('Combinaison longue',         'combinaison-longue',   'combinaisons'),
  ('Combishort',                 'combishort',           'combinaisons'),
  ('Salopette',                  'salopette',            'combinaisons'),
  -- Vêtements > Jupes
  ('Mini-jupe',                  'mini-jupe',            'jupes'),
  ('Jupe midi',                  'jupe-midi',            'jupes'),
  ('Jupe longue / maxi',         'jupe-longue',          'jupes'),
  ('Jupe crayon',                'jupe-crayon',          'jupes'),
  ('Jupe plissée',               'jupe-plissee',         'jupes'),
  ('Jupe patineuse / évasée',    'jupe-patineuse',       'jupes'),
  ('Jupe portefeuille',          'jupe-portefeuille',    'jupes'),
  -- Vêtements > Pantalons
  ('Chino',                      'pantalon-chino',       'pantalons'),
  ('Pantalon de costume',        'pantalon-costume',     'pantalons'),
  ('Pantalon large / palazzo',   'pantalon-large',       'pantalons'),
  ('Pantalon droit',             'pantalon-droit',       'pantalons'),
  ('Pantalon slim / fuseau',     'pantalon-slim',        'pantalons'),
  ('Pantalon cargo',             'pantalon-cargo',       'pantalons'),
  ('Pantacourt / corsaire',      'pantacourt',           'pantalons'),
  ('Legging',                    'legging',              'pantalons'),
  -- Vêtements > Jeans
  ('Jean slim',                  'jean-slim',            'jeans'),
  ('Jean skinny',                'jean-skinny',          'jeans'),
  ('Jean droit / regular',       'jean-droit',           'jeans'),
  ('Jean bootcut',               'jean-bootcut',         'jeans'),
  ('Jean large / baggy',         'jean-large',           'jeans'),
  ('Jean mom',                   'jean-mom',             'jeans'),
  ('Jean flare / évasé',         'jean-flare',           'jeans'),
  ('Jean boyfriend',             'jean-boyfriend',       'jeans'),
  -- Vêtements > Shorts & bermudas
  ('Short en jean',              'short-jean',           'shorts'),
  ('Short chino',                'short-chino',          'shorts'),
  ('Bermuda',                    'bermuda',              'shorts'),
  ('Short habillé',              'short-habille',        'shorts'),
  -- Vêtements > Vestes
  ('Blazer / veste de costume',  'blazer',               'vestes'),
  ('Veste en jean',              'veste-jean',           'vestes'),
  ('Veste en cuir / perfecto',   'veste-cuir',           'vestes'),
  ('Bomber',                     'bomber',               'vestes'),
  ('Veste militaire / saharienne','veste-militaire',     'vestes'),
  ('Coupe-vent',                 'coupe-vent',           'vestes'),
  ('Veste de survêtement',       'track-jacket',         'vestes'),
  ('Gilet sans manches / bodywarmer','gilet-sans-manches','vestes'),
  -- Vêtements > Manteaux
  ('Trench',                     'trench',               'manteaux'),
  ('Caban',                      'caban',                'manteaux'),
  ('Parka',                      'parka',                'manteaux'),
  ('Doudoune',                   'doudoune',             'manteaux'),
  ('Manteau en laine / long',    'manteau-laine',        'manteaux'),
  ('Duffle-coat',                'duffle-coat',          'manteaux'),
  ('Imperméable / ciré',         'impermeable',          'manteaux'),
  ('Cape & poncho',              'cape-poncho',          'manteaux'),
  -- Vêtements > Costumes & tailleurs
  ('Costume (ensemble)',         'costume',              'costumes-tailleurs'),
  ('Tailleur (ensemble)',        'tailleur',             'costumes-tailleurs'),
  ('Gilet de costume',           'gilet-costume',        'costumes-tailleurs'),
  ('Smoking',                    'smoking',              'costumes-tailleurs'),
  -- Vêtements > Sport & performance
  ('Legging de sport',           'legging-sport',        'sport-performance'),
  ('Brassière de sport',         'brassiere-sport',      'sport-performance'),
  ('Haut technique',             'haut-technique',       'sport-performance'),
  ('Short de sport',             'short-sport',          'sport-performance'),
  ('Jogging / pantalon de survêt','jogging',             'sport-performance'),
  ('Veste & sweat de sport',     'veste-sweat-sport',    'sport-performance'),
  ('Ensemble de survêtement',    'ensemble-survetement', 'sport-performance'),
  ('Maillot / jersey',           'maillot-jersey',       'sport-performance'),
  -- Vêtements > Lingerie & sous-vêtements
  ('Soutien-gorge',              'soutien-gorge',        'lingerie-sous-vetements'),
  ('Culotte & slip',             'culotte-slip',         'lingerie-sous-vetements'),
  ('Boxer & caleçon',            'boxer-calecon',        'lingerie-sous-vetements'),
  ('String & tanga',             'string-tanga',         'lingerie-sous-vetements'),
  ('Body & bustier',             'body-bustier',         'lingerie-sous-vetements'),
  ('Ensemble de lingerie',       'ensemble-lingerie',    'lingerie-sous-vetements'),
  ('Maillot de corps',           'maillot-de-corps',     'lingerie-sous-vetements'),
  ('Collants & bas',             'collants-bas',         'lingerie-sous-vetements'),
  ('Chaussettes',                'chaussettes',          'lingerie-sous-vetements'),
  -- Vêtements > Nuit & homewear
  ('Pyjama',                     'pyjama',               'nuit-homewear'),
  ('Chemise de nuit & nuisette', 'chemise-de-nuit',      'nuit-homewear'),
  ('Peignoir & robe de chambre', 'peignoir',             'nuit-homewear'),
  ('Loungewear / homewear',      'loungewear',           'nuit-homewear'),
  -- Vêtements > Maillots de bain
  ('Maillot une pièce',          'maillot-une-piece',    'maillots-de-bain'),
  ('Bikini / deux pièces',       'bikini',               'maillots-de-bain'),
  ('Short & boxer de bain',      'short-de-bain',        'maillots-de-bain'),
  ('Paréo & tunique de plage',   'pareo',                'maillots-de-bain'),
  -- Vêtements > Ensembles & co-ords
  ('Ensemble deux pièces',       'ensemble-deux-pieces', 'ensembles-coords'),
  ('Ensemble jupe + haut',       'ensemble-jupe-haut',   'ensembles-coords'),
  ('Ensemble short + haut',      'ensemble-short-haut',  'ensembles-coords'),

  -- Chaussures > Baskets & sneakers
  ('Baskets basses',             'baskets-basses',       'baskets-sneakers'),
  ('Baskets montantes',          'baskets-montantes',    'baskets-sneakers'),
  ('Running / performance',      'baskets-running',      'baskets-sneakers'),
  ('Rétro / lifestyle',          'baskets-retro',        'baskets-sneakers'),
  ('Slip-on',                    'slip-on',              'baskets-sneakers'),
  -- Chaussures > Bottes & bottines
  ('Bottines Chelsea',           'bottines-chelsea',     'bottes-bottines'),
  ('Bottines à lacets',          'bottines-lacets',      'bottes-bottines'),
  ('Bottines à talon',           'bottines-talon',       'bottes-bottines'),
  ('Bottes cavalières',          'bottes-cavalieres',    'bottes-bottines'),
  ('Bottes hautes / cuissardes', 'bottes-hautes',        'bottes-bottines'),
  ('Bottes de pluie',            'bottes-pluie',         'bottes-bottines'),
  -- Chaussures > Escarpins & talons
  ('Escarpins',                  'escarpins',            'escarpins-talons'),
  ('Sandales à talon',           'sandales-talon',       'escarpins-talons'),
  ('Mules à talon',              'mules-talon',          'escarpins-talons'),
  ('Compensées',                 'compensees',           'escarpins-talons'),
  -- Chaussures > Mocassins & derbies
  ('Mocassins / loafers',        'mocassins-loafers',    'mocassins-derbies'),
  ('Derbies',                    'derbies',              'mocassins-derbies'),
  ('Richelieus',                 'richelieus',           'mocassins-derbies'),
  ('Chaussures bateau',          'chaussures-bateau',    'mocassins-derbies'),
  -- Chaussures > Sandales & nu-pieds
  ('Sandales plates',            'sandales-plates',      'sandales'),
  ('Nu-pieds',                   'nu-pieds',             'sandales'),
  ('Tongs',                      'tongs',                'sandales'),
  ('Claquettes',                 'claquettes',           'sandales'),
  ('Spartiates',                 'spartiates',           'sandales'),
  -- Chaussures > Ballerines & plates
  ('Ballerines',                 'ballerines',           'chaussures-plates'),
  ('Babies',                     'babies',               'chaussures-plates'),
  ('Mules plates',               'mules-plates',         'chaussures-plates'),

  -- Sacs > Sacs à main
  ('Cabas / tote',               'cabas-tote',           'sacs-a-main'),
  ('Sac seau',                   'sac-seau',             'sacs-a-main'),
  ('Sac baguette',               'sac-baguette',         'sacs-a-main'),
  ('Sac structuré',              'sac-structure',        'sacs-a-main'),
  ('Sac hobo',                   'sac-hobo',             'sacs-a-main'),
  ('Sac à rabat',                'sac-a-rabat',          'sacs-a-main'),
  -- Sacs > Sacs bandoulière
  ('Sac bandoulière',            'sac-bandouliere',      'sacs-bandouliere'),
  ('Banane / sac ceinture',      'banane',               'sacs-bandouliere'),
  -- Sacs > Pochettes & clutches
  ('Pochette',                   'pochette',             'pochettes-clutches'),
  ('Clutch de soirée',           'clutch-soiree',        'pochettes-clutches'),
  -- Sacs > Sacs de voyage & sport
  ('Sac de voyage / week-end',   'sac-voyage',           'sacs-voyage-sport'),
  ('Valise',                     'valise',               'sacs-voyage-sport'),
  ('Sac de sport',               'sac-sport',            'sacs-voyage-sport'),
  -- Sacs > Porte-documents & cartables
  ('Porte-documents',            'porte-documents',      'porte-documents-cartables'),
  ('Cartable',                   'cartable',             'porte-documents-cartables'),
  ('Sacoche ordinateur',         'sacoche-ordinateur',   'porte-documents-cartables'),
  -- Sacs > Portefeuilles & petite maroquinerie
  ('Portefeuille',               'portefeuille',         'portefeuilles'),
  ('Porte-cartes',               'porte-cartes',         'portefeuilles'),
  ('Porte-monnaie',              'porte-monnaie',        'portefeuilles'),
  ('Porte-clés',                 'porte-cles',           'portefeuilles'),
  ('Trousse',                    'trousse',              'portefeuilles'),

  -- Accessoires > Ceintures
  ('Ceinture en cuir',           'ceinture-cuir',        'ceintures'),
  ('Ceinture tissu / tressée',   'ceinture-tissu',       'ceintures'),
  ('Chaîne de taille',           'chaine-de-taille',     'ceintures'),
  -- Accessoires > Écharpes & foulards
  ('Écharpe',                    'echarpe',              'echarpes-foulards'),
  ('Foulard / carré',            'foulard-carre',        'echarpes-foulards'),
  ('Étole',                      'etole',                'echarpes-foulards'),
  ('Châle',                      'chale',                'echarpes-foulards'),
  -- Accessoires > Chapeaux & bonnets
  ('Bonnet',                     'bonnet',               'chapeaux-bonnets'),
  ('Chapeau',                    'chapeau',              'chapeaux-bonnets'),
  ('Capeline',                   'capeline',             'chapeaux-bonnets'),
  ('Béret',                      'beret',                'chapeaux-bonnets'),
  ('Bob',                        'bob',                  'chapeaux-bonnets'),
  -- Accessoires > Cravates & nœuds papillon
  ('Cravate',                    'cravate',              'cravates-noeuds'),
  ('Nœud papillon',              'noeud-papillon',       'cravates-noeuds'),
  ('Pochette de costume',        'pochette-costume',     'cravates-noeuds'),
  -- Accessoires > Accessoires cheveux
  ('Barrette',                   'barrette',             'accessoires-cheveux'),
  ('Chouchou',                   'chouchou',             'accessoires-cheveux'),
  ('Serre-tête',                 'serre-tete',           'accessoires-cheveux'),
  ('Foulard cheveux',            'foulard-cheveux',      'accessoires-cheveux'),

  -- Bijoux & Montres > Colliers
  ('Collier',                    'collier',              'colliers'),
  ('Chaîne',                     'chaine',               'colliers'),
  ('Pendentif',                  'pendentif',            'colliers'),
  ('Sautoir',                    'sautoir',              'colliers'),
  ('Ras-de-cou / choker',        'choker',               'colliers'),
  -- Bijoux & Montres > Bagues
  ('Bague',                      'bague',                'bagues'),
  ('Alliance',                   'alliance',             'bagues'),
  ('Chevalière',                 'chevaliere',           'bagues'),
  -- Bijoux & Montres > Boucles d'oreilles
  ('Puces',                      'puces',                'boucles-oreilles'),
  ('Créoles',                    'creoles',              'boucles-oreilles'),
  ('Pendantes',                  'boucles-pendantes',    'boucles-oreilles'),
  ('Ear cuffs',                  'ear-cuffs',            'boucles-oreilles'),
  -- Bijoux & Montres > Bracelets
  ('Bracelet',                   'bracelet',             'bracelets'),
  ('Jonc',                       'jonc',                 'bracelets'),
  ('Gourmette',                  'gourmette',            'bracelets'),
  ('Bracelet de cheville',       'bracelet-cheville',    'bracelets'),
  -- Bijoux & Montres > Montres
  ('Montre analogique',          'montre-analogique',    'montres'),
  ('Montre connectée',           'montre-connectee',     'montres'),
  ('Montre à gousset',           'montre-gousset',       'montres')
) as v(name, slug, parent_slug)
on conflict (slug) do update
  set name = excluded.name, parent_id = excluded.parent_id;
