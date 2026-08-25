import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Reservation } from "@/domain/booking/types";
import type { TravelLocale } from "@/domain/travel/types";
import { buildRoomingListRows, buildTravellerManifestRows } from "@/lib/departure-manifests";

export type DepartureDocumentInput = {
  reservations: Reservation[];
  tripTitle: string;
  departureDate?: string;
  returnDate?: string;
  locale: TravelLocale;
};

const a4 = { width: 595.28, height: 841.89 };
const margin = 42;
const footerHeight = 44;
const bodyWidth = a4.width - margin * 2;
const textColor = rgb(0.10, 0.12, 0.15);
const mutedColor = rgb(0.38, 0.42, 0.48);
const brandColor = rgb(0.03, 0.18, 0.31);
const lineColor = rgb(0.86, 0.88, 0.91);

function copy(locale: TravelLocale) {
  return locale === "es"
    ? {
        brand: "Kairoseth Travel",
        travellerList: "Lista de viajeros",
        roomingList: "Rooming List",
        departure: "Salida",
        return: "Regreso",
        activeBookings: "Reservas activas",
        travellers: "Viajeros",
        reference: "Reserva",
        status: "Estado",
        lead: "principal",
        dob: "Nacimiento",
        age: "Edad",
        nationality: "Nacionalidad",
        fare: "Tarifa",
        pending: "Pendiente",
        confirmed: "Confirmada",
        accommodation: "Alojamiento",
        stay: "Estancia",
        room: "Habitación",
        mealPlan: "Régimen",
        nights: "noches",
        noRooms: "No hay habitaciones asignadas en las reservas activas de esta salida.",
        generated: "Generado",
        privacy: "Documento operativo generado únicamente con datos básicos guardados en las reservas. No incluye datos post-compra protegidos, notas internas ni información de proveedores.",
        roomOnly: "Solo alojamiento",
        breakfast: "Desayuno",
        halfBoard: "Media pensión",
        fullBoard: "Pensión completa",
        allInclusive: "Todo incluido"
      }
    : {
        brand: "Kairoseth Travel",
        travellerList: "Traveller list",
        roomingList: "Rooming List",
        departure: "Departure",
        return: "Return",
        activeBookings: "Active bookings",
        travellers: "Travellers",
        reference: "Booking",
        status: "Status",
        lead: "lead",
        dob: "Date of birth",
        age: "Age",
        nationality: "Nationality",
        fare: "Fare",
        pending: "Pending",
        confirmed: "Confirmed",
        accommodation: "Accommodation",
        stay: "Stay",
        room: "Room",
        mealPlan: "Meal plan",
        nights: "nights",
        noRooms: "No rooms are allocated across the active bookings for this departure.",
        generated: "Generated",
        privacy: "Operational document generated only from basic booking snapshot data. It does not include protected post-purchase traveller data, internal notes or supplier information.",
        roomOnly: "Room only",
        breakfast: "Breakfast",
        halfBoard: "Half board",
        fullBoard: "Full board",
        allInclusive: "All inclusive"
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
    } catch {
      const fallback = character.normalize("NFKD").replace(/\p{M}/gu, "");
      let added = false;
      for (const candidate of fallback) {
        try {
          font.encodeText(candidate);
          output += candidate;
          added = true;
        } catch {
          // Keep looking for an encodable fallback.
        }
      }
      if (!added) output += "?";
    }
  }
  return output;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const result: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      result.push("");
      continue;
    }
    let current = words[0];
    for (const word of words.slice(1)) {
      const candidate = `${current} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate;
      else {
        result.push(current);
        current = word;
      }
    }
    result.push(current);
  }
  return result;
}

function formatDate(value: string | undefined, locale: TravelLocale) {
  if (!value) return "-";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function formatDateTime(locale: TravelLocale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(new Date());
}

function safeFilenamePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "departure";
}

type PdfState = {
  document: PDFDocument;
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  locale: TravelLocale;
  y: number;
};

function addFooter(state: PdfState, page: PDFPage) {
  page.drawText("Kairoseth Travel", { x: margin, y: 22, size: 8, font: state.regular, color: mutedColor });
  page.drawText("travel.kairoseth.com", { x: a4.width - margin - 92, y: 22, size: 8, font: state.regular, color: mutedColor });
}

function addPage(state: PdfState) {
  state.page = state.document.addPage([a4.width, a4.height]);
  state.y = a4.height - margin;
}

function ensureSpace(state: PdfState, required: number) {
  if (state.y - required < footerHeight) addPage(state);
}

function text(
  state: PdfState,
  value: unknown,
  options?: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; indent?: number; gapAfter?: number }
) {
  const font = options?.bold ? state.bold : state.regular;
  const size = options?.size ?? 9.5;
  const color = options?.color ?? textColor;
  const indent = options?.indent ?? 0;
  const lines = wrapText(encodableText(value, font), font, size, bodyWidth - indent);
  const lineHeight = size * 1.35;
  ensureSpace(state, Math.max(lineHeight, lines.length * lineHeight) + (options?.gapAfter ?? 0));
  for (const line of lines) {
    state.page.drawText(line || " ", { x: margin + indent, y: state.y, size, font, color });
    state.y -= lineHeight;
  }
  state.y -= options?.gapAfter ?? 0;
}

function section(state: PdfState, title: string) {
  ensureSpace(state, 30);
  state.y -= 5;
  state.page.drawLine({
    start: { x: margin, y: state.y + 10 },
    end: { x: a4.width - margin, y: state.y + 10 },
    thickness: 0.8,
    color: lineColor
  });
  text(state, title, { size: 11.5, bold: true, color: brandColor, gapAfter: 4 });
}

function metaLine(state: PdfState, label: string, value: unknown) {
  text(state, `${label}: ${normalizeText(value) || "-"}`, { size: 9.2, gapAfter: 1 });
}

function startDocument(input: DepartureDocumentInput, title: string) {
  return PDFDocument.create().then(async (document) => {
    const regular = await document.embedFont(StandardFonts.Helvetica);
    const bold = await document.embedFont(StandardFonts.HelveticaBold);
    document.setTitle(`${title} - ${input.tripTitle}`);
    document.setAuthor("Kairoseth Travel");
    document.setCreator("Kairoseth Travel");
    document.setProducer("Open Travel Platform");
    const page = document.addPage([a4.width, a4.height]);
    const state: PdfState = { document, page, regular, bold, locale: input.locale, y: a4.height - margin };
    text(state, "Kairoseth Travel", { size: 12.5, bold: true, color: brandColor, gapAfter: 8 });
    text(state, title, { size: 21, bold: true, gapAfter: 4 });
    text(state, input.tripTitle, { size: 12, bold: true, color: mutedColor, gapAfter: 8 });
    return state;
  });
}

function finishDocument(state: PdfState, privacyText: string) {
  section(state, copy(state.locale).generated);
  text(state, formatDateTime(state.locale), { size: 8.8, color: mutedColor, gapAfter: 3 });
  text(state, privacyText, { size: 8.2, color: mutedColor });
  for (const page of state.document.getPages()) addFooter(state, page);
  return state.document.save({ useObjectStreams: false });
}

function mealPlanLabel(value: string | undefined, locale: TravelLocale) {
  const c = copy(locale);
  if (value === "room-only") return c.roomOnly;
  if (value === "breakfast") return c.breakfast;
  if (value === "half-board") return c.halfBoard;
  if (value === "full-board") return c.fullBoard;
  if (value === "all-inclusive") return c.allInclusive;
  return value || "-";
}

export function travellerListFilename(input: Pick<DepartureDocumentInput, "tripTitle" | "departureDate" | "locale">) {
  return `${input.locale === "es" ? "lista-viajeros" : "traveller-list"}-${safeFilenamePart(input.tripTitle)}-${safeFilenamePart(input.departureDate ?? "departure")}.pdf`;
}

export function roomingListFilename(input: Pick<DepartureDocumentInput, "tripTitle" | "departureDate">) {
  return `rooming-list-${safeFilenamePart(input.tripTitle)}-${safeFilenamePart(input.departureDate ?? "departure")}.pdf`;
}

export async function renderTravellerListPdf(input: DepartureDocumentInput) {
  const c = copy(input.locale);
  const rows = buildTravellerManifestRows(input.reservations);
  const state = await startDocument(input, c.travellerList);

  metaLine(state, c.departure, formatDate(input.departureDate, input.locale));
  metaLine(state, c.return, formatDate(input.returnDate, input.locale));
  metaLine(state, c.activeBookings, input.reservations.length);
  metaLine(state, c.travellers, rows.length);

  section(state, c.travellers);
  for (const [index, row] of rows.entries()) {
    ensureSpace(state, 52);
    text(state, `${index + 1}. ${row.firstName} ${row.lastName}${row.isLead ? ` (${c.lead})` : ""}`, { size: 10, bold: true, gapAfter: 1 });
    text(
      state,
      `${c.reference}: ${row.reservationId} · ${c.status}: ${row.reservationStatus === "confirmed" ? c.confirmed : c.pending}`,
      { size: 8.8, color: mutedColor, indent: 8, gapAfter: 1 }
    );
    text(
      state,
      `${c.dob}: ${formatDate(row.dateOfBirth, input.locale)} · ${c.age}: ${row.ageAtDeparture} · ${c.nationality}: ${row.nationality} · ${c.fare}: ${row.pricingLabel}`,
      { size: 8.8, indent: 8, gapAfter: 4 }
    );
  }

  return finishDocument(state, c.privacy);
}

export async function renderRoomingListPdf(input: DepartureDocumentInput) {
  const c = copy(input.locale);
  const rows = buildRoomingListRows(input.reservations);
  const state = await startDocument(input, c.roomingList);

  metaLine(state, c.departure, formatDate(input.departureDate, input.locale));
  metaLine(state, c.return, formatDate(input.returnDate, input.locale));
  metaLine(state, c.activeBookings, input.reservations.length);
  metaLine(state, c.travellers, buildTravellerManifestRows(input.reservations).length);

  if (!rows.length) {
    section(state, c.accommodation);
    text(state, c.noRooms, { color: mutedColor });
    return finishDocument(state, c.privacy);
  }

  let currentStay = "";
  for (const row of rows) {
    const stayKey = `${row.accommodationId}:${row.checkInDate}:${row.checkOutDate}:${row.roomTypeId}`;
    if (stayKey !== currentStay) {
      currentStay = stayKey;
      section(state, row.accommodationName);
      metaLine(state, c.stay, `${formatDate(row.checkInDate, input.locale)} - ${formatDate(row.checkOutDate, input.locale)} · ${row.nights} ${c.nights}`);
      metaLine(state, c.room, row.roomTypeName);
      metaLine(state, c.mealPlan, mealPlanLabel(row.mealPlan, input.locale));
      state.y -= 4;
    }

    ensureSpace(state, 52);
    text(state, `${c.room} ${row.roomIndex} · ${c.reference}: ${row.reservationId}`, { size: 10, bold: true, gapAfter: 2 });
    if (row.travellers.length) {
      for (const traveller of row.travellers) {
        text(
          state,
          `- ${traveller.firstName} ${traveller.lastName}${traveller.isLead ? ` (${c.lead})` : ""} · ${traveller.ageAtDeparture} · ${traveller.nationality}`,
          { size: 8.9, indent: 8, gapAfter: 1 }
        );
      }
    } else {
      text(state, "-", { size: 8.9, indent: 8 });
    }
    state.y -= 4;
  }

  return finishDocument(state, c.privacy);
}
