import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  checkCandidateApplicationQuota,
  checkEmployerActiveJobsQuota,
  checkEmployerProfileViewQuota,
  checkEmployerWhatsappQuota,
  getActivePlan,
} from "@/lib/quotas";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  if (user.role === "candidate") {
    const [plan, applications] = await Promise.all([
      getActivePlan(user.id, "candidate_free"),
      checkCandidateApplicationQuota(user.id),
    ]);
    return NextResponse.json({
      role: "candidate" as const,
      plan,
      applications,
    });
  }

  if (user.role === "employer") {
    const [plan, profileViews, whatsapp, activeJobs] = await Promise.all([
      getActivePlan(user.id, "employer_free"),
      checkEmployerProfileViewQuota(user.id),
      checkEmployerWhatsappQuota(user.id),
      checkEmployerActiveJobsQuota(user.id),
    ]);
    return NextResponse.json({
      role: "employer" as const,
      plan,
      profileViews,
      whatsapp,
      activeJobs,
    });
  }

  return NextResponse.json({ role: user.role });
}
