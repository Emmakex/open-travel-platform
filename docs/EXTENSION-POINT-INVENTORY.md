# Public extension-point inventory and authority map

<p align="center"><strong>English</strong> · <a href="./EXTENSION-POINT-INVENTORY.es.md">Español</a></p>

Status: **Phase 10.3.1 — COMPLETE**  
Current protection: `npm run check:extension-contracts`

## Purpose

This is the code-backed inventory of first-class public extension boundaries in the MIT core and the authority each boundary may exercise.

A module is not a public plugin API merely because it can be replaced in a fork. A first-class in-process extension point is an explicit interface under `repositories/` selected through application composition. Generic signed webhooks are documented separately as a public downstream delivery surface.

## Verified first-class inventory

The codebase contains exactly **9** `repositories/*.ts` public interfaces:

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

| Capability | Interface | Current implementation(s) | Authority |
|---|---|---|---|
| Catalogue | `TravelRepository` | demo / HTTP / MongoDB | bounded source authority |
| Identity | `IdentityRepository` | demo / MongoDB / disabled | trusted identity/profile source |
| Booking | `BookingRepository` | demo / MongoDB / REST v1 / disabled | bounded booking authority |
| Operations | `OperationsRepository` | demo / MongoDB / disabled | local staff workflow authority |
| Payments | `PaymentRepository` | MongoDB / disabled | local authoritative payment/refund ledger |
| Supplier fulfilment | `SupplierFulfilmentAdapter` | disabled / REST v1 | workflow-subordinate synchronization |
| CRM | `CrmSyncAdapter` | disabled / REST v1 | downstream-only |
| ERP/accounting | `ErpAccountingAdapter` | disabled / REST v1 | downstream-only |
| Failure visibility | `FailureTransport` | disabled / REST | monitoring-only |

Generic webhooks use the transactional integration outbox and signed HTTPS delivery. They are downstream-only and are not a `repositories/*` interface.

## Authority vocabulary

- **bounded source/repository authority** — authoritative only inside the capability represented by the interface;
- **local authoritative** — the local OTP domain remains the canonical state/history;
- **workflow-subordinate** — external state may be proposed but must pass local audit/state transition rules;
- **downstream-only** — receives normalized local data and acknowledgement cannot mutate upstream core domains;
- **monitoring-only** — delivery may fail without affecting core application state.

## Capability authority details

### TravelRepository

May source catalogue data. It does not gain booking, identity, payment or operations authority.

### IdentityRepository

May resolve trusted identity/profile information. Browser-selected roles are never authoritative and identity does not gain booking/payment writes.

### BookingRepository

May implement the booking persistence/source contract but remains subject to customer ownership/scope, trusted pricing, inventory and state rules. It does not gain payment-ledger, staff-workflow or protected-data authority.

### OperationsRepository

Owns the local staff workflow capability. It remains distinct from customer booking and from downstream CRM/ERP systems.

### PaymentRepository

Is the provider-neutral authoritative payment/refund ledger boundary. Stripe and Redsys are PSP/checkout integrations, not `PaymentRepository` implementations.

### SupplierFulfilmentAdapter

Reports normalized supplier status/reference. External responses are audited before local application and must pass the local state-transition path. The supplier does not gain authority over customer totals, payment history or inventory.

### CrmSyncAdapter

Downstream-only. Current method surface is limited to normalized contact/reservation upsert delivery. Reverse booking/payment mutation requires a separate reviewed contract.

### ErpAccountingAdapter

Downstream-only from authoritative local succeeded payment/refund movements. ERP acknowledgement cannot rewrite the local ledger, bookings or inventory.

### FailureTransport

Monitoring-only and best-effort. Collector availability does not affect booking/payment/integration authority.

## Explicit non-extension surfaces

Not first-class public extension contracts today:

- SMTP/email implementation;
- Stripe/Redsys modules as replacements for `PaymentRepository`;
- MongoDB helper/store internals;
- arbitrary `lib/*`, `app/*` or component modules;
- private Kairoseth/customer integrations.

## Network/version map

| Surface | Version mechanism |
|---|---|
| Booking REST | `/v1` + `X-OTP-Contract-Version: 1` |
| Supplier REST | `/v1` + `X-OTP-Contract-Version: 1` |
| CRM REST | `/v1` + `X-OTP-Contract-Version: 1` |
| ERP/accounting REST | `/v1` + `X-OTP-Accounting-Contract-Version: 1` |
| Failure transport | `X-OTP-Failure-Contract-Version: 1` + event schema version |
| Integration events | `IntegrationEventEnvelope.version: 1` |
| Generic webhook signing | `X-OTP-Signature: v1=...` |
| HTTP catalogue | unversioned legacy-v1 read contract |

Compatibility rules are defined in [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

## Permanent protection

Phase 10.3.4 now protects this inventory with:

```bash
npm run check:extension-contracts
```

The gate compares the actual `repositories/*.ts` files against this nine-interface model and fails if the inventory changes without a deliberate contract/gate update. It also protects interface purity and authority-sensitive method surfaces.

See [`EXTENSION-VALIDATION.md`](EXTENSION-VALIDATION.md).

## Closeout findings

- exactly nine public first-class interfaces are verified;
- `PaymentRepository` is explicitly part of the official inventory;
- CRM/ERP remain downstream-only;
- supplier fulfilment remains subordinate to local audit/workflow validation;
- generic webhooks remain downstream delivery only;
- internal email/MongoDB modules are not plugin contracts;
- Stripe/Redsys remain PSP integrations;
- the inventory is now protected by a permanent CI gate.

## Related documentation

- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md)
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md)
- [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md)
- [`EXTENSION-VALIDATION.md`](EXTENSION-VALIDATION.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
