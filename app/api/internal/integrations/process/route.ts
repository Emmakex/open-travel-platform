import { NextResponse } from "next/server";
import {
  processIntegrationDeliveries,
  pruneCompletedIntegrationHistory
} from "@/lib/integration-outbox";
import { authorizeIntegrationWorkerRequest } from "@/lib/integration-worker-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function parseLimit(request: Request) {
  const raw = new URL(request.url).searchParams.get("limit");
  if (!raw) return 25;
  if (!/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) return null;
  return parsed;
}

export async function POST(request: Request) {
  const authorization = authorizeIntegrationWorkerRequest(request);
  if (!authorization.ok) {
    return noStoreJson({ ok: false, error: authorization.code }, authorization.status);
  }

  const limit = parseLimit(request);
  if (limit === null) {
    return noStoreJson({ ok: false, error: "INVALID_BATCH_LIMIT" }, 400);
  }

  try {
    const delivery = await processIntegrationDeliveries({ limit });
    const retention = await pruneCompletedIntegrationHistory({ limit: 500 });
    return noStoreJson({
      ok: true,
      processedAt: new Date().toISOString(),
      limit,
      delivery,
      retention
    });
  } catch {
    return noStoreJson({ ok: false, error: "INTEGRATION_WORKER_FAILED" }, 500);
  }
}
