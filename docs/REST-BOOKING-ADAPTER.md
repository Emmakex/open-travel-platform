# Generic REST booking adapter

Phase 8C-1 adds a provider-neutral `BookingRepository` adapter for deployments where trip reservations live in an external booking API rather than the built-in MongoDB repository.

The application pages and booking domain do not change. Set:

```text
BOOKING_MODE=rest
REST_BOOKING_BASE_URL=https://booking.example.com/open-travel/
REST_BOOKING_BEARER_TOKEN=<server-only token>
REST_BOOKING_TIMEOUT_MS=10000
REST_BOOKING_MAX_RESPONSE_BYTES=2000000
```

The adapter is intentionally a **contract**, not a vendor payload passthrough. External APIs must normalize their own provider-specific models into the Open Travel Platform booking domain before returning data.

## Trust boundary

`REST_BOOKING_BASE_URL` and `REST_BOOKING_BEARER_TOKEN` are trusted server deployment configuration, not browser/user input.

- production base URLs must use HTTPS;
- development HTTP is accepted only for `localhost`, `127.0.0.1` or `::1`;
- URL credentials, fragments and query strings are rejected in the base URL;
- redirects are disabled;
- browser-visible `NEXT_PUBLIC_*` variables must never contain the Bearer token.

Private/internal REST APIs are intentionally allowed when configured by the deployment administrator. This is different from user-configurable outbound webhooks, where SSRF protections must reject private networks.

## Contract version

Every request includes:

```text
X-OTP-Contract-Version: 1
X-OTP-Request-Id: otp-<uuid>
Accept: application/json
```

The API must return:

```text
Content-Type: application/json
X-OTP-Contract-Version: 1
```

A missing or different contract version is rejected before the payload enters the booking domain.

## Authentication

When configured, every request sends:

```text
Authorization: Bearer <REST_BOOKING_BEARER_TOKEN>
```

Production configuration requires a Bearer token with at least 16 characters. Real deployments should use a substantially longer high-entropy credential and rotate it through their deployment secret manager.

## Endpoints

The configured base URL is treated as a directory. For example, with:

```text
REST_BOOKING_BASE_URL=https://booking.example.com/open-travel/
```

Open Travel Platform calls the following paths.

### Availability

```http
GET v1/availability?tripId=<tripId>
```

Response:

```json
{
  "availability": [
    {
      "id": "dep-123",
      "tripId": "trip-123",
      "departureDate": "2026-10-01",
      "returnDate": "2026-10-08",
      "remainingSpaces": 10,
      "unitPrice": 950,
      "travellerPrices": {
        "adult": 950,
        "child": 700
      }
    }
  ]
}
```

The adapter rejects any returned availability whose `tripId` differs from the requested trip.

### Customer reservation list

```http
GET v1/customers/<identityId>/reservations
```

Response:

```json
{
  "reservations": [
    { "...": "Reservation domain object" }
  ]
}
```

Every returned reservation must have the same `identityId` as the requested customer. Cross-customer rows are rejected as a contract/scope violation.

### Customer reservation detail

```http
GET v1/customers/<identityId>/reservations/<reservationId>
```

Response:

```json
{
  "reservation": { "...": "Reservation domain object" }
}
```

`404` maps to `null`. A successful response for another identity is rejected.

### Create reservation

```http
POST v1/reservations
Content-Type: application/json
Idempotency-Key: otp-<uuid>
```

Body:

```json
{
  "reservation": {
    "...": "CreateReservationInput domain object"
  }
}
```

Response:

```json
{
  "reservation": { "...": "created Reservation domain object" }
}
```

The returned reservation must match the requested customer, trip and availability.

### Cancel reservation

```http
POST v1/customers/<identityId>/reservations/<reservationId>/cancel
Content-Type: application/json
Idempotency-Key: otp-<uuid>
```

Body:

```json
{}
```

Response:

```json
{
  "reservation": { "...": "cancelled Reservation domain object" }
}
```

`404` maps to `null`. The returned reservation must remain inside the requested customer scope.

## Idempotency and retries

Mutating calls receive an `Idempotency-Key` and reuse the **same key** if the adapter retries that method invocation after a transient transport/gateway failure.

The external API **must** honor the idempotency key for POST operations. This is what makes a retry safe when a remote write may have committed but the response was lost.

The adapter performs at most two attempts for a request. HTTP `429`, `502`, `503` and `504` may be retried. Network/timeout failures may also receive one retry. Other application-level rejections are returned immediately.

This transport-level idempotency does not replace higher-level duplicate-booking policy in the provider system.

## Runtime validation

Responses are not trusted simply because TypeScript expects a type. The adapter validates the external JSON at runtime before returning it through `BookingRepository`.

Key checks include:

- object/envelope shape;
- required identifiers and strings;
- finite numbers;
- positive/non-negative integer fields;
- reservation status enum;
- three-letter currency code;
- availability/reservation array caps;
- basic nested collection/object shape;
- customer ownership/scope consistency;
- trip/availability consistency on create;
- requested-trip consistency for availability.

Malformed or out-of-scope responses fail closed with a stable `REST_BOOKING_*` error.

## Response and timeout limits

```text
REST_BOOKING_TIMEOUT_MS=10000
REST_BOOKING_MAX_RESPONSE_BYTES=2000000
```

Server clamps:

- timeout: `1000..30000` ms;
- response bytes: `16384..5000000`.

The body is read through a bounded stream even when `Content-Length` is missing or dishonest. Redirects are rejected and `cache: no-store` is used.

## Stable error categories

The adapter translates remote/infrastructure details into stable application-level categories such as:

- `REST_BOOKING_AUTH_FAILED`;
- `REST_BOOKING_NOT_FOUND`;
- `REST_BOOKING_CONFLICT`;
- `REST_BOOKING_REJECTED`;
- `REST_BOOKING_RATE_LIMITED`;
- `REST_BOOKING_UNAVAILABLE`;
- `REST_BOOKING_TIMEOUT`;
- `REST_BOOKING_NETWORK_ERROR`;
- `REST_BOOKING_RESPONSE_TOO_LARGE`;
- `REST_BOOKING_CONTRACT_VERSION`;
- `REST_BOOKING_CONTRACT_INVALID`;
- `REST_BOOKING_SCOPE_MISMATCH`.

Raw provider response dumps are not exposed to the browser by this adapter.

## Payment and operations boundaries

Selecting `BOOKING_MODE=rest` replaces **customer booking persistence only**.

It does not automatically replace:

- the payment ledger;
- staff operations;
- traveller-data storage;
- outbound integrations;
- catalogue/travel data.

For example, a deployment that keeps local payment accounting can explicitly set:

```text
PAYMENT_LEDGER_MODE=mongodb
```

A later business adapter can replace other capabilities independently. This is intentional: provider-specific systems should be composed behind capability boundaries rather than merged into one global API mode.

## Quality gate

```bash
npm run check:rest-booking-adapter
```

The invariant is included in `npm run verify` and GitHub CI.
