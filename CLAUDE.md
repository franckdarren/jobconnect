# CLAUDE.md — JobConnect

> Ce fichier est le contexte principal pour Claude Code.
> Lis-le intégralement avant toute action sur ce projet.

---

## 1. Présentation du projet

**JobConnect** est une plateforme de recrutement PWA mobile-first pour le marché gabonais.

- Les chercheurs d'emploi trouvent rapidement un travail
- Les employeurs recrutent rapidement
- Toutes les interactions se font via WhatsApp (aucune messagerie interne)
- Cible : marché gabonais, utilisateurs peu familiers avec les outils numériques complexes
- Principe UX : chaque action importante en moins de 3 clics

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript strict (`"strict": true`) |
| Base de données | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Auth | Supabase Auth (email confirmation) |
| Storage | Supabase Storage |
| Email | Supabase Email (MVP) → Resend (prod) |
| Paiement | PVIT (Airtel Money + Moov Money) |
| UI | Tailwind CSS + shadcn/ui personnalisé |
| PWA | next-pwa |
| Déploiement | Vercel |

---

## 3. Architecture du projet

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Groupe auth (layout sans nav)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   ├── candidate/
│   │   │   │   └── page.tsx
│   │   │   └── employer/
│   │   │       └── page.tsx
│   │   └── confirm/
│   │       └── page.tsx
│   ├── (candidate)/              # Groupe candidat (layout avec bottom nav)
│   │   ├── home/
│   │   │   └── page.tsx
│   │   ├── jobs/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   ├── (employer)/               # Groupe employeur (layout avec bottom nav)
│   │   ├── home/
│   │   │   └── page.tsx
│   │   ├── search/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── jobs/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   ├── (admin)/                  # Groupe admin (layout admin)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── jobs/
│   │   │   └── page.tsx
│   │   ├── subscriptions/
│   │   │   └── page.tsx
│   │   └── payments/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   ├── webhooks/
│   │   │   └── pvit/
│   │   │       └── route.ts      # Webhook PVIT callback
│   │   └── health/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── page.tsx                  # Splash screen / redirect
│   ├── manifest.json
│   └── globals.css
├── features/                     # Logique métier par domaine
│   ├── auth/
│   │   ├── actions.ts            # Server Actions
│   │   ├── schemas.ts            # Zod schemas
│   │   └── types.ts
│   ├── candidates/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── schemas.ts
│   │   └── types.ts
│   ├── employers/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── schemas.ts
│   │   └── types.ts
│   ├── jobs/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── schemas.ts
│   │   └── types.ts
│   ├── subscriptions/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   └── types.ts
│   ├── payments/
│   │   ├── actions.ts
│   │   ├── pvit.provider.ts
│   │   └── types.ts
│   ├── notifications/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   └── types.ts
│   └── admin/
│       ├── actions.ts
│       ├── queries.ts
│       └── types.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase browser client
│   │   ├── server.ts             # Supabase server client
│   │   └── admin.ts              # Supabase admin client
│   ├── db/
│   │   ├── index.ts              # Drizzle instance
│   │   ├── schema.ts             # Toutes les tables Drizzle
│   │   └── migrations/
│   ├── pvit/
│   │   ├── client.ts             # PVIT HTTP client
│   │   └── types.ts
│   ├── email/
│   │   └── index.ts              # Abstraction email
│   ├── whatsapp.ts               # Génération liens wa.me
│   ├── quotas.ts                 # Vérification quotas serveur
│   └── utils.ts
├── services/
│   ├── payment/
│   │   ├── payment.interface.ts  # interface PaymentProvider
│   │   └── pvit.service.ts
│   └── storage/
│       └── storage.service.ts
├── repositories/
│   ├── user.repository.ts
│   ├── candidate.repository.ts
│   ├── employer.repository.ts
│   ├── job.repository.ts
│   ├── application.repository.ts
│   ├── subscription.repository.ts
│   └── notification.repository.ts
├── components/
│   ├── ui/                       # shadcn/ui personnalisés
│   └── shared/                   # Composants custom JobConnect
│       ├── BottomNav.tsx
│       ├── HeroCard.tsx
│       ├── JobCard.tsx
│       ├── CandidateCard.tsx
│       ├── WhatsAppButton.tsx
│       ├── PremiumBadge.tsx
│       ├── LockOverlay.tsx
│       ├── SkillsModal.tsx
│       ├── ExperienceModal.tsx
│       └── PaymentModal.tsx
├── hooks/
│   ├── useUser.ts
│   ├── useQuotas.ts
│   └── useSubscription.ts
└── types/
    ├── database.ts               # Types inférés Drizzle
    └── index.ts
```

---

## 4. Base de données — Schéma Drizzle

### Tables principales

```typescript
// users — géré par Supabase Auth + extension custom
users {
  id: uuid (PK, ref Supabase Auth)
  phone: varchar(20) UNIQUE NOT NULL
  email: varchar(255) UNIQUE NOT NULL
  role: enum('candidate', 'employer', 'admin') NOT NULL
  is_active: boolean DEFAULT true
  created_at: timestamp
  updated_at: timestamp
}

// candidate_profiles
candidate_profiles {
  id: uuid PK
  user_id: uuid FK → users.id UNIQUE
  first_name: varchar(100)
  last_name: varchar(100)
  photo_url: text
  city: varchar(100)
  whatsapp_phone: varchar(20)
  profession: varchar(100)
  summary: text
  experience_level: enum('beginner','1_3','3_5','5_plus')
  availability: enum('immediate','15_days','30_days')
  cv_url: text
  is_boosted: boolean DEFAULT false
  created_at: timestamp
  updated_at: timestamp
}

// candidate_experiences
candidate_experiences {
  id: uuid PK
  candidate_id: uuid FK → candidate_profiles.id
  title: varchar(100)
  company: varchar(100)
  city: varchar(100)
  start_date: date
  end_date: date (nullable)
  is_current: boolean DEFAULT false
  description: text
  created_at: timestamp
}

// candidate_educations
candidate_educations {
  id: uuid PK
  candidate_id: uuid FK → candidate_profiles.id
  degree: varchar(100)
  institution: varchar(100)
  city: varchar(100)
  start_year: integer
  end_year: integer (nullable)
  is_current: boolean DEFAULT false
  created_at: timestamp
}

// employer_profiles
employer_profiles {
  id: uuid PK
  user_id: uuid FK → users.id UNIQUE
  company_name: varchar(100)
  logo_url: text
  city: varchar(100)
  whatsapp_phone: varchar(20)
  description: text
  is_verified: boolean DEFAULT false
  created_at: timestamp
  updated_at: timestamp
}

// skills
skills {
  id: uuid PK
  name: varchar(100) UNIQUE
  created_at: timestamp
}

// candidate_skills
candidate_skills {
  id: uuid PK
  candidate_id: uuid FK → candidate_profiles.id
  skill_id: uuid FK → skills.id
  UNIQUE(candidate_id, skill_id)
}

// job_offers
job_offers {
  id: uuid PK
  employer_id: uuid FK → employer_profiles.id
  type: enum('job','internship','freelance')
  title: varchar(100)
  company_name: varchar(100)
  company_logo_url: text
  city: varchar(100)
  salary: varchar(100) (nullable)
  description: text
  status: enum('active','closed','expired')
  published_at: timestamp
  expires_at: timestamp
  created_at: timestamp
  updated_at: timestamp
}

// job_offer_skills
job_offer_skills {
  id: uuid PK
  job_offer_id: uuid FK → job_offers.id
  skill_name: varchar(100)
}

// job_offer_missions
job_offer_missions {
  id: uuid PK
  job_offer_id: uuid FK → job_offers.id
  description: text
  order: integer DEFAULT 0
}

// applications
applications {
  id: uuid PK
  candidate_id: uuid FK → candidate_profiles.id
  job_offer_id: uuid FK → job_offers.id
  status: enum('pending','viewed','rejected')
  created_at: timestamp
  UNIQUE(candidate_id, job_offer_id)
}

// profile_views
profile_views {
  id: uuid PK
  viewer_id: uuid FK → users.id (employeur)
  candidate_id: uuid FK → candidate_profiles.id
  viewed_at: timestamp
}

// whatsapp_contacts
whatsapp_contacts {
  id: uuid PK
  employer_id: uuid FK → employer_profiles.id
  candidate_id: uuid FK → candidate_profiles.id
  contacted_at: timestamp
}

// subscriptions
subscriptions {
  id: uuid PK
  user_id: uuid FK → users.id
  plan: enum('candidate_free','candidate_premium','employer_free','employer_pro')
  status: enum('active','cancelled','expired')
  started_at: timestamp
  expires_at: timestamp
  payment_id: uuid FK → payments.id (nullable)
  created_at: timestamp
}

// payments
payments {
  id: uuid PK
  user_id: uuid FK → users.id
  amount: integer (en FCFA)
  currency: varchar(10) DEFAULT 'XAF'
  provider: enum('pvit','manual')
  operator: enum('airtel_money','moov_money') (nullable)
  status: enum('pending','success','failed')
  pvit_transaction_id: varchar(100)
  pvit_merchant_reference: varchar(100) UNIQUE
  phone: varchar(20)
  metadata: jsonb
  created_at: timestamp
  updated_at: timestamp
}

// notifications
notifications {
  id: uuid PK
  user_id: uuid FK → users.id
  type: enum('profile_viewed','application_sent','subscription_expired','quota_reached','payment_success','payment_failed')
  title: varchar(200)
  message: text
  is_read: boolean DEFAULT false
  metadata: jsonb
  created_at: timestamp
}
```

---

## 5. Authentification

### Flux inscription
1. Formulaire : numéro de téléphone + email + mot de passe
2. `supabase.auth.signUp()` avec email + password
3. Supabase envoie un mail de confirmation
4. Création de l'entrée dans `users` (via trigger ou Server Action)
5. Redirection vers page de confirmation

### Flux connexion
1. Formulaire : numéro de téléphone + mot de passe
2. Recherche de l'email associé au numéro dans `users`
3. `supabase.auth.signInWithPassword()` avec email + password trouvé
4. Session créée → redirection selon le rôle

### Règles importantes
- Le numéro de téléphone est l'identifiant **visible** de l'utilisateur
- L'email est utilisé **uniquement** pour l'auth Supabase (invisible pour l'UX)
- Mot de passe hashé par Supabase Auth (bcrypt)
- Session gérée via cookies httpOnly par Supabase

---

## 6. Abonnements & Quotas

### Plans
| Plan | Prix | Limites |
|---|---|---|
| `candidate_free` | 0 | 10 offres visibles, 3 candidatures/mois |
| `candidate_premium` | 2 000 FCFA/mois | Illimité + badge + priorité |
| `employer_free` | 0 | 3 profils/jour, 1 contact WA/mois, 1 offre active |
| `employer_pro` | 15 000 FCFA/mois | Illimité + 5 offres + stats + badge vérifié |

### Règle absolue
> **Toujours vérifier les quotas côté serveur** dans les Server Actions.
> Ne jamais faire confiance au frontend pour les limites.

```typescript
// Exemple dans lib/quotas.ts
export async function checkCandidateApplicationQuota(userId: string): Promise<boolean>
export async function checkEmployerProfileViewQuota(userId: string): Promise<boolean>
export async function checkEmployerWhatsappQuota(userId: string): Promise<boolean>
export async function checkEmployerActiveJobsQuota(userId: string): Promise<boolean>
```

---

## 7. Paiements PVIT

### Architecture

```typescript
// services/payment/payment.interface.ts
interface PaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>
  checkStatus(transactionId: string): Promise<PaymentStatus>
  verifyKyc(phone: string, operator: string): Promise<KycResult>
}

// Implémentations
class PvitPaymentProvider implements PaymentProvider  // Production
class MockPaymentProvider implements PaymentProvider  // Dev/Test
```

### Flux PVIT
1. Appel `POST /v2/{URL_CODE}/rest` → statut `PENDING`
2. Attendre webhook callback sur `/api/webhooks/pvit`
3. Webhook reçu → valider `merchantReferenceId` (idempotence)
4. Si `SUCCESS` → activer abonnement
5. Si pas de webhook après 3 min → appeler Check Status API
6. Répondre au webhook avec `{ transactionId, responseCode: 200 }`

### Variables d'environnement PVIT
```env
PVIT_URL_CODE=
PVIT_OPERATION_ACCOUNT_CODE=
PVIT_API_PASSWORD=
PVIT_CALLBACK_URL_CODE=
```

### Renouvellement de la clé secrète
La clé PVIT expire toutes les **3600 secondes**.
Implémenter un cron job (Vercel Cron) pour renouveler la clé automatiquement.

---

## 8. WhatsApp

Tous les contacts utilisent `https://wa.me/` avec message pré-rempli.

```typescript
// lib/whatsapp.ts
export function buildWhatsAppUrl(phone: string, message: string): string {
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${phone}?text=${encoded}`
}

export function candidateContactMessage(jobTitle: string): string {
  return `Bonjour, je vous contacte concernant votre candidature sur JobConnect pour le poste de ${jobTitle}.`
}

export function employerContactMessage(candidateName: string): string {
  return `Bonjour ${candidateName}, j'ai consulté votre profil sur JobConnect et je souhaite vous contacter.`
}
```

---

## 9. Storage Supabase

### Buckets
| Bucket | Contenu | Accès |
|---|---|---|
| `avatars` | Photos profil candidats | Public |
| `company-logos` | Logos employeurs | Public |
| `cvs` | CV PDF candidats | Privé (auth required) |
| `job-images` | Images offres | Public |

### Règles
- CV : max 5MB, PDF uniquement
- Photos/logos : max 2MB, jpg/png/webp
- Utiliser Supabase Storage RLS pour sécuriser les CVs

---

## 10. Design System

### Couleurs
```css
--color-primary-dark: #0D1B2A;
--color-primary-green: #1E6B3C;
--color-accent-green: #2E8B57;
--color-light-green: #E8F5EE;
--color-background: #F0F4F8;
--color-white: #FFFFFF;
--color-text-primary: #0D1B2A;
--color-text-secondary: #6B7280;
--color-text-muted: #9CA3AF;
--color-warning: #EF4444;
--color-orange: #D97706;
--color-whatsapp: #25D366;
```

### Typographie
- Police : **Inter** (Google Fonts)
- H1 : 24px / 700
- H2 : 20px / 700
- H3 : 18px / 600
- Body : 14px / 400
- Caption : 12px / 400
- Badge : 11px / 600

### Composants clés
- **BottomNav** : 4 onglets (Home, Recherche, Dashboard, Profil)
- **HeroCard** : fond `#0D1B2A`, texte blanc, radius 16px
- **JobCard** : fond blanc, shadow douce, radius 12px
- **CandidateCard** : avec LockOverlay si non débloqué
- **WhatsAppButton** : fond `#25D366`, icône WA
- **PremiumBadge** : fond `#0D1B2A`, icône ✦
- **LockOverlay** : flou + icône cadenas + "DÉBLOQUER AVEC PRO"

---

## 11. PWA

```json
// app/manifest.json
{
  "name": "JobConnect",
  "short_name": "JobConnect",
  "description": "L'emploi direct au Gabon",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0D1B2A",
  "theme_color": "#0D1B2A",
  "orientation": "portrait",
  "icons": [...]
}
```

### Configuration next-pwa
- Cache stratégie : NetworkFirst pour les API, CacheFirst pour les assets
- Offline page minimale
- Installation prompt Android/iOS

---

## 12. Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# PVIT
PVIT_URL_CODE=
PVIT_OPERATION_ACCOUNT_CODE=
PVIT_API_PASSWORD=
PVIT_CALLBACK_URL_CODE=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=JobConnect

# Admin
ADMIN_PHONE=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

---

## 13. Conventions de code

### Nommage
- Composants : `PascalCase`
- Fonctions/variables : `camelCase`
- Tables DB : `snake_case`
- Fichiers : `kebab-case` sauf composants

### Server Actions
```typescript
// Toujours valider avec Zod
// Toujours vérifier l'authentification
// Toujours vérifier les quotas avant action
// Retourner { success, data?, error? }

export async function applyToJob(jobId: string) {
  const user = await requireAuth()
  await checkCandidateApplicationQuota(user.id)
  const validated = applySchema.parse({ jobId })
  // ...
  return { success: true, data: application }
}
```

### Gestion des erreurs
```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

---

## 14. Sécurité

- RLS (Row Level Security) activé sur toutes les tables Supabase
- Quotas vérifiés **uniquement côté serveur**
- Webhook PVIT vérifié via `merchantReferenceId` (idempotence)
- CVs accessibles uniquement aux utilisateurs authentifiés
- Admin protégé par middleware + vérification rôle
- Inputs validés avec Zod (server + client)
- Variables d'environnement jamais exposées côté client

---

## 15. Commandes utiles

```bash
# Dev
npm run dev

# DB
npm run db:generate    # Générer les migrations Drizzle
npm run db:migrate     # Appliquer les migrations
npm run db:studio      # Drizzle Studio
npm run db:seed        # Seed admin + données de test

# Build
npm run build
npm run start

# Lint
npm run lint
npm run type-check
```

---

## 16. Priorités MVP

1. ✅ Auth (inscription + confirmation mail + connexion)
2. ✅ Profil candidat (création + édition)
3. ✅ Profil employeur (création + édition)
4. ✅ Offres d'emploi (publication + liste + détail)
5. ✅ Candidature (postuler + limites)
6. ✅ Recherche candidats (employeur)
7. ✅ Contact WhatsApp (avec limites)
8. ✅ Paiement PVIT (abonnements)
9. ✅ Notifications
10. ✅ Dashboard stats
11. ✅ Admin
12. ✅ PWA

---

*Dernière mise à jour : MVP v1.0*
