import { randomUUID } from "node:crypto";
import { travelCollectionNames } from "@/adapters/mongo-travel-repository";
import type { AvailabilityWindow, Reservation, ReservationTraveller, TripDeparture } from "@/domain/booking/types";
import type {
  DepartureChangeInput,
  ReservationAmendment,
  ReservationAmendmentChange,
  TravellerCorrectionInput
} from "@/domain/operations/types";
import type { Trip } from "@/domain/travel/types";
import { travelDepartureCollectionName } from "@/lib/mongo-departures";
import {
  ensureMongoReservationIndexes,
  travelReservationAmendmentCollectionName,
  travelReservationCollectionName,
  type StoredReservation,
  type StoredReservationAmendment
} from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { operationsConfig } from "@/lib/operations-config";
import { priceTravellerComposition, TravellerPricingError } from "@/lib/traveller-pricing";

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

function moneySnapshot(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
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

export async function changeReservationDeparture(input: DepartureChangeInput) {
  if (operationsConfig.mode !== "mongodb") {
    throw amendmentError("AMENDMENTS_UNAVAILABLE", "Reservation changes are unavailable.");
  }

  const newAvailabilityId = normalizeRequiredText(input.newAvailabilityId, 160);
  const reason = normalizeRequiredText(input.reason, 500);
  if (!newAvailabilityId || !reason) {
    throw amendmentError("INVALID_REQUEST", "Departure change data is invalid.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureMongoReservationIndexes(database);

  const reservations = database.collection<StoredReservation>(travelReservationCollectionName);
  const amendments = database.collection<StoredReservationAmendment>(travelReservationAmendmentCollectionName);
  const departures = database.collection<TripDeparture & { updatedAt?: Date }>(travelDepartureCollectionName);
  const trips = database.collection<Trip>(travelCollectionNames.trips);
  const session = client.startSession();
  let updatedReservation: Reservation | null = null;
  let storedAmendment: ReservationAmendment | null = null;

  try {
    await session.withTransaction(async () => {
      const current = await reservations.findOne({ id: input.reservationId }, { session });
      if (!current) return;
      if (current.status === "cancelled") {
        throw amendmentError("RESERVATION_CANCELLED", "Cancelled reservations cannot be amended.");
      }
      if (current.availabilityId === newAvailabilityId) {
        throw amendmentError("NO_CHANGES", "The selected departure is already assigned to this reservation.");
      }

      const today = new Date().toISOString().slice(0, 10);
      const newDeparture = await departures.findOne(
        {
          id: newAvailabilityId,
          tripId: current.tripId,
          status: "open",
          departureDate: { $gte: today }
        },
        { session }
      );
      if (!newDeparture) {
        throw amendmentError("DEPARTURE_UNAVAILABLE", "The selected departure is no longer available.");
      }

      const trip = await trips.findOne({ id: current.tripId }, { session });
      if (!trip) {
        throw amendmentError("TRIP_NOT_FOUND", "The trip could not be found for this reservation.");
      }

      let travellers = current.travellers;
      let totalPrice = current.totalPrice;
      let inventorySpaces = current.inventorySpaces ?? current.partySize;
      let unitPrice = current.unitPrice;

      if (current.travellers?.length) {
        const availability: AvailabilityWindow = {
          id: newDeparture.id,
          tripId: newDeparture.tripId,
          departureDate: newDeparture.departureDate,
          returnDate: newDeparture.returnDate,
          remainingSpaces: Math.max(0, newDeparture.capacity - newDeparture.reservedSpaces),
          unitPrice: newDeparture.unitPrice,
          travellerPrices: newDeparture.travellerPrices
        };

        try {
          const pricing = priceTravellerComposition({
            trip,
            availability,
            drafts: current.travellers.map((traveller) => ({
              id: traveller.id,
              firstName: traveller.firstName,
              lastName: traveller.lastName,
              dateOfBirth: traveller.dateOfBirth,
              nationality: traveller.nationality,
              guardianTravellerId: traveller.guardianTravellerId,
              guardianRelationship: traveller.guardianRelationship
            }))
          });
          travellers = pricing.travellers;
          totalPrice = pricing.totalPrice;
          inventorySpaces = pricing.inventorySpaces;
          unitPrice = pricing.leadUnitPrice;
        } catch (error) {
          if (error instanceof TravellerPricingError) {
            throw amendmentError(
              "PRICING_UNAVAILABLE",
              "The traveller composition is not valid for the selected departure."
            );
          }
          throw error;
        }
      }

      if (inventorySpaces > 0) {
        const reserveResult = await departures.updateOne(
          {
            id: newDeparture.id,
            tripId: current.tripId,
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
        if (reserveResult.modifiedCount !== 1) {
          throw amendmentError("DEPARTURE_UNAVAILABLE", "The selected departure no longer has enough space.");
        }
      }

      const previousInventorySpaces = current.inventorySpaces ?? current.partySize;
      if (previousInventorySpaces > 0) {
        const releaseResult = await departures.updateOne(
          {
            id: current.availabilityId,
            tripId: current.tripId,
            reservedSpaces: { $gte: previousInventorySpaces }
          },
          {
            $inc: { reservedSpaces: -previousInventorySpaces },
            $set: { updatedAt: new Date() }
          },
          { session }
        );
        if (releaseResult.modifiedCount !== 1) {
          throw amendmentError("INVENTORY_RELEASE_FAILED", "The previous departure inventory could not be released.");
        }

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

      if (inventorySpaces > 0) {
        await departures.updateOne(
          {
            id: newDeparture.id,
            tripId: current.tripId,
            status: "open",
            $expr: { $gte: ["$reservedSpaces", "$capacity"] }
          },
          { $set: { status: "sold-out", updatedAt: new Date() } },
          { session }
        );
      }

      const occurredAt = new Date().toISOString();
      const reservationSet: Record<string, unknown> = {
        availabilityId: newDeparture.id,
        departureDate: newDeparture.departureDate,
        returnDate: newDeparture.returnDate,
        unitPrice,
        totalPrice,
        inventorySpaces,
        updatedAt: occurredAt
      };
      if (travellers) reservationSet.travellers = travellers;

      const update = await reservations.updateOne(
        { id: current.id, availabilityId: current.availabilityId, status: { $ne: "cancelled" } },
        { $set: reservationSet },
        { session }
      );
      if (update.modifiedCount !== 1) {
        throw amendmentError("UPDATE_CONFLICT", "Reservation changed while applying departure change.");
      }

      const changes: ReservationAmendmentChange[] = [
        { field: "availabilityId", before: current.availabilityId, after: newDeparture.id },
        { field: "departureDate", before: current.departureDate ?? "", after: newDeparture.departureDate },
        { field: "returnDate", before: current.returnDate ?? "", after: newDeparture.returnDate }
      ];
      if (current.unitPrice !== unitPrice) {
        changes.push({ field: "unitPrice", before: moneySnapshot(current.unitPrice), after: moneySnapshot(unitPrice) });
      }
      if (current.totalPrice !== totalPrice) {
        changes.push({ field: "totalPrice", before: moneySnapshot(current.totalPrice), after: moneySnapshot(totalPrice) });
      }
      if (previousInventorySpaces !== inventorySpaces) {
        changes.push({ field: "inventorySpaces", before: String(previousInventorySpaces), after: String(inventorySpaces) });
      }

      const amendment: ReservationAmendment = {
        id: `amend-${randomUUID()}`,
        reservationId: current.id,
        type: "departure-change",
        actorIdentityId: input.actorIdentityId,
        actorRole: input.actorRole,
        reason,
        changes,
        priceDelta: Number((totalPrice - current.totalPrice).toFixed(2)),
        currency: current.currency,
        inventoryMovement: {
          fromAvailabilityId: current.availabilityId,
          toAvailabilityId: newDeparture.id,
          releasedSpaces: previousInventorySpaces,
          reservedSpaces: inventorySpaces
        },
        occurredAt
      };
      await amendments.insertOne(amendment, { session });

      updatedReservation = {
        ...current,
        availabilityId: newDeparture.id,
        departureDate: newDeparture.departureDate,
        returnDate: newDeparture.returnDate,
        unitPrice,
        totalPrice,
        inventorySpaces,
        ...(travellers ? { travellers } : {}),
        updatedAt: occurredAt
      };
      storedAmendment = amendment;
    });

    return { reservation: updatedReservation, amendment: storedAmendment };
  } finally {
    await session.endSession();
  }
}
