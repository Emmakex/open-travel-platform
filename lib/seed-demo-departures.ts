import { demoAvailability } from "@/data/demo-availability";
import type { TripDeparture } from "@/domain/booking/types";
import { travelDepartureCollectionName } from "@/lib/mongo-departures";
import { getMongoDatabase } from "@/lib/mongodb";

type StoredDeparture = TripDeparture & { createdAt?: Date; updatedAt?: Date };

export async function seedDemoDeparturesToMongo() {
  const database = await getMongoDatabase();
  const collection = database.collection<StoredDeparture>(travelDepartureCollectionName);
  await Promise.all([
    collection.createIndex({ id: 1 }, { unique: true, name: "travel_departure_id_unique" }),
    collection.createIndex({ tripId: 1, departureDate: 1 }, { name: "travel_departure_trip_date" })
  ]);

  const now = new Date();
  const result = await collection.bulkWrite(
    demoAvailability.map((availability) => {
      const capacity = 12;
      return {
        updateOne: {
          filter: { id: availability.id },
          update: {
            $setOnInsert: {
              id: availability.id,
              tripId: availability.tripId,
              departureDate: availability.departureDate,
              returnDate: availability.returnDate,
              capacity,
              reservedSpaces: Math.max(0, capacity - availability.remainingSpaces),
              status: "open" as const,
              unitPrice: availability.unitPrice,
              createdAt: now
            }
          },
          upsert: true
        }
      };
    }),
    { ordered: false }
  );

  return result.upsertedCount;
}
