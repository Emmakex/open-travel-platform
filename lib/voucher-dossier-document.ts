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
import type { ServiceReservation } from "@/domain/services/booking-types";
import type { TravelLocale } from "@/domain/travel/types";

export type CustomerSafeSupplierReferences = ReadonlyMap<string, string>;

export type DossierFulfilmentItem = {
  componentKey: string;
  componentLabel: string;
  status: "not-requested" | "requested" | "confirmed" | "rejected" | "cancelled";
  supplierName?: string;
  supplierReference?: string;
  deadline?: string;
};

export type AccommodationVoucherInput = {
  reservation: Reservation;
  locale: TravelLocale;
  supplierReferences?: CustomerSafeSupplierReferences;
  generatedAt?: string;
};

export type ServiceVoucherInput = {
  reservation: ServiceReservation;
  locale: TravelLocale;
  supplierReferences?: CustomerSafeSupplierReferences;
  generatedAt?: string;
};

export type ReservationDossierInput = {
  reservation: Reservation;
  locale: TravelLocale;
  customer?: Pick<CustomerProfile, "firstName" | "lastName" | "email" | "phone" | "country"> | null;
  payment?: PaymentSummary | null;
  linkedServices?: ServiceReservation[];
  fulfilment?: DossierFulfilmentItem[];
  generatedAt?: string;
};

const a4 = { width: 595.28, height: 841.89 };
const margin = 46;
const footerHeight = 42;
const bodyWidth = a4.width - margin * 2;
const textColor = rgb(0.10, 0.12, 0.15);
const mutedColor = rgb(0.38, 0.42, 0.48);
const lineColor = rgb(0.86, 0.88, 0.91);
const brandColor = rgb(0.03, 0.18, 0.31);

type PdfState = {
  document: PDFDocument;
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  locale: TravelLocale;
  y: number;
};

function t(locale: TravelLocale, en: string, es: string) {
  return locale === "es" ? es : en;
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
          // Continue trying decomposed characters.
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

function safeToken(value: string, fallback: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || fallback;
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
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate;
      else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
}

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

function text(
  state: PdfState,
  value: unknown,
  options?: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; indent?: number; gapAfter?: number }
) {
  const font = options?.font ?? state.regular;
  const size = options?.size ?? 10;
  const color = options?.color ?? textColor;
  const indent = options?.indent ?? 0;
  const valueText = encodableText(value, font);
  const lines = wrapText(valueText, font, size, bodyWidth - indent);
  const lineHeight = size * 1.35;
  ensureSpace(state, Math.max(lineHeight, lines.length * lineHeight) + (options?.gapAfter ?? 0));
  for (const line of lines) {
    state.page.drawText(line || " ", { x: margin + indent, y: state.y, size, font, color });
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
  text(state, title, { font: state.bold, size: 12, color: brandColor, gapAfter: 5 });
}

function keyValue(state: PdfState, key: string, value: unknown) {
  const keyText = `${encodableText(key, state.bold)}:`;
  const valueText = encodableText(value, state.regular) || "-";
  const keyWidth = Math.min(128, Math.max(78, state.bold.widthOfTextAtSize(keyText, 9) + 8));
  const lines = wrapText(valueText, state.regular, 9.5, bodyWidth - keyWidth);
  const lineHeight = 12.8;
  ensureSpace(state, Math.max(16, lines.length * lineHeight + 2));
  state.page.drawText(keyText, { x: margin, y: state.y, size: 9, font: state.bold, color: mutedColor });
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
  text(state, `- ${normalizeText(value)}`, { size: 9.5, indent: 5, gapAfter: 2 });
}

async function beginDocument(title: string, subject: string, locale: TravelLocale, reference: string) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.setTitle(`${title} - ${reference}`);
  document.setSubject(subject);
  document.setAuthor("Kairoseth Travel");
  document.setCreator("Kairoseth Travel");
  document.setProducer("Open Travel Platform");
  const page = document.addPage([a4.width, a4.height]);
  const state: PdfState = { document, page, regular, bold, locale, y: a4.height - margin };
  state.page.drawText("Kairoseth Travel", { x: margin, y: state.y, size: 13, font: bold, color: brandColor });
  state.y -= 30;
  text(state, title, { font: bold, size: 22, gapAfter: 4 });
  text(state, `${t(locale, "Reference", "Referencia")}: ${reference}`, { size: 10, color: mutedColor, gapAfter: 8 });
  return state;
}

function documentMeta(state: PdfState, generatedAt: string, status: string) {
  keyValue(state, t(state.locale, "Document version", "Versión del documento"), "1.0");
  keyValue(state, t(state.locale, "Document status", "Estado del documento"), status);
  keyValue(state, t(state.locale, "Generated at", "Generado"), formatDateTime(generatedAt, state.locale));
}

function travellerName(reservation: Reservation | ServiceReservation, id: string) {
  const traveller = reservation.travellers?.find((item) => item.id === id);
  return traveller ? `${traveller.firstName} ${traveller.lastName}`.trim() : id;
}

function mealPlan(value: string | undefined, locale: TravelLocale) {
  if (!value) return "-";
  const values: Record<string, [string, string]> = {
    "room-only": ["Room only", "Solo alojamiento"],
    breakfast: ["Breakfast", "Desayuno"],
    "half-board": ["Half board", "Media pensión"],
    "full-board": ["Full board", "Pensión completa"],
    "all-inclusive": ["All inclusive", "Todo incluido"]
  };
  const label = values[value];
  return label ? (locale === "es" ? label[1] : label[0]) : value;
}

export function accommodationVoucherFilename(reservationId: string, locale: TravelLocale) {
  return `${locale === "es" ? "voucher-alojamiento" : "accommodation-voucher"}-${safeToken(reservationId, "reservation")}.pdf`;
}

export function serviceVoucherFilename(reservationId: string, locale: TravelLocale) {
  return `${locale === "es" ? "voucher-servicio" : "service-voucher"}-${safeToken(reservationId, "service")}.pdf`;
}

export function reservationDossierFilename(reservationId: string, locale: TravelLocale) {
  return `${locale === "es" ? "expediente-reserva" : "reservation-dossier"}-${safeToken(reservationId, "reservation")}.pdf`;
}

export async function renderAccommodationVoucherPdf(input: AccommodationVoucherInput) {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const title = t(input.locale, "Accommodation voucher", "Voucher de alojamiento");
  const state = await beginDocument(
    title,
    t(input.locale, "Customer-facing accommodation voucher generated from the contracted reservation snapshot.", "Voucher de alojamiento orientado al cliente generado desde el snapshot contratado de la reserva."),
    input.locale,
    input.reservation.id
  );
  documentMeta(state, generatedAt, t(input.locale, "Customer copy · confirmed booking", "Copia cliente · reserva confirmada"));

  section(state, t(input.locale, "Trip", "Viaje"));
  keyValue(state, t(input.locale, "Trip", "Viaje"), input.reservation.tripTitle ?? input.reservation.tripId);
  keyValue(state, t(input.locale, "Departure", "Salida"), formatDate(input.reservation.departureDate, input.locale));
  keyValue(state, t(input.locale, "Return", "Regreso"), formatDate(input.reservation.returnDate, input.locale));

  section(state, t(input.locale, "Travellers", "Viajeros"));
  for (const traveller of input.reservation.travellers ?? []) {
    bullet(state, `${traveller.firstName} ${traveller.lastName}${traveller.isLead ? ` (${t(input.locale, "lead", "principal")})` : ""}`);
  }

  section(state, t(input.locale, "Accommodation", "Alojamiento"));
  for (const stay of input.reservation.accommodationBookings ?? []) {
    text(state, stay.accommodationName, { font: state.bold, size: 11, gapAfter: 2 });
    keyValue(state, t(input.locale, "Room", "Habitación"), stay.roomTypeName);
    keyValue(state, t(input.locale, "Check-in", "Entrada"), formatDate(stay.checkInDate, input.locale));
    keyValue(state, t(input.locale, "Check-out", "Salida"), formatDate(stay.checkOutDate, input.locale));
    keyValue(state, t(input.locale, "Nights", "Noches"), stay.nights);
    keyValue(state, t(input.locale, "Meal plan", "Régimen"), mealPlan(stay.mealPlan, input.locale));
    for (const [index, room] of stay.rooms.entries()) {
      keyValue(
        state,
        `${t(input.locale, "Room", "Habitación")} ${index + 1}`,
        room.travellerIds.map((id) => travellerName(input.reservation, id)).join(", ")
      );
    }
    const supplierReference = input.supplierReferences?.get(`accommodation:${stay.componentId}`);
    if (supplierReference) {
      keyValue(state, t(input.locale, "Supplier confirmation", "Confirmación del proveedor"), supplierReference);
    }
    state.y -= 5;
  }

  section(state, t(input.locale, "Important", "Importante"));
  text(
    state,
    t(
      input.locale,
      "This voucher reflects the current confirmed booking snapshot. Supplier references are printed only when the travel team has explicitly approved that exact reference for customer disclosure. Internal notes, supplier costs and protected post-purchase traveller fields are not included.",
      "Este voucher refleja el snapshot actual de la reserva confirmada. Las referencias del proveedor solo se imprimen cuando el equipo ha aprobado explícitamente esa referencia exacta para mostrarla al cliente. No se incluyen notas internas, costes de proveedor ni campos post-compra protegidos del viajero."
    ),
    { size: 9, color: mutedColor }
  );

  return state.document.save();
}

export async function renderServiceVoucherPdf(input: ServiceVoucherInput) {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const title = t(input.locale, "Service voucher", "Voucher de servicio");
  const state = await beginDocument(
    title,
    t(input.locale, "Customer-facing service voucher generated from the contracted service reservation snapshot.", "Voucher de servicio orientado al cliente generado desde el snapshot contratado de la reserva de servicio."),
    input.locale,
    input.reservation.id
  );
  documentMeta(state, generatedAt, t(input.locale, "Customer copy · confirmed booking", "Copia cliente · reserva confirmada"));

  section(state, t(input.locale, "Service", "Servicio"));
  keyValue(state, t(input.locale, "Service", "Servicio"), input.reservation.serviceTitle);
  keyValue(
    state,
    t(input.locale, "Type", "Tipo"),
    input.reservation.serviceType === "activity"
      ? t(input.locale, "Activity", "Actividad")
      : input.reservation.serviceType === "transport"
        ? t(input.locale, "Transport", "Transporte")
        : t(input.locale, "Travel protection", "Protección de viaje")
  );
  if (input.reservation.serviceDate) {
    keyValue(state, t(input.locale, "Date", "Fecha"), formatDate(input.reservation.serviceDate, input.locale));
    keyValue(state, t(input.locale, "Time", "Horario"), [input.reservation.startTime, input.reservation.endTime].filter(Boolean).join(" - ") || "-");
  }
  if (input.reservation.insuranceTrip) {
    keyValue(state, t(input.locale, "Destination", "Destino"), input.reservation.insuranceTrip.destination);
    keyValue(
      state,
      t(input.locale, "Covered trip dates", "Fechas del viaje cubierto"),
      `${formatDate(input.reservation.insuranceTrip.startDate, input.locale)} - ${formatDate(input.reservation.insuranceTrip.endDate, input.locale)}`
    );
  }
  keyValue(state, t(input.locale, "Quantity", "Cantidad"), input.reservation.quantity);

  section(state, t(input.locale, "Travellers", "Viajeros"));
  for (const traveller of input.reservation.travellers) {
    bullet(state, `${traveller.firstName} ${traveller.lastName}${traveller.isLead ? ` (${t(input.locale, "lead", "principal")})` : ""}`);
  }

  const supplierReference = input.supplierReferences?.get("service");
  if (supplierReference) {
    section(state, t(input.locale, "Supplier confirmation", "Confirmación del proveedor"));
    keyValue(state, t(input.locale, "Confirmation / locator", "Confirmación / localizador"), supplierReference);
  }

  section(state, t(input.locale, "Important", "Importante"));
  text(
    state,
    t(
      input.locale,
      "This voucher reflects the current confirmed service reservation. A supplier reference is shown only after explicit approval for customer disclosure. Internal notes, supplier costs and protected post-purchase traveller fields are excluded.",
      "Este voucher refleja la reserva de servicio confirmada actual. Una referencia de proveedor solo se muestra tras su aprobación explícita para divulgarla al cliente. Se excluyen notas internas, costes de proveedor y campos post-compra protegidos del viajero."
    ),
    { size: 9, color: mutedColor }
  );

  return state.document.save();
}

export async function renderReservationDossierPdf(input: ReservationDossierInput) {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const title = t(input.locale, "Reservation dossier", "Expediente de reserva");
  const state = await beginDocument(
    title,
    t(input.locale, "Internal Operator reservation dossier generated from current operational snapshots.", "Expediente interno de Operator generado desde los snapshots operativos actuales."),
    input.locale,
    input.reservation.id
  );
  documentMeta(
    state,
    generatedAt,
    `${t(input.locale, "Internal Operator copy", "Copia interna Operator")} · ${input.reservation.status.toUpperCase()}`
  );

  section(state, t(input.locale, "Booking", "Reserva"));
  keyValue(state, t(input.locale, "Trip", "Viaje"), input.reservation.tripTitle ?? input.reservation.tripId);
  keyValue(state, t(input.locale, "Status", "Estado"), input.reservation.status);
  keyValue(state, t(input.locale, "Departure", "Salida"), formatDate(input.reservation.departureDate, input.locale));
  keyValue(state, t(input.locale, "Return", "Regreso"), formatDate(input.reservation.returnDate, input.locale));
  keyValue(state, t(input.locale, "Created", "Creada"), formatDateTime(input.reservation.createdAt, input.locale));
  keyValue(state, t(input.locale, "Travellers", "Viajeros"), input.reservation.partySize);
  keyValue(state, t(input.locale, "Reservation total", "Total de reserva"), money(input.reservation.totalPrice, input.reservation.currency, input.locale));

  if (input.customer) {
    section(state, t(input.locale, "Customer", "Cliente"));
    keyValue(state, t(input.locale, "Name", "Nombre"), `${input.customer.firstName} ${input.customer.lastName}`.trim());
    keyValue(state, "Email", input.customer.email);
    if (input.customer.phone) keyValue(state, t(input.locale, "Phone", "Teléfono"), input.customer.phone);
    if (input.customer.country) keyValue(state, t(input.locale, "Country", "País"), input.customer.country);
  }

  section(state, t(input.locale, "Travellers", "Viajeros"));
  for (const traveller of input.reservation.travellers ?? []) {
    bullet(
      state,
      `${traveller.firstName} ${traveller.lastName} · ${formatDate(traveller.dateOfBirth, input.locale)} · ${traveller.nationality}${traveller.isLead ? ` · ${t(input.locale, "lead", "principal")}` : ""}`
    );
  }

  section(state, t(input.locale, "Accommodation", "Alojamiento"));
  if (input.reservation.accommodationBookings?.length) {
    for (const stay of input.reservation.accommodationBookings) {
      text(state, stay.accommodationName, { font: state.bold, size: 10.5, gapAfter: 2 });
      keyValue(state, t(input.locale, "Room", "Habitación"), stay.roomTypeName);
      keyValue(state, t(input.locale, "Stay", "Estancia"), `${formatDate(stay.checkInDate, input.locale)} - ${formatDate(stay.checkOutDate, input.locale)} · ${stay.nights} ${t(input.locale, "nights", "noches")}`);
      keyValue(state, t(input.locale, "Rooms", "Habitaciones"), stay.rooms.length);
      keyValue(state, t(input.locale, "Meal plan", "Régimen"), mealPlan(stay.mealPlan, input.locale));
    }
  } else {
    text(state, t(input.locale, "No accommodation is attached to this reservation.", "No hay alojamiento asociado a esta reserva."), { color: mutedColor });
  }

  if (input.reservation.packageAddOns?.length) {
    section(state, t(input.locale, "Package supplements", "Suplementos del paquete"));
    for (const addOn of input.reservation.packageAddOns) {
      bullet(state, `${input.locale === "es" ? addOn.titleEs : addOn.title} · ${addOn.quantity} · ${money(addOn.totalPrice, input.reservation.currency, input.locale)}`);
    }
  }

  if (input.linkedServices?.length) {
    section(state, t(input.locale, "Linked services", "Servicios vinculados"));
    for (const service of input.linkedServices) {
      const date = service.serviceDate ?? service.insuranceTrip?.startDate;
      bullet(state, `${service.serviceTitle} · ${service.status}${date ? ` · ${formatDate(date, input.locale)}` : ""} · ${service.id}`);
    }
  }

  if (input.payment) {
    section(state, t(input.locale, "Finance", "Finanzas"));
    keyValue(state, t(input.locale, "Payment status", "Estado del pago"), input.payment.status);
    keyValue(state, t(input.locale, "Paid", "Pagado"), money(input.payment.paidAmount, input.payment.currency, input.locale));
    keyValue(state, t(input.locale, "Outstanding", "Pendiente"), money(input.payment.outstandingAmount, input.payment.currency, input.locale));
    if (input.payment.overpaidAmount > 0) {
      keyValue(state, t(input.locale, "Refund review", "Revisión de reembolso"), money(input.payment.overpaidAmount, input.payment.currency, input.locale));
    }
  }

  if (input.fulfilment?.length) {
    section(state, t(input.locale, "Supplier fulfilment", "Gestión de proveedores"));
    for (const item of input.fulfilment) {
      text(state, item.componentLabel, { font: state.bold, size: 10, gapAfter: 1 });
      keyValue(state, t(input.locale, "Status", "Estado"), item.status);
      if (item.supplierName) keyValue(state, t(input.locale, "Supplier", "Proveedor"), item.supplierName);
      if (item.supplierReference) keyValue(state, t(input.locale, "Internal supplier reference", "Referencia interna proveedor"), item.supplierReference);
      if (item.deadline) keyValue(state, t(input.locale, "Confirmation deadline", "Fecha límite de confirmación"), formatDate(item.deadline, input.locale));
      state.y -= 3;
    }
  }

  section(state, t(input.locale, "Privacy boundary", "Límite de privacidad"));
  text(
    state,
    t(
      input.locale,
      "Internal operational dossier. It intentionally excludes protected post-purchase document/residence values, supplier costs and internal free-text notes. Finance and fulfilment sections are supplied only when the current Operator has the corresponding capabilities.",
      "Expediente operativo interno. Excluye deliberadamente valores documentales/residencia post-compra protegidos, costes de proveedor y notas internas de texto libre. Las secciones de Finanzas y Proveedores solo se incorporan cuando el Operator actual tiene las capacidades correspondientes."
    ),
    { size: 9, color: mutedColor }
  );

  return state.document.save();
}
