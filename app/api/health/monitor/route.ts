import { NextResponse } from "next/server";
import {
  correlationHeaders,
  getRequestCorrelationId
} from "@/lib/observability";
import { getProductionReadiness } from "@/lib/production-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const healthContractVersion = "1";
const serviceName = "open-travel-platform";

function headers(correlationId: string): HeadersInit {
  return {
    "Cache-Control": "no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
    "X-OTP-Health-Contract-Version": healthContractVersion,
    ...correlationHeaders(correlationId)
  };
}

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const readiness = await getProductionReadiness();
    return NextResponse.json(
      {
        schemaVersion: 1,
        service: serviceName,
        status: readiness.ready ? "ok" : "degraded"
      },
      {
        status: readiness.ready ? 200 : 503,
        headers: headers(correlationId)
      }
    );
  } catch {
    return NextResponse.json(
      {
        schemaVersion: 1,
        service: serviceName,
        status: "unavailable"
      },
      {
        status: 503,
        headers: headers(correlationId)
      }
    );
  }
}
