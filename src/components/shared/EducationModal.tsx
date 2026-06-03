"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconInput } from "@/components/shared/IconInput";
import {
  addEducationSchema,
  type AddEducationInput,
} from "@/features/candidates/schemas";
import {
  addEducation,
  updateEducation,
} from "@/features/candidates/actions";

type EducationLike = {
  id?: string;
  degree?: string;
  school?: string;
  startYear?: number | null;
  endYear?: number | null;
  description?: string | null;
};

type EducationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  education?: EducationLike | null;
};

export function EducationModal({
  open,
  onOpenChange,
  education,
}: EducationModalProps) {
  const isEdit = !!education?.id;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddEducationInput>({
    resolver: zodResolver(addEducationSchema),
    defaultValues: {
      degree: education?.degree ?? "",
      school: education?.school ?? "",
      startYear: education?.startYear ?? undefined,
      endYear: education?.endYear ?? undefined,
      description: education?.description ?? "",
    },
  });

  const onSubmit = (values: AddEducationInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateEducation({ ...values, id: education!.id! })
        : await addEducation(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Formation modifiée" : "Formation ajoutée");
      reset();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-black/4">
          <DialogTitle className="text-xl font-bold">
            {isEdit ? "Modifier la formation" : "Ajouter une formation"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-6 pt-4 pb-2 space-y-3"
        >
          <IconInput
            label="Diplôme"
            placeholder="ex: Master en Informatique"
            error={errors.degree?.message}
            {...register("degree")}
          />
          <IconInput
            label="École / Université"
            placeholder="ex: INPTIC, Gabon"
            error={errors.school?.message}
            {...register("school")}
          />
          <div className="grid grid-cols-2 gap-3">
            <IconInput
              label="Année de début"
              type="number"
              placeholder="2016"
              error={errors.startYear?.message}
              {...register("startYear", { valueAsNumber: true })}
            />
            <IconInput
              label="Année de fin"
              type="number"
              placeholder="2018"
              error={errors.endYear?.message}
              {...register("endYear", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-jc-text-primary mb-1.5">
              Description (facultatif)
            </label>
            <Textarea
              placeholder="Spécialité, mention, etc."
              className="min-h-20 bg-[#f0f4f8] border-none focus-visible:ring-2 focus-visible:ring-jc-primary-green/40"
              {...register("description")}
            />
          </div>

          <DialogFooter className="-mx-6 -mb-2 px-6 pb-4 pt-3 border-t border-black/4 bg-jc-background flex flex-row gap-3 justify-end">
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
