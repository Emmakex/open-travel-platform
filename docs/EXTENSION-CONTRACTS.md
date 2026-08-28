# Extension contracts and reference adapters

<p align="center"><strong>English</strong> · <a href="./EXTENSION-CONTRACTS.es.md">Español</a></p>

Status: **Phase 10.3 — ACTIVE**  
Current slice: **10.3.3 — contributor-facing reference adapters/examples**  
Scope: public extension boundaries of the MIT core  
Reference deployment: **Kairoseth Travel** at `travel.kairoseth.com`

## Purpose

Phase 10.3 turns the adapter boundaries that already exist in Open Travel Platform into an explicit public extension contract for contributors, self-hosters and future ecosystem integrations.

The goal is not to expose every internal module as a plugin API. The goal is to make the existing provider-neutral boundaries predictable, versionable and safe to extend without allowing an external system to silently become authoritative over unrelated core domains.

Phase 10.3.1 completed the code-backed extension inventory. Phase 10.3.2 completed the compatibility/versioning policy. See:

- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md) — verified interfaces, composition paths, implementations, wire contracts and authority map;
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md) — SemVer, wire-version, event-schema, signature, deprecation and migration rules.

## Core rule: authority stays explicit

An adapter can translate, transport or synchronize data only inside the capability it implements. It does not gain authority over another domain because a remote provider returned a value.

Examples:

- a catalogue adapter may source catalogue data but does not gain booking or payment authority;
- a booking adapter may persist or source booking data, but it must still satisfy the booking contract and server-authoritative ownership/scope/inventory/pricing rules;
- `PaymentRepository` remains the provider-neutral local financial-ledger boundary; Stripe/Redsys are PSP integrations, not replacements for that repository;
- a supplier adapter can request, cancel and synchronize fulfilment state, but it cannot rewrite customer totals, payment history or traveller records;
- CRM is downstream-only and cannot mutate local booking, pricing, inventory, fulfilment or payment-ledger authority;
- ERP/accounting is downstream-only and cannot mutate local reservations, inventory or authoritative payment/refund history;
- payment-provider browser returns are never authoritative confirmation;
- provider-specific payloads stay inside adapters and must be normalized before entering shared domain types.

## Extension classes

### 1. Source / repository extensions

Verified examples:

- `TravelRepository`
- `IdentityRepository`
- `BookingRepository`
- `OperationsRepository`
- `PaymentRepository`

These interfaces replace a bounded source or persistence capability. Their implementation may be demo, MongoDB, REST/API where supported, disabled, or another future provider. Page/component/domain code should consume the stable domain-facing contract rather than vendor payloads.

Not every repository currently has an external network implementation. In particular, `PaymentRepository` is currently MongoDB/disabled in the bundled core; Stripe and Redsys operate through the separate payment-provider/checkout boundary.

### 2. Downstream synchronization extensions

Verified examples:

- `CrmSyncAdapter`
- `ErpAccountingAdapter`

These receive normalized events/data from the core. They are deliberately subordinate to local authority and must not introduce reverse mutation paths unless a separate explicit capability contract is designed and reviewed.

### 3. Workflow synchronization extensions

Verified example:

- `SupplierFulfilmentAdapter`

External state is audited/validated and then re-enters the existing local workflow/state machine. The external response never bypasses local transition rules.

### 4. Delivery / observability extensions

Verified examples:

- signed outbound webhooks;
- `FailureTransport`.

These transport normalized information outside the application. They are non-authoritative and must use explicit data allowlists, bounded network behavior and server-only credentials where applicable.

## Verified public contract inventory

Phase 10.3.1 verified **9 first-class interfaces under `repositories/`** plus the generic signed-webhook delivery surface.

| Capability | Primary boundary | Current bundled implementation(s) | Authority model |
|---|---|---|---|
| Catalogue | `TravelRepository` | demo / HTTP API / MongoDB | bounded catalogue source authority |
| Identity | `IdentityRepository` | demo / MongoDB / disabled | trusted server-side identity/profile source |
| Booking | `BookingRepository` | demo / MongoDB / REST v1 / disabled | bounded booking authority; server invariants remain mandatory |
| Operations | `OperationsRepository` | demo / MongoDB / disabled | local/server-side staff workflow authority |
| Payments / ledger | `PaymentRepository` | MongoDB / disabled | local authoritative payment/refund ledger |
| Supplier fulfilment | `SupplierFulfilmentAdapter` | disabled / REST v1 | external synchronization subordinate to local workflow |
| CRM | `CrmSyncAdapter` | disabled / REST v1 | downstream-only |
| ERP/accounting | `ErpAccountingAdapter` | disabled / REST v1 | downstream-only from authoritative local `succeeded` ledger movements |
| Failure visibility | `FailureTransport` | disabled / REST | monitoring-only, best effort, non-authoritative |
| Generic webhooks | integration outbox + signed HTTPS delivery | built-in delivery pipeline | downstream event delivery only |

The detailed inventory, composition environment variables and network-contract map live in [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md).

## Explicit non-extension surfaces

Phase 10.3.1 also records what is **not** a supported public extension contract today:

- `lib/email.ts` / SMTP is an internal service implementation, not a `repositories/*` contract;
- Stripe/Redsys modules are PSP integrations, not `PaymentRepository` implementations;
- MongoDB helpers and arbitrary `lib/*`, `app/*` or component modules are not automatically plugin APIs;
- proprietary Kairoseth/customer adapters may consume public contracts, but the MIT core must not depend on them.

## Compatibility/versioning policy — COMPLETE (10.3.2)

The authoritative policy is [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

Phase 10.3.2 established these rules:

- no artificial global extension-version constant;
- in-process interfaces follow core release SemVer;
- existing REST v1 paths and headers remain unchanged;
- Booking/Supplier/CRM sharing `X-OTP-Contract-Version` does not make them one schema family;
- ERP/accounting keeps `X-OTP-Accounting-Contract-Version: 1`;
- FailureTransport keeps `X-OTP-Failure-Contract-Version: 1` and independently versions `FailureTransportEvent.schemaVersion`;
- the unversioned HTTP catalogue is frozen as legacy-v1 semantics and cannot be broken in place;
- `IntegrationEventEnvelope.version` and webhook signature `v1=` are independent compatibility dimensions;
- authority, authentication, idempotency, state semantics and protected-data allowlists are contract semantics;
- mutating adapters may not silently downgrade protocol versions;
- ordinary removal requires deprecation and migration guidance;
- breaking changes require a core major release or a deliberate parallel/new wire contract as appropriate.

### Compatible evolution

Normally compatible:

- optional additive fields with safe absence;
- new opt-in implementations behind an unchanged interface;
- new endpoints that do not change existing ones;
- new explicitly subscribed event types;
- provider API upgrades absorbed inside adapters while the normalized core contract remains stable.

### Breaking evolution

Normally breaking:

- removing/renaming required fields or methods;
- adding required methods to public interfaces implemented by third parties;
- changing auth/version headers or endpoint methods/paths;
- changing state meanings, authority boundaries or idempotency semantics;
- widening protected-data exposure;
- converting downstream-only/workflow-subordinate behavior into reverse mutation authority.

See the full compatibility matrix, deprecation lifecycle and migration requirements in [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

## Reference adapter requirements — active Phase 10.3.3

A contributor-facing reference adapter should demonstrate the minimum correct behavior rather than embed a specific commercial vendor.

Reference implementations/examples must show:

1. explicit opt-in composition/configuration;
2. server-only credentials for privileged transports;
3. HTTPS enforcement for production external transports;
4. redirect rejection where redirects could cross trust boundaries;
5. bounded timeout and response size;
6. runtime validation before provider data becomes domain data;
7. normalized stable application errors;
8. deterministic idempotency for mutating operations when applicable;
9. audit-before-apply when an external response affects a local workflow;
10. explicit outbound data allowlists;
11. no protected Traveller Data, secrets or raw provider payload leakage;
12. no cross-domain authority escalation;
13. compatibility with the existing public version identifier;
14. provider-version changes absorbed internally when the core contract can remain stable;
15. explicit migration behavior when a deliberate v1 → v2 transition is required.

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
- README, ROADMAP, ADAPTER-GUIDE and the Phase 10.3 documents remain consistent;
- the final extension-contract gate is registered in `npm run verify`.

The exact script/test name will be chosen when the implementation lands. Documentation must not claim a gate exists before it is committed and running in CI.

## Phase 10.3 delivery sequence

```text
10.3.1  Inventory public extension points + authority map   COMPLETE
   ↓
10.3.2  Compatibility/versioning policy                    COMPLETE
   ↓
10.3.3  Contributor-facing reference adapters/examples     ACTIVE
   ↓
10.3.4  Permanent automated contract validation            PLANNED
   ↓
10.3     Documentation sync + green CI                     completion gate
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

- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md)
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md)
- [`../ROADMAP.md`](../ROADMAP.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`API-CONTRACT.md`](API-CONTRACT.md)
- [`REST-BOOKING-ADAPTER.md`](REST-BOOKING-ADAPTER.md)
- [`SUPPLIER-FULFILMENT-ADAPTER.md`](SUPPLIER-FULFILMENT-ADAPTER.md)
- [`CRM-SYNC-ADAPTER.md`](CRM-SYNC-ADAPTER.md)
- [`ERP-ACCOUNTING-ADAPTER.md`](ERP-ACCOUNTING-ADAPTER.md)
- [`OUTBOUND-INTEGRATIONS.md`](OUTBOUND-INTEGRATIONS.md)
- [`FAILURE-TRANSPORT.md`](FAILURE-TRANSPORT.md)
- [`ARCHITECTURE.md`](ARCHITECTURE.md)
