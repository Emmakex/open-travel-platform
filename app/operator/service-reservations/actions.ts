"use server";

import { redirect } from "next/navigation";
import { evaluateServiceReservationPolicy } from "@/lib/change-policy";
import { notifyServiceReservationChanged } from "@/lib/change-notifications";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { updateServiceReservationStatusByStaff } from "@/lib/service-reservations";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function errorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "update-failed";
  const code = String((error as { code?: unknown }).code ?? "");
  if (code === "SERVICE_CANCELLATION_DEADLINE") return "change-deadline";
  if (code === "SERVICE_INVENTORY_RELEASE_FAILED") return "inventory-release";
  return "update-failed";
}

export async function updateServiceReservationStatusAction(formData: FormData) {
  const identity = await requireOperationsIdentity();
  const reservationId = value(formData, "reservationId");
  const requested = value(formData, "status");
  const status = requested === "confirmed" || requested === "cancelled" ? requested : null;
  if (!reservationId || !status) redirect("/operator/service-reservations");

  let changed;
  try {
    changed = await updateServiceReservationStatusByStaff(reservationId, status, identity.id);
  } catch (error) {
    redirect(`/operator/service-reservations/${encodeURIComponent(reservationId)}?error=${errorCode(error)}`);
  }

  if (!changed) redirect(`/operator/service-reservations/${encodeURIComponent(reservationId)}?error=unchanged`);

  if (evaluateServiceReservationPolicy(changed).notifyCustomerOnStaffChange) {
    await notifyServiceReservationChanged(changed, status).catch(() => undefined);
  }

  redirect(`/operator/service-reservations/${encodeURIComponent(reservationId)}?updated=${status}`);
}
