import { z } from "zod";

export const jobTypeEnum = z.enum(["job", "internship", "freelance"]);

export const createJobOfferSchema = z.object({
  type: jobTypeEnum,
  title: z.string().trim().min(1, "Titre requis").max(160),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  salaryMin: z.number().int().min(0).max(100_000_000).optional(),
  salaryMax: z.number().int().min(0).max(100_000_000).optional(),
  salaryLabel: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().min(10, "Description trop courte").max(5000),
  imageUrl: z.string().url().optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
  skillIds: z.array(z.string().uuid()).max(15, "15 compétences max"),
  missions: z
    .array(z.string().trim().min(1).max(500))
    .max(20, "20 missions max"),
});
export type CreateJobOfferInput = z.infer<typeof createJobOfferSchema>;

export const updateJobOfferSchema = createJobOfferSchema.and(
  z.object({ id: z.string().uuid() }),
);
export type UpdateJobOfferInput = z.infer<typeof updateJobOfferSchema>;

export const listActiveJobsFiltersSchema = z.object({
  city: z.string().trim().max(80).optional(),
  type: jobTypeEnum.optional(),
  q: z.string().trim().max(120).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
});
export type ListActiveJobsFilters = z.infer<typeof listActiveJobsFiltersSchema>;
