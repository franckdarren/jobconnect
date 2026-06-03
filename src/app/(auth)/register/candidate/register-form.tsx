"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, MapPin, UserCog, User, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { IconInput } from "@/components/shared/IconInput";
import { Button } from "@/components/ui/button";
import {
  registerCandidateSchema,
  type RegisterCandidateInput,
} from "@/features/auth/schemas";
import { registerCandidate } from "@/features/auth/actions";

export function RegisterCandidateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSecondary, setShowSecondary] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<RegisterCandidateInput>({
    resolver: zodResolver(registerCandidateSchema),
    mode: "onTouched",
  });

  const onContinue = async () => {
    const ok = await trigger(["phone", "city", "profession"]);
    if (ok) setShowSecondary(true);
  };

  const onSubmit = (values: RegisterCandidateInput) => {
    startTransition(async () => {
      const result = await registerCandidate(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Compte créé ! Vérifiez votre boîte mail.");
      router.push("/confirm");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <IconInput
        icon={<Phone className="w-4 h-4" />}
        label="Numéro WhatsApp"
        placeholder="066 12 34 56"
        inputMode="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <IconInput
        icon={<MapPin className="w-4 h-4" />}
        label="Ville"
        placeholder="Ex: Libreville, Port-Gentil..."
        autoComplete="address-level2"
        error={errors.city?.message}
        {...register("city")}
      />
      <IconInput
        icon={<UserCog className="w-4 h-4" />}
        label="Profession recherchée"
        placeholder="Ex: Chauffeur, Vendeuse, Comptable..."
        error={errors.profession?.message}
        {...register("profession")}
      />

      {!showSecondary ? (
        <Button
          type="button"
          onClick={onContinue}
          className="w-full h-12 bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white font-semibold text-base rounded-xl"
        >
          Créer mon profil gratuit
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      ) : (
        <div className="space-y-4 pt-2 border-t border-black/[0.04]">
          <div className="grid grid-cols-2 gap-3">
            <IconInput
              icon={<User className="w-4 h-4" />}
              label="Prénom"
              placeholder="Jean"
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <IconInput
              icon={<User className="w-4 h-4" />}
              label="Nom"
              placeholder="Koffi"
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>
          <IconInput
            icon={<Mail className="w-4 h-4" />}
            label="Email (pour confirmation)"
            placeholder="vous@exemple.com"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <IconInput
            icon={<Lock className="w-4 h-4" />}
            label="Mot de passe"
            placeholder="Au moins 8 caractères"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <IconInput
            icon={<Lock className="w-4 h-4" />}
            label="Confirmer le mot de passe"
            placeholder="Retaper le mot de passe"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white font-semibold text-base rounded-xl"
          >
            {isPending ? "Création..." : "Créer mon profil gratuit"}
            {!isPending ? <ArrowRight className="w-4 h-4 ml-1" /> : null}
          </Button>
        </div>
      )}
    </form>
  );
}
