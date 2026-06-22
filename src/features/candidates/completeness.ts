/**
 * Complétude du profil candidat — logique unique, pure (sans accès DB) afin
 * d'être partagée serveur (query) ET client (modale d'incitation).
 *
 * Principe produit (cf. CLAUDE.md) : on **incite** le candidat à compléter son
 * profil avant de postuler, sans jamais le bloquer. Le seuil ci-dessous ne sert
 * qu'à décider quand afficher la modale d'incitation — il n'empêche pas l'action.
 *
 * Les poids somment à 100. Toute modification de la pondération se fait
 * UNIQUEMENT ici (pas de pourcentage codé en dur ailleurs).
 */

export type CompletenessInput = {
  photoUrl: string | null;
  profession: string | null;
  summary: string | null;
  city: string | null;
  experienceLevel: string | null;
  availability: string | null;
  cvUrl: string | null;
  skillsCount: number;
  experiencesCount: number;
  educationsCount: number;
};

export type CompletenessItem = {
  key: string;
  /** Libellé orienté action, affiché tel quel dans l'UI. */
  label: string;
  weight: number;
  done: boolean;
};

export type ProfileCompleteness = {
  /** 0..100, arrondi à l'entier. */
  percent: number;
  items: CompletenessItem[];
  /** Sous-ensemble `!done`, trié par poids décroissant (les plus utiles d'abord). */
  missing: CompletenessItem[];
  /** `true` ssi 100 %. */
  isComplete: boolean;
  /** `true` ssi le profil dépasse le seuil d'incitation (cf. APPLY_NUDGE_THRESHOLD). */
  meetsApplyThreshold: boolean;
};

/**
 * En dessous de ce pourcentage, la modale d'incitation s'affiche avant de
 * postuler. Au-dessus, on postule directement. Soft gate : jamais bloquant.
 */
export const APPLY_NUDGE_THRESHOLD = 70;

function filled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Définition pondérée des éléments du profil. L'ordre ici est l'ordre
 * d'affichage par défaut ; `missing` est ensuite re-trié par poids.
 */
function buildItems(input: CompletenessInput): CompletenessItem[] {
  return [
    {
      key: "profession",
      label: "Indiquer votre métier",
      weight: 15,
      done: filled(input.profession),
    },
    {
      key: "summary",
      label: "Rédiger une présentation",
      weight: 15,
      done: filled(input.summary),
    },
    {
      key: "cv",
      label: "Téléverser votre CV (PDF)",
      weight: 15,
      done: filled(input.cvUrl),
    },
    {
      key: "photo",
      label: "Ajouter une photo de profil",
      weight: 10,
      done: filled(input.photoUrl),
    },
    {
      key: "city",
      label: "Préciser votre ville",
      weight: 10,
      done: filled(input.city),
    },
    {
      key: "experienceLevel",
      label: "Renseigner votre niveau d'expérience",
      weight: 10,
      done: filled(input.experienceLevel),
    },
    {
      key: "skills",
      label: "Ajouter au moins une compétence",
      weight: 10,
      done: input.skillsCount > 0,
    },
    {
      key: "availability",
      label: "Indiquer votre disponibilité",
      weight: 5,
      done: filled(input.availability),
    },
    {
      key: "experiences",
      label: "Ajouter une expérience professionnelle",
      weight: 5,
      done: input.experiencesCount > 0,
    },
    {
      key: "educations",
      label: "Ajouter une formation",
      weight: 5,
      done: input.educationsCount > 0,
    },
  ];
}

export function computeProfileCompleteness(
  input: CompletenessInput,
): ProfileCompleteness {
  const items = buildItems(input);
  const earned = items.reduce((sum, it) => sum + (it.done ? it.weight : 0), 0);
  const total = items.reduce((sum, it) => sum + it.weight, 0);
  const percent = total === 0 ? 100 : Math.round((earned / total) * 100);
  const missing = items
    .filter((it) => !it.done)
    .sort((a, b) => b.weight - a.weight);

  return {
    percent,
    items,
    missing,
    isComplete: percent === 100,
    meetsApplyThreshold: percent >= APPLY_NUDGE_THRESHOLD,
  };
}
