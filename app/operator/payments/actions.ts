"use server";

import { redirect } from "next/navigation";
import type { PaymentTransactionType } from "@/domain/payment/types";
import { hasOperationsAccess } from "@/lib/access-control";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getOperationsRepository } from "@/lib/operations-repository";
import { paymentConfig } from "@/lib/payment-config";
import { getPaymentRepository } from "@/lib/payment-repository";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function parseAmount(raw: string) {
  const normalized = raw.replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return Math.abs(rounded - amount) < 0.000001 ? rounded : null;
}

function transactionType(raw: string): PaymentTransactionType | null {
  return raw === "payment" || raw === "refund" ? raw : null;
}

function errorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "payment-error";
  const code = String((error as { code?: unknown }).code ?? "");
  const known: Record<string, string> = {
    PAYMENT_RESERVATION_NOT_FOUND: "reservation-not-found",
    PAYMENT_AMOUNT_INVALID: "amount-invalid",
    PAYMENT_CURRENCY_MISMATCH: "currency-mismatch",
    PAYMENT_REFERENCE_CONFLICT: "reference-conflict",
    PAYMENT_EXCEEDS_BALANCE: "exceeds-balance",
    REFUND_EXCEEDS_PAID: "exceeds-refundable"
  };
  return known[code] ?? "payment-error";
}

export async function recordManualPaymentAction(formData: FormData) {
  const identity = await getIdentityRepository().getCurrentIdentity();
  if (!hasOperationsAccess(identity)) redirect("/operator/sign-in?error=forbidden");

  const reservationId = value(formData, "reservationId");
  const type = transactionType(value(formData, "type"));
  const amount = parseAmount(value(formData, "amount"));
  const method = value(formData, "method") || "other";
  const providerReference = value(formData, "providerReference").slice(0, 160) || undefined;
  const note = value(formData, "note").slice(0, 500) || undefined;
  const detailUrl = reservationId
    ? `/operator/reservations/${encodeURIComponent(reservationId)}`
    : "/operator/reservations";

  if (!paymentConfig.writesEnabled) redirect(`${detailUrl}?paymentError=payments-disabled`);
  if (!reservationId || !type || amount === null) redirect(`${detailUrl}?paymentError=invalid-request`);

  const reservation = await getOperationsRepository().getReservation(reservationId);
  if (!reservation) redirect("/operator/reservations?error=not-found");

  try {
    await getPaymentRepository().createTransaction({
      reservationId,
      type,
      amount,
      currency: reservation.currency,
      provider: "manual",
      method,
      status: "succeeded",
      providerReference,
      note,
      actorIdentityId: identity.id,
      actorRole: identity.role
    });
  } catch (error) {
    redirect(`${detailUrl}?paymentError=${errorCode(error)}`);
  }

  redirect(`${detailUrl}?paymentUpdated=${type}`);
}
