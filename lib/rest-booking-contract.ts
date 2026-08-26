import type { AvailabilityWindow, Reservation, ReservationStatus } from "@/domain/booking/types";

export const restBookingContractVersion = "1";
export const restBookingContractHeader = "X-OTP-Contract-Version";

function contractError(message: string) {
  return Object.assign(new Error(message), { code: "REST_BOOKING_CONTRACT_INVALID" });
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw contractError(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw contractError(`${label} must be a non-empty string.`);
  return value;
}

function optionalString(value: unknown, label: string) {
  if (value === undefined) return undefined;
  return requiredString(value, label);
}

function finiteNumber(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw contractError(`${label} must be a finite number.`);
  return value;
}

function nonNegativeInteger(value: unknown, label: string) {
  const number = finiteNumber(value, label);
  if (!Number.isInteger(number) || number < 0) throw contractError(`${label} must be a non-negative integer.`);
  return number;
}

function positiveInteger(value: unknown, label: string) {
  const number = finiteNumber(value, label);
  if (!Number.isInteger(number) || number < 1) throw contractError(`${label} must be a positive integer.`);
  return number;
}

function optionalNumber(value: unknown, label: string) {
  return value === undefined ? undefined : finiteNumber(value, label);
}

function numberRecord(value: unknown, label: string) {
  if (value === undefined) return undefined;
  const source = record(value, label);
  return Object.fromEntries(Object.entries(source).map(([key, item]) => [key, finiteNumber(item, `${label}.${key}`)]));
}

function reservationStatus(value: unknown): ReservationStatus {
  if (value === "pending" || value === "confirmed" || value === "cancelled") return value;
  throw contractError("reservation.status must be pending, confirmed or cancelled.");
}

function validateOptionalArray(value: unknown, label: string, maximum = 500) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length > maximum) throw contractError(`${label} must be an array with at most ${maximum} items.`);
}

export function parseRestAvailability(value: unknown): AvailabilityWindow {
  const source = record(value, "availability");
  const parsed: AvailabilityWindow = {
    id: requiredString(source.id, "availability.id"),
    tripId: requiredString(source.tripId, "availability.tripId"),
    departureDate: requiredString(source.departureDate, "availability.departureDate"),
    returnDate: requiredString(source.returnDate, "availability.returnDate"),
    remainingSpaces: nonNegativeInteger(source.remainingSpaces, "availability.remainingSpaces")
  };
  const unitPrice = optionalNumber(source.unitPrice, "availability.unitPrice");
  const travellerPrices = numberRecord(source.travellerPrices, "availability.travellerPrices");
  if (unitPrice !== undefined) parsed.unitPrice = unitPrice;
  if (travellerPrices !== undefined) parsed.travellerPrices = travellerPrices;
  return parsed;
}

export function parseRestReservation(value: unknown): Reservation {
  const source = record(value, "reservation");
  const partySize = positiveInteger(source.partySize, "reservation.partySize");
  const inventorySpaces = source.inventorySpaces === undefined
    ? undefined
    : nonNegativeInteger(source.inventorySpaces, "reservation.inventorySpaces");
  const currency = requiredString(source.currency, "reservation.currency").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw contractError("reservation.currency must be a three-letter currency code.");

  validateOptionalArray(source.travellers, "reservation.travellers");
  validateOptionalArray(source.accommodationBookings, "reservation.accommodationBookings", 100);
  validateOptionalArray(source.packageAddOns, "reservation.packageAddOns", 100);
  if (source.paymentTerms !== undefined) record(source.paymentTerms, "reservation.paymentTerms");
  if (source.travellerRequirements !== undefined) record(source.travellerRequirements, "reservation.travellerRequirements");
  if (source.changePolicy !== undefined) record(source.changePolicy, "reservation.changePolicy");

  const reservation: Reservation = {
    id: requiredString(source.id, "reservation.id"),
    identityId: requiredString(source.identityId, "reservation.identityId"),
    tripId: requiredString(source.tripId, "reservation.tripId"),
    availabilityId: requiredString(source.availabilityId, "reservation.availabilityId"),
    partySize,
    unitPrice: finiteNumber(source.unitPrice, "reservation.unitPrice"),
    totalPrice: finiteNumber(source.totalPrice, "reservation.totalPrice"),
    currency,
    status: reservationStatus(source.status),
    createdAt: requiredString(source.createdAt, "reservation.createdAt")
  };

  if (inventorySpaces !== undefined) reservation.inventorySpaces = inventorySpaces;
  const optionalNumbers: Array<[keyof Reservation, unknown]> = [
    ["tripPriceTotal", source.tripPriceTotal],
    ["accommodationTotal", source.accommodationTotal],
    ["accommodationAdditionalTotal", source.accommodationAdditionalTotal],
    ["packageAddOnTotal", source.packageAddOnTotal]
  ];
  for (const [key, raw] of optionalNumbers) {
    const parsed = optionalNumber(raw, `reservation.${String(key)}`);
    if (parsed !== undefined) (reservation as unknown as Record<string, unknown>)[key] = parsed;
  }

  const optionalStrings: Array<[keyof Reservation, unknown]> = [
    ["updatedAt", source.updatedAt],
    ["tripTitle", source.tripTitle],
    ["departureDate", source.departureDate],
    ["returnDate", source.returnDate]
  ];
  for (const [key, raw] of optionalStrings) {
    const parsed = optionalString(raw, `reservation.${String(key)}`);
    if (parsed !== undefined) (reservation as unknown as Record<string, unknown>)[key] = parsed;
  }

  if (source.travellers !== undefined) reservation.travellers = source.travellers as Reservation["travellers"];
  if (source.accommodationBookings !== undefined) reservation.accommodationBookings = source.accommodationBookings as Reservation["accommodationBookings"];
  if (source.packageAddOns !== undefined) reservation.packageAddOns = source.packageAddOns as Reservation["packageAddOns"];
  if (source.paymentTerms !== undefined) reservation.paymentTerms = source.paymentTerms as Reservation["paymentTerms"];
  if (source.travellerRequirements !== undefined) reservation.travellerRequirements = source.travellerRequirements as Reservation["travellerRequirements"];
  if (source.changePolicy !== undefined) reservation.changePolicy = source.changePolicy as Reservation["changePolicy"];
  return reservation;
}

export function parseAvailabilityEnvelope(value: unknown) {
  const source = record(value, "response");
  if (!Array.isArray(source.availability) || source.availability.length > 1000) {
    throw contractError("response.availability must be an array with at most 1000 items.");
  }
  return source.availability.map(parseRestAvailability);
}

export function parseReservationsEnvelope(value: unknown) {
  const source = record(value, "response");
  if (!Array.isArray(source.reservations) || source.reservations.length > 1000) {
    throw contractError("response.reservations must be an array with at most 1000 items.");
  }
  return source.reservations.map(parseRestReservation);
}

export function parseReservationEnvelope(value: unknown, allowNull = false) {
  const source = record(value, "response");
  if (allowNull && source.reservation === null) return null;
  return parseRestReservation(source.reservation);
}
