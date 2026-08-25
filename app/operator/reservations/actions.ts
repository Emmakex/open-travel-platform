"use server";

import { redirect } from "next/navigation";
import { hasOperationsAccess } from "@/lib/access-control";
import { evaluateTripReservationPolicy } from "@/lib/change-policy";
import { notifyTripReservationChanged } from "@/lib/change-notifications";
import { getIdentityRepository } from "@/lib/identity-repository";
import { operationsConfig } from "@/lib/operations-config";
import { getOperationsRepository } from "@/lib/operations-repository";
import { changeReservationPackageAddOns } from "@/lib/package-addon-amendments";
import { changeReservationDeparture, correctReservationTraveller } from "@/lib/reservation-amendments";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function values(formData: FormData, key: string) {
  return formData.getAll(key).filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function amendmentErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "update-failed";
  const code = String((error as { code?: unknown }).code ?? "");
  if (code === "AMENDMENTS_UNAVAILABLE") return "amendments-unavailable";
  if (code === "AMENDMENT_DEADLINE") return "amendment-deadline";
  if (code === "INVALID_REQUEST") return "invalid-request";
  if (code === "RESERVATION_CANCELLED") return "reservation-cancelled";
  if (code === "TRAVELLER_NOT_FOUND") return "traveller-not-found";
  if (code === "DEPARTURE_UNAVAILABLE") return "departure-unavailable";
  if (code === "TRIP_NOT_FOUND") return "trip-not-found";
  if (code === "PRICING_UNAVAILABLE") return "pricing-unavailable";
  if (code === "INVENTORY_RELEASE_FAILED") return "inventory-release-failed";
  if (code === "ACCOMMODATION_UNAVAILABLE") return "accommodation-unavailable";
  if (code === "ACCOMMODATION_REPRICE_FAILED") return "accommodation-reprice-failed";
  if (code === "ACCOMMODATION_INVENTORY_RELEASE_FAILED") return "accommodation-release-failed";
  if (code === "ADDON_CONFIGURATION_INVALID") return "addon-configuration-invalid";
  if (code === "ADDON_SELECTION_INVALID") return "addon-selection-invalid";
  if (code === "ADDON_DISABLED_EXPANSION") return "addon-disabled-expansion";
  if (code === "NO_CHANGES") return "no-changes";
  if (code === "UPDATE_CONFLICT") return "update-conflict";
  return "update-failed";
}

async function requireStaffIdentity() {
  const identity = await getIdentityRepository().getCurrentIdentity();
  if (!hasOperationsAccess(identity)) {
    redirect("/operator/sign-in?error=forbidden");
  }
  return identity;
}

async function requireModificationWindow(reservationId: string) {
  const reservation = await getOperationsRepository().getReservation(reservationId);
  if (!reservation) return null;
  const policy = evaluateTripReservationPolicy(reservation);
  if (!policy.staffModificationAllowed) {
    const error = new Error("Reservation modification deadline has passed.");
    Object.assign(error, { code: "AMENDMENT_DEADLINE" });
    throw error;
  }
  return reservation;
}

async function notifyIfEnabled(reservation: NonNullable<Awaited<ReturnType<typeof requireModificationWindow>>>) {
  if (evaluateTripReservationPolicy(reservation).notifyCustomerOnStaffChange) {
    await notifyTripReservationChanged(reservation).catch(() => undefined);
  }
}

export async function correctReservationTravellerAction(formData: FormData) {
  const identity = await requireStaffIdentity();
  const reservationId = value(formData, "reservationId");
  const travellerId = value(formData, "travellerId");
  const firstName = value(formData, "firstName");
  const lastName = value(formData, "lastName");
  const nationality = value(formData, "nationality");
  const reason = value(formData, "reason");
  const detailUrl = reservationId
    ? `/operator/reservations/${encodeURIComponent(reservationId)}`
    : "/operator/reservations";

  if (!operationsConfig.writesEnabled || operationsConfig.mode !== "mongodb") {
    redirect(`${detailUrl}?amendmentError=amendments-unavailable#travellers`);
  }

  if (!reservationId || !travellerId || !firstName || !lastName || !nationality || !reason) {
    redirect(`${detailUrl}?amendmentError=invalid-request#travellers`);
  }

  let result;
  try {
    await requireModificationWindow(reservationId);
    result = await correctReservationTraveller({
      reservationId,
      travellerId,
      actorIdentityId: identity.id,
      actorRole: identity.role,
      reason,
      firstName,
      lastName,
      nationality
    });
  } catch (error) {
    redirect(`${detailUrl}?amendmentError=${amendmentErrorCode(error)}#travellers`);
  }

  if (!result.reservation) {
    redirect(`${detailUrl}?amendmentError=not-found#travellers`);
  }

  await notifyIfEnabled(result.reservation);
  redirect(`${detailUrl}?amendmentUpdated=traveller#travellers`);
}

export async function changeReservationDepartureAction(formData: FormData) {
  const identity = await requireStaffIdentity();
  const reservationId = value(formData, "reservationId");
  const newAvailabilityId = value(formData, "newAvailabilityId");
  const reason = value(formData, "reason");
  const detailUrl = reservationId
    ? `/operator/reservations/${encodeURIComponent(reservationId)}`
    : "/operator/reservations";

  if (!operationsConfig.writesEnabled || operationsConfig.mode !== "mongodb") {
    redirect(`${detailUrl}?amendmentError=amendments-unavailable#departure-change`);
  }
  if (!reservationId || !newAvailabilityId || !reason) {
    redirect(`${detailUrl}?amendmentError=invalid-request#departure-change`);
  }

  let result;
  try {
    await requireModificationWindow(reservationId);
    result = await changeReservationDeparture({
      reservationId,
      newAvailabilityId,
      actorIdentityId: identity.id,
      actorRole: identity.role,
      reason
    });
  } catch (error) {
    redirect(`${detailUrl}?amendmentError=${amendmentErrorCode(error)}#departure-change`);
  }

  if (!result.reservation) {
    redirect(`${detailUrl}?amendmentError=not-found#departure-change`);
  }

  await notifyIfEnabled(result.reservation);
  redirect(`${detailUrl}?amendmentUpdated=departure#departure-change`);
}

export async function changeReservationPackageAddOnsAction(formData: FormData) {
  const identity = await requireStaffIdentity();
  const reservationId = value(formData, "reservationId");
  const reason = value(formData, "reason");
  const detailUrl = reservationId
    ? `/operator/reservations/${encodeURIComponent(reservationId)}`
    : "/operator/reservations";

  if (!operationsConfig.writesEnabled || operationsConfig.mode !== "mongodb") {
    redirect(`${detailUrl}?amendmentError=amendments-unavailable#package-addons`);
  }
  if (!reservationId || !reason) {
    redirect(`${detailUrl}?amendmentError=invalid-request#package-addons`);
  }

  const selectedBookingAddOnIds = values(formData, "bookingAddOnIds");
  const selectedTravellerIdsByAddOn: Record<string, string[]> = {};
  for (const pair of values(formData, "travellerAddOnSelection")) {
    const separator = pair.indexOf("|");
    if (separator <= 0 || separator === pair.length - 1) {
      redirect(`${detailUrl}?amendmentError=addon-selection-invalid#package-addons`);
    }
    try {
      const addOnId = decodeURIComponent(pair.slice(0, separator));
      const travellerId = decodeURIComponent(pair.slice(separator + 1));
      if (!addOnId || !travellerId) throw new Error("invalid");
      selectedTravellerIdsByAddOn[addOnId] = [...(selectedTravellerIdsByAddOn[addOnId] ?? []), travellerId];
    } catch {
      redirect(`${detailUrl}?amendmentError=addon-selection-invalid#package-addons`);
    }
  }

  let result;
  try {
    await requireModificationWindow(reservationId);
    result = await changeReservationPackageAddOns({
      reservationId,
      selectedBookingAddOnIds,
      selectedTravellerIdsByAddOn,
      actorIdentityId: identity.id,
      actorRole: identity.role,
      reason
    });
  } catch (error) {
    redirect(`${detailUrl}?amendmentError=${amendmentErrorCode(error)}#package-addons`);
  }

  if (!result.reservation) {
    redirect(`${detailUrl}?amendmentError=not-found#package-addons`);
  }

  await notifyIfEnabled(result.reservation);
  redirect(`${detailUrl}?amendmentUpdated=package-addons#package-addons`);
}
