import type {
  DepositCalculationType,
  Reservation,
  ReservationPaymentInstallment,
  ReservationPaymentTerms
} from "@/domain/booking/types";
import type { PaymentSummary } from "@/domain/payment/types";
import { bookingConfig } from "@/lib/booking-config";
import {
  ensureMongoReservationIndexes,
  travelReservationCollectionName,
  type StoredReservation
} from "@/lib/mongo-reservations";
import { getMongoDatabase } from "@/lib/mongodb";

export type PaymentInstallmentState = "paid" | "partially_paid" | "due" | "upcoming" | "overdue";

export interface DerivedPaymentInstallment extends ReservationPaymentInstallment {
  paidAmount: number;
  outstandingAmount: number;
  state: PaymentInstallmentState;
}

export interface DerivedPaymentSchedule {
  mode: ReservationPaymentTerms["mode"];
  totalAmount: number;
  currency: string;
  installments: DerivedPaymentInstallment[];
  nextInstallment?: DerivedPaymentInstallment;
  nextPaymentAmount: number;
  outdated: boolean;
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function paymentTermsError(code: string, message: string) {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

function validDate(value?: string) {
  if (!value) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function assertDueDates(installments: ReservationPaymentInstallment[], departureDate?: string) {
  let previous = "";
  for (const installment of installments) {
    if (!validDate(installment.dueDate)) {
      throw paymentTermsError("PAYMENT_TERMS_DATE_INVALID", "Payment due date is invalid.");
    }
    if (installment.dueDate && previous && installment.dueDate < previous) {
      throw paymentTermsError("PAYMENT_TERMS_DATE_ORDER", "Payment due dates must be chronological.");
    }
    if (installment.dueDate && departureDate && installment.dueDate > departureDate) {
      throw paymentTermsError("PAYMENT_TERMS_AFTER_DEPARTURE", "Payment due date cannot be after departure.");
    }
    if (installment.dueDate) previous = installment.dueDate;
  }
}

function assertTotal(installments: ReservationPaymentInstallment[], totalAmount: number) {
  if (!installments.length || installments.some((item) => !Number.isFinite(item.amount) || item.amount <= 0)) {
    throw paymentTermsError("PAYMENT_TERMS_AMOUNT_INVALID", "Every payment installment must have a positive amount.");
  }
  const total = money(installments.reduce((sum, item) => sum + item.amount, 0));
  if (Math.abs(total - money(totalAmount)) > 0.009) {
    throw paymentTermsError("PAYMENT_TERMS_TOTAL_MISMATCH", "Payment installments must equal the reservation total.");
  }
}

export function createFullPaymentTerms(input: {
  reservation: Reservation;
  dueDate?: string;
  configuredBy?: string;
}): ReservationPaymentTerms {
  const installments: ReservationPaymentInstallment[] = [{
    id: "full-balance",
    label: "Full balance",
    labelEs: "Pago completo",
    amount: money(input.reservation.totalPrice),
    ...(input.dueDate ? { dueDate: input.dueDate } : {})
  }];
  assertDueDates(installments, input.reservation.departureDate);
  return {
    mode: "full",
    totalAmount: money(input.reservation.totalPrice),
    currency: input.reservation.currency,
    installments,
    configuredAt: new Date().toISOString(),
    configuredBy: input.configuredBy
  };
}

export function createDepositPaymentTerms(input: {
  reservation: Reservation;
  depositType: DepositCalculationType;
  depositValue: number;
  depositDueDate: string;
  balanceDueDate: string;
  configuredBy?: string;
}): ReservationPaymentTerms {
  const total = money(input.reservation.totalPrice);
  if (!Number.isFinite(input.depositValue) || input.depositValue <= 0) {
    throw paymentTermsError("PAYMENT_TERMS_AMOUNT_INVALID", "Deposit value must be positive.");
  }
  if (input.depositType === "percentage" && input.depositValue >= 100) {
    throw paymentTermsError("PAYMENT_TERMS_DEPOSIT_INVALID", "Deposit percentage must be below 100%.");
  }
  const depositAmount = input.depositType === "percentage"
    ? money(total * input.depositValue / 100)
    : money(input.depositValue);
  if (depositAmount <= 0 || depositAmount >= total) {
    throw paymentTermsError("PAYMENT_TERMS_DEPOSIT_INVALID", "Deposit must be lower than the reservation total.");
  }
  const installments: ReservationPaymentInstallment[] = [
    {
      id: "deposit",
      label: "Deposit",
      labelEs: "Depósito",
      amount: depositAmount,
      dueDate: input.depositDueDate
    },
    {
      id: "final-balance",
      label: "Final balance",
      labelEs: "Saldo final",
      amount: money(total - depositAmount),
      dueDate: input.balanceDueDate
    }
  ];
  assertDueDates(installments, input.reservation.departureDate);
  assertTotal(installments, total);
  return {
    mode: "deposit",
    totalAmount: total,
    currency: input.reservation.currency,
    depositType: input.depositType,
    depositValue: money(input.depositValue),
    installments,
    configuredAt: new Date().toISOString(),
    configuredBy: input.configuredBy
  };
}

export function createInstallmentPaymentTerms(input: {
  reservation: Reservation;
  installments: Array<{ amount: number; dueDate: string }>;
  configuredBy?: string;
}): ReservationPaymentTerms {
  const total = money(input.reservation.totalPrice);
  if (input.installments.length < 2 || input.installments.length > 6) {
    throw paymentTermsError("PAYMENT_TERMS_INSTALLMENT_COUNT", "Use between 2 and 6 installments.");
  }
  const installments: ReservationPaymentInstallment[] = input.installments.map((item, index) => ({
    id: `installment-${index + 1}`,
    label: `Installment ${index + 1}`,
    labelEs: `Cuota ${index + 1}`,
    amount: money(item.amount),
    dueDate: item.dueDate
  }));
  assertDueDates(installments, input.reservation.departureDate);
  assertTotal(installments, total);
  return {
    mode: "installments",
    totalAmount: total,
    currency: input.reservation.currency,
    installments,
    configuredAt: new Date().toISOString(),
    configuredBy: input.configuredBy
  };
}

export function derivePaymentSchedule(input: {
  totalAmount: number;
  currency: string;
  paymentTerms?: ReservationPaymentTerms;
  netPaidAmount: number;
  asOf?: string;
}): DerivedPaymentSchedule {
  const total = money(Math.max(0, input.totalAmount));
  const terms = input.paymentTerms;
  const outdated = Boolean(terms && (
    Math.abs(money(terms.totalAmount) - total) > 0.009 || terms.currency !== input.currency
  ));
  const baseInstallments = !terms || outdated
    ? [{ id: "full-balance", label: "Full balance", labelEs: "Pago completo", amount: total }]
    : terms.installments;
  let remainingPaid = money(Math.max(0, input.netPaidAmount));
  const today = (input.asOf || new Date().toISOString()).slice(0, 10);
  const installments = baseInstallments.map((item) => {
    const paidAmount = money(Math.min(item.amount, remainingPaid));
    remainingPaid = money(Math.max(0, remainingPaid - paidAmount));
    const outstandingAmount = money(Math.max(0, item.amount - paidAmount));
    let state: PaymentInstallmentState = "upcoming";
    if (outstandingAmount <= 0) state = "paid";
    else if (paidAmount > 0) state = "partially_paid";
    else if (!item.dueDate || item.dueDate === today) state = "due";
    else if (item.dueDate < today) state = "overdue";
    return { ...item, paidAmount, outstandingAmount, state };
  });
  const nextInstallment = installments.find((item) => item.outstandingAmount > 0);
  return {
    mode: !terms || outdated ? "full" : terms.mode,
    totalAmount: total,
    currency: input.currency,
    installments,
    nextInstallment,
    nextPaymentAmount: nextInstallment?.outstandingAmount ?? 0,
    outdated
  };
}

export function deriveReservationPaymentSchedule(reservation: Reservation, summary: PaymentSummary) {
  return derivePaymentSchedule({
    totalAmount: reservation.totalPrice,
    currency: reservation.currency,
    paymentTerms: reservation.paymentTerms,
    netPaidAmount: summary.netPaidAmount
  });
}

export async function saveReservationPaymentTerms(
  reservationId: string,
  paymentTerms: ReservationPaymentTerms
) {
  if (bookingConfig.mode !== "mongodb" || !bookingConfig.writesEnabled) {
    throw paymentTermsError("PAYMENT_TERMS_DISABLED", "Payment terms writes are disabled.");
  }
  const database = await getMongoDatabase();
  await ensureMongoReservationIndexes(database);
  const updatedAt = new Date().toISOString();
  const result = await database.collection<StoredReservation>(travelReservationCollectionName).findOneAndUpdate(
    { id: reservationId },
    { $set: { paymentTerms, updatedAt } },
    { returnDocument: "after" }
  );
  if (!result) throw paymentTermsError("PAYMENT_TERMS_RESERVATION_NOT_FOUND", "Reservation not found.");
  return result;
}
