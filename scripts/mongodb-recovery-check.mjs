import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`MongoDB recovery invariant failed: ${message}`);
};

const workflow = read(".github/workflows/mongodb-recovery.yml");
const seed = read("tests/mongodb-recovery-seed.ts");
const verify = read("tests/mongodb-recovery-verify.ts");
const docs = read("docs/MONGODB-RECOVERY.md");
const docsEs = read("docs/MONGODB-RECOVERY.es.md");
const packageJson = JSON.parse(read("package.json"));

assert(workflow.includes("mongo:8.0.29"), "recovery drill must pin the MongoDB major/minor image used by CI");
assert(workflow.includes("mongodump"), "recovery drill must create a real logical MongoDB backup");
assert(workflow.includes("--archive=/tmp/ktravel-recovery.archive.gz"), "backup must use an explicit archive artifact");
assert(workflow.includes("--gzip"), "logical backup/restore must be compressed in the drill");
assert(workflow.includes("sha256sum"), "backup drill must produce an integrity checksum");
assert(workflow.includes("Simulate destructive incident on source"), "drill must prove recovery after actual source data loss");
assert(workflow.includes('test "$SOURCE_DB" != "$RECOVERY_DB"'), "workflow must guard against restoring into the source database");
assert(workflow.includes("--nsFrom=\"${SOURCE_DB}.*\""), "restore must remap from the source namespace");
assert(workflow.includes("--nsTo=\"${RECOVERY_DB}.*\""), "restore must target an isolated recovery namespace");
assert(!workflow.includes("mongorestore --drop"), "recovery drill must never normalize destructive restore directly over the source");

for (const canary of ["res-recovery-canary", "pay-recovery-canary", "audit-recovery-canary", "td-recovery-canary"]) {
  assert(seed.includes(canary), `seed must contain critical recovery canary ${canary}`);
  assert(verify.includes(canary), `verification must require critical recovery canary ${canary}`);
}
assert(seed.includes("traveller_data_retention_ttl"), "seed must create a traveller TTL index canary");
assert(verify.includes("expireAfterSeconds"), "verification must validate TTL index semantics");
assert(verify.includes("travel_payment_provider_reference_unique"), "verification must validate payment idempotency index restoration");
assert(verify.includes("travel_reservation_id_unique"), "verification must validate reservation identity index restoration");
assert(verify.includes("isolated restore must not silently repair/overwrite"), "verification must prove the damaged source is not overwritten");

assert(packageJson.scripts?.["check:mongodb-recovery"] === "node scripts/mongodb-recovery-check.mjs", "recovery invariant must be registered");
assert(packageJson.scripts?.["test:mongodb-recovery-seed"] === "tsx tests/mongodb-recovery-seed.ts", "recovery seed command must be registered");
assert(packageJson.scripts?.["test:mongodb-recovery-verify"] === "tsx tests/mongodb-recovery-verify.ts", "recovery verification command must be registered");
assert(packageJson.scripts?.verify?.includes("check:mongodb-recovery"), "recovery invariant must be part of verify");

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("rpo") && lower.includes("rto"), `${name} runbook must require explicit recovery objectives`);
  assert(lower.includes("isolated") || lower.includes("aislado"), `${name} runbook must require isolated restore first`);
  assert(lower.includes("ttl"), `${name} runbook must require TTL/index validation`);
  assert(lower.includes("cutover"), `${name} runbook must describe controlled cutover`);
  assert(lower.includes("rollback"), `${name} runbook must describe recovery rollback semantics`);
  assert(lower.includes("keyring"), `${name} runbook must separate database backup from encryption-key recovery`);
}

console.log("MongoDB backup/restore and disaster-recovery invariants passed.");
