"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoIdentities } from "@/data/demo-identities";
import type { Reservation, ReservationStatus } from "@/domain/booking/types";
import { hasOperationsAccess } from "@/lib/access-control";
import { DEMO_SESSION_COOKIE, identityConfig } from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";
import { operationsConfig } from "@/lib/operations-config";
import { getOperationsRepository } from "@/lib/operations-repository";

async function startDemoStaffSession(identityId: string) {
  if (!identityConfig.demoSessionEnabled) {
    redirect("/operator/sign-in?demo=disabled");
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, identityId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  redirect("/operator");
}

export async function startDemoOperatorSession() {
  return startDemoStaffSession(demoIdentities.operator.id);
}

export async function startDemoAdminSession() {
  return startDemoStaffSession(demoIdentities.admin.id);
}

export async function endDemoStaffSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
  redirect("/operator/sign-in");
}

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function isAllowedTargetStatus(value: string): value is ReservationStatus {
  return value === "confirmed" || value === "cancelled";
}

export async function updateReservationStatusAction(formData: FormData) {
  const identity = await getIdentityRepository().getCurrentIdentity();

  if (!hasOperationsAccess(identity)) {
    redirect("/operator/sign-in?error=forbidden");
  }

  const reservationId = value(formData, "reservationId");
  const targetStatus = value(formData, "status");
  const detailUrl = reservationId
    ? `/operator/reservations/${encodeURIComponent(reservationId)}`
    : "/operator/reservations";

  if (!operationsConfig.writesEnabled) {
    redirect(`${detailUrl}?error=operations-disabled`);
  }

  if (!reservationId || !isAllowedTargetStatus(targetStatus)) {
    redirect(`${detailUrl}?error=invalid-request`);
  }

  let reservation: Reservation | null = null;

  try {
    reservation = await getOperationsRepository().updateReservationStatus({
      reservationId,
      actorIdentityId: identity.id,
      actorRole: identity.role,
      status: targetStatus
    });
  } catch {
    redirect(`${detailUrl}?error=invalid-transition`);
  }

  if (!reservation) {
    redirect("/operator/reservations?error=not-found");
  }

  redirect(`${detailUrl}?updated=${reservation.status}`);
}
