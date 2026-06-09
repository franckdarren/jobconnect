"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Building2,
  Camera,
  MapPin,
  MessageSquare,
  Save,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconInput } from "@/components/shared/IconInput";
import {
  updateEmployerProfileSchema,
  type UpdateEmployerProfileInput,
} from "@/features/employers/schemas";
import { updateProfile, uploadLogo } from "@/features/employers/actions";
import type { EmployerProfile } from "@/types/database";

type Props = {
  profile: EmployerProfile;
  phone: string;
};

export function EmployerProfileEditor({ profile, phone }: Props) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [isUploading, startUpload] = useTransition();
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl ?? null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateEmployerProfileInput>({
    resolver: zodResolver(updateEmployerProfileSchema),
    defaultValues: {
      companyName: profile.companyName,
      city: profile.city ?? "",
      whatsappPhone: profile.whatsappPhone ?? phone,
      description: profile.description ?? "",
    },
  });

  const onSubmit = (values: UpdateEmployerProfileInput) => {
    startSaving(async () => {
      const res = await updateProfile(values);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Profil mis à jour");
      router.refresh();
    });
  };

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    startUpload(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadLogo(fd);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setLogoUrl(res.data.url);
      toast.success("Logo mis à jour");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 -ml-1.5 text-jc-text-primary"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Mon Entreprise</h1>
        <span className="w-7" />
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ===== Section : Logo + identité ===== */}
        <section className="jc-card p-5 space-y-3">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-jc-primary-dark/10">
                <AvatarImage
                  src={logoUrl ?? undefined}
                  alt={profile.companyName}
                />
                <AvatarFallback>
                  <Building2 className="w-8 h-8 text-jc-text-muted" />
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-jc-primary-dark text-white flex items-center justify-center shadow-md disabled:opacity-60"
                aria-label="Changer le logo"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={onLogoChange}
              />
            </div>
            {profile.isVerified ? (
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-jc-primary-green">
                <BadgeCheck className="w-4 h-4" />
                Entreprise vérifiée
              </span>
            ) : null}
          </div>

          <IconInput
            icon={<Building2 className="w-4 h-4" />}
            label="NOM DE L'ENTREPRISE"
            placeholder="Eramet, BGFIBank..."
            error={errors.companyName?.message}
            {...register("companyName")}
          />
          <IconInput
            icon={<MapPin className="w-4 h-4" />}
            label="VILLE"
            placeholder="Libreville, Gabon"
            error={errors.city?.message}
            {...register("city")}
          />
          <IconInput
            icon={<MessageSquare className="w-4 h-4 text-jc-whatsapp" />}
            label="NUMÉRO WHATSAPP"
            placeholder="+241 077070707"
            inputMode="tel"
            error={errors.whatsappPhone?.message}
            {...register("whatsappPhone")}
          />
        </section>

        {/* ===== Section : Description ===== */}
        <section className="jc-card p-5">
          <h2 className="text-lg font-bold mb-3">Présentation</h2>
          <Textarea
            placeholder="Décrivez votre entreprise, vos valeurs, vos métiers..."
            className="min-h-28 bg-[#f0f4f8] border-none focus-visible:ring-2 focus-visible:ring-jc-primary-green/40"
            {...register("description")}
          />
        </section>

        <Button
          type="submit"
          disabled={isSaving || !isDirty}
          className="w-full h-12 rounded-xl bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white font-semibold"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </form>
    </div>
  );
}
