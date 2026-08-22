import type { Reservation } from "@/domain/booking/types";
import { getCustomerUserById } from "@/lib/customer-auth";
import { emailConfig, isEmailDeliveryConfigured, sendEmail } from "@/lib/email";
import { localizeTrip } from "@/lib/i18n";
import { getTravelRepository } from "@/lib/travel-repository";

export type ReservationEmailEvent = "created" | "confirmed" | "cancelled";
type Locale = "en" | "es";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function localeFor(value?: string): Locale {
  return value === "es" ? "es" : "en";
}

function formatMoney(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(value: string | undefined, locale: Locale) {
  if (!value) return locale === "es" ? "Sin fecha" : "No date";
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function operationsRecipients() {
  const raw = process.env.KTRAVEL_OPERATIONS_EMAILS?.trim();
  const candidates = raw
    ? raw.split(/[;,]/g).map((item) => item.trim()).filter(Boolean)
    : emailConfig.fromEmail
      ? [emailConfig.fromEmail]
      : [];

  return [...new Set(candidates)].filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

function eventLabel(event: ReservationEmailEvent, locale: Locale) {
  if (locale === "es") {
    if (event === "created") return "Reserva recibida";
    if (event === "confirmed") return "Reserva confirmada";
    return "Reserva cancelada";
  }
  if (event === "created") return "Reservation received";
  if (event === "confirmed") return "Reservation confirmed";
  return "Reservation cancelled";
}

function customerIntro(event: ReservationEmailEvent, locale: Locale) {
  if (locale === "es") {
    if (event === "created") return "Hemos recibido tu reserva. Nuestro equipo ya puede revisarla desde Kairoseth Travel.";
    if (event === "confirmed") return "Tu reserva ha sido confirmada. A continuación tienes los datos principales de tu viaje.";
    return "Tu reserva ha sido cancelada. Las plazas asociadas han sido liberadas nuevamente en el inventario del viaje.";
  }
  if (event === "created") return "We have received your reservation. Our team can now review it in Kairoseth Travel.";
  if (event === "confirmed") return "Your reservation has been confirmed. Your main trip details are below.";
  return "Your reservation has been cancelled. The associated spaces have been released back to trip inventory.";
}

function reservationRows(input: {
  reservation: Reservation;
  tripTitle: string;
  locale: Locale;
}) {
  const { reservation, tripTitle, locale } = input;
  const labels = locale === "es"
    ? {
        trip: "Viaje",
        departure: "Salida",
        returnDate: "Regreso",
        travellers: "Viajeros",
        unitPrice: "Precio por persona",
        total: "Total",
        reference: "Referencia"
      }
    : {
        trip: "Trip",
        departure: "Departure",
        returnDate: "Return",
        travellers: "Travellers",
        unitPrice: "Price per traveller",
        total: "Total",
        reference: "Reference"
      };

  return [
    [labels.trip, tripTitle],
    [labels.departure, formatDate(reservation.departureDate, locale)],
    [labels.returnDate, formatDate(reservation.returnDate, locale)],
    [labels.travellers, String(reservation.partySize)],
    [labels.unitPrice, formatMoney(reservation.unitPrice, reservation.currency, locale)],
    [labels.total, formatMoney(reservation.totalPrice, reservation.currency, locale)],
    [labels.reference, reservation.id]
  ] as const;
}

function rowsToText(rows: ReadonlyArray<readonly [string, string]>) {
  return rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function rowsToHtml(rows: ReadonlyArray<readonly [string, string]>) {
  return rows.map(([label, value]) => (
    `<tr><td style="padding:8px 12px;color:#607086;border-bottom:1px solid #e7edf3">${escapeHtml(label)}</td>` +
    `<td style="padding:8px 12px;font-weight:700;color:#0b1728;border-bottom:1px solid #e7edf3">${escapeHtml(value)}</td></tr>`
  )).join("");
}

async function resolveTripTitle(reservation: Reservation, locale: Locale) {
  try {
    const trips = await getTravelRepository().listTrips();
    const trip = trips.find((item) => item.id === reservation.tripId);
    if (trip) return localizeTrip(trip, locale).title;
  } catch {
    // Email delivery must never make a reservation workflow depend on catalogue reads.
  }
  return reservation.tripTitle || reservation.tripId;
}

async function sendCustomerReservationEmail(input: {
  reservation: Reservation;
  event: ReservationEmailEvent;
  to: string;
  displayName: string;
  locale: Locale;
  tripTitle: string;
}) {
  const { reservation, event, to, displayName, locale, tripTitle } = input;
  const label = eventLabel(event, locale);
  const intro = customerIntro(event, locale);
  const rows = reservationRows({ reservation, tripTitle, locale });
  const detailUrl = `${emailConfig.publicUrl}/account/reservations/${encodeURIComponent(reservation.id)}`;
  const greeting = locale === "es" ? `Hola ${displayName},` : `Hello ${displayName},`;
  const cta = locale === "es" ? "Ver reserva" : "View reservation";
  const subject = `${label} · ${tripTitle}`;

  const text = `${greeting}\n\n${intro}\n\n${rowsToText(rows)}\n\n${cta}: ${detailUrl}\n\nKairoseth Travel`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1728;max-width:680px;margin:auto">` +
    `<h2 style="margin-bottom:6px">Kairoseth Travel</h2>` +
    `<p style="color:#3fceb5;font-weight:700;text-transform:uppercase;letter-spacing:.08em">${escapeHtml(label)}</p>` +
    `<p>${escapeHtml(greeting)}</p><p>${escapeHtml(intro)}</p>` +
    `<table style="width:100%;border-collapse:collapse;margin:24px 0">${rowsToHtml(rows)}</table>` +
    `<p><a href="${escapeHtml(detailUrl)}" style="display:inline-block;padding:12px 18px;background:#4fd1bd;color:#07111f;text-decoration:none;border-radius:8px;font-weight:700">${escapeHtml(cta)}</a></p>` +
    `<p style="color:#607086;font-size:13px">Kairoseth Travel · ${escapeHtml(reservation.id)}</p></div>`;

  await sendEmail({ to, subject, text, html });
}

async function sendOperationsReservationEmail(input: {
  reservation: Reservation;
  event: ReservationEmailEvent;
  customerName?: string;
  customerEmail?: string;
  tripTitle: string;
}) {
  const { reservation, event, customerName, customerEmail, tripTitle } = input;
  const recipients = operationsRecipients();
  if (!recipients.length) return;

  const eventName = event === "created" ? "New reservation" : event === "confirmed" ? "Reservation confirmed" : "Reservation cancelled";
  const rows = reservationRows({ reservation, tripTitle, locale: "en" });
  const operatorUrl = `${emailConfig.publicUrl}/operator/reservations/${encodeURIComponent(reservation.id)}`;
  const customerLine = customerName || customerEmail
    ? `Customer: ${customerName || "Customer"}${customerEmail ? ` <${customerEmail}>` : ""}`
    : "Customer: unavailable";
  const subject = `[Kairoseth Travel] ${eventName} · ${reservation.id}`;
  const text = `${eventName}\n\n${customerLine}\n${rowsToText(rows)}\n\nOpen in operations: ${operatorUrl}`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1728;max-width:680px;margin:auto">` +
    `<h2>Kairoseth Travel · Operations</h2>` +
    `<p style="font-weight:700">${escapeHtml(eventName)}</p>` +
    `<p>${escapeHtml(customerLine)}</p>` +
    `<table style="width:100%;border-collapse:collapse;margin:24px 0">${rowsToHtml(rows)}</table>` +
    `<p><a href="${escapeHtml(operatorUrl)}" style="display:inline-block;padding:12px 18px;background:#4fd1bd;color:#07111f;text-decoration:none;border-radius:8px;font-weight:700">Open reservation</a></p></div>`;

  await Promise.allSettled(recipients.map((to) => sendEmail({ to, subject, text, html })));
}

export async function notifyReservationEvent(reservation: Reservation, event: ReservationEmailEvent) {
  if (!isEmailDeliveryConfigured()) return;

  const customer = await getCustomerUserById(reservation.identityId).catch(() => null);
  const locale = localeFor(customer?.preferredLocale);
  const tripTitle = await resolveTripTitle(reservation, locale);

  const tasks: Promise<unknown>[] = [];
  if (customer?.email) {
    tasks.push(sendCustomerReservationEmail({
      reservation,
      event,
      to: customer.email,
      displayName: customer.displayName || customer.firstName || "Traveller",
      locale,
      tripTitle
    }));
  }

  tasks.push(sendOperationsReservationEmail({
    reservation,
    event,
    customerName: customer?.displayName,
    customerEmail: customer?.email,
    tripTitle
  }));

  await Promise.allSettled(tasks);
}
