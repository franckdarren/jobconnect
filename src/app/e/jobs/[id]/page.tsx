import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getJobOfferById } from "@/features/jobs/queries";
import { JobForm } from "../job-form";
import { JobActions } from "./job-actions";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("employer");
  const { id } = await params;
  const job = await getJobOfferById(id);
  if (!job || job.job.employerId !== user.id) notFound();

  return (
    <div className="space-y-4">
      <JobActions
        id={id}
        status={job.job.status}
        applicationsCount={job.applicationsCount}
      />
      <JobForm
        mode="edit"
        jobId={id}
        defaults={{
          type: job.job.type,
          title: job.job.title,
          city: job.job.city ?? "",
          salaryMin: job.job.salaryMin ?? undefined,
          salaryMax: job.job.salaryMax ?? undefined,
          salaryLabel: job.job.salaryLabel ?? "",
          description: job.job.description,
          imageUrl: job.job.imageUrl ?? "",
          expiresAt: job.job.expiresAt
            ? new Date(job.job.expiresAt).toISOString().slice(0, 10)
            : "",
          missions: job.missions.map((m) => m.text),
          skills: job.skills,
        }}
      />
    </div>
  );
}
