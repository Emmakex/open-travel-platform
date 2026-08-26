import { randomUUID } from "node:crypto";
import type { CreateReservationInput, Reservation } from "@/domain/booking/types";
import {
  releaseAccommodationBookingInventory,
  reserveAccommodationBookingInventory
} from "@/lib/accommodation-booking-inventory";
import {
  createIntegrationEvent,
  enqueueIntegrationEvent,
  ensureIntegrationOutboxIndexes
} from "@/lib/integration-outbox";
import { travelDepartureCollectionName, listPublicMongoAvailability } from "@/lib/mongo-departures";
import {
  ensureMongoReservationIndexes,
  travelReservationCollectionName,
  type StoredReservation
} from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import type { BookingRepository } from "@/repositories/booking-repository";

function inventoryError() {
  const error = new Error("Departure inventory is no longer available.");
  Object.assign(error, { code: "DEPARTURE_UNAVAILABLE" });
  return error;
}

function releaseError() {
  const error = new Error("Departure inventory could not be released.");
  Object.assign(error, { code: "DEPARTURE_INVENTORY_RELEASE_FAILED" });
  return error;
}

export class MongoBookingRepository implements BookingRepository {
  async listAvailability(tripId: string) {
    return listPublicMongoAvailability(tripId);
  }

  async listReservations(identityId: string) {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await ensureMongoReservationIndexes(database);
    return database.collection<StoredReservation>(travelReservationCollectionName)
      .find({ identityId }).sort({ createdAt: -1 }).toArray();
  }

  async getReservation(identityId: string, reservationId: string) {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await ensureMongoReservationIndexes(database);
    return database.collection<StoredReservation>(travelReservationCollectionName)
      .findOne({ id: reservationId, identityId });
  }

  async createReservation(input: CreateReservationInput) {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await Promise.all([
      ensureMongoReservationIndexes(database),
      ensureIntegrationOutboxIndexes(database)
    ]);

    const reservations = database.collection<StoredReservation>(travelReservationCollectionName);
    const departures = database.collection(travelDepartureCollectionName);
    const session = client.startSession();
    const inventorySpaces = input.inventorySpaces ?? input.partySize;
    const reservation: Reservation = {
      ...input,
      inventorySpaces,
      id: `res-${randomUUID()}`,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    const integrationEvent = createIntegrationEvent({
      type: "trip.reservation.created",
      aggregateType: "trip-reservation",
      aggregateId: reservation.id,
      occurredAt: reservation.createdAt,
      payload: {
        reservationId: reservation.id,
        tripId: reservation.tripId,
        availabilityId: reservation.availabilityId,
        status: reservation.status,
        partySize: reservation.partySize,
        totalPrice: reservation.totalPrice,
        currency: reservation.currency,
        departureDate: reservation.departureDate,
        returnDate: reservation.returnDate,
        createdAt: reservation.createdAt
      }
    });

    try {
      await session.withTransaction(async () => {
        const today = new Date().toISOString().slice(0, 10);
        const inventoryResult = await departures.updateOne(
          {
            id: input.availabilityId,
            tripId: input.tripId,
            status: "open",
            departureDate: { $gte: today },
            $expr: { $gte: [{ $subtract: ["$capacity", "$reservedSpaces"] }, inventorySpaces] }
          },
          { $inc: { reservedSpaces: inventorySpaces }, $set: { updatedAt: new Date() } },
          { session }
        );
        if (inventoryResult.modifiedCount !== 1) throw inventoryError();
        await reserveAccommodationBookingInventory(database, session, input.accommodationBookings ?? []);
        await reservations.insertOne(reservation, { session });
        await enqueueIntegrationEvent(database, session, integrationEvent);
      });
      return reservation;
    } finally {
      await session.endSession();
    }
  }

  async cancelReservation(identityId: string, reservationId: string) {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await Promise.all([
      ensureMongoReservationIndexes(database),
      ensureIntegrationOutboxIndexes(database)
    ]);

    const reservations = database.collection<StoredReservation>(travelReservationCollectionName);
    const departures = database.collection(travelDepartureCollectionName);
    const session = client.startSession();
    const integrationEventId = `intevt-${randomUUID()}`;
    let cancelled: Reservation | null = null;

    try {
      await session.withTransaction(async () => {
        const current = await reservations.findOne({ id: reservationId, identityId }, { session });
        if (!current || current.status !== "pending") return;

        const updatedAt = new Date().toISOString();
        const update = await reservations.updateOne(
          { id: current.id, identityId, status: "pending" },
          { $set: { status: "cancelled", updatedAt } },
          { session }
        );
        if (update.modifiedCount !== 1) return;

        const inventorySpaces = current.inventorySpaces ?? current.partySize;
        if (inventorySpaces > 0) {
          const release = await departures.updateOne(
            { id: current.availabilityId, tripId: current.tripId, reservedSpaces: { $gte: inventorySpaces } },
            { $inc: { reservedSpaces: -inventorySpaces }, $set: { updatedAt: new Date() } },
            { session }
          );
          if (release.modifiedCount !== 1) throw releaseError();
        }

        await releaseAccommodationBookingInventory(database, session, current.accommodationBookings);
        await departures.updateOne(
          {
            id: current.availabilityId,
            tripId: current.tripId,
            status: "sold-out",
            $expr: { $lt: ["$reservedSpaces", "$capacity"] }
          },
          { $set: { status: "open", updatedAt: new Date() } },
          { session }
        );

        await enqueueIntegrationEvent(database, session, createIntegrationEvent({
          id: integrationEventId,
          type: "trip.reservation.status.changed",
          aggregateType: "trip-reservation",
          aggregateId: current.id,
          occurredAt: updatedAt,
          payload: {
            reservationId: current.id,
            fromStatus: current.status,
            toStatus: "cancelled",
            updatedAt
          }
        }));
        cancelled = { ...current, status: "cancelled", updatedAt };
      });
      return cancelled;
    } finally {
      await session.endSession();
    }
  }
}
