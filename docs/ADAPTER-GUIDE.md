# Adapter implementation guide

Open Travel Platform is provider-neutral. Product routes consume explicit capability interfaces; production integrations implement those interfaces behind trusted adapters.

Phase 10.3 formalizes these extension boundaries. Before adding or changing an adapter, read:

- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md) for authority and lifecycle rules;
- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md) for the code-backed list of supported public extension surfaces;
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md) for the compatibility, versioning, deprecation and migration policy.

## Core adapter rule

An adapter receives authority only for the capability it explicitly implements. A provider response must never silently gain authority over booking, pricing, inventory, payments, traveller data or staff workflows outside that contract.

Provider-specific payloads belong inside adapters. Normalize them into stable domain/application types before they cross the boundary.

## Travel catalogue

Interface: `repositories/travel-repository.ts`

Responsibilities:
- list destinations;
- resolve a destination by slug;
- list trips;
- resolve a trip by slug.

Current composition: `getTravelRepository()` with `TRAVEL_DATA_MODE=demo|api|mongodb`.

Bundled implementations: demo, HTTP API and MongoDB.

A production adapter may use a CMS, database, REST/GraphQL service or supplier catalogue. Normalize provider payloads before returning them to UI code. Do not expose backend-specific response objects across the repository boundary.

The HTTP catalogue source is a bounded read/source contract; it does not gain booking, identity or payment authority. Its current unversioned routes are frozen as legacy-v1 semantics: additive optional fields are allowed, but a future breaking catalogue contract must use an explicit new version rather than changing existing routes in place. See [`API-CONTRACT.md`](API-CONTRACT.md) and [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

## Identity

Interface: `repositories/identity-repository.ts`

Responsibilities:
- resolve the current trusted identity;
- resolve a customer profile for an authorized customer identity.

Current composition: `getIdentityRepository()` with `IDENTITY_MODE` / `STAFF_AUTH_MODE`.

Bundled implementations: demo, MongoDB and disabled composition.

Typical future implementations may wrap OAuth/OIDC, SSO or an external session service. Roles and capabilities must come from a trusted server-side identity source rather than browser-selected values.

Identity adapters do not receive authority to mutate booking/payment state unless a separate explicit contract exists.

## Customer booking

Interface: `repositories/booking-repository.ts`

Responsibilities:
- read availability;
- read an identity-scoped reservation list/detail;
- create a reservation;
- perform allowed customer cancellation.

Current composition: `getBookingRepository()` with `BOOKING_MODE=demo|mongodb|rest|disabled`.

Bundled implementations: demo, MongoDB, generic REST v1 and disabled.

The application validates trip, availability, party size and trusted pricing before calling `createReservation`. A production adapter must still enforce the persistence/concurrency guarantees required by its implementation because availability can change between validation and commit.

Use deterministic idempotency and concurrency controls where duplicate or competing writes are possible.

The bundled `BOOKING_MODE=rest` implementation demonstrates the reference `/v1` contract, runtime validation, ownership/scope checks, production HTTPS, server-only authentication and stable idempotency keys. See [`REST-BOOKING-ADAPTER.md`](REST-BOOKING-ADAPTER.md).

An external booking implementation does not automatically become the payment-ledger, staff-operations, supplier, CRM/ERP or protected-Traveller-Data authority.

## Staff operations

Interface: `repositories/operations-repository.ts`

Responsibilities:
- list operational reservations;
- resolve reservation detail;
- compute/read operational summary data;
- change allowed reservation states;
- expose audit events.

Current composition: `getOperationsRepository()` with `OPERATIONS_MODE=demo|mongodb|disabled`.

Bundled implementations: demo, MongoDB and disabled.

This boundary is intentionally separate from customer booking. Production operations must repeat authorization and transition validation server-side. A CRM or ERP adapter must not become an implicit staff-operations API.

## Payment ledger

Interface: `repositories/payment-repository.ts`

Responsibilities:
- compute reservation/target payment summaries;
- list authoritative payment/refund transactions;
- create and update ledger movements through the local payment domain.

Current composition: `getPaymentRepository()` with `PAYMENT_LEDGER_MODE=mongodb|disabled`.

Bundled implementations: `MongoPaymentRepository` and disabled.

`PaymentRepository` is the provider-neutral local financial-ledger boundary. **There is no generic REST `PaymentRepository` adapter in the bundled core today.**

Stripe and Redsys are separate PSP/checkout integrations. Their signed server callbacks may produce provider outcomes that are reconciled into the local ledger, but they are not `PaymentRepository` implementations. Browser return URLs are never authoritative payment confirmation.

A future external ledger implementation would be a high-authority contract change and must preserve idempotency, immutable historical movements, currency/amount semantics, reconciliation and the separation between reservation status and payment status.

See [`PAYMENTS.md`](PAYMENTS.md).

## Supplier fulfilment

Interface: `repositories/supplier-fulfilment-adapter.ts`

Responsibilities:
- submit a supplier request;
- synchronize a normalized external supplier status/reference;
- cancel an existing supplier request.

Current composition: `getSupplierFulfilmentAdapter()` with `SUPPLIER_FULFILMENT_ADAPTER_MODE=disabled|rest`.

Bundled external implementation: generic REST v1.

The external adapter is deliberately subordinate to the local fulfilment workflow. A remote response must be audited/validated before local application and re-enter the existing local transition path.

Provider-specific adapters must not mutate customer totals, payment/refund accounting, inventory, supplier cost, traveller records or protected post-purchase data.

The generic REST reference adapter uses a versioned `/v1/fulfilment` contract. Mutating operations use stable idempotency keys. See [`SUPPLIER-FULFILMENT-ADAPTER.md`](SUPPLIER-FULFILMENT-ADAPTER.md).

## CRM synchronization

Interface: `repositories/crm-sync-adapter.ts` / `CrmSyncAdapter`.

Current composition: `getCrmSyncAdapter()` with `CRM_SYNC_MODE=disabled|rest`.

Bundled external implementation: generic REST v1.

CRM is **downstream-only**. It may receive normalized customer/reservation snapshots through the durable integration pipeline, but it does not receive local booking, pricing, inventory, supplier-fulfilment or payment-ledger mutation authority.

Requirements:
- explicit outbound allowlists;
- stable event-derived idempotency;
- no protected Traveller Data;
- no raw provider payload propagation back into core domains;
- no reverse mutation path unless a new separately reviewed capability contract is introduced.

See [`CRM-SYNC-ADAPTER.md`](CRM-SYNC-ADAPTER.md).

## ERP / accounting synchronization

Interface: `repositories/erp-accounting-adapter.ts` / `ErpAccountingAdapter`.

Current composition: `getErpAccountingAdapter()` with `ERP_ACCOUNTING_MODE=disabled|rest`.

Bundled external implementation: generic REST v1.

ERP/accounting is **downstream-only** from authoritative local `succeeded` payment/refund ledger movements.

Requirements:
- preserve source amount/currency/reference semantics from the local ledger;
- use stable event-derived idempotency;
- store external acknowledgements separately;
- never let an ERP acknowledgement rewrite reservations, inventory or payment/refund history;
- keep jurisdiction/vendor-specific tax or chart-of-accounts mapping inside the downstream adapter.

See [`ERP-ACCOUNTING-ADAPTER.md`](ERP-ACCOUNTING-ADAPTER.md).

## Failure visibility

Interface: `repositories/failure-transport.ts` / `FailureTransport`.

Current composition: `getFailureTransport()` with `FAILURE_TRANSPORT_MODE=disabled|rest`.

Bundled external implementation: generic REST collector transport.

This is a monitoring-only, best-effort boundary. It must never change booking/payment/integration/readiness authority because a collector failed.

Requirements include explicit data allowlists, safe correlation IDs, central redaction, bounded network behavior and no customer/traveller PII, credentials, raw provider payloads or other prohibited fields.

See [`FAILURE-TRANSPORT.md`](FAILURE-TRANSPORT.md).

## Generic outbound webhooks

Signed generic webhooks are a public delivery surface but **not** a `repositories/*` adapter interface. They are driven by the transactional integration outbox and durable delivery worker.

They are downstream-only: receiving a reservation event does not grant a subscriber reverse mutation authority over booking, inventory, payment, traveller or staff state.

`IntegrationEventEnvelope.version` versions the event schema. `X-OTP-Signature: v1=...` versions the signing scheme. These are independent compatibility dimensions and must not be bumped together unless both contracts actually change.

See [`OUTBOUND-INTEGRATIONS.md`](OUTBOUND-INTEGRATIONS.md), [`INTEGRATION-OPERATIONS.md`](INTEGRATION-OPERATIONS.md) and [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

## What is not a public extension contract

Do not treat arbitrary internal modules as supported plugin APIs.

Current examples that are explicitly **not** first-class public extension points:

- `lib/email.ts` / SMTP service implementation;
- Stripe/Redsys PSP modules as replacements for `PaymentRepository`;
- MongoDB helper/store modules reached outside a repository boundary;
- arbitrary `lib/*`, `app/*` or component modules;
- private Kairoseth/customer adapters that are intentionally kept outside the MIT core.

See the rationale and full list in [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md).

## Composition

Current public capability composition is explicit. Verified examples include:

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

Configuration chooses a bounded implementation; page/domain code does not detect vendors implicitly.

A fork can add modes/adapters without changing page-level contracts when the existing interface is sufficient. If the interface is not sufficient, treat the change as a public contract change and apply the compatibility rules in [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

## Compatibility and versioning

Phase 10.3.2 is complete. The full policy lives in [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

Key rules:

- in-process interfaces follow the core release SemVer; do not add artificial per-interface version constants;
- preserve current v1 wire paths and header names exactly;
- adding optional fields/capabilities with safe defaults is normally backward-compatible;
- removing/renaming required fields, changing state semantics, authority, authentication or idempotency is normally breaking;
- provider-specific API changes should be absorbed inside the adapter whenever possible;
- the legacy unversioned HTTP catalogue cannot be broken in place;
- event-schema versions and signature-scheme versions are independent;
- mutating adapters must never silently downgrade from a newer wire version to an older one;
- deprecation and migration guidance should precede ordinary removal of a public contract.

## Error translation

Adapters should convert infrastructure/provider failures into stable application-level errors rather than exposing raw database errors, private infrastructure details, provider request dumps, secrets or full exception messages to the browser.

Operational logs should use safe correlation/reference IDs and the repository redaction rules.

## Browser/server boundary

Never place privileged configuration in `NEXT_PUBLIC_*` variables. Browser-visible configuration is public by definition. Privileged adapters must execute on server-side boundaries and read protected configuration from the deployment environment.

The current HTTP catalogue mode is intentionally read/source oriented and may use browser-visible public configuration; that exception does not permit placing secrets in `NEXT_PUBLIC_*`.

## Reference adapter checklist — Phase 10.3.3

A contributor-facing reference adapter should demonstrate:

1. explicit opt-in composition/configuration;
2. server-only credentials for privileged transports;
3. production HTTPS for external transports;
4. redirect rejection where redirects could cross trust boundaries;
5. bounded timeout and response size;
6. runtime validation before external data becomes domain data;
7. stable normalized errors;
8. deterministic idempotency for mutations where applicable;
9. audit-before-apply for external workflow state where applicable;
10. explicit outbound data allowlists;
11. no protected Traveller Data, secrets or raw payload leakage;
12. no cross-domain authority escalation;
13. preservation of the existing public version identifier when the contract is unchanged;
14. provider-version upgrades absorbed inside the adapter where possible;
15. explicit migration behavior for a deliberate v1 → v2 transition, with no hidden mutation fallback.

## Testing a new adapter

Before production use:

1. confirm valid/invalid provider-to-domain mapping;
2. verify not-found/error behavior;
3. test authorization independently from UI visibility;
4. test concurrency/idempotency for writes;
5. test allowed and rejected state transitions;
6. confirm protected values never leak to browser/provider payloads;
7. confirm provider responses cannot rewrite unrelated customer pricing/payment/booking authority;
8. verify version/header behavior for versioned contracts;
9. verify migration behavior when introducing a new contract version;
10. run `npm run verify` and the adapter-specific/deployment-specific integration suite.

Phase 10.3.4 will add a permanent extension-contract validation gate. Documentation must not claim that gate exists until its implementation is committed and running in CI.
