import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Authenticated-read performance invariant failed: ${message}`);
};

const packageJson = JSON.parse(read("package.json"));
const test = read("tests/performance-authenticated-read-baseline.ts");
const workflow = read(".github/workflows/performance-authenticated-read.yml");
const docs = read("docs/PERFORMANCE-AUTHENTICATED-READ.md");
const docsEs = read("docs/PERFORMANCE-AUTHENTICATED-READ.es.md");

assert(packageJson.scripts?.["test:performance-authenticated-read"] === "tsx tests/performance-authenticated-read-baseline.ts", "package script must expose the authenticated read baseline");
assert(packageJson.scripts?.["check:performance-authenticated-read"] === "node scripts/performance-authenticated-read-check.mjs", "package script must expose the authenticated read invariant gate");

for (const evidence of [
  "registerCustomer",
  "createCustomerSession",
  "ensureBootstrapAdmin",
  "createStaffSession",
  "KTRAVEL_SESSION_COOKIE",
  "KTRAVEL_STAFF_SESSION_COOKIE",
  "getBookingRepository().createReservation",
  'method: "GET"',
  'path: "/account"',
  'path: "/account/reservations"',
  'path: "/operator"',
  'path: "/operator/reservations"',
  "operator-reservation-workflow",
  "p50Ms",
  "p95Ms",
  "p99Ms",
  "requestsPerSecond",
  "local disposable application server"
]) assert(test.includes(evidence), `test must preserve: ${evidence}`);

assert(!test.includes('method: "POST"'), "measured authenticated load must remain GET/read-only");
assert(test.includes("const fixture = await prepareFixture()"), "fixture setup must happen before measured scenarios");
assert(test.includes("response.status === 200"), "authenticated reads must fail redirects/sign-in fallbacks instead of accepting them");
assert(test.includes("result.p95Ms > scenario.p95BudgetMs"), "authenticated scenarios must enforce p95 regression budgets");

for (const evidence of [
  "name: Authenticated read performance baseline",
  "mongo:8.0.29",
  "npm run test:e2e:seed",
  "npm run check:performance-authenticated-read",
  "npm run typecheck",
  "npm run build",
  "npm run test:performance-authenticated-read",
  "PERFORMANCE_BASE_URL: http://127.0.0.1:3000",
  "IDENTITY_MODE: mongodb",
  "STAFF_AUTH_MODE: mongodb",
  "BOOKING_MODE: mongodb",
  "OPERATIONS_MODE: mongodb"
]) assert(workflow.includes(evidence), `workflow must preserve: ${evidence}`);
assert(workflow.includes("ktravel_ci_performance_auth_"), "workflow must use a disposable CI-only database");

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("9d-5.2"), `${name} docs must describe authenticated read load`);
  assert(lower.includes("session") || lower.includes("sesión"), `${name} docs must state real persistent session usage`);
  assert(lower.includes("setup") || lower.includes("preparación"), `${name} docs must separate fixture preparation from measured load`);
  assert(lower.includes("read-only") || lower.includes("solo lectura"), `${name} docs must preserve measured read-only boundary`);
  assert(lower.includes("not production slo") || lower.includes("no son slo") || lower.includes("no es un slo"), `${name} docs must preserve the CI-vs-production capacity boundary`);
}

console.log("Authenticated critical read performance invariants passed.");
