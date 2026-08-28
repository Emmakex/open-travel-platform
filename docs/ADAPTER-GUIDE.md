# Adapter implementation guide

Open Travel Platform is provider-neutral. Product routes consume explicit capability interfaces; production integrations implement those interfaces behind trusted adapters.

Phase 10.3 formalizes these extension boundaries. Before adding or changing an adapter, read [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md) for authority, compatibility/versioning and completion rules.

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

A production adapter may use a CMS, database, REST/GraphQL service or supplier catalogue. Normalize provider payloads before returning them to UI code. Do not expose backend-specific response objects across the repository boundary.

## Identity

Interface: `repositories/identity-repository.ts`

Responsibilities:
- resolve the current trusted identity;
- resolve a customer profile for an authorized customer identity.

Typical implementations may wrap OAuth/OIDC, SSO or an external session service. Roles and capabilities must come from a trusted server-side identity source rather than browser-selected values.

Identity adapters do not receive authority to mutate booking/payment state unless a separate explicit contract exists.

## Customer booking

Interface: `repositories/booking-repository.ts`

Responsibilities:
- read availability;
- read an identity-scoped reservation list/detail;
- create a reservation;
- perform allowed customer cancellation.

The application validates trip, availability, party size and trusted pricing before calling `createReservation`. A production adapter must still enforce the persistence/concurrency guarantees required by its implementation because availability can change between validation and commit.

Use deterministic idempotency and concurrency controls where duplicate or competing writes are possible.

The bundled `BOOKING_MODE=rest` implementation demonstrates the reference `/v1` contract, runtime validation, ownership/scope checks, production HTTPS, server-only authentication and stable idempotency keys. See [`REST-BOOKING-ADAPTER.md`](REST-BOOKING-ADAPTER.md).

## Staff operations

Interface: `repositories/operations-repository.ts`

Responsibilities:
- list operational reservations;
- resolve reservation detail;
- compute/read operational summary data;
- change allowed reservation states;
- expose audit events.

This boundary is intentionally separate from customer booking. Production operations must repeat authorization and transition validation server-side. A CRM or ERP adapter must not become an implicit staff-operations API.

## Supplier fulfilment

Interface: `repositories/supplier-fulfilment-adapter.ts`

Responsibilities:
- submit a supplier request;
- synchronize a normalized external supplier status/reference;
- cancel an existing supplier request.

The external adapter is deliberately subordinate to the local fulfilment workflow. A remote response must be audited/validated before local application and re-enter the existing local transition path.

Provider-specific adapters must not mutate customer totals, payment/refund accounting, inventory, supplier cost, traveller records or protected post-purchase data.

The generic REST reference adapter uses a versioned `/v1/fulfilment` contract. Mutating operations use stable idempotency keys. See [`SUPPLIER-FULFILMENT-ADAPTER.md`](SUPPLIER-FULFILMENT-ADAPTER.md).

## CRM synchronization

Interface: `CrmSyncAdapter`.

CRM is **downstream-only**. It may receive normalized customer/reservation snapshots through the durable integration pipeline, but it does not receive local booking, pricing, inventory, supplier-fulfilment or payment-ledger mutation authority.

Requirements:
- explicit outbound allowlists;
- stable event-derived idempotency;
- no protected Traveller Data;
- no raw provider payload propagation back into core domains;
- no reverse mutation path unless a new separately reviewed capability contract is introduced.

See [`CRM-SYNC-ADAPTER.md`](CRM-SYNC-ADAPTER.md).

## ERP / accounting synchronization

Interface: `ErpAccountingAdapter`.

ERP/accounting is **downstream-only** from authoritative local `succeeded` payment/refund ledger movements.

Requirements:
- preserve source amount/currency/reference semantics from the local ledger;
- use stable event-derived idempotency;
- store external acknowledgements separately;
- never let an ERP acknowledgement rewrite reservations, inventory or payment/refund history;
- keep jurisdiction/vendor-specific tax or chart-of-accounts mapping inside the downstream adapter.

See [`ERP-ACCOUNTING-ADAPTER.md`](ERP-ACCOUNTING-ADAPTER.md).

## Delivery and failure visibility

Signed generic webhooks and `FailureTransport` are transport/observability boundaries, not business-authority adapters.

They must:
- use explicit data allowlists;
- keep credentials server-only;
- reject unsafe network targets according to the documented transport rules;
- remain bounded by timeout/response limits;
- never change booking/payment/readiness authority because a collector or endpoint failed.

See [`OUTBOUND-INTEGRATIONS.md`](OUTBOUND-INTEGRATIONS.md) and [`FAILURE-TRANSPORT.md`](FAILURE-TRANSPORT.md).

## Composition

Current composition is intentionally explicit under server-side application boundaries. Existing examples include:

```text
getTravelRepository()
getIdentityRepository()
getBookingRepository()
getOperationsRepository()
getSupplierFulfilmentAdapter()
```

Additional CRM/ERP/failure transports follow the same principle: configuration chooses a bounded implementation; page/domain code does not detect vendors implicitly.

A fork can add modes/adapters without changing page-level contracts when the existing interface is sufficient. If the interface is not sufficient, treat the change as a public contract change and apply the compatibility rules in [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md).

## Compatibility and versioning

During Phase 10.3, public extension contracts follow these principles:

- adding optional fields/capabilities with safe defaults is normally backward-compatible;
- removing/renaming required fields, changing state semantics, authority, authentication or idempotency is normally breaking;
- provider-specific API changes should be absorbed inside the adapter whenever possible;
- HTTP/event contracts should use their documented version mechanism;
- deprecation should precede removal of a public contract where practical.

Do not invent a new global extension version unless the existing boundary genuinely needs one.

## Error translation

Adapters should convert infrastructure/provider failures into stable application-level errors rather than exposing raw database errors, private infrastructure details, provider request dumps, secrets or full exception messages to the browser.

Operational logs should use safe correlation/reference IDs and the repository redaction rules.

## Browser/server boundary

Never place privileged configuration in `NEXT_PUBLIC_*` variables. Browser-visible configuration is public by definition. Privileged adapters must execute on server-side boundaries and read protected configuration from the deployment environment.

## Reference adapter checklist

A contributor-facing reference adapter should demonstrate:

1. explicit opt-in composition/configuration;
2. server-only credentials;
3. production HTTPS for external transports;
4. redirect rejection where redirects could cross trust boundaries;
5. bounded timeout and response size;
6. runtime validation before external data becomes domain data;
7. stable normalized errors;
8. deterministic idempotency for mutations where applicable;
9. audit-before-apply for external workflow state where applicable;
10. explicit outbound data allowlists;
11. no protected Traveller Data, secrets or raw payload leakage;
12. no cross-domain authority escalation.

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
9. run `npm run verify` and the adapter-specific/deployment-specific integration suite.

Phase 10.3 will add a permanent extension-contract validation gate. Documentation must not claim that gate exists until its implementation is committed and running in CI.