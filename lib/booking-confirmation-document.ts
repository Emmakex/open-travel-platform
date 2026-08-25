import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage
} from "pdf-lib";
import type { Reservation } from "@/domain/booking/types";
import type { CustomerProfile } from "@/domain/identity/types";
import type { PaymentSummary } from "@/domain/payment/types";
import type { TravelLocale } from "@/domain/travel/types";

export type BookingConfirmationDocumentInput = {
  reservation: Reservation;
  locale: TravelLocale;
  customer?: Pick<CustomerProfile, "firstName" | "lastName" | "email" | "phone" | "country"> | null;
  payment?: PaymentSummary | null;
};

const a4 = { width: 595.28, height: 841.89 };
const margin = 46;
const footerHeight = 44;
const bodyWidth = a4.width - margin * 2;
const textColor = rgb(0.10, 0.12, 0.15);
const mutedColor = rgb(0.38, 0.42, 0.48);
const lineColor = rgb(0.86, 0.88, 0.91);
const brandColor = rgb(0.03, 0.18, 0.31);

function labels(locale: TravelLocale) {
  return locale === "es"
    ? {
        brand: "Kairoseth Travel",
        title: "Confirmación de reserva",
        booking: "Reserva",
        reference: "Referencia",
        status: "Estado",
        created: "Creada",
        trip: "Viaje",
        departure: "Salida",
        return: "Regreso",
        travellers: "Viajeros",
        customer: "Cliente",
        email: "Email",
        phone: "Teléfono",
        country: "País",
        accommodation: "Alojamiento",
        room: "Habitación",
        stay: "Estancia",
        nights: "noches",
        rooms: "habitaciones",
        mealPlan: "Régimen",
        supplements: "Suplementos del paquete",
        quantity: "Cantidad",
        payment: "Resumen de pago",
        total: "Total de la reserva",
        paid: "Pagado",
        outstanding: "Pendiente",
        paymentStatus: "Estado del pago",
        lead: "principal",
        noAccommodation: "No hay alojamiento incluido o añadido a esta reserva.",
        noSupplements: "No hay suplementos opcionales en esta reserva.",
        generated: "Documento generado",
        disclaimer: "Este documento resume el estado actual de la reserva y no sustituye una factura fiscal.",
        statuses: {
          pending: "Pendiente",
          confirmed: "Confirmada",
          cancelled: "Cancelada"
        },
        paymentStatuses: {
          unpaid: "No pagado",
          pending: "Pendiente",
          partially_paid: "Parcialmente pagado",
          paid: "Pagado",
          partially_refunded: "Parcialmente reembolsado",
          refunded: "Reembolsado"
        },
        mealPlans: {
          "room-only": "Solo alojamiento",
          breakfast: "Desayuno",
          "half-board": "Media pensión",
          "full-board": "Pensión completa",
          "all-inclusive": "Todo incluido"
        }
      }
    : {
        brand: "Kairoseth Travel",
        title: "Booking confirmation",
        booking: "Booking",
        reference: "Reference",
        status: "Status",
        created: "Created",
        trip: "Trip",
        departure: "Departure",
        return: "Return",
        travellers: "Travellers",
        customer: "Customer",
        email: "Email",
        phone: "Phone",
        country: "Country",
        accommodation: "Accommodation",
        room: "Room",
        stay: "Stay",
        nights: "nights",
        rooms: "rooms",
        mealPlan: "Meal plan",
        supplements: "Package supplements",
        quantity: "Quantity",
        payment: "Payment summary",
        total: "Reservation total",
        paid: "Paid",
        outstanding: "Outstanding",
        paymentStatus: "Payment status",
        lead: "lead",
        noAccommodation: "No accommodation is included or added to this reservation.",
        noSupplements: "No optional package supplements are attached to this reservation.",
        generated: "Document generated",
        disclaimer: "This document summarises the current reservation record and does not replace a fiscal invoice.",
        statuses: {
          pending: "Pending",
          confirmed: "Confirmed",
          cancelled: "Cancelled"
        },
        paymentStatuses: {
          unpaid: "Unpaid",
          pending: "Pending",
          partially_paid: "Partially paid",
          paid: "Paid",
          partially_refunded: "Partially refunded",
          refunded: "Refunded"
        },
        mealPlans: {
          "room-only": "Room only",
          breakfast: "Breakfast",
          "half-board": "Half board",
          "full-board": "Full board",
          "all-inclusive": "All inclusive"
        }
      };
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/\u2192/g, "->")
    .trim();
}

function encodableText(value: unknown, font: PDFFont) {
  const normalized = normalizeText(value);
  let output = "";
  for (const character of normalized) {
    try {
      font.encodeText(character);
      output += character;
      continue;
    } catch {
      const fallback = character.normalize("NFKD").replace(/\p{M}/gu, "");
      let added = false;
      for (const candidate of fallback) {
        try {
          font.encodeText(candidate);
          output += candidate;
          added = true;
        } catch {
          // Continue trying the decomposed fallback.
        }
      }
      if (!added) output += "?";
    }
  }
  return output;
}

function formatDate(value: string | undefined, locale: TravelLocale) {
  if (!value) return "-";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function formatDateTime(value: string, locale: TravelLocale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(date);
}

function money(value: number, currency: string, locale: TravelLocale) {
  try {
    return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let current = words[0];
    for (const word of words.slice(1)) {
      const candidate = `${current} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
}

type PdfState = {
  document: PDFDocument;
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  locale: TravelLocale;
  y: number;
};

function addPage(state: PdfState) {
  state.page = state.document.addPage([a4.width, a4.height]);
  state.y = a4.height - margin;
  state.page.drawText("Kairoseth Travel", {
    x: margin,
    y: 24,
    size: 8,
    font: state.regular,
    color: mutedColor
  });
  state.page.drawText("travel.kairoseth.com", {
    x: a4.width - margin - 92,
    y: 24,
    size: 8,
    font: state.regular,
    color: mutedColor
  });
}

function ensureSpace(state: PdfState, required: number) {
  if (state.y - required < footerHeight) addPage(state);
}

function drawWrappedText(
  state: PdfState,
  value: unknown,
  options?: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; indent?: number; gapAfter?: number }
) {
  const font = options?.font ?? state.regular;
  const size = options?.size ?? 10;
  const color = options?.color ?? textColor;
  const indent = options?.indent ?? 0;
  const text = encodableText(value, font);
  const lines = wrapText(text, font, size, bodyWidth - indent);
  const lineHeight = size * 1.35;
  ensureSpace(state, Math.max(lineHeight, lines.length * lineHeight) + (options?.gapAfter ?? 0));
  for (const line of lines) {
    state.page.drawText(line || " ", {
      x: margin + indent,
      y: state.y,
      size,
      font,
      color
    });
    state.y -= lineHeight;
  }
  state.y -= options?.gapAfter ?? 0;
}

function section(state: PdfState, title: string) {
  ensureSpace(state, 34);
  state.y -= 7;
  state.page.drawLine({
    start: { x: margin, y: state.y + 11 },
    end: { x: a4.width - margin, y: state.y + 11 },
    thickness: 0.8,
    color: lineColor
  });
  drawWrappedText(state, title, { font: state.bold, size: 12, color: brandColor, gapAfter: 5 });
}

function keyValue(state: PdfState, key: string, value: unknown) {
  const keyText = `${encodableText(key, state.bold)}:`;
  const valueText = encodableText(value, state.regular) || "-";
  const keyWidth = Math.min(118, Math.max(74, state.bold.widthOfTextAtSize(keyText, 9) + 8));
  const valueWidth = bodyWidth - keyWidth;
  const lines = wrapText(valueText, state.regular, 9.5, valueWidth);
  const lineHeight = 12.8;
  ensureSpace(state, Math.max(16, lines.length * lineHeight + 2));
  state.page.drawText(keyText, {
    x: margin,
    y: state.y,
    size: 9,
    font: state.bold,
    color: mutedColor
  });
  for (const [index, line] of lines.entries()) {
    state.page.drawText(line || "-", {
      x: margin + keyWidth,
      y: state.y - index * lineHeight,
      size: 9.5,
      font: state.regular,
      color: textColor
    });
  }
  state.y -= Math.max(16, lines.length * lineHeight + 2);
}

function bullet(state: PdfState, value: unknown) {
  drawWrappedText(state, `- ${normalizeText(value)}`, { size: 9.5, indent: 5, gapAfter: 2 });
}

export function bookingConfirmationFilename(reservationId: string, locale: TravelLocale) {
  const safeId = reservationId.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "reservation";
  return `${locale === "es" ? "confirmacion-reserva" : "booking-confirmation"}-${safeId}.pdf`;
}

export async function renderBookingConfirmationPdf(input: BookingConfirmationDocumentInput) {
  const copy = labels(input.locale);
  const { reservation } = input;
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.setTitle(`${copy.title} - ${reservation.id}`);
  document.setSubject(copy.disclaimer);
  document.setAuthor(copy.brand);
  document.setCreator(copy.brand);
  document.setProducer("Open Travel Platform");

  const firstPage = document.addPage([a4.width, a4.height]);
  const state: PdfState = { document, page: firstPage, regular, bold, locale: input.locale, y: a4.height - margin };
  state.page.drawText(copy.brand, {
    x: margin,
    y: state.y,
    size: 13,
    font: bold,
    color: brandColor
  });
  state.y -= 30;
  drawWrappedText(state, copy.title, { font: bold, size: 22, color: textColor, gapAfter: 4 });
  drawWrappedText(state, `${copy.reference}: ${reservation.id}`, { size: 10, color: mutedColor, gapAfter: 9 });

  section(state, copy.booking);
  keyValue(state, copy.trip, reservation.tripTitle ?? reservation.tripId);
  keyValue(state, copy.status, copy.statuses[reservation.status]);
  keyValue(state, copy.departure, formatDate(reservation.departureDate, input.locale));
  keyValue(state, copy.return, formatDate(reservation.returnDate, input.locale));
  keyValue(state, copy.created, formatDateTime(reservation.createdAt, input.locale));
  keyValue(state, copy.travellers, reservation.partySize);
  keyValue(state, copy.total, money(reservation.totalPrice, reservation.currency, input.locale));

  if (input.customer) {
    section(state, copy.customer);
    keyValue(state, copy.customer, `${input.customer.firstName} ${input.customer.lastName}`.trim());
    keyValue(state, copy.email, input.customer.email);
    if (input.customer.phone) keyValue(state, copy.phone, input.customer.phone);
    if (input.customer.country) keyValue(state, copy.country, input.customer.country);
  }

  if (reservation.travellers?.length) {
    section(state, copy.travellers);
    for (const traveller of reservation.travellers) {
      const name = `${traveller.firstName} ${traveller.lastName}`.trim();
      bullet(state, `${name}${traveller.isLead ? ` (${copy.lead})` : ""}`);
    }
  }

  section(state, copy.accommodation);
  if (reservation.accommodationBookings?.length) {
    for (const booking of reservation.accommodationBookings) {
      drawWrappedText(state, booking.accommodationName, { font: bold, size: 10.5, gapAfter: 2 });
      keyValue(state, copy.room, booking.roomTypeName);
      keyValue(
        state,
        copy.stay,
        `${formatDate(booking.checkInDate, input.locale)} - ${formatDate(booking.checkOutDate, input.locale)} · ${booking.nights} ${copy.nights}`
      );
      keyValue(state, copy.rooms, booking.rooms.length);
      if (booking.mealPlan) keyValue(state, copy.mealPlan, copy.mealPlans[booking.mealPlan]);
      state.y -= 3;
    }
  } else {
    drawWrappedText(state, copy.noAccommodation, { size: 9.5, color: mutedColor, gapAfter: 3 });
  }

  section(state, copy.supplements);
  if (reservation.packageAddOns?.length) {
    for (const addOn of reservation.packageAddOns) {
      const title = input.locale === "es" ? addOn.titleEs || addOn.title : addOn.title;
      bullet(
        state,
        `${title} · ${copy.quantity}: ${addOn.quantity} · ${money(addOn.totalPrice, reservation.currency, input.locale)}`
      );
    }
  } else {
    drawWrappedText(state, copy.noSupplements, { size: 9.5, color: mutedColor, gapAfter: 3 });
  }

  if (input.payment) {
    section(state, copy.payment);
    keyValue(state, copy.paymentStatus, copy.paymentStatuses[input.payment.status]);
    keyValue(state, copy.paid, money(input.payment.netPaidAmount, input.payment.currency, input.locale));
    keyValue(state, copy.outstanding, money(input.payment.outstandingAmount, input.payment.currency, input.locale));
  }

  section(state, copy.generated);
  keyValue(state, copy.generated, formatDateTime(new Date().toISOString(), input.locale));
  drawWrappedText(state, copy.disclaimer, { size: 8.8, color: mutedColor, gapAfter: 2 });

  for (const page of document.getPages()) {
    page.drawText(copy.brand, {
      x: margin,
      y: 24,
      size: 8,
      font: regular,
      color: mutedColor
    });
    page.drawText("travel.kairoseth.com", {
      x: a4.width - margin - 92,
      y: 24,
      size: 8,
      font: regular,
      color: mutedColor
    });
  }

  return document.save({ useObjectStreams: false });
}
