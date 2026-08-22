import type { Filter, UpdateFilter, WithId } from "mongodb";
import type { AvailabilityWindow, TripDeparture } from "@/domain/booking/types";
import { getMongoDatabase } from "@/lib/mongodb";

export const travelDepartureCollectionName = "travel_departures";

type StoredDeparture = TripDeparture & {
  createdAt?: Date;
  updatedAt?: Date;
};

function normalizeTravellerPrices(value: TripDeparture["travellerPrices"]) {
  if (!value || typeof value !== "object") return undefined;
  const entries = Object.entries(value).filter(([, price]) => typeof price === "number" && Number.isFinite(price));
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function normalizeDeparture(departure: TripDeparture): TripDeparture {
  const travellerPrices = normalizeTravellerPrices(departure.travellerPrices);
  return {
    id: departure.id,
    tripId: departure.tripId,
    departureDate: departure.departureDate,
    returnDate: departure.returnDate,
    capacity: Number(departure.capacity),
    reservedSpaces: Number(departure.reservedSpaces),
    status: departure.status,
    ...(typeof departure.unitPrice === "number" && Number.isFinite(departure.unitPrice)
      ? { unitPrice: departure.unitPrice }
      : {}),
    ...(travellerPrices ? { travellerPrices } : {})
  };
}

function stripMongoMetadata(document: WithId<StoredDeparture>): TripDeparture {
  const { _id: _ignored, createdAt: _createdAt, updatedAt: _updatedAt, ...departure } = document;
  return normalizeDeparture(departure);
}

async function ensureDepartureIndexes() {
  const database = await getMongoDatabase();
  const departures = database.collection<StoredDeparture>(travelDepartureCollectionName);
  await Promise.all([
    departures.createIndex({ id: 1 }, { unique: true, name: "travel_departure_id_unique" }),
    departures.createIndex({ tripId: 1, departureDate: 1 }, { name: "travel_departure_trip_date" }),
    departures.createIndex({ tripId: 1, status: 1, departureDate: 1 }, { name: "travel_departure_public_availability" })
  ]);
}

export async function listMongoTripDepartures(tripId: string): Promise<TripDeparture[]> {
  await ensureDepartureIndexes();
  const database = await getMongoDatabase();
  const documents = await database
    .collection<StoredDeparture>(travelDepartureCollectionName)
    .find({ tripId })
    .sort({ departureDate: 1, returnDate: 1 })
    .toArray();

  return documents.map(stripMongoMetadata);
}

export async function listPublicMongoAvailability(tripId: string): Promise<AvailabilityWindow[]> {
  await ensureDepartureIndexes();
  const database = await getMongoDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const filter: Filter<StoredDeparture> = {
    tripId,
    status: "open",
    departureDate: { $gte: today },
    $expr: { $lt: ["$reservedSpaces", "$capacity"] }
  };
  const documents = await database
    .collection<StoredDeparture>(travelDepartureCollectionName)
    .find(filter)
    .sort({ departureDate: 1 })
    .toArray();

  return documents.map((document) => {
    const normalized = stripMongoMetadata(document);
    return {
      id: normalized.id,
      tripId: normalized.tripId,
      departureDate: normalized.departureDate,
      returnDate: normalized.returnDate,
      remainingSpaces: Math.max(0, normalized.capacity - normalized.reservedSpaces),
      unitPrice: normalized.unitPrice,
      travellerPrices: normalized.travellerPrices
    };
  });
}

export async function replaceMongoTripDepartures(tripId: string, departures: TripDeparture[]) {
  await ensureDepartureIndexes();
  const database = await getMongoDatabase();
  const collection = database.collection<StoredDeparture>(travelDepartureCollectionName);
  const now = new Date();
  const normalizedDepartures = departures.map((departure) => normalizeDeparture({ ...departure, tripId }));
  const ids = normalizedDepartures.map((departure) => departure.id);
  const removedFilter: Filter<StoredDeparture> = ids.length
    ? { tripId, id: { $nin: ids } }
    : { tripId };

  const removedWithReservations = await collection.countDocuments({
    ...removedFilter,
    reservedSpaces: { $gt: 0 }
  });
  if (removedWithReservations > 0) {
    const error = new Error("A departure with reservations cannot be removed.");
    Object.assign(error, { code: "DEPARTURE_IN_USE" });
    throw error;
  }

  if (normalizedDepartures.length) {
    await collection.bulkWrite(
      normalizedDepartures.map((departure) => {
        const setFields: Record<string, unknown> = {
          id: departure.id,
          tripId,
          departureDate: departure.departureDate,
          returnDate: departure.returnDate,
          capacity: departure.capacity,
          status: departure.status,
          updatedAt: now
        };
        const unsetFields: Record<string, ""> = {};

        if (departure.unitPrice !== undefined) setFields.unitPrice = departure.unitPrice;
        else unsetFields.unitPrice = "";

        if (departure.travellerPrices) setFields.travellerPrices = departure.travellerPrices;
        else unsetFields.travellerPrices = "";

        const update: UpdateFilter<StoredDeparture> = {
          $set: setFields,
          $setOnInsert: {
            reservedSpaces: departure.reservedSpaces,
            createdAt: now
          },
          ...(Object.keys(unsetFields).length ? { $unset: unsetFields } : {})
        };

        return {
          updateOne: {
            filter: { id: departure.id, tripId },
            update,
            upsert: true
          }
        };
      }),
      { ordered: false }
    );
  }

  await collection.deleteMany(removedFilter);
}

export async function reserveMongoDeparture(tripId: string, departureId: string, inventorySpaces: number) {
  await ensureDepartureIndexes();
  const database = await getMongoDatabase();
  const collection = database.collection<StoredDeparture>(travelDepartureCollectionName);
  const today = new Date().toISOString().slice(0, 10);

  const result = await collection.updateOne(
    {
      id: departureId,
      tripId,
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
    }
  );

  return result.modifiedCount === 1;
}

export async function releaseMongoDeparture(tripId: string, departureId: string, inventorySpaces: number) {
  await ensureDepartureIndexes();
  const database = await getMongoDatabase();
  const collection = database.collection<StoredDeparture>(travelDepartureCollectionName);

  const result = await collection.updateOne(
    { id: departureId, tripId },
    [
      {
        $set: {
          reservedSpaces: { $max: [0, { $subtract: ["$reservedSpaces", inventorySpaces] }] },
          updatedAt: new Date()
        }
      }
    ]
  );
  return result.modifiedCount === 1;
}
