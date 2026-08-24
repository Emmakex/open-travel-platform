import type { Reservation } from "@/domain/booking/types";
import type { ReservationChangePolicy } from "@/domain/operations/change-policy";
import type { ServiceReservation } from "@/domain/services/booking-types";

export type ChangePolicyEvaluation = {
  customerCancellationAllowed: boolean;
  staffModificationAllowed: boolean;
  staffCancellationAllowed: boolean;
  notifyCustomerOnStaffChange: boolean;
  customerCancellationCutoffAt?: string;
  staffModificationCutoffAt?: string;
  staffCancellationCutoffAt?: string;
};

function validHours(value?: number) {
  return Number.isFinite(value) && (value ?? 0) >= 0 ? Math.round(value as number) : undefined;
}

function startTimestamp(input: {
  departureDate?: string;
  serviceDate?: string;
  startTime?: string;
  insuranceStartDate?: string;
}) {
  const date = input.departureDate || input.serviceDate || input.insuranceStartDate;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const time = input.serviceDate && /^\d{2}:\d{2}$/.test(input.startTime ?? "")
    ? `${input.startTime}:00`
    : "00:00:00";
  const timestamp = Date.parse(`${date}T${time}Z`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function cutoffIso(start: number | null, hours?: number) {
  const normalized = validHours(hours);
  if (start === null || normalized === undefined) return undefined;
  return new Date(start - normalized * 3600000).toISOString();
}

function beforeCutoff(start: number | null, hours: number | undefined, now: number) {
  const normalized = validHours(hours);
  if (normalized === undefined || start === null) return true;
  return now <= start - normalized * 3600000;
}

export function evaluateChangePolicy(input: {
  policy?: ReservationChangePolicy;
  startTimestamp: number | null;
  now?: Date;
}): ChangePolicyEvaluation {
  const now = input.now?.getTime() ?? Date.now();
  const policy = input.policy;
  const customerCancellationAllowed = policy?.customerCancellationAllowed !== false &&
    beforeCutoff(input.startTimestamp, policy?.customerCancellationCutoffHours, now);
  const staffModificationAllowed = beforeCutoff(input.startTimestamp, policy?.staffModificationCutoffHours, now);
  const staffCancellationAllowed = beforeCutoff(input.startTimestamp, policy?.staffCancellationCutoffHours, now);

  return {
    customerCancellationAllowed,
    staffModificationAllowed,
    staffCancellationAllowed,
    notifyCustomerOnStaffChange: policy?.notifyCustomerOnStaffChange !== false,
    customerCancellationCutoffAt: cutoffIso(input.startTimestamp, policy?.customerCancellationCutoffHours),
    staffModificationCutoffAt: cutoffIso(input.startTimestamp, policy?.staffModificationCutoffHours),
    staffCancellationCutoffAt: cutoffIso(input.startTimestamp, policy?.staffCancellationCutoffHours)
  };
}

export function evaluateTripReservationPolicy(reservation: Reservation, now?: Date) {
  return evaluateChangePolicy({
    policy: reservation.changePolicy,
    startTimestamp: startTimestamp({ departureDate: reservation.departureDate }),
    now
  });
}

export function evaluateServiceReservationPolicy(reservation: ServiceReservation, now?: Date) {
  return evaluateChangePolicy({
    policy: reservation.changePolicy,
    startTimestamp: startTimestamp({
      serviceDate: reservation.serviceDate,
      startTime: reservation.startTime,
      insuranceStartDate: reservation.insuranceTrip?.startDate
    }),
    now
  });
}

export function parseChangePolicyForm(formData: FormData): ReservationChangePolicy | null {
  const parseOptionalHours = (name: string) => {
    const raw = formData.get(name);
    if (typeof raw !== "string" || !raw.trim()) return undefined;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 8760) return null;
    return parsed;
  };

  const customerCancellationCutoffHours = parseOptionalHours("customerCancellationCutoffHours");
  const staffModificationCutoffHours = parseOptionalHours("staffModificationCutoffHours");
  const staffCancellationCutoffHours = parseOptionalHours("staffCancellationCutoffHours");
  if (
    customerCancellationCutoffHours === null ||
    staffModificationCutoffHours === null ||
    staffCancellationCutoffHours === null
  ) return null;

  return {
    customerCancellationAllowed: formData.get("customerCancellationAllowed") === "on",
    customerCancellationCutoffHours,
    staffModificationCutoffHours,
    staffCancellationCutoffHours,
    notifyCustomerOnStaffChange: formData.get("notifyCustomerOnStaffChange") === "on"
  };
}
