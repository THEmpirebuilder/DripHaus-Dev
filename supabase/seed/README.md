# Seed — données & comptes de démonstration (WS0)

Données de démo pour juger le design sur du contenu réel (boutiques bots, articles,
activité sociale) et servir de socle aux tests bots.

## Principe : idempotent

Chaque fichier de seed est **rejouable sans danger** : on peut le lancer autant de
fois qu'on veut, l'état final est identique (pas de doublon, pas d'erreur). Mécanisme :
`insert ... on conflict (<clé stable>) do update` — la clé stable est le `slug`
(catégories), le `handle` (boutiques), l'`email`/`username` (users), etc.

## Fichiers (ordre d'exécution)

| # | Fichier / script | Contenu | Dépend de |
|---|---|---|---|
| 01 | `01_categories.sql` | Taxonomie (5 familles + 33 sous-catégories) | — |
| 02 | `02_users_boutiques.sql` | 13 comptes bots (auth + profils) + 3 boutiques | 01 |
| — | `scripts/pexels-fetch.mjs` | Télécharge les packshots Pexels → `demo-assets/packshots/` + `manifest.json` | clé Pexels |
| 03 | `03_articles.sql` *(généré)* | 53 articles ; `images` = URLs **Pexels** (temporaire) | 01, 02, manifeste |
| — | `scripts/storage-migrate.mjs` | Upload des packshots dans le bucket `media` + repointe `articles.images` sur le **Storage** | 03, service_role |
| 04 | `04_social.sql` | Posts, follows, likes, comments + 1 enchère (offres) | 02, 03 |

### Pipeline images (WS0 « seed direct + Storage »)
`pexels-fetch.mjs` (download) → `03_articles.sql` (articles avec URLs Pexels) →
`storage-migrate.mjs` (bascule les images dans notre Storage, plus de hotlink).
`03_articles.sql` est **régénéré** par `scripts/build-catalogue.mjs` depuis le manifeste.

> Clés dans `DripHaus-Dev/.env.local` (gitignoré) : `PEXELS_API_KEY`,
> `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Exécution

Deux voies équivalentes (le seed est du SQL pur) :

- **Via MCP Supabase** (ce qu'on utilise en session) : exécuter le contenu du fichier
  sur le projet `dhinegywctxmhepgempp`.
- **Via psql / SQL editor** : coller le fichier dans le SQL editor Supabase, ou
  `psql "$DATABASE_URL" -f supabase/seed/01_categories.sql`.

## Reset des données de démo

Pour repartir propre (⚠️ supprime les données de démo, pas le schéma) : voir
`99_reset.sql` (à créer avec le seed data) — il cible uniquement les entités bots
via un préfixe/marqueur (`is_demo` ou handles/usernames dédiés), jamais un `truncate`
aveugle des tables.
