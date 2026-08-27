import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Traveller key rotation invariant failed: ${message}`);
};

const traveller = read("lib/traveller-data.ts");
const keyring = read("lib/encryption-keyring.ts");
const test = read("tests/mongodb-traveller-key-rotation.ts");
const runner = read("scripts/reencrypt-traveller-data.ts");
const env = read(".env.example");
const docs = read("docs/KEY-ROTATION.md");
const docsEs = read("docs/KEY-ROTATION.es.md");
const packageJson = JSON.parse(read("package.json"));

for (const variable of ["TRAVELLER_DATA_KEY", "TRAVELLER_DATA_KEY_ID", "TRAVELLER_DATA_PREVIOUS_KEYS"]) {
  assert(traveller.includes(`\"${variable}\"`), `traveller keyring must reference ${variable}`);
  assert(env.includes(`${variable}=`), `.env.example must document ${variable}`);
  assert(!env.includes(`NEXT_PUBLIC_${variable}`), `${variable} must remain server-only`);
}

assert(traveller.includes("encryptVersionedValue") && traveller.includes("decryptVersionedValue"), "traveller payloads must use the shared versioned keyring");
assert(keyring.includes("currentEncryptionKeyId"), "shared keyring must expose the non-secret current key ID for migration targeting");
assert(traveller.includes("TRAVELLER_DATA_KEY_ID_REQUIRED"), "migration must refuse to run without a current key ID");
assert(traveller.includes("Math.max(1, Math.min(100"), "migration batch size must be bounded to 100 records");
assert(traveller.includes("session.withTransaction"), "traveller re-encryption batches must be transactional");
assert(traveller.includes("payload: record.payload"), "migration updates must use ciphertext compare-and-set to protect concurrent writes");
assert(traveller.includes("TRAVELLER_DATA_REENCRYPTION_CONFLICT"), "concurrent migration conflicts must fail closed");
assert(traveller.includes('name: "traveller_data_encryption_rotation"'), "migration lookup must have a dedicated index");

const migrationStart = traveller.indexOf("export async function reencryptTravellerDataBatch");
const migrationEnd = traveller.indexOf("const documentTypes", migrationStart);
assert(migrationStart >= 0 && migrationEnd > migrationStart, "migration implementation must remain identifiable for invariant checks");
const migration = traveller.slice(migrationStart, migrationEnd);
assert(migration.includes("$set: { payload: nextPayload }"), "migration must update only encrypted payload");
for (const protectedMetadata of ["updatedAt:", "createdAt:", "retentionUntil:", "completedFields:", "travellerDataAuditCollectionName"]) {
  assert(!migration.includes(protectedMetadata), `migration must not mutate or audit business metadata: ${protectedMetadata}`);
}

assert(test.includes("must roll back when a later record cannot decrypt"), "MongoDB test must prove whole-batch rollback");
assert(test.includes("cryptographic maintenance must preserve business updatedAt"), "MongoDB test must preserve business updatedAt");
assert(test.includes("cryptographic maintenance must preserve retention TTL"), "MongoDB test must preserve TTL");
assert(test.includes("must not create false traveller-data change audit events"), "MongoDB test must prove re-encryption is not a customer-data change event");
assert(test.includes("after old keys are removed"), "MongoDB test must prove migrated data reads after previous keys are removed");
assert(test.includes("migration must be idempotent"), "MongoDB test must prove migration becomes a no-op once complete");

assert(runner.includes('numericOption("batch-size"'), "operator runner must expose bounded batch size");
assert(runner.includes('numericOption("max-batches"'), "operator runner must expose a bounded maximum number of batches");
assert(!runner.includes("payload.value"), "operator runner must never log ciphertext contents");
assert(!runner.includes("process.env.TRAVELLER_DATA_KEY"), "operator runner must never read/log key material directly");

assert(packageJson.scripts?.["check:traveller-key-rotation"] === "node scripts/traveller-key-rotation-check.mjs", "static key-rotation gate must be registered");
assert(packageJson.scripts?.["test:mongodb-traveller-key-rotation"] === "tsx tests/mongodb-traveller-key-rotation.ts", "MongoDB rotation test must be registered");
assert(packageJson.scripts?.["migrate:traveller-encryption"] === "tsx scripts/reencrypt-traveller-data.ts", "operator migration command must be registered");
assert(packageJson.scripts?.verify?.includes("check:traveller-key-rotation"), "traveller key rotation invariant must be part of verify");

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("traveller_data_key_id"), `${name} documentation must cover the traveller key ID`);
  assert(lower.includes("remaining"), `${name} documentation must require migration inventory to reach remaining=0`);
  assert(lower.includes("ttl"), `${name} documentation must describe TTL preservation`);
  assert(lower.includes("rollback"), `${name} documentation must describe batch rollback`);
}

console.log("Traveller-data key rotation invariants passed.");
