DROP INDEX "job_offers_status_idx";--> statement-breakpoint
CREATE INDEX "candidate_skills_skill_idx" ON "candidate_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "job_offer_skills_skill_idx" ON "job_offer_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "job_offers_status_published_idx" ON "job_offers" USING btree ("status","published_at");