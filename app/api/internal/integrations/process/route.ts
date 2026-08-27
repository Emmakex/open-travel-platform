import { NextResponse } from "next/server";
import {
  claimIntegrationWorkerRun,
  finishIntegrationWorkerRun,
  getIntegrationHealthMetrics,
  getIntegrationWorkerBatchSize,
  getIntegrationWorkerMinimumIntervalSeconds,
  pruneCompletedIntegrationHistory,
  releaseIntegrationWorkerLease
} from "@/lib/integration-operations";
import { processIntegrationDeliveries } from "@/lib/integration-outbox";
import {
  authenticateIntegrationWorkerRequest,
  isIntegrationWorkerAuthConfigured
} from "@/lib/integration-worker-auth";
import {
  correlationHeaders,
  emitOperationalLog,
  getRequestCorrelationId
} from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(
  body: Record<string, unknown>,
  correlationId: string,
  status = 200,
  headers?: HeadersInit
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      ...correlationHeaders(correlationId),
      ...headers
    }
  });
}

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  const startedAt = Date.now();

  if (!isIntegrationWorkerAuthConfigured()) {
    emitOperationalLog({
      level: "warn",
      event: "integration.worker.unavailable",
      component: "integration-worker",
      correlationId,
      fields: { reason: "not-configured" }
    });
    return json({ ok: false, error: "worker-not-configured" }, correlationId, 503);
  }
  if (!authenticateIntegrationWorkerRequest(request)) {
    emitOperationalLog({
      level: "warn",
      event: "integration.worker.rejected",
      component: "integration-worker",
      correlationId,
      fields: { reason: "unauthorized" }
    });
    return json({ ok: false, error: "unauthorized" }, correlationId, 401, {
      "WWW-Authenticate": "Bearer realm=\"integration-worker\""
    });
  }

  const minimumIntervalSeconds = getIntegrationWorkerMinimumIntervalSeconds();
  const claim = await claimIntegrationWorkerRun({ source: "scheduler", minimumIntervalSeconds });
  if (!claim.claimed) {
    const retrySeconds = claim.retryAt
      ? Math.max(1, Math.ceil((Date.parse(claim.retryAt) - Date.now()) / 1000))
      : minimumIntervalSeconds;
    emitOperationalLog({
      level: "info",
      event: "integration.worker.deferred",
      component: "integration-worker",
      correlationId,
      fields: { reason: "busy-or-rate-limited", retrySeconds }
    });
    return json(
      { ok: false, error: "worker-busy-or-rate-limited", retryAfterSeconds: retrySeconds },
      correlationId,
      429,
      { "Retry-After": String(retrySeconds) }
    );
  }

  try {
    const limit = getIntegrationWorkerBatchSize();
    const result = await processIntegrationDeliveries({ limit });
    const retention = await pruneCompletedIntegrationHistory();
    await finishIntegrationWorkerRun({ result });
    const health = await getIntegrationHealthMetrics();
    emitOperationalLog({
      level: "info",
      event: "integration.worker.completed",
      component: "integration-worker",
      correlationId,
      fields: { limit, durationMs: Date.now() - startedAt }
    });
    return json({ ok: true, limit, result, retention, health }, correlationId);
  } catch (error) {
    await releaseIntegrationWorkerLease();
    emitOperationalLog({
      level: "error",
      event: "integration.worker.failed",
      component: "integration-worker",
      correlationId,
      fields: { durationMs: Date.now() - startedAt },
      error
    });
    return json({ ok: false, error: "worker-run-failed" }, correlationId, 500);
  }
}
