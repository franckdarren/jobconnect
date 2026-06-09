import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getActiveSubscription } from "@/features/payments/queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ subscription: null }, { status: 401 });
  }

  const sub = await getActiveSubscription(user.id);
  return NextResponse.json({
    subscription: sub
      ? {
          plan: sub.plan,
          status: sub.status,
          startedAt: sub.startedAt,
          expiresAt: sub.expiresAt,
        }
      : null,
  });
}

export const dynamic = "force-dynamic";
