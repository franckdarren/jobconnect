"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Briefcase,
  Hammer,
  GraduationCap,
  MapPin,
  Banknote,
  FileUp,
  X,
  Plus,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconInput } from "@/components/shared/IconInput";
import {
  createJobOfferSchema,
  type CreateJobOfferInput,
} from "@/features/jobs/schemas";
import {
  createJobOffer,
  updateJobOffer,
  uploadJobImage,
} from "@/features/jobs/actions";
import { getOrCreateSkill } from "@/features/candidates/actions";
import { cn } from "@/lib/utils";

type SkillOption = { id: string; name: string };

type JobFormProps = {
  mode: "create" | "edit";
  jobId?: string;
  defaults?: Partial<CreateJobOfferInput> & {
    skills?: SkillOption[];
  };
};

const TYPE_OPTIONS: { value: "job" | "internship" | "freelance"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "job", label: "Job", icon: Briefcase },
  { value: "internship", label: "Stage", icon: GraduationCap },
  { value: "freelance", label: "Freelance", icon: Hammer },
];

export function JobForm({ mode, jobId, defaults }: JobFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [skills, setSkills] = useState<SkillOption[]>(defaults?.skills ?? []);
  const [skillDraft, setSkillDraft] = useState("");
  const [missions, setMissions] = useState<string[]>(defaults?.missions ?? []);
  const [missionDraft, setMissionDraft] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(
    defaults?.imageUrl ?? null,
  );
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateJobOfferInput>({
    resolver: zodResolver(createJobOfferSchema),
    defaultValues: {
      type: defaults?.type ?? "job",
      title: defaults?.title ?? "",
      city: defaults?.city ?? "",
      description: defaults?.description ?? "",
      salaryLabel: defaults?.salaryLabel ?? "",
      salaryMin: defaults?.salaryMin,
      salaryMax: defaults?.salaryMax,
      expiresAt: defaults?.expiresAt ?? "",
      skillIds: (defaults?.skills ?? []).map((s) => s.id),
      missions: defaults?.missions ?? [],
    },
  });

  const type = watch("type");

  const onAddSkill = async () => {
    const name = skillDraft.trim();
    if (!name) return;
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setSkillDraft("");
      return;
    }
    const res = await getOrCreateSkill(name);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    const next = [...skills, res.data];
    setSkills(next);
    setValue(
      "skillIds",
      next.map((s) => s.id),
      { shouldDirty: true },
    );
    setSkillDraft("");
  };

  const removeSkill = (id: string) => {
    const next = skills.filter((s) => s.id !== id);
    setSkills(next);
    setValue(
      "skillIds",
      next.map((s) => s.id),
      { shouldDirty: true },
    );
  };

  const onAddMission = () => {
    const text = missionDraft.trim();
    if (!text) return;
    const next = [...missions, text];
    setMissions(next);
    setValue("missions", next, { shouldDirty: true });
    setMissionDraft("");
  };

  const removeMission = (idx: number) => {
    const next = missions.filter((_, i) => i !== idx);
    setMissions(next);
    setValue("missions", next, { shouldDirty: true });
  };

  const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadJobImage(fd);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setImageUrl(res.data.url);
    setValue("imageUrl", res.data.url, { shouldDirty: true });
    toast.success("Image téléversée");
  };

  const onSubmit = (values: CreateJobOfferInput) => {
    startTransition(async () => {
      const payload = {
        ...values,
        skillIds: skills.map((s) => s.id),
        missions,
        imageUrl: imageUrl ?? "",
      };
      if (mode === "create") {
        const res = await createJobOffer(payload);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        toast.success("Offre publiée");
        router.push(`/jobs/${res.data.id}`);
        router.refresh();
        return;
      }
      const res = await updateJobOffer({ ...payload, id: jobId! });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Offre mise à jour");
      router.push(`/jobs/${jobId}`);
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
        <h1 className="text-2xl font-bold">
          {mode === "create" ? "Nouvelle offre" : "Modifier l'offre"}
        </h1>
        <span className="w-7" />
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ===== Type d'offre ===== */}
        <section className="jc-card p-5 space-y-3">
          <p className="block text-xs font-semibold text-jc-text-primary">
            Type d&apos;offre
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setValue("type", opt.value, { shouldDirty: true })
                  }
                  className={cn(
                    "h-11 rounded-xl flex items-center justify-center gap-1 text-sm font-semibold transition-colors",
                    active
                      ? "bg-jc-primary-dark text-white"
                      : "bg-white border border-black/[0.08] text-jc-text-primary",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          <IconInput
            label="Titre du poste"
            placeholder="Ex: Développeur Fullstack Senior"
            error={errors.title?.message}
            {...register("title")}
          />

          {/* Cover image */}
          <div>
            <p className="block text-xs font-semibold text-jc-text-primary mb-1.5">
              Image de couverture (facultatif)
            </p>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-jc-text-muted/40 bg-white py-3 flex items-center justify-center gap-2 text-sm text-jc-text-secondary"
            >
              {imageUrl ? (
                <>
                  <ImageIcon className="w-4 h-4 text-jc-primary-green" />
                  Image téléversée — Remplacer
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4" />
                  Choisir un fichier
                </>
              )}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={onImageChange}
            />
          </div>

          <IconInput
            icon={<MapPin className="w-4 h-4" />}
            label="Localisation (facultatif)"
            placeholder="Ville, Pays"
            error={errors.city?.message}
            {...register("city")}
          />
          <IconInput
            icon={<Banknote className="w-4 h-4" />}
            label="Salaire (label affiché)"
            placeholder="Ex: 500k - 800k FCFA"
            error={errors.salaryLabel?.message}
            {...register("salaryLabel")}
          />
          <div className="grid grid-cols-2 gap-3">
            <IconInput
              label="Min (FCFA)"
              type="number"
              placeholder="500000"
              error={errors.salaryMin?.message}
              {...register("salaryMin", { valueAsNumber: true })}
            />
            <IconInput
              label="Max (FCFA)"
              type="number"
              placeholder="800000"
              error={errors.salaryMax?.message}
              {...register("salaryMax", { valueAsNumber: true })}
            />
          </div>
        </section>

        {/* ===== Description ===== */}
        <section className="jc-card p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-jc-text-primary mb-1.5">
              Description du rôle
            </label>
            <Textarea
              placeholder="Décrivez les missions et responsabilités..."
              className="min-h-28 bg-[#f0f4f8] border-none focus-visible:ring-2 focus-visible:ring-jc-primary-green/40"
              {...register("description")}
            />
            {errors.description ? (
              <p className="mt-1 text-xs text-jc-warning">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          {/* ===== Compétences requises ===== */}
          <div>
            <p className="block text-xs font-semibold text-jc-text-primary mb-1.5">
              Compétences requises
            </p>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => removeSkill(s.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-jc-background border border-black/[0.06] text-jc-text-primary text-xs font-medium px-3 py-1.5"
                  >
                    {s.name}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex gap-2">
              <input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void onAddSkill();
                  }
                }}
                placeholder="Ajouter une compétence..."
                className="flex-1 h-11 rounded-xl bg-[#f0f4f8] px-3 text-sm outline-none"
              />
              <Button
                type="button"
                onClick={onAddSkill}
                className="rounded-xl bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white px-4"
              >
                Ajouter
              </Button>
            </div>
          </div>

          {/* ===== Missions ===== */}
          <div>
            <p className="block text-xs font-semibold text-jc-text-primary mb-1.5">
              Missions
            </p>
            {missions.length > 0 ? (
              <ul className="space-y-2 mb-2">
                {missions.map((m, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 rounded-xl bg-[#f0f4f8] px-3 py-2 text-sm"
                  >
                    <button
                      type="button"
                      onClick={() => removeMission(idx)}
                      className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-jc-primary-green text-white flex items-center justify-center"
                      aria-label="Retirer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="flex-1">{m}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex gap-2">
              <input
                value={missionDraft}
                onChange={(e) => setMissionDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddMission();
                  }
                }}
                placeholder="Décrire une mission..."
                className="flex-1 h-11 rounded-xl bg-[#f0f4f8] px-3 text-sm outline-none"
              />
              <Button
                type="button"
                onClick={onAddMission}
                className="rounded-xl bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white px-4"
              >
                <Plus className="w-3 h-3 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>
        </section>

        {/* ===== Bottom CTA ===== */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-12 rounded-xl"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="h-12 rounded-xl bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white font-semibold"
          >
            {isPending
              ? "..."
              : mode === "create"
                ? "Publier l'offre"
                : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
