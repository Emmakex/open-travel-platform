import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

const received: Array<{
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}> = [];
let rejectNext = false;

const server = createServer((request, response) => {
  const chunks: Buffer[] = [];
  request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  request.on("end", () => {
    const text = Buffer.concat(chunks).toString("utf8");
    received.push({
      headers: request.headers,
      body: text ? JSON.parse(text) : null
    });
    if (rejectNext) {
      rejectNext = false;
      response.statusCode = 503;
      response.setHeader("Content-Type", "text/plain");
      response.end("temporary failure");
      return;
    }
    response.statusCode = 202;
    response.setHeader("Content-Type", "application/json");
    response.end("{}");
  });
});

await new Promise<void>((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => resolve());
});

const address = server.address() as AddressInfo;
process.env.FAILURE_TRANSPORT_MODE = "rest";
process.env.REST_FAILURE_TRANSPORT_URL = `http://127.0.0.1:${address.port}/failure-events`;
process.env.REST_FAILURE_TRANSPORT_BEARER_TOKEN = "test-failure-transport-token";
process.env.REST_FAILURE_TRANSPORT_TIMEOUT_MS = "1500";
process.env.REST_FAILURE_TRANSPORT_MAX_RESPONSE_BYTES = "4096";

const capturedLogs: string[] = [];
const originalInfo = console.info;
const originalWarn = console.warn;
const originalError = console.error;
console.info = (...values: unknown[]) => capturedLogs.push(values.map(String).join(" "));
console.warn = (...values: unknown[]) => capturedLogs.push(values.map(String).join(" "));
console.error = (...values: unknown[]) => capturedLogs.push(values.map(String).join(" "));

try {
  const { reportOperationalFailure } = await import("../lib/failure-reporting");

  const failure = Object.assign(new Error("secret exception message"), {
    code: "PAYMENT_PROVIDER_UNAVAILABLE"
  });

  const firstDelivered = await reportOperationalFailure({
    severity: "error",
    event: "payment.webhook.failed",
    component: "payment-webhook",
    correlationId: "req-contract-test-0001",
    fields: {
      provider: "stripe",
      reason: "provider-unavailable",
      durationMs: 125,
      customerEmail: "customer@example.test",
      bearerToken: "secret-token-123",
      signature: "signature-secret",
      providerReference: "provider-ref-123",
      rawBody: "raw-sensitive-body",
      travellerPassport: "P1234567",
      amount: 199.95,
      currency: "EUR"
    },
    error: failure
  });
  assert.equal(firstDelivered, true, "configured transport should acknowledge a successful 2xx delivery");

  const secondDelivered = await reportOperationalFailure({
    severity: "error",
    event: "payment.webhook.failed",
    component: "payment-webhook",
    correlationId: "req-contract-test-0002",
    fields: { provider: "stripe", reason: "provider-unavailable", durationMs: 250 },
    error: failure
  });
  assert.equal(secondDelivered, true, "a second equivalent failure should still be delivered");
  assert.equal(received.length, 2, "each failure report should result in exactly one HTTP request");

  const firstRequest = received[0];
  assert.equal(firstRequest.headers.authorization, "Bearer test-failure-transport-token");
  assert.equal(firstRequest.headers["x-otp-failure-contract-version"], "1");
  assert.equal(firstRequest.headers["x-otp-request-id"], "req-contract-test-0001");
  assert.equal(firstRequest.headers["content-type"], "application/json");

  const firstBody = firstRequest.body as {
    failure?: Record<string, unknown>;
  };
  const secondBody = received[1].body as {
    failure?: Record<string, unknown>;
  };
  assert.ok(firstBody.failure, "transport body must contain a normalized failure event");
  assert.equal(firstBody.failure?.schemaVersion, 1);
  assert.equal(firstBody.failure?.severity, "error");
  assert.equal(firstBody.failure?.event, "payment.webhook.failed");
  assert.equal(firstBody.failure?.component, "payment-webhook");
  assert.equal(firstBody.failure?.errorType, "Error");
  assert.equal(firstBody.failure?.errorCode, "PAYMENT_PROVIDER_UNAVAILABLE");
  assert.match(String(firstBody.failure?.fingerprint), /^[a-f0-9]{64}$/);
  assert.equal(
    firstBody.failure?.fingerprint,
    secondBody.failure?.fingerprint,
    "equivalent failures must share a stable grouping fingerprint"
  );

  const serialized = JSON.stringify(firstBody);
  for (const secret of [
    "customer@example.test",
    "secret-token-123",
    "signature-secret",
    "provider-ref-123",
    "raw-sensitive-body",
    "P1234567",
    "199.95",
    "EUR",
    "secret exception message"
  ]) {
    assert.equal(serialized.includes(secret), false, `Sensitive value leaked into failure transport: ${secret}`);
  }
  assert.equal(serialized.includes("stack"), false, "Error stacks must not be serialized into the failure transport");

  rejectNext = true;
  const requestCountBeforeRejection = received.length;
  const rejectedDelivery = await reportOperationalFailure({
    severity: "critical",
    event: "integration.worker.failed",
    component: "integration-worker",
    correlationId: "req-contract-test-0003",
    fields: { reason: "delivery-failed" },
    error: Object.assign(new Error("never expose this"), { code: "WORKER_FAILED" })
  });
  assert.equal(rejectedDelivery, false, "transport rejection must be best-effort and non-throwing");
  assert.equal(
    received.length,
    requestCountBeforeRejection + 1,
    "failure transport must not retry and amplify an alert delivery"
  );
  assert.ok(
    capturedLogs.some((line) => line.includes("observability.failure-transport.failed")),
    "transport failure must remain visible in the local structured log"
  );

  console.log = originalInfo;
  originalInfo(
    "Failure transport validation passed: real local HTTP delivery, auth, stable fingerprinting, no retries and sensitive-data redaction are consistent."
  );
} finally {
  console.info = originalInfo;
  console.warn = originalWarn;
  console.error = originalError;
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
