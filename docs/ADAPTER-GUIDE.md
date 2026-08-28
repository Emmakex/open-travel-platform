# Adapter implementation guide

Open Travel Platform is provider-neutral. Product routes consume explicit capability interfaces; production integrations implement those interfaces behind trusted adapters.

Before adding or changing an adapter, read:

- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md) — authority and Phase 10.3 lifecycle;
- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md) — code-backed public extension inventory;
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md) — compatibility, versioning, deprecation and migration;
- [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md) — contributor-facing patterns backed by real implementations.

## Core rule

An adapter receives authority only for the capability it explicitly implements. Provider-specific payloads stay inside adapters and must be normalized before crossing into stable application/domain types.

## Catalogue

Interface: `repositories/travel-repository.ts`  
Composition: `TRAVEL_DATA_MODE=demo|api|mongodb`  
Bundled: demo, HTTP API, MongoDB.

The HTTP catalogue is bounded read/source authority only. Its unversioned public routes are treated as legacy-v1 semantics: additive evolution is allowed, breaking changes require a new explicit versioned surface.

## Identity

Interface: `repositories/identity-repository.ts`  
Composition: `IDENTITY_MODE` / `STAFF_AUTH_MODE`  
Bundled: demo, MongoDB, disabled.

Roles/capabilities must come from trusted server-side identity. Identity does not gain booking/payment mutation authority.

## Booking

Interface: `repositories/booking-repository.ts`  
Composition: `BOOKING_MODE=demo|mongodb|rest|disabled`  
Bundled: demo, MongoDB, generic REST v1, disabled.

The generic `RestBookingRepository` is the official **bounded-authority repository reference** for Phase 10.3.3. It demonstrates versioned transport, server-only auth, runtime parsing, bounded network behavior, stable errors, idempotency and scope validation.

See [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md) and [`REST-BOOKING-ADAPTER.md`](REST-BOOKING-ADAPTER.md).

## Operations

Interface: `repositories/operations-repository.ts`  
Composition: `OPERATIONS_MODE=demo|mongodb|disabled`  
Bundled: demo, MongoDB, disabled.

This boundary remains separate from customer booking. Production transitions and authorization must be validated server-side.

## Payment ledger

Interface: `repositories/payment-repository.ts`  
Composition: `PAYMENT_LEDGER_MODE=mongodb|disabled`  
Bundled: MongoDB, disabled.

`PaymentRepository` is the local provider-neutral financial-ledger boundary. Stripe/Redsys are PSP/checkout integrations and do not replace the ledger repository. Browser return URLs are never authoritative payment confirmation.

A future external ledger implementation is a high-authority contract change and must preserve immutable history, amount/currency semantics, idempotency and reconciliation rules.

## Supplier fulfilment

Interface: `repositories/supplier-fulfilment-adapter.ts`  
Composition: `SUPPLIER_FULFILMENT_ADAPTER_MODE=disabled|rest`  
Bundled external implementation: generic REST v1.

`RestSupplierFulfilmentAdapter` plus `performSupplierAdapterOperation()` is the official **workflow-subordinate reference**. External responses are normalized, audited before local application, then passed through the local transition path.

The supplier cannot rewrite customer totals, payment history, inventory or Traveller Data outside a separately reviewed contract.

See [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md) and [`SUPPLIER-FULFILMENT-ADAPTER.md`](SUPPLIER-FULFILMENT-ADAPTER.md).

## CRM synchronization

Interface: `repositories/crm-sync-adapter.ts`  
Composition: `CRM_SYNC_MODE=disabled|rest`  
Bundled external implementation: generic REST v1.

`RestCrmSyncAdapter` is the official **downstream-only reference**. It sends allowlisted normalized snapshots and receives only normalized acknowledgements. It must not introduce reverse booking, pricing, inventory, fulfilment or payment authority.

See [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md) and [`CRM-SYNC-ADAPTER.md`](CRM-SYNC-ADAPTER.md).

## ERP/accounting

Interface: `repositories/erp-accounting-adapter.ts`  
Composition: `ERP_ACCOUNTING_MODE=disabled|rest`  
Bundled external implementation: generic REST v1.

ERP/accounting remains downstream-only from authoritative local `succeeded` payment/refund movements. Vendor/jurisdiction-specific mapping stays inside the adapter.

## Failure visibility

Interface: `repositories/failure-transport.ts`  
Composition: `FAILURE_TRANSPORT_MODE=disabled|rest`.

`RestFailureTransport` is the optional monitoring-only reference: normalized/redacted, best-effort and non-authoritative.

## Generic webhooks

Signed generic webhooks are a public delivery surface, not a `repositories/*` interface. `IntegrationEventEnvelope.version` versions event schema; `X-OTP-Signature: v1=...` versions the signing scheme. These are independent.

## Explicit non-extension surfaces

Do not treat arbitrary internal modules as supported plugin APIs. Current examples include:

- `lib/email.ts` / SMTP implementation;
- Stripe/Redsys PSP modules as `PaymentRepository` replacements;
- MongoDB helpers outside repository boundaries;
- arbitrary `lib/*`, `app/*` or component modules;
- private Kairoseth/customer integrations.

## Composition

Verified composition selectors include:

```text
getTravelRepository()
getIdentityRepository()
getBookingRepository()
getOperationsRepository()
getPaymentRepository()
getSupplierFulfilmentAdapter()
getCrmSyncAdapter()
getErpAccountingAdapter()
getFailureTransport()
```

Configuration chooses a bounded implementation. Page/domain code must not detect vendors implicitly.

## Compatibility/versioning

Phase 10.3.2 is complete. Apply [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md):

- in-process interfaces follow core SemVer;
- preserve existing v1 paths/header names exactly;
- optional additive changes are normally compatible;
- required-field/method, authority, authentication, state or idempotency changes are normally breaking;
- provider API churn should be absorbed inside the adapter;
- mutating adapters must not silently downgrade protocol versions;
- breaking public evolution requires an explicit version/migration path.

## Reference pattern — Phase 10.3.3 COMPLETE

The designated references are documented in [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md):

1. `RestBookingRepository` — bounded repository authority;
2. `RestSupplierFulfilmentAdapter` + coordinator — audit-before-apply/workflow-subordinate;
3. `RestCrmSyncAdapter` — downstream-only;
4. `RestFailureTransport` — optional monitoring-only.

They are already exercised by `tests/rest-adapter-contracts.ts` where applicable, including contract versions, invalid payload/content type, scope, response-size limits, retries and stable idempotency keys.

## New adapter checklist

A new external adapter should demonstrate:

1. explicit opt-in composition;
2. server-only privileged credentials;
3. production HTTPS and redirect rejection;
4. bounded timeout/response size;
5. runtime validation before domain entry;
6. normalized stable errors;
7. deterministic idempotency for mutations;
8. audit-before-apply when external state affects local workflow;
9. explicit outbound allowlists;
10. no protected Traveller Data/secrets/raw payload leakage;
11. no cross-domain authority escalation;
12. correct public version behavior and deliberate migration for breaking changes.

## Testing

Before production use:

- test valid/invalid provider mapping;
- test auth/error/not-found behavior;
- test concurrency/idempotency for writes;
- test allowed/rejected transitions;
- test scope/authority rejection;
- test version/header behavior;
- confirm protected values cannot leak;
- run adapter-specific tests and `npm run verify`.

Phase 10.3.4 is the next slice and will add the permanent extension-contract validation gate. Documentation must not claim that gate exists until it is implemented and running in CI.
