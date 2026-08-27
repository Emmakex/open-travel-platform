import assert from "node:assert/strict";
import { ensureMongoPaymentIndexes, travelPaymentTransactionCollectionName } from "../lib/mongo-payments";
import {
  ensureMongoReservationIndexes,
  travelOperationsAuditCollectionName,
  travelReservationCollectionName
} from "../lib/mongo-reservations";
import { travellerDataCollectionName } from "../lib/traveller-data";
import { getMongoClient, getMongoDatabaseName } from "../lib/mongodb";

async function main() {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());

  try {
    await database.dropDatabase();
    await ensureMongoReservationIndexes(database);
    await ensureMongoPaymentIndexes(database);

    const traveller = database.collection(travellerDataCollectionName);
    await Promise.all([
      traveller.createIndex(
        { targetType: 1, reservationId: 1, travellerId: 1 },
        { unique: true, name: "traveller_data_reservation_traveller_unique" }
      ),
      traveller.createIndex(
        { retentionUntil: 1 },
        { expireAfterSeconds: 0, name: "traveller_data_retention_ttl" }
      )
    ]);

    const reservations = database.collection(travelReservationCollectionName);
    const payments = database.collection(travelPaymentTransactionCollectionName);
    const operationsAudit = database.collection(travelOperationsAuditCollectionName);

    await reservations.insertOne({
      id: "res-recovery-canary",
      identityId: "customer-recovery-canary",
      tripId: "trip-recovery-canary",
      availabilityId: "departure-recovery-canary",
      partySize: 2,
      inventorySpaces: 2,
      status: "confirmed",
      totalPrice: 129900,
      currency: "EUR",
      travellers: [],
      createdAt: "2026-08-27T06:30:00.000Z"
    });

    await payments.insertOne({
      id: "pay-recovery-canary",
      reservationId: "res-recovery-canary",
      targetType: "trip",
      type: "payment",
      status: "succeeded",
      amount: 129900,
      currency: "EUR",
      provider: "recovery-fixture",
      providerReference: "provider-recovery-canary",
      createdAt: "2026-08-27T06:31:00.000Z"
    });

    await operationsAudit.insertOne({
      id: "audit-recovery-canary",
      reservationId: "res-recovery-canary",
      actorIdentityId: "operator-recovery-canary",
      actorRole: "admin",
      action: "status_changed",
      fromStatus: "pending",
      toStatus: "confirmed",
      occurredAt: "2026-08-27T06:32:00.000Z"
    });

    await traveller.insertOne({
      id: "td-recovery-canary",
      targetType: "trip",
      reservationId: "res-recovery-canary",
      identityId: "customer-recovery-canary",
      travellerId: "traveller-recovery-canary",
      payload: {
        version: 2,
        keyId: "traveller-recovery-fixture",
        iv: "cmVjb3ZlcnktaXY=",
        tag: "cmVjb3ZlcnktdGFn",
        value: "cmVjb3ZlcnktY2lwaGVydGV4dA=="
      },
      completedFields: ["documentNumber"],
      createdAt: new Date("2026-08-27T06:33:00.000Z"),
      updatedAt: new Date("2026-08-27T06:34:00.000Z"),
      retentionUntil: new Date("2027-08-27T00:00:00.000Z")
    });

    await database.collection("travel_recovery_manifest").insertOne({
      id: "recovery-manifest-v1",
      schemaVersion: 1,
      createdAt: new Date("2026-08-27T06:35:00.000Z"),
      expectedCollections: [
        travelReservationCollectionName,
        travelPaymentTransactionCollectionName,
        travelOperationsAuditCollectionName,
        travellerDataCollectionName
      ]
    });

    assert.equal(await reservations.countDocuments({}), 1);
    assert.equal(await payments.countDocuments({}), 1);
    assert.equal(await traveller.countDocuments({}), 1);

    console.info("MongoDB recovery fixture seeded with reservation, payment, audit, traveller payload and index canaries.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
