import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`MongoDB concurrency invariant failed: ${message}`);
};

const test = read("tests/mongodb-booking-concurrency.ts");
const workflow = read(".github/workflows/ci.yml");
const packageJson = JSON.parse(read("package.json"));

assert(packageJson.scripts?.["test:mongodb-concurrency"] === "tsx tests/mongodb-booking-concurrency.ts", "package script must execute the real MongoDB test");
assert(packageJson.devDependencies?.tsx === "4.23.12", "tsx runner must remain exactly pinned");
assert(test.includes('databaseName.startsWith("ktravel_ci_")'), "destructive test must require a CI-only database name");
assert(test.includes('parsed.hostname === "127.0.0.1"') && test.includes('parsed.hostname === "localhost"'), "destructive test must reject remote MongoDB hosts");
assert(test.includes("Promise.allSettled(attempts)"), "booking test must execute concurrent reservation attempts");
assert(test.includes("Exactly the five available spaces must be reservable"), "capacity race must assert exact successful booking count");
assert(test.includes("never oversell departure capacity"), "capacity race must assert no overselling");
assert(test.includes("ACCOMMODATION_INVENTORY_UNAVAILABLE"), "test must force a post-departure-write transaction failure");
assert(test.includes("must roll back when a later transaction step fails"), "test must assert transaction rollback restores departure inventory");
assert(test.includes("transactional outbox"), "test must assert outbox consistency with committed reservations");
assert(test.includes("Concurrent duplicate cancellation must release inventory only once"), "duplicate cancellation race must be covered");
assert(workflow.includes("mongodb-concurrency:"), "CI must contain a dedicated MongoDB concurrency job");
assert(workflow.includes("mongo:8.0.29"), "CI MongoDB image must be pinned to the reviewed 8.0.29 patch");
assert(workflow.includes("--replSet rs0"), "CI MongoDB must run as a replica set so multi-document transactions are real");
assert(workflow.includes("npm run test:mongodb-concurrency"), "CI must execute the MongoDB concurrency test");

console.log("MongoDB concurrency CI invariants passed.");
