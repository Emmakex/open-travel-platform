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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      ...headers
    }
  });
}

export async function POST(request: Request) {
  if (!isIntegrationWorkerAuthConfigured()) {
    return json({ ok: false, error: "worker-not-configured" }, 503);
  }
  if (!authenticateIntegrationWorkerRequest(request)) {
    return json({ ok: false, error: "unauthorized" }, 401, {
      "WWW-Authenticate": "Bearer realm=\"integration-worker\""
    });
  }

  const minimumIntervalSeconds = getIntegrationWorkerMinimumIntervalSeconds();
  const claim = await claimIntegrationWorkerRun({ source: "scheduler", minimumIntervalSeconds });
  if (!claim.claimed) {
    const retrySeconds = claim.retryAt
      ? Math.max(1, Math.ceil((Date.parse(claim.retryAt) - Date.now()) / 1000))
      : minimumIntervalSeconds;
    return json({ ok: false, error: "worker-busy-or-rate-limited", retryAfterSeconds: retrySeconds }, 429, {
      "Retry-After": String(retrySeconds)
    });
  }

  try {
    const limit = getIntegrationWorkerBatchSize();
    const result = await processIntegrationDeliveries({ limit });
    const retention = await pruneCompletedIntegrationHistory();
    await finishIntegrationWorkerRun({ result });
    const health = await getIntegrationHealthMetrics();
    return json({
      ok: true,
      limit,
      result,
      retention,
      health
    });
  } catch (error) {
    await releaseIntegrationWorkerLease();
    console.error("Integration worker run failed", error);
    return json({ ok: false, error: "worker-run-failed" }, 500);
  }
}
