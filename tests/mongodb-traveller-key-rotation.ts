import assert from "node:assert/strict";
import { encryptVersionedValue } from "../lib/encryption-keyring";
import {
  listTravellerDataForCustomer,
  reencryptTravellerDataBatch,
  travellerDataAuditCollectionName,
  travellerDataCollectionName
} from "../lib/traveller-data";
import { getMongoClient, getMongoDatabase, getMongoDatabaseName } from "../lib/mongodb";

const travellerConfig = {
  keyVariable: "TRAVELLER_DATA_KEY",
  keyIdVariable: "TRAVELLER_DATA_KEY_ID",
  previousKeysVariable: "TRAVELLER_DATA_PREVIOUS_KEYS"
} as const;

const legacyAConfig = {
  keyVariable: "OTP_LEGACY_A_KEY",
  keyIdVariable: "OTP_LEGACY_A_KEY_ID",
  previousKeysVariable: "OTP_LEGACY_A_PREVIOUS"
} as const;

const legacyBConfig = {
  keyVariable: "OTP_LEGACY_B_KEY",
  keyIdVariable: "OTP_LEGACY_B_KEY_ID",
  previousKeysVariable: "OTP_LEGACY_B_PREVIOUS"
} as const;

async function main() {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  const records = database.collection(travellerDataCollectionName);
  const audit = database.collection(travellerDataAuditCollectionName);

  const oldKeyA = "41".repeat(32);
  const oldKeyB = "42".repeat(32);
  const newKey = "43".repeat(32);
  process.env.OTP_LEGACY_A_KEY = oldKeyA;
  process.env.OTP_LEGACY_B_KEY = oldKeyB;
  delete process.env.OTP_LEGACY_A_KEY_ID;
  delete process.env.OTP_LEGACY_B_KEY_ID;
  delete process.env.OTP_LEGACY_A_PREVIOUS;
  delete process.env.OTP_LEGACY_B_PREVIOUS;

  const dataA = {
    documentNumber: "ROTATION-A-123",
    residenceCountry: "ES",
    emergencyContactName: "Contact A"
  };
  const dataB = {
    documentNumber: "ROTATION-B-456",
    residenceCountry: "PT",
    emergencyContactName: "Contact B"
  };
  const legacyPayloadA = encryptVersionedValue(JSON.stringify(dataA), legacyAConfig);
  const legacyPayloadB = encryptVersionedValue(JSON.stringify(dataB), legacyBConfig);
  assert.equal(legacyPayloadA.version, 1);
  assert.equal(legacyPayloadB.version, 1);

  const createdAt = new Date("2026-08-01T09:00:00.000Z");
  const updatedAt = new Date("2026-08-10T10:00:00.000Z");
  const retentionUntil = new Date("2027-08-27T00:00:00.000Z");

  try {
    await database.dropDatabase();
    await records.insertMany([
      {
        id: "td-a-readable",
        targetType: "trip",
        reservationId: "reservation-key-rotation",
        identityId: "customer-key-rotation",
        travellerId: "traveller-a",
        payload: legacyPayloadA,
        completedFields: ["documentNumber", "residenceCountry"],
        createdAt,
        updatedAt,
        retentionUntil
      },
      {
        id: "td-b-unreadable",
        targetType: "trip",
        reservationId: "reservation-key-rotation",
        identityId: "customer-key-rotation",
        travellerId: "traveller-b",
        payload: legacyPayloadB,
        completedFields: ["documentNumber", "residenceCountry"],
        createdAt,
        updatedAt,
        retentionUntil
      }
    ]);

    process.env.TRAVELLER_DATA_KEY = newKey;
    process.env.TRAVELLER_DATA_KEY_ID = "traveller-2026-b";
    process.env.TRAVELLER_DATA_PREVIOUS_KEYS = JSON.stringify({ "traveller-2026-a": oldKeyA });

    await assert.rejects(
      () => reencryptTravellerDataBatch({ limit: 2 }),
      /legacy encrypted value could not be decrypted/i,
      "a missing legacy key must abort the whole migration batch"
    );

    const afterRollbackA = await records.findOne({ id: "td-a-readable" });
    const afterRollbackB = await records.findOne({ id: "td-b-unreadable" });
    assert.equal(afterRollbackA?.payload?.version, 1, "the first record must roll back when a later record cannot decrypt");
    assert.equal(afterRollbackB?.payload?.version, 1, "the unreadable record must remain untouched after rollback");
    assert.equal(afterRollbackA?.updatedAt?.toISOString(), updatedAt.toISOString());
    assert.equal(afterRollbackA?.retentionUntil?.toISOString(), retentionUntil.toISOString());

    process.env.TRAVELLER_DATA_PREVIOUS_KEYS = JSON.stringify({
      "traveller-2026-a": oldKeyA,
      "traveller-2026-a-secondary": oldKeyB
    });

    const firstBatch = await reencryptTravellerDataBatch({ limit: 1 });
    assert.equal(firstBatch.currentKeyId, "traveller-2026-b");
    assert.equal(firstBatch.scanned, 1);
    assert.equal(firstBatch.migrated, 1);
    assert.equal(firstBatch.remaining, 1, "batch limit must bound migration work");

    const secondBatch = await reencryptTravellerDataBatch({ limit: 1 });
    assert.equal(secondBatch.migrated, 1);
    assert.equal(secondBatch.remaining, 0);

    const migrated = await records.find({}).sort({ id: 1 }).toArray();
    assert.equal(migrated.length, 2);
    for (const record of migrated) {
      assert.equal(record.payload?.version, 2);
      assert.equal(record.payload?.keyId, "traveller-2026-b");
      assert.equal(record.createdAt?.toISOString(), createdAt.toISOString(), "cryptographic maintenance must preserve createdAt");
      assert.equal(record.updatedAt?.toISOString(), updatedAt.toISOString(), "cryptographic maintenance must preserve business updatedAt");
      assert.equal(record.retentionUntil?.toISOString(), retentionUntil.toISOString(), "cryptographic maintenance must preserve retention TTL");
      assert.deepEqual(record.completedFields, ["documentNumber", "residenceCountry"]);
    }
    assert.equal(await audit.countDocuments({}), 0, "re-encryption must not create false traveller-data change audit events");

    delete process.env.TRAVELLER_DATA_PREVIOUS_KEYS;
    const readable = await listTravellerDataForCustomer({
      identityId: "customer-key-rotation",
      targetType: "trip",
      reservationId: "reservation-key-rotation"
    });
    assert.deepEqual(readable.get("traveller-a"), dataA, "migrated data must remain readable after old keys are removed");
    assert.deepEqual(readable.get("traveller-b"), dataB, "all migrated data must depend only on the current key");

    const noOp = await reencryptTravellerDataBatch({ limit: 25 });
    assert.equal(noOp.scanned, 0);
    assert.equal(noOp.migrated, 0);
    assert.equal(noOp.remaining, 0, "migration must be idempotent once every retained record is current");

    console.info(
      "Traveller-data key rotation validation passed: bounded batches, transactional rollback, TTL/timestamp preservation and post-rotation readability are consistent."
    );
  } finally {
    await database.dropDatabase();
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
