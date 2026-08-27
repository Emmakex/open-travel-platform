import assert from "node:assert/strict";
import { travelPaymentTransactionCollectionName } from "../lib/mongo-payments";
import {
  travelOperationsAuditCollectionName,
  travelReservationCollectionName
} from "../lib/mongo-reservations";
import { travellerDataCollectionName } from "../lib/traveller-data";
import { getMongoClient, getMongoDatabaseName } from "../lib/mongodb";

async function indexByName(databaseName: string, collectionName: string, indexName: string) {
  const client = await getMongoClient();
  const indexes = await client.db(databaseName).collection(collectionName).listIndexes().toArray();
  return indexes.find((index) => index.name === indexName);
}

async function main() {
  const client = await getMongoClient();
  const recoveredDatabaseName = getMongoDatabaseName();
  const sourceDatabaseName = process.env.MONGODB_RECOVERY_SOURCE_DB?.trim();
  assert.ok(sourceDatabaseName, "MONGODB_RECOVERY_SOURCE_DB is required for isolated-restore validation.");
  assert.notEqual(recoveredDatabaseName, sourceDatabaseName, "Recovery validation must never target the damaged source database.");

  const recovered = client.db(recoveredDatabaseName);
  const source = client.db(sourceDatabaseName);

  try {
    const reservation = await recovered.collection(travelReservationCollectionName).findOne({ id: "res-recovery-canary" });
    const payment = await recovered.collection(travelPaymentTransactionCollectionName).findOne({ id: "pay-recovery-canary" });
    const audit = await recovered.collection(travelOperationsAuditCollectionName).findOne({ id: "audit-recovery-canary" });
    const traveller = await recovered.collection(travellerDataCollectionName).findOne({ id: "td-recovery-canary" });
    const manifest = await recovered.collection("travel_recovery_manifest").findOne({ id: "recovery-manifest-v1" });

    assert.equal(reservation?.status, "confirmed");
    assert.equal(reservation?.totalPrice, 129900);
    assert.equal(payment?.status, "succeeded");
    assert.equal(payment?.providerReference, "provider-recovery-canary");
    assert.equal(audit?.reservationId, "res-recovery-canary");
    assert.equal(traveller?.payload?.keyId, "traveller-recovery-fixture");
    assert.equal(traveller?.retentionUntil?.toISOString(), "2027-08-27T00:00:00.000Z");
    assert.equal(manifest?.schemaVersion, 1);

    const reservationUnique = await indexByName(recoveredDatabaseName, travelReservationCollectionName, "travel_reservation_id_unique");
    const paymentUnique = await indexByName(recoveredDatabaseName, travelPaymentTransactionCollectionName, "travel_payment_provider_reference_unique");
    const travellerUnique = await indexByName(recoveredDatabaseName, travellerDataCollectionName, "traveller_data_reservation_traveller_unique");
    const travellerTtl = await indexByName(recoveredDatabaseName, travellerDataCollectionName, "traveller_data_retention_ttl");

    assert.equal(reservationUnique?.unique, true, "reservation unique index must survive logical backup/restore");
    assert.equal(paymentUnique?.unique, true, "payment provider-reference unique index must survive logical backup/restore");
    assert.equal(travellerUnique?.unique, true, "traveller identity index must survive logical backup/restore");
    assert.equal(travellerTtl?.expireAfterSeconds, 0, "traveller retention TTL index must survive logical backup/restore");

    assert.equal(
      await source.collection(travelReservationCollectionName).countDocuments({ id: "res-recovery-canary" }),
      0,
      "isolated restore must not silently repair/overwrite the damaged source database"
    );
    assert.equal(
      (await source.collection("travel_recovery_incident").findOne({ id: "incident-simulated" }))?.state,
      "damaged",
      "source incident marker must remain present after restoring into the isolated recovery database"
    );

    console.info(
      "MongoDB recovery validation passed: isolated restore recovered critical data plus unique/TTL indexes while leaving the damaged source untouched."
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
