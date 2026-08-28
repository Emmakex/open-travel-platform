# Public extension-point inventory and authority map

<p align="center"><strong>English</strong> · <a href="./EXTENSION-POINT-INVENTORY.es.md">Español</a></p>

Status: **Phase 10.3.1 — COMPLETE**  
Scope: code-backed inventory of public extension boundaries in the MIT core  
Reference revision: Phase 10.3 branch baseline, 28 August 2026

## Purpose

This document records the extension points that actually exist in the codebase and the authority each one is allowed to exercise. It is the implementation-backed closeout artifact for Phase 10.3.1.

The inventory deliberately distinguishes a **public extension contract** from an internal implementation detail. A module is not a public plugin API merely because it can be replaced in a fork.

## Inventory method

For Phase 10.3.1, a first-class in-process extension point is an explicit interface under `repositories/` that is selected through an application composition boundary. Network delivery surfaces such as generic signed webhooks are recorded separately because they are public integration contracts even though they are not represented by a `repositories/*` interface.

The audit found **9 first-class repository/adapter interfaces**:

```text
repositories/booking-repository.ts
repositories/crm-sync-adapter.ts
repositories/erp-accounting-adapter.ts
repositories/failure-transport.ts
repositories/identity-repository.ts
repositories/operations-repository.ts
repositories/payment-repository.ts
repositories/supplier-fulfilment-adapter.ts
repositories/travel-repository.ts
```

## Authority vocabulary

- **bounded source/repository authority** — the selected implementation is authoritative only for the capability represented by that repository interface;
- **local authoritative state** — the application-owned store/state machine remains the source of truth, even when an external provider contributes events or acknowledgements;
- **workflow-subordinate** — external state can be synchronized only after local audit/validation and cannot bypass the local transition model;
- **downstream-only** — the external system receives normalized data but has no reverse mutation authority over the originating core domain;
- **monitoring-only** — delivery is observational and must never become a dependency for business authority or readiness.

## Verified extension inventory

| Capability | Public interface | Composition / configuration | Bundled implementations | External/network contract | Authority classification |
|---|---|---|---|---|---|
| Catalogue | `TravelRepository` | `getTravelRepository()` / `TRAVEL_DATA_MODE=demo|api|mongodb` | `DemoTravelRepository`, `HttpTravelRepository`, `MongoTravelRepository` | Read-only HTTP catalogue contract in `docs/API-CONTRACT.md` when `api` is selected | Bounded catalogue source authority only |
| Identity | `IdentityRepository` | `getIdentityRepository()` / `IDENTITY_MODE`, `STAFF_AUTH_MODE` | demo, MongoDB, disabled composition | No generic external identity network contract is bundled today | Trusted server-side identity/profile source only |
| Booking | `BookingRepository` | `getBookingRepository()` / `BOOKING_MODE=demo|mongodb|rest|disabled` | `DemoBookingRepository`, `MongoBookingRepository`, `RestBookingRepository`, disabled | REST v1 contract in `lib/rest-booking-contract.ts` and `docs/REST-BOOKING-ADAPTER.md` | Bounded booking authority; ownership/scope/inventory/pricing invariants remain mandatory |
| Operations | `OperationsRepository` | `getOperationsRepository()` / `OPERATIONS_MODE=demo|mongodb|disabled` | `DemoOperationsRepository`, `MongoOperationsRepository`, disabled | No generic external operations contract is bundled today | Local/server-side staff workflow authority |
| Payments / ledger | `PaymentRepository` | `getPaymentRepository()` / `PAYMENT_LEDGER_MODE=mongodb|disabled` | `MongoPaymentRepository`, disabled | **No external `PaymentRepository` REST contract is bundled**; Stripe/Redsys are separate PSP integrations | Local authoritative payment/refund ledger |
| Supplier fulfilment | `SupplierFulfilmentAdapter` | `getSupplierFulfilmentAdapter()` / `SUPPLIER_FULFILMENT_ADAPTER_MODE=disabled|rest` | `RestSupplierFulfilmentAdapter`, disabled | REST v1 contract in `lib/rest-supplier-fulfilment-contract.ts` and supplier adapter docs | Workflow-subordinate external synchronization |
| CRM synchronization | `CrmSyncAdapter` | `getCrmSyncAdapter()` / `CRM_SYNC_MODE=disabled|rest` | `RestCrmSyncAdapter`, disabled | REST v1 contract in `lib/rest-crm-contract.ts` and CRM adapter docs | Downstream-only |
| ERP/accounting sync | `ErpAccountingAdapter` | `getErpAccountingAdapter()` / `ERP_ACCOUNTING_MODE=disabled|rest` | `RestErpAccountingAdapter`, disabled | REST v1 contract in `lib/rest-erp-accounting-contract.ts` and ERP adapter docs | Downstream-only from authoritative local `succeeded` ledger movements |
| Failure visibility | `FailureTransport` | `getFailureTransport()` / `FAILURE_TRANSPORT_MODE=disabled|rest` | `RestFailureTransport`, disabled/null | Versioned `FailureTransportEvent` schema plus `docs/FAILURE-TRANSPORT.md` | Monitoring-only, best effort, non-authoritative |

### Additional public delivery surface: generic signed webhooks

Generic outbound webhooks are a public integration surface even though they are not a `repositories/*` interface. They are driven by the transactional integration outbox and the built-in signed HTTPS delivery pipeline.

Authority: **downstream-only event delivery**. A webhook subscriber does not gain mutation authority over booking, inventory, payment, traveller, supplier or staff state merely by receiving an event.

See `docs/OUTBOUND-INTEGRATIONS.md` and `docs/INTEGRATION-OPERATIONS.md`.

## Authority map

```text
Catalogue source
      |
      v
TravelRepository --------------------------> catalogue domain / UI

Trusted identity source
      |
      v
IdentityRepository ------------------------> server auth / customer profile

Customer booking flow
      |
      v
BookingRepository -------------------------> booking state + inventory
      |
      +-------------------------------------> PaymentRepository
                                                   |
                                                   v
                                             local payment ledger
                                                   ^
                                                   |
                              signed Stripe/Redsys callbacks
                              browser returns --------X
                              (not authoritative)

Local operations / reservation state
      |
      v
SupplierFulfilmentAdapter -----------------> supplier system
      ^                                         |
      |                                         v
      +---- audit + normalize + local workflow validation

Transactional integration outbox
      |
      +----> CRM adapter --------------------> downstream only
      |
      +----> ERP/accounting adapter ---------> downstream only
      |
      +----> signed generic webhooks --------> downstream only

Operational failure event
      |
      v
FailureTransport --------------------------> monitoring collector
                                              monitoring only
```

## Boundary notes by capability

### Catalogue

`TravelRepository` is the catalogue source boundary. The HTTP implementation may consume another CMS/API, but provider response objects must be normalized to the shared travel domain types before crossing the boundary. A catalogue source never gains booking, identity or payment authority.

### Identity

`IdentityRepository` is a trusted server-side identity/profile boundary. Browser-selected roles or capabilities are never authoritative. Replacing the identity source does not grant the identity provider booking, payment or staff-workflow mutation authority.

### Booking

`BookingRepository` can be backed by demo, MongoDB or the generic REST v1 adapter. The selected implementation may own booking persistence, but it must still honor the core booking contract: identity scope, requested trip/departure scope, server-authoritative pricing/inventory rules, valid transitions and concurrency/idempotency expectations where applicable.

An external booking provider does not automatically become the payment ledger, CRM, ERP, supplier workflow, protected Traveller Data or staff-operations authority.

### Operations

`OperationsRepository` is intentionally separate from customer booking. It exposes staff-oriented reads, summaries, audit history and allowed reservation-state changes. Staff authorization and transition rules remain server-side responsibilities.

CRM/ERP integrations must not be treated as an implicit `OperationsRepository`.

### Payments and PSP providers

`PaymentRepository` is a real public capability boundary and was missing from the preliminary Phase 10.3 inventory. Phase 10.3.1 corrects that discrepancy.

The current bundled implementation is MongoDB-backed, with a disabled fallback. There is **no generic REST replacement for `PaymentRepository` today**.

Stripe and Redsys are payment-provider/checkout integrations, not `PaymentRepository` implementations. Signed provider callbacks may contribute an authoritative provider outcome that is reconciled into the local ledger. Browser return URLs never become payment confirmation authority.

### Supplier fulfilment

`SupplierFulfilmentAdapter` may request, query status and cancel against a remote supplier. The response remains subordinate to local operations: it must be normalized/audited and re-enter local fulfilment validation. It cannot rewrite customer totals, payment/refund history, inventory rules, supplier cost, traveller records or protected Traveller Data.

### CRM

`CrmSyncAdapter` supports contact and reservation upserts downstream. It has no reverse booking/pricing/inventory/supplier/payment mutation path. Adding one would require a new separately reviewed public capability contract.

### ERP/accounting

`ErpAccountingAdapter` receives authoritative local `succeeded` payment/refund movements. A downstream acknowledgement can store mapping/audit metadata but cannot rewrite local reservations, inventory or the payment/refund ledger.

### Failure transport

`FailureTransport` is observational. Collector failure must not change booking, payment, integration worker or readiness authority. The external payload remains strictly allowlisted and redacted according to the failure-transport contract.

## Explicitly not public extension points today

The following are implementation modules or provider-specific helpers, not first-class public extension APIs in Phase 10.3.1:

- `lib/email.ts` and SMTP configuration — replaceable implementation/service, but no `repositories/*` public contract exists;
- `lib/payment-stripe.ts` and `lib/payment-redsys.ts` — bundled PSP/provider implementations, not replacements for `PaymentRepository`;
- MongoDB helper/store modules under `lib/` — persistence implementation details unless reached through a documented repository boundary;
- arbitrary `lib/*`, `app/*` or component modules — internal application code is not automatically a supported plugin surface;
- Kairoseth/customer-specific private adapters — allowed to consume public contracts, but the MIT core must not depend on them.

## Network contract map

| Surface | Version mechanism today | Code/document source |
|---|---|---|
| REST booking | `/v1` + `X-OTP-Contract-Version: 1` | `lib/rest-booking-contract.ts`, `docs/REST-BOOKING-ADAPTER.md` |
| REST supplier fulfilment | versioned REST v1 operations | `lib/rest-supplier-fulfilment-contract.ts`, supplier adapter docs |
| REST CRM sync | REST v1 | `lib/rest-crm-contract.ts`, CRM adapter docs |
| REST ERP/accounting | REST v1 | `lib/rest-erp-accounting-contract.ts`, ERP adapter docs |
| Failure transport | `FailureTransportEvent.schemaVersion = 1` plus transport contract | `repositories/failure-transport.ts`, `docs/FAILURE-TRANSPORT.md` |
| Generic outbound webhooks | versioned integration event contract | `docs/OUTBOUND-INTEGRATIONS.md` |
| HTTP travel catalogue | current read-only catalogue contract | `docs/API-CONTRACT.md` |

Phase 10.3.2 will define the compatibility/deprecation rules across these different version mechanisms without forcing an unnecessary single global version.

## Phase 10.3.1 closeout findings

- **9** first-class `repositories/` extension interfaces were verified against the codebase;
- `PaymentRepository` was identified as missing from the preliminary documentation and is now part of the official inventory;
- the composition selector and bundled implementation set were mapped for each interface;
- existing HTTP/event contracts were mapped to their in-process boundaries;
- CRM and ERP remain downstream-only;
- supplier fulfilment remains subordinate to local workflow validation;
- generic webhooks remain downstream delivery only;
- SMTP/email was deliberately **not** promoted to public extension-contract status;
- Stripe/Redsys were correctly classified as PSP integrations rather than `PaymentRepository` replacements;
- no new automated `check:extension-contracts` gate is claimed in this slice; that remains Phase 10.3.4.

## Next slice

**Phase 10.3.2 — compatibility and versioning policy** should use this inventory as its authoritative list of extension surfaces. It will define compatible evolution, deprecation and breaking-change rules for typed interfaces, HTTP contracts and event schemas.

## Related documentation

- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`ARCHITECTURE.md`](ARCHITECTURE.md)
- [`API-CONTRACT.md`](API-CONTRACT.md)
- [`REST-BOOKING-ADAPTER.md`](REST-BOOKING-ADAPTER.md)
- [`SUPPLIER-FULFILMENT-ADAPTER.md`](SUPPLIER-FULFILMENT-ADAPTER.md)
- [`CRM-SYNC-ADAPTER.md`](CRM-SYNC-ADAPTER.md)
- [`ERP-ACCOUNTING-ADAPTER.md`](ERP-ACCOUNTING-ADAPTER.md)
- [`OUTBOUND-INTEGRATIONS.md`](OUTBOUND-INTEGRATIONS.md)
- [`FAILURE-TRANSPORT.md`](FAILURE-TRANSPORT.md)
