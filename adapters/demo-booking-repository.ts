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
import {
  listPublicMongoAvailability,
  releaseMongoDeparture,
  reserveMongoDeparture
} from "@/lib/mongo-departures";
import { travelDataConfig } from "@/lib/travel-data-config";
import type { BookingRepository } from "@/repositories/booking-repository";

function inventoryError() {
  const error = new Error("Departure inventory is no longer available.");
  Object.assign(error, { code: "DEPARTURE_UNAVAILABLE" });
  return error;
}

export class DemoBookingRepository implements BookingRepository {
  async listAvailability(tripId: string) {
    if (travelDataConfig.mode === "mongodb") {
      return listPublicMongoAvailability(tripId);
    }
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
    let inventoryReserved = false;
    const inventorySpaces = input.inventorySpaces ?? input.partySize;

    if (travelDataConfig.mode === "mongodb") {
      inventoryReserved = await reserveMongoDeparture(input.tripId, input.availabilityId, inventorySpaces);
      if (!inventoryReserved) throw inventoryError();
    }

    const reservation: Reservation = {
      ...input,
      inventorySpaces,
      id: `demo-${randomUUID()}`,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    try {
      const reservations = await readDemoReservations();
      await writeDemoReservations([...reservations, reservation]);
      return reservation;
    } catch (error) {
      if (inventoryReserved) {
        await releaseMongoDeparture(input.tripId, input.availabilityId, inventorySpaces).catch(() => false);
      }
      throw error;
    }
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

    if (travelDataConfig.mode === "mongodb") {
      await releaseMongoDeparture(
        current.tripId,
        current.availabilityId,
        current.inventorySpaces ?? current.partySize
      ).catch((error) => {
        console.error("Failed to release MongoDB departure inventory after cancellation", error);
        return false;
      });
    }

    return cancelled;
  }
}
