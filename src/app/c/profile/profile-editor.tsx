"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Camera,
  MapPin,
  MessageSquare,
  Save,
  FileUp,
  FileText,
  Pencil,
  Trash2,
  Plus,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconInput } from "@/components/shared/IconInput";
import { ExperienceModal } from "@/components/shared/ExperienceModal";
import { EducationModal } from "@/components/shared/EducationModal";
import { SkillsModal } from "@/components/shared/SkillsModal";
import {
  updateCandidateProfileSchema,
  type UpdateCandidateProfileInput,
} from "@/features/candidates/schemas";
import {
  deleteEducation,
  deleteExperience,
  getCvSignedUrl,
  updateProfile,
  uploadAvatar,
  uploadCv,
} from "@/features/candidates/actions";
import type {
  CandidateProfile,
  CandidateExperience,
  CandidateEducation,
  Skill,
} from "@/types/database";

type ProfileEditorProps = {
  profile: CandidateProfile;
  experiences: CandidateExperience[];
  educations: CandidateEducation[];
  skills: Skill[];
  phone: string;
};

function formatMonthYear(value: string | null | undefined): string {
  if (!value) return "Présent";
  const d = new Date(value);
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

export function ProfileEditor({
  profile,
  experiences,
  educations,
  skills,
  phone,
}: ProfileEditorProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [isUploading, startUpload] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.photoUrl ?? null);
  const [cvName, setCvName] = useState<string | null>(
    profile.cvUrl ? profile.cvUrl.split("/").pop() ?? "CV.pdf" : null,
  );
  const [expModal, setExpModal] = useState<{
    open: boolean;
    item: CandidateExperience | null;
  }>({ open: false, item: null });
  const [eduModal, setEduModal] = useState<{
    open: boolean;
    item: CandidateEducation | null;
  }>({ open: false, item: null });
  const [skillsModal, setSkillsModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateCandidateProfileInput>({
    resolver: zodResolver(updateCandidateProfileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      city: profile.city ?? "",
      whatsappPhone: profile.whatsappPhone ?? phone,
      profession: profile.profession ?? "",
      summary: profile.summary ?? "",
      experienceLevel: profile.experienceLevel ?? "",
      availability: profile.availability ?? "",
    },
  });

  const onSubmit = (values: UpdateCandidateProfileInput) => {
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

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    startUpload(async () => {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadAvatar(fd);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        setAvatarUrl(res.data.url);
        toast.success("Photo mise à jour");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur lors de l'upload");
      }
    });
  };

  const onCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    startUpload(async () => {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadCv(fd);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        setCvName(file.name);
        toast.success("CV téléversé");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur lors de l'upload");
      }
    });
  };

  const openCv = () => {
    startUpload(async () => {
      try {
        const res = await getCvSignedUrl(120);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        window.open(res.data.url, "_blank", "noopener,noreferrer");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur inattendue");
      }
    });
  };

  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    "Mon profil";

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="flex items-center justify-between md:justify-start md:gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 -ml-1.5 text-jc-text-primary md:hidden"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold">Mon Profil</h1>
        <span className="w-7 md:hidden" />
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:max-w-3xl">
        {/* ===== Section : Photo + Infos perso ===== */}
        <section className="jc-card p-5 space-y-3">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-jc-primary-green/20">
                <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
                <AvatarFallback className="text-xl">
                  {fullName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label
                aria-label="Changer la photo"
                className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-jc-primary-green text-white flex items-center justify-center shadow-md cursor-pointer ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={onAvatarChange}
                />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <IconInput
              label="PRÉNOM"
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <IconInput
              label="NOM"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>
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
          <IconInput
            label="PROFESSION RECHERCHÉE"
            placeholder="Ex: Développeur, Chauffeur..."
            error={errors.profession?.message}
            {...register("profession")}
          />
        </section>

        {/* ===== Section : Résumé ===== */}
        <section className="jc-card p-5">
          <h2 className="text-lg font-bold mb-3">Résumé Professionnel</h2>
          <Textarea
            placeholder="Décrivez votre parcours en quelques lignes..."
            className="min-h-28 bg-[#f0f4f8] border-none focus-visible:ring-2 focus-visible:ring-jc-primary-green/40"
            {...register("summary")}
          />
        </section>

        {/* ===== Section : Disponibilité / Niveau ===== */}
        <section className="jc-card p-5 grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-jc-text-primary mb-1.5">
              NIVEAU
            </label>
            <select
              {...register("experienceLevel")}
              className="w-full min-w-0 h-12 rounded-xl bg-[#f0f4f8] px-3 text-sm"
            >
              <option value="">—</option>
              <option value="beginner">Débutant</option>
              <option value="1_3">1-3 ans</option>
              <option value="3_5">3-5 ans</option>
              <option value="5_plus">5+ ans</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-jc-text-primary mb-1.5">
              DISPONIBILITÉ
            </label>
            <select
              {...register("availability")}
              className="w-full min-w-0 h-12 rounded-xl bg-[#f0f4f8] px-3 text-sm"
            >
              <option value="">—</option>
              <option value="immediate">Immédiate</option>
              <option value="15_days">Sous 15 jours</option>
              <option value="30_days">Sous 30 jours</option>
            </select>
          </div>
        </section>

        {/* ===== Save button (sticky) ===== */}
        <Button
          type="submit"
          disabled={isSaving || !isDirty}
          className="w-full h-12 rounded-xl bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white font-semibold"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </form>

      <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
      {/* ===== Section : Compétences ===== */}
      <section className="jc-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Compétences</h2>
          <button
            type="button"
            onClick={() => setSkillsModal(true)}
            className="text-sm font-semibold text-jc-primary-green hover:underline"
          >
            + Ajouter
          </button>
        </div>
        {skills.length === 0 ? (
          <p className="text-sm text-jc-text-muted">Aucune compétence renseignée.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full bg-jc-primary-green text-white text-xs font-medium px-3 py-1.5"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ===== Section : Expériences ===== */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-bold">Expériences</h2>
          <Button
            type="button"
            size="sm"
            onClick={() => setExpModal({ open: true, item: null })}
            className="rounded-full bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white px-3 h-8"
          >
            <Plus className="w-3 h-3 mr-1" />
            Ajouter
          </Button>
        </div>
        <div className="space-y-3">
          {experiences.length === 0 ? (
            <p className="text-sm text-jc-text-muted px-1">
              Aucune expérience renseignée.
            </p>
          ) : (
            experiences.map((exp) => (
              <article
                key={exp.id}
                className="jc-card p-4 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{exp.title}</h3>
                  <p className="text-sm text-jc-text-secondary">{exp.company}</p>
                  <p className="text-[11px] uppercase tracking-wide text-jc-text-muted mt-1">
                    {formatMonthYear(exp.startDate)} —{" "}
                    {exp.current ? "Présent" : formatMonthYear(exp.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExpModal({ open: true, item: exp })}
                    aria-label="Modifier"
                    className="text-jc-text-secondary hover:text-jc-primary-green"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === exp.id}
                    onClick={async () => {
                      setDeletingId(exp.id);
                      const res = await deleteExperience(exp.id);
                      setDeletingId(null);
                      if (!res.success) {
                        toast.error(res.error);
                        return;
                      }
                      toast.success("Expérience supprimée");
                      router.refresh();
                    }}
                    aria-label="Supprimer"
                    className="text-jc-warning hover:opacity-80 disabled:opacity-40"
                  >
                    {deletingId === exp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* ===== Section : CV upload ===== */}
      <section className="rounded-2xl border-2 border-dashed border-jc-text-muted/30 bg-white p-6 flex flex-col items-center text-center">
        <div className="w-10 h-10 rounded-xl bg-jc-light-green flex items-center justify-center mb-2">
          <FileUp className="w-4 h-4 text-jc-primary-green" />
        </div>
        <p className="font-semibold">Téléverser mon CV</p>
        <p className="text-xs text-jc-text-muted">PDF, Max 5 MB</p>
        {cvName ? (
          <button
            type="button"
            onClick={openCv}
            disabled={isUploading}
            className="mt-3 inline-flex items-center gap-1 max-w-full text-sm font-medium text-jc-primary-green hover:underline disabled:opacity-60"
          >
            {isUploading ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <FileText className="w-4 h-4 shrink-0" />}
            <span className="truncate">{cvName}</span>
            {!isUploading && <Download className="w-3 h-3 ml-1 shrink-0" />}
          </button>
        ) : null}
        <label
          className={`mt-3 inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
        >
          {isUploading ? "Téléversement..." : cvName ? "Remplacer" : "Choisir un fichier"}
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            disabled={isUploading}
            onChange={onCvChange}
          />
        </label>
      </section>

      {/* ===== Section : Formations ===== */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-bold">Formations</h2>
          <Button
            type="button"
            size="sm"
            onClick={() => setEduModal({ open: true, item: null })}
            className="rounded-full bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white px-3 h-8"
          >
            <Plus className="w-3 h-3 mr-1" />
            Ajouter
          </Button>
        </div>
        <div className="space-y-3">
          {educations.length === 0 ? (
            <p className="text-sm text-jc-text-muted px-1">
              Aucune formation renseignée.
            </p>
          ) : (
            educations.map((edu) => (
              <article
                key={edu.id}
                className="jc-card p-4 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{edu.degree}</h3>
                  <p className="text-sm text-jc-text-secondary">{edu.school}</p>
                  <p className="text-[11px] uppercase tracking-wide text-jc-text-muted mt-1">
                    {edu.startYear ?? "—"} - {edu.endYear ?? "Présent"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEduModal({ open: true, item: edu })}
                    aria-label="Modifier"
                    className="text-jc-text-secondary hover:text-jc-primary-green"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === edu.id}
                    onClick={async () => {
                      setDeletingId(edu.id);
                      const res = await deleteEducation(edu.id);
                      setDeletingId(null);
                      if (!res.success) {
                        toast.error(res.error);
                        return;
                      }
                      toast.success("Formation supprimée");
                      router.refresh();
                    }}
                    aria-label="Supprimer"
                    className="text-jc-warning hover:opacity-80 disabled:opacity-40"
                  >
                    {deletingId === edu.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      </div>

      {/* ===== Modals ===== */}
      <ExperienceModal
        open={expModal.open}
        onOpenChange={(o) => setExpModal({ open: o, item: o ? expModal.item : null })}
        experience={
          expModal.item
            ? {
                id: expModal.item.id,
                title: expModal.item.title,
                company: expModal.item.company,
                city: expModal.item.city,
                startDate: expModal.item.startDate,
                endDate: expModal.item.endDate,
                current: expModal.item.current,
                description: expModal.item.description,
              }
            : null
        }
      />
      <EducationModal
        open={eduModal.open}
        onOpenChange={(o) => setEduModal({ open: o, item: o ? eduModal.item : null })}
        education={
          eduModal.item
            ? {
                id: eduModal.item.id,
                degree: eduModal.item.degree,
                school: eduModal.item.school,
                startYear: eduModal.item.startYear,
                endYear: eduModal.item.endYear,
                description: eduModal.item.description,
              }
            : null
        }
      />
      <SkillsModal
        open={skillsModal}
        onOpenChange={setSkillsModal}
        initialSkills={skills.map((s) => ({ id: s.id, name: s.name }))}
        suggestions={skills.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
