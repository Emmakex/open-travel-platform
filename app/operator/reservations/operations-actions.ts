"use server";

import { redirect } from "next/navigation";
import { operationsConfig } from "@/lib/operations-config";
import {
  addReservationInternalNote,
  updateReservationOperations
} from "@/lib/reservation-operations";
import {
  isReservationPriority,
  parseReservationTags
} from "@/lib/reservation-operations-rules";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function workflowErrorQuery(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "update-failed";
  switch (error.code) {
    case "OPERATIONS_WORKFLOW_UNAVAILABLE": return "workflow-unavailable";
    case "RESERVATION_NOT_FOUND": return "not-found";
    case "INVALID_OWNER": return "invalid-owner";
    case "INVALID_PRIORITY": return "invalid-priority";
    case "INVALID_TAGS": return "invalid-tags";
    case "NO_CHANGES": return "no-changes";
    case "INVALID_NOTE": return "invalid-note";
    default: return "update-failed";
  }
}

export async function saveReservationOperationsAction(formData: FormData) {
  const staff = await requireOperationsIdentity();
  const reservationId = value(formData, "reservationId");
  const ownerStaffId = value(formData, "ownerStaffId") || undefined;
  const priority = value(formData, "priority");
  const tags = parseReservationTags(value(formData, "tags"));
  const base = reservationId ? `/operator/reservations/${encodeURIComponent(reservationId)}/workflow` : "/operator/reservations";

  if (!operationsConfig.writesEnabled || !reservationId || !isReservationPriority(priority) || !tags) {
    redirect(`${base}?operationsError=invalid-request#internal-workflow`);
  }

  try {
    await updateReservationOperations({
      reservationId,
      ownerStaffId,
      priority,
      tags,
      actorIdentityId: staff.id,
      actorRole: staff.role,
      actorDisplayName: staff.displayName
    });
  } catch (error) {
    redirect(`${base}?operationsError=${workflowErrorQuery(error)}#internal-workflow`);
  }

  redirect(`${base}?operationsUpdated=workflow#internal-workflow`);
}

export async function addReservationInternalNoteAction(formData: FormData) {
  const staff = await requireOperationsIdentity();
  const reservationId = value(formData, "reservationId");
  const body = value(formData, "body");
  const base = reservationId ? `/operator/reservations/${encodeURIComponent(reservationId)}/workflow` : "/operator/reservations";

  if (!operationsConfig.writesEnabled || !reservationId || !body) {
    redirect(`${base}?operationsError=invalid-note#internal-workflow`);
  }

  try {
    await addReservationInternalNote({
      reservationId,
      body,
      actorIdentityId: staff.id,
      actorRole: staff.role,
      actorDisplayName: staff.displayName
    });
  } catch (error) {
    redirect(`${base}?operationsError=${workflowErrorQuery(error)}#internal-workflow`);
  }

  redirect(`${base}?operationsUpdated=note#internal-workflow`);
}
