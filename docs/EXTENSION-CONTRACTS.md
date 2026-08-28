# Extension contracts and reference adapters

<p align="center"><strong>English</strong> · <a href="./EXTENSION-CONTRACTS.es.md">Español</a></p>

Status: **Phase 10.3 — ACTIVE**  
Current slice after this merge: **10.3.4 — permanent extension-contract validation**  
Completed slices: **10.3.1, 10.3.2, 10.3.3**  
Reference deployment: **Kairoseth Travel** at `travel.kairoseth.com`

## Purpose

Phase 10.3 formalizes the provider-neutral extension boundaries already present in Open Travel Platform so contributors and self-hosters can extend the MIT core without leaking vendor payloads or silently changing domain authority.

The phase artifacts are now:

- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md) — code-backed public extension inventory and authority map;
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md) — compatibility, versioning, deprecation and migration policy;
- [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md) — contributor-facing reference implementations and extension patterns.

## Core authority rule

An adapter receives authority only for the capability it explicitly implements.

- catalogue adapters cannot become booking/payment authority;
- booking implementations remain bounded by booking ownership, scope, inventory and trusted-pricing rules;
- `PaymentRepository` remains the provider-neutral local payment/refund ledger boundary;
- Stripe/Redsys are PSP/checkout integrations, not `PaymentRepository` replacements;
- supplier results re-enter local audit and workflow validation before application;
- CRM and ERP/accounting remain downstream-only;
- failure transport and generic webhooks remain non-authoritative delivery surfaces;
- payment browser returns are never authoritative confirmation;
- provider-specific payloads stay inside adapters and are normalized before entering shared domain types.

## Verified extension inventory — COMPLETE (10.3.1)

Phase 10.3.1 verified **9 first-class interfaces under `repositories/`** plus the signed-webhook delivery surface.

| Capability | Boundary | Bundled implementation(s) | Authority |
|---|---|---|---|
| Catalogue | `TravelRepository` | demo / HTTP API / MongoDB | bounded catalogue source |
| Identity | `IdentityRepository` | demo / MongoDB / disabled | trusted identity/profile source |
| Booking | `BookingRepository` | demo / MongoDB / REST v1 / disabled | bounded booking authority |
| Operations | `OperationsRepository` | demo / MongoDB / disabled | local staff workflow authority |
| Payment ledger | `PaymentRepository` | MongoDB / disabled | local authoritative ledger |
| Supplier fulfilment | `SupplierFulfilmentAdapter` | disabled / REST v1 | workflow-subordinate synchronization |
| CRM | `CrmSyncAdapter` | disabled / REST v1 | downstream-only |
| ERP/accounting | `ErpAccountingAdapter` | disabled / REST v1 | downstream-only |
| Failure visibility | `FailureTransport` | disabled / REST | monitoring-only |
| Generic webhooks | outbox + signed HTTPS | built-in | downstream delivery only |

Explicit non-extension surfaces include SMTP/email internals, MongoDB helpers, arbitrary `lib/*`/`app/*` modules and PSP modules as replacements for `PaymentRepository`.

## Compatibility/versioning — COMPLETE (10.3.2)

The authoritative policy is [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

Key rules:

- no synthetic global extension-version constant;
- in-process public interfaces follow core SemVer;
- existing REST v1 routes/headers remain stable;
- the unversioned read-only catalogue is treated as legacy-v1 semantics and cannot break in place;
- `IntegrationEventEnvelope.version` and webhook-signature `v1=` are separate compatibility dimensions;
- authority, authentication, idempotency, state semantics and outbound protected-data allowlists are contract semantics;
- mutating adapters may not silently downgrade protocol versions;
- breaking public changes require an explicit new version/major path and migration guidance;
- provider API version churn should be absorbed inside adapters whenever the normalized core contract can remain stable.

## Contributor-facing reference adapters — COMPLETE (10.3.3)

The authoritative guide is [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md).

Phase 10.3.3 deliberately uses **real, already-tested generic implementations** rather than parallel toy code that could drift from production behavior.

### Reference A — bounded repository authority

`RestBookingRepository` demonstrates:

- explicit `BookingRepository` implementation;
- server-only configuration;
- versioned `/v1` transport;
- runtime schema/content-type/version validation;
- bounded timeout/response size and redirect rejection;
- normalized errors;
- request correlation;
- deterministic idempotency for mutations;
- transient retry with stable mutation identity;
- identity/trip/departure scope validation.

### Reference B — workflow-subordinate synchronization

`RestSupplierFulfilmentAdapter` plus `performSupplierAdapterOperation()` demonstrates:

- explicit outbound allowlists;
- server-only credentials;
- versioned contract and bounded transport;
- deterministic idempotency for mutating operations;
- response normalization;
- **audit-before-apply**;
- application through the existing local state-transition path;
- conflict rejection when an external status is invalid locally.

### Reference C — downstream-only synchronization

`RestCrmSyncAdapter` demonstrates:

- allowlisted normalized customer/reservation snapshots;
- no raw provider/MongoDB payload forwarding;
- versioned `/v1` contract;
- event-derived idempotency;
- bounded transport and runtime response validation;
- stable acknowledgement/error normalization;
- no reverse booking/payment/inventory authority.

`RestFailureTransport` is documented as an optional fourth monitoring-only pattern.

The reference guide also includes:

- a reusable adapter file-layout pattern;
- a v1 → v2 migration example;
- proprietary/private adapter separation;
- contributor verification checklist;
- network-contract test expectations.

### Existing test protection

The reference network adapters are already exercised by `tests/rest-adapter-contracts.ts`, including applicable cases for:

- successful normalized responses;
- wrong contract versions;
- invalid content type/schema;
- scope rejection;
- response-size bounds;
- transient retries;
- stable idempotency keys across retries;
- non-retry of rejected client operations.

This is why Phase 10.3.3 designates the existing implementations instead of introducing a second untested example stack.

## Proprietary adapter boundary

The public MIT core owns generic contracts and provider-neutral references. Kairoseth/customer/vendor-specific implementations may remain private.

A private adapter may import public OTP interfaces/types. The MIT core must not import the private adapter or require private credentials to build, test, demo or self-host.

## Permanent validation — ACTIVE next slice (10.3.4)

Phase 10.3.4 must add a permanent automated gate protecting the model formalized in 10.3.1–10.3.3.

Expected coverage:

- verified extension interfaces/reference paths remain present;
- version declarations stay synchronized with policy/docs;
- provider payload types do not leak into shared domain interfaces;
- CRM/ERP remain downstream-only;
- supplier external responses still re-enter audit/local transition validation;
- reference adapters retain server-only credentials, bounded transport and normalized runtime parsing;
- README/ROADMAP/ADAPTER-GUIDE/Phase 10.3 docs remain synchronized;
- the final gate is registered in `npm run verify` and CI.

Documentation must not claim that gate exists until its implementation is committed and running.

## Phase 10.3 delivery sequence

```text
10.3.1  Extension inventory + authority map                 COMPLETE
10.3.2  Compatibility/versioning policy                    COMPLETE
10.3.3  Contributor-facing reference adapters              COMPLETE
10.3.4  Permanent extension-contract validation            ACTIVE after merge
   ↓
10.3     Final documentation sync + green CI + merge       completion gate
```

## Phase 10.3 completion criteria

Phase 10.3 can be marked COMPLETE only when:

1. the public extension inventory matches the implementation;
2. authority boundaries are documented EN/ES;
3. compatibility/versioning/deprecation rules are explicit;
4. provider-neutral contributor references exist;
5. permanent automated validation protects the boundaries;
6. project/adapter/contract documentation is synchronized;
7. proprietary Kairoseth/customer adapters remain decoupled;
8. CI is green with the permanent validation enabled;
9. the closing PR is merged to `main`.

## Related documentation

- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md)
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md)
- [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`REST-BOOKING-ADAPTER.md`](REST-BOOKING-ADAPTER.md)
- [`SUPPLIER-FULFILMENT-ADAPTER.md`](SUPPLIER-FULFILMENT-ADAPTER.md)
- [`CRM-SYNC-ADAPTER.md`](CRM-SYNC-ADAPTER.md)
- [`ERP-ACCOUNTING-ADAPTER.md`](ERP-ACCOUNTING-ADAPTER.md)
- [`OUTBOUND-INTEGRATIONS.md`](OUTBOUND-INTEGRATIONS.md)
- [`FAILURE-TRANSPORT.md`](FAILURE-TRANSPORT.md)
- [`../ROADMAP.md`](../ROADMAP.md)
