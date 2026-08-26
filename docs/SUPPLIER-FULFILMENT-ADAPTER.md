# Supplier fulfilment adapter

Phase 8C-2 adds an optional provider-neutral boundary for sending supplier fulfilment operations to an external system while keeping the existing Open Travel Platform fulfilment state, audit history and customer-facing safeguards authoritative.

The adapter is deliberately narrower than the local fulfilment model. It may exchange operational component identifiers, supplier name/reference, deadline and normalized fulfilment status. It does **not** own customer prices, payment accounting, supplier costs, inventory, traveller records or protected post-purchase data.

## Deployment mode

External synchronization is opt-in:

```text
SUPPLIER_FULFILMENT_ADAPTER_MODE=disabled
```

Supported modes:

- `disabled` — default; manual supplier tracking continues normally;
- `rest` — enables the version-1 REST reference adapter.

The REST adapter requires writable MongoDB operations mode because external responses are applied through the existing audited local fulfilment store.

```text
OPERATIONS_MODE=mongodb
SUPPLIER_FULFILMENT_ADAPTER_MODE=rest
REST_SUPPLIER_FULFILMENT_BASE_URL=https://supplier.example.com/otp/
REST_SUPPLIER_FULFILMENT_BEARER_TOKEN=<server-only-secret>
REST_SUPPLIER_FULFILMENT_TIMEOUT_MS=10000
REST_SUPPLIER_FULFILMENT_MAX_RESPONSE_BYTES=262144
```

Production targets must use HTTPS. HTTP is accepted only for localhost during development. Credentials, query parameters and fragments are not accepted in the configured base URL. The bearer token must never use a `NEXT_PUBLIC_*` variable.

## REST contract

The reference adapter calls:

```text
POST /v1/fulfilment/request
POST /v1/fulfilment/status
POST /v1/fulfilment/cancel
```

Every request includes:

```text
X-OTP-Contract-Version: 1
X-OTP-Request-Id: <unique-request-id>
X-OTP-Operation: request | status | cancel
Authorization: Bearer <token>        # when configured
Idempotency-Key: <stable-key>        # request/cancel only
Content-Type: application/json
```

The request payload is intentionally limited:

```json
{
  "operation": "request",
  "fulfilment": {
    "id": "ful-...",
    "targetType": "trip-reservation",
    "targetId": "res-...",
    "componentType": "accommodation",
    "componentKey": "accommodation:...",
    "componentLabel": "Hotel · Room · dates",
    "supplierName": "Example Hotel",
    "reference": "optional-existing-reference",
    "deadline": "2026-09-10"
  }
}
```

The generic adapter intentionally excludes:

- customer price, reservation total or payment terms;
- payment/refund ledger data;
- supplier cost and supplier cost currency;
- inventory quantities or inventory mutation instructions;
- traveller names, dates of birth, nationality or document numbers;
- protected post-purchase traveller fields;
- internal supplier notes;
- voucher reference-disclosure approval state.

## Response

A successful response must include the same contract-version header:

```text
X-OTP-Contract-Version: 1
```

and a JSON body such as:

```json
{
  "fulfilment": {
    "status": "confirmed",
    "reference": "HOTEL-ABC-123",
    "message": "Optional operational message"
  }
}
```

Accepted statuses are:

- `requested`
- `confirmed`
- `rejected`
- `cancelled`

`not-requested` is a local pre-request state and cannot be returned by an external supplier.

The response parser ignores no arbitrary provider object: unsupported shapes, statuses or oversized text fields fail contract validation before they can reach local fulfilment state.

## Local state remains authoritative

An external response is never written directly into MongoDB.

The flow is:

1. an authorized staff member with the `suppliers` capability starts the external operation;
2. the adapter performs the remote request;
3. the normalized remote response is persisted to `travel_supplier_fulfilment_adapter_audit` with outcome `received`;
4. only after that audit succeeds, the response is passed to the existing `saveSupplierFulfilment()` boundary;
5. normal local transition validation runs;
6. the adapter audit is enriched as `applied`, `no-change`, `conflict` or `failed`.

If the initial response audit cannot be persisted, the external response is **not** applied locally. Outcome enrichment after the initial audit is best-effort so a successfully applied local change is not falsely reported as failed because of a later audit-update problem.

If an external status conflicts with the current local state machine, the platform records a conflict and refuses to force the transition.

## Idempotency and retries

`request` and `cancel` operations receive a deterministic `Idempotency-Key` derived from the local fulfilment record revision, current state and reference. Transport retries reuse the same key and request ID for that operation invocation.

The reference adapter retries at most once for transient transport conditions such as `429`, `502`, `503`, `504`, network failures or timeouts. Supplier APIs should persist and deduplicate idempotency keys for mutating operations.

Status synchronization is read-like from the platform's point of view and does not send an idempotency key.

## Transport boundaries

The reference adapter:

- uses server-side `fetch` only;
- disables cache;
- rejects redirects;
- has a server-clamped timeout;
- caps streamed response size instead of trusting `Content-Length` alone;
- requires the exact contract-version response header;
- translates provider HTTP failures into stable application error codes;
- never exposes raw provider error bodies to the browser.

For private/custom supplier APIs with additional network requirements, implement `SupplierFulfilmentAdapter` behind the same interface instead of weakening the generic adapter.

## Supplier reference disclosure remains separate

A reference returned by a supplier API is stored as an internal supplier reference. It is **not** automatically exposed on customer vouchers.

The existing explicit supplier-reference disclosure workflow remains authoritative. If the reference changes, a previous customer-display approval no longer applies to the new value.

## Supplier costs remain local

The external response contract cannot return supplier cost. When applying an external status/reference, the platform explicitly carries forward the existing local `supplierCost` and `supplierCurrency` values.

Supplier integration therefore cannot silently rewrite:

- customer booking totals;
- payment/refund ledger;
- internal supplier cost;
- trip/service/room inventory.

## Audit

Collection:

```text
travel_supplier_fulfilment_adapter_audit
```

Audit records contain operational metadata such as:

- fulfilment/target/component identifiers;
- adapter and operation;
- request ID;
- outcome;
- normalized returned status/reference/message;
- stable error code;
- staff actor;
- timestamps.

They do not store the bearer token, raw HTTP request/response bodies, supplier costs, payment values or protected traveller values.

## Extending the boundary

Custom adapters implement:

```text
repositories/supplier-fulfilment-adapter.ts
```

Keep provider-specific authentication, payload mapping and status translation inside the adapter. The platform-facing result should remain normalized to the provider-neutral fulfilment contract.

Do not let a supplier adapter bypass `saveSupplierFulfilment()` or write provider-specific fields into core reservation documents.
