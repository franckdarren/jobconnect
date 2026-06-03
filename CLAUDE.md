# CLAUDE.md — JobConnect

Contexte principal pour Claude Code. À lire avant toute action.

---

## 0. En une phrase

**JobConnect** = PWA mobile-first de recrutement pour le Gabon, interactions via WhatsApp uniquement, principe UX « action importante en moins de 3 clics ». Cible : utilisateurs peu familiers avec les outils numériques complexes.

---

## 1. Règles absolues (NON négociables)

### Sécurité
- **Quotas vérifiés UNIQUEMENT côté serveur** (Server Actions). Jamais confiance au frontend.
- **RLS activé** sur toutes les tables Supabase.
- **Webhook PVIT idempotent** via `merchantReferenceId` (vérifier qu'il n'a pas déjà été traité).
- **Inputs validés avec Zod**, côté serveur ET client.
- **CVs privés** : bucket Supabase `cvs` avec RLS, accès auth uniquement.
- **Variables `SUPABASE_SERVICE_ROLE_KEY`, `PVIT_*`, `ADMIN_*` jamais exposées côté client** (pas de `NEXT_PUBLIC_`).
- **Admin** : protégé par middleware + vérification rôle en DB.

### UX
- Téléphone = identifiant visible. Email = invisible (auth Supabase uniquement).
- Tout contact passe par `https://wa.me/` avec message pré-rempli. Pas de messagerie interne.

### Code
- TypeScript strict. Pas de `any` non justifié.
- Server Actions : `requireAuth()` → `checkQuota()` → `schema.parse()` → action.
- Toute action retourne `ActionResult<T>` (voir §10).

---

## 2. Stack

| Couche | Techno |
|---|---|
| Framework | **Next.js 16** (App Router) — ⚠️ breaking changes vs N-1, lire `node_modules/next/dist/docs/` |
| React | **19.2** |
| Language | TypeScript strict |
| DB | PostgreSQL via Supabase |
| ORM | Drizzle ORM (`drizzle-orm`, `drizzle-kit`) |
| Auth | Supabase Auth (email confirmation) |
| Storage | Supabase Storage |
| Email | Supabase Email (MVP) → Resend (prod) |
| Paiement | PVIT (Airtel Money + Moov Money) |
| UI | Tailwind v4 + shadcn/ui + Radix |
| Forms | react-hook-form + zod (`@hookform/resolvers`) |
| HTTP | `ky` |
| PWA | next-pwa |
| Déploiement | Vercel |

---

## 3. Commandes disponibles

```bash
npm run dev      # next dev
npm run build    # next build
npm run start    # next start
npm run lint     # eslint
```

> ⚠️ Les scripts `db:generate`, `db:migrate`, `db:studio`, `db:seed`, `type-check` ne sont **pas encore définis** dans `package.json`. À ajouter au moment d'introduire Drizzle.

Commandes Drizzle à prévoir (à ajouter dans `package.json` quand le schéma sera prêt) :
```json
"db:generate": "drizzle-kit generate",
"db:migrate":  "drizzle-kit migrate",
"db:studio":   "drizzle-kit studio",
"db:seed":     "tsx src/lib/db/seed.ts",
"type-check":  "tsc --noEmit"
```

---

## 4. Architecture & conventions de placement

Plutôt qu'un arbre exhaustif, voici **où mettre quoi** :

| Dossier | Rôle |
|---|---|
| `src/app/(auth)/` | Pages login, register/{candidate,employer}, confirm. Layout sans nav. |
| `src/app/(candidate)/` | Pages candidat (home, jobs, dashboard, profile). Bottom nav. |
| `src/app/(employer)/` | Pages employeur (home, search, jobs, dashboard, profile). Bottom nav. |
| `src/app/(admin)/` | Pages admin. Layout admin. |
| `src/app/api/webhooks/pvit/route.ts` | Callback PVIT. |
| `src/features/<domaine>/` | Logique métier : `actions.ts` (Server Actions), `queries.ts`, `schemas.ts` (Zod), `types.ts`. Domaines : `auth`, `candidates`, `employers`, `jobs`, `subscriptions`, `payments`, `notifications`, `admin`. |
| `src/lib/supabase/` | `client.ts` (browser), `server.ts` (server), `admin.ts` (service role). |
| `src/lib/db/` | `index.ts` (Drizzle), `schema.ts` (toutes les tables), `migrations/`. |
| `src/lib/pvit/` | Client HTTP PVIT, types. |
| `src/lib/{whatsapp,quotas,email,utils}.ts` | Helpers transverses. |
| `src/services/payment/` | Interface `PaymentProvider`, impl `pvit.service.ts`, `mock.service.ts`. |
| `src/repositories/` | Accès DB par entité (user, candidate, employer, job, application, subscription, notification). |
| `src/components/ui/` | shadcn/ui (générés). |
| `src/components/shared/` | Composants custom JobConnect (BottomNav, HeroCard, JobCard, CandidateCard, WhatsAppButton, PremiumBadge, LockOverlay, modals…). |
| `src/hooks/` | `useUser`, `useQuotas`, `useSubscription`. |
| `src/types/` | Types globaux, types inférés Drizzle. |

**Conventions de nommage** :
- Composants : `PascalCase` (fichier inclus)
- Fonctions/variables : `camelCase`
- Tables DB & colonnes : `snake_case`
- Autres fichiers : `kebab-case`

---

## 5. Schéma de données

Source de vérité : `src/lib/db/schema.ts` (à créer).

**Entités principales** et leurs relations :

- `users` (extension de Supabase Auth) — `id`, `phone` UNIQUE, `email` UNIQUE, `role` (`candidate`|`employer`|`admin`), `is_active`.
- `candidate_profiles` (1-1 user) + `candidate_experiences` (N), `candidate_educations` (N), `candidate_skills` → `skills`.
- `employer_profiles` (1-1 user) — inclut `is_verified`.
- `job_offers` (N par employeur) + `job_offer_skills` (N), `job_offer_missions` (N). Status : `active`|`closed`|`expired`.
- `applications` (candidat → offre, UNIQUE par paire). Status : `pending`|`viewed`|`rejected`.
- `profile_views` (employeur regarde candidat), `whatsapp_contacts` (employeur contacte candidat).
- `subscriptions` (user, plan, status, expires_at, payment_id).
- `payments` (user, amount FCFA, provider `pvit`|`manual`, operator `airtel_money`|`moov_money`, status, `pvit_transaction_id`, `pvit_merchant_reference` UNIQUE).
- `notifications` (user, type, title, message, is_read, metadata).

Enums clés :
- `experience_level` : `beginner` | `1_3` | `3_5` | `5_plus`
- `availability` : `immediate` | `15_days` | `30_days`
- `job type` : `job` | `internship` | `freelance`
- `subscription plan` : `candidate_free` | `candidate_premium` | `employer_free` | `employer_pro`
- `notification type` : `profile_viewed` | `application_sent` | `subscription_expired` | `quota_reached` | `payment_success` | `payment_failed`

Toutes les tables : `id uuid PK`, `created_at`, `updated_at` (quand pertinent).

---

## 6. Authentification

**Inscription** : téléphone + email + mot de passe → `supabase.auth.signUp()` → mail confirmation → insertion dans `users` (trigger PG ou Server Action) → page confirm.

**Connexion** : téléphone + mot de passe → lookup email dans `users` par phone → `signInWithPassword(email, password)` → redirect par rôle.

Session : cookies httpOnly (Supabase SSR). Mot de passe hashé bcrypt par Supabase Auth.

---

## 7. Abonnements & quotas

| Plan | Prix | Limites |
|---|---|---|
| `candidate_free` | 0 | 10 offres visibles, 3 candidatures/mois |
| `candidate_premium` | 2 000 FCFA/mois | Illimité + badge + priorité |
| `employer_free` | 0 | 3 profils/jour, 1 contact WA/mois, 1 offre active |
| `employer_pro` | 15 000 FCFA/mois | Illimité + 5 offres + stats + badge vérifié |

API quotas (`src/lib/quotas.ts`) :
```ts
checkCandidateApplicationQuota(userId): Promise<boolean>
checkEmployerProfileViewQuota(userId): Promise<boolean>
checkEmployerWhatsappQuota(userId): Promise<boolean>
checkEmployerActiveJobsQuota(userId): Promise<boolean>
```

> Rappel §1 : ces vérifications **doivent** être appelées dans les Server Actions concernées avant toute action quotée.

---

## 8. Paiements PVIT

**Architecture en couche provider** pour permettre mock en dev :

```ts
interface PaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>
  checkStatus(transactionId: string): Promise<PaymentStatus>
  verifyKyc(phone: string, operator: string): Promise<KycResult>
}
// PvitPaymentProvider (prod) | MockPaymentProvider (dev/test)
```

**Flux** :
1. `POST /v2/{URL_CODE}/rest` → réponse `PENDING`.
2. Attendre webhook sur `/api/webhooks/pvit`.
3. Webhook : vérifier `merchantReferenceId` (idempotence — ne pas re-traiter).
4. Si `SUCCESS` → activer abonnement.
5. Pas de webhook après 3 min → Check Status API (fallback).
6. Répondre `{ transactionId, responseCode: 200 }`.

**Renouvellement clé** : expire toutes les **3600 s** → Vercel Cron pour renouvellement auto.

Variables : `PVIT_URL_CODE`, `PVIT_OPERATION_ACCOUNT_CODE`, `PVIT_API_PASSWORD`, `PVIT_CALLBACK_URL_CODE`.

---

## 9. WhatsApp (lib/whatsapp.ts)

```ts
export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
export function candidateContactMessage(jobTitle: string): string {
  return `Bonjour, je vous contacte concernant votre candidature sur JobConnect pour le poste de ${jobTitle}.`
}
export function employerContactMessage(candidateName: string): string {
  return `Bonjour ${candidateName}, j'ai consulté votre profil sur JobConnect et je souhaite vous contacter.`
}
```

Le contact employeur → candidat doit incrémenter le quota et créer une entrée `whatsapp_contacts`.

---

## 10. Conventions de code

### Server Actions
```ts
export async function applyToJob(jobId: string): Promise<ActionResult<Application>> {
  const user = await requireAuth()
  await checkCandidateApplicationQuota(user.id)
  const validated = applySchema.parse({ jobId })
  // ...
  return { success: true, data: application }
}
```

### Type retour
```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

---

## 11. Storage Supabase

| Bucket | Contenu | Accès | Limite | Format |
|---|---|---|---|---|
| `avatars` | Photos candidat | Public | 2 MB | jpg/png/webp |
| `company-logos` | Logos employeur | Public | 2 MB | jpg/png/webp |
| `cvs` | CV candidat | **Privé (RLS)** | 5 MB | PDF |
| `job-images` | Images offres | Public | 2 MB | jpg/png/webp |

---

## 12. Design system

**Couleurs** (à exposer en variables Tailwind v4) :
```css
--color-primary-dark: #0D1B2A;
--color-primary-green: #1E6B3C;
--color-accent-green:  #2E8B57;
--color-light-green:   #E8F5EE;
--color-background:    #F0F4F8;
--color-text-primary:  #0D1B2A;
--color-text-secondary:#6B7280;
--color-text-muted:    #9CA3AF;
--color-warning:       #EF4444;
--color-orange:        #D97706;
--color-whatsapp:      #25D366;
```

**Typo** : Inter (Google Fonts). H1 24/700 · H2 20/700 · H3 18/600 · Body 14/400 · Caption 12/400 · Badge 11/600.

**Composants signature** :
- `BottomNav` — 4 onglets (Home / Recherche / Dashboard / Profil).
- `HeroCard` — fond `#0D1B2A`, texte blanc, radius 16.
- `JobCard` — fond blanc, shadow douce, radius 12.
- `CandidateCard` — avec `LockOverlay` si non débloqué.
- `WhatsAppButton` — fond `#25D366`.
- `PremiumBadge` — fond `#0D1B2A`, icône ✦.
- `LockOverlay` — flou + cadenas + label « DÉBLOQUER AVEC PRO ».

---

## 13. PWA

Manifest (`src/app/manifest.json`) :
```json
{
  "name": "JobConnect",
  "short_name": "JobConnect",
  "description": "L'emploi direct au Gabon",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0D1B2A",
  "theme_color": "#0D1B2A",
  "orientation": "portrait"
}
```

`next-pwa` : NetworkFirst pour API, CacheFirst pour assets. Offline page minimale. Prompt d'installation Android/iOS.

---

## 14. Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server only

# PVIT (server only)
PVIT_URL_CODE=
PVIT_OPERATION_ACCOUNT_CODE=
PVIT_API_PASSWORD=
PVIT_CALLBACK_URL_CODE=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=JobConnect

# Admin seed (server only)
ADMIN_PHONE=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

---

## 15. Statut MVP

État réel du dépôt à la dernière mise à jour (commits `fdf5aca`, `641e8bc` : init Next + shadcn). Aucun code métier n'existe encore.

| # | Chantier | État |
|---|---|---|
| 1 | Auth (inscription / confirmation / connexion) | À faire |
| 2 | Profil candidat | À faire |
| 3 | Profil employeur | À faire |
| 4 | Offres d'emploi (publication / liste / détail) | À faire |
| 5 | Candidatures + quotas | À faire |
| 6 | Recherche candidats (employeur) | À faire |
| 7 | Contact WhatsApp + quotas | À faire |
| 8 | Paiement PVIT + abonnements | À faire |
| 9 | Notifications | À faire |
| 10 | Dashboard stats | À faire |
| 11 | Admin | À faire |
| 12 | PWA | À faire |

**Préalables avant de coder les features** :
1. Définir `src/lib/db/schema.ts` (Drizzle) + ajouter les scripts `db:*` à `package.json`.
2. Initialiser les clients Supabase (`src/lib/supabase/{client,server,admin}.ts`).
3. Créer `src/lib/quotas.ts` et `src/types/index.ts` (`ActionResult`).
4. Activer RLS sur Supabase pour chaque table créée.

---

*Dernière restructuration : 2026-06-03.*
