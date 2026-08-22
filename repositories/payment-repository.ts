import type { Reservation } from "@/domain/booking/types";
import type {
  CreatePaymentTransactionInput,
  PaymentSummary,
  PaymentTransaction,
  UpdatePaymentTransactionInput
} from "@/domain/payment/types";

export interface PaymentRepository {
  getSummary(reservation: Reservation): Promise<PaymentSummary>;
  getSummaries(reservations: Reservation[]): Promise<Record<string, PaymentSummary>>;
  listTransactions(reservationId: string): Promise<PaymentTransaction[]>;
  listRecentTransactions(limit?: number): Promise<PaymentTransaction[]>;
  createTransaction(input: CreatePaymentTransactionInput): Promise<PaymentTransaction>;
  updateTransaction(input: UpdatePaymentTransactionInput): Promise<PaymentTransaction | null>;
}
