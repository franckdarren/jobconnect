import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getActiveSubscription } from "@/features/payments/queries";
import {
  checkCandidateApplicationQuota,
  checkEmployerActiveJobsQuota,
  checkEmployerProfileViewQuota,
  checkEmployerWhatsappQuota,
  getActivePlan,
} from "@/lib/quotas";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (user.role === "candidate") {
    const [plan, applications, subscription] = await Promise.all([
      getActivePlan(user.id, "candidate_free"),
      checkCandidateApplicationQuota(user.id),
      getActiveSubscription(user.id),
    ]);
    return NextResponse.json({
      authenticated: true,
      role: "candidate" as const,
      plan,
      quotas: { applications },
      subscription: subscription
        ? { plan: subscription.plan, status: subscription.status, expiresAt: subscription.expiresAt }
        : null,
    });
  }

  if (user.role === "employer") {
    const [plan, profileViews, whatsapp, activeJobs, subscription] =
      await Promise.all([
        getActivePlan(user.id, "employer_free"),
        checkEmployerProfileViewQuota(user.id),
        checkEmployerWhatsappQuota(user.id),
        checkEmployerActiveJobsQuota(user.id),
        getActiveSubscription(user.id),
      ]);
    return NextResponse.json({
      authenticated: true,
      role: "employer" as const,
      plan,
      quotas: { profileViews, whatsapp, activeJobs },
      subscription: subscription
        ? { plan: subscription.plan, status: subscription.status, expiresAt: subscription.expiresAt }
        : null,
    });
  }

  return NextResponse.json({
    authenticated: true,
    role: user.role,
    plan: null,
    quotas: null,
    subscription: null,
  });
}
