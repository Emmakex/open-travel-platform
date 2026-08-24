import type {
  PaymentSummary,
  PaymentTargetSnapshot,
  PaymentTransaction
} from "@/domain/payment/types";

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildPaymentSummary(
  target: PaymentTargetSnapshot,
  transactions: PaymentTransaction[]
): PaymentSummary {
  const succeededPayments = transactions
    .filter((item) => item.type === "payment" && item.status === "succeeded")
    .reduce((sum, item) => sum + item.amount, 0);
  const succeededRefunds = transactions
    .filter((item) => item.type === "refund" && item.status === "succeeded")
    .reduce((sum, item) => sum + item.amount, 0);
  const pendingPayments = transactions
    .filter((item) => item.type === "payment" && item.status === "pending")
    .reduce((sum, item) => sum + item.amount, 0);
  const pendingRefunds = transactions
    .filter((item) => item.type === "refund" && item.status === "pending")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalAmount = money(Math.max(0, target.totalPrice));
  const paidAmount = money(succeededPayments);
  const refundedAmount = money(succeededRefunds);
  const netPaidAmount = money(Math.max(0, paidAmount - refundedAmount));
  const outstandingAmount = money(Math.max(0, totalAmount - netPaidAmount));
  const overpaidAmount = money(Math.max(0, netPaidAmount - totalAmount));
  const refundableAmount = netPaidAmount;
  const pendingPaymentAmount = money(pendingPayments);
  const pendingRefundAmount = money(pendingRefunds);

  let status: PaymentSummary["status"] = "unpaid";
  if (refundedAmount > 0 && netPaidAmount <= 0) {
    status = "refunded";
  } else if (refundedAmount > 0) {
    status = "partially_refunded";
  } else if (totalAmount === 0 || netPaidAmount >= totalAmount) {
    status = "paid";
  } else if (netPaidAmount > 0) {
    status = "partially_paid";
  } else if (pendingPaymentAmount > 0 || pendingRefundAmount > 0) {
    status = "pending";
  }

  let settlementStatus: PaymentSummary["settlementStatus"] = "settled";
  if (pendingPaymentAmount > 0 || pendingRefundAmount > 0) {
    settlementStatus = "pending";
  } else if (overpaidAmount > 0) {
    settlementStatus = "refund_review";
  } else if (outstandingAmount > 0) {
    settlementStatus = "payment_due";
  }

  return {
    reservationId: target.id,
    targetId: target.id,
    targetType: target.targetType,
    status,
    settlementStatus,
    currency: target.currency,
    totalAmount,
    paidAmount,
    refundedAmount,
    netPaidAmount,
    outstandingAmount,
    overpaidAmount,
    settlementAmount: overpaidAmount > 0 ? overpaidAmount : outstandingAmount,
    refundableAmount,
    pendingPaymentAmount,
    pendingRefundAmount
  };
}
