import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;

export type CandidateProfile = InferSelectModel<typeof schema.candidateProfiles>;
export type NewCandidateProfile = InferInsertModel<typeof schema.candidateProfiles>;

export type CandidateExperience = InferSelectModel<typeof schema.candidateExperiences>;
export type NewCandidateExperience = InferInsertModel<typeof schema.candidateExperiences>;

export type CandidateEducation = InferSelectModel<typeof schema.candidateEducations>;
export type NewCandidateEducation = InferInsertModel<typeof schema.candidateEducations>;

export type EmployerProfile = InferSelectModel<typeof schema.employerProfiles>;
export type NewEmployerProfile = InferInsertModel<typeof schema.employerProfiles>;

export type Skill = InferSelectModel<typeof schema.skills>;
export type NewSkill = InferInsertModel<typeof schema.skills>;

export type JobOffer = InferSelectModel<typeof schema.jobOffers>;
export type NewJobOffer = InferInsertModel<typeof schema.jobOffers>;

export type JobOfferMission = InferSelectModel<typeof schema.jobOfferMissions>;
export type NewJobOfferMission = InferInsertModel<typeof schema.jobOfferMissions>;

export type Application = InferSelectModel<typeof schema.applications>;
export type NewApplication = InferInsertModel<typeof schema.applications>;

export type ProfileView = InferSelectModel<typeof schema.profileViews>;
export type WhatsappContact = InferSelectModel<typeof schema.whatsappContacts>;

export type Payment = InferSelectModel<typeof schema.payments>;
export type NewPayment = InferInsertModel<typeof schema.payments>;

export type Subscription = InferSelectModel<typeof schema.subscriptions>;
export type NewSubscription = InferInsertModel<typeof schema.subscriptions>;

export type Notification = InferSelectModel<typeof schema.notifications>;
export type NewNotification = InferInsertModel<typeof schema.notifications>;
