# Seed — données & comptes de démonstration (WS0)

Données de démo pour juger le design sur du contenu réel (boutiques bots, articles,
activité sociale) et servir de socle aux tests bots.

## Principe : idempotent

Chaque fichier de seed est **rejouable sans danger** : on peut le lancer autant de
fois qu'on veut, l'état final est identique (pas de doublon, pas d'erreur). Mécanisme :
`insert ... on conflict (<clé stable>) do update` — la clé stable est le `slug`
(catégories), le `handle` (boutiques), l'`email`/`username` (users), etc.

## Fichiers (ordre d'exécution)

| # | Fichier | Contenu | Dépend de |
|---|---|---|---|
| 01 | `01_categories.sql` | Taxonomie (5 familles + sous-catégories) | — |
| 02 | `02_users_boutiques.sql` | Comptes bots (auth + profils) + boutiques bots | 01 |
| 03 | `03_articles.sql` | Articles + galerie images (Storage) | 01, 02, packshots |
| 04 | `04_social.sql` | Posts, follows, likes, comments + 1 enchère | 02, 03 |

> `03_articles.sql` dépend des **packshots** (photos libres de droits) importés dans
> le bucket Storage `media`. Voir la note photos dans le journal Voie A.

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
