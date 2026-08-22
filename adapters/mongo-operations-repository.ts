import { randomUUID } from "node:crypto";
import type { Reservation, ReservationStatus } from "@/domain/booking/types";
import type { ReservationStatusUpdate } from "@/domain/operations/types";
import { travelDepartureCollectionName } from "@/lib/mongo-departures";
import {
  ensureMongoReservationIndexes,
  travelOperationsAuditCollectionName,
  travelReservationCollectionName,
  type StoredOperationsAuditEvent,
  type StoredReservation
} from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import type { OperationsRepository } from "@/repositories/operations-repository";

function canTransition(from: ReservationStatus, to: ReservationStatus) {
  if (from === "pending") return to === "confirmed" || to === "cancelled";
  if (from === "confirmed") return to === "cancelled";
  return false;
}

export class MongoOperationsRepository implements OperationsRepository {
  async listReservations() {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await ensureMongoReservationIndexes(database);

    return database
      .collection<StoredReservation>(travelReservationCollectionName)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getReservation(reservationId: string) {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await ensureMongoReservationIndexes(database);

    return database
      .collection<StoredReservation>(travelReservationCollectionName)
      .findOne({ id: reservationId });
  }

  async getSummary() {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await ensureMongoReservationIndexes(database);
    const reservations = database.collection<StoredReservation>(travelReservationCollectionName);

    const [total, pending, confirmed, cancelled] = await Promise.all([
      reservations.countDocuments(),
      reservations.countDocuments({ status: "pending" }),
      reservations.countDocuments({ status: "confirmed" }),
      reservations.countDocuments({ status: "cancelled" })
    ]);

    return { total, pending, confirmed, cancelled };
  }

  async listAuditEvents() {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await ensureMongoReservationIndexes(database);

    return database
      .collection<StoredOperationsAuditEvent>(travelOperationsAuditCollectionName)
      .find({})
      .sort({ occurredAt: -1 })
      .limit(200)
      .toArray();
  }

  async updateReservationStatus(input: ReservationStatusUpdate) {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await ensureMongoReservationIndexes(database);

    const reservations = database.collection<StoredReservation>(travelReservationCollectionName);
    const audit = database.collection<StoredOperationsAuditEvent>(travelOperationsAuditCollectionName);
    const departures = database.collection(travelDepartureCollectionName);
    const session = client.startSession();
    let updatedReservation: Reservation | null = null;

    try {
      await session.withTransaction(async () => {
        const current = await reservations.findOne({ id: input.reservationId }, { session });
        if (!current) return;
        if (current.status === input.status) {
          updatedReservation = current;
          return;
        }

        if (!canTransition(current.status, input.status)) {
          throw new Error(`Invalid reservation status transition: ${current.status} -> ${input.status}`);
        }

        const occurredAt = new Date().toISOString();
        const update = await reservations.updateOne(
          { id: current.id, status: current.status },
          { $set: { status: input.status, updatedAt: occurredAt } },
          { session }
        );

        if (update.modifiedCount !== 1) {
          throw new Error("Reservation status changed concurrently.");
        }

        if (input.status === "cancelled") {
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
        }

        await audit.insertOne(
          {
            id: `audit-${randomUUID()}`,
            reservationId: current.id,
            actorIdentityId: input.actorIdentityId,
            actorRole: input.actorRole,
            fromStatus: current.status,
            toStatus: input.status,
            occurredAt
          },
          { session }
        );

        updatedReservation = {
          ...current,
          status: input.status,
          updatedAt: occurredAt
        };
      });

      return updatedReservation;
    } finally {
      await session.endSession();
    }
  }
}
