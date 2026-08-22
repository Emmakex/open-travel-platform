import { travelCollectionNames } from "@/adapters/mongo-travel-repository";
import { demoCatalogue } from "@/data/demo-catalogue";
import type { Destination, Trip } from "@/domain/travel/types";
import { getMongoDatabase, getMongoDatabaseName, isMongoConfigured } from "@/lib/mongodb";

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

export async function seedDemoCatalogueToMongo() {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured.");
  }

  await ensureTravelIndexes();
  const database = await getMongoDatabase();
  const destinations = database.collection<Destination & { createdAt?: Date }>(travelCollectionNames.destinations);
  const trips = database.collection<Trip & { createdAt?: Date }>(travelCollectionNames.trips);
  const now = new Date();

  const [destinationResult, tripResult] = await Promise.all([
    destinations.bulkWrite(
      demoCatalogue.destinations.map((destination) => ({
        updateOne: {
          filter: { id: destination.id },
          update: {
            $setOnInsert: {
              ...destination,
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
              ...trip,
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
