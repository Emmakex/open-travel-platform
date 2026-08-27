import { NextResponse } from "next/server";
import {
  correlationHeaders,
  getRequestCorrelationId
} from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const healthContractVersion = "1";
const serviceName = "open-travel-platform";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  return NextResponse.json(
    {
      schemaVersion: 1,
      service: serviceName,
      status: "ok"
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
        "X-OTP-Health-Contract-Version": healthContractVersion,
        ...correlationHeaders(correlationId)
      }
    }
  );
}
