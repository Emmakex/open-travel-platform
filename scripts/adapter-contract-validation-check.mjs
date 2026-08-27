import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Adapter contract validation invariant failed: ${message}`);
};

const packageJson = JSON.parse(read("package.json"));
const test = read("tests/rest-adapter-contracts.ts");
const booking = read("adapters/rest-booking-repository.ts");
const supplier = read("adapters/rest-supplier-fulfilment-adapter.ts");
const crm = read("adapters/rest-crm-sync-adapter.ts");
const erp = read("adapters/rest-erp-accounting-adapter.ts");
const supplierSync = read("lib/supplier-fulfilment-sync.ts");
const workflow = read(".github/workflows/ci.yml");

assert(
  packageJson.scripts?.["test:rest-adapter-contracts"] === "tsx tests/rest-adapter-contracts.ts",
  "package script must execute the real local HTTP adapter contract suite"
);
assert(
  packageJson.scripts?.["check:adapter-contract-validation"] === "node scripts/adapter-contract-validation-check.mjs",
  "static adapter contract invariant must remain exposed"
);
assert(packageJson.scripts?.verify?.includes("check:adapter-contract-validation"), "adapter contract invariant must remain part of verify");

for (const [name, source] of [
  ["booking", booking],
  ["supplier", supplier],
  ["CRM", crm],
  ["ERP", erp]
]) {
  assert(source.includes('content-type') && source.includes('application/json'), `${name} adapter must fail closed on non-JSON responses`);
  assert(source.includes('redirect: "error"'), `${name} adapter must reject redirects`);
  assert(source.includes("AbortSignal.timeout"), `${name} adapter must retain bounded timeout handling`);
  assert(source.includes("maximumAttempts = 2") || source.includes("maxAttempts = 2"), `${name} adapter retries must remain bounded to two attempts`);
  assert(source.includes("Idempotency-Key") || name === "booking", `${name} adapter must retain idempotency headers for mutations`);
}

assert(booking.includes("REST_BOOKING_SCOPE_MISMATCH"), "booking adapter must keep ownership/trip/departure scope validation");
assert(booking.includes("REST_BOOKING_RESPONSE_TOO_LARGE"), "booking adapter must retain streamed response-size protection");
assert(supplier.includes("safeRequestBody"), "supplier adapter must retain explicit payload allowlisting");
assert(!supplier.match(/safeRequestBody[\s\S]*supplierCost[\s\S]*return parseSupplierAdapterResult/), "supplier outbound body must not add supplier cost");
assert(crm.includes("contactBody") && crm.includes("reservationBody"), "CRM adapter must retain explicit contact/reservation allowlists");
assert(!crm.includes("snapshot.travellers") && !crm.includes("snapshot.totalPrice"), "CRM generic adapter must not serialize traveller arrays or financial totals");
assert(erp.includes("movementBody"), "ERP adapter must retain explicit movement allowlist");
assert(!erp.includes("snapshot.customerEmail") && !erp.includes("snapshot.travellers"), "ERP adapter must not serialize customer PII or traveller data");
assert(
  supplierSync.includes('operation === "request" && result.status !== "requested"') &&
  supplierSync.includes('operation === "cancel" && result.status !== "cancelled"'),
  "supplier request/cancel results must remain constrained before local application"
);

assert(test.includes('http.createServer'), "contract suite must use a real local HTTP server rather than mocking fetch");
assert(test.includes('server.listen(0, "127.0.0.1"'), "contract suite must bind only to localhost on an ephemeral port");
assert(test.includes("Booking transient failure must retry exactly once"), "contract suite must verify booking retry count");
assert(test.includes("Booking retry must reuse the same idempotency key"), "contract suite must verify booking idempotency across retry");
assert(test.includes("Booking 400 response must not be retried"), "contract suite must verify non-transient booking errors are not retried");
assert(test.includes("REST_BOOKING_SCOPE_MISMATCH"), "contract suite must verify booking scope mismatch rejection");
assert(test.includes("REST_BOOKING_RESPONSE_TOO_LARGE"), "contract suite must verify bounded booking responses");
assert(test.includes("Supplier transient failure must retry exactly once"), "contract suite must verify supplier retry behavior");
assert(test.includes('"supplierCost" in supplierFulfilment'), "contract suite must verify supplier costs are excluded");
assert(test.includes("CRM transient failure must retry exactly once"), "contract suite must verify CRM retry behavior");
assert(test.includes('"travellers" in crmReservationBody.reservation'), "contract suite must verify CRM traveller arrays are excluded");
assert(test.includes("ERP transient failure must retry exactly once"), "contract suite must verify ERP retry behavior");
assert(test.includes("ERP payload must preserve authoritative amount exactly"), "contract suite must verify ERP amount fidelity");
assert(test.includes('"customerEmail" in erpBody.movement'), "contract suite must verify ERP customer PII is excluded");
assert(test.includes("CRM_SYNC_CONTRACT_INVALID") && test.includes("ERP_ACCOUNTING_CONTRACT_INVALID") && test.includes("SUPPLIER_ADAPTER_CONTRACT_INVALID"), "contract suite must exercise fail-closed MIME/contract handling across business adapters");

assert(workflow.includes("REST adapter contract integration test"), "blocking CI must run the real REST adapter contract suite");
assert(workflow.includes("npm run test:rest-adapter-contracts"), "CI must execute the adapter contract test script");
assert(workflow.includes("Browser E2E (non-blocking)") && workflow.includes("continue-on-error: true"), "browser E2E must remain informational/non-blocking by policy");

console.log("Local HTTP REST adapter contract validation invariants passed.");
