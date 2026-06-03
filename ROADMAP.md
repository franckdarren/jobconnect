# ROADMAP — JobConnect

> Plan d'implémentation détaillé du MVP.
> Chaque phase liste : objectif, préalables, tâches concrètes, fichiers à produire, critères d'acceptation.
> Lire [CLAUDE.md](CLAUDE.md) en premier pour les règles non-négociables.

**État au démarrage** : init Next.js 16 + shadcn/ui seulement. Aucun code métier.

**Stratégie globale** : fondations d'abord (Phase 0–2), puis verticales métier (3 à 7), monétisation (8), puis admin/PWA/prod (9–13). Chaque phase produit une démo fonctionnelle de bout en bout.

---

## Vue d'ensemble

| Phase | Nom | Durée estimée | Dépend de |
|---|---|---|---|
| 0 | Fondations techniques | 3–5 j | — |
| 1 | Design system & layouts | 2–3 j | 0 |
| 2 | Authentification | 3–4 j | 0, 1 |
| 3 | Profil candidat | 4–5 j | 2 |
| 4 | Profil employeur | 2–3 j | 2 |
| 5 | Offres d'emploi (CRUD) | 4–5 j | 4 |
| 6 | Candidatures (postuler + quotas) | 2–3 j | 3, 5 |
| 7 | Recherche candidats + contact WhatsApp | 3–4 j | 3, 4 |
| 8 | Abonnements & paiements PVIT | 5–7 j | 6, 7 |
| 9 | Notifications | 2–3 j | 6, 7, 8 |
| 10 | Dashboards stats | 2–3 j | 6, 7 |
| 11 | Admin | 4–5 j | 8 |
| 12 | PWA & offline | 2–3 j | toutes |
| 13 | Préparation production | 3–5 j | toutes |

**Total estimé** : 41–58 jours / homme (≈ 8–12 semaines en solo).

---

## Phase 0 — Fondations techniques

**Objectif** : avoir une infrastructure clean (DB, auth client, helpers, types) avant d'écrire la moindre feature.

### 0.1 Setup Supabase
- Créer le projet Supabase (région la plus proche du Gabon disponible).
- Récupérer `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Créer les 4 buckets Storage : `avatars`, `company-logos`, `cvs` (privé), `job-images`.
- Configurer le SMTP Supabase pour les mails de confirmation (MVP).

### 0.2 Schéma Drizzle
Fichier : `src/lib/db/schema.ts`
- Définir toutes les tables et enums listés dans CLAUDE.md §5.
- Ajouter index sur : `users.phone`, `users.email`, `job_offers.status`, `job_offers.city`, `applications.candidate_id`, `payments.pvit_merchant_reference`.
- Définir les relations Drizzle (`relations()`).

### 0.3 Scripts package.json
Ajouter :
```json
"db:generate": "drizzle-kit generate",
"db:migrate":  "drizzle-kit migrate",
"db:studio":   "drizzle-kit studio",
"db:seed":     "tsx src/lib/db/seed.ts",
"type-check":  "tsc --noEmit"
```
Fichier : `drizzle.config.ts` à créer (pointer vers `src/lib/db/schema.ts`).

### 0.4 Clients Supabase
- `src/lib/supabase/client.ts` — browser (createBrowserClient).
- `src/lib/supabase/server.ts` — server (createServerClient avec cookies Next).
- `src/lib/supabase/admin.ts` — service role (server only, jamais importé côté client).

### 0.5 Instance Drizzle
Fichier : `src/lib/db/index.ts` — export `db` avec `postgres` + `drizzle()`.

### 0.6 Types globaux
Fichier : `src/types/index.ts` :
```ts
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```
Fichier : `src/types/database.ts` — réexport des types Drizzle (`InferSelectModel`, `InferInsertModel`).

### 0.7 Helpers transverses
- `src/lib/whatsapp.ts` — `buildWhatsAppUrl`, `candidateContactMessage`, `employerContactMessage`.
- `src/lib/utils.ts` — `cn()` (shadcn) + helpers généraux.
- `src/lib/auth.ts` — `requireAuth()`, `requireRole(role)`, `getCurrentUser()` (server).

### 0.8 Helpers quotas
Fichier : `src/lib/quotas.ts`
- `checkCandidateApplicationQuota(userId)` — compte applications du mois en cours.
- `checkEmployerProfileViewQuota(userId)` — compte profile_views du jour pour `employer_free`.
- `checkEmployerWhatsappQuota(userId)` — compte whatsapp_contacts du mois.
- `checkEmployerActiveJobsQuota(userId)` — compte job_offers status=active.
- Chacune retourne `{ allowed: boolean; remaining: number; limit: number }`.
- Lookup du plan via la dernière `subscriptions.active` du user (fallback plan `free`).

### 0.9 Middleware Next.js
Fichier : `src/middleware.ts`
- Rafraîchir la session Supabase (cookies).
- Rediriger non-auth → `/login` pour les routes `(candidate)`, `(employer)`, `(admin)`.
- Vérifier `role === 'admin'` pour `(admin)`.

### 0.10 Migrations + RLS
- Générer la première migration (`npm run db:generate`).
- Appliquer (`npm run db:migrate`).
- **Activer RLS** sur chaque table Supabase, écrire les policies de base :
  - `users` : lecture self, update self.
  - `candidate_profiles` : lecture publique, update self.
  - `employer_profiles` : lecture publique, update self.
  - `job_offers` : lecture publique (status=active), insert/update si owner.
  - `applications` : lecture par owner (candidat et employeur de l'offre).
  - `payments` : lecture self, insert self, update via service role uniquement.
  - `subscriptions` : lecture self, update via service role.
  - Storage `cvs` : lecture si auth + owner.

### Critères d'acceptation Phase 0
- [ ] `npm run db:studio` ouvre Drizzle Studio avec toutes les tables.
- [ ] Connexion via `supabase.auth.signUp()` insère une ligne dans `users` (à confirmer en Phase 2).
- [ ] RLS bloque toute lecture non autorisée (test manuel via SQL editor).

---

## Phase 1 — Design system & layouts

**Objectif** : tous les composants UI signature en place + layouts des 4 groupes de routes.

### 1.1 Variables design tokens
Fichier : `src/app/globals.css`
- Déclarer les variables CSS (couleurs §12).
- Mapper sur Tailwind v4 via `@theme` (ou config Tailwind selon version).
- Importer Inter via `next/font/google`.

### 1.2 Composants shared
Tous dans `src/components/shared/` :
- `BottomNav.tsx` — props : `role: 'candidate' | 'employer'`, gère l'item actif.
- `HeroCard.tsx` — fond dark, slot title + subtitle + CTA.
- `JobCard.tsx` — props : offre + handlers.
- `CandidateCard.tsx` — props : candidat, `locked: boolean`.
- `WhatsAppButton.tsx` — props : phone, message.
- `PremiumBadge.tsx` — affiche ✦ + label.
- `LockOverlay.tsx` — blur + cadenas + label "DÉBLOQUER AVEC PRO".
- `SkillsModal.tsx`, `ExperienceModal.tsx`, `EducationModal.tsx`, `PaymentModal.tsx` — utiliser Radix Dialog.

### 1.3 Layouts par groupe
- `src/app/(auth)/layout.tsx` — sans nav, fond `#F0F4F8`.
- `src/app/(candidate)/layout.tsx` — avec BottomNav role candidat.
- `src/app/(employer)/layout.tsx` — avec BottomNav role employeur.
- `src/app/(admin)/layout.tsx` — sidebar admin.

### 1.4 Splash / redirect
- `src/app/page.tsx` — redirige `/login` si pas de session, sinon `/home` selon rôle.

### 1.5 Storybook simple (optionnel mais utile)
- Page interne `/_dev/components` listant tous les composants shared. À supprimer avant prod.

### Critères d'acceptation Phase 1
- [ ] Tous les composants shared rendent correctement aux specs §12 (couleurs, radius, typo).
- [ ] Les 4 layouts compilent et affichent leur structure (même avec pages vides).

---

## Phase 2 — Authentification

**Objectif** : flux complet inscription / confirmation / connexion fonctionnel, redirection par rôle.

### 2.1 Schémas Zod
Fichier : `src/features/auth/schemas.ts`
- `registerCandidateSchema` — `phone`, `email`, `password` (min 8), `confirmPassword`, `firstName`, `lastName`.
- `registerEmployerSchema` — `phone`, `email`, `password`, `confirmPassword`, `companyName`.
- `loginSchema` — `phone`, `password`.
- Validation phone : regex Gabon (`+241` ou format local).

### 2.2 Server Actions
Fichier : `src/features/auth/actions.ts`
- `registerCandidate(input)` :
  1. `validated = schema.parse(input)`
  2. `supabase.auth.signUp({ email, password })` (mail confirmation envoyé automatiquement).
  3. Insertion dans `users` avec `role='candidate'`.
  4. Insertion squelette dans `candidate_profiles` (firstName, lastName).
  5. Return `ActionResult`.
- `registerEmployer(input)` — pareil, role `employer`, squelette `employer_profiles`.
- `login(input)` :
  1. Lookup `users.email` par `phone`.
  2. `signInWithPassword(email, password)`.
  3. Return rôle pour redirection.
- `logout()` — `signOut()` + redirect `/login`.

Note : préférer un **trigger Postgres** `on auth.users insert` pour créer la ligne `users` (plus robuste contre les race conditions). Si trigger : la Server Action insère seulement le profil.

### 2.3 Pages
- `src/app/(auth)/login/page.tsx` — form téléphone + password.
- `src/app/(auth)/register/candidate/page.tsx`.
- `src/app/(auth)/register/employer/page.tsx`.
- `src/app/(auth)/confirm/page.tsx` — affiche "Vérifiez votre boîte mail".
- Page de callback Supabase si nécessaire (handler du lien email).

### 2.4 Tests manuels
- Inscription candidat → mail reçu → clic → connexion → redirection `/home`.
- Idem employeur.
- Login phone qui n'existe pas → erreur claire.
- Login mauvais password → erreur claire.

### Critères d'acceptation Phase 2
- [ ] Flux complet candidat + employeur fonctionne.
- [ ] Une session expire et le middleware redirige bien sur `/login`.
- [ ] Le rôle détermine la redirection post-login.

---

## Phase 3 — Profil candidat

**Objectif** : un candidat peut compléter intégralement son profil (infos perso, photo, CV, skills, expériences, formations).

### 3.1 Schémas Zod
Fichier : `src/features/candidates/schemas.ts`
- `updateCandidateProfileSchema` — first/last name, city, whatsappPhone, profession, summary, experienceLevel, availability.
- `addExperienceSchema`, `addEducationSchema`, `setSkillsSchema`.

### 3.2 Server Actions
Fichier : `src/features/candidates/actions.ts`
- `updateProfile(input)` — update `candidate_profiles`.
- `uploadAvatar(file)` — upload vers bucket `avatars`, update `photo_url`.
- `uploadCv(file)` — upload vers bucket `cvs` (privé), update `cv_url`. Vérif MIME = `application/pdf` et taille ≤ 5 MB côté serveur.
- `addExperience`, `updateExperience`, `deleteExperience`.
- `addEducation`, `updateEducation`, `deleteEducation`.
- `setSkills(skillIds[])` — gère le delta (delete + insert).
- `getOrCreateSkill(name)` — pour autocomplete avec création.

### 3.3 Queries
Fichier : `src/features/candidates/queries.ts`
- `getCandidateProfile(userId)` — avec expériences, éducations, skills jointes.
- `getCandidateById(candidateId)` — pour consultation employeur.

### 3.4 Pages
- `src/app/(candidate)/profile/page.tsx` — vue + édition (inline ou via modals).
  - Section infos perso.
  - Section photo + CV.
  - Section profession + résumé.
  - Section disponibilité / niveau.
  - Liste expériences (ouvre `ExperienceModal`).
  - Liste formations (ouvre `EducationModal`).
  - Skills (ouvre `SkillsModal`).
- `src/app/(candidate)/home/page.tsx` — squelette (offres recommandées plus tard).

### 3.5 Hook
- `src/hooks/useUser.ts` — récupère user + profile pour les vues client.

### Critères d'acceptation Phase 3
- [ ] Un candidat peut compléter 100% de son profil.
- [ ] Le CV upload est bien privé (test : URL bucket en navigation privée → refus).
- [ ] Les modals respectent le design system.

---

## Phase 4 — Profil employeur

**Objectif** : un employeur peut compléter le profil entreprise.

### 4.1 Schémas + actions + queries
Fichier : `src/features/employers/{schemas,actions,queries}.ts`
- `updateEmployerProfileSchema` — companyName, city, whatsappPhone, description.
- `updateProfile`, `uploadLogo` (bucket `company-logos`).
- `getEmployerProfile(userId)`.

### 4.2 Pages
- `src/app/(employer)/profile/page.tsx`.
- `src/app/(employer)/home/page.tsx` — squelette (stats + dernières candidatures plus tard).

### Critères d'acceptation Phase 4
- [ ] Profil employeur complet.
- [ ] Logo affiché correctement dans HeroCard et JobCard.

---

## Phase 5 — Offres d'emploi (CRUD)

**Objectif** : un employeur peut publier/modifier/clôturer une offre, et un candidat peut la voir.

### 5.1 Schémas Zod
Fichier : `src/features/jobs/schemas.ts`
- `createJobOfferSchema` — type, title, city, salary, description, skills[], missions[], expiresAt.
- `updateJobOfferSchema`, `closeJobOfferSchema`.

### 5.2 Server Actions
Fichier : `src/features/jobs/actions.ts`
- `createJobOffer(input)` :
  1. `requireAuth()` + `requireRole('employer')`.
  2. `checkEmployerActiveJobsQuota(userId)` → si dépassé, return error.
  3. Insertion `job_offers` + `job_offer_skills` + `job_offer_missions`.
  4. Status `active`, `published_at = now()`.
- `updateJobOffer(id, input)` — vérif ownership.
- `closeJobOffer(id)` — set status `closed`.
- Cron expiration (Phase 13).

### 5.3 Queries
Fichier : `src/features/jobs/queries.ts`
- `listActiveJobOffers({ city?, type?, skills?, page })` — pour candidats.
- `listOwnJobOffers(employerId)` — pour employeur.
- `getJobOfferById(id)` — avec employeur + skills + missions.
- Pour `candidate_free` : LIMIT 10 sur listActiveJobOffers (vérif côté serveur via plan).

### 5.4 Pages employeur
- `src/app/(employer)/jobs/page.tsx` — liste des offres + bouton "Nouvelle offre".
- `src/app/(employer)/jobs/new/page.tsx` — formulaire création.
- `src/app/(employer)/jobs/[id]/page.tsx` — édition + actions (clôturer, dupliquer).

### 5.5 Pages candidat
- `src/app/(candidate)/jobs/page.tsx` — liste + filtres (ville, type).
- `src/app/(candidate)/jobs/[id]/page.tsx` — détail + bouton "Postuler".

### Critères d'acceptation Phase 5
- [ ] Un employeur free ne peut pas créer une 2ᵉ offre active (message clair).
- [ ] Un candidat free ne voit que 10 offres max.
- [ ] Offre clôturée invisible côté candidat.

---

## Phase 6 — Candidatures

**Objectif** : un candidat postule à une offre, quota appliqué, employeur voit la candidature.

### 6.1 Schémas + actions
Fichier : `src/features/jobs/actions.ts` (suite)
- `applyToJob(jobId)` :
  1. `requireAuth()` + role candidat.
  2. `checkCandidateApplicationQuota(userId)`.
  3. Vérif offre active.
  4. Insertion `applications` (UNIQUE empêche double).
  5. Trigger notification employeur (type `application_sent`).
  6. Return success.
- `markApplicationViewed(applicationId)` — côté employeur.
- `rejectApplication(applicationId)` — optionnel MVP.

### 6.2 Queries
- `listOwnApplications(candidateId)` — pour dashboard candidat.
- `listApplicationsForJob(jobOfferId)` — pour employeur.
- `listApplicationsForEmployer(employerId)` — toutes offres confondues.

### 6.3 Pages
- `src/app/(candidate)/dashboard/page.tsx` — liste de ses candidatures, statut.
- `src/app/(employer)/jobs/[id]/page.tsx` — onglet "Candidatures" avec liste + bouton WhatsApp candidat (renvoie aux quotas Phase 7).

### 6.4 Hook quotas
Fichier : `src/hooks/useQuotas.ts` — fetch les quotas restants pour affichage UI (purement indicatif, jamais bloquant côté client).

### Critères d'acceptation Phase 6
- [ ] Un candidat free ne peut pas faire une 4ᵉ candidature dans le mois.
- [ ] Message d'erreur propose l'upgrade Premium.
- [ ] L'employeur voit la candidature avec le profil candidat.

---

## Phase 7 — Recherche candidats + contact WhatsApp

**Objectif** : un employeur cherche des candidats, vérifie les quotas, contacte via WhatsApp.

### 7.1 Queries
Fichier : `src/features/candidates/queries.ts` (suite)
- `searchCandidates({ city?, skills?, experienceLevel?, availability?, profession?, page })`.
- Tri : `is_boosted` desc, puis créé récemment.

### 7.2 Server Actions
- `viewCandidateProfile(candidateId)` :
  1. Vérif role employeur.
  2. `checkEmployerProfileViewQuota(userId)`.
  3. Insertion `profile_views`.
  4. Notification candidat (`profile_viewed`).
- `contactCandidateWhatsApp(candidateId)` :
  1. `checkEmployerWhatsappQuota(userId)`.
  2. Insertion `whatsapp_contacts`.
  3. Return l'URL `wa.me` à ouvrir.

### 7.3 Pages
- `src/app/(employer)/search/page.tsx` — filtres + résultats (CandidateCard avec LockOverlay si quota épuisé OU pas de plan).
- `src/app/(employer)/search/[id]/page.tsx` — détail candidat (verrouille les coordonnées si non débloqué).

### Critères d'acceptation Phase 7
- [ ] Employer free voit max 3 profils complets par jour, le reste est masqué.
- [ ] Employer free peut contacter 1 candidat WhatsApp par mois.
- [ ] CV téléchargeable uniquement si quota OK et plan adéquat.

---

## Phase 8 — Abonnements & paiements PVIT

**Objectif** : un user paie son plan via Airtel Money / Moov Money, l'abonnement s'active.

### 8.1 Interface PaymentProvider
Fichier : `src/services/payment/payment.interface.ts`
- Voir CLAUDE.md §8.

### 8.2 Client HTTP PVIT
Fichier : `src/lib/pvit/client.ts`
- Wrapper `ky` avec auth header.
- Gestion du token avec cache mémoire + refresh auto à T-300s.
- Endpoints : create payment, check status, KYC verify, refresh token.

### 8.3 Implémentations
- `src/services/payment/pvit.service.ts` — appel API réel.
- `src/services/payment/mock.service.ts` — pour dev, simule webhook après 5s.
- Sélection via env `NODE_ENV` ou `PAYMENT_PROVIDER`.

### 8.4 Server Actions
Fichier : `src/features/payments/actions.ts`
- `initiatePayment(plan, operator, phone)` :
  1. `requireAuth()`.
  2. Insertion `payments` avec `pvit_merchant_reference = nanoid()`, status `pending`.
  3. Appel `provider.createPayment()`.
  4. Return merchantReference pour polling client.
- `getPaymentStatus(merchantReference)` — pour polling UI.

### 8.5 Webhook PVIT
Fichier : `src/app/api/webhooks/pvit/route.ts`
- POST handler.
- **Idempotence** : lookup `payments` par `pvit_merchant_reference`. Si déjà `success` ou `failed`, retourner `{ responseCode: 200 }` sans rien faire.
- Si `SUCCESS` :
  1. Update `payments.status = 'success'` + `pvit_transaction_id`.
  2. Créer/renouveler `subscriptions` avec `expires_at = now + 30 jours`.
  3. Notification `payment_success`.
- Si `FAILED` :
  1. Update `payments.status = 'failed'`.
  2. Notification `payment_failed`.
- Toujours répondre `{ transactionId, responseCode: 200 }`.

### 8.6 Cron Vercel
Fichier : `vercel.json` ou `src/app/api/cron/*`
- `/api/cron/pvit-refresh-token` — toutes les 50 min, refresh token PVIT.
- `/api/cron/pvit-check-pending` — toutes les 5 min, check status des paiements `pending` > 3 min.
- `/api/cron/expire-subscriptions` — quotidien, set `expired` les subscriptions échues.
- `/api/cron/expire-jobs` — quotidien, set `expired` les `job_offers.expires_at` passées.
- Auth : header `Authorization: Bearer ${CRON_SECRET}`.

### 8.7 UI
- `src/components/shared/PaymentModal.tsx` — choix opérateur, saisie phone, statut.
- Page ou modal "Choisir mon plan" accessible depuis profil, dashboard, et au moment d'un quota dépassé.
- Polling `getPaymentStatus` toutes les 3s pendant 3 min.

### 8.8 Hook
- `src/hooks/useSubscription.ts` — récupère subscription active.

### Critères d'acceptation Phase 8
- [ ] En dev (Mock) : flux complet en 5 s, subscription activée.
- [ ] En prod : test réel Airtel Money jusqu'au webhook.
- [ ] Webhook rejoué 2× → seule la 1ʳᵉ exécution applique l'effet.
- [ ] Crons listés visibles dans le dashboard Vercel.

---

## Phase 9 — Notifications

**Objectif** : centre de notifications in-app pour les 6 types listés.

### 9.1 Server Actions + queries
Fichier : `src/features/notifications/{actions,queries}.ts`
- `createNotification(userId, type, title, message, metadata)` — utilisé par les autres features.
- `listNotifications(userId, { unreadOnly?, limit?, offset? })`.
- `markAsRead(notificationId)`.
- `markAllAsRead(userId)`.
- `getUnreadCount(userId)`.

### 9.2 UI
- Icône cloche dans le header avec badge count (composant `NotificationBell`).
- Page ou dropdown listant les notifs.
- Chaque type a son rendu (icône + couleur).

### 9.3 Intégrations
S'assurer que toutes les actions des Phases 6-8 appellent `createNotification` aux bons moments.

### Critères d'acceptation Phase 9
- [ ] Les 6 types de notifs apparaissent dans les bons scénarios.
- [ ] Badge count se met à jour après `markAsRead`.

---

## Phase 10 — Dashboards stats

**Objectif** : tableaux de bord candidat et employeur.

### 10.1 Dashboard candidat
- Nb candidatures envoyées (total + ce mois).
- Nb vues de profil (réservé Premium).
- Liste candidatures avec statut.
- CTA upgrade Premium si free.

### 10.2 Dashboard employeur
- Nb offres actives.
- Nb candidatures reçues (total + ce mois).
- Nb profils débloqués (réservé Pro).
- Nb contacts WhatsApp envoyés.
- Liste 5 dernières candidatures.

### 10.3 Queries
- `src/features/candidates/queries.ts` : `getCandidateStats(userId)`.
- `src/features/employers/queries.ts` : `getEmployerStats(userId)`.

### Critères d'acceptation Phase 10
- [ ] Compteurs cohérents avec la DB (test manuel).
- [ ] Verrous Premium/Pro respectés sur les sections stats avancées.

---

## Phase 11 — Admin

**Objectif** : un admin pilote la plateforme (users, offres, paiements, abonnements).

### 11.1 Seed admin
Fichier : `src/lib/db/seed.ts`
- Crée un user avec `role='admin'` à partir de `ADMIN_PHONE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- Idempotent (skip si existe).
- Exécuter via `npm run db:seed`.

### 11.2 Layout admin
- `src/app/(admin)/layout.tsx` — sidebar (Dashboard, Users, Jobs, Subscriptions, Payments).
- Middleware déjà filtré (Phase 0).

### 11.3 Pages
- `src/app/(admin)/dashboard/page.tsx` — KPIs globaux (users, offres, paiements, MRR).
- `src/app/(admin)/users/page.tsx` — liste paginée + recherche + actions (suspendre, vérifier employeur).
- `src/app/(admin)/jobs/page.tsx` — liste + suppression abusive.
- `src/app/(admin)/subscriptions/page.tsx` — liste + filtrage.
- `src/app/(admin)/payments/page.tsx` — liste + détails.

### 11.4 Server Actions admin
Fichier : `src/features/admin/actions.ts`
- `suspendUser(id)`, `activateUser(id)`.
- `verifyEmployer(employerId)` — set `is_verified=true`.
- `deleteJobOffer(id)`.
- `boostCandidate(candidateId, durationDays)` — set `is_boosted`.
- `refundPayment(paymentId)` — manuel + log.

### 11.5 Logs d'action
Optionnel mais utile : table `admin_actions` (admin_id, action, target_id, timestamp).

### Critères d'acceptation Phase 11
- [ ] Un user non-admin atterrit en 403 sur `/admin/*`.
- [ ] Toutes les actions sont audit-able.

---

## Phase 12 — PWA & offline

**Objectif** : installable, fonctionne hors-ligne pour les vues statiques.

### 12.1 Manifest
Fichier : `src/app/manifest.json` (cf. CLAUDE.md §13).
- Icônes 192, 384, 512 (à générer depuis le logo).

### 12.2 next-pwa
- Config dans `next.config.ts`.
- Stratégies : NetworkFirst (API), CacheFirst (assets), StaleWhileRevalidate (pages).
- Précache des routes statiques (`/`, `/login`).

### 12.3 Page offline
- `src/app/offline/page.tsx` — minimal, message + bouton retry.

### 12.4 Install prompt
- Composant `InstallPwaBanner` — écoute `beforeinstallprompt`, affiche CTA après 30 s de session.

### Critères d'acceptation Phase 12
- [ ] Lighthouse PWA score ≥ 90.
- [ ] L'app s'installe sur Android et iOS.
- [ ] Sans connexion, page offline s'affiche.

---

## Phase 13 — Préparation production

**Objectif** : prêt à mettre en ligne pour le marché gabonais.

### 13.1 Email Resend
- Remplacer SMTP Supabase par Resend pour les transactionnels custom.
- Templates : confirmation, abonnement expiré bientôt.
- Variables `RESEND_API_KEY`.

### 13.2 Tests
- Tests E2E critiques (Playwright) :
  - Inscription candidat + login.
  - Création offre employeur + candidature.
  - Paiement Mock complet.
- Smoke tests RLS via service role vs anon.

### 13.3 Monitoring
- Sentry ou équivalent (errors).
- Vercel Analytics (perf).
- Log structuré (`pino` ou simple `console.log` + Vercel logs).

### 13.4 Sécurité finale
- Audit headers (CSP, HSTS, X-Frame-Options) via `next.config.ts`.
- Rate-limiting sur endpoints sensibles (auth, webhook PVIT) — middleware ou Upstash.
- Rotation des secrets vérifiée.
- Test de pénétration léger : essayer de bypasser quotas, lire CVs d'autres users, etc.

### 13.5 Documentation
- README.md utilisateur (install, dev, déploiement).
- Doc PVIT (variables, callback URL).
- Doc admin (comment vérifier un employeur, etc.).

### 13.6 Déploiement
- Vercel projet lié au repo.
- Variables d'env prod (Supabase prod, PVIT prod).
- Domaine custom (jobconnect.ga ou équivalent).
- Configurer les crons Vercel.
- DNS + SSL.
- Premier déploiement → tests smoke sur prod.
- Communication lancement.

### Critères d'acceptation Phase 13
- [ ] Build prod sans warning.
- [ ] `npm run type-check` propre.
- [ ] `npm run lint` propre.
- [ ] Tests E2E verts.
- [ ] Toutes les vars d'env prod configurées.
- [ ] Crons actifs.

---

## Risques & inconnues à clarifier tôt

| Risque | Impact | Mitigation |
|---|---|---|
| Compte PVIT non disponible immédiatement | Bloque Phase 8 | Démarrer avec MockPaymentProvider, paralléliser la demande compte marchand PVIT dès J1. |
| Région Supabase éloignée du Gabon (latence) | UX dégradée | Choisir EU-West (le plus proche), bench latence, envisager Edge Functions. |
| Délivrabilité SMTP Supabase | Mails confirmation non reçus | Passer à Resend tôt si problème, configurer SPF/DKIM. |
| Connexions mobiles lentes au Gabon | UX | Compresser images, lazy loading, minimiser JS, PWA prioritaire. |
| Webhook PVIT non reçu | Paiements bloqués `pending` | Cron de fallback Check Status (Phase 8.6). |
| Coût stockage CV | Croissance non maîtrisée | Quota implicite : 1 CV par candidat (remplace l'ancien à l'upload). |
| Trigger PG vs Server Action pour `users` | Race conditions | Préférer trigger. À décider en Phase 2. |

---

## Travaux post-MVP (backlog)

Hors scope du MVP mais à garder en tête :
- Système de messagerie interne (si WhatsApp ne suffit pas).
- Recommandations d'offres (matching skills).
- Boost payant ponctuel candidat (top des résultats).
- App native (Capacitor) si PWA insuffisant sur iOS.
- Multi-langue (FR / EN / dialectes locaux).
- Recherche full-text (`pg_trgm` ou Meilisearch).
- Analytics produit (PostHog).
- A/B test sur les conversions Premium / Pro.
- Programme parrainage.
- Intégration emails employeurs (envoi groupé candidats matchés).

---

*Roadmap initiale — 2026-06-03.*
