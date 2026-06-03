"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { IconInput } from "@/components/shared/IconInput";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { login } from "@/features/auth/actions";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  const onSubmit = (values: LoginInput) => {
    startTransition(async () => {
      const result = await login(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const explicitRedirect = params.get("redirect");
      const fallback =
        result.data.role === "admin" ? "/admin/dashboard" : "/home";
      router.push(explicitRedirect ?? fallback);
      router.refresh();
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
        icon={<Lock className="w-4 h-4" />}
        label="Mot de passe"
        placeholder="Votre mot de passe"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white font-semibold text-base rounded-xl"
      >
        {isPending ? "Connexion..." : "Se connecter"}
        {!isPending ? <ArrowRight className="w-4 h-4 ml-1" /> : null}
      </Button>
    </form>
  );
}
