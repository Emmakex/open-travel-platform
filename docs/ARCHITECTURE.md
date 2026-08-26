# Architecture

Open Travel Platform uses explicit ports-and-adapters boundaries so catalogue, identity, booking, operations, payments and integrations can evolve independently without leaking one vendor's payloads or authority into core domains.

The public MIT core is designed to stay provider-neutral. Kairoseth Travel is the official hosted/reference implementation built on those same boundaries.

## Capability map

```text
Public / customer UI
        |
        +------------------------------+
        |                              |
        v                              v
TravelRepository                IdentityRepository
        |                              |
 demo / HTTP / MongoDB          demo / MongoDB
        |
 catalogue + departures
        |
        v
BookingRepository
   /       |       \
 demo    MongoDB    REST /v1
        |
 trip reservations + transactional inventory
        |
 accommodation / package snapshots
        |
        +---------------- independent service reservations
        |
        v
PaymentRepository
        |
provider-neutral payment/refund ledger
        |
   Stripe / Redsys / manual movements
        |
        +---------------- succeeded movement events --------+
                                                             |
Operator / Admin                                             |
        |                                                    |
Operations / RBAC / audit                                    |
        |                                                    |
        +-- documents / reports / tasks                      |
        |                                                    |
        +-- supplier fulfilment --> SupplierFulfilmentAdapter|
        |                            disabled / REST v1       |
        |                                                    |
customer + reservation events                                |
        |                                                    |
        +---------- transactional integration outbox <-------+
                              |
                              v
                    durable integration worker
                       /        |         \
             signed webhooks   CRM REST   ERP/accounting REST
                               |          |
                        downstream only   downstream only
```

## Core layers

### `domain/`

Pure TypeScript entities and value shapes. Domain code must not depend on Next.js, browser APIs, MongoDB or vendor SDKs.

Important domain distinctions are intentionally preserved:

- reservation state is not payment state;
- payment/refund movements are immutable financial history;
- protected post-purchase traveller values live outside ordinary reservation/customer documents;
- supplier fulfilment state does not rewrite customer totals;
- external CRM/ERP acknowledgements do not become authoritative booking/payment state.

### `repositories/`

Provider-neutral capability interfaces consumed by application code. Current boundaries include catalogue/travel, identity, booking, operations, payment accounting, supplier fulfilment, CRM synchronization and ERP/accounting synchronization.

Application code should depend on these capabilities rather than one external API schema.

### `adapters/`

Infrastructure implementations behind the repository/capability contracts. Current examples include:

- demo, HTTP and MongoDB catalogue adapters;
- demo/MongoDB identity and booking capabilities;
- generic REST `BookingRepository` v1;
- MongoDB payment ledger;
- Stripe and Redsys payment-provider adapters;
- REST supplier-fulfilment adapter;
- REST CRM synchronization adapter;
- REST ERP/accounting movement adapter.

Vendor-specific payloads must be normalized inside adapters and must not leak into the core domain model.

### `lib/`

Capability composition, MongoDB connection/index management, authorization, security helpers, payment/integration orchestration, outbox/worker implementation and server-only configuration.

### `app/` and `components/`

Next.js presentation layer and server actions. Customer and Operator surfaces call trusted server-side capability boundaries rather than embedding provider credentials or authoritative rules in the browser.

## Catalogue and data modes

The catalogue can be independently composed through:

```text
TRAVEL_DATA_MODE=demo | api | mongodb
```

MongoDB catalogue persistence uses stable public/domain IDs and removes MongoDB implementation details before entities cross the repository boundary.

Browser-visible `NEXT_PUBLIC_*` variables must never contain credentials or privileged tokens.

## Identity boundaries

Customer and staff identities use separate sessions and authorization paths.

```text
IDENTITY_MODE=demo | mongodb | disabled
STAFF_AUTH_MODE=demo | mongodb | disabled
```

Privileged Operator/Admin actions are authorized server-side. Browser-supplied roles are never authoritative.

## Booking boundaries

Booking is composed independently:

```text
BOOKING_MODE=demo | mongodb | rest | disabled
```

The REST mode is a versioned generic adapter behind `BookingRepository`. External JSON must pass runtime contract validation plus local ownership/scope checks before it becomes booking-domain data.

MongoDB booking writes use transactions where inventory/reservation integrity requires atomicity.

## Operations and supplier fulfilment

Staff operations remain a separate capability from customer booking. Operators do not gain unrestricted booking/database methods simply because they can manage reservations.

Supplier fulfilment keeps local workflow state authoritative while optionally synchronizing through `SupplierFulfilmentAdapter`:

```text
SUPPLIER_FULFILMENT_ADAPTER_MODE=disabled | rest
```

External supplier responses are audited before application and re-enter the local fulfilment transition boundary. External systems cannot force invalid transitions, overwrite local supplier costs/currency or auto-disclose supplier references to customers.

## Payment accounting boundary

`PaymentRepository` stores provider-neutral payment/refund movements separately from reservation state.

A payment movement can be:

```text
pending | succeeded | failed
```

Only `succeeded` payment/refund movements are treated as finalized financial facts for the generic ERP/accounting sync.

Stripe/Redsys browser returns are non-authoritative; signed server-side provider notifications finalize provider-backed movements.

## Transactional integration outbox

Outbound business integration events use one durable MongoDB outbox and delivery queue.

Key properties:

- event and related local mutation commit/rollback together when the source is MongoDB-backed;
- unique delivery per `(eventId, endpointId)`;
- at-least-once delivery semantics;
- stable idempotency keys at adapter boundaries;
- per-delivery lease and crash recovery;
- bounded retry/backoff and dead-letter;
- preserved attempt history and Admin replay;
- shared scheduler/manual worker lock;
- queue health and delivery diagnostics;
- bounded retention for completed successful history.

The platform does **not** create one queue per CRM/ERP/provider. Dedicated business adapters are virtual destinations on the same delivery infrastructure.

## Event data surfaces

Not every integration event is available to every destination.

### Generic signed webhooks

Generic Admin-configured webhooks receive only the explicitly safe reservation-event subset:

```text
trip.reservation.created
trip.reservation.status.changed
service.reservation.created
service.reservation.status.changed
```

Protected post-purchase traveller values and provider-specific payloads are excluded.

### CRM

CRM-only customer triggers include:

```text
customer.created
customer.profile.updated
```

These events are not selectable by generic webhooks. CRM receives allowlisted contact/reservation snapshots and is downstream-only: it cannot mutate booking, pricing, inventory, supplier fulfilment or payment-ledger state.

Configuration:

```text
CRM_SYNC_MODE=disabled | rest
```

### ERP/accounting

ERP/accounting receives only:

```text
payment.transaction.succeeded
```

The event is isolated from generic webhooks and CRM. The adapter reloads the authoritative local ledger movement before delivery and exports exact amount/currency/source reference values.

Configuration:

```text
ERP_ACCOUNTING_MODE=disabled | rest
```

ERP acknowledgements persist only external-link/audit metadata and cannot rewrite the local ledger or reservation history.

The generic ERP contract intentionally represents accounting-ready movements, not jurisdiction-specific statutory invoices. Legal invoicing requires authoritative fiscal/billing data and market-specific rules that must be modeled explicitly before such a capability can claim compliance.

## Trust boundaries

Current server-side security rules include:

- customer routes/actions require a resolved customer identity;
- Operator actions require authorized staff identity and granular capabilities;
- Admin-only configuration pages re-check Admin authority server-side;
- booking totals, availability, ownership and state transitions are server validated;
- payment state is finalized only by trusted server-side paths;
- provider secrets and encryption keys remain server-only;
- protected traveller data is encrypted separately and exposed only through purpose/capability-bound flows;
- generic webhook URLs receive SSRF/DNS-rebinding protection and validated-IP delivery;
- integration worker execution requires a separate server-only credential;
- CRM/ERP REST credentials never use `NEXT_PUBLIC_*` variables;
- external systems cannot silently expand their authority through response payloads.

## Production-hardening boundary

With Phase 8 complete, the next architectural priority is Phase 9: strengthen the existing capabilities rather than expanding provider surface area by default.

Primary hardening areas are:

- browser E2E and MongoDB concurrency testing;
- CSP/security headers, CSRF/origin review and rate limiting;
- cookie/session review and privileged-action audit coverage;
- structured logs, health/readiness and centralized errors;
- backup/restore, key recovery/rotation and disaster-recovery procedures;
- dependency/secret scanning;
- GDPR/privacy/retention/export/deletion workflows;
- database/index/performance review;
- credentialed Stripe/Redsys TEST/LIVE E2E when provider accounts are available.

Optional CMS, SSO, PSP and jurisdiction-specific accounting adapters should be added when commercially justified without weakening the capability boundaries above.
