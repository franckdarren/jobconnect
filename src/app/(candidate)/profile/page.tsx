import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getCandidateProfile } from "@/features/candidates/queries";
import { ProfileEditor } from "./profile-editor";

export default async function CandidateProfilePage() {
  const user = await requireRole("candidate");
  const data = await getCandidateProfile(user.id);
  if (!data) redirect("/login");

  return (
    <ProfileEditor
      profile={data.profile}
      experiences={data.experiences}
      educations={data.educations}
      skills={data.skills}
      phone={data.user?.phone ?? user.phone}
    />
  );
}
