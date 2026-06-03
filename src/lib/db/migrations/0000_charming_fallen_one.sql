CREATE TYPE "public"."application_status" AS ENUM('pending', 'viewed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."availability" AS ENUM('immediate', '15_days', '30_days');--> statement-breakpoint
CREATE TYPE "public"."experience_level" AS ENUM('beginner', '1_3', '3_5', '5_plus');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('active', 'closed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('job', 'internship', 'freelance');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('profile_viewed', 'application_sent', 'subscription_expired', 'quota_reached', 'payment_success', 'payment_failed');--> statement-breakpoint
CREATE TYPE "public"."payment_operator" AS ENUM('airtel_money', 'moov_money');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('pvit', 'manual');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('candidate', 'employer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('candidate_free', 'candidate_premium', 'employer_free', 'employer_pro');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"job_offer_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"viewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "candidate_educations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"degree" varchar(160) NOT NULL,
	"school" varchar(160) NOT NULL,
	"start_year" integer,
	"end_year" integer,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"company" varchar(120) NOT NULL,
	"city" varchar(80),
	"start_date" date NOT NULL,
	"end_date" date,
	"current" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(64) NOT NULL,
	"last_name" varchar(64) NOT NULL,
	"city" varchar(80),
	"whatsapp_phone" varchar(32),
	"profession" varchar(120),
	"summary" text,
	"experience_level" "experience_level",
	"availability" "availability",
	"photo_url" text,
	"cv_url" text,
	"is_boosted" boolean DEFAULT false NOT NULL,
	"boosted_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_skills" (
	"candidate_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "candidate_skills_candidate_id_skill_id_pk" PRIMARY KEY("candidate_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "employer_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"company_name" varchar(160) NOT NULL,
	"city" varchar(80),
	"whatsapp_phone" varchar(32),
	"description" text,
	"logo_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_offer_missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_offer_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_offer_skills" (
	"job_offer_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "job_offer_skills_job_offer_id_skill_id_pk" PRIMARY KEY("job_offer_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "job_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid NOT NULL,
	"type" "job_type" NOT NULL,
	"title" varchar(160) NOT NULL,
	"city" varchar(80),
	"salary_min" integer,
	"salary_max" integer,
	"salary_label" varchar(80),
	"description" text NOT NULL,
	"image_url" text,
	"status" "job_status" DEFAULT 'active' NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(160) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"amount" integer NOT NULL,
	"provider" "payment_provider" DEFAULT 'pvit' NOT NULL,
	"operator" "payment_operator",
	"phone" varchar(32),
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"pvit_merchant_reference" varchar(80) NOT NULL,
	"pvit_transaction_id" varchar(80),
	"raw_response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profile_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL,
	"slug" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"payment_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"phone" varchar(32) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_candidate_profiles_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_offer_id_job_offers_id_fk" FOREIGN KEY ("job_offer_id") REFERENCES "public"."job_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_educations" ADD CONSTRAINT "candidate_educations_candidate_id_candidate_profiles_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_experiences" ADD CONSTRAINT "candidate_experiences_candidate_id_candidate_profiles_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_candidate_id_candidate_profiles_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_offer_missions" ADD CONSTRAINT "job_offer_missions_job_offer_id_job_offers_id_fk" FOREIGN KEY ("job_offer_id") REFERENCES "public"."job_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_offer_skills" ADD CONSTRAINT "job_offer_skills_job_offer_id_job_offers_id_fk" FOREIGN KEY ("job_offer_id") REFERENCES "public"."job_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_offer_skills" ADD CONSTRAINT "job_offer_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_offers" ADD CONSTRAINT "job_offers_employer_id_employer_profiles_user_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employer_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_employer_id_employer_profiles_user_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employer_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_candidate_id_candidate_profiles_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_employer_id_employer_profiles_user_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employer_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_candidate_id_candidate_profiles_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "applications_unique_pair" ON "applications" USING btree ("candidate_id","job_offer_id");--> statement-breakpoint
CREATE INDEX "applications_candidate_idx" ON "applications" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "applications_job_idx" ON "applications" USING btree ("job_offer_id");--> statement-breakpoint
CREATE INDEX "job_offers_status_idx" ON "job_offers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_offers_city_idx" ON "job_offers" USING btree ("city");--> statement-breakpoint
CREATE INDEX "job_offers_employer_idx" ON "job_offers" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_merchant_ref_unique" ON "payments" USING btree ("pvit_merchant_reference");--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profile_views_employer_idx" ON "profile_views" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "profile_views_candidate_idx" ON "profile_views" USING btree ("candidate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_slug_unique" ON "skills" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "subscriptions_user_active_idx" ON "subscriptions" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "whatsapp_contacts_employer_idx" ON "whatsapp_contacts" USING btree ("employer_id");