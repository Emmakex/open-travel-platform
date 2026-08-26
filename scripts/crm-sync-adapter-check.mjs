import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const [types, endpoints, outbox, customerAuth, config, restAdapter, crmSync, contract, env, page, docsEn, docsEs] = await Promise.all([
  source("domain/integrations/types.ts"),
  source("lib/integration-endpoints.ts"),
  source("lib/integration-outbox.ts"),
  source("lib/customer-auth.ts"),
  source("lib/crm-sync-config.ts"),
  source("adapters/rest-crm-sync-adapter.ts"),
  source("lib/crm-sync.ts"),
  source("repositories/crm-sync-adapter.ts"),
  source(".env.example"),
  source("app/operator/integrations/crm/page.tsx"),
  source("docs/CRM-SYNC-ADAPTER.md"),
  source("docs/CRM-SYNC-ADAPTER.es.md")
]);

assert.match(types, /"customer\.created"/, "CRM customer creation event must exist");
assert.match(types, /"customer\.profile\.updated"/, "CRM profile update event must exist");
assert.match(types, /WebhookIntegrationEventType/, "webhook-safe event subset must remain explicit");
assert.doesNotMatch(endpoints, /customer\.created|customer\.profile\.updated/, "generic webhook subscriptions must not expose CRM customer events");

assert.match(config, /CRM_SYNC_MODE/, "CRM sync mode must be explicit");
assert.match(config, /requestedMode === "rest" \? "rest" : "disabled"/, "CRM sync must default fail-safe to disabled");
assert.match(config, /NODE_ENV === "production" && url\.protocol !== "https:"/, "CRM REST targets must require HTTPS in production");
assert.match(config, /REST_CRM_BEARER_TOKEN/, "CRM bearer token must be server configured");
assert.doesNotMatch(config, /NEXT_PUBLIC_CRM|NEXT_PUBLIC_REST_CRM/, "CRM secrets must never use NEXT_PUBLIC variables");

assert.match(outbox, /crmIntegrationDeliveryEndpointId/, "CRM must reuse the durable integration delivery queue");
assert.match(outbox, /deliverCrmIntegrationEvent/, "integration worker must dispatch CRM deliveries");
assert.match(outbox, /shouldQueueCrmIntegrationEvent/, "outbox must opt CRM deliveries in by event type/configuration");
assert.match(outbox, /event\.aggregateType === "customer"/, "CRM-only customer events must retain an explicit orphan-event guard");
assert.match(outbox, /destinationIds\.length === 0/, "dedicated adapter events must not be retained without a destination");
assert.match(outbox, /\) return 0;/, "orphan dedicated-adapter events must exit before persistence");
assert.match(outbox, /integration_delivery_event_endpoint_unique/, "CRM deliveries must inherit event/destination idempotency");
assert.match(outbox, /dead-letter/, "CRM deliveries must inherit dead-letter handling");

assert.match(customerAuth, /type: "customer\.created"/, "customer registration must emit CRM trigger event");
assert.match(customerAuth, /type: "customer\.profile\.updated"/, "profile changes must emit CRM trigger event");
assert.match(customerAuth, /session\.withTransaction/, "customer CRM trigger events must share MongoDB transactions with customer writes");
assert.match(customerAuth, /enqueueIntegrationEvent\(database, session, integrationEvent\)/, "customer writes must enqueue through the durable outbox");

assert.match(restAdapter, /redirect: "error"/, "CRM REST adapter must reject redirects");
assert.match(restAdapter, /cache: "no-store"/, "CRM REST adapter must disable caching");
assert.match(restAdapter, /AbortSignal\.timeout/, "CRM REST adapter must bound request duration");
assert.match(restAdapter, /maxResponseBytes/, "CRM REST adapter must bound response size");
assert.match(restAdapter, /Idempotency-Key/, "CRM upserts must carry idempotency keys");
assert.match(restAdapter, /transientStatuses/, "CRM REST adapter must use bounded transient retries");
assert.match(restAdapter, /v1\/crm\/contacts\/upsert/, "CRM reference adapter must expose contact upsert contract");
assert.match(restAdapter, /v1\/crm\/reservations\/upsert/, "CRM reference adapter must expose reservation upsert contract");

const reservationBodyStart = restAdapter.indexOf("function reservationBody");
const reservationBodyEnd = restAdapter.indexOf("async function postUpsert");
assert.ok(reservationBodyStart >= 0 && reservationBodyEnd > reservationBodyStart, "CRM reservation allowlist boundary must exist");
const reservationBody = restAdapter.slice(reservationBodyStart, reservationBodyEnd);
for (const forbidden of [
  "totalPrice",
  "unitPrice",
  "currency",
  "paymentTerms",
  "supplierCost",
  "supplierReference",
  "travellers",
  "dateOfBirth",
  "nationality",
  "documentNumber",
  "passport",
  "medical",
  "inventorySpaces",
  "inventoryUnits"
]) {
  assert.ok(!reservationBody.includes(forbidden), `CRM reservation payload must exclude ${forbidden}`);
}

assert.match(crmSync, /travel_crm_sync_links/, "CRM external references must live in a separate link collection");
assert.match(crmSync, /travel_crm_sync_audit/, "CRM synchronization must have dedicated audit metadata");
assert.match(crmSync, /otp-crm:\$\{input\.event\.id\}:contact/, "contact upserts must derive stable event idempotency keys");
assert.match(crmSync, /otp-crm:\$\{input\.event\.id\}:reservation/, "reservation upserts must derive stable event idempotency keys");

const auditTypeStart = crmSync.indexOf("type CrmSyncAuditEvent");
const auditTypeEnd = crmSync.indexOf("function crmError");
assert.ok(auditTypeStart >= 0 && auditTypeEnd > auditTypeStart, "CRM audit type boundary must exist");
const auditType = crmSync.slice(auditTypeStart, auditTypeEnd);
for (const forbidden of ["email", "phone", "firstName", "lastName", "rawBody", "bearerToken", "totalPrice", "documentNumber"]) {
  assert.ok(!auditType.includes(forbidden), `CRM audit metadata must exclude ${forbidden}`);
}

assert.match(contract, /upsertContact/, "provider-neutral CRM interface must support contact upsert");
assert.match(contract, /upsertReservation/, "provider-neutral CRM interface must support reservation upsert");
assert.doesNotMatch(contract, /totalPrice|paymentTerms|travellers|supplierCost|documentNumber/, "provider-neutral CRM contract must exclude financial/protected/internal fields");

for (const variable of [
  "CRM_SYNC_MODE",
  "REST_CRM_BASE_URL",
  "REST_CRM_BEARER_TOKEN",
  "REST_CRM_TIMEOUT_MS",
  "REST_CRM_MAX_RESPONSE_BYTES"
]) {
  assert.ok(env.includes(variable), `.env.example must document ${variable}`);
}

assert.match(page, /requireAdminIdentity/, "CRM diagnostics must be Admin-only");
assert.match(page, /Contact names, email, phone, raw HTTP bodies and bearer credentials are not stored/, "CRM Admin UI must communicate audit privacy");
assert.match(docsEn, /downstream-only/i, "English CRM docs must document downstream-only authority");
assert.match(docsEn, /does \*\*not\*\* create a second background queue/i, "English CRM docs must document one-queue architecture");
assert.match(docsEs, /solo downstream/i, "Spanish CRM docs must document downstream-only authority");
assert.match(docsEs, /No.*crea una segunda cola/is, "Spanish CRM docs must document one-queue architecture");

console.log("CRM synchronization adapter invariants passed.");
