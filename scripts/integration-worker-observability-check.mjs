import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  authorizeIntegrationWorkerRequest,
  isIntegrationWorkerAuthConfigured
} from "../lib/integration-worker-auth.ts";

const originalSecret = process.env.INTEGRATION_WORKER_SECRET;
try {
  delete process.env.INTEGRATION_WORKER_SECRET;
  assert.equal(isIntegrationWorkerAuthConfigured(), false, "worker auth must fail closed when no secret is configured");
  assert.equal(authorizeIntegrationWorkerRequest(new Request("https://example.test/internal", { method: "POST" })).status, 503);

  process.env.INTEGRATION_WORKER_SECRET = "x".repeat(31);
  assert.equal(isIntegrationWorkerAuthConfigured(), false, "worker secrets shorter than 32 characters must be rejected");

  const workerSecret = "worker-secret-0123456789abcdef-0123456789";
  process.env.INTEGRATION_WORKER_SECRET = workerSecret;
  assert.equal(isIntegrationWorkerAuthConfigured(), true);
  assert.equal(authorizeIntegrationWorkerRequest(new Request("https://example.test/internal", { method: "POST" })).status, 401);
  assert.equal(authorizeIntegrationWorkerRequest(new Request("https://example.test/internal", {
    method: "POST",
    headers: { Authorization: "Bearer wrong-secret" }
  })).status, 401);
  assert.equal(authorizeIntegrationWorkerRequest(new Request("https://example.test/internal", {
    method: "POST",
    headers: { Authorization: `Bearer ${workerSecret}` }
  })).ok, true);
} finally {
  if (originalSecret === undefined) delete process.env.INTEGRATION_WORKER_SECRET;
  else process.env.INTEGRATION_WORKER_SECRET = originalSecret;
}

const authSource = await readFile(new URL("../lib/integration-worker-auth.ts", import.meta.url), "utf8");
assert.ok(authSource.includes("INTEGRATION_WORKER_SECRET"));
assert.ok(authSource.includes("secret.length >= 32"), "worker secret must have a server-side minimum length");
assert.ok(authSource.includes("timingSafeEqual"), "worker token comparison must be timing-safe");
assert.ok(authSource.includes('request.headers.get("authorization")'), "worker authentication must use a request header");
assert.equal(authSource.includes("searchParams"), false, "worker secrets must never be accepted from URL query parameters");

const routeSource = await readFile(new URL("../app/api/internal/integrations/process/route.ts", import.meta.url), "utf8");
assert.ok(routeSource.includes("export async function POST(request: Request)"), "scheduler entry point must be POST-only");
assert.equal(routeSource.includes("export async function GET"), false, "scheduler processor must not expose GET");
assert.ok(routeSource.includes("authorizeIntegrationWorkerRequest(request)"));
assert.ok(routeSource.indexOf("authorizeIntegrationWorkerRequest(request)") < routeSource.indexOf("processIntegrationDeliveries"), "authorization must happen before delivery processing");
assert.ok(routeSource.includes("parsed < 1 || parsed > 100"), "scheduler batch size must remain bounded to 1–100");
assert.ok(routeSource.includes('"Cache-Control": "no-store, max-age=0"'));
assert.ok(routeSource.includes('"X-Content-Type-Options": "nosniff"'));
assert.ok(routeSource.includes("pruneCompletedIntegrationHistory({ limit: 500 })"), "scheduled runs should execute bounded retention cleanup");

const outboxSource = await readFile(new URL("../lib/integration-outbox.ts", import.meta.url), "utf8");
assert.ok(outboxSource.includes("getIntegrationQueueHealth"));
assert.ok(outboxSource.includes("oldestDueAt"));
assert.ok(outboxSource.includes("successRate"));
assert.ok(outboxSource.includes("requeueDeadLetterDelivery"));
assert.ok(outboxSource.includes('{ id: input.deliveryId, status: "dead-letter" }'), "replay must only target dead-letter deliveries");
assert.ok(outboxSource.includes("reason.length < 10 || reason.length > 500"), "replay must require an operational reason");
assert.ok(outboxSource.includes("integrationReplayAuditCollectionName"), "replay must have durable audit history");
assert.ok(outboxSource.includes("session.withTransaction"), "requeue and replay audit must share a MongoDB transaction");
assert.ok(outboxSource.includes('status: "retrying"'));
assert.ok(outboxSource.includes("attempts: 0"), "requeue must start a fresh bounded retry cycle while preserving historical attempts separately");
assert.ok(outboxSource.includes("INTEGRATION_HISTORY_RETENTION_DAYS"));
assert.ok(outboxSource.includes("Math.max(30, Math.min(configured, 730))"), "retention must be bounded");
const pruneSection = outboxSource.slice(outboxSource.indexOf("export async function pruneCompletedIntegrationHistory"));
assert.ok(pruneSection.includes('{ status: "succeeded", succeededAt: { $lte: cutoff } }'), "automatic retention may prune only succeeded deliveries");
assert.equal(pruneSection.includes('{ status: "dead-letter"'), false, "dead-letter deliveries must never be automatically pruned");

const pageSource = await readFile(new URL("../app/operator/integrations/page.tsx", import.meta.url), "utf8");
assert.ok(pageSource.includes("await requireAdminIdentity()"));
assert.ok(pageSource.includes("getIntegrationQueueHealth()"));
assert.ok(pageSource.includes("isIntegrationWorkerAuthConfigured()"));
assert.ok(pageSource.includes("/api/internal/integrations/process?limit=25"));
assert.ok(pageSource.includes("dead-letter is never auto-pruned"));

const detailSource = await readFile(new URL("../app/operator/integrations/deliveries/[id]/page.tsx", import.meta.url), "utf8");
assert.ok(detailSource.includes("await requireAdminIdentity()"), "delivery diagnostics must remain Admin-only");
assert.ok(detailSource.includes("getIntegrationDeliveryDetail"));
assert.ok(detailSource.includes('detail.delivery.status === "dead-letter"'), "replay controls must only render for dead-letter deliveries");
assert.ok(detailSource.includes("requeueDeadLetterDeliveryAction"));
assert.equal(detailSource.includes("getIntegrationEndpointRuntime"), false, "diagnostics must not load decrypted endpoint signing secrets");

const actionSource = await readFile(new URL("../app/operator/integrations/actions.ts", import.meta.url), "utf8");
assert.ok(actionSource.includes("requeueDeadLetterDeliveryAction"));
assert.ok(actionSource.includes("const admin = await requireAdminIdentity()"));
assert.ok(actionSource.includes("actorIdentityId: admin.id"));
assert.ok(actionSource.includes("actorRole: admin.role"));

const envSource = await readFile(new URL("../.env.example", import.meta.url), "utf8");
assert.ok(envSource.includes("INTEGRATION_WORKER_SECRET="));
assert.ok(envSource.includes("INTEGRATION_HISTORY_RETENTION_DAYS=180"));
assert.equal(envSource.includes("NEXT_PUBLIC_INTEGRATION_WORKER_SECRET"), false);

console.log("Integration worker authentication, replay, retention and observability invariants passed.");
