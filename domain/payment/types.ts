import type { IdentityRole } from "@/domain/identity/types";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "partially_paid"
  | "paid"
  | "partially_refunded"
  | "refunded";

export type PaymentTransactionType = "payment" | "refund";
export type PaymentTransactionStatus = "pending" | "succeeded" | "failed";

export interface PaymentTransaction {
  id: string;
  reservationId: string;
  type: PaymentTransactionType;
  status: PaymentTransactionStatus;
  amount: number;
  currency: string;
  provider: string;
  method?: string;
  providerReference?: string;
  note?: string;
  actorIdentityId?: string;
  actorRole?: IdentityRole;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentSummary {
  reservationId: string;
  status: PaymentStatus;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  netPaidAmount: number;
  outstandingAmount: number;
  refundableAmount: number;
  pendingPaymentAmount: number;
  pendingRefundAmount: number;
}

export interface CreatePaymentTransactionInput {
  reservationId: string;
  type: PaymentTransactionType;
  amount: number;
  currency: string;
  provider: string;
  method?: string;
  status?: PaymentTransactionStatus;
  providerReference?: string;
  note?: string;
  actorIdentityId?: string;
  actorRole?: IdentityRole;
}

export interface UpdatePaymentTransactionInput {
  transactionId: string;
  status: PaymentTransactionStatus;
  providerReference?: string;
}
