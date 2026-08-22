import type { TravelLocale } from "@/domain/travel/types";

export function tr(locale: TravelLocale, en: string, es: string) {
  return locale === "es" ? es : en;
}

export function localeTag(locale: TravelLocale) {
  return locale === "es" ? "es-ES" : "en-GB";
}

export function formatOperatorMoney(value: number, currency: string, locale: TravelLocale, maximumFractionDigits = 0) {
  return new Intl.NumberFormat(localeTag(locale), {
    style: "currency",
    currency,
    maximumFractionDigits
  }).format(value);
}

export function formatOperatorDate(value: string | Date | undefined, locale: TravelLocale, withTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {})
  }).format(new Date(value));
}

export function reservationStatusLabel(value: string, locale: TravelLocale) {
  const labels: Record<string, [string, string]> = {
    pending: ["Pending", "Pendiente"],
    confirmed: ["Confirmed", "Confirmada"],
    cancelled: ["Cancelled", "Cancelada"]
  };
  const label = labels[value];
  return label ? tr(locale, label[0], label[1]) : value;
}

export function staffRoleLabel(value: string, locale: TravelLocale) {
  const labels: Record<string, [string, string]> = {
    admin: ["Admin", "Administrador"],
    operator: ["Operator", "Operador"],
    customer: ["Customer", "Cliente"]
  };
  const label = labels[value];
  return label ? tr(locale, label[0], label[1]) : value;
}

export function accountStatusLabel(value: string, locale: TravelLocale) {
  const labels: Record<string, [string, string]> = {
    active: ["Active", "Activo"],
    disabled: ["Disabled", "Desactivado"]
  };
  const label = labels[value];
  return label ? tr(locale, label[0], label[1]) : value;
}

export function publicationStatusLabel(value: string, locale: TravelLocale) {
  const labels: Record<string, [string, string]> = {
    draft: ["Draft", "Borrador"],
    published: ["Published", "Publicado"]
  };
  const label = labels[value];
  return label ? tr(locale, label[0], label[1]) : value;
}

export function departureStatusLabel(value: string, locale: TravelLocale) {
  const labels: Record<string, [string, string]> = {
    open: ["Open", "Abierta"],
    closed: ["Closed", "Cerrada"],
    "sold-out": ["Sold out", "Agotada"]
  };
  const label = labels[value];
  return label ? tr(locale, label[0], label[1]) : value;
}

export function focalPointLabel(value: string, locale: TravelLocale) {
  const labels: Record<string, [string, string]> = {
    center: ["Center", "Centro"],
    top: ["Top", "Arriba"],
    bottom: ["Bottom", "Abajo"],
    left: ["Left", "Izquierda"],
    right: ["Right", "Derecha"]
  };
  const label = labels[value];
  return label ? tr(locale, label[0], label[1]) : value;
}

export function authEventLabel(value: string, locale: TravelLocale) {
  const labels: Record<string, [string, string]> = {
    sign_in_success: ["Sign in successful", "Inicio de sesión correcto"],
    sign_in_failure: ["Sign in failed", "Inicio de sesión fallido"],
    sign_out: ["Signed out", "Cierre de sesión"],
    password_changed: ["Password changed", "Contraseña cambiada"],
    account_locked: ["Account locked", "Cuenta bloqueada"],
    password_reset_requested: ["Password reset requested", "Restablecimiento solicitado"],
    password_reset_completed: ["Password reset completed", "Restablecimiento completado"]
  };
  const label = labels[value];
  return label ? tr(locale, label[0], label[1]) : value.replaceAll("_", " ");
}
