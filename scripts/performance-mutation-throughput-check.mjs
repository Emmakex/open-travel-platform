import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Mutation throughput invariant failed: ${message}`);
};

const packageJson = JSON.parse(read("package.json"));
const test = read("tests/performance-mutation-throughput.ts");
const workflow = read(".github/workflows/performance-mutation-throughput.yml");
const docs = read("docs/PERFORMANCE-MUTATION-THROUGHPUT.md");
const docsEs = read("docs/PERFORMANCE-MUTATION-THROUGHPUT.es.md");

assert(packageJson.scripts?.["test:performance-mutation-throughput"] === "tsx tests/performance-mutation-throughput.ts", "package script must expose mutation throughput validation");
assert(packageJson.scripts?.["check:performance-mutation-throughput"] === "node scripts/performance-mutation-throughput-check.mjs", "package script must expose mutation throughput invariants");

for (const evidence of [
  "CAPACITY = 16",
  "ATTEMPTS = 32",
  "MongoBookingRepository",
  "repository.createReservation",
  "repository.cancelReservation",
  "DEPARTURE_UNAVAILABLE",
  "travelDepartureCollectionName",
  "travelReservationCollectionName",
  "integrationEventCollectionName",
  "mutation_throughput_create",
  "mutation_throughput_cancel",
  "mutation_throughput_complete",
  "p95Ms",
  "postLoadCorrectness"
]) assert(test.includes(evidence), `test must preserve: ${evidence}`);
assert(test.includes('databaseName.startsWith("ktravel_ci_")'), "destructive mutation test must reject non-CI databases");
assert(test.includes('parsed.hostname === "127.0.0.1"') && test.includes('parsed.hostname === "localhost"'), "destructive mutation test must reject remote MongoDB hosts");
assert(test.includes("reservedSpaces, CAPACITY") && test.includes("reservedSpaces, 0"), "inventory must be verified at saturation and after cancellation cleanup");
assert(test.includes("countDocuments") && test.includes("trip.reservation.created") && test.includes("trip.reservation.status.changed"), "reservation/outbox post-load correctness must be verified");

for (const evidence of [
  "name: Mutation throughput baseline",
  "mongo:8.0.29",
  "npm run check:performance-mutation-throughput",
  "npm run typecheck",
  "npm run test:performance-mutation-throughput",
  "ktravel_ci_mutation_load_"
]) assert(workflow.includes(evidence), `workflow must preserve: ${evidence}`);

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("9d-5.3"), `${name} docs must identify Phase 9D-5.3`);
  assert(lower.includes("isolated") || lower.includes("aislada") || lower.includes("aislado"), `${name} docs must document isolated database execution`);
  assert(lower.includes("inventory") || lower.includes("inventario"), `${name} docs must document post-load inventory correctness`);
  assert(lower.includes("outbox"), `${name} docs must document transactional outbox verification`);
  assert(lower.includes("not production slo") || lower.includes("no son slo") || lower.includes("no es un slo"), `${name} docs must distinguish CI budgets from production SLOs`);
}

console.log("Bounded mutation throughput invariants passed.");
