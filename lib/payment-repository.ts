import { MongoPaymentRepository } from "@/adapters/mongo-payment-repository";
import type { Reservation } from "@/domain/booking/types";
import type {
  CreatePaymentTransactionInput,
  PaymentSummary,
  PaymentTargetSnapshot,
  PaymentTransaction,
  UpdatePaymentTransactionInput
} from "@/domain/payment/types";
import { paymentConfig } from "@/lib/payment-config";
import { buildPaymentSummary } from "@/lib/payment-summary";
import type { PaymentRepository } from "@/repositories/payment-repository";

class DisabledPaymentRepository implements PaymentRepository {
  async getSummary(reservation: Reservation): Promise<PaymentSummary> {
    return buildPaymentSummary({ ...reservation, targetType: "trip" }, []);
  }

  async getTargetSummary(target: PaymentTargetSnapshot): Promise<PaymentSummary> {
    return buildPaymentSummary(target, []);
  }

  async getSummaries(reservations: Reservation[]) {
    return Object.fromEntries(
      reservations.map((reservation) => [
        reservation.id,
        buildPaymentSummary({ ...reservation, targetType: "trip" }, [])
      ])
    );
  }

  async listTransactions(): Promise<PaymentTransaction[]> {
    return [];
  }

  async listRecentTransactions(): Promise<PaymentTransaction[]> {
    return [];
  }

  async createTransaction(_input: CreatePaymentTransactionInput): Promise<PaymentTransaction> {
    throw new Error("Payments are disabled in this deployment.");
  }

  async updateTransaction(_input: UpdatePaymentTransactionInput): Promise<PaymentTransaction | null> {
    throw new Error("Payments are disabled in this deployment.");
  }
}

export function getPaymentRepository(): PaymentRepository {
  if (paymentConfig.mode === "mongodb") {
    return new MongoPaymentRepository();
  }
  return new DisabledPaymentRepository();
}
