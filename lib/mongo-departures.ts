import type { Filter, WithId } from "mongodb";
import type { AvailabilityWindow, TripDeparture } from "@/domain/booking/types";
import { getMongoDatabase } from "@/lib/mongodb";

export const travelDepartureCollectionName = "travel_departures";

type StoredDeparture = TripDeparture & {
  createdAt?: Date;
  updatedAt?: Date;
};

function stripMongoMetadata(document: WithId<StoredDeparture>): TripDeparture {
  const { _id: _ignored, createdAt: _createdAt, updatedAt: _updatedAt, ...departure } = document;
  return departure;
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

  return documents.map((document) => ({
    id: document.id,
    tripId: document.tripId,
    departureDate: document.departureDate,
    returnDate: document.returnDate,
    remainingSpaces: Math.max(0, document.capacity - document.reservedSpaces),
    unitPrice: document.unitPrice,
    travellerPrices: document.travellerPrices
  }));
}

export async function replaceMongoTripDepartures(tripId: string, departures: TripDeparture[]) {
  await ensureDepartureIndexes();
  const database = await getMongoDatabase();
  const collection = database.collection<StoredDeparture>(travelDepartureCollectionName);
  const now = new Date();
  const ids = departures.map((departure) => departure.id);
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

  if (departures.length) {
    await collection.bulkWrite(
      departures.map((departure) => ({
        updateOne: {
          filter: { id: departure.id, tripId },
          update: {
            $set: {
              id: departure.id,
              tripId,
              departureDate: departure.departureDate,
              returnDate: departure.returnDate,
              capacity: departure.capacity,
              status: departure.status,
              unitPrice: departure.unitPrice,
              travellerPrices: departure.travellerPrices,
              updatedAt: now
            },
            $setOnInsert: {
              reservedSpaces: departure.reservedSpaces,
              createdAt: now
            }
          },
          upsert: true
        }
      })),
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
