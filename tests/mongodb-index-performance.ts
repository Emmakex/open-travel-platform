import assert from "node:assert/strict";
import { getMongoClient, getMongoDatabaseName } from "../lib/mongodb";

function planText(explain: unknown) {
  return JSON.stringify(explain);
}

function stats(explain: any) {
  return explain.executionStats as {
    nReturned: number;
    totalKeysExamined: number;
    totalDocsExamined: number;
  };
}

function assertIndexed(explain: unknown, indexName: string, label: string) {
  const text = planText(explain);
  assert.match(text, new RegExp(indexName), `${label} must use ${indexName}`);
  assert.doesNotMatch(text, /"stage":"COLLSCAN"/, `${label} must not fall back to COLLSCAN`);
}

async function main() {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());

  try {
    await database.dropDatabase();

    // Connection-level index creation is process-cached, so create the same
    // production supplemental baseline explicitly after dropping this test DB.
    const { ensureMongoPerformanceIndexes } = await import("../lib/mongodb-performance-indexes");
    await ensureMongoPerformanceIndexes(database);

    const now = Date.now();
    const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();

    const reservations = database.collection("travel_reservations");
    const travellerData = database.collection("travel_traveller_details");
    const deliveries = database.collection("travel_integration_deliveries");

    await reservations.insertMany(Array.from({ length: 4000 }, (_, index) => ({
      id: `res-${index}`,
      identityId: `customer-${index % 100}`,
      tripId: `trip-${index % 25}`,
      availabilityId: `dep-${index % 50}`,
      status: ["pending", "confirmed", "cancelled"][index % 3],
      createdAt: iso(-index * 1000)
    })));

    await travellerData.insertMany(Array.from({ length: 4000 }, (_, index) => ({
      id: `td-${index}`,
      identityId: `customer-${index % 100}`,
      targetType: index % 5 === 0 ? "service" : "trip",
      reservationId: `res-${index % 200}`,
      travellerId: `trav-${index}`,
      payload: { version: 2, keyId: "test", iv: "iv", tag: "tag", value: "value" },
      completedFields: [],
      createdAt: new Date(now - index * 1000),
      updatedAt: new Date(now - index * 1000),
      retentionUntil: new Date(now + (index % 10 === 0 ? -1 : 30) * 86400000)
    })));

    const statuses = ["pending", "retrying", "delivering", "succeeded"] as const;
    await deliveries.insertMany(Array.from({ length: 4000 }, (_, index) => ({
      id: `intdel-${index}`,
      eventId: `evt-${index}`,
      endpointId: `endpoint-${index % 20}`,
      status: statuses[index % statuses.length],
      attempts: index % 4,
      nextAttemptAt: iso((index % 7 - 3) * 60000),
      leaseUntil: iso((index % 9 - 4) * 60000),
      createdAt: iso(-index * 1000)
    })));

    const reservationRecent = await reservations
      .find({})
      .sort({ createdAt: -1 })
      .limit(25)
      .explain("executionStats");
    assertIndexed(reservationRecent, "travel_reservation_created", "recent reservation queue");
    assert.ok(stats(reservationRecent).totalDocsExamined <= 25, "recent reservations should examine at most the returned window");

    const reservationStatus = await reservations
      .find({ status: "pending" })
      .limit(50)
      .explain("executionStats");
    assertIndexed(reservationStatus, "travel_reservation_status", "reservation status summary predicate");
    assert.ok(stats(reservationStatus).totalDocsExamined < 4000, "status filtering must avoid scanning the full reservation collection");

    const customerTraveller = await travellerData
      .find({
        identityId: "customer-7",
        targetType: "trip",
        reservationId: "res-7",
        retentionUntil: { $gt: new Date(now) }
      })
      .explain("executionStats");
    assertIndexed(customerTraveller, "traveller_data_customer_active", "customer active traveller-data lookup");
    assert.ok(stats(customerTraveller).totalDocsExamined < 100, "customer traveller lookup must remain selective");

    const operatorTraveller = await travellerData
      .find({
        targetType: "trip",
        reservationId: "res-7",
        retentionUntil: { $gt: new Date(now) }
      })
      .explain("executionStats");
    assertIndexed(operatorTraveller, "traveller_data_reservation_active", "operator active traveller-data lookup");
    assert.ok(stats(operatorTraveller).totalDocsExamined < 100, "operator traveller lookup must remain selective");

    const dueDelivery = await deliveries
      .find({ status: "pending", nextAttemptAt: { $lte: iso(0) } })
      .sort({ nextAttemptAt: 1, createdAt: 1 })
      .limit(1)
      .explain("executionStats");
    assertIndexed(dueDelivery, "integration_delivery_due_queue", "due integration delivery claim branch");
    assert.ok(stats(dueDelivery).totalDocsExamined <= 1, "due delivery claim should examine only its winning candidate");

    const expiredLease = await deliveries
      .find({ status: "delivering", leaseUntil: { $lte: iso(0) } })
      .sort({ leaseUntil: 1, createdAt: 1 })
      .limit(1)
      .explain("executionStats");
    assertIndexed(expiredLease, "integration_delivery_lease_queue", "expired integration lease claim branch");
    assert.ok(stats(expiredLease).totalDocsExamined <= 1, "expired lease claim should examine only its winning candidate");

    const recentDeliveries = await deliveries
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .explain("executionStats");
    assertIndexed(recentDeliveries, "integration_delivery_created", "recent integration delivery history");
    assert.ok(stats(recentDeliveries).totalDocsExamined <= 100, "recent delivery history should examine only its returned window");

    const combinedClaim = await deliveries
      .find({
        $or: [
          { status: { $in: ["pending", "retrying"] }, nextAttemptAt: { $lte: iso(0) } },
          { status: "delivering", leaseUntil: { $lte: iso(0) } }
        ]
      })
      .limit(10)
      .explain("executionStats");
    const combinedText = planText(combinedClaim);
    assert.doesNotMatch(combinedText, /"stage":"COLLSCAN"/, "combined delivery claim predicate must remain index-backed");
    assert.match(
      combinedText,
      /integration_delivery_(due|lease)_queue/,
      "combined delivery claim must use at least one dedicated queue index"
    );

    console.info("MongoDB critical query-plan validation passed: reservation, traveller and integration hot paths are index-backed.");
  } finally {
    await database.dropDatabase();
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
