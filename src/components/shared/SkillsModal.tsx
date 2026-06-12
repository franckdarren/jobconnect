"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/shared/IconInput";
import { getOrCreateSkill, setSkills } from "@/features/candidates/actions";

export type SkillOption = { id: string; name: string };

type SkillsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSkills: SkillOption[];
  suggestions?: SkillOption[];
};

export function SkillsModal({
  open,
  onOpenChange,
  initialSkills,
  suggestions = [],
}: SkillsModalProps) {
  const [selected, setSelected] = useState<SkillOption[]>(initialSkills);
  const [query, setQuery] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);
  const [isPending, startTransition] = useTransition();

  // Re-sync selected with initialSkills when the modal transitions to open
  // (React canonical pattern for "adjusting state when a prop changes").
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setSelected(initialSkills);
  }

  // Derived state — no effect needed.
  const results = useMemo<SkillOption[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggestions;
    return suggestions
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, suggestions]);

  const isSelected = (id: string) => selected.some((s) => s.id === id);

  const add = (skill: SkillOption) => {
    if (isSelected(skill.id)) return;
    setSelected((prev) => [...prev, skill]);
  };

  const remove = (id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  };

  const onCreate = async () => {
    if (!query.trim()) return;
    const res = await getOrCreateSkill(query.trim());
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    add(res.data);
    setQuery("");
  };

  const onSave = () => {
    startTransition(async () => {
      const res = await setSkills({ skillIds: selected.map((s) => s.id) });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Compétences mises à jour");
      onOpenChange(false);
    });
  };

  const exactMatch = results.find(
    (r) => r.name.toLowerCase() === query.trim().toLowerCase(),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-black/[0.04]">
          <DialogTitle className="text-xl font-bold">
            Ajouter des compétences
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-2 space-y-4">
          <IconInput
            icon={<Search className="w-4 h-4" />}
            placeholder="Rechercher une compétence..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!exactMatch) onCreate();
              }
            }}
          />

          <div>
            <p className="text-[11px] font-bold tracking-wide text-jc-text-secondary mb-2">
              COMPÉTENCES SÉLECTIONNÉES
            </p>
            {selected.length === 0 ? (
              <p className="text-xs text-jc-text-muted">Aucune sélection</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selected.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => remove(s.id)}
                    aria-label={`Retirer ${s.name}`}
                    className="inline-flex items-center gap-1 rounded-full bg-jc-primary-green text-white text-xs font-medium px-3 py-1.5"
                  >
                    {s.name}
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold tracking-wide text-jc-text-secondary mb-2">
              SUGGESTIONS
            </p>
            <div className="flex flex-wrap gap-2">
              {results
                .filter((r) => !isSelected(r.id))
                .map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => add(s)}
                    className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-white text-jc-text-primary text-xs font-medium px-3 py-1.5 hover:bg-jc-light-green hover:border-jc-primary-green/30"
                  >
                    {s.name}
                  </button>
                ))}
              {query.trim() && !exactMatch ? (
                <button
                  type="button"
                  onClick={onCreate}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-jc-primary-green/40 bg-jc-light-green text-jc-primary-green text-xs font-medium px-3 py-1.5"
                >
                  + Créer &laquo; {query.trim()} &raquo;
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-4 pt-3 border-t border-black/[0.04] bg-jc-background flex flex-row gap-3 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="rounded-lg px-6 bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
