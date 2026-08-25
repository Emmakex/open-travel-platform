import type { Reservation, ReservationStatus } from "../domain/booking/types.ts";
import type { PaymentStatus, PaymentSummary } from "../domain/payment/types.ts";
import type { ReservationOperationsState, ReservationPriority } from "../domain/operations/types.ts";

export type OperationsQueueAttention =
  | "all"
  | "any"
  | "overdue-tasks"
  | "supplier"
  | "payment"
  | "unassigned";

export type OperationsQueuePayment = PaymentStatus | "all" | "outstanding" | "overdue";
export type OperationsQueueSort = "departure-asc" | "departure-desc" | "newest" | "priority";

export type OperationsQueueFilters = {
  q?: string;
  status?: ReservationStatus | "all";
  owner?: string;
  priority?: ReservationPriority | "all";
  tag?: string;
  payment?: OperationsQueuePayment;
  departureFrom?: string;
  departureTo?: string;
  attention?: OperationsQueueAttention;
  sort?: OperationsQueueSort;
};

export type OperationsQueueRow = {
  reservation: Reservation;
  tripTitle: string;
  customerName?: string;
  customerEmail?: string;
  workflow: ReservationOperationsState;
  payment?: PaymentSummary;
  paymentOverdue: boolean;
  overdueTaskCount: number;
  supplierAttentionCount: number;
};

const priorityWeight: Record<ReservationPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3
};

export function normalizeQueueSearch(value?: string) {
  if (!value) return undefined;
  const normalized = value.trim().replace(/\s+/g, " ").slice(0, 120);
  return normalized || undefined;
}

export function normalizeQueueTag(value?: string) {
  if (!value) return undefined;
  const normalized = value.trim().replace(/\s+/g, " ").slice(0, 40);
  return normalized || undefined;
}

export function normalizeQueueDate(value?: string) {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return undefined;
  const parsed = new Date(`${normalized}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === normalized
    ? normalized
    : undefined;
}

function rowNeedsSupplierAttention(row: OperationsQueueRow) {
  return row.supplierAttentionCount > 0;
}

function rowNeedsAttention(row: OperationsQueueRow) {
  return row.overdueTaskCount > 0 || rowNeedsSupplierAttention(row) || row.paymentOverdue || !row.workflow.ownerStaffId;
}

function searchableText(row: OperationsQueueRow) {
  const travellerText = (row.reservation.travellers ?? [])
    .map((traveller) => `${traveller.firstName} ${traveller.lastName}`)
    .join(" ");
  return [
    row.reservation.id,
    row.tripTitle,
    row.customerName,
    row.customerEmail,
    row.workflow.ownerDisplayName,
    row.workflow.tags.join(" "),
    travellerText
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

export function filterOperationsQueue(rows: OperationsQueueRow[], filters: OperationsQueueFilters) {
  const q = normalizeQueueSearch(filters.q)?.toLocaleLowerCase();
  const tag = normalizeQueueTag(filters.tag)?.toLocaleLowerCase();
  const from = normalizeQueueDate(filters.departureFrom);
  const to = normalizeQueueDate(filters.departureTo);

  return rows.filter((row) => {
    if (q && !searchableText(row).includes(q)) return false;
    if (filters.status && filters.status !== "all" && row.reservation.status !== filters.status) return false;
    if (filters.owner === "unassigned" && row.workflow.ownerStaffId) return false;
    if (filters.owner && filters.owner !== "all" && filters.owner !== "unassigned" && row.workflow.ownerStaffId !== filters.owner) return false;
    if (filters.priority && filters.priority !== "all" && row.workflow.priority !== filters.priority) return false;
    if (tag && !row.workflow.tags.some((item) => item.toLocaleLowerCase() === tag)) return false;
    if (from && (!row.reservation.departureDate || row.reservation.departureDate < from)) return false;
    if (to && (!row.reservation.departureDate || row.reservation.departureDate > to)) return false;

    if (filters.payment && filters.payment !== "all") {
      if (filters.payment === "outstanding" && !(row.payment && row.payment.outstandingAmount > 0)) return false;
      else if (filters.payment === "overdue" && !row.paymentOverdue) return false;
      else if (filters.payment !== "outstanding" && filters.payment !== "overdue" && row.payment?.status !== filters.payment) return false;
    }

    switch (filters.attention) {
      case "any": if (!rowNeedsAttention(row)) return false; break;
      case "overdue-tasks": if (row.overdueTaskCount < 1) return false; break;
      case "supplier": if (!rowNeedsSupplierAttention(row)) return false; break;
      case "payment": if (!row.paymentOverdue) return false; break;
      case "unassigned": if (row.workflow.ownerStaffId) return false; break;
      default: break;
    }

    return true;
  });
}

export function sortOperationsQueue(rows: OperationsQueueRow[], sort: OperationsQueueSort = "departure-asc") {
  return [...rows].sort((a, b) => {
    if (sort === "newest") return b.reservation.createdAt.localeCompare(a.reservation.createdAt);
    if (sort === "priority") {
      return priorityWeight[b.workflow.priority] - priorityWeight[a.workflow.priority]
        || (a.reservation.departureDate ?? "9999-12-31").localeCompare(b.reservation.departureDate ?? "9999-12-31");
    }
    const aDate = a.reservation.departureDate ?? "9999-12-31";
    const bDate = b.reservation.departureDate ?? "9999-12-31";
    return sort === "departure-desc" ? bDate.localeCompare(aDate) : aDate.localeCompare(bDate);
  });
}

export function paginateOperationsQueue<T>(rows: T[], requestedPage: number, pageSize = 20) {
  const safeSize = Math.min(Math.max(Math.trunc(pageSize) || 20, 5), 100);
  const totalPages = Math.max(1, Math.ceil(rows.length / safeSize));
  const page = Math.min(Math.max(Math.trunc(requestedPage) || 1, 1), totalPages);
  const start = (page - 1) * safeSize;
  return {
    rows: rows.slice(start, start + safeSize),
    page,
    pageSize: safeSize,
    total: rows.length,
    totalPages
  };
}
