import { requireRole } from "@/lib/auth";
import { JobForm } from "../job-form";

export default async function NewJobPage() {
  await requireRole("employer");
  return <JobForm mode="create" />;
}
