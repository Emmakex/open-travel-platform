import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workerAuthSource = await readFile(new URL("../lib/integration-worker-auth.ts", import.meta.url), "utf8");
assert.ok(workerAuthSource.includes("KTRAVEL_INTEGRATION_WORKER_TOKEN"), "worker token must be server-only configuration");
assert.ok(workerAuthSource.includes("token.length >= 32"), "worker token must have a minimum entropy floor");
assert.ok(workerAuthSource.includes('authorization.startsWith("Bearer ")'), "worker auth must use the Authorization Bearer scheme");
assert.ok(workerAuthSource.includes("timingSafeEqual"), "worker token comparison must be timing-safe");
assert.equal(workerAuthSource.includes("NEXT_PUBLIC_"), false, "worker authentication must never use browser-visible environment variables");

const routeSource = await readFile(new URL("../app/api/internal/integrations/process/route.ts", import.meta.url), "utf8");
assert.ok(routeSource.includes("export async function POST"), "scheduler entrypoint must be POST-only");
assert.equal(routeSource.includes("export async function GET"), false, "scheduler entrypoint must not expose GET execution");
assert.ok(routeSource.includes("authenticateIntegrationWorkerRequest(request)"), "scheduler must authenticate before processing");
assert.ok(routeSource.indexOf("authenticateIntegrationWorkerRequest(request)") < routeSource.indexOf("claimIntegrationWorkerRun"), "authentication must happen before worker claim");
assert.ok(routeSource.includes("claimIntegrationWorkerRun({ source: \"scheduler\""), "scheduler must use the durable worker lock");
assert.ok(routeSource.includes("getIntegrationWorkerBatchSize()"), "scheduled batch size must be server-controlled");
assert.ok(routeSource.includes("pruneCompletedIntegrationHistory()"), "scheduled runs must apply completed-history retention");
assert.ok(routeSource.includes('"Cache-Control": "no-store, max-age=0"'), "worker responses must not be cached");
assert.ok(routeSource.includes('"X-Content-Type-Options": "nosniff"'), "worker responses must disable content sniffing");
assert.ok(routeSource.includes('"Retry-After"'), "rate-limited scheduler calls must publish retry guidance");
assert.ok(routeSource.includes("401"), "invalid worker authentication must return unauthorized");
assert.ok(routeSource.includes("429"), "busy/rate-limited worker calls must be bounded");

const operationsSource = await readFile(new URL("../lib/integration-operations.ts", import.meta.url), "utf8");
assert.ok(operationsSource.includes('integrationDeliveryAuditCollectionName = "travel_integration_delivery_audit"'));
assert.ok(operationsSource.includes('integrationWorkerStateCollectionName = "travel_integration_worker_state"'));
assert.ok(operationsSource.includes('integrationRetentionAuditCollectionName = "travel_integration_retention_audit"'));
assert.ok(operationsSource.includes("input.actorRole !== \"admin\""), "dead-letter replay must enforce Admin server-side");
assert.ok(operationsSource.includes('findOne({ id: input.deliveryId, status: "dead-letter" }'), "replay must only claim dead-letter deliveries");
assert.ok(operationsSource.includes("session.withTransaction"), "requeue state and its audit event must commit atomically");
assert.ok(operationsSource.includes('action: "dead_letter_requeued"'), "manual replay must leave a durable audit event");
assert.ok(operationsSource.includes('status: "pending"'), "replayed dead-letter deliveries must return to the pending queue");
assert.ok(operationsSource.includes("attempts: 0"), "replay must start a new bounded retry cycle while preserving prior attempt history");
assert.ok(operationsSource.includes("countDocuments({ status: \"pending\" })"));
assert.ok(operationsSource.includes("countDocuments({ status: \"retrying\" })"));
assert.ok(operationsSource.includes("countDocuments({ status: \"dead-letter\" })"));
assert.ok(operationsSource.includes("24 * 60 * 60 * 1000"), "health success/failure rates must use the documented 24-hour window");
assert.ok(operationsSource.includes("nextAttemptAt: { $lte: now }"), "health must identify due delivery age");
assert.ok(operationsSource.includes("workerLeaseMs = 15 * 60 * 1000"), "worker runs must have a crash-recovery lease");
assert.ok(operationsSource.includes("nextAllowedAt"), "worker state must enforce a durable minimum interval");
assert.ok(operationsSource.includes("INTEGRATION_WORKER_BATCH_SIZE"));
assert.ok(operationsSource.includes("INTEGRATION_WORKER_MIN_INTERVAL_SECONDS"));
assert.ok(operationsSource.includes("INTEGRATION_COMPLETED_RETENTION_DAYS"));
assert.ok(operationsSource.includes('find({ status: "succeeded", succeededAt: { $lte: cutoff } })'), "automatic retention must target completed success history only");
assert.equal(operationsSource.includes('find({ status: "dead-letter", deadLetteredAt: { $lte: cutoff } })'), false, "automatic retention must not purge dead-letter deliveries");
assert.ok(operationsSource.includes("retentionBatchLimit = 1000"), "retention cleanup must be bounded per run");
assert.ok(operationsSource.includes("IntegrationRetentionAuditEvent"), "retention cleanup must leave aggregate audit metadata");

const actionsSource = await readFile(new URL("../app/operator/integrations/actions.ts", import.meta.url), "utf8");
assert.ok(actionsSource.includes("export async function requeueIntegrationDeliveryAction"));
assert.ok(actionsSource.includes("const admin = await requireAdminIdentity()"), "manual replay must require Admin identity");
assert.ok(actionsSource.includes("requeueDeadLetterDelivery"));
assert.ok(actionsSource.includes('claimIntegrationWorkerRun({\n    source: "admin"'), "manual delivery runs must share the durable worker lock");

const integrationsPageSource = await readFile(new URL("../app/operator/integrations/page.tsx", import.meta.url), "utf8");
assert.ok(integrationsPageSource.includes("await requireAdminIdentity()"), "integration health dashboard must remain Admin-only");
assert.ok(integrationsPageSource.includes("getIntegrationHealthMetrics()"));
assert.ok(integrationsPageSource.includes("/api/internal/integrations/process"), "Admin diagnostics must document the scheduler entrypoint");
assert.ok(integrationsPageSource.includes("Worker authentication"));
assert.equal(integrationsPageSource.includes("KTRAVEL_INTEGRATION_WORKER_TOKEN="), false, "Admin UI must never render the worker token value");

for (const relativePath of [
  "../app/operator/integrations/events/[eventId]/page.tsx",
  "../app/operator/integrations/deliveries/[deliveryId]/page.tsx"
]) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  assert.ok(source.includes("await requireAdminIdentity()"), `${relativePath} must remain Admin-only`);
  assert.equal(source.includes("signingSecret"), false, `${relativePath} must not render signing secrets`);
  for (const protectedField of ["documentNumber", "documentExpiry", "residenceAddress", "passportScan", "healthData"]) {
    assert.equal(source.includes(protectedField), false, `${relativePath} must not render protected traveller field ${protectedField}`);
  }
}

const envSource = await readFile(new URL("../.env.example", import.meta.url), "utf8");
for (const variable of [
  "KTRAVEL_INTEGRATION_WORKER_TOKEN=",
  "INTEGRATION_WORKER_BATCH_SIZE=10",
  "INTEGRATION_WORKER_MIN_INTERVAL_SECONDS=60",
  "INTEGRATION_COMPLETED_RETENTION_DAYS=180"
]) {
  assert.ok(envSource.includes(variable), `.env.example must document ${variable}`);
}
assert.equal(envSource.includes("NEXT_PUBLIC_KTRAVEL_INTEGRATION_WORKER_TOKEN"), false, "worker token must never be public");

console.log("Integration worker, replay, observability and retention invariants passed.");
