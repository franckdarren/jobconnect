import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  jsonb,
  date,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// =========================================================================
// ENUMS
// =========================================================================

export const roleEnum = pgEnum("role", ["candidate", "employer", "admin"]);

export const experienceLevelEnum = pgEnum("experience_level", [
  "beginner",
  "1_3",
  "3_5",
  "5_plus",
]);

export const availabilityEnum = pgEnum("availability", [
  "immediate",
  "15_days",
  "30_days",
]);

export const jobTypeEnum = pgEnum("job_type", [
  "job",
  "internship",
  "freelance",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "active",
  "closed",
  "expired",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "viewed",
  "rejected",
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "candidate_free",
  "candidate_premium",
  "employer_free",
  "employer_pro",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "expired",
  "cancelled",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "pvit",
  "manual",
]);

export const paymentOperatorEnum = pgEnum("payment_operator", [
  "airtel_money",
  "moov_money",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "profile_viewed",
  "application_sent",
  "subscription_expired",
  "quota_reached",
  "payment_success",
  "payment_failed",
]);

// =========================================================================
// USERS (extension of Supabase auth.users)
// =========================================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    phone: varchar("phone", { length: 32 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    role: roleEnum("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    phoneUnique: uniqueIndex("users_phone_unique").on(t.phone),
    emailUnique: uniqueIndex("users_email_unique").on(t.email),
  }),
);

// =========================================================================
// SKILLS (global catalog)
// =========================================================================

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 64 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugUnique: uniqueIndex("skills_slug_unique").on(t.slug),
  }),
);

// =========================================================================
// CANDIDATE
// =========================================================================

export const candidateProfiles = pgTable("candidate_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 64 }).notNull(),
  lastName: varchar("last_name", { length: 64 }).notNull(),
  city: varchar("city", { length: 80 }),
  whatsappPhone: varchar("whatsapp_phone", { length: 32 }),
  profession: varchar("profession", { length: 120 }),
  summary: text("summary"),
  experienceLevel: experienceLevelEnum("experience_level"),
  availability: availabilityEnum("availability"),
  photoUrl: text("photo_url"),
  cvUrl: text("cv_url"),
  isBoosted: boolean("is_boosted").notNull().default(false),
  boostedUntil: timestamp("boosted_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const candidateExperiences = pgTable("candidate_experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
  title: varchar("title", { length: 120 }).notNull(),
  company: varchar("company", { length: 120 }).notNull(),
  city: varchar("city", { length: 80 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  current: boolean("current").notNull().default(false),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const candidateEducations = pgTable("candidate_educations", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
  degree: varchar("degree", { length: 160 }).notNull(),
  school: varchar("school", { length: 160 }).notNull(),
  startYear: integer("start_year"),
  endYear: integer("end_year"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const candidateSkills = pgTable(
  "candidate_skills",
  {
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.candidateId, t.skillId] }),
    // skill_id seul pour les filtrages inArray(skillId, …) dans searchCandidates.
    skillIdx: index("candidate_skills_skill_idx").on(t.skillId),
  }),
);

// =========================================================================
// EMPLOYER
// =========================================================================

export const employerProfiles = pgTable("employer_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 160 }).notNull(),
  city: varchar("city", { length: 80 }),
  whatsappPhone: varchar("whatsapp_phone", { length: 32 }),
  description: text("description"),
  logoUrl: text("logo_url"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// =========================================================================
// JOB OFFERS
// =========================================================================

export const jobOffers = pgTable(
  "job_offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => employerProfiles.userId, { onDelete: "cascade" }),
    type: jobTypeEnum("type").notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    city: varchar("city", { length: 80 }),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryLabel: varchar("salary_label", { length: 80 }),
    description: text("description").notNull(),
    imageUrl: text("image_url"),
    status: jobStatusEnum("status").notNull().default("active"),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    // Composite status + publishedAt couvre WHERE status='active' ORDER BY published_at DESC
    // utilisé dans listActiveJobOffers et recommendJobOffers.
    statusPublishedIdx: index("job_offers_status_published_idx").on(t.status, t.publishedAt),
    cityIdx: index("job_offers_city_idx").on(t.city),
    employerIdx: index("job_offers_employer_idx").on(t.employerId),
  }),
);

export const jobOfferSkills = pgTable(
  "job_offer_skills",
  {
    jobOfferId: uuid("job_offer_id")
      .notNull()
      .references(() => jobOffers.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.jobOfferId, t.skillId] }),
    // skill_id seul pour les jointures dans recommendJobOffers (sous-requête corrélée).
    skillIdx: index("job_offer_skills_skill_idx").on(t.skillId),
  }),
);

export const jobOfferMissions = pgTable("job_offer_missions", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobOfferId: uuid("job_offer_id")
    .notNull()
    .references(() => jobOffers.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  text: text("text").notNull(),
});

// =========================================================================
// APPLICATIONS
// =========================================================================

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
    jobOfferId: uuid("job_offer_id")
      .notNull()
      .references(() => jobOffers.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
  },
  (t) => ({
    uniquePair: uniqueIndex("applications_unique_pair").on(
      t.candidateId,
      t.jobOfferId,
    ),
    candidateIdx: index("applications_candidate_idx").on(t.candidateId),
    jobIdx: index("applications_job_idx").on(t.jobOfferId),
  }),
);

// =========================================================================
// EMPLOYER ↔ CANDIDATE INTERACTIONS
// =========================================================================

export const profileViews = pgTable(
  "profile_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => employerProfiles.userId, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    employerIdx: index("profile_views_employer_idx").on(t.employerId),
    candidateIdx: index("profile_views_candidate_idx").on(t.candidateId),
  }),
);

export const whatsappContacts = pgTable(
  "whatsapp_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => employerProfiles.userId, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidateProfiles.userId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    employerIdx: index("whatsapp_contacts_employer_idx").on(t.employerId),
  }),
);

// =========================================================================
// PAYMENTS & SUBSCRIPTIONS
// =========================================================================

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: subscriptionPlanEnum("plan").notNull(),
    amount: integer("amount").notNull(),
    provider: paymentProviderEnum("provider").notNull().default("pvit"),
    operator: paymentOperatorEnum("operator"),
    phone: varchar("phone", { length: 32 }),
    status: paymentStatusEnum("status").notNull().default("pending"),
    pvitMerchantReference: varchar("pvit_merchant_reference", { length: 80 })
      .notNull(),
    pvitTransactionId: varchar("pvit_transaction_id", { length: 80 }),
    rawResponse: jsonb("raw_response"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    merchantRefUnique: uniqueIndex("payments_merchant_ref_unique").on(
      t.pvitMerchantReference,
    ),
    userIdx: index("payments_user_idx").on(t.userId),
  }),
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: subscriptionPlanEnum("plan").notNull(),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    paymentId: uuid("payment_id").references(() => payments.id),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => ({
    userActiveIdx: index("subscriptions_user_active_idx").on(t.userId, t.status),
  }),
);

// =========================================================================
// NOTIFICATIONS
// =========================================================================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userUnreadIdx: index("notifications_user_unread_idx").on(t.userId, t.isRead),
  }),
);

// =========================================================================
// RELATIONS
// =========================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  candidate: one(candidateProfiles, {
    fields: [users.id],
    references: [candidateProfiles.userId],
  }),
  employer: one(employerProfiles, {
    fields: [users.id],
    references: [employerProfiles.userId],
  }),
  payments: many(payments),
  subscriptions: many(subscriptions),
  notifications: many(notifications),
}));

export const candidateProfilesRelations = relations(
  candidateProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [candidateProfiles.userId],
      references: [users.id],
    }),
    experiences: many(candidateExperiences),
    educations: many(candidateEducations),
    skills: many(candidateSkills),
    applications: many(applications),
  }),
);

export const employerProfilesRelations = relations(
  employerProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [employerProfiles.userId],
      references: [users.id],
    }),
    jobOffers: many(jobOffers),
  }),
);

export const jobOffersRelations = relations(jobOffers, ({ one, many }) => ({
  employer: one(employerProfiles, {
    fields: [jobOffers.employerId],
    references: [employerProfiles.userId],
  }),
  skills: many(jobOfferSkills),
  missions: many(jobOfferMissions),
  applications: many(applications),
}));

export const candidateSkillsRelations = relations(candidateSkills, ({ one }) => ({
  candidate: one(candidateProfiles, {
    fields: [candidateSkills.candidateId],
    references: [candidateProfiles.userId],
  }),
  skill: one(skills, {
    fields: [candidateSkills.skillId],
    references: [skills.id],
  }),
}));

export const jobOfferSkillsRelations = relations(jobOfferSkills, ({ one }) => ({
  jobOffer: one(jobOffers, {
    fields: [jobOfferSkills.jobOfferId],
    references: [jobOffers.id],
  }),
  skill: one(skills, {
    fields: [jobOfferSkills.skillId],
    references: [skills.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  candidate: one(candidateProfiles, {
    fields: [applications.candidateId],
    references: [candidateProfiles.userId],
  }),
  jobOffer: one(jobOffers, {
    fields: [applications.jobOfferId],
    references: [jobOffers.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  payment: one(payments, {
    fields: [subscriptions.paymentId],
    references: [payments.id],
  }),
}));
