import type { CurrencyCode } from "../domain/travel/types.ts";
import type { SupplierFulfilmentStatus, SupplierFulfilmentTargetType } from "../domain/operations/types.ts";

const statuses = new Set<SupplierFulfilmentStatus>([
  "not-requested",
  "requested",
  "confirmed",
  "rejected",
  "cancelled"
]);
const targetTypes = new Set<SupplierFulfilmentTargetType>(["trip-reservation", "service-reservation"]);
const currencies = new Set<CurrencyCode>(["EUR", "USD", "GBP"]);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function isSupplierFulfilmentStatus(value: string): value is SupplierFulfilmentStatus {
  return statuses.has(value as SupplierFulfilmentStatus);
}

export function isSupplierFulfilmentTargetType(value: string): value is SupplierFulfilmentTargetType {
  return targetTypes.has(value as SupplierFulfilmentTargetType);
}

export function isSupplierCurrency(value: string): value is CurrencyCode {
  return currencies.has(value as CurrencyCode);
}

export function normalizeSupplierName(value?: string) {
  if (!value) return undefined;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return undefined;
  return normalized.length >= 2 && normalized.length <= 160 ? normalized : null;
}

export function normalizeSupplierReference(value?: string) {
  if (!value) return undefined;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return undefined;
  return normalized.length <= 160 ? normalized : null;
}

export function normalizeSupplierCost(value?: number) {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) return null;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizeSupplierDeadline(value?: string) {
  if (!value) return undefined;
  const deadline = value.trim();
  if (!isoDatePattern.test(deadline)) return null;
  const parsed = new Date(`${deadline}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== deadline) return null;
  return deadline;
}

export function normalizeSupplierFulfilmentNote(value: string) {
  const normalized = value.trim().replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  if (!normalized || normalized.length > 2000) return null;
  return normalized;
}

export function canSupplierFulfilmentTransition(from: SupplierFulfilmentStatus, to: SupplierFulfilmentStatus) {
  if (from === to) return true;
  if (from === "cancelled") return false;
  if (from === "not-requested") return to === "requested" || to === "cancelled";
  if (from === "requested") return to === "confirmed" || to === "rejected" || to === "cancelled";
  if (from === "confirmed" || from === "rejected") return to === "requested" || to === "cancelled";
  return false;
}

export function supplierFulfilmentDateKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function isSupplierFulfilmentOverdue(
  item: { status: SupplierFulfilmentStatus; deadline?: string },
  today = supplierFulfilmentDateKey()
) {
  return Boolean(
    item.deadline &&
    item.deadline < today &&
    item.status !== "confirmed" &&
    item.status !== "cancelled"
  );
}
