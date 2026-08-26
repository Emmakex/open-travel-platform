import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const configSource = await readFile(new URL("../lib/rest-booking-config.ts", import.meta.url), "utf8");
assert.ok(configSource.includes("REST_BOOKING_BASE_URL"));
assert.ok(configSource.includes("REST_BOOKING_BEARER_TOKEN"));
assert.ok(configSource.includes("REST_BOOKING_TIMEOUT_MS"));
assert.ok(configSource.includes("REST_BOOKING_MAX_RESPONSE_BYTES"));
assert.ok(configSource.includes('process.env.NODE_ENV === "production" && url.protocol !== "https:"'), "production REST booking APIs must require HTTPS");
assert.ok(configSource.includes('hostname === "localhost"'));
assert.ok(configSource.includes('hostname === "127.0.0.1"'));
assert.ok(configSource.includes('hostname === "::1"'));
assert.ok(configSource.includes("url.username || url.password || url.hash || url.search"), "base URL must reject embedded credentials/fragments/query");
assert.ok(configSource.includes("bearerToken.length < 16"), "production Bearer token must have a minimum length");
assert.ok(configSource.includes("10_000, 1_000, 30_000"), "timeout must be server-clamped");
assert.ok(configSource.includes("2_000_000, 16_384, 5_000_000"), "response size must be server-clamped");
assert.equal(configSource.includes("NEXT_PUBLIC_"), false, "REST booking runtime config must remain server-only");

const contractSource = await readFile(new URL("../lib/rest-booking-contract.ts", import.meta.url), "utf8");
assert.ok(contractSource.includes('restBookingContractVersion = "1"'), "REST booking contract must be explicitly versioned");
assert.ok(contractSource.includes('restBookingContractHeader = "X-OTP-Contract-Version"'));
assert.ok(contractSource.includes('value === "pending" || value === "confirmed" || value === "cancelled"'), "reservation status must be runtime-validated");
assert.ok(contractSource.includes('/^[A-Z]{3}$/.test(currency)'), "currency must be runtime-validated");
assert.ok(contractSource.includes("source.availability.length > 1000"), "availability responses must be bounded");
assert.ok(contractSource.includes("source.reservations.length > 1000"), "reservation responses must be bounded");
assert.ok(contractSource.includes("validateOptionalArray(source.travellers"));
assert.ok(contractSource.includes("validateOptionalArray(source.accommodationBookings"));
assert.ok(contractSource.includes("validateOptionalArray(source.packageAddOns"));

const adapterSource = await readFile(new URL("../adapters/rest-booking-repository.ts", import.meta.url), "utf8");
assert.ok(adapterSource.includes("implements BookingRepository"), "REST adapter must remain behind BookingRepository");
assert.ok(adapterSource.includes('cache: "no-store"'));
assert.ok(adapterSource.includes('redirect: "error"'), "REST booking adapter must not follow redirects");
assert.ok(adapterSource.includes("AbortSignal.timeout(config.timeoutMs)"), "requests must have a bounded timeout");
assert.ok(adapterSource.includes("content-length"));
assert.ok(adapterSource.includes("response.body.getReader()"), "response limit must also be enforced while streaming");
assert.ok(adapterSource.includes("total > maximumBytes"));
assert.ok(adapterSource.includes('contentType.includes("application/json")'), "responses must use JSON content type");
assert.ok(adapterSource.includes("responseVersion !== restBookingContractVersion"), "responses must echo the supported contract version");
assert.ok(adapterSource.includes('headers.set("Authorization", `Bearer ${config.bearerToken}`)'));
assert.ok(adapterSource.includes('headers.set("Idempotency-Key", requestId)'), "mutating requests must carry idempotency keys");
assert.ok(adapterSource.includes("const maxAttempts = 2"), "transport retries must remain bounded");
for (const status of ["429", "502", "503", "504"]) {
  assert.ok(adapterSource.includes(status), `transient status ${status} should remain explicitly classified`);
}
assert.ok(adapterSource.includes("assertAvailabilityTrip"), "availability must remain in requested trip scope");
assert.ok(adapterSource.includes("assertReservationIdentity"), "reservation ownership must be checked after external mapping");
assert.ok(adapterSource.includes("assertCreatedReservation"), "created reservation trip/departure scope must be checked");
assert.ok(adapterSource.includes("reservation.identityId !== identityId"));
assert.ok(adapterSource.includes("reservation.tripId !== input.tripId || reservation.availabilityId !== input.availabilityId"));
assert.ok(adapterSource.includes("encodeURIComponent(identityId)"), "customer path identifiers must be URL-encoded");
assert.ok(adapterSource.includes("encodeURIComponent(reservationId)"), "reservation path identifiers must be URL-encoded");
assert.equal(adapterSource.includes("NEXT_PUBLIC_"), false, "REST booking adapter must not depend on browser-visible secrets");

const bookingConfigSource = await readFile(new URL("../lib/booking-config.ts", import.meta.url), "utf8");
assert.ok(bookingConfigSource.includes('"demo" | "mongodb" | "rest" | "disabled"'));
assert.ok(bookingConfigSource.includes('requestedMode === "rest"'));
assert.ok(bookingConfigSource.includes('mode === "mongodb" || mode === "rest"'), "REST booking mode must enable the BookingRepository write capability");

const compositionSource = await readFile(new URL("../lib/booking-repository.ts", import.meta.url), "utf8");
assert.ok(compositionSource.includes('RestBookingRepository'));
assert.ok(compositionSource.includes('bookingConfig.mode === "rest"'));
assert.ok(compositionSource.includes("return new RestBookingRepository()"));

const envSource = await readFile(new URL("../.env.example", import.meta.url), "utf8");
assert.ok(envSource.includes("# Booking mode: demo | mongodb | rest | disabled"));
for (const variable of [
  "REST_BOOKING_BASE_URL=",
  "REST_BOOKING_BEARER_TOKEN=",
  "REST_BOOKING_TIMEOUT_MS=10000",
  "REST_BOOKING_MAX_RESPONSE_BYTES=2000000"
]) {
  assert.ok(envSource.includes(variable), `.env.example must document ${variable}`);
}
assert.equal(envSource.includes("NEXT_PUBLIC_REST_BOOKING_BEARER_TOKEN"), false);

const docsSource = await readFile(new URL("../docs/REST-BOOKING-ADAPTER.md", import.meta.url), "utf8");
for (const phrase of [
  "X-OTP-Contract-Version: 1",
  "Idempotency-Key",
  "Runtime validation",
  "Payment and operations boundaries",
  "BOOKING_MODE=rest"
]) {
  assert.ok(docsSource.includes(phrase), `REST booking adapter documentation must explain ${phrase}`);
}

console.log("Generic REST BookingRepository adapter invariants passed.");
