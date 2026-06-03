import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireRole } from "@/lib/auth";
import { getJobOfferById } from "@/features/jobs/queries";
import { listApplicationsForJob } from "@/features/applications/queries";
import { JobForm } from "../job-form";
import { JobActions } from "./job-actions";
import { ApplicationsList } from "./applications-list";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("employer");
  const { id } = await params;
  const job = await getJobOfferById(id);
  if (!job || job.job.employerId !== user.id) notFound();

  const applications = await listApplicationsForJob(id);

  return (
    <div className="space-y-4">
      <JobActions
        id={id}
        status={job.job.status}
        applicationsCount={job.applicationsCount}
      />

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid grid-cols-2 w-full bg-jc-background">
          <TabsTrigger value="applications" className="text-sm">
            Candidatures ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="edit" className="text-sm">
            Édition
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-4 space-y-3">
          <ApplicationsList applications={applications} />
        </TabsContent>

        <TabsContent value="edit" className="mt-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
