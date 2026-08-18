import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { demoAvailability } from "@/data/demo-availability";
import type {
  CreateReservationInput,
  Reservation
} from "@/domain/booking/types";
import { DEMO_RESERVATIONS_COOKIE } from "@/lib/booking-config";
import type { BookingRepository } from "@/repositories/booking-repository";

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
    typeof item.createdAt === "string"
  );
}

async function readReservations() {
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

async function writeReservations(reservations: Reservation[]) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_RESERVATIONS_COOKIE, JSON.stringify(reservations.slice(-5)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export class DemoBookingRepository implements BookingRepository {
  async listAvailability(tripId: string) {
    return demoAvailability.filter((item) => item.tripId === tripId);
  }

  async listReservations(identityId: string) {
    const reservations = await readReservations();
    return reservations.filter((item) => item.identityId === identityId);
  }

  async getReservation(identityId: string, reservationId: string) {
    const reservations = await readReservations();
    return reservations.find(
      (item) => item.identityId === identityId && item.id === reservationId
    ) ?? null;
  }

  async createReservation(input: CreateReservationInput) {
    const reservation: Reservation = {
      ...input,
      id: `demo-${randomUUID()}`,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    const reservations = await readReservations();
    await writeReservations([...reservations, reservation]);
    return reservation;
  }

  async cancelReservation(identityId: string, reservationId: string) {
    const reservations = await readReservations();
    const index = reservations.findIndex(
      (item) => item.identityId === identityId && item.id === reservationId
    );

    if (index < 0) return null;

    const current = reservations[index];
    const cancelled: Reservation = { ...current, status: "cancelled" };
    const next = [...reservations];
    next[index] = cancelled;
    await writeReservations(next);
    return cancelled;
  }
}
