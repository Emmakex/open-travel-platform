import { randomUUID } from "node:crypto";
import type { Reservation, ReservationTraveller } from "@/domain/booking/types";
import type {
  ReservationAmendment,
  ReservationAmendmentChange,
  TravellerCorrectionInput
} from "@/domain/operations/types";
import {
  ensureMongoReservationIndexes,
  travelReservationAmendmentCollectionName,
  travelReservationCollectionName,
  type StoredReservation,
  type StoredReservationAmendment
} from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { operationsConfig } from "@/lib/operations-config";

function amendmentError(code: string, message: string) {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

function normalizeRequiredText(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
}

export async function listReservationAmendments(reservationId: string) {
  if (operationsConfig.mode !== "mongodb") return [] as ReservationAmendment[];

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureMongoReservationIndexes(database);

  return database
    .collection<StoredReservationAmendment>(travelReservationAmendmentCollectionName)
    .find({ reservationId })
    .sort({ occurredAt: -1 })
    .limit(100)
    .toArray();
}

export async function correctReservationTraveller(input: TravellerCorrectionInput) {
  if (operationsConfig.mode !== "mongodb") {
    throw amendmentError(
      "AMENDMENTS_UNAVAILABLE",
      "Persistent reservation amendments require MongoDB operations mode."
    );
  }

  const firstName = normalizeRequiredText(input.firstName, 100);
  const lastName = normalizeRequiredText(input.lastName, 140);
  const nationality = normalizeRequiredText(input.nationality, 100);
  const reason = normalizeRequiredText(input.reason, 500);
  if (!firstName || !lastName || !nationality || !reason) {
    throw amendmentError("INVALID_REQUEST", "Traveller correction data is invalid.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureMongoReservationIndexes(database);

  const reservations = database.collection<StoredReservation>(travelReservationCollectionName);
  const amendments = database.collection<StoredReservationAmendment>(
    travelReservationAmendmentCollectionName
  );
  const session = client.startSession();
  let updatedReservation: Reservation | null = null;
  let storedAmendment: ReservationAmendment | null = null;

  try {
    await session.withTransaction(async () => {
      const current = await reservations.findOne({ id: input.reservationId }, { session });
      if (!current) return;
      if (current.status === "cancelled") {
        throw amendmentError(
          "RESERVATION_CANCELLED",
          "Cancelled reservations cannot be amended."
        );
      }

      const travellers = [...(current.travellers ?? [])];
      const travellerIndex = travellers.findIndex((traveller) => traveller.id === input.travellerId);
      if (travellerIndex < 0) {
        throw amendmentError("TRAVELLER_NOT_FOUND", "Traveller not found on reservation.");
      }

      const previous = travellers[travellerIndex];
      const corrected: ReservationTraveller = {
        ...previous,
        firstName,
        lastName,
        nationality
      };
      const changes: ReservationAmendmentChange[] = [];

      if (previous.firstName !== corrected.firstName) {
        changes.push({ field: "firstName", before: previous.firstName, after: corrected.firstName });
      }
      if (previous.lastName !== corrected.lastName) {
        changes.push({ field: "lastName", before: previous.lastName, after: corrected.lastName });
      }
      if (previous.nationality !== corrected.nationality) {
        changes.push({ field: "nationality", before: previous.nationality, after: corrected.nationality });
      }

      if (!changes.length) {
        throw amendmentError("NO_CHANGES", "No traveller changes were detected.");
      }

      travellers[travellerIndex] = corrected;
      const occurredAt = new Date().toISOString();
      const update = await reservations.updateOne(
        { id: current.id },
        { $set: { travellers, updatedAt: occurredAt } },
        { session }
      );
      if (update.modifiedCount !== 1) {
        throw amendmentError("UPDATE_CONFLICT", "Reservation changed while applying amendment.");
      }

      const amendment: ReservationAmendment = {
        id: `amend-${randomUUID()}`,
        reservationId: current.id,
        type: "traveller-correction",
        travellerId: previous.id,
        actorIdentityId: input.actorIdentityId,
        actorRole: input.actorRole,
        reason,
        changes,
        occurredAt
      };
      await amendments.insertOne(amendment, { session });

      updatedReservation = {
        ...current,
        travellers,
        updatedAt: occurredAt
      };
      storedAmendment = amendment;
    });

    return {
      reservation: updatedReservation,
      amendment: storedAmendment
    };
  } finally {
    await session.endSession();
  }
}
