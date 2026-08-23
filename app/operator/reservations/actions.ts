"use server";

import { redirect } from "next/navigation";
import { hasOperationsAccess } from "@/lib/access-control";
import { getIdentityRepository } from "@/lib/identity-repository";
import { operationsConfig } from "@/lib/operations-config";
import { correctReservationTraveller } from "@/lib/reservation-amendments";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function amendmentErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "update-failed";
  const code = String((error as { code?: unknown }).code ?? "");
  if (code === "AMENDMENTS_UNAVAILABLE") return "amendments-unavailable";
  if (code === "INVALID_REQUEST") return "invalid-request";
  if (code === "RESERVATION_CANCELLED") return "reservation-cancelled";
  if (code === "TRAVELLER_NOT_FOUND") return "traveller-not-found";
  if (code === "NO_CHANGES") return "no-changes";
  if (code === "UPDATE_CONFLICT") return "update-conflict";
  return "update-failed";
}

export async function correctReservationTravellerAction(formData: FormData) {
  const identity = await getIdentityRepository().getCurrentIdentity();
  if (!hasOperationsAccess(identity)) {
    redirect("/operator/sign-in?error=forbidden");
  }

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

  try {
    const result = await correctReservationTraveller({
      reservationId,
      travellerId,
      actorIdentityId: identity.id,
      actorRole: identity.role,
      reason,
      firstName,
      lastName,
      nationality
    });

    if (!result.reservation) {
      redirect(`${detailUrl}?amendmentError=not-found#travellers`);
    }
  } catch (error) {
    redirect(`${detailUrl}?amendmentError=${amendmentErrorCode(error)}#travellers`);
  }

  redirect(`${detailUrl}?amendmentUpdated=1#travellers`);
}
