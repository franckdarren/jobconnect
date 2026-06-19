"use client";

import { useEffect, useRef, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, Lock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IconInput } from "@/components/shared/IconInput";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { login } from "@/features/auth/actions";

export function LoginForm() {
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const noticeShown = useRef(false);

  useEffect(() => {
    if (noticeShown.current) return;
    if (params.get("deleted") === "1") {
      noticeShown.current = true;
      toast.success("Votre compte a bien été supprimé.");
    } else if (params.get("suspended") === "1") {
      noticeShown.current = true;
      toast.error("Compte suspendu, contactez le support.");
    }
  }, [params]);

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
      // On success the action redirects server-side (cookies + navigation in
      // one response), so it only ever returns when there is an error.
      const result = await login(values, params.get("redirect") ?? undefined);
      if (result && !result.success) {
        toast.error(result.error);
      }
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
        {isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
        {isPending ? "Connexion..." : "Se connecter"}
        {!isPending ? <ArrowRight className="w-4 h-4 ml-1" /> : null}
      </Button>
    </form>
  );
}
