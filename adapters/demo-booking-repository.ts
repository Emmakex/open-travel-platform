import { randomUUID } from "node:crypto";
import { demoAvailability } from "@/data/demo-availability";
import type {
  CreateReservationInput,
  Reservation
} from "@/domain/booking/types";
import {
  readDemoReservations,
  writeDemoReservations
} from "@/lib/demo-reservation-store";
import type { BookingRepository } from "@/repositories/booking-repository";

export class DemoBookingRepository implements BookingRepository {
  async listAvailability(tripId: string) {
    return demoAvailability.filter((item) => item.tripId === tripId);
  }

  async listReservations(identityId: string) {
    const reservations = await readDemoReservations();
    return reservations.filter((item) => item.identityId === identityId);
  }

  async getReservation(identityId: string, reservationId: string) {
    const reservations = await readDemoReservations();
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

    const reservations = await readDemoReservations();
    await writeDemoReservations([...reservations, reservation]);
    return reservation;
  }

  async cancelReservation(identityId: string, reservationId: string) {
    const reservations = await readDemoReservations();
    const index = reservations.findIndex(
      (item) => item.identityId === identityId && item.id === reservationId
    );

    if (index < 0) return null;

    const current = reservations[index];
    if (current.status !== "pending") return null;

    const cancelled: Reservation = {
      ...current,
      status: "cancelled",
      updatedAt: new Date().toISOString()
    };
    const next = [...reservations];
    next[index] = cancelled;
    await writeDemoReservations(next);
    return cancelled;
  }
}
