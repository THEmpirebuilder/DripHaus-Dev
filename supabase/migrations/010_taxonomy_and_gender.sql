-- ============================================================
-- MIGRATION 010 — Taxonomie macro/micro + facette genre
-- (009 est réservée à `009_studio_schema.sql`, non appliquée — ne pas réutiliser)
-- ------------------------------------------------------------
-- 1) Facette `genre` sur les articles (femme/homme/fille/garcon/unisexe/bebe).
--    Le genre se croise avec N'IMPORTE QUELLE famille de catégories : ce n'est
--    donc PAS une branche de l'arbre mais un attribut de l'article.
-- 2) Fonction `category_descendants(uuid)` : renvoie un nœud + tous ses
--    descendants (récursif). Nécessaire depuis que l'arbre `categories` passe
--    à 3 niveaux (Famille -> Macro -> Micro) : filtrer sur une famille doit
--    remonter les articles rangés dans les micro-catégories (petits-enfants).
-- Migration additive et idempotente (safe à rejouer).
-- ============================================================

-- 1) Enum + colonne genre --------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'article_gender') then
    create type public.article_gender as enum
      ('femme', 'homme', 'fille', 'garcon', 'unisexe', 'bebe');
  end if;
end $$;

alter table public.articles
  add column if not exists genre public.article_gender;

create index if not exists idx_articles_genre on public.articles (genre);

-- 2) Descendants récursifs d'une catégorie --------------------------------
-- Renvoie le nœud `root` PUIS tous ses descendants (macros + micros).
-- `stable` : dépend uniquement du contenu de la table, pas d'effets de bord.
create or replace function public.category_descendants(root uuid)
returns setof uuid
language sql
stable
as $$
  with recursive tree as (
    select id from public.categories where id = root
    union all
    select c.id
    from public.categories c
    join tree t on c.parent_id = t.id
  )
  select id from tree;
$$;

-- Lecture publique (le catalogue est public). RLS ne s'applique pas aux
-- fonctions ; on autorise explicitement anon + authenticated à l'exécuter.
grant execute on function public.category_descendants(uuid) to anon, authenticated;
