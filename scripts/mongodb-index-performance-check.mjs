import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`MongoDB index performance invariant failed: ${message}`);
};

const indexes = read("lib/mongodb-performance-indexes.ts");
const mongodb = read("lib/mongodb.ts");
const test = read("tests/mongodb-index-performance.ts");
const docs = read("docs/MONGODB-INDEX-PERFORMANCE.md");
const docsEs = read("docs/MONGODB-INDEX-PERFORMANCE.es.md");
const packageJson = JSON.parse(read("package.json"));

for (const indexName of [
  "travel_reservation_created",
  "travel_reservation_status",
  "traveller_data_customer_active",
  "traveller_data_reservation_active",
  "integration_delivery_due_queue",
  "integration_delivery_lease_queue",
  "integration_delivery_created"
]) {
  assert(indexes.includes(indexName), `critical index ${indexName} must remain declared`);
  assert(test.includes(indexName), `query-plan test must exercise ${indexName}`);
}

assert(mongodb.includes("ensureMongoPerformanceIndexes"), "Mongo connection must install the supplemental performance baseline");
assert(mongodb.includes("await ensureMongoPerformanceIndexes(connected.db(getMongoDatabaseName()))"), "indexes must be ready before the connected client is returned");
assert(test.includes('explain("executionStats")'), "dynamic validation must use executionStats explain plans");
assert(test.includes('"stage":"COLLSCAN"'), "dynamic validation must explicitly reject collection scans");
assert(test.includes("totalDocsExamined"), "dynamic validation must bound documents examined on critical paths");
assert(test.includes("combined delivery claim predicate must remain index-backed"), "integration OR claim predicate must be checked as a whole");

assert(packageJson.scripts?.["check:mongodb-index-performance"] === "node scripts/mongodb-index-performance-check.mjs", "static performance gate must be registered");
assert(packageJson.scripts?.["test:mongodb-index-performance"] === "tsx tests/mongodb-index-performance.ts", "MongoDB explain test must be registered");
assert(packageJson.scripts?.verify?.includes("check:mongodb-index-performance"), "performance invariant must be part of verify");

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("explain"), `${name} docs must describe explain-plan validation`);
  assert(lower.includes("collscan"), `${name} docs must describe COLLSCAN rejection`);
  assert(lower.includes("over-index") || lower.includes("sobreindex"), `${name} docs must explain the over-indexing boundary`);
  assert(lower.includes("atlas"), `${name} docs must cover production Atlas follow-up`);
}

console.log("MongoDB critical index/performance invariants passed.");
