import "server-only";
import { MockPaymentProvider } from "./mock.service";
import type { PaymentProvider } from "./payment.interface";

/**
 * Resolve which provider to use. We default to mock unless `PAYMENT_PROVIDER=pvit`
 * AND the PVIT secrets are present. This guarantees you can run the app locally
 * without configuring PVIT, while production opts in explicitly.
 *
 * The real PVIT implementation will live in `pvit.service.ts` and be wired here
 * when secrets are configured — kept out of the mock branch on purpose to avoid
 * accidental real charges in dev.
 */
let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;

  const useReal =
    process.env.PAYMENT_PROVIDER === "pvit" &&
    process.env.PVIT_URL_CODE &&
    process.env.PVIT_OPERATION_ACCOUNT_CODE &&
    process.env.PVIT_API_PASSWORD;

  if (useReal) {
    // Real PVIT provider not yet implemented — fall back to mock with a warning.
    console.warn(
      "[payment] PAYMENT_PROVIDER=pvit but PvitPaymentProvider not implemented; using mock.",
    );
  }

  cached = new MockPaymentProvider();
  return cached;
}

export type { PaymentProvider } from "./payment.interface";
