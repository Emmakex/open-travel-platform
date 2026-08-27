import assert from "node:assert/strict";
import { getOperationalAlertRouting } from "../lib/alert-routing";
import { buildFailureTransportEvent } from "../lib/failure-reporting";
import { GET as getLiveness } from "../app/api/health/live/route";
import { GET as getExternalHealth } from "../app/api/health/monitor/route";

function saveEnvironment(names: string[]) {
  return Object.fromEntries(names.map((name) => [name, process.env[name]]));
}

function restoreEnvironment(snapshot: Record<string, string | undefined>) {
  for (const [name, value] of Object.entries(snapshot)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

async function main() {
  const environmentNames = [
    "KTRAVEL_DEPLOYMENT_PROFILE",
    "KTRAVEL_PUBLIC_URL",
    "NEXT_PUBLIC_DATA_MODE",
    "TRAVEL_DATA_MODE",
    "IDENTITY_MODE",
    "STAFF_AUTH_MODE",
    "BOOKING_MODE",
    "OPERATIONS_MODE",
    "PAYMENT_LEDGER_MODE",
    "SUPPLIER_FULFILMENT_ADAPTER_MODE",
    "CRM_SYNC_MODE",
    "ERP_ACCOUNTING_MODE",
    "DEMO_IDENTITY_ENABLED",
    "DEMO_BOOKING_ENABLED",
    "DEMO_OPERATIONS_ENABLED"
  ];
  const previousEnvironment = saveEnvironment(environmentNames);

  try {
    const liveness = await getLiveness(
      new Request("http://localhost/api/health/live", {
        headers: { "X-Request-Id": "req-external-monitor-live-0001" }
      })
    );
    assert.equal(liveness.status, 200);
    assert.equal(liveness.headers.get("x-otp-health-contract-version"), "1");
    assert.equal(liveness.headers.get("x-request-id"), "req-external-monitor-live-0001");
    assert.equal(liveness.headers.get("cache-control"), "no-store, max-age=0");
    assert.deepEqual(await liveness.json(), {
      schemaVersion: 1,
      service: "open-travel-platform",
      status: "ok"
    });

    process.env.KTRAVEL_DEPLOYMENT_PROFILE = "demo";
    process.env.NEXT_PUBLIC_DATA_MODE = "demo";
    process.env.TRAVEL_DATA_MODE = "disabled";
    process.env.IDENTITY_MODE = "disabled";
    process.env.STAFF_AUTH_MODE = "disabled";
    process.env.BOOKING_MODE = "disabled";
    process.env.OPERATIONS_MODE = "disabled";
    process.env.PAYMENT_LEDGER_MODE = "disabled";
    process.env.SUPPLIER_FULFILMENT_ADAPTER_MODE = "disabled";
    process.env.CRM_SYNC_MODE = "disabled";
    process.env.ERP_ACCOUNTING_MODE = "disabled";

    const healthy = await getExternalHealth(
      new Request("http://localhost/api/health/monitor", {
        headers: { "X-Request-Id": "req-external-monitor-ready-0001" }
      })
    );
    assert.equal(healthy.status, 200);
    assert.equal(healthy.headers.get("x-otp-health-contract-version"), "1");
    const healthyBody = await healthy.json() as Record<string, unknown>;
    assert.deepEqual(healthyBody, {
      schemaVersion: 1,
      service: "open-travel-platform",
      status: "ok"
    });
    assert.equal("checks" in healthyBody, false, "external monitoring must not disclose readiness internals");
    assert.equal("profile" in healthyBody, false, "external monitoring must not disclose deployment profile");

    process.env.KTRAVEL_DEPLOYMENT_PROFILE = "live";
    process.env.KTRAVEL_PUBLIC_URL = "http://invalid-for-live.example";
    process.env.NEXT_PUBLIC_DATA_MODE = "mongodb";
    process.env.DEMO_IDENTITY_ENABLED = "false";
    process.env.DEMO_BOOKING_ENABLED = "false";
    process.env.DEMO_OPERATIONS_ENABLED = "false";

    const degraded = await getExternalHealth(
      new Request("http://localhost/api/health/monitor", {
        headers: { "X-Request-Id": "req-external-monitor-ready-0002" }
      })
    );
    assert.equal(degraded.status, 503, "live readiness failure must be externally detectable");
    assert.deepEqual(await degraded.json(), {
      schemaVersion: 1,
      service: "open-travel-platform",
      status: "degraded"
    });

    assert.deepEqual(
      getOperationalAlertRouting({
        event: "health.readiness.failed",
        component: "health-readiness",
        severity: "critical"
      }),
      { route: "availability", runbook: "availability-health", escalation: "page" }
    );
    assert.deepEqual(
      getOperationalAlertRouting({
        event: "payment.notification.unavailable",
        component: "payment-webhook",
        severity: "error"
      }),
      { route: "payments", runbook: "payment-processing", escalation: "urgent" }
    );
    assert.deepEqual(
      getOperationalAlertRouting({
        event: "integration.worker.failed",
        component: "integration-worker",
        severity: "warning"
      }),
      { route: "integrations", runbook: "integration-delivery", escalation: "notify" }
    );

    const routedFailure = buildFailureTransportEvent({
      severity: "error",
      event: "payment.notification.unavailable",
      component: "payment-webhook",
      correlationId: "req-external-monitor-routing-0001",
      fields: {
        provider: "stripe",
        alertRoute: "platform",
        runbook: "platform-operations",
        escalation: "notify"
      }
    });
    assert.equal(routedFailure.fields?.alertRoute, "payments", "callers must not override central alert routing");
    assert.equal(routedFailure.fields?.runbook, "payment-processing");
    assert.equal(routedFailure.fields?.escalation, "urgent");

    console.info(
      "External monitoring validation passed: stable minimal health contracts, safe degraded detection and centralized actionable alert routing are consistent."
    );
  } finally {
    restoreEnvironment(previousEnvironment);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
