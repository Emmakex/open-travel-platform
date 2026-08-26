import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const [
  types,
  endpoints,
  outbox,
  paymentRepository,
  config,
  restAdapter,
  sync,
  contract,
  crmSync,
  env,
  layout,
  page,
  docsEn,
  docsEs
] = await Promise.all([
  source("domain/integrations/types.ts"),
  source("lib/integration-endpoints.ts"),
  source("lib/integration-outbox.ts"),
  source("adapters/mongo-payment-repository.ts"),
  source("lib/erp-accounting-config.ts"),
  source("adapters/rest-erp-accounting-adapter.ts"),
  source("lib/erp-accounting-sync.ts"),
  source("repositories/erp-accounting-adapter.ts"),
  source("lib/crm-sync.ts"),
  source(".env.example"),
  source("app/operator/integrations/layout.tsx"),
  source("app/operator/integrations/erp/page.tsx"),
  source("docs/ERP-ACCOUNTING-ADAPTER.md"),
  source("docs/ERP-ACCOUNTING-ADAPTER.es.md")
]);

assert.match(types, /"payment\.transaction\.succeeded"/, "ERP succeeded-payment event must exist");
assert.match(types, /ErpAccountingIntegrationEventType/, "ERP accounting event subset must remain explicit");
assert.match(types, /"payment-transaction"/, "integration aggregates must support payment transactions");
assert.doesNotMatch(endpoints, /payment\.transaction\.succeeded/, "generic webhook subscriptions must not expose ERP financial events");
assert.doesNotMatch(crmSync, /payment\.transaction\.succeeded/, "CRM dispatcher must not consume ERP financial events");

assert.match(config, /ERP_ACCOUNTING_MODE/, "ERP/accounting mode must be explicit");
assert.match(config, /requestedMode === "rest" \? "rest" : "disabled"/, "ERP/accounting sync must default fail-safe to disabled");
assert.match(config, /NODE_ENV === "production" && url\.protocol !== "https:"/, "ERP/accounting REST targets must require HTTPS in production");
assert.match(config, /REST_ERP_ACCOUNTING_BEARER_TOKEN/, "ERP/accounting bearer token must be server configured");
assert.doesNotMatch(config, /NEXT_PUBLIC_ERP|NEXT_PUBLIC_REST_ERP/, "ERP/accounting secrets must never use NEXT_PUBLIC variables");

assert.match(outbox, /erpAccountingDeliveryEndpointId/, "ERP/accounting must reuse the durable integration delivery queue");
assert.match(outbox, /deliverErpAccountingEvent/, "integration worker must dispatch ERP/accounting deliveries");
assert.match(outbox, /shouldQueueErpAccountingEvent/, "outbox must opt ERP deliveries in by event type/configuration");
assert.match(outbox, /event\.aggregateType === "payment-transaction"/, "disabled ERP mode must not retain ERP-only orphan events");
assert.match(outbox, /destinationIds\.length === 0/, "ERP orphan guard must require zero configured destinations");
assert.match(outbox, /integration_delivery_event_endpoint_unique/, "ERP deliveries must inherit event/destination idempotency");
assert.match(outbox, /dead-letter/, "ERP deliveries must inherit dead-letter handling");

assert.match(paymentRepository, /type: "payment\.transaction\.succeeded"/, "succeeded ledger writes must emit the ERP trigger event");
assert.match(paymentRepository, /id: `intevt-payment-\$\{transaction\.id\}-succeeded`/, "ERP event IDs must be deterministic per ledger transaction");
assert.match(paymentRepository, /session\.withTransaction/, "payment writes must use MongoDB transactions");
assert.match(paymentRepository, /payments\.insertOne\(transaction, \{ session \}\)/, "new ledger movements must be inserted inside the transaction");
assert.match(paymentRepository, /enqueueIntegrationEvent\(database, session, succeededPaymentIntegrationEvent\(transaction\)\)/, "new succeeded movements must enqueue in the same transaction");
assert.match(paymentRepository, /enqueueIntegrationEvent\(database, session, succeededPaymentIntegrationEvent\(update\)\)/, "pending-to-succeeded movements must enqueue in the same transaction");

assert.match(restAdapter, /redirect: "error"/, "ERP/accounting REST adapter must reject redirects");
assert.match(restAdapter, /cache: "no-store"/, "ERP/accounting REST adapter must disable caching");
assert.match(restAdapter, /AbortSignal\.timeout/, "ERP/accounting REST adapter must bound request duration");
assert.match(restAdapter, /maxResponseBytes/, "ERP/accounting REST adapter must bound response size");
assert.match(restAdapter, /Idempotency-Key/, "ERP/accounting upserts must carry idempotency keys");
assert.match(restAdapter, /transientStatuses/, "ERP/accounting REST adapter must use bounded transient retries");
assert.match(restAdapter, /v1\/accounting\/movements\/upsert/, "ERP/accounting REST v1 movement endpoint must remain explicit");
assert.match(restAdapter, /amount: snapshot\.amount/, "accounting movement must preserve exact local amount");
assert.match(restAdapter, /currency: snapshot\.currency/, "accounting movement must preserve exact local currency");

const movementBodyStart = restAdapter.indexOf("function movementBody");
const movementBodyEnd = restAdapter.indexOf("async function postMovement");
assert.ok(movementBodyStart >= 0 && movementBodyEnd > movementBodyStart, "ERP movement allowlist boundary must exist");
const movementBody = restAdapter.slice(movementBodyStart, movementBodyEnd);
for (const forbidden of [
  "password",
  "bearerToken",
  "rawBody",
  "travellers",
  "dateOfBirth",
  "nationality",
  "documentNumber",
  "passport",
  "medical",
  "supplierCost",
  "supplierReference",
  "inventorySpaces",
  "inventoryUnits",
  "cardNumber",
  "pan",
  "cvv"
]) {
  assert.ok(!movementBody.includes(forbidden), `ERP/accounting payload must exclude ${forbidden}`);
}

assert.match(sync, /travel_erp_accounting_links/, "ERP external references must live in a separate link collection");
assert.match(sync, /travel_erp_accounting_audit/, "ERP synchronization must have dedicated audit metadata");
assert.match(sync, /transaction\.status !== "succeeded"/, "dispatcher must reject non-final ledger movements");
assert.match(sync, /otp-erp:\$\{input\.event\.id\}:movement/, "ERP movement upserts must derive stable event idempotency keys");

const auditTypeStart = sync.indexOf("type ErpAccountingAuditEvent");
const auditTypeEnd = sync.indexOf("function accountingError");
assert.ok(auditTypeStart >= 0 && auditTypeEnd > auditTypeStart, "ERP audit type boundary must exist");
const auditType = sync.slice(auditTypeStart, auditTypeEnd);
for (const forbidden of ["amount", "currency", "email", "phone", "firstName", "lastName", "rawBody", "bearerToken", "providerReference", "documentNumber"]) {
  assert.ok(!auditType.includes(forbidden), `ERP audit metadata must exclude ${forbidden}`);
}

assert.match(contract, /upsertMovement/, "provider-neutral ERP interface must support movement upsert");
assert.match(contract, /amount: number/, "provider-neutral accounting contract must include movement amount");
assert.match(contract, /currency: string/, "provider-neutral accounting contract must include movement currency");
assert.doesNotMatch(contract, /travellers|supplierCost|documentNumber|password|cardNumber|cvv/, "provider-neutral ERP contract must exclude protected/internal credentials and traveller data");

for (const variable of [
  "ERP_ACCOUNTING_MODE",
  "REST_ERP_ACCOUNTING_BASE_URL",
  "REST_ERP_ACCOUNTING_BEARER_TOKEN",
  "REST_ERP_ACCOUNTING_TIMEOUT_MS",
  "REST_ERP_ACCOUNTING_MAX_RESPONSE_BYTES"
]) {
  assert.ok(env.includes(variable), `.env.example must document ${variable}`);
}

assert.match(layout, /\/operator\/integrations\/erp/, "Integrations navigation must expose the Admin ERP diagnostics page");
assert.match(page, /requireAdminIdentity/, "ERP/accounting diagnostics must be Admin-only");
assert.match(page, /Only succeeded payment and refund movements/, "ERP Admin UI must state final-movement authority");
assert.match(page, /Financial amounts, currency, provider references, customer PII, raw HTTP bodies and bearer credentials are not stored/, "ERP Admin UI must communicate audit minimization");
assert.match(docsEn, /accounting-ready payment ledger movements/i, "English ERP docs must document movement-only scope");
assert.match(docsEn, /same MongoDB transaction/i, "English ERP docs must document transactional outbox semantics");
assert.match(docsEn, /not jurisdiction-specific legal invoices/i, "English ERP docs must not overclaim fiscal invoicing");
assert.match(docsEs, /movimientos del ledger preparados para contabilidad/i, "Spanish ERP docs must document movement-only scope");
assert.match(docsEs, /misma transacción MongoDB/i, "Spanish ERP docs must document transactional outbox semantics");
assert.match(docsEs, /no facturas legales específicas de una jurisdicción/i, "Spanish ERP docs must not overclaim fiscal invoicing");

console.log("ERP/accounting adapter invariants passed.");
