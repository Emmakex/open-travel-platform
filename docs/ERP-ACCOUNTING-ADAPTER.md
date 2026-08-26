# ERP / accounting adapter

Phase 8C-4 adds a provider-neutral, downstream-only accounting synchronization boundary to Open Travel Platform.

The first generic contract deliberately exports **accounting-ready payment ledger movements**, not jurisdiction-specific legal invoices. The current core does not maintain a complete tax/billing identity model (for example jurisdictional tax IDs, fiscal addresses, tax registration rules or statutory invoice numbering), so the adapter must not invent those values.

## Authority boundary

The local payment ledger remains authoritative.

An ERP/accounting system may:

- receive a normalized succeeded payment or refund movement;
- deduplicate/upsert it using the supplied idempotency key;
- return its own stable external identifier;
- map the normalized movement to a vendor-specific chart of accounts, tax logic or downstream document workflow.

An ERP/accounting system may **not**:

- change a reservation state;
- alter inventory;
- create/update/delete local payment or refund history;
- reinterpret a `pending` or `failed` movement as accounted revenue/cash;
- change the exact source amount or currency;
- return provider-specific accounting state that is automatically applied to the booking domain.

The only response persisted by the generic boundary is acknowledgement metadata (`externalId`, outcome and HTTP status).

## Eligible movement

The integration event is:

```text
payment.transaction.succeeded
```

Only a `PaymentTransaction` whose local status is `succeeded` can be delivered to the accounting adapter.

Both flows are covered:

1. a movement created directly as `succeeded` (for example a validated manual payment);
2. a pending provider movement that later transitions to `succeeded`.

The payment/refund mutation and the integration event are committed in the **same MongoDB transaction**. If either side fails, neither side commits.

Event IDs are deterministic per payment movement:

```text
intevt-payment-{paymentTransactionId}-succeeded
```

The durable outbox still enforces a unique event/destination delivery pair.

## Generic movement contract

The provider-neutral snapshot contains only:

```ts
type ErpAccountingMovementSnapshot = {
  localId: string;
  targetType: "trip" | "service";
  targetId: string;
  movementType: "payment" | "refund";
  amount: number;
  currency: string;
  provider: string;
  method?: string;
  providerReference?: string;
  occurredAt: string;
};
```

`amount` and `currency` come directly from the authoritative immutable ledger movement. Currency is never converted or cross-summed by this adapter.

The generic contract excludes:

- customer names, email addresses and phone numbers;
- protected traveller data or traveller arrays;
- card PAN/CVV or payment credentials;
- PSP raw webhook/request bodies;
- supplier costs/references and operational notes;
- inventory mutation instructions;
- internal staff notes;
- tax IDs or fiscal addresses that the core does not hold authoritatively.

## REST v1 reference adapter

Enable with:

```text
ERP_ACCOUNTING_MODE=rest
REST_ERP_ACCOUNTING_BASE_URL=https://accounting.example.com/
REST_ERP_ACCOUNTING_BEARER_TOKEN=...
REST_ERP_ACCOUNTING_TIMEOUT_MS=10000
REST_ERP_ACCOUNTING_MAX_RESPONSE_BYTES=262144
```

Production endpoints must use HTTPS. HTTP is accepted only for localhost during development.

Request:

```text
POST /v1/accounting/movements/upsert
X-OTP-Accounting-Contract-Version: 1
X-OTP-Request-Id: ...
X-OTP-Operation: upsert
Idempotency-Key: otp-erp:{eventId}:movement
Authorization: Bearer ...
```

Example body:

```json
{
  "entity": "accounting-movement",
  "operation": "upsert",
  "movement": {
    "localId": "pay-example",
    "targetType": "trip",
    "targetId": "res-example",
    "movementType": "payment",
    "amount": 250,
    "currency": "EUR",
    "provider": "manual",
    "method": "bank-transfer",
    "providerReference": "BANK-2026-001",
    "occurredAt": "2026-08-26T12:00:00.000Z"
  }
}
```

Successful responses must return the same contract header and:

```json
{
  "externalId": "erp-movement-123",
  "outcome": "upserted"
}
```

`outcome` may be `upserted` or `unchanged`.

The client rejects redirects, disables caching, uses a bounded timeout/response size and retries only a bounded transient set (`429`, `502`, `503`, `504`) inside each durable delivery attempt.

## Durable delivery and replay

ERP/accounting does not create another queue. It uses the Phase 8A/8B integration outbox and worker:

- per-delivery lease;
- retry/backoff;
- attempt history;
- dead-letter retention;
- Admin replay;
- scheduler/manual worker locking;
- existing queue health and delivery diagnostics.

The virtual destination is internal to the platform and is not configurable as a generic signed webhook subscription. Financial ERP events therefore do not expand the generic webhook data surface.

If ERP synchronization is disabled, ERP-only payment events are not retained as orphan outbox events.

## External references and audit

Collections:

```text
travel_erp_accounting_links
travel_erp_accounting_audit
```

The link collection maps the immutable local payment movement ID to the external ERP/accounting ID.

Audit metadata stores identifiers, adapter ID, operation/outcome, HTTP status and timestamp. It does **not** store:

- amount/currency;
- provider references;
- customer PII;
- raw HTTP bodies;
- Bearer credentials.

Admin can inspect the integration at:

```text
/operator/integrations/erp
```

Full movement values remain in the payment ledger and Finance reporting rather than being duplicated into integration audit metadata.

## Fiscal documents are a separate capability

A legally compliant invoice/credit-note capability requires explicit jurisdictional requirements and authoritative billing data. For Spain/EU that may include, depending on the transaction and customer, seller/buyer tax identity, fiscal address, tax breakdown, invoice series/numbering, issue/supply dates and rectification rules.

Those fields must be modeled and validated before a future adapter can claim statutory invoice generation. Phase 8C-4 intentionally does not infer them from contact or reservation data.

## Adding a vendor-specific adapter

A vendor adapter should remain behind `ErpAccountingAdapter` and perform vendor-specific concerns downstream, for example:

- chart-of-accounts mapping;
- journal/debit/credit mapping;
- tax code mapping when authoritative tax data exists;
- business-unit/cost-centre mapping;
- API authentication and vendor payload schemas.

Do not leak those fields into the provider-neutral payment ledger or booking domain.
