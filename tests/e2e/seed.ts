import assert from "node:assert/strict";
import { replaceMongoTripDepartures } from "@/lib/mongo-departures";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { seedDemoCatalogueToMongo } from "@/lib/mongo-travel-admin";

function requireDisposableLocalDatabase() {
  const uri = process.env.MONGODB_URI?.trim();
  const databaseName = getMongoDatabaseName();
  assert(uri, "MONGODB_URI is required for browser E2E seeding.");
  assert(
    databaseName.startsWith("ktravel_ci_"),
    `Refusing destructive E2E seed against non-CI database: ${databaseName}`
  );

  const parsed = new URL(uri);
  assert(parsed.protocol === "mongodb:", "Browser E2E requires a local mongodb:// replica-set URI.");
  assert(
    parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost",
    `Refusing destructive E2E seed against non-local MongoDB host: ${parsed.hostname}`
  );
}

async function main() {
  requireDisposableLocalDatabase();
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());

  try {
    await database.dropDatabase();
    const seeded = await seedDemoCatalogueToMongo();
    await replaceMongoTripDepartures("trip-barcelona-city", [
      {
        id: "departure-e2e-barcelona",
        tripId: "trip-barcelona-city",
        departureDate: "2099-06-10",
        returnDate: "2099-06-13",
        capacity: 12,
        reservedSpaces: 0,
        status: "open",
        unitPrice: 540
      }
    ]);

    console.log(
      `Browser E2E seed ready in ${getMongoDatabaseName()}: ${seeded.destinationsInserted} destinations, ${seeded.tripsInserted} trips, 1 controlled departure.`
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
