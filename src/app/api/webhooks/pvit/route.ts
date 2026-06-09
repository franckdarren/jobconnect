import { NextResponse, type NextRequest } from "next/server";
import { applyPaymentFailure, applyPaymentSuccess } from "@/features/payments/apply";

/**
 * PVIT webhook handler.
 *
 * Idempotence (§1 of CLAUDE.md):
 *   - The unique key is `merchantReferenceId`. `applyPaymentSuccess` /
 *     `applyPaymentFailure` both early-exit when the row is already in the
 *     target state, so a replay of the exact same webhook is a no-op.
 *   - The protocol expects us to always answer `{ transactionId, responseCode: 200 }`
 *     even when we already processed the event, otherwise PVIT keeps retrying.
 *
 * Expected payload (subset — PVIT may include more fields, we tolerate them):
 *   {
 *     merchantReferenceId: string;
 *     transactionId?: string;
 *     status: "SUCCESS" | "FAILED" | "PENDING";
 *     reason?: string;
 *   }
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { responseCode: 400, message: "Invalid JSON" },
      { status: 400 },
    );
  }

  const event = body as {
    merchantReferenceId?: unknown;
    transactionId?: unknown;
    status?: unknown;
    reason?: unknown;
  };

  const merchantReference =
    typeof event.merchantReferenceId === "string"
      ? event.merchantReferenceId
      : null;
  const status = typeof event.status === "string" ? event.status : null;

  if (!merchantReference || !status) {
    return NextResponse.json(
      { responseCode: 400, message: "Missing merchantReferenceId or status" },
      { status: 400 },
    );
  }

  const transactionId =
    typeof event.transactionId === "string" ? event.transactionId : null;
  const reason = typeof event.reason === "string" ? event.reason : undefined;

  if (status === "SUCCESS") {
    const result = await applyPaymentSuccess({
      merchantReference,
      transactionId,
      raw: body,
    });
    if (!result.ok) {
      // PAYMENT_NOT_FOUND is the only "real" error; everything else (already-applied
      // states) returns ok=true. We respond 200 with an indicative responseCode so
      // PVIT does not retry on PAYMENT_NOT_FOUND either (would not help).
      return NextResponse.json(
        { transactionId, responseCode: 200, message: result.reason },
        { status: 200 },
      );
    }
    return NextResponse.json({ transactionId, responseCode: 200 });
  }

  if (status === "FAILED") {
    await applyPaymentFailure({ merchantReference, reason, raw: body });
    return NextResponse.json({ transactionId, responseCode: 200 });
  }

  // PENDING / unknown — acknowledge but no DB change.
  return NextResponse.json({ transactionId, responseCode: 200 });
}

// Disable static optimization — this route must always run server-side.
export const dynamic = "force-dynamic";
