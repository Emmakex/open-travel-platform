# Extension contracts and reference adapters

<p align="center"><strong>English</strong> · <a href="./EXTENSION-CONTRACTS.es.md">Español</a></p>

Status: **Phase 10.3 — ACTIVE**  
Scope: public extension boundaries of the MIT core  
Reference deployment: **Kairoseth Travel** at `travel.kairoseth.com`

## Purpose

Phase 10.3 turns the adapter boundaries that already exist in Open Travel Platform into an explicit public extension contract for contributors, self-hosters and future ecosystem integrations.

The goal is not to expose every internal module as a plugin API. The goal is to make the existing provider-neutral boundaries predictable, versionable and safe to extend without allowing an external system to silently become authoritative over unrelated core domains.

## Core rule: authority stays explicit

An adapter can translate, transport or synchronize data only inside the capability it implements. It does not gain authority over another domain because a remote provider returned a value.

Examples:

- a booking adapter may persist or source booking data, but it must still satisfy the booking contract and server-authoritative ownership/scope rules;
- a supplier adapter can request, cancel and synchronize fulfilment state, but it cannot rewrite customer totals, payment history or traveller records;
- CRM is downstream-only and cannot mutate local booking, pricing, inventory, fulfilment or payment-ledger authority;
- ERP/accounting is downstream-only and cannot mutate local reservations, inventory or authoritative payment/refund history;
- payment-provider browser returns are never authoritative confirmation;
- provider-specific payloads stay inside adapters and must be normalized before entering shared domain types.

## Extension classes

### 1. Source / repository extensions

Examples:

- `TravelRepository`
- `IdentityRepository`
- `BookingRepository`
- `OperationsRepository`

These interfaces replace a bounded source or persistence capability. Their implementation may be demo, MongoDB, REST or another future provider, but page/component code should consume the stable domain-facing contract rather than vendor payloads.

### 2. Downstream synchronization extensions

Examples:

- `CrmSyncAdapter`
- `ErpAccountingAdapter`

These receive normalized events/data from the core. They are deliberately subordinate to local authority and must not introduce reverse mutation paths unless a separate explicit capability contract is designed and reviewed.

### 3. Workflow synchronization extensions

Example:

- `SupplierFulfilmentAdapter`

External state is audited/validated and then re-enters the existing local workflow/state machine. The external response never bypasses local transition rules.

### 4. Delivery / observability extensions

Examples:

- signed outbound webhooks;
- `FailureTransport`.

These transport normalized information outside the application. They are non-authoritative and must use explicit data allowlists, bounded network behavior and server-only credentials.

## Current public contract inventory

| Capability | Primary boundary | Current reference implementation | Authority model |
|---|---|---|---|
| Catalogue | `TravelRepository` | demo / application data sources | repository source for catalogue domain |
| Identity | `IdentityRepository` | demo / persistent identity | trusted server-side identity source |
| Booking | `BookingRepository` | demo / MongoDB / REST v1 | booking contract; server ownership/scope still enforced |
| Operations | `OperationsRepository` | local operational persistence | staff workflow authority remains local/server-side |
| Supplier fulfilment | `SupplierFulfilmentAdapter` | disabled / REST v1 | external synchronization subordinate to local workflow |
| CRM | `CrmSyncAdapter` | disabled / REST v1 | downstream-only |
| ERP/accounting | `ErpAccountingAdapter` | disabled / REST v1 | downstream-only from authoritative succeeded ledger movements |
| Failure visibility | `FailureTransport` | disabled / REST | monitoring-only, best effort, non-authoritative |
| Generic webhooks | integration outbox + signed HTTPS delivery | built-in reference delivery | downstream event delivery only |

This inventory will be validated against the codebase during 10.3.1. If a documented name differs from the actual implementation, the code is authoritative until documentation is corrected in the same Phase 10.3 change.

## Contract versioning policy — target for 10.3.2

Public extension contracts must distinguish compatible evolution from breaking changes.

### Backward-compatible changes

Normally compatible:

- adding optional response fields with safe defaults;
- adding optional capabilities that existing adapters are not required to implement;
- adding new error codes without changing existing success semantics;
- adding new endpoints/operations without changing existing ones;
- tightening documentation without changing accepted runtime values.

### Breaking changes

Normally breaking:

- removing or renaming required fields;
- changing the meaning of an existing status/state;
- changing ownership or authority assumptions;
- changing idempotency semantics;
- changing required authentication/version headers;
- changing an operation from read-only/downstream-only into a mutation authority;
- widening outbound data beyond the documented allowlist.

Breaking public contracts require a deliberate version/migration path. Provider-specific API changes should be absorbed inside the adapter whenever possible instead of forcing a core-contract break.

## Version identifiers

Existing REST reference adapters use explicit versioned paths/headers where applicable, including `X-OTP-Contract-Version: 1` for the generic REST booking contract.

Phase 10.3 will consolidate which extension contracts require:

- versioned HTTP paths;
- contract-version headers;
- typed in-process interface compatibility only;
- event schema versions;
- deprecation markers.

No new global versioning mechanism should be introduced unless it materially improves compatibility across the existing boundaries.

## Reference adapter requirements — target for 10.3.3

A contributor-facing reference adapter should demonstrate the minimum correct behavior rather than embed a specific commercial vendor.

Reference implementations must show:

1. explicit opt-in composition/configuration;
2. server-only credentials;
3. HTTPS enforcement for production external transports;
4. redirect rejection where redirects could cross trust boundaries;
5. bounded timeout and response size;
6. runtime validation before provider data becomes domain data;
7. normalized stable application errors;
8. deterministic idempotency for mutating operations when applicable;
9. audit-before-apply when an external response affects a local workflow;
10. explicit outbound data allowlists;
11. no protected Traveller Data, secrets or raw provider payload leakage;
12. no cross-domain authority escalation.

## Proprietary adapter boundary

The MIT core should contain generic contracts and provider-neutral reference examples. Kairoseth-specific, customer-specific or commercially sensitive integrations may remain in private repositories/packages when appropriate.

A proprietary adapter may depend on the public extension contract. The public core must not depend on that proprietary adapter.

## Validation target — 10.3.4

Phase 10.3 will add permanent automated validation to protect these boundaries.

Expected coverage:

- extension inventory/reference paths remain present;
- public contract version declarations stay synchronized with documentation;
- provider-specific payload types do not leak into shared domain interfaces;
- downstream CRM/ERP adapters cannot expose reverse booking/payment mutation authority;
- supplier responses continue to re-enter local workflow validation;
- reference adapter examples use server-only credentials and bounded transports;
- README, ROADMAP, ADAPTER-GUIDE and this document remain consistent;
- the final extension-contract gate is registered in `npm run verify`.

The exact script/test name will be chosen when the implementation lands. Documentation must not claim a gate exists before it is committed and running in CI.

## Phase 10.3 delivery sequence

```text
10.3.1  Inventory public extension points + authority map   ACTIVE
   ↓
10.3.2  Compatibility/versioning policy                    PLANNED
   ↓
10.3.3  Contributor-facing reference adapters/examples     PLANNED
   ↓
10.3.4  Permanent automated contract validation            PLANNED
   ↓
10.3     Documentation sync + green CI                     COMPLETE
```

## Completion criteria

Phase 10.3 is complete only when all of the following are true:

- the public extension inventory matches the implementation;
- authority boundaries are documented in English and Spanish;
- compatibility/versioning rules are explicit;
- contributor-facing reference examples exist;
- automated validation protects the extension boundaries;
- relevant docs are synchronized;
- proprietary Kairoseth/customer adapters remain decoupled from the MIT core;
- CI is green with the new validation enabled.

## Related documentation

- [`../ROADMAP.md`](../ROADMAP.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`API-CONTRACT.md`](API-CONTRACT.md)
- [`REST-BOOKING-ADAPTER.md`](REST-BOOKING-ADAPTER.md)
- [`SUPPLIER-FULFILMENT-ADAPTER.md`](SUPPLIER-FULFILMENT-ADAPTER.md)
- [`CRM-SYNC-ADAPTER.md`](CRM-SYNC-ADAPTER.md)
- [`ERP-ACCOUNTING-ADAPTER.md`](ERP-ACCOUNTING-ADAPTER.md)
- [`OUTBOUND-INTEGRATIONS.md`](OUTBOUND-INTEGRATIONS.md)
- [`ARCHITECTURE.md`](ARCHITECTURE.md)