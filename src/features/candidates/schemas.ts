import { z } from "zod";

const phoneRegex = /^(\+241|0)\d{7,9}$/;

const optionalPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, ""))
  .pipe(z.string().regex(phoneRegex, "Format invalide"))
  .optional()
  .or(z.literal(""));

export const updateCandidateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(64),
  lastName: z.string().trim().min(1, "Nom requis").max(64),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  whatsappPhone: optionalPhone,
  profession: z.string().trim().max(120).optional().or(z.literal("")),
  summary: z.string().trim().max(2000).optional().or(z.literal("")),
  experienceLevel: z
    .enum(["beginner", "1_3", "3_5", "5_plus"])
    .optional()
    .or(z.literal("")),
  availability: z
    .enum(["immediate", "15_days", "30_days"])
    .optional()
    .or(z.literal("")),
});
export type UpdateCandidateProfileInput = z.infer<
  typeof updateCandidateProfileSchema
>;

export const addExperienceSchema = z
  .object({
    title: z.string().trim().min(1, "Titre requis").max(120),
    company: z.string().trim().min(1, "Entreprise requise").max(120),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    startDate: z.string().min(1, "Date de début requise"),
    endDate: z.string().optional().or(z.literal("")),
    current: z.boolean(),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine((d) => d.current || !!d.endDate, {
    message: "Date de fin requise (ou cocher 'actuellement à ce poste')",
    path: ["endDate"],
  });
export type AddExperienceInput = z.infer<typeof addExperienceSchema>;

export const updateExperienceSchema = addExperienceSchema.and(
  z.object({ id: z.string().uuid() }),
);
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;

export const addEducationSchema = z.object({
  degree: z.string().trim().min(1, "Diplôme requis").max(160),
  school: z.string().trim().min(1, "École requise").max(160),
  startYear: z.number().int().min(1950).max(2100).optional(),
  endYear: z.number().int().min(1950).max(2100).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type AddEducationInput = z.infer<typeof addEducationSchema>;

export const updateEducationSchema = addEducationSchema.and(
  z.object({ id: z.string().uuid() }),
);
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;

export const setSkillsSchema = z.object({
  skillIds: z.array(z.string().uuid()).max(30, "30 compétences max"),
});
export type SetSkillsInput = z.infer<typeof setSkillsSchema>;

export const getOrCreateSkillSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(64),
});
