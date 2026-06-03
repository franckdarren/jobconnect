import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getEmployerProfile } from "@/features/employers/queries";
import { EmployerProfileEditor } from "./profile-editor";

export default async function EmployerProfilePage() {
  const user = await requireRole("employer");
  const data = await getEmployerProfile(user.id);
  if (!data) redirect("/login");

  return (
    <EmployerProfileEditor
      profile={data.profile}
      phone={data.user?.phone ?? user.phone}
    />
  );
}
