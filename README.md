# DripHaus

> Écosystème numérique vertical dédié à la mode indépendante suisse.
> Repo de développement — Next.js 15 (App Router) · TypeScript · Tailwind v4 · Supabase · Stripe Connect.

---

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

### Variables d'environnement

| Variable | Source | Exposée au client |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | ❌ **jamais** |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys | ❌ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → endpoint | ❌ |
| `PLATFORM_FEE_BPS` | Commission plateforme en points de base (250 = 2.5 %) | ❌ |

---

## Architecture

```
app/
├── (auth)/          login, signup
├── (marketplace)/   catalogue global
├── (feed)/          fil social
├── (boutique)/      pages boutique publiques — /boutique/[handle]
├── (auction)/       enchères
└── (studio)/        Studio IA
components/
lib/
├── supabase/        client.ts (browser) · server.ts (RSC) · admin.ts (service_role) · middleware.ts
└── stripe/          client.ts · connect.ts
supabase/migrations/ schéma SQL versionné
types/database.ts    types générés depuis le schéma Supabase
```

### Les trois clients Supabase

| Fichier | Contexte | RLS |
|---|---|---|
| `lib/supabase/client.ts` | Composants client | ✅ appliquées |
| `lib/supabase/server.ts` | RSC, Server Actions, Route Handlers | ✅ appliquées |
| `lib/supabase/admin.ts` | Webhooks Stripe, tâches admin | ❌ **contournées** |

`admin.ts` est marqué `server-only`. Ne jamais l'importer depuis un composant client.

### Modèle d'authentification

`public.users.id` référence `auth.users(id)`. Le trigger `on_auth_user_created` provisionne
automatiquement `public.users` et `public.profiles` à l'inscription. Le rôle se transmet
dans les metadata du signup :

```ts
await supabase.auth.signUp({
  email, password,
  options: { data: { role: "createur", display_name: "…" } },
});
```

`public.users` n'est lisible que par son propriétaire (il contient l'email).
**L'identité publique passe par `public.profiles`** — `username`, `display_name`, `avatar_url`.
`users.username` reste la source de vérité et se propage automatiquement vers `profiles.username`.

### Règles RLS structurantes

- Contenu publié (`articles`, `posts`, `auctions`, `comments`) lisible par `anon` ; écriture réservée au vendeur ou aux membres de la boutique.
- `transactions` et `disputes` visibles des seules parties. **Aucune policy UPDATE côté client** : seul le webhook Stripe (`service_role`) fait évoluer `payment_status` / `payout_status`.
- Les helpers RLS vivent dans le schéma `private`, hors de l'API exposée par PostgREST.

---

## Base de données

Migrations appliquées sur le projet Supabase `dhinegywctxmhepgempp` (eu-central-2) :

| Migration | Contenu |
|---|---|
| `001_initial_schema` | 17 enums, 16 tables, contraintes CHECK, index, triggers `updated_at`, provisionnement auth |
| `002_row_level_security` | Helpers + activation RLS + 49 policies |
| `003_harden_helpers_and_policies` | Helpers déplacés dans le schéma `private`, resserrage des policies permissives |
| `004_denormalize_username_into_profiles` | `profiles.username` + triggers de synchronisation |

Régénérer les types après toute évolution du schéma :

```bash
npm run types:gen
```

---

## Contexte business

### 1. Vision & positionnement

**DripHaus** est un écosystème numérique vertical dédié à la mode indépendante suisse :
seconde main, vintage, créateurs, boutiques multimarques, upcycling, slow fashion.

La plateforme ne se limite pas à un catalogue ou une marketplace. C'est une infrastructure
complète qui donne à chaque acteur de la mode indépendante — boutique, créateur ou
particulier — les outils pour exister en ligne, vendre, créer du contenu et rejoindre
une communauté engagée.

> « La plateforme suisse des boutiques et vendeurs mode indépendants — visibilité SEO,
> communauté, commerce et outils IA réunis en un seul écosystème. »

### 2. Les trois profils utilisateurs

| Profil | Description |
|---|---|
| **Particulier revendeur** | Vendeur occasionnel ou régulier de pièces seconde main. Accès marketplace, feed, enchères. Commission sur ventes. |
| **Créateur** | Artiste, designer indépendant ou figure mode. Page boutique personnalisée, outils IA de contenu, feed, mise en avant communautaire. |
| **Boutique partenaire** | Commerce physique ou en ligne : vintage, dépôt-vente, slow fashion, multimarque indépendant. Page boutique complète avec identité visuelle, SEO avancé et site web autonome. |

> La distinction Créateur / Boutique partenaire reste à affiner — elle sera principalement
> définie par les tiers d'abonnement.

### 3. Les cinq modules

**🏪 Page Boutique / Profil** — Chaque utilisateur dispose d'une page affichant ses posts et
ses articles en vente. Pour les Créateurs et Boutiques partenaires, cette page devient un
site web à part entière : identité visuelle propre, histoire, produits, horaires, contact,
réservation de visite. **Double puissance SEO/GEO** : indexable par les moteurs de recherche
et les moteurs IA indépendamment de DripHaus, tout en bénéficiant de l'autorité SEO globale
de la plateforme.

**🛍️ Marketplace** — Page centrale agrégeant tous les articles en vente. Filtres prix,
catégorie, état, taille, localisation, type de vendeur. Paiement sécurisé, protection
acheteur, payout différé après livraison, KYC vendeur, tracking obligatoire, gestion des litiges.

**📱 Feed** — Page sociale réunissant l'activité de la communauté : photos et vidéos,
annonces de nouveaux articles, promotions, événements, posts des boutiques et créateurs.
Spécifiquement dédié à la mode, sans la dispersion d'Instagram ou TikTok.

**🔨 Auction** — Enchères anglaises / américaines sur articles sélectionnés. Chaque enchère
génère automatiquement un post dans le Feed → mécanique de rareté et d'engagement social.

**🎨 Studio IA** — Point de passage obligé avant toute publication. Caption writer,
SEO optimizer, product writer, smart edit, content planner, multilingue FR/DE/IT/EN,
assistant boutique avec mémorisation du ton de marque.

### 4. Modèle de revenus

| Source | Description | Statut |
|---|---|---|
| **Abonnement boutique partenaire** | Formule tout compris : hébergement page, SEO, outils IA, gestion, visibilité | Principal — à tarifer |
| **Commission sur ventes particuliers** | % prélevé sur chaque transaction C2C | Défini |
| **Abonnement IA créateurs / particuliers** | Accès au Studio IA en crédits ou plan Pro | À développer |
| **Apport d'affaire & marketing événementiel** | Partenariats, événements mode, placements | Second temps |

### 5. Différenciation

| Vs | Argument DripHaus |
|---|---|
| **Instagram / TikTok** | Communauté 100 % mode — l'audience est déjà qualifiée |
| **Vinted / Ricardo** | Pas seulement un catalogue : SEO boutique, identité visuelle, outils IA, enchères sociales |
| **Shopify / site indépendant** | Tout intégré + communauté + SEO DripHaus, sans gérer hébergement ni marketing |
| **Annuaires locaux** | Commerce réel, contenu vivant, feed, enchères — pas un listing statique |

**Flywheel** : plus de boutiques → plus de pages SEO → plus de trafic organique →
plus de valeur perçue → plus de partenaires → plus de contenu et d'offre → plus de trafic.

### 6. Pilier confiance

**Côté vendeurs** — vérification KYC des profils boutiques, système d'avis et de réputation,
profils enrichis avec historique, interdiction des paiements hors plateforme.

**Côté acheteurs** — paiement sécurisé avec fonds retenus jusqu'à confirmation de livraison,
tracking obligatoire, payout vendeur différé, gestion des litiges et remboursements intégrée,
limites de transaction renforcées pour les nouveaux vendeurs et les articles de valeur élevée.

### 7. Cadre légal & conformité

Points à sécuriser avant le lancement transactionnel :

- **Flux de paiement** — ne pas encaisser directement les fonds utilisateurs sans analyse juridique ; utiliser un prestataire marketplace régulé (Stripe Connect)
- **AML / KYC** — conformité anti-blanchiment, vérification d'identité vendeurs
- **FINMA** — obligations fintech selon le modèle de paiement retenu
- **TVA & facturation** — règles applicables selon les profils vendeurs et les cantons
- **Protection acheteur** — droit de rétractation, conditions de remboursement
- **Contrefaçon** — contrôle des articles, signalement, responsabilité plateforme
- **Règles d'enchères** — encadrement légal spécifique aux ventes aux enchères en Suisse
- **Conditions générales** — CGU, CGV, responsabilité vendeur vs plateforme

### 8. Périmètre géographique

MVP en Suisse romande, puis extension à toute la Suisse (DE, IT).
Langue FR en priorité → multilingue FR / DE / IT / EN via le Studio IA.

### 9. Roadmap MVP — lancement septembre 2026

| Période | Phase | Actions |
|---|---|---|
| **Juin 2026** | Cadrage | Nom ✅, positionnement ✅, maquettes, pitch B2B |
| **Juillet 2026** | Pilotes | Signer 15–30 boutiques pilotes, collecter contenus |
| **Août 2026** | Pré-lancement | Pages SEO live, waitlist, creators, teasing |
| **Septembre 2026** | Lancement public | Ouverture, campagne locale, feed actif, drops |

Périmètre MVP : pages boutiques SEO + Marketplace + Feed + Auction + Studio IA simple.
*(App mobile = phase suivante.)*

### 10. Points ouverts

- Tiers d'abonnement et grille tarifaire boutique partenaire
- Stratégie d'acquisition des premières boutiques pilotes
- Distinction créateur vs boutique partenaire (fonctionnelle et tarifaire)
- Objectifs financiers 12 mois (nombre de partenaires, CA)
- Modèle apport d'affaire & événementiel
- Profils et répartition des rôles fondateurs

---

*DripHaus — document interne confidentiel*
