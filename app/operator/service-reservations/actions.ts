"use server";

import { redirect } from "next/navigation";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { updateServiceReservationStatusByStaff } from "@/lib/service-reservations";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

export async function updateServiceReservationStatusAction(formData: FormData) {
  const identity = await requireOperationsIdentity();
  const reservationId = value(formData, "reservationId");
  const requested = value(formData, "status");
  const status = requested === "confirmed" || requested === "cancelled" ? requested : null;
  if (!reservationId || !status) redirect("/operator/service-reservations");
  const changed = await updateServiceReservationStatusByStaff(reservationId, status, identity.id);
  if (!changed) redirect(`/operator/service-reservations/${encodeURIComponent(reservationId)}?error=unchanged`);
  redirect(`/operator/service-reservations/${encodeURIComponent(reservationId)}?updated=${status}`);
}
