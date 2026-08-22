import type { WithId } from "mongodb";
import { travelCollectionNames } from "@/adapters/mongo-travel-repository";
import { demoCatalogue } from "@/data/demo-catalogue";
import type { Destination, TravellerPricingBand, Trip } from "@/domain/travel/types";
import { getMongoDatabase, getMongoDatabaseName, isMongoConfigured } from "@/lib/mongodb";

type StoredDestination = Destination & { createdAt?: Date; updatedAt?: Date };
type StoredTrip = Trip & { createdAt?: Date; updatedAt?: Date };

function stripStoredMetadata<T extends object>(document: WithId<T>): T {
  const { _id: _ignored, ...rest } = document;
  return rest as T;
}

function toDestination(document: WithId<StoredDestination>): Destination {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...destination } = stripStoredMetadata(document);
  return destination;
}

function normalizeTravellerPricingBand(band: TravellerPricingBand): TravellerPricingBand {
  return {
    id: band.id,
    code: band.code,
    label: band.label,
    ...(typeof band.labelEs === "string" && band.labelEs.trim() ? { labelEs: band.labelEs } : {}),
    minAge: Number(band.minAge),
    ...(typeof band.maxAge === "number" && Number.isFinite(band.maxAge) ? { maxAge: band.maxAge } : {}),
    price: Number(band.price),
    consumesInventory: Boolean(band.consumesInventory)
  };
}

function normalizeTravellerPricing(value: Trip["travellerPricing"]): TravellerPricingBand[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value.map(normalizeTravellerPricingBand);
}

function cleanTripForStorage(trip: Trip): Trip {
  const travellerPricing = normalizeTravellerPricing(trip.travellerPricing);
  const { travellerPricing: _ignored, ...rest } = trip;
  return travellerPricing ? { ...rest, travellerPricing } : rest;
}

function toTrip(document: WithId<StoredTrip>): Trip {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...trip } = stripStoredMetadata(document);
  return cleanTripForStorage(trip);
}

async function ensureTravelIndexes() {
  const database = await getMongoDatabase();
  const destinations = database.collection<Destination>(travelCollectionNames.destinations);
  const trips = database.collection<Trip>(travelCollectionNames.trips);

  await Promise.all([
    destinations.createIndex({ id: 1 }, { unique: true, name: "travel_destination_id_unique" }),
    destinations.createIndex({ slug: 1 }, { unique: true, name: "travel_destination_slug_unique" }),
    trips.createIndex({ id: 1 }, { unique: true, name: "travel_trip_id_unique" }),
    trips.createIndex({ slug: 1 }, { unique: true, name: "travel_trip_slug_unique" }),
    trips.createIndex({ destinationId: 1 }, { name: "travel_trip_destination" })
  ]);
}

export async function getMongoCatalogueStatus() {
  if (!isMongoConfigured()) {
    return {
      configured: false as const,
      databaseName: getMongoDatabaseName(),
      destinations: 0,
      trips: 0
    };
  }

  const database = await getMongoDatabase();
  const [destinations, trips] = await Promise.all([
    database.collection(travelCollectionNames.destinations).countDocuments(),
    database.collection(travelCollectionNames.trips).countDocuments()
  ]);

  return {
    configured: true as const,
    databaseName: getMongoDatabaseName(),
    destinations,
    trips
  };
}

export async function listMongoDestinationsForAdmin() {
  const database = await getMongoDatabase();
  const documents = await database
    .collection<StoredDestination>(travelCollectionNames.destinations)
    .find({})
    .sort({ featured: -1, name: 1 })
    .toArray();

  return documents.map(toDestination);
}

export async function listMongoTripsForAdmin() {
  const database = await getMongoDatabase();
  const documents = await database
    .collection<StoredTrip>(travelCollectionNames.trips)
    .find({})
    .sort({ featured: -1, title: 1 })
    .toArray();

  return documents.map(toTrip);
}

export async function getMongoDestinationForAdmin(id: string) {
  const database = await getMongoDatabase();
  const document = await database
    .collection<StoredDestination>(travelCollectionNames.destinations)
    .findOne({ id });

  return document ? toDestination(document) : null;
}

export async function getMongoTripForAdmin(id: string) {
  const database = await getMongoDatabase();
  const document = await database
    .collection<StoredTrip>(travelCollectionNames.trips)
    .findOne({ id });

  return document ? toTrip(document) : null;
}

export async function saveMongoDestination(destination: Destination) {
  await ensureTravelIndexes();
  const database = await getMongoDatabase();
  const now = new Date();

  await database.collection<StoredDestination>(travelCollectionNames.destinations).updateOne(
    { id: destination.id },
    {
      $set: {
        ...destination,
        publicationStatus: destination.publicationStatus ?? "draft",
        updatedAt: now
      },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true }
  );
}

export async function saveMongoTrip(trip: Trip) {
  await ensureTravelIndexes();
  const database = await getMongoDatabase();
  const now = new Date();
  const cleanTrip = cleanTripForStorage(trip);

  await database.collection<StoredTrip>(travelCollectionNames.trips).updateOne(
    { id: trip.id },
    {
      $set: {
        ...cleanTrip,
        publicationStatus: cleanTrip.publicationStatus ?? "draft",
        updatedAt: now
      },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true }
  );
}

export async function seedDemoCatalogueToMongo() {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured.");
  }

  await ensureTravelIndexes();
  const database = await getMongoDatabase();
  const destinations = database.collection<StoredDestination>(travelCollectionNames.destinations);
  const trips = database.collection<StoredTrip>(travelCollectionNames.trips);
  const now = new Date();

  const [destinationResult, tripResult] = await Promise.all([
    destinations.bulkWrite(
      demoCatalogue.destinations.map((destination) => ({
        updateOne: {
          filter: { id: destination.id },
          update: {
            $setOnInsert: {
              ...destination,
              publicationStatus: destination.publicationStatus ?? "published",
              createdAt: now
            }
          },
          upsert: true
        }
      })),
      { ordered: false }
    ),
    trips.bulkWrite(
      demoCatalogue.trips.map((trip) => ({
        updateOne: {
          filter: { id: trip.id },
          update: {
            $setOnInsert: {
              ...cleanTripForStorage(trip),
              publicationStatus: trip.publicationStatus ?? "published",
              createdAt: now
            }
          },
          upsert: true
        }
      })),
      { ordered: false }
    )
  ]);

  return {
    destinationsInserted: destinationResult.upsertedCount,
    tripsInserted: tripResult.upsertedCount
  };
}
