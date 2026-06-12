import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Hammer,
  MapPin,
  Banknote,
  Clock,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireRole } from "@/lib/auth";
import { getJobOfferById } from "@/features/jobs/queries";
import { listApplicationsForJob } from "@/features/applications/queries";
import { JobForm } from "../job-form";
import { JobActions } from "./job-actions";
import { ApplicationsList } from "./applications-list";

const TYPE_META = {
  job: { label: "Emploi", Icon: Briefcase },
  internship: { label: "Stage", Icon: GraduationCap },
  freelance: { label: "Freelance", Icon: Hammer },
} as const;

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
  const { label: typeLabel, Icon: TypeIcon } = TYPE_META[job.job.type];

  return (
    <div className="space-y-4">
      <Link
        href="/e/jobs"
        className="inline-flex items-center gap-1 text-sm text-jc-text-secondary hover:text-jc-text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux offres
      </Link>

      <header className="jc-card p-5 space-y-3">
        <h1 className="text-xl md:text-2xl font-bold leading-tight">
          {job.job.title}
        </h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-jc-text-secondary">
          <span className="inline-flex items-center gap-1">
            <TypeIcon className="w-3.5 h-3.5" />
            {typeLabel}
          </span>
          {job.job.city ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {job.job.city}
            </span>
          ) : null}
          {job.job.salaryLabel ? (
            <span className="inline-flex items-center gap-1 font-semibold text-jc-primary-green">
              <Banknote className="w-3.5 h-3.5" />
              {job.job.salaryLabel}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Publié le{" "}
            {new Date(job.job.publishedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </header>

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
