import type { Reservation } from "@/domain/booking/types";
import type { PaymentSummary } from "@/domain/payment/types";
import type { ServiceReservation } from "@/domain/services/booking-types";
import type { TravelLocale } from "@/domain/travel/types";
import type { SafeCustomerUser } from "@/lib/customer-auth";
import { deriveReservationPaymentSchedule } from "@/lib/payment-terms";
import type { TabularExport } from "@/lib/tabular-export";

export type ReportDateFilters = {
  from?: string;
  to?: string;
};

export type FinancialTargetRow = {
  targetType: "trip" | "service";
  id: string;
  productId: string;
  title: string;
  reservationStatus: string;
  createdAt: string;
  departureOrServiceDate?: string;
  partySize: number;
  totalPrice: number;
  currency: string;
  payment: PaymentSummary;
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
  overdueAmount?: number;
};

function t(locale: TravelLocale, en: string, es: string) {
  return locale === "es" ? es : en;
}

export function normalizeReportDate(value: string | null | undefined) {
  if (!value) return undefined;
  const clean = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) && !Number.isNaN(Date.parse(`${clean}T00:00:00Z`))
    ? clean
    : undefined;
}

export function reportDateFilters(input: URLSearchParams): ReportDateFilters {
  const from = normalizeReportDate(input.get("from"));
  const to = normalizeReportDate(input.get("to"));
  if (from && to && from > to) return { from: to, to: from };
  return { from, to };
}

export function inReportDateRange(value: string | undefined, filters: ReportDateFilters) {
  if (!value) return !filters.from && !filters.to;
  const date = value.slice(0, 10);
  if (filters.from && date < filters.from) return false;
  if (filters.to && date > filters.to) return false;
  return true;
}

export function filterReservationsByDate(reservations: Reservation[], filters: ReportDateFilters) {
  return reservations.filter((item) => inReportDateRange(item.createdAt, filters));
}

export function filterServicesByDate(reservations: ServiceReservation[], filters: ReportDateFilters) {
  return reservations.filter((item) => inReportDateRange(item.createdAt, filters));
}

export function filterCustomersByDate(customers: SafeCustomerUser[], filters: ReportDateFilters) {
  return customers.filter((item) => inReportDateRange(item.createdAt.toISOString(), filters));
}

export function reservationExport(
  reservations: Reservation[],
  locale: TravelLocale
): TabularExport<Reservation> {
  return {
    sheetName: t(locale, "Reservations", "Reservas"),
    rows: reservations,
    columns: [
      { key: "id", label: t(locale, "Reservation ID", "ID reserva"), width: 30, value: (row) => row.id },
      { key: "status", label: t(locale, "Status", "Estado"), width: 14, value: (row) => row.status },
      { key: "trip", label: t(locale, "Trip", "Viaje"), width: 34, value: (row) => row.tripTitle ?? row.tripId },
      { key: "tripId", label: t(locale, "Trip ID", "ID viaje"), width: 24, value: (row) => row.tripId },
      { key: "createdAt", label: t(locale, "Created at", "Creada"), width: 22, value: (row) => row.createdAt },
      { key: "departureDate", label: t(locale, "Departure", "Salida"), width: 15, value: (row) => row.departureDate },
      { key: "returnDate", label: t(locale, "Return", "Regreso"), width: 15, value: (row) => row.returnDate },
      { key: "partySize", label: t(locale, "Travellers", "Viajeros"), width: 12, value: (row) => row.partySize },
      { key: "leadTraveller", label: t(locale, "Lead traveller", "Viajero principal"), width: 28, value: (row) => {
        const lead = row.travellers?.find((traveller) => traveller.isLead) ?? row.travellers?.[0];
        return lead ? `${lead.firstName} ${lead.lastName}`.trim() : "";
      } },
      { key: "accommodation", label: t(locale, "Accommodation stays", "Estancias alojamiento"), width: 18, value: (row) => row.accommodationBookings?.length ?? 0 },
      { key: "supplements", label: t(locale, "Package supplements", "Suplementos paquete"), width: 20, value: (row) => row.packageAddOns?.length ?? 0 },
      { key: "total", label: t(locale, "Reservation total", "Total reserva"), width: 16, value: (row) => row.totalPrice },
      { key: "currency", label: t(locale, "Currency", "Moneda"), width: 10, value: (row) => row.currency }
    ]
  };
}

export function serviceReservationExport(
  reservations: ServiceReservation[],
  locale: TravelLocale
): TabularExport<ServiceReservation> {
  return {
    sheetName: t(locale, "Services", "Servicios"),
    rows: reservations,
    columns: [
      { key: "id", label: t(locale, "Reservation ID", "ID reserva"), width: 30, value: (row) => row.id },
      { key: "status", label: t(locale, "Status", "Estado"), width: 14, value: (row) => row.status },
      { key: "type", label: t(locale, "Service type", "Tipo servicio"), width: 16, value: (row) => row.serviceType },
      { key: "service", label: t(locale, "Service", "Servicio"), width: 34, value: (row) => row.serviceTitle },
      { key: "serviceId", label: t(locale, "Service ID", "ID servicio"), width: 24, value: (row) => row.serviceId },
      { key: "createdAt", label: t(locale, "Created at", "Creada"), width: 22, value: (row) => row.createdAt },
      { key: "serviceDate", label: t(locale, "Service date", "Fecha servicio"), width: 15, value: (row) => row.serviceDate ?? row.insuranceTrip?.startDate },
      { key: "partySize", label: t(locale, "Travellers", "Viajeros"), width: 12, value: (row) => row.partySize },
      { key: "quantity", label: t(locale, "Quantity", "Cantidad"), width: 12, value: (row) => row.quantity },
      { key: "relatedTrip", label: t(locale, "Related trip reservation", "Reserva viaje vinculada"), width: 30, value: (row) => row.relatedReservationId },
      { key: "total", label: t(locale, "Reservation total", "Total reserva"), width: 16, value: (row) => row.totalPrice },
      { key: "currency", label: t(locale, "Currency", "Moneda"), width: 10, value: (row) => row.currency }
    ]
  };
}

export function customerExport(customers: SafeCustomerUser[], locale: TravelLocale): TabularExport<SafeCustomerUser> {
  return {
    sheetName: t(locale, "Customers", "Clientes"),
    rows: customers,
    columns: [
      { key: "id", label: t(locale, "Customer ID", "ID cliente"), width: 30, value: (row) => row.id },
      { key: "status", label: t(locale, "Status", "Estado"), width: 12, value: (row) => row.status },
      { key: "name", label: t(locale, "Name", "Nombre"), width: 30, value: (row) => `${row.firstName} ${row.lastName}`.trim() },
      { key: "email", label: "Email", width: 36, value: (row) => row.email },
      { key: "phone", label: t(locale, "Phone", "Teléfono"), width: 20, value: (row) => row.phone },
      { key: "country", label: t(locale, "Country", "País"), width: 14, value: (row) => row.country },
      { key: "locale", label: t(locale, "Preferred language", "Idioma preferido"), width: 16, value: (row) => row.preferredLocale },
      { key: "createdAt", label: t(locale, "Created at", "Alta"), width: 22, value: (row) => row.createdAt.toISOString() },
      { key: "lastSignedInAt", label: t(locale, "Last sign-in", "Último acceso"), width: 22, value: (row) => row.lastSignedInAt?.toISOString() }
    ]
  };
}

export function buildFinancialRows(input: {
  reservations: Reservation[];
  reservationSummaries: Record<string, PaymentSummary>;
  services: ServiceReservation[];
  serviceSummaries: Record<string, PaymentSummary>;
}) {
  const tripRows: FinancialTargetRow[] = input.reservations.map((reservation) => {
    const payment = input.reservationSummaries[reservation.id];
    const schedule = deriveReservationPaymentSchedule(reservation, payment);
    const overdueAmount = schedule.installments
      .filter((installment) => installment.state === "overdue")
      .reduce((sum, installment) => sum + installment.outstandingAmount, 0);
    return {
      targetType: "trip",
      id: reservation.id,
      productId: reservation.tripId,
      title: reservation.tripTitle ?? reservation.tripId,
      reservationStatus: reservation.status,
      createdAt: reservation.createdAt,
      departureOrServiceDate: reservation.departureDate,
      partySize: reservation.partySize,
      totalPrice: reservation.totalPrice,
      currency: reservation.currency,
      payment,
      nextPaymentDate: schedule.nextInstallment?.dueDate,
      nextPaymentAmount: schedule.nextPaymentAmount,
      overdueAmount
    };
  });
  const serviceRows: FinancialTargetRow[] = input.services.map((reservation) => ({
    targetType: "service",
    id: reservation.id,
    productId: reservation.serviceId,
    title: reservation.serviceTitle,
    reservationStatus: reservation.status,
    createdAt: reservation.createdAt,
    departureOrServiceDate: reservation.serviceDate ?? reservation.insuranceTrip?.startDate,
    partySize: reservation.partySize,
    totalPrice: reservation.totalPrice,
    currency: reservation.currency,
    payment: input.serviceSummaries[reservation.id],
    overdueAmount: 0
  }));
  return [...tripRows, ...serviceRows];
}

export function reconciliationExport(rows: FinancialTargetRow[], locale: TravelLocale): TabularExport<FinancialTargetRow> {
  return {
    sheetName: t(locale, "Reconciliation", "Conciliación"),
    rows,
    columns: [
      { key: "type", label: t(locale, "Target type", "Tipo"), width: 14, value: (row) => row.targetType },
      { key: "id", label: t(locale, "Reservation ID", "ID reserva"), width: 30, value: (row) => row.id },
      { key: "title", label: t(locale, "Product / service", "Producto / servicio"), width: 34, value: (row) => row.title },
      { key: "reservationStatus", label: t(locale, "Reservation status", "Estado reserva"), width: 16, value: (row) => row.reservationStatus },
      { key: "paymentStatus", label: t(locale, "Payment status", "Estado pago"), width: 18, value: (row) => row.payment.status },
      { key: "settlement", label: t(locale, "Settlement", "Liquidación"), width: 18, value: (row) => row.payment.settlementStatus },
      { key: "createdAt", label: t(locale, "Created at", "Creada"), width: 22, value: (row) => row.createdAt },
      { key: "serviceDate", label: t(locale, "Travel / service date", "Fecha viaje / servicio"), width: 18, value: (row) => row.departureOrServiceDate },
      { key: "total", label: t(locale, "Total", "Total"), width: 14, value: (row) => row.payment.totalAmount },
      { key: "paid", label: t(locale, "Gross paid", "Cobrado bruto"), width: 14, value: (row) => row.payment.paidAmount },
      { key: "refunded", label: t(locale, "Refunded", "Reembolsado"), width: 14, value: (row) => row.payment.refundedAmount },
      { key: "netPaid", label: t(locale, "Net paid", "Cobrado neto"), width: 14, value: (row) => row.payment.netPaidAmount },
      { key: "outstanding", label: t(locale, "Outstanding", "Pendiente"), width: 14, value: (row) => row.payment.outstandingAmount },
      { key: "overpaid", label: t(locale, "Refund review", "Revisión reembolso"), width: 16, value: (row) => row.payment.overpaidAmount },
      { key: "currency", label: t(locale, "Currency", "Moneda"), width: 10, value: (row) => row.currency }
    ]
  };
}

export function outstandingBalanceExport(rows: FinancialTargetRow[], locale: TravelLocale): TabularExport<FinancialTargetRow> {
  const outstanding = rows.filter((row) => row.reservationStatus !== "cancelled" && row.payment.outstandingAmount > 0);
  return {
    sheetName: t(locale, "Outstanding balances", "Saldos pendientes"),
    rows: outstanding,
    columns: [
      { key: "type", label: t(locale, "Target type", "Tipo"), width: 14, value: (row) => row.targetType },
      { key: "id", label: t(locale, "Reservation ID", "ID reserva"), width: 30, value: (row) => row.id },
      { key: "title", label: t(locale, "Product / service", "Producto / servicio"), width: 34, value: (row) => row.title },
      { key: "date", label: t(locale, "Travel / service date", "Fecha viaje / servicio"), width: 18, value: (row) => row.departureOrServiceDate },
      { key: "paymentStatus", label: t(locale, "Payment status", "Estado pago"), width: 18, value: (row) => row.payment.status },
      { key: "outstanding", label: t(locale, "Outstanding", "Pendiente"), width: 14, value: (row) => row.payment.outstandingAmount },
      { key: "overdue", label: t(locale, "Overdue", "Vencido"), width: 14, value: (row) => row.overdueAmount ?? 0 },
      { key: "nextDate", label: t(locale, "Next due date", "Próximo vencimiento"), width: 18, value: (row) => row.nextPaymentDate },
      { key: "nextAmount", label: t(locale, "Next amount", "Próximo importe"), width: 14, value: (row) => row.nextPaymentAmount },
      { key: "currency", label: t(locale, "Currency", "Moneda"), width: 10, value: (row) => row.currency }
    ]
  };
}

type RevenueRow = {
  targetType: "trip" | "service";
  productId: string;
  title: string;
  currency: string;
  bookings: number;
  activeBookings: number;
  cancelledBookings: number;
  travellers: number;
  bookedValue: number;
  netCollected: number;
  outstanding: number;
  refunded: number;
};

export function buildRevenueRows(rows: FinancialTargetRow[]) {
  const grouped = new Map<string, RevenueRow>();
  for (const row of rows) {
    const key = `${row.targetType}:${row.productId}:${row.currency}`;
    const current = grouped.get(key) ?? {
      targetType: row.targetType,
      productId: row.productId,
      title: row.title,
      currency: row.currency,
      bookings: 0,
      activeBookings: 0,
      cancelledBookings: 0,
      travellers: 0,
      bookedValue: 0,
      netCollected: 0,
      outstanding: 0,
      refunded: 0
    };
    current.bookings += 1;
    current.travellers += row.partySize;
    current.bookedValue += row.totalPrice;
    current.netCollected += row.payment.netPaidAmount;
    current.refunded += row.payment.refundedAmount;
    if (row.reservationStatus === "cancelled") current.cancelledBookings += 1;
    else {
      current.activeBookings += 1;
      current.outstanding += row.payment.outstandingAmount;
    }
    grouped.set(key, current);
  }
  return [...grouped.values()].sort((a, b) => b.netCollected - a.netCollected || a.title.localeCompare(b.title));
}

export function revenueExport(rows: FinancialTargetRow[], locale: TravelLocale): TabularExport<RevenueRow> {
  return {
    sheetName: t(locale, "Revenue", "Ingresos"),
    rows: buildRevenueRows(rows),
    columns: [
      { key: "type", label: t(locale, "Product type", "Tipo producto"), width: 14, value: (row) => row.targetType },
      { key: "productId", label: t(locale, "Product ID", "ID producto"), width: 26, value: (row) => row.productId },
      { key: "title", label: t(locale, "Product / service", "Producto / servicio"), width: 34, value: (row) => row.title },
      { key: "bookings", label: t(locale, "Bookings", "Reservas"), width: 12, value: (row) => row.bookings },
      { key: "active", label: t(locale, "Active", "Activas"), width: 12, value: (row) => row.activeBookings },
      { key: "cancelled", label: t(locale, "Cancelled", "Canceladas"), width: 12, value: (row) => row.cancelledBookings },
      { key: "travellers", label: t(locale, "Travellers", "Viajeros"), width: 12, value: (row) => row.travellers },
      { key: "bookedValue", label: t(locale, "Booked value", "Valor reservado"), width: 16, value: (row) => row.bookedValue },
      { key: "netCollected", label: t(locale, "Net collected", "Cobrado neto"), width: 16, value: (row) => row.netCollected },
      { key: "outstanding", label: t(locale, "Active outstanding", "Pendiente activo"), width: 16, value: (row) => row.outstanding },
      { key: "refunded", label: t(locale, "Refunded", "Reembolsado"), width: 14, value: (row) => row.refunded },
      { key: "currency", label: t(locale, "Currency", "Moneda"), width: 10, value: (row) => row.currency }
    ]
  };
}
