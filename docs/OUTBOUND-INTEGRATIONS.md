# Outbound integrations

<p align="center"><strong>English</strong> · <a href="./OUTBOUND-INTEGRATIONS.es.md">Español</a></p>

Phase 8A establishes the provider-neutral outbound integration boundary for Open Travel Platform. The first reference adapter is a signed HTTPS webhook with a durable MongoDB outbox.

The goal is to solve event contracts, atomicity, retries, idempotency, auditability, secret handling and network safety once before adding CRM, ERP, supplier or other vendor-specific adapters.

## Initial event contract

The first event types are:

- `trip.reservation.created`
- `trip.reservation.status.changed`
- `service.reservation.created`
- `service.reservation.status.changed`

Every event uses a versioned envelope:

```json
{
  "id": "intevt-...",
  "type": "trip.reservation.created",
  "version": 1,
  "occurredAt": "2026-08-26T00:00:00.000Z",
  "aggregateType": "trip-reservation",
  "aggregateId": "res-...",
  "payload": {}
}
```

Payloads contain only the operational fields needed by the integration contract. Internal MongoDB documents and protected post-purchase traveller values are not copied into the event envelope.

## Transactional outbox

Reservation persistence and event creation share the same MongoDB transaction/session.

That means:

- a reservation cannot commit while its integration event is lost;
- an event cannot commit for a reservation change that rolled back;
- enabled/subscribed endpoints at transaction time receive one durable delivery record per event;
- a unique `(eventId, endpointId)` index makes delivery creation idempotent.

Collections:

- `travel_integration_events`
- `travel_integration_deliveries`
- `travel_integration_delivery_attempts`
- `travel_integration_endpoints`
- `travel_integration_endpoint_audit`

## Delivery lifecycle

A delivery moves through these states:

```text
pending → delivering → succeeded
                    ↘ retrying → delivering
                              ↘ dead-letter
```

The worker:

- claims due work with a lease so concurrent processors do not intentionally send the same delivery at the same time;
- recovers expired `delivering` leases after a worker crash;
- stores every attempt;
- retries with bounded backoff;
- stops after 8 attempts and retains the delivery as `dead-letter`;
- processes a bounded batch (`25` by default, maximum `100`).

The current Admin UI exposes a manual **Process up to 25 due deliveries** action. This is deliberately not described as a continuously running worker. Production deployments should call the same processor from an approved scheduler/worker mechanism.

## Signing contract

Every request is HTTP `POST`, `Content-Type: application/json` and includes:

```text
X-OTP-Event-Id
X-OTP-Event-Type
X-OTP-Timestamp
X-OTP-Signature: v1=<hex HMAC-SHA256>
```

The signature input is:

```text
<timestamp>.<eventId>.<raw JSON body>
```

Verification pseudocode:

```text
expected = HMAC_SHA256(secret, timestamp + "." + eventId + "." + rawBody)
accept only when timing-safe(expected, received_v1_signature)
```

Consumers should also reject stale timestamps and deduplicate by `X-OTP-Event-Id`.

## Endpoint and secret management

Only Admin users can access `/operator/integrations` or mutate integration settings.

Each endpoint contains:

- display name;
- HTTPS URL;
- enabled/disabled state;
- subscribed event types;
- signing secret.

Signing secrets:

- must contain at least 16 characters;
- are encrypted before persistence with AES-256-GCM;
- are never returned to the Admin UI after saving;
- use a dedicated server-only master key: `INTEGRATION_SECRETS_KEY`.

Generate the master key once, for example:

```bash
openssl rand -base64 32
```

Keep it stable and server-only. Rotating/removing it without a controlled re-encryption migration makes stored integration secrets unreadable.

## SSRF and network protections

Webhook URLs are treated as privileged network configuration, not as ordinary user links.

The reference adapter:

- accepts HTTPS only;
- rejects URL credentials and fragments;
- rejects localhost and `.local` targets;
- resolves all DNS answers and rejects the endpoint when any answer is private/local/reserved;
- revalidates DNS before every delivery;
- connects to the validated IP address rather than resolving again during the request;
- preserves the original hostname for TLS SNI and HTTP `Host` validation;
- does not follow redirects;
- limits request timeout to 30 seconds;
- limits response bodies to 64 KiB.

These controls reduce SSRF and DNS-rebinding risk. Deployments with stricter egress policies should additionally enforce network-level allowlists/firewall rules.

## Failure and deletion semantics

Deleting an endpoint does not erase historical events, deliveries or attempts. Existing queued deliveries will retry and eventually become `dead-letter` because the endpoint is no longer available.

This preserves operational evidence instead of silently discarding failed integration work.

## Adding another adapter

Vendor-specific adapters should consume the same event boundary rather than embedding provider payloads inside reservation code.

Recommended flow:

1. define the provider mapping from the versioned event envelope;
2. keep provider authentication/configuration behind its own adapter;
3. preserve idempotency using event IDs or provider idempotency keys;
4. reuse durable retry/audit semantics where appropriate;
5. never add protected traveller data to a generic integration event merely because one vendor requests it;
6. introduce a separate explicitly authorized data-sharing contract when sensitive data is legitimately required.

## Quality gate

Run:

```bash
npm run check:outbound-integrations
```

The gate checks the permanent security/architecture invariants, including SSRF controls, HMAC signing, encrypted secrets, bounded retry/dead-letter behavior, transactional event enqueueing and Admin-only management.

It is also part of:

```bash
npm run verify
```
