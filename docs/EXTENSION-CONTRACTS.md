# Extension contracts and reference adapters

<p align="center"><strong>English</strong> · <a href="./EXTENSION-CONTRACTS.es.md">Español</a></p>

Status: **Phase 10.3 — COMPLETE**  
Slices: **10.3.1 COMPLETE · 10.3.2 COMPLETE · 10.3.3 COMPLETE · 10.3.4 COMPLETE**  
Permanent gate: `npm run check:extension-contracts`

## Purpose

Phase 10.3 formalizes the provider-neutral extension boundaries of Open Travel Platform and protects them against silent drift.

Authoritative artifacts:

- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md) — public extension inventory and authority map;
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md) — compatibility/versioning/deprecation/migration policy;
- [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md) — contributor-facing reference implementations;
- [`EXTENSION-VALIDATION.md`](EXTENSION-VALIDATION.md) — permanent automated validation contract.

## Core authority rule

An adapter receives authority only for the capability it explicitly implements.

- catalogue adapters cannot become booking/payment authority;
- booking remains bounded by ownership, scope, inventory and trusted pricing;
- `PaymentRepository` remains the provider-neutral local payment/refund ledger;
- Stripe/Redsys are PSP/checkout integrations, not ledger repositories;
- supplier results must pass audit and the local workflow before application;
- CRM and ERP/accounting remain downstream-only;
- `FailureTransport` and generic webhooks remain non-authoritative delivery surfaces;
- browser payment returns are never authoritative confirmation;
- provider-specific payloads stay inside adapters and are normalized before domain entry.

## 10.3.1 — Inventory and authority map — COMPLETE

The code-backed inventory verifies exactly nine first-class interfaces under `repositories/`:

| Capability | Boundary | Authority |
|---|---|---|
| Catalogue | `TravelRepository` | bounded catalogue source |
| Identity | `IdentityRepository` | trusted identity/profile source |
| Booking | `BookingRepository` | bounded booking authority |
| Operations | `OperationsRepository` | local staff workflow authority |
| Payments | `PaymentRepository` | local authoritative ledger |
| Supplier fulfilment | `SupplierFulfilmentAdapter` | workflow-subordinate synchronization |
| CRM | `CrmSyncAdapter` | downstream-only |
| ERP/accounting | `ErpAccountingAdapter` | downstream-only |
| Failure visibility | `FailureTransport` | monitoring-only |

Generic signed webhooks are a separate downstream delivery surface.

See [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md).

## 10.3.2 — Compatibility/versioning — COMPLETE

Key policy:

- public in-process interfaces follow core SemVer;
- existing REST v1 paths/header names remain stable;
- the current unversioned catalogue is frozen as legacy-v1 semantics;
- event-schema and webhook-signature versions evolve independently;
- authority/authentication/idempotency/state/data allowlists are contract-significant;
- mutating adapters may not silently downgrade wire versions;
- breaking public evolution requires explicit version/migration/deprecation handling;
- vendor API churn should be absorbed inside adapters whenever the normalized core contract can remain stable.

See [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

## 10.3.3 — Contributor-facing reference adapters — COMPLETE

Official references use real tested implementations:

- `RestBookingRepository` — bounded repository authority;
- `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — workflow-subordinate, audit-before-apply;
- `RestCrmSyncAdapter` — downstream-only;
- `RestFailureTransport` — optional monitoring-only reference.

They demonstrate server-only credentials, HTTPS/redirect safety, bounded transport, runtime validation, stable errors, deterministic idempotency, explicit allowlists, authority containment and deliberate v1→v2 migration.

See [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md).

## 10.3.4 — Permanent extension-contract validation — COMPLETE

Permanent static gate:

```bash
npm run check:extension-contracts
```

Implementation:

```text
scripts/extension-contract-check.mjs
```

It is registered in `npm run verify` and checks:

- exact public `repositories/` inventory;
- provider-neutral interface purity;
- CRM/ERP downstream-only method surfaces;
- supplier authority limits and audit-before-apply ordering;
- `PaymentRepository` PSP neutrality;
- stable v1 contract/header/schema/signature identifiers;
- reference-adapter HTTPS, redirect, timeout, response-size and runtime parsing safeguards;
- EN/ES inventory/reference/compatibility/documentation consistency;
- presence of the dedicated CI workflow.

Dedicated blocking CI:

```text
.github/workflows/extension-contracts.yml
```

The workflow runs both:

```bash
npm run check:extension-contracts
npm run test:rest-adapter-contracts
```

The second command preserves runtime validation over a real local HTTP server. The main CI workflow also retains the REST adapter contract suite.

See [`EXTENSION-VALIDATION.md`](EXTENSION-VALIDATION.md).

## Intentional contract changes

A legitimate future extension-model change must update the gate rather than bypass it:

1. change the contract deliberately;
2. classify compatibility impact;
3. introduce a new version/migration path when breaking;
4. update inventory/authority/reference docs;
5. update `extension-contract-check.mjs` to encode the new intended model;
6. update runtime tests;
7. synchronize EN/ES README, ROADMAP, CHANGELOG and relevant docs;
8. require green CI, merge to `main`, and `main` verification before advancing.

## Proprietary adapter boundary

Kairoseth/customer/vendor-specific adapters may remain private and may import public OTP contracts. The MIT core must not depend on private packages or credentials.

## Phase 10.3 completion record

```text
10.3.1  Inventory + authority map                 COMPLETE
10.3.2  Compatibility/versioning                  COMPLETE
10.3.3  Contributor reference adapters            COMPLETE
10.3.4  Permanent automated validation            COMPLETE
10.3     Extension contracts/reference adapters   COMPLETE
```

The permanent project rule continues to apply to every later slice: implementation, tests, synchronized documentation, green CI, merge to `main`, and verification of `main` before the next phase starts.

## Related documentation

- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md)
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md)
- [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md)
- [`EXTENSION-VALIDATION.md`](EXTENSION-VALIDATION.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`../ROADMAP.md`](../ROADMAP.md)
