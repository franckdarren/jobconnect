"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
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

  const apply = (next: { q?: string; city?: string; type?: FilterType }) => {
    const params = new URLSearchParams();
    const finalQ = next.q ?? q;
    const finalCity = next.city ?? city;
    const finalType = next.type ?? type;
    if (finalQ) params.set("q", finalQ);
    if (finalCity) params.set("city", finalCity);
    if (finalType && finalType !== "all") params.set("type", finalType);
    router.push(`/jobs${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="space-y-3">
      <div className="jc-card p-3 flex gap-2 items-center">
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
          className="rounded-xl bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white h-12 px-4"
        >
          Chercher
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-thin">
        {TYPE_TABS.map((t) => {
          const active = t.value === type;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setType(t.value);
                apply({ type: t.value });
              }}
              className={cn(
                "shrink-0 rounded-full px-4 h-9 text-sm font-semibold transition-colors",
                active
                  ? "bg-jc-primary-dark text-white"
                  : "bg-jc-background border border-black/[0.06] text-jc-text-secondary",
              )}
            >
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
