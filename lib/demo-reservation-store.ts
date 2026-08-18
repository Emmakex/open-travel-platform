import { cookies } from "next/headers";
import type { Reservation } from "@/domain/booking/types";
import { DEMO_RESERVATIONS_COOKIE } from "@/lib/booking-config";

function isReservation(value: unknown): value is Reservation {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Reservation>;

  return (
    typeof item.id === "string" &&
    typeof item.identityId === "string" &&
    typeof item.tripId === "string" &&
    typeof item.availabilityId === "string" &&
    Number.isInteger(item.partySize) &&
    typeof item.unitPrice === "number" &&
    typeof item.totalPrice === "number" &&
    typeof item.currency === "string" &&
    (item.status === "pending" || item.status === "confirmed" || item.status === "cancelled") &&
    typeof item.createdAt === "string" &&
    (item.updatedAt === undefined || typeof item.updatedAt === "string")
  );
}

export async function readDemoReservations() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DEMO_RESERVATIONS_COOKIE)?.value;

  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isReservation).slice(-5) : [];
  } catch {
    return [];
  }
}

export async function writeDemoReservations(reservations: Reservation[]) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_RESERVATIONS_COOKIE, JSON.stringify(reservations.slice(-5)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}
