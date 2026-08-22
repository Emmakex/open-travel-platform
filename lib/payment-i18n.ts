import type {
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentTransactionType
} from "@/domain/payment/types";
import type { TravelLocale } from "@/domain/travel/types";

function tr(locale: TravelLocale, en: string, es: string) {
  return locale === "es" ? es : en;
}

export function paymentStatusLabel(value: PaymentStatus, locale: TravelLocale) {
  const labels: Record<PaymentStatus, [string, string]> = {
    unpaid: ["Unpaid", "Pendiente de pago"],
    pending: ["Processing", "En proceso"],
    partially_paid: ["Partially paid", "Pago parcial"],
    paid: ["Paid", "Pagada"],
    partially_refunded: ["Partially refunded", "Reembolso parcial"],
    refunded: ["Refunded", "Reembolsada"]
  };
  return tr(locale, labels[value][0], labels[value][1]);
}

export function paymentTransactionTypeLabel(value: PaymentTransactionType, locale: TravelLocale) {
  return value === "refund"
    ? tr(locale, "Refund", "Reembolso")
    : tr(locale, "Payment", "Pago");
}

export function paymentTransactionStatusLabel(value: PaymentTransactionStatus, locale: TravelLocale) {
  const labels: Record<PaymentTransactionStatus, [string, string]> = {
    pending: ["Pending", "Pendiente"],
    succeeded: ["Succeeded", "Completado"],
    failed: ["Failed", "Fallido"]
  };
  return tr(locale, labels[value][0], labels[value][1]);
}

export function paymentMethodLabel(value: string | undefined, locale: TravelLocale) {
  const labels: Record<string, [string, string]> = {
    bank_transfer: ["Bank transfer", "Transferencia bancaria"],
    cash: ["Cash", "Efectivo"],
    card: ["Card", "Tarjeta"],
    other: ["Other", "Otro"],
    manual: ["Manual", "Manual"]
  };
  const label = value ? labels[value] : undefined;
  return label ? tr(locale, label[0], label[1]) : value || tr(locale, "Not specified", "No especificado");
}
