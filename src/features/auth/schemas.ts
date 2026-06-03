import { z } from "zod";

/**
 * Gabon phone format:
 *  - International: +241 followed by 8 or 9 digits (mobile)
 *  - Local: 0 followed by 7 or 8 digits
 *  Whitespace is stripped before validation.
 */
const phoneRegex = /^(\+241|0)\d{7,9}$/;

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, ""))
  .pipe(
    z
      .string()
      .regex(phoneRegex, "Format invalide. Ex: +24107000000 ou 077000000"),
  );

const passwordSchema = z
  .string()
  .min(8, "Au moins 8 caractères")
  .max(72, "Trop long");

const cityMinSchema = z.string().trim().min(2, "Ville requise").max(80);

export const registerCandidateSchema = z
  .object({
    firstName: z.string().trim().min(1, "Prénom requis").max(64),
    lastName: z.string().trim().min(1, "Nom requis").max(64),
    phone: phoneSchema,
    email: z.string().trim().email("Email invalide"),
    city: cityMinSchema,
    profession: z.string().trim().max(120).optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterCandidateInput = z.infer<typeof registerCandidateSchema>;

export const registerEmployerSchema = z
  .object({
    companyName: z.string().trim().min(2, "Nom requis").max(160),
    phone: phoneSchema,
    email: z.string().trim().email("Email invalide"),
    city: cityMinSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterEmployerInput = z.infer<typeof registerEmployerSchema>;

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;
