import { NextResponse } from "next/server";
import { getProductionReadiness } from "@/lib/production-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await getProductionReadiness();
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
        "X-Robots-Tag": "noindex, nofollow"
      }
    }
  );
}
