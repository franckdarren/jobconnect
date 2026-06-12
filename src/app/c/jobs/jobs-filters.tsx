"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/shared/IconInput";
import { cn } from "@/lib/utils";

type FilterType = "all" | "job" | "internship" | "freelance";

const TYPE_TABS: { value: FilterType; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "job", label: "Emploi" },
  { value: "internship", label: "Stage" },
  { value: "freelance", label: "Freelance" },
];

export function JobsFilters({
  defaultQ,
  defaultCity,
  defaultType,
}: {
  defaultQ: string;
  defaultCity: string;
  defaultType: FilterType;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQ);
  const [city, setCity] = useState(defaultCity);
  const [type, setType] = useState<FilterType>(defaultType);
  const [isPending, startTransition] = useTransition();
  const [loadingType, setLoadingType] = useState<FilterType | null>(null);

  const apply = (next: { q?: string; city?: string; type?: FilterType }) => {
    const params = new URLSearchParams();
    const finalQ = next.q ?? q;
    const finalCity = next.city ?? city;
    const finalType = next.type ?? type;
    if (finalQ) params.set("q", finalQ);
    if (finalCity) params.set("city", finalCity);
    if (finalType && finalType !== "all") params.set("type", finalType);
    startTransition(() => {
      router.push(`/c/jobs${params.size ? `?${params.toString()}` : ""}`);
    });
  };

  return (
    <div className="space-y-3">
      <div className="jc-card p-3 space-y-2">
        <div className="flex gap-2 items-center">
          <IconInput
            icon={<Search className="w-4 h-4" />}
            placeholder="Poste, entreprise ou mot-clé..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply({});
            }}
            className="h-10"
          />
          <Button
            type="button"
            onClick={() => apply({})}
            className="shrink-0 rounded-xl bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white h-12 px-4"
          >
            Chercher
          </Button>
        </div>
        <IconInput
          placeholder="Filtrer par ville..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") apply({});
          }}
          className="h-10"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-thin">
        {TYPE_TABS.map((t) => {
          const active = t.value === type;
          const loading = loadingType === t.value && isPending;
          return (
            <button
              key={t.value}
              type="button"
              aria-label={`Filtrer par : ${t.label}`}
              aria-pressed={active}
              disabled={isPending}
              onClick={() => {
                setType(t.value);
                setLoadingType(t.value);
                apply({ type: t.value });
              }}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 h-9 text-sm font-semibold transition-colors disabled:opacity-70",
                active
                  ? "bg-jc-primary-dark text-white"
                  : "bg-jc-background border border-black/6 text-jc-text-secondary",
              )}
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {t.label}
            </button>
          );
        })}
      </div>

      {city ? (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-jc-light-green text-jc-primary-green text-xs font-semibold px-3 py-1">
            Ville : {city}
          </span>
          <button
            type="button"
            onClick={() => {
              setCity("");
              apply({ city: "" });
            }}
            className="text-xs text-jc-text-secondary underline"
          >
            Effacer
          </button>
        </div>
      ) : null}
    </div>
  );
}
