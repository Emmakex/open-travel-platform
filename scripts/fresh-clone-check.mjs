import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Fresh-clone invariant failed: ${message}`);
};

const packageJson = JSON.parse(read("package.json"));
const demoEnv = read(".env.demo.example");
const setup = read("scripts/setup-demo.mjs");
const workflow = read(".github/workflows/fresh-clone-demo.yml");
const docs = read("docs/GETTING-STARTED.md");
const docsEs = read("docs/GETTING-STARTED.es.md");

assert(packageJson.engines?.node === ">=24 <25", "fresh-clone contract must stay on Node.js 24 LTS");
assert(packageJson.scripts?.["setup:demo"] === "node scripts/setup-demo.mjs", "package must expose setup:demo");
assert(packageJson.scripts?.["check:fresh-clone"] === "node scripts/fresh-clone-check.mjs", "package must expose the fresh-clone invariant gate");

for (const evidence of [
  "KTRAVEL_PUBLIC_URL=http://localhost:3000",
  "KTRAVEL_DEPLOYMENT_PROFILE=demo",
  "NEXT_PUBLIC_DATA_MODE=demo",
  "TRAVEL_DATA_MODE=demo",
  "IDENTITY_MODE=demo",
  "STAFF_AUTH_MODE=demo",
  "BOOKING_MODE=demo",
  "OPERATIONS_MODE=demo",
  "DEMO_IDENTITY_ENABLED=true",
  "DEMO_BOOKING_ENABLED=true",
  "DEMO_OPERATIONS_ENABLED=true",
  "PAYMENT_LEDGER_MODE=disabled",
  "SUPPLIER_FULFILMENT_ADAPTER_MODE=disabled",
  "CRM_SYNC_MODE=disabled",
  "ERP_ACCOUNTING_MODE=disabled",
  "FAILURE_TRANSPORT_MODE=disabled"
]) assert(demoEnv.includes(evidence), `demo profile must preserve: ${evidence}`);

for (const forbidden of [
  "MONGODB_URI=",
  "SMTP_PASSWORD=",
  "KTRAVEL_BOOTSTRAP_ADMIN_PASSWORD=",
  "PAYMENT_SECRETS_KEY=",
  "TRAVELLER_DATA_KEY=",
  "INTEGRATION_SECRETS_KEY=",
  "REST_BOOKING_BEARER_TOKEN=",
  "KTRAVEL_INTEGRATION_WORKER_TOKEN="
]) assert(!demoEnv.includes(forbidden), `demo profile must not require or suggest secret/infrastructure field: ${forbidden}`);

assert(setup.includes('.env.demo.example'), "setup must copy the dedicated demo profile");
assert(setup.includes('.env.local'), "setup must target .env.local");
assert(setup.includes('process.argv.includes("--force")'), "setup must support an explicit force override");
assert(setup.includes("refusing to overwrite"), "setup must refuse destructive overwrite by default");

for (const evidence of [
  "name: Fresh clone demo",
  "node-version: 24",
  "npm ci --no-fund",
  "npm run check:fresh-clone",
  "npm run setup:demo",
  "npm run typecheck",
  "npm run build",
  "npm start",
  "/api/health/live",
  "/operator/sign-in",
  "/destinations",
  "/trips"
]) assert(workflow.includes(evidence), `workflow must preserve: ${evidence}`);
assert(!workflow.includes("MONGODB_URI"), "fresh-clone workflow must prove MongoDB is not required");

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("node.js 24"), `${name} guide must state Node.js 24`);
  assert(text.includes("npm ci"), `${name} guide must use reproducible npm ci installation`);
  assert(text.includes("npm run setup:demo"), `${name} guide must expose setup:demo`);
  assert(lower.includes("mongodb"), `${name} guide must explain the MongoDB boundary`);
  assert(lower.includes("not a production") || lower.includes("no una configuración productiva"), `${name} guide must distinguish demo from production`);
  assert(lower.includes("provider-neutral"), `${name} guide must preserve provider-neutral scope`);
}

console.log("Fresh-clone demo invariants passed.");
