import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const [
  contract,
  config,
  restAdapter,
  sync,
  actions,
  panel,
  env,
  docsEn,
  docsEs
] = await Promise.all([
  source("repositories/supplier-fulfilment-adapter.ts"),
  source("lib/supplier-fulfilment-adapter-config.ts"),
  source("adapters/rest-supplier-fulfilment-adapter.ts"),
  source("lib/supplier-fulfilment-sync.ts"),
  source("app/operator/fulfilment/actions.ts"),
  source("components/operator/supplier-fulfilment-panel.tsx"),
  source(".env.example"),
  source("docs/SUPPLIER-FULFILMENT-ADAPTER.md"),
  source("docs/SUPPLIER-FULFILMENT-ADAPTER.es.md")
]);

assert.match(contract, /"request"\s*\|\s*"status"\s*\|\s*"cancel"/, "adapter contract must expose request/status/cancel operations");
assert.match(contract, /Exclude<SupplierFulfilmentStatus, "not-requested">/, "external status must not allow the local pre-request state");

assert.match(config, /SUPPLIER_FULFILMENT_ADAPTER_MODE/, "supplier adapter mode must be explicit");
assert.match(config, /requestedMode === "rest" \? "rest" : "disabled"/, "supplier adapter must default fail-safe to disabled");
assert.match(config, /NODE_ENV === "production" && url\.protocol !== "https:"/, "production REST supplier targets must require HTTPS");
assert.match(config, /REST_SUPPLIER_FULFILMENT_BEARER_TOKEN/, "supplier REST token must be server configured");
assert.doesNotMatch(config, /NEXT_PUBLIC_REST_SUPPLIER|NEXT_PUBLIC_SUPPLIER_FULFILMENT/, "supplier adapter secrets must not use NEXT_PUBLIC variables");

assert.match(restAdapter, /redirect: "error"/, "supplier REST adapter must reject redirects");
assert.match(restAdapter, /cache: "no-store"/, "supplier REST adapter must disable fetch caching");
assert.match(restAdapter, /AbortSignal\.timeout/, "supplier REST adapter must bound request duration");
assert.match(restAdapter, /maxResponseBytes/, "supplier REST adapter must bound response size");
assert.match(restAdapter, /supplierFulfilmentContractHeader/, "supplier REST adapter must version its contract");
assert.match(restAdapter, /Idempotency-Key/, "supplier mutating operations must support idempotency keys");
assert.match(restAdapter, /transientStatuses/, "supplier REST adapter must use bounded transient retries");
assert.match(restAdapter, /supplierName: item\.supplierName/, "supplier request may include the assigned supplier name");
assert.match(restAdapter, /deadline: item\.deadline/, "supplier request may include the operational deadline");

const requestBodyStart = restAdapter.indexOf("function safeRequestBody");
const requestBodyEnd = restAdapter.indexOf("async function executeRestCommand");
assert.ok(requestBodyStart >= 0 && requestBodyEnd > requestBodyStart, "safe supplier request body boundary must exist");
const requestBody = restAdapter.slice(requestBodyStart, requestBodyEnd);
for (const forbidden of [
  "supplierCost",
  "supplierCurrency",
  "customerCurrency",
  "totalPrice",
  "paymentTerms",
  "travellers",
  "dateOfBirth",
  "nationality",
  "documentNumber",
  "passport",
  "medical"
]) {
  assert.ok(!requestBody.includes(forbidden), `supplier request body must exclude ${forbidden}`);
}

assert.match(sync, /travel_supplier_fulfilment_adapter_audit/, "external supplier operations must have separate persistent audit");
assert.match(sync, /createHash\("sha256"\)/, "supplier mutations must derive deterministic idempotency keys");
assert.match(sync, /supplierCost: item\.supplierCost/, "external responses must preserve local supplier cost");
assert.match(sync, /supplierCurrency: item\.supplierCurrency/, "external responses must preserve local supplier cost currency");
assert.match(sync, /saveSupplierFulfilment\(/, "external responses must re-enter the existing local fulfilment boundary");
assert.match(sync, /SUPPLIER_ADAPTER_STATUS_CONFLICT/, "external status conflicts must fail without forcing a local transition");

const auditInsert = sync.indexOf("await audit.insertOne(receivedAudit)");
const localApply = sync.indexOf("const saved = await saveSupplierFulfilment");
assert.ok(auditInsert >= 0 && localApply > auditInsert, "external supplier response audit must persist before local application");

assert.match(actions, /requireStaffCapability\("suppliers"\)/, "supplier adapter actions must require suppliers capability");
assert.match(actions, /performSupplierAdapterOperation/, "Operator action must use the audited synchronization boundary");

assert.match(panel, /Send supplier request/, "Operator UI must expose explicit external request action");
assert.match(panel, /Sync supplier status/, "Operator UI must expose explicit status synchronization");
assert.match(panel, /Cancel with supplier/, "Operator UI must expose explicit supplier cancellation");
assert.match(panel, /Prices, payment ledger and protected traveller data are excluded/, "Operator UI must communicate the external data boundary");

for (const variable of [
  "SUPPLIER_FULFILMENT_ADAPTER_MODE",
  "REST_SUPPLIER_FULFILMENT_BASE_URL",
  "REST_SUPPLIER_FULFILMENT_BEARER_TOKEN",
  "REST_SUPPLIER_FULFILMENT_TIMEOUT_MS",
  "REST_SUPPLIER_FULFILMENT_MAX_RESPONSE_BYTES"
]) {
  assert.ok(env.includes(variable), `.env.example must document ${variable}`);
}

assert.match(docsEn, /does \*\*not\*\* own customer prices, payment accounting, supplier costs, inventory, traveller records or protected post-purchase data/i, "English docs must state supplier adapter non-ownership boundaries");
assert.match(docsEn, /persisted.*before local application|persisted.*before.*applied locally/is, "English docs must document audit-before-apply semantics");
assert.match(docsEs, /No.*controla precios de cliente, contabilidad de pagos, costes del proveedor, inventario, viajeros ni datos post-compra protegidos/is, "Spanish docs must state supplier adapter non-ownership boundaries");

console.log("Supplier fulfilment adapter invariant passed.");
