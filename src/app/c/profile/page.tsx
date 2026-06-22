import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getCandidateProfile } from "@/features/candidates/queries";
import { computeProfileCompleteness } from "@/features/candidates/completeness";
import { ProfileEditor } from "./profile-editor";

export default async function CandidateProfilePage() {
  const user = await requireRole("candidate");
  const data = await getCandidateProfile(user.id);
  if (!data) redirect("/login");

  // Calculé à partir des données déjà chargées — pas de requête supplémentaire.
  const completeness = computeProfileCompleteness({
    photoUrl: data.profile.photoUrl,
    profession: data.profile.profession,
    summary: data.profile.summary,
    city: data.profile.city,
    experienceLevel: data.profile.experienceLevel,
    availability: data.profile.availability,
    cvUrl: data.profile.cvUrl,
    skillsCount: data.skills.length,
    experiencesCount: data.experiences.length,
    educationsCount: data.educations.length,
  });

  return (
    <ProfileEditor
      profile={data.profile}
      experiences={data.experiences}
      educations={data.educations}
      skills={data.skills}
      phone={data.user?.phone ?? user.phone}
      completeness={completeness}
    />
  );
}
