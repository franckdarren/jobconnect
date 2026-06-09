import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadCount } from "@/features/notifications/queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }
  const count = await getUnreadCount(user.id);
  return NextResponse.json({ count });
}

export const dynamic = "force-dynamic";
