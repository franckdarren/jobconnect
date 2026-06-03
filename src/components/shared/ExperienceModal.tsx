"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { IconInput } from "@/components/shared/IconInput";
import {
  addExperienceSchema,
  type AddExperienceInput,
} from "@/features/candidates/schemas";
import {
  addExperience,
  updateExperience,
} from "@/features/candidates/actions";

type ExperienceLike = {
  id?: string;
  title?: string;
  company?: string;
  city?: string | null;
  startDate?: string;
  endDate?: string | null;
  current?: boolean;
  description?: string | null;
};

type ExperienceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: ExperienceLike | null;
};

export function ExperienceModal({
  open,
  onOpenChange,
  experience,
}: ExperienceModalProps) {
  const isEdit = !!experience?.id;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddExperienceInput>({
    resolver: zodResolver(addExperienceSchema),
    defaultValues: {
      title: experience?.title ?? "",
      company: experience?.company ?? "",
      city: experience?.city ?? "",
      startDate: experience?.startDate ?? "",
      endDate: experience?.endDate ?? "",
      current: experience?.current ?? false,
      description: experience?.description ?? "",
    },
  });

  const current = watch("current");

  const onSubmit = (values: AddExperienceInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateExperience({ ...values, id: experience!.id! })
        : await addExperience(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Expérience modifiée" : "Expérience ajoutée");
      reset();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-black/[0.04]">
          <DialogTitle className="text-xl font-bold">
            {isEdit ? "Modifier l'expérience" : "Ajouter une expérience"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-6 pt-4 pb-2 space-y-3"
        >
          <IconInput
            label="Titre du poste"
            placeholder="ex: Développeur React Native"
            error={errors.title?.message}
            {...register("title")}
          />
          <IconInput
            label="Entreprise"
            placeholder="Nom de la société"
            error={errors.company?.message}
            {...register("company")}
          />
          <IconInput
            icon={<MapPin className="w-4 h-4" />}
            label="Ville"
            placeholder="ex: Libreville, Gabon"
            error={errors.city?.message}
            {...register("city")}
          />
          <div className="grid grid-cols-2 gap-3">
            <IconInput
              label="Date de début"
              type="date"
              error={errors.startDate?.message}
              {...register("startDate")}
            />
            <IconInput
              label="Date de fin"
              type="date"
              disabled={current}
              error={errors.endDate?.message}
              {...register("endDate")}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-jc-text-primary">
            <Checkbox
              checked={current}
              onCheckedChange={(c) => setValue("current", c === true)}
            />
            Je suis actuellement à ce poste
          </label>
          <div>
            <label className="block text-xs font-semibold text-jc-text-primary mb-1.5">
              Description des missions
            </label>
            <Textarea
              placeholder="Qu'avez-vous accompli dans ce rôle ?"
              className="min-h-24 bg-[#f0f4f8] border-none focus-visible:ring-2 focus-visible:ring-jc-primary-green/40"
              {...register("description")}
            />
          </div>

          <DialogFooter className="px-0 pt-3 -mx-6 -mb-2 px-6 pb-4 border-t border-black/[0.04] bg-jc-background flex flex-row gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-6"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-full px-6 bg-jc-primary-green hover:bg-jc-primary-green/90 text-white"
            >
              {isPending ? "..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
