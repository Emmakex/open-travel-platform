import assert from "node:assert/strict";
import {
  emitOperationalLog,
  getRequestCorrelationId
} from "@/lib/observability";

async function main() {
  const safeRequest = new Request("https://travel.example.test/test", {
    headers: { "X-Request-Id": "req-client-123456" }
  });
  assert.equal(getRequestCorrelationId(safeRequest), "req-client-123456");

  const unsafeRequest = new Request("https://travel.example.test/test", {
    headers: { "X-Request-Id": "person@example.test secret" }
  });
  const generated = getRequestCorrelationId(unsafeRequest);
  assert.match(generated, /^req-[0-9a-f-]{36}$/);
  assert.notEqual(generated, "person@example.test secret");

  const lines: string[] = [];
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;
  console.info = (value?: unknown) => lines.push(String(value));
  console.warn = (value?: unknown) => lines.push(String(value));
  console.error = (value?: unknown) => lines.push(String(value));

  try {
    const sensitiveError = Object.assign(
      new Error("Payment failed for customer@example.test with secret-token-123"),
      { code: "PAYMENT_FINALIZE_FAILED" }
    );

    emitOperationalLog({
      level: "error",
      event: "payment.webhook.failed",
      component: "payment-webhook",
      correlationId: "req-client-123456",
      fields: {
        provider: "stripe",
        outcome: "failed",
        durationMs: 17,
        email: "customer@example.test",
        password: "password-value",
        bearerToken: "secret-token-123",
        signature: "signature-value",
        rawBody: "raw-sensitive-body",
        passportNumber: "AA000000",
        customerId: "customer-123",
        providerReference: "provider-ref-123",
        overlong: "x".repeat(500),
        invalidNumber: Number.POSITIVE_INFINITY
      },
      error: sensitiveError
    });

    emitOperationalLog({
      level: "info",
      event: "integration.worker.completed",
      component: "integration-worker",
      correlationId: "req-client-123456",
      fields: { processed: 3, success: true }
    });
  } finally {
    console.info = originalInfo;
    console.warn = originalWarn;
    console.error = originalError;
  }

  assert.equal(lines.length, 2, "Each operational event must emit exactly one JSON line.");
  const first = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
  assert.equal(first.schemaVersion, 1);
  assert.equal(first.service, "open-travel-platform");
  assert.equal(first.level, "error");
  assert.equal(first.event, "payment.webhook.failed");
  assert.equal(first.component, "payment-webhook");
  assert.equal(first.correlationId, "req-client-123456");
  assert.equal(first.errorType, "Error");
  assert.equal(first.errorCode, "PAYMENT_FINALIZE_FAILED");

  const fields = first.fields as Record<string, unknown>;
  assert.equal(fields.provider, "stripe");
  assert.equal(fields.outcome, "failed");
  assert.equal(fields.durationMs, 17);
  assert.equal(typeof fields.overlong, "string");
  assert.equal((fields.overlong as string).length, 240, "Long safe text must be bounded.");
  assert.equal("invalidNumber" in fields, false, "Non-finite numeric fields must be dropped.");

  for (const forbiddenKey of [
    "email",
    "password",
    "bearerToken",
    "signature",
    "rawBody",
    "passportNumber",
    "customerId",
    "providerReference"
  ]) {
    assert.equal(forbiddenKey in fields, false, `Sensitive field ${forbiddenKey} must be redacted.`);
  }

  const combined = lines.join("\n");
  for (const forbiddenValue of [
    "customer@example.test",
    "password-value",
    "secret-token-123",
    "signature-value",
    "raw-sensitive-body",
    "AA000000",
    "customer-123",
    "provider-ref-123",
    "Payment failed for"
  ]) {
    assert.equal(combined.includes(forbiddenValue), false, `Sensitive value leaked into logs: ${forbiddenValue}`);
  }
  assert.equal(combined.includes("stack"), false, "Error stacks must not be serialized.");

  const second = JSON.parse(lines[1] ?? "{}") as Record<string, unknown>;
  assert.equal(second.level, "info");
  assert.equal((second.fields as Record<string, unknown>).processed, 3);

  console.log("Structured observability redaction and correlation tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
