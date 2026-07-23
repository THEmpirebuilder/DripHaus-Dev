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
| Design tokens + primitives UI (`components/ui/`) | ✅ Button, Input, Textarea, Select, Label, Alert, Card, Avatar, SubmitButton |
| **Couche 1 — Auth & utilisateurs** | ✅ signup (rôle), login, logout, session, profil (édition + public `/u/[username]`) |
| **Couches 2 → 9 (boutiques, articles, social, enchères, paiements…)** | ⏳ **à construire** |

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
`transactions`, `disputes`, `reviews`, `notifications`. 17 enums Postgres.

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
