# CLAUDE.md — Mémoire technique DripHaus

> Fichier lu automatiquement par Claude Code à chaque session.
> Il décrit l'état du projet, les conventions et le plan de construction.
> **À maintenir à jour** après chaque couche livrée.

---

## 1. Ce qu'est DripHaus

Écosystème de mode indépendante suisse (seconde main, vintage, créateurs, boutiques
multimarques). Cinq modules : Page Boutique/Profil, Marketplace, Feed social, Enchères,
Studio IA. Trois profils : particulier, créateur, boutique. Contexte business complet
dans `README.md`. MVP visé septembre 2026, Suisse romande d'abord.

Stack : **Next.js 15 (App Router) · TypeScript strict · Tailwind v4 · Supabase · Stripe Connect**.

---

## 2. État actuel (mis à jour à chaque étape)

| Brique | État |
|---|---|
| Base de données Supabase | ✅ Schéma complet, RLS, 4 migrations appliquées |
| Types TypeScript | ✅ `types/database.ts` généré depuis le schéma |
| Clients Supabase | ✅ browser / server / admin / middleware |
| Fonctions Stripe Connect | ✅ `lib/stripe/connect.ts` |
| Webhook Stripe | ✅ `app/api/webhooks/stripe/route.ts` déployé |
| Déploiement Vercel | ✅ production sur `drip-haus-dev.vercel.app` |
| Design tokens + primitives UI (`components/ui/`) | ✅ Button, Input, Textarea, Select, Label, Alert, Card, Avatar, Badge, Price, Rating, EmptyState, SubmitButton |
| **Couche 1 — Auth & utilisateurs** | ✅ signup (rôle), login, logout, session, profil (édition + public `/u/[username]`) |
| **Couche 2 — Boutiques & membres** | ✅ création, page publique, gestion membres |
| **Couche 3 — Catégories & articles** | ✅ CRUD, upload images (bucket `media`), fiche article |
| **Couche 4 — Social** | ✅ posts, feed, follows, likes, commentaires |
| **Couche 5 — Enchères** | ✅ création, offres, post auto au feed |
| **Couche 6 — Transactions & paiements** | ✅ checkout escrow (Stripe Elements), commandes, litiges |
| **Couche 7 — Avis & notifications** | ✅ avis post-transaction ; notifications (lecture/gestion) |
| **Couche 8 — Vues marketplace & feed** | ✅ filtres, tri, pagination |
| **Couche 9 — Studio IA** | ✅ Workstation hybride (rail A→L · canvas · dock) + registre de skills ; famille G (texte) câblée, autres familles = scaffold (Engine à venir) |
| **Refonte UI — charte graphique (WS2)** | ✅ tokens clair+sombre, fonts (Italiana/Italianno/Syne), logo officiel, échelle typo exacte, niveaux de maison, feed social, home/marketplace/fiche/vitrine, assets (favicon/OG) |

### Migrations Supabase — 001→010 **toutes appliquées** (projet `dhinegywctxmhepgempp`)
- `005_storage_media.sql` : bucket `media` + policies Storage.
- `006_notifications_triggers.sql` : triggers `new_follower`/`new_like`/`new_comment`/`new_bid`.
- `007_close_auctions_cron.sql` : clôture enchères échues + `winner_user_id` + notifs, via `pg_cron`.
- **`008_lock_sensitive_data.sql`** (2026-09-05, correctifs P0 audit) : masque `stripe_account_id`/`siret_ide`
  des boutiques aux rôles `anon`/`authenticated` (privilèges de colonne → lire ces champs impose le client
  **admin/service_role**) ; supprime la policy `tx_insert_buyer` (plus d'insert client dans `transactions` :
  création via `startCheckout` en service_role) ; restreint le bucket `media` (MIME images + 8 Mo).
  ⚠️ Corollaire code : ne jamais faire `select("*")` sur `boutiques` en client (colonnes masquées → erreur) —
  passer par `BOUTIQUE_PUBLIC_COLUMNS` / le type `BoutiquePublic` (`lib/queries/boutiques.ts`).
- **`010_taxonomy_and_gender.sql`** (2026-09-14, appliquée) : taxonomie macro/micro + facette genre.
  Enum `article_gender` (`femme·homme·fille·garcon·unisexe·bebe`) + colonne `articles.genre` (nullable, indexée) ;
  fonction récursive `category_descendants(uuid)` (arbre `categories` désormais **3 niveaux** Famille→Macro→Micro —
  filtrer une famille doit remonter les petits-enfants). `listArticles` utilise le RPC + accepte un filtre `genre`.
  Seed `01_categories.sql` réécrit (**250 nœuds** : 5 familles · 49 macros · 196 micros, idempotent, slugs
  réutilisables conservés) ; `03_articles.sql` remappe les 54 articles démo (micro précise + genre).

> **À faire (WB1, non fait)** : activer la protection mots de passe compromis (toggle dashboard Supabase
> Auth — seul WARN advisor restant) ; rate-limiting/anti-bot ; CSP ; RLS perf `(select auth.uid())`
> + nettoyage index (à replacer dans une migration ultérieure).

### Studio IA — socle stockage & données (migration `009`, **APPLIQUÉE 2026-09-14**)
`009_studio_schema` + `009_studio_storage` appliquées sur `dhinegywctxmhepgempp`, `types/database.ts`
régénéré, advisors sécurité **propres** (RLS active sur les 6 tables, aucune nouvelle alerte). Le Studio
produisait des assets **sans aucun foyer** en base → désormais : `studio_credit_ledger` (grand-livre
pondéré append-only), `studio_jobs` (queue app↔Engine), `studio_assets` (+ **contrat d'assets JSON**,
lineage), `mannequins` (identité verrouillée + versioning), `studio_presets` (décors/DA/thèmes), et
`article_embeddings` (**pgvector 768d** `extensions.vector`, index HNSW → matching famille L, le moat). RLS
calquée sur `transactions` (helper `private.owns_studio_row`) : l'app **enfile** un job (`status=queued`) et
**lit** ; l'**Engine** (service_role, à construire) exécute, écrit assets, débite crédits. **Buckets** privés
`studio-in`/`studio-draft` (purge cron 7j)/`studio-out` créés ; promotion vers `media` public à la
publication. Doc complet : `../cerveau/STUDIO_IA_STOCKAGE_DONNEES.md`.
⚠️ Le fichier `supabase/migrations/009_studio_schema.sql` garde son `begin/commit` (usage psql manuel) ;
l'apply MCP l'a joué sans ces lignes. Le volet Storage du fichier (commenté) a été appliqué séparément.

### Studio IA — page (workstation), 2026-09-14
Page réelle `app/(studio)/studio/page.tsx` = server mince : `requireUser()` → le **rôle** pilote le défaut
de persona (`particulier`=auto-pilote guidé, `createur`/`boutique`=atelier complet) + `getMatchingSuggestions()`
(vraies pièces en vente pour la famille L). Rend `StudioWorkstation` (client) — 3 zones :
- **Registre de skills** `lib/studio/skills.ts` (SOURCE DE VÉRITÉ A→L : type Agent/Skill/Asset, famille,
  poids crédits, provider/engine par défaut, statut live/planned). `studio_jobs.skill` référencera une `key`.
- **Rail** `studio-rail.tsx` (pipeline A→L taggé, auto-pilote en tête si guidé) · **Canvas** `studio-canvas.tsx`
  (aperçu + lignée de versions + matching réel) · **Dock** `studio-dock.tsx` (Assistant / Réglages qui
  surfacent le registre / Contrat JSON / **Texte = famille G LIVE** via `text-studio.tsx`).
- Assets de marque **officiels** utilisés (`Monogram`, `HouseDiamond`, tokens, classes `t-h*`/`u-label`) —
  aucun SVG réinventé. `skill-tag.tsx` = pastille Agent/Skill/Asset (or/accent/écru).
- **Honnêteté produit** : seule la famille G génère (déjà câblée) ; les autres = scaffold avec « Bientôt »
  et coût crédits affiché ; jauge crédits marquée « démo » (ledger lu plus tard, après WB4).
- typecheck + build OK (`/studio` 11.8 kB, dynamique). `lib/queries/studio.ts` : `getMatchingSuggestions`
  (le solde crédits `studio_credit_ledger` reste à câbler — noté TODO).
> **Reste studio** : Engine service_role (worker queue, étape 1 tout-API AI Gateway/Modal) ; seed
> presets/mannequins système ; lire le solde crédits réel ; brancher WB4 (grant_free/purchase) sur le ledger.

### Refonte UI (WS2) — charte graphique, appliquée 2026-09-14
Charte fournie par l'associé dans `../Dossier Marque DripHaus/` (hors repo). Appliquée **sans toucher
la logique** (tokens + primitives + composants de présentation, cf. §4).
- **Tokens** : `app/globals.css` — 12 rôles clair+sombre (valeurs charte), échelle de radius encodée
  (0 cartes/images · 2px champs/boutons · pilule badges), ombres froides, métaux (or/bronze/argent) + écru.
  Deux ors : `--gold #C9A24A` décoratif (gros éléments) vs token `--accent #8E6335` (texte/UI). Argent =
  authentification uniquement. Noir proscrit → encre `#14130F`.
- **Typo** : `next/font` (Italiana titres/wordmark, Italianno monogramme, Syne UI). Échelle exacte en
  classes `.t-h1/.t-h2/.t-h3/.t-h4/.t-price` (globals) — valeurs charte p.04.
- **Marque** : `components/brand/monogram.tsx` — `DiamondArt` (losange or dégradé + piqûre + **voile de
  mini-DH « damier »** reconstruit, clippé au losange, masqué < 40 px + **« STORE »**, prop `store` par
  défaut `true` ; DH lié Italianno). Exports : `Monogram` (carré), `LogoStacked` (vertical : monogramme +
  wordmark DRIPHAUS dessous, **utilisé dans le header**, ruban `h-24`), `Logo` (horizontal). Home hero =
  `Monogram size 132`. Wordmark header en encre (foreground) — arbitrage or/encre resté ouvert.
  `lib/utils/house-tier.ts` (niveaux de maison or/bronze/argent : `houseTier`, `TIER_LABEL`, `TIER_THEME`) +
  `components/brand/house-diamond.tsx`. Assets : `app/icon.svg`, `apple-icon.png`, `opengraph-image.png`,
  `public/brand/`.
- **Feed social** (`components/social/post-card.tsx`, `story-rail.tsx`, `feed-rail.tsx`) : média-first,
  héro shoppable, stories, rail à-suivre/tendances, temps relatif (`formatRelative`).
- **Motion** : `app/template.tsx` (fondu de navigation, respecte prefers-reduced-motion).

> **Suites (prochaines sessions)** :
> 1. ~~**Catégories macro/micro**~~ ✅ **FAIT (2026-09-14, migration 010)** — arbre 3 niveaux (250 nœuds),
>    facette genre, filtre récursif. Voir la section migration `010` ci-dessus.
> 2. **Nettoyer la base LIVE** (emojis des posts + logos DiceBear) : UPDATE idempotent déjà dans
>    `supabase/seed/02` & `04`, mais l'exécution directe a été bloquée par le garde-fou — rejouer via
>    l'éditeur SQL Supabase ou un re-seed.
> 3. **Composants 21st.dev** : connecteur `magic` à réauthentifier (clé API), puis adapter les composants
>    choisis à la charte (tokens + primitives) avant intégration.

### Câblé côté serveur
- **Webhook Stripe** (`app/api/webhooks/stripe/route.ts`) : `held`/`payout` + marque l'article `sold` à l'encaissement, et émet les notifs `sale`/`payout` (service_role). Reste à déclencher `releaseSellerPayout` après confirmation de livraison (résout alors le compte vendeur).

### Données de démo (WS0 — seedées 2026-09-11)
- Décor de démonstration seedé : **taxonomie 250 nœuds (5 familles · 49 macros · 196 micros), 13 comptes
  bots, 3 boutiques (Suisse romande), 54 articles (images dans le bucket Storage `media`, tous rattachés à
  une micro-catégorie + genre), activité sociale + 1 enchère**. Marqueur des
  comptes bots : email `@demo.driphaus.ch`. SQL idempotent versionné dans **`supabase/seed/`** (voir
  son `README.md` pour l'ordre + le pipeline images Pexels→Storage via `scripts/`). Rejouable sans
  doublon. Insertion **directe** (service_role) ; le pilotage complet de l'UI par les bots est prévu
  pour la phase « Tests bots » ultérieure.

### Variables d'environnement
- `NEXT_PUBLIC_SITE_URL` (liens de confirmation e-mail), `AI_GATEWAY_API_KEY` (Studio IA), en plus des clés Stripe/Supabase déjà attendues.
- Outils de seed (dans `.env.local`, gitignoré) : `PEXELS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

Projet Supabase : `dhinegywctxmhepgempp` (région eu-central-2).
Projet Vercel : `drip-haus-dev`, équipe `Yann's projects`.
Repo : `THEmpirebuilder/DripHaus-Dev` (branche `main` → déploiement auto Vercel).

---

## 3. Modèle de données — points non négociables

Le schéma vit dans `supabase/migrations/`. Toute évolution passe par une **nouvelle
migration numérotée** (jamais modifier une migration déjà appliquée), puis
`npm run types:gen` pour régénérer `types/database.ts`.

16 tables : `users`, `profiles`, `boutiques`, `boutique_members`, `categories`,
`articles`, `auctions`, `auction_bids`, `posts`, `follows`, `likes`, `comments`,
`transactions`, `disputes`, `reviews`, `notifications`. 18 enums Postgres
(dont `article_gender`). `articles.genre` = facette transverse aux 5 familles.

Règles structurantes à respecter dans tout le code :

- **Auth** : `public.users.id` = `auth.users.id`. À l'inscription, un trigger crée
  automatiquement `users` + `profiles`. Le rôle se passe dans les metadata du signup :
  `supabase.auth.signUp({ options: { data: { role, display_name } } })`.
- **Identité publique** : `users` n'est lisible que par son propriétaire (email privé).
  Toute donnée publique d'un vendeur (`username`, `display_name`, `avatar_url`) se lit
  depuis `profiles`. `users.username` est la **source de vérité**, propagé automatiquement
  vers `profiles.username` — n'écrire QUE dans `users.username`.
- **Vendeur = user OU boutique** : `articles`, `auctions`, `posts`, `transactions` ont
  une contrainte XOR (`seller_user_id` XOR `seller_boutique_id`). Toujours renseigner
  exactement l'un des deux.
- **Transactions & disputes** : aucune écriture client autorisée sur les statuts.
  Seul le webhook Stripe (client `admin`, service_role) fait évoluer `payment_status`
  et `payout_status`. Ne jamais tenter de les mettre à jour depuis un composant.
- **Argent** : montants en `numeric(12,2)`, devise `CHF` par défaut. Côté Stripe, tout
  se calcule en centimes (`lib/stripe/client.ts` → `toMinorUnits`, `platformFee`).

---

## 4. Principe d'architecture central : découplage design / logique

**Objectif : pouvoir refondre le design sans toucher à la logique métier, et
inversement.** Chaque changement doit rester ciblé. Pour cela, trois couches
strictement séparées.

### Couche 1 — Présentation (le "à quoi ça ressemble")

- `components/ui/` : composants visuels **purs et réutilisables** (Button, Card, Input,
  Badge, Avatar, Price…). Ils reçoivent des props, n'appellent **jamais** Supabase ni
  Stripe, ne connaissent pas la logique métier. Changer le design = travailler ici.
- `components/` (hors `ui/`) : composants d'assemblage propres à un domaine
  (ArticleCard, AuctionTimer, BoutiqueHeader…). Ils composent des `ui/` et reçoivent
  leurs données en props.
- Design centralisé : couleurs, espacements, typographie dans les **tokens Tailwind**
  (`app/globals.css` + variables CSS). Aucune couleur en dur dans les composants —
  toujours via les tokens. Refondre la charte = modifier les tokens, rien d'autre.

### Couche 2 — Données & logique métier (le "ce que ça fait")

- `lib/supabase/` : les 4 clients (voir §5). Aucun JSX ici.
- `lib/queries/` : **fonctions de lecture** typées, une par domaine
  (`articles.ts`, `boutiques.ts`, `auctions.ts`…). Elles encapsulent les `select`
  Supabase et renvoient des données typées. Les pages appellent ces fonctions, jamais
  Supabase directement.
- `lib/actions/` : **Server Actions** (mutations : créer un article, poser une enchère,
  suivre une boutique…). C'est le seul endroit qui écrit dans la base côté user.
- `lib/stripe/` : logique paiement (déjà en place).

### Couche 3 — Routage & pages (l'"assemblage")

- `app/**/page.tsx` : composants serveur minces. Ils appellent `lib/queries` pour
  charger, passent les données aux composants de `components/`, et déclenchent
  `lib/actions` pour les mutations. **Peu de logique ici** — juste de l'orchestration.

### Règle d'or

> Un composant de `components/ui/` ne doit jamais importer quoi que ce soit de
> `lib/supabase`, `lib/queries` ou `lib/actions`. Si tu as besoin de données dans un
> visuel, tu les passes en props. Cette discipline garantit qu'on peut refaire tout le
> design sans risque pour la logique, et réécrire la logique sans casser l'affichage.

---

## 5. Les 4 clients Supabase — lequel utiliser

| Fichier | Contexte d'usage | RLS |
|---|---|---|
| `lib/supabase/client.ts` | Composants `"use client"` | ✅ appliquées |
| `lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers | ✅ appliquées |
| `lib/supabase/admin.ts` | **Uniquement** webhooks Stripe / tâches admin | ❌ contournées |
| `lib/supabase/middleware.ts` | Refresh de session (middleware racine) | — |

`admin.ts` est marqué `server-only`. **Ne jamais l'importer depuis un composant client**
ni l'utiliser pour une opération déclenchée par un utilisateur.

---

## 6. Plan de construction — étape 5 (ordre des dépendances)

Construire dans cet ordre, chaque couche s'appuyant sur les précédentes. Après chaque
couche : `npm run typecheck`, test, commit, mettre à jour le §2 de ce fichier.

1. **Auth & utilisateurs** — signup (avec rôle), login, logout, session ; page profil
   basique lisant `profiles`.
2. **Boutiques & membres** — création boutique (→ owner dans `boutique_members`),
   page boutique publique `/boutique/[handle]`, gestion des membres.
3. **Catégories & articles** — CRUD article (respecter le XOR vendeur), upload images
   (Supabase Storage), fiche article.
4. **Social** — posts, feed, follows, likes, comments.
5. **Enchères** — création enchère (sur un article possédé), pose d'offre
   (`auction_bids`, règles RLS déjà en place), post auto dans le feed.
6. **Transactions & paiements** — checkout → `createEscrowPaymentIntent`, création de
   la ligne `transactions` (client, statut `pending`), le webhook fait le reste.
   Gestion des litiges (`disputes`).
7. **Avis & notifications** — `reviews` après transaction, `notifications`.
8. **Vues marketplace & feed** — filtres, tri, pagination (requêtes optimisées,
   les index sont déjà posés).
9. **Studio IA** — intégration API IA (caption, SEO, product writer…).

---

## 7. Workflow de développement

```bash
npm install          # après tout clone / changement de deps
npm run dev          # dev local sur http://localhost:3000
npm run typecheck    # tsc --noEmit — LANCER avant chaque commit
npm run types:gen    # régénérer types/database.ts après une migration
```

Déploiement : `git push` sur `main` → build + déploiement Vercel automatiques.
**Toujours** faire passer `npm run typecheck` avant de pousser.

Test des paiements en local : Stripe CLI (`stripe login`, puis
`stripe listen --forward-to localhost:3000/api/webhooks/stripe`).

---

## 8. Variables d'environnement

Définies dans Vercel (et `.env.local` en dev — jamais commité). Voir `.env.example`.
`NEXT_PUBLIC_*` = exposées au navigateur. Les autres restent serveur.
`SUPABASE_SERVICE_ROLE_KEY` contourne toute la sécurité : jamais dans le code, jamais
côté client, jamais sur GitHub.

---

## 9. Conventions de code

- TypeScript strict, pas de `any`. Importer les types depuis `types/database.ts`
  (`Tables<"articles">`, `TablesInsert<"articles">`, `Enums<"article_status">`).
- Imports via l'alias `@/` (ex. `@/lib/queries/articles`).
- Français pour l'UI et les commentaires métier.
- Un fichier = une responsabilité. Préférer plusieurs petits modules ciblés à un gros.
- Gérer explicitement les erreurs Supabase (`{ data, error }`) — ne jamais les ignorer.
