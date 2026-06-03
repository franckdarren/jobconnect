import { z } from "zod";

const phoneRegex = /^(\+241|0)\d{7,9}$/;

const optionalPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, ""))
  .pipe(z.string().regex(phoneRegex, "Format invalide"))
  .optional()
  .or(z.literal(""));

export const updateEmployerProfileSchema = z.object({
  companyName: z.string().trim().min(2, "Nom requis").max(160),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  whatsappPhone: optionalPhone,
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type UpdateEmployerProfileInput = z.infer<
  typeof updateEmployerProfileSchema
>;
