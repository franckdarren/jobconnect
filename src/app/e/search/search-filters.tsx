"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/shared/IconInput";
import { cn } from "@/lib/utils";

type ExperienceLevel = "beginner" | "1_3" | "3_5" | "5_plus";
type Availability = "immediate" | "15_days" | "30_days";

const EXPERIENCE_TABS: { value: ExperienceLevel | "all"; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "beginner", label: "Débutant" },
  { value: "1_3", label: "1-3 ans" },
  { value: "3_5", label: "3-5 ans" },
  { value: "5_plus", label: "5+ ans" },
];

const AVAILABILITY_TABS: { value: Availability | "all"; label: string }[] = [
  { value: "all", label: "Toutes dispos" },
  { value: "immediate", label: "Immédiat" },
  { value: "15_days", label: "15 jours" },
  { value: "30_days", label: "30 jours" },
];

export function SearchFilters({
  defaultQ,
  defaultCity,
  defaultExperience,
  defaultAvailability,
}: {
  defaultQ: string;
  defaultCity: string;
  defaultExperience: ExperienceLevel | "all";
  defaultAvailability: Availability | "all";
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQ);
  const [city, setCity] = useState(defaultCity);
  const [experience, setExperience] = useState<ExperienceLevel | "all">(
    defaultExperience,
  );
  const [availability, setAvailability] = useState<Availability | "all">(
    defaultAvailability,
  );

  const apply = (next: {
    q?: string;
    city?: string;
    experience?: ExperienceLevel | "all";
    availability?: Availability | "all";
  }) => {
    const params = new URLSearchParams();
    const finalQ = next.q ?? q;
    const finalCity = next.city ?? city;
    const finalExp = next.experience ?? experience;
    const finalAv = next.availability ?? availability;
    if (finalQ) params.set("q", finalQ);
    if (finalCity) params.set("city", finalCity);
    if (finalExp && finalExp !== "all") params.set("exp", finalExp);
    if (finalAv && finalAv !== "all") params.set("av", finalAv);
    router.push(`/e/search${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="space-y-3">
      <div className="jc-card p-3 flex gap-2 items-center">
        <IconInput
          icon={<Search className="w-4 h-4" />}
          placeholder="Métier, compétence ou mot-clé..."
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

      <div className="jc-card p-3">
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
        {EXPERIENCE_TABS.map((t) => {
          const active = t.value === experience;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setExperience(t.value);
                apply({ experience: t.value });
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

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-thin">
        {AVAILABILITY_TABS.map((t) => {
          const active = t.value === availability;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setAvailability(t.value);
                apply({ availability: t.value });
              }}
              className={cn(
                "shrink-0 rounded-full px-4 h-9 text-sm font-semibold transition-colors",
                active
                  ? "bg-jc-primary-green text-white"
                  : "bg-jc-background border border-black/[0.06] text-jc-text-secondary",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
