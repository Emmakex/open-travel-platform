"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoIdentities } from "@/data/demo-identities";
import type { Reservation, ReservationStatus } from "@/domain/booking/types";
import { hasOperationsAccess } from "@/lib/access-control";
import { revokeCustomerSession } from "@/lib/customer-auth";
import {
  DEMO_SESSION_COOKIE,
  KTRAVEL_SESSION_COOKIE,
  KTRAVEL_STAFF_SESSION_COOKIE,
  identityConfig
} from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";
import { operationsConfig } from "@/lib/operations-config";
import { getOperationsRepository } from "@/lib/operations-repository";
import {
  authenticateStaff,
  createStaffSession,
  ensureBootstrapAdmin,
  revokeStaffSession
} from "@/lib/staff-auth";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function clearCustomerSession(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const customerToken = cookieStore.get(KTRAVEL_SESSION_COOKIE)?.value;
  if (customerToken) {
    await revokeCustomerSession(customerToken).catch(() => undefined);
    cookieStore.delete(KTRAVEL_SESSION_COOKIE);
  }
}

async function startDemoStaffSession(identityId: string) {
  if (!identityConfig.demoStaffEnabled) {
    redirect("/operator/sign-in?demo=disabled");
  }

  const cookieStore = await cookies();
  await clearCustomerSession(cookieStore);
  cookieStore.delete(KTRAVEL_STAFF_SESSION_COOKIE);
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

export async function signInStaffAction(formData: FormData) {
  if (!identityConfig.staffAuthEnabled) {
    redirect("/operator/sign-in?error=auth-disabled");
  }

  const email = value(formData, "email");
  const password = value(formData, "password");
  if (!validEmail(email) || !password) {
    redirect("/operator/sign-in?error=invalid-credentials");
  }

  await ensureBootstrapAdmin();
  const staff = await authenticateStaff(email, password);
  if (!staff) {
    redirect("/operator/sign-in?error=invalid-credentials");
  }

  const session = await createStaffSession(staff.id);
  const cookieStore = await cookies();
  await clearCustomerSession(cookieStore);
  cookieStore.delete(DEMO_SESSION_COOKIE);
  cookieStore.set(KTRAVEL_STAFF_SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: session.expiresAt
  });
  redirect("/operator");
}

export async function endStaffSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(KTRAVEL_STAFF_SESSION_COOKIE)?.value;
  if (token) await revokeStaffSession(token).catch(() => undefined);
  cookieStore.delete(KTRAVEL_STAFF_SESSION_COOKIE);
  cookieStore.delete(DEMO_SESSION_COOKIE);
  redirect("/operator/sign-in");
}

export async function endDemoStaffSession() {
  return endStaffSession();
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
