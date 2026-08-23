"use server";

import { redirect } from "next/navigation";
import type { DepositCalculationType, PaymentTermsMode } from "@/domain/booking/types";
import type { PaymentTransactionType } from "@/domain/payment/types";
import { hasOperationsAccess } from "@/lib/access-control";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getOperationsRepository } from "@/lib/operations-repository";
import { paymentConfig } from "@/lib/payment-config";
import { getPaymentRepository } from "@/lib/payment-repository";
import {
  createDepositPaymentTerms,
  createFullPaymentTerms,
  createInstallmentPaymentTerms,
  saveReservationPaymentTerms
} from "@/lib/payment-terms";

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

function termsMode(raw: string): PaymentTermsMode | null {
  return raw === "full" || raw === "deposit" || raw === "installments" ? raw : null;
}

function depositType(raw: string): DepositCalculationType | null {
  return raw === "fixed" || raw === "percentage" ? raw : null;
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

function termsErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "terms-error";
  const code = String((error as { code?: unknown }).code ?? "");
  const known: Record<string, string> = {
    PAYMENT_TERMS_DISABLED: "terms-disabled",
    PAYMENT_TERMS_RESERVATION_NOT_FOUND: "reservation-not-found",
    PAYMENT_TERMS_DATE_INVALID: "terms-date-invalid",
    PAYMENT_TERMS_DATE_ORDER: "terms-date-order",
    PAYMENT_TERMS_AFTER_DEPARTURE: "terms-after-departure",
    PAYMENT_TERMS_AMOUNT_INVALID: "terms-amount-invalid",
    PAYMENT_TERMS_DEPOSIT_INVALID: "terms-deposit-invalid",
    PAYMENT_TERMS_INSTALLMENT_COUNT: "terms-installment-count",
    PAYMENT_TERMS_TOTAL_MISMATCH: "terms-total-mismatch"
  };
  return known[code] ?? "terms-error";
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

export async function savePaymentTermsAction(formData: FormData) {
  const identity = await getIdentityRepository().getCurrentIdentity();
  if (!hasOperationsAccess(identity)) redirect("/operator/sign-in?error=forbidden");

  const reservationId = value(formData, "reservationId");
  const mode = termsMode(value(formData, "mode"));
  const detailUrl = reservationId
    ? `/operator/reservations/${encodeURIComponent(reservationId)}`
    : "/operator/reservations";
  if (!reservationId || !mode) redirect(`${detailUrl}?termsError=invalid-request`);

  const reservation = await getOperationsRepository().getReservation(reservationId);
  if (!reservation) redirect("/operator/reservations?error=not-found");

  try {
    if (mode === "full") {
      const dueDate = value(formData, "fullDueDate") || undefined;
      await saveReservationPaymentTerms(
        reservation.id,
        createFullPaymentTerms({ reservation, dueDate, configuredBy: identity.id })
      );
    } else if (mode === "deposit") {
      const selectedDepositType = depositType(value(formData, "depositType"));
      const depositValue = parseAmount(value(formData, "depositValue"));
      const depositDueDate = value(formData, "depositDueDate");
      const balanceDueDate = value(formData, "balanceDueDate");
      if (!selectedDepositType || depositValue === null || !depositDueDate || !balanceDueDate) {
        redirect(`${detailUrl}?termsError=invalid-request`);
      }
      await saveReservationPaymentTerms(
        reservation.id,
        createDepositPaymentTerms({
          reservation,
          depositType: selectedDepositType,
          depositValue,
          depositDueDate,
          balanceDueDate,
          configuredBy: identity.id
        })
      );
    } else {
      const installments: Array<{ amount: number; dueDate: string }> = [];
      for (let index = 1; index <= 6; index += 1) {
        const rawAmount = value(formData, `installmentAmount__${index}`);
        const dueDate = value(formData, `installmentDueDate__${index}`);
        if (!rawAmount && !dueDate) continue;
        const amount = parseAmount(rawAmount);
        if (amount === null || !dueDate) redirect(`${detailUrl}?termsError=invalid-request`);
        installments.push({ amount, dueDate });
      }
      await saveReservationPaymentTerms(
        reservation.id,
        createInstallmentPaymentTerms({ reservation, installments, configuredBy: identity.id })
      );
    }
  } catch (error) {
    redirect(`${detailUrl}?termsError=${termsErrorCode(error)}`);
  }

  redirect(`${detailUrl}?termsUpdated=1`);
}
