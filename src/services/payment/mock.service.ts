import "server-only";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import type {
  CheckStatusResult,
  CreatePaymentParams,
  KycResult,
  PaymentInitResult,
  PaymentProvider,
} from "./payment.interface";

const MOCK_DELAY_MS = 5_000;

/**
 * Mock payment provider for dev/test. Simulates an asynchronous webhook by
 * flipping `pending` payments to `success` once the row is older than
 * `MOCK_DELAY_MS` whenever `checkStatus` is polled. No external network call.
 */
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(params: CreatePaymentParams): Promise<PaymentInitResult> {
    console.info(
      `[mock-payment] createPayment ref=${params.merchantReferenceId} amount=${params.amount} operator=${params.operator}`,
    );
    return {
      status: "PENDING",
      transactionId: `mock_tx_${nanoid(10)}`,
    };
  }

  async checkStatus(
    merchantReferenceId: string,
  ): Promise<CheckStatusResult> {
    const [row] = await db
      .select({
        id: payments.id,
        status: payments.status,
        pvitTransactionId: payments.pvitTransactionId,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.pvitMerchantReference, merchantReferenceId))
      .limit(1);

    if (!row) {
      return { status: "FAILED", transactionId: null };
    }
    if (row.status === "success") {
      return { status: "SUCCESS", transactionId: row.pvitTransactionId };
    }
    if (row.status === "failed") {
      return { status: "FAILED", transactionId: row.pvitTransactionId };
    }

    const age = Date.now() - new Date(row.createdAt).getTime();
    if (age >= MOCK_DELAY_MS) {
      return {
        status: "SUCCESS",
        transactionId: row.pvitTransactionId ?? `mock_tx_${nanoid(10)}`,
      };
    }
    return { status: "PENDING", transactionId: row.pvitTransactionId };
  }

  async verifyKyc(): Promise<KycResult> {
    return { ok: true, name: "Mock User" };
  }
}
