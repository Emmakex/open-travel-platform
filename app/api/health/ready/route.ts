import { NextResponse } from "next/server";
import { reportOperationalFailure } from "@/lib/failure-reporting";
import {
  correlationHeaders,
  getRequestCorrelationId
} from "@/lib/observability";
import { getProductionReadiness } from "@/lib/production-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const readiness = await getProductionReadiness();
    if (!readiness.ready) {
      await reportOperationalFailure({
        severity: "warning",
        event: "health.readiness.not-ready",
        component: "health-readiness",
        correlationId,
        fields: { profile: readiness.profile }
      });
    }
    return NextResponse.json(
      {
        status: readiness.ready ? "ready" : "not-ready",
        profile: readiness.profile,
        checks: readiness.checks
      },
      {
        status: readiness.ready ? 200 : 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "X-Robots-Tag": "noindex, nofollow",
          ...correlationHeaders(correlationId)
        }
      }
    );
  } catch (error) {
    await reportOperationalFailure({
      severity: "error",
      event: "health.readiness.failed",
      component: "health-readiness",
      correlationId,
      error
    });
    return NextResponse.json(
      { status: "not-ready", error: "readiness-check-failed" },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "X-Robots-Tag": "noindex, nofollow",
          ...correlationHeaders(correlationId)
        }
      }
    );
  }
}
