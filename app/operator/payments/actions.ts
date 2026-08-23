"use server";

import { redirect } from "next/navigation";
import type { DepositCalculationType, PaymentTermsMode } from "@/domain/booking/types";
import type { PaymentTransactionType } from "@/domain/payment/types";
import { hasOperationsAccess } from "@/lib/access-control";
import { getCustomerForOperations } from "@/lib/customer-auth";
import { emailConfig, isEmailDeliveryConfigured, sendEmail } from "@/lib/email";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getOperationsRepository } from "@/lib/operations-repository";
import { paymentConfig } from "@/lib/payment-config";
import { getPaymentRepository } from "@/lib/payment-repository";
import {
  createDepositPaymentTerms,
  createFullPaymentTerms,
  createInstallmentPaymentTerms,
  deriveReservationPaymentSchedule,
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

function money(value: number, currency: string, locale: "en" | "es") {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function date(value: string, locale: "en" | "es") {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}

function escapeHtml(input: string) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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

export async function sendPaymentReminderAction(formData: FormData) {
  const identity = await getIdentityRepository().getCurrentIdentity();
  if (!hasOperationsAccess(identity)) redirect("/operator/sign-in?error=forbidden");
  const reservationId = value(formData, "reservationId");
  const detailUrl = reservationId
    ? `/operator/reservations/${encodeURIComponent(reservationId)}`
    : "/operator/reservations";
  if (!reservationId) redirect(`${detailUrl}?termsError=invalid-request`);
  if (!isEmailDeliveryConfigured()) redirect(`${detailUrl}?termsError=reminder-unavailable`);

  const reservation = await getOperationsRepository().getReservation(reservationId);
  if (!reservation) redirect("/operator/reservations?error=not-found");
  const [customer, summary] = await Promise.all([
    getCustomerForOperations(reservation.identityId),
    getPaymentRepository().getSummary(reservation)
  ]);
  if (!customer) redirect(`${detailUrl}?termsError=reminder-customer-missing`);
  const schedule = deriveReservationPaymentSchedule(reservation, summary);
  const next = schedule.nextInstallment;
  if (!next || schedule.nextPaymentAmount <= 0) redirect(`${detailUrl}?termsError=reminder-not-needed`);

  const locale: "en" | "es" = customer.preferredLocale === "es" ? "es" : "en";
  const amount = money(schedule.nextPaymentAmount, reservation.currency, locale);
  const due = next.dueDate ? date(next.dueDate, locale) : undefined;
  const label = locale === "es" ? (next.labelEs || next.label) : next.label;
  const reservationUrl = `${emailConfig.publicUrl}/account/reservations/${encodeURIComponent(reservation.id)}`;
  const subject = locale === "es" ? "Recordatorio de pago · Kairoseth Travel" : "Payment reminder · Kairoseth Travel";
  const text = locale === "es"
    ? `Hola ${customer.displayName},\n\nTe recordamos el próximo pago de tu reserva ${reservation.tripTitle ?? reservation.id}.\n\n${label}: ${amount}${due ? `\nVencimiento: ${due}` : ""}\n\nConsulta tu reserva: ${reservationUrl}\n\nKairoseth Travel`
    : `Hello ${customer.displayName},\n\nThis is a reminder about the next payment for your reservation ${reservation.tripTitle ?? reservation.id}.\n\n${label}: ${amount}${due ? `\nDue date: ${due}` : ""}\n\nReview your reservation: ${reservationUrl}\n\nKairoseth Travel`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1728"><h2>Kairoseth Travel</h2><p>${locale === "es" ? "Hola" : "Hello"} ${escapeHtml(customer.displayName)},</p><p>${locale === "es" ? "Te recordamos el próximo pago de tu reserva." : "This is a reminder about the next payment for your reservation."}</p><p><strong>${escapeHtml(label)}: ${escapeHtml(amount)}</strong>${due ? `<br>${locale === "es" ? "Vencimiento" : "Due date"}: ${escapeHtml(due)}` : ""}</p><p><a href="${escapeHtml(reservationUrl)}" style="display:inline-block;padding:12px 18px;background:#4fd1bd;color:#07111f;text-decoration:none;border-radius:8px;font-weight:700">${locale === "es" ? "Ver reserva" : "View reservation"}</a></p></div>`;

  try {
    await sendEmail({ to: customer.email, subject, text, html });
  } catch (error) {
    console.error("Payment reminder email failed", error);
    redirect(`${detailUrl}?termsError=reminder-failed`);
  }
  redirect(`${detailUrl}?termsReminder=sent`);
}
