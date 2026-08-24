import type { UserRole } from "@/domain/identity/types";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "partially_paid"
  | "paid"
  | "partially_refunded"
  | "refunded";

export type PaymentSettlementStatus =
  | "payment_due"
  | "refund_review"
  | "settled"
  | "pending";

export type PaymentTargetType = "trip" | "service";
export type PaymentTransactionType = "payment" | "refund";
export type PaymentTransactionStatus = "pending" | "succeeded" | "failed";

export interface PaymentTargetSnapshot {
  id: string;
  totalPrice: number;
  currency: string;
  targetType?: PaymentTargetType;
}

export interface PaymentTransaction {
  id: string;
  /**
   * Backwards-compatible payment target identifier. Trip reservation IDs and
   * service reservation IDs are both stored here so existing ledger queries
   * remain stable while targetType provides the semantic distinction.
   */
  reservationId: string;
  targetType?: PaymentTargetType;
  type: PaymentTransactionType;
  status: PaymentTransactionStatus;
  amount: number;
  currency: string;
  provider: string;
  method?: string;
  providerReference?: string;
  note?: string;
  actorIdentityId?: string;
  actorRole?: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentSummary {
  reservationId: string;
  targetId: string;
  targetType?: PaymentTargetType;
  status: PaymentStatus;
  settlementStatus: PaymentSettlementStatus;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  netPaidAmount: number;
  outstandingAmount: number;
  overpaidAmount: number;
  settlementAmount: number;
  refundableAmount: number;
  pendingPaymentAmount: number;
  pendingRefundAmount: number;
}

export interface CreatePaymentTransactionInput {
  reservationId: string;
  targetType?: PaymentTargetType;
  type: PaymentTransactionType;
  amount: number;
  currency: string;
  provider: string;
  method?: string;
  status?: PaymentTransactionStatus;
  providerReference?: string;
  note?: string;
  actorIdentityId?: string;
  actorRole?: UserRole;
}

export interface UpdatePaymentTransactionInput {
  transactionId: string;
  status: PaymentTransactionStatus;
  providerReference?: string;
}
