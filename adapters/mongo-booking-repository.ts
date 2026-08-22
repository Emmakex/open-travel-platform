import { randomUUID } from "node:crypto";
import type { CreateReservationInput, Reservation } from "@/domain/booking/types";
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

export class MongoBookingRepository implements BookingRepository {
  async listAvailability(tripId: string) {
    return listPublicMongoAvailability(tripId);
  }

  async listReservations(identityId: string) {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await ensureMongoReservationIndexes(database);

    return database
      .collection<StoredReservation>(travelReservationCollectionName)
      .find({ identityId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getReservation(identityId: string, reservationId: string) {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await ensureMongoReservationIndexes(database);

    return database
      .collection<StoredReservation>(travelReservationCollectionName)
      .findOne({ id: reservationId, identityId });
  }

  async createReservation(input: CreateReservationInput) {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await ensureMongoReservationIndexes(database);

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

    try {
      await session.withTransaction(async () => {
        const today = new Date().toISOString().slice(0, 10);
        const inventoryResult = await departures.updateOne(
          {
            id: input.availabilityId,
            tripId: input.tripId,
            status: "open",
            departureDate: { $gte: today },
            $expr: {
              $gte: [
                { $subtract: ["$capacity", "$reservedSpaces"] },
                inventorySpaces
              ]
            }
          },
          {
            $inc: { reservedSpaces: inventorySpaces },
            $set: { updatedAt: new Date() }
          },
          { session }
        );

        if (inventoryResult.modifiedCount !== 1) {
          throw inventoryError();
        }

        await reservations.insertOne(reservation, { session });
      });

      return reservation;
    } finally {
      await session.endSession();
    }
  }

  async cancelReservation(identityId: string, reservationId: string) {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await ensureMongoReservationIndexes(database);

    const reservations = database.collection<StoredReservation>(travelReservationCollectionName);
    const departures = database.collection(travelDepartureCollectionName);
    const session = client.startSession();
    let cancelled: Reservation | null = null;

    try {
      await session.withTransaction(async () => {
        const current = await reservations.findOne(
          { id: reservationId, identityId },
          { session }
        );

        if (!current || current.status !== "pending") return;

        const updatedAt = new Date().toISOString();
        const update = await reservations.updateOne(
          { id: current.id, identityId, status: "pending" },
          { $set: { status: "cancelled", updatedAt } },
          { session }
        );

        if (update.modifiedCount !== 1) return;

        const inventorySpaces = current.inventorySpaces ?? current.partySize;
        await departures.updateOne(
          {
            id: current.availabilityId,
            tripId: current.tripId,
            reservedSpaces: { $gte: inventorySpaces }
          },
          {
            $inc: { reservedSpaces: -inventorySpaces },
            $set: { updatedAt: new Date() }
          },
          { session }
        );

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

        cancelled = {
          ...current,
          status: "cancelled",
          updatedAt
        };
      });

      return cancelled;
    } finally {
      await session.endSession();
    }
  }
}
