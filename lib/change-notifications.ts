import type { Reservation } from "@/domain/booking/types";
import type { ServiceReservation } from "@/domain/services/booking-types";
import { getCustomerUserById } from "@/lib/customer-auth";
import { emailConfig, isEmailDeliveryConfigured, sendEmail } from "@/lib/email";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value: number, currency: string, locale: "en" | "es") {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

function date(value: string | undefined, locale: "en" | "es") {
  if (!value) return locale === "es" ? "Sin fecha" : "No date";
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

async function customer(identityId: string) {
  return getCustomerUserById(identityId).catch(() => null);
}

export async function notifyTripReservationChanged(reservation: Reservation) {
  if (!isEmailDeliveryConfigured()) return;
  const user = await customer(reservation.identityId);
  if (!user?.email) return;
  const locale: "en" | "es" = user.preferredLocale === "es" ? "es" : "en";
  const name = user.displayName || user.firstName || (locale === "es" ? "viajero" : "traveller");
  const title = reservation.tripTitle || (locale === "es" ? "Tu viaje" : "Your trip");
  const detailUrl = `${emailConfig.publicUrl}/account/reservations/${encodeURIComponent(reservation.id)}`;
  const subject = locale === "es" ? `Tu reserva se ha actualizado · ${title}` : `Your reservation has been updated · ${title}`;
  const intro = locale === "es"
    ? "Nuestro equipo ha actualizado tu reserva. Revisa a continuación los datos actuales y consulta Mi cuenta para ver todos los detalles."
    : "Our team has updated your reservation. Review the current details below and open My account for the full booking information.";
  const text = locale === "es"
    ? `Hola ${name},\n\n${intro}\n\nViaje: ${title}\nSalida: ${date(reservation.departureDate, locale)}\nRegreso: ${date(reservation.returnDate, locale)}\nTotal actual: ${money(reservation.totalPrice, reservation.currency, locale)}\nReferencia: ${reservation.id}\n\nVer reserva: ${detailUrl}\n\nKairoseth Travel`
    : `Hello ${name},\n\n${intro}\n\nTrip: ${title}\nDeparture: ${date(reservation.departureDate, locale)}\nReturn: ${date(reservation.returnDate, locale)}\nCurrent total: ${money(reservation.totalPrice, reservation.currency, locale)}\nReference: ${reservation.id}\n\nView reservation: ${detailUrl}\n\nKairoseth Travel`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1728;max-width:680px;margin:auto"><h2>Kairoseth Travel</h2><p>${escapeHtml(locale === "es" ? `Hola ${name},` : `Hello ${name},`)}</p><p>${escapeHtml(intro)}</p><p><strong>${escapeHtml(title)}</strong><br>${locale === "es" ? "Salida" : "Departure"}: ${escapeHtml(date(reservation.departureDate, locale))}<br>${locale === "es" ? "Regreso" : "Return"}: ${escapeHtml(date(reservation.returnDate, locale))}<br>${locale === "es" ? "Total actual" : "Current total"}: ${escapeHtml(money(reservation.totalPrice, reservation.currency, locale))}</p><p><a href="${escapeHtml(detailUrl)}" style="display:inline-block;padding:12px 18px;background:#4fd1bd;color:#07111f;text-decoration:none;border-radius:8px;font-weight:700">${locale === "es" ? "Ver reserva" : "View reservation"}</a></p></div>`;
  await sendEmail({ to: user.email, subject, text, html });
}

export async function notifyServiceReservationChanged(
  reservation: ServiceReservation,
  event: "confirmed" | "cancelled" | "updated"
) {
  if (!isEmailDeliveryConfigured()) return;
  const user = await customer(reservation.identityId);
  if (!user?.email) return;
  const locale: "en" | "es" = user.preferredLocale === "es" ? "es" : "en";
  const name = user.displayName || user.firstName || (locale === "es" ? "viajero" : "traveller");
  const detailUrl = `${emailConfig.publicUrl}/account/services/${encodeURIComponent(reservation.id)}`;
  const labels = locale === "es"
    ? { confirmed: "Servicio confirmado", cancelled: "Servicio cancelado", updated: "Servicio actualizado" }
    : { confirmed: "Service confirmed", cancelled: "Service cancelled", updated: "Service updated" };
  const label = labels[event];
  const serviceDate = reservation.serviceDate || reservation.insuranceTrip?.startDate;
  const subject = `${label} · ${reservation.serviceTitle}`;
  const text = locale === "es"
    ? `Hola ${name},\n\n${label}: ${reservation.serviceTitle}\nFecha: ${date(serviceDate, locale)}${reservation.startTime ? `\nHora: ${reservation.startTime}` : ""}\nTotal: ${money(reservation.totalPrice, reservation.currency, locale)}\nReferencia: ${reservation.id}\n\nVer servicio: ${detailUrl}\n\nKairoseth Travel`
    : `Hello ${name},\n\n${label}: ${reservation.serviceTitle}\nDate: ${date(serviceDate, locale)}${reservation.startTime ? `\nTime: ${reservation.startTime}` : ""}\nTotal: ${money(reservation.totalPrice, reservation.currency, locale)}\nReference: ${reservation.id}\n\nView service: ${detailUrl}\n\nKairoseth Travel`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1728;max-width:680px;margin:auto"><h2>Kairoseth Travel</h2><p>${escapeHtml(locale === "es" ? `Hola ${name},` : `Hello ${name},`)}</p><p><strong>${escapeHtml(label)}</strong></p><p>${escapeHtml(reservation.serviceTitle)}<br>${locale === "es" ? "Fecha" : "Date"}: ${escapeHtml(date(serviceDate, locale))}${reservation.startTime ? `<br>${locale === "es" ? "Hora" : "Time"}: ${escapeHtml(reservation.startTime)}` : ""}<br>${locale === "es" ? "Total" : "Total"}: ${escapeHtml(money(reservation.totalPrice, reservation.currency, locale))}</p><p><a href="${escapeHtml(detailUrl)}" style="display:inline-block;padding:12px 18px;background:#4fd1bd;color:#07111f;text-decoration:none;border-radius:8px;font-weight:700">${locale === "es" ? "Ver servicio" : "View service"}</a></p></div>`;
  await sendEmail({ to: user.email, subject, text, html });
}
