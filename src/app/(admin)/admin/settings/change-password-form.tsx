"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IconInput } from "@/components/shared/IconInput";
import { Button } from "@/components/ui/button";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/features/auth/schemas";
import { changePassword } from "@/features/auth/actions";

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
  });

  const onSubmit = (values: ChangePasswordInput) => {
    startTransition(async () => {
      const result = await changePassword(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Mot de passe modifié");
      reset();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <IconInput
        icon={<KeyRound className="w-4 h-4" />}
        label="Mot de passe actuel"
        placeholder="Votre mot de passe actuel"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <IconInput
        icon={<Lock className="w-4 h-4" />}
        label="Nouveau mot de passe"
        placeholder="Au moins 8 caractères"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <IconInput
        icon={<Lock className="w-4 h-4" />}
        label="Confirmer le nouveau mot de passe"
        placeholder="Retaper le nouveau mot de passe"
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
        {isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
        {isPending ? "Modification..." : "Modifier le mot de passe"}
      </Button>
    </form>
  );
}
