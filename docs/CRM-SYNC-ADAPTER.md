# CRM synchronization adapter

Phase 8C-3 adds an optional downstream CRM synchronization capability without making a CRM authoritative for booking, pricing, inventory, supplier fulfilment or payment accounting.

The implementation reuses the existing integration event/outbox/worker infrastructure from Phases 8A/8B. It does **not** create a second background queue.

## Deployment mode

CRM synchronization is opt-in:

```text
CRM_SYNC_MODE=disabled
```

Supported modes:

- `disabled` — default; normal customer, booking and Operator workflows continue without CRM delivery;
- `rest` — enables the version-1 generic REST CRM adapter.

REST settings:

```text
CRM_SYNC_MODE=rest
REST_CRM_BASE_URL=https://crm.example.com/otp/
REST_CRM_BEARER_TOKEN=<server-only-secret>
REST_CRM_TIMEOUT_MS=10000
REST_CRM_MAX_RESPONSE_BYTES=262144
```

Production targets must use HTTPS. HTTP is accepted only for localhost during development. Credentials, fragments and query parameters are rejected in the configured base URL. The Bearer token must never be stored in a `NEXT_PUBLIC_*` variable.

## Authority boundary

CRM synchronization is **downstream-only**.

The CRM may acknowledge an upsert and return an external identifier. It cannot return or apply changes to:

- reservation status;
- customer booking price;
- payment/refund ledger;
- inventory;
- supplier fulfilment state/cost/reference;
- traveller records;
- protected post-purchase traveller data.

Local domain boundaries remain authoritative.

## Events and one durable queue

CRM synchronization uses the existing `travel_integration_events`, `travel_integration_deliveries` and attempt-history collections.

CRM consumes:

```text
customer.created
customer.profile.updated
trip.reservation.created
trip.reservation.status.changed
service.reservation.created
service.reservation.status.changed
```

The two `customer.*` event types are deliberately separate from `WebhookIntegrationEventType`. They cannot be selected by Admin-configured generic webhook endpoints.

Reservation events continue to be eligible for the existing signed-webhook endpoints. When CRM is configured, the same event also receives a delivery to the dedicated virtual CRM destination:

```text
crm-rest:primary
```

That CRM delivery therefore inherits the existing:

- durable queue;
- `(eventId, endpointId)` uniqueness;
- worker lease;
- scheduler/manual worker execution;
- bounded retry/backoff;
- attempt history;
- dead-letter state;
- Admin replay;
- queue health metrics;
- completed-delivery retention policy.

## Customer event transactionality

Persistent customer registration and profile updates enqueue their CRM trigger event using the same MongoDB session/transaction as the customer write.

Reservation creation/status changes already use the transactional integration outbox and therefore become CRM-capable without adding a second reservation mutation path.

## REST contract

The reference adapter uses:

```text
POST /v1/crm/contacts/upsert
POST /v1/crm/reservations/upsert
```

Every request includes:

```text
X-OTP-Contract-Version: 1
X-OTP-Request-Id: <delivery-scoped-id>
X-OTP-Operation: upsert
Idempotency-Key: <event-derived-stable-key>
Authorization: Bearer <server-only-token>   # when configured
Content-Type: application/json
```

The CRM must return:

```text
X-OTP-Contract-Version: 1
```

with a JSON result:

```json
{
  "externalId": "crm-object-id",
  "outcome": "upserted"
}
```

Accepted outcomes are `upserted` and `unchanged`.

## Contact allowlist

The generic contact snapshot contains only:

```text
localId
firstName
lastName
email
phone? 
country?
preferredLocale?
```

These are ordinary customer/contact data and still require the deployment to have an appropriate privacy/legal basis for synchronizing them to its selected CRM.

Passwords, password hashes/salts, session tokens, authentication audit details and protected post-purchase traveller data are never included.

## Reservation allowlist

The generic reservation snapshot contains only:

```text
reservationType
localId
contactLocalId
productId
productTitle?
status
partySize
startDate?
endDate?
createdAt
updatedAt?
```

The generic CRM adapter deliberately excludes:

- `totalPrice`, `unitPrice`, currency and payment terms;
- payment/refund ledger movements;
- supplier references/costs;
- inventory quantities or mutation instructions;
- traveller arrays;
- date of birth, nationality and identity/document fields;
- protected post-purchase traveller values;
- internal Operator notes/tasks/tags.

If a deployment needs additional CRM fields, extend a provider-specific adapter intentionally rather than passing complete reservation/customer documents through the generic contract.

## Current-snapshot synchronization

Integration events act as durable triggers. When a CRM delivery runs, the platform loads the current local customer/reservation and builds a fresh allowlisted snapshot.

For a reservation event the delivery performs:

1. contact upsert;
2. reservation upsert.

This guarantees that the reservation can reference a CRM contact even if the CRM did not previously receive the customer-registration event.

## Idempotency

Keys are derived from the immutable integration event ID:

```text
otp-crm:<eventId>:contact
otp-crm:<eventId>:reservation
```

Transport retry inside the REST adapter and queue-level retry/dead-letter replay therefore reuse stable keys for the same logical event operation. CRM implementations should persist/deduplicate these idempotency keys for their upsert endpoints.

## External references

Successful CRM upserts store only provider mapping metadata in:

```text
travel_crm_sync_links
```

A link records:

```text
adapterId
entityType
localId
externalId
firstSyncedAt
lastSyncedAt
```

CRM IDs never become primary local identifiers and are not written into booking/customer domain documents.

## CRM audit metadata

Successful normalized upsert outcomes are persisted in:

```text
travel_crm_sync_audit
```

The audit stores:

- integration event/delivery IDs;
- adapter ID;
- entity type and local ID;
- CRM external ID;
- normalized outcome;
- HTTP status when available;
- timestamp.

It intentionally does **not** store contact names, email, phone, Bearer credentials, raw HTTP request/response bodies, payment values or protected traveller values.

Transport failures/retries/dead-letter history remain visible through the existing integration delivery-attempt infrastructure.

## Admin operations

Admin can inspect:

```text
/operator/integrations/crm
```

The page shows runtime mode/readiness and recent non-PII CRM audit metadata. Each record links back to the normal integration delivery diagnostics so CRM uses the same operational model as webhooks.

## Transport safety

The reference REST adapter:

- is server-side only;
- requires HTTPS in production;
- rejects redirects;
- uses `no-store`;
- uses a bounded timeout;
- reads responses with a strict byte cap;
- requires the exact version header;
- translates provider/transport failures into stable CRM error codes;
- never returns raw provider bodies to browser surfaces.

## Extension rule

Provider-specific authentication, field mapping and vendor objects belong inside implementations of:

```text
repositories/crm-sync-adapter.ts
```

Do not allow a CRM adapter to write directly to reservation, payment, supplier, inventory or protected-traveller collections.
