import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  isPublicWebhookAddress,
  signIntegrationWebhook
} from "../lib/integration-webhook-security.ts";

assert.equal(isPublicWebhookAddress("8.8.8.8"), true, "public IPv4 targets should remain eligible");
for (const address of [
  "0.0.0.0",
  "10.0.0.1",
  "100.64.0.1",
  "127.0.0.1",
  "169.254.169.254",
  "172.16.0.1",
  "192.168.1.1",
  "192.0.2.1",
  "198.51.100.1",
  "203.0.113.1",
  "224.0.0.1",
  "::",
  "::1",
  "fc00::1",
  "fd00::1",
  "fe80::1",
  "ff02::1",
  "2001:db8::1",
  "::ffff:127.0.0.1"
]) {
  assert.equal(isPublicWebhookAddress(address), false, `${address} must be rejected as a webhook target`);
}

const signature = signIntegrationWebhook({
  secret: "test-signing-secret-1234",
  timestamp: "2026-08-26T00:00:00.000Z",
  eventId: "intevt-test",
  body: '{"ok":true}'
});
assert.equal(signature.length, 64, "HMAC-SHA256 signature must be a 64-character hex digest");
assert.equal(
  signature,
  signIntegrationWebhook({
    secret: "test-signing-secret-1234",
    timestamp: "2026-08-26T00:00:00.000Z",
    eventId: "intevt-test",
    body: '{"ok":true}'
  }),
  "webhook signing must be deterministic for identical inputs"
);
assert.notEqual(
  signature,
  signIntegrationWebhook({
    secret: "test-signing-secret-1234",
    timestamp: "2026-08-26T00:00:01.000Z",
    eventId: "intevt-test",
    body: '{"ok":true}'
  }),
  "timestamp must participate in the webhook signature"
);

const securitySource = await readFile(new URL("../lib/integration-webhook-security.ts", import.meta.url), "utf8");
assert.ok(securitySource.includes('url.protocol !== "https:"'), "outbound targets must be HTTPS-only");
assert.ok(securitySource.includes("url.username || url.password || url.hash"), "URL credentials/fragments must be rejected");
assert.ok(securitySource.includes('lookup(hostname, { all: true, verbatim: true })'), "all DNS answers must be inspected");
assert.ok(securitySource.includes("addresses.some((entry) => !isPublicWebhookAddress(entry.address))"), "any private/reserved DNS answer must reject the target");
assert.ok(securitySource.includes("hostname: input.target.address"), "delivery must connect to the validated/pinned IP");
assert.ok(securitySource.includes("servername: url.hostname"), "TLS SNI must remain the original validated hostname");
assert.ok(securitySource.includes("Host: url.host"), "HTTP Host must remain the original validated host");
assert.ok(securitySource.includes('method: "POST"'), "reference webhook delivery must use POST");
assert.ok(securitySource.includes("responseBytes > 65536"), "webhook responses must be size-bounded");
assert.equal(securitySource.includes("redirect"), false, "delivery code must not implement redirect following");

const secretSource = await readFile(new URL("../lib/integration-secrets.ts", import.meta.url), "utf8");
assert.ok(secretSource.includes("INTEGRATION_SECRETS_KEY"));
assert.ok(secretSource.includes('createCipheriv("aes-256-gcm"'));
assert.ok(secretSource.includes('createDecipheriv("aes-256-gcm"'));
assert.ok(secretSource.includes("randomBytes(12)"), "AES-GCM must use a fresh 96-bit IV");

const endpointSource = await readFile(new URL("../lib/integration-endpoints.ts", import.meta.url), "utf8");
assert.ok(endpointSource.includes("input.signingSecret?.trim()"));
assert.ok(endpointSource.includes("rawSecret.length < 16"), "server must reject weak webhook secrets");
assert.ok(endpointSource.includes("encryptIntegrationSecret(rawSecret)"), "webhook secrets must be encrypted before persistence");
assert.equal(endpointSource.includes("signingSecret: rawSecret"), false, "plaintext signing secrets must not be persisted");
assert.ok(endpointSource.includes("Select at least one integration event."));

const outboxSource = await readFile(new URL("../lib/integration-outbox.ts", import.meta.url), "utf8");
assert.ok(outboxSource.includes('name: "integration_delivery_event_endpoint_unique"'), "event/endpoint delivery pairs must be idempotent");
assert.ok(outboxSource.includes("const maxAttempts = 8"), "delivery retry attempts must be bounded");
assert.ok(outboxSource.includes("leaseUntil"), "delivery claims must use a lease for crash/concurrency recovery");
assert.ok(outboxSource.includes('status: "delivering"'), "workers must claim deliveries before sending");
assert.ok(outboxSource.includes('"dead-letter"'), "terminal delivery failures must be retained as dead-letter records");
assert.ok(outboxSource.includes("integrationDeliveryAttemptCollectionName"), "each delivery attempt must have durable history");
assert.ok(outboxSource.includes("Math.max(1, Math.min(input?.limit ?? 25, 100))"), "worker batches must be bounded");
assert.ok(outboxSource.includes("Call ensureIntegrationOutboxIndexes(database) before opening the transaction."));

const bookingSource = await readFile(new URL("../adapters/mongo-booking-repository.ts", import.meta.url), "utf8");
assert.ok(bookingSource.includes('type: "trip.reservation.created"'));
assert.ok(bookingSource.includes('type: "trip.reservation.status.changed"'));
assert.ok(bookingSource.indexOf("ensureIntegrationOutboxIndexes(database)") < bookingSource.indexOf("session.withTransaction"), "trip outbox indexes must be prepared before the transaction");
assert.ok(bookingSource.includes("await enqueueIntegrationEvent(database, session"), "trip events must use the reservation transaction/session");

const operationsSource = await readFile(new URL("../adapters/mongo-operations-repository.ts", import.meta.url), "utf8");
assert.ok(operationsSource.includes('type: "trip.reservation.status.changed"'));
assert.ok(operationsSource.indexOf("ensureIntegrationOutboxIndexes(database)") < operationsSource.indexOf("session.withTransaction"), "operator status events must prepare outbox indexes before the transaction");
assert.ok(operationsSource.includes("await enqueueIntegrationEvent(database, session"));

const serviceSource = await readFile(new URL("../lib/service-reservations.ts", import.meta.url), "utf8");
assert.ok(serviceSource.includes('type: "service.reservation.created"'));
assert.ok(serviceSource.includes('type: "service.reservation.status.changed"'));
assert.ok(serviceSource.includes("ensureIntegrationOutboxIndexes(database)"));
assert.ok(serviceSource.includes("await enqueueIntegrationEvent(database, session"), "service events must use the service-reservation transaction/session");

for (const source of [bookingSource, operationsSource, serviceSource]) {
  for (const protectedField of ["documentNumber", "documentExpiry", "residenceAddress", "passportScan", "healthData"]) {
    assert.equal(source.includes(`${protectedField}:`), false, `outbound integration payloads must not define protected field ${protectedField}`);
  }
}

const pageSource = await readFile(new URL("../app/operator/integrations/page.tsx", import.meta.url), "utf8");
assert.ok(pageSource.includes("await requireAdminIdentity()"), "integration console must remain Admin-only");
assert.ok(pageSource.includes("Process up to 25 due deliveries"));
assert.ok(pageSource.includes("no delivery is claimed to run continuously"));
assert.ok(pageSource.includes("protected traveller data"));

const actionSource = await readFile(new URL("../app/operator/integrations/actions.ts", import.meta.url), "utf8");
assert.ok(actionSource.includes("const admin = await requireAdminIdentity()"));
assert.ok(actionSource.includes("await requireAdminIdentity()"));
assert.ok(actionSource.includes("processIntegrationDeliveries({ limit: 25 })"));

const envSource = await readFile(new URL("../.env.example", import.meta.url), "utf8");
assert.ok(envSource.includes("INTEGRATION_SECRETS_KEY="), "deployment template must document the integration encryption key");
assert.equal(envSource.includes("NEXT_PUBLIC_INTEGRATION_SECRETS_KEY"), false, "integration encryption key must never be browser-visible");

console.log("Outbound integration security, outbox and delivery invariants passed.");
