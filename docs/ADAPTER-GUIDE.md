# Adapter implementation guide

Open Travel Platform is provider-neutral. Extensions implement explicit capability interfaces and must preserve the authority assigned to that capability.

Read these documents before changing an adapter:

- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md)
- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md)
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md)
- [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md)
- [`EXTENSION-VALIDATION.md`](EXTENSION-VALIDATION.md)

## Public boundaries

- `TravelRepository` — bounded catalogue source.
- `IdentityRepository` — trusted identity/profile source.
- `BookingRepository` — bounded booking authority.
- `OperationsRepository` — local staff workflow authority.
- `PaymentRepository` — local provider-neutral payment/refund ledger.
- `SupplierFulfilmentAdapter` — workflow-subordinate synchronization.
- `CrmSyncAdapter` — downstream-only synchronization.
- `ErpAccountingAdapter` — downstream-only accounting synchronization.
- `FailureTransport` — monitoring-only delivery.

Generic signed webhooks are a separate downstream delivery surface.

Provider-specific payloads must be normalized inside adapters before crossing into stable application/domain types.

## Reference patterns

The official contributor references are real implementations already covered by the contract suite:

1. `RestBookingRepository` — bounded repository authority;
2. `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — workflow-subordinate with audit-before-apply;
3. `RestCrmSyncAdapter` — downstream-only;
4. `RestFailureTransport` — optional monitoring-only pattern.

See [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md).

## Compatibility

Apply [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md):

- in-process public interfaces follow core SemVer;
- existing v1 wire paths and headers remain stable;
- additive optional changes are normally compatible;
- changes to required fields/methods, authority, authentication, state or idempotency are normally breaking;
- vendor API changes should be absorbed inside an adapter when the normalized OTP contract can remain stable;
- mutating adapters must not silently downgrade protocol versions;
- breaking changes require an explicit migration/version path.

## Authority rules

- catalogue does not gain booking or payment authority;
- CRM and ERP/accounting remain downstream-only;
- supplier results are audited before local application and must pass local transition rules;
- `PaymentRepository` remains independent from Stripe/Redsys checkout modules;
- payment browser returns remain non-authoritative;
- monitoring delivery never changes application state authority.

## Permanent extension gate

Phase 10.3.4 adds the permanent architectural check:

```bash
npm run check:extension-contracts
```

Implementation:

```text
scripts/extension-contract-check.mjs
```

It is part of `npm run verify` and is also executed by the blocking workflow:

```text
.github/workflows/extension-contracts.yml
```

The gate protects:

- the exact public interface inventory;
- provider-neutral interface purity;
- downstream-only CRM/ERP method surfaces;
- supplier audit-before-apply ordering and authority limits;
- provider-neutral `PaymentRepository` semantics;
- documented v1 contract/header/schema/signature identifiers;
- transport safety properties of the reference adapters;
- synchronization of central EN/ES extension documentation.

The dedicated workflow also runs the real local-HTTP contract suite:

```bash
npm run test:rest-adapter-contracts
```

See [`EXTENSION-VALIDATION.md`](EXTENSION-VALIDATION.md).

## New adapter checklist

A new external adapter should preserve, where applicable:

1. explicit opt-in composition;
2. server-side privileged configuration;
3. production HTTPS and redirect rejection;
4. bounded timeout and response size;
5. runtime validation before domain entry;
6. stable normalized errors;
7. deterministic idempotency for mutations;
8. audit-before-apply for external workflow state;
9. explicit outbound data allowlists;
10. no cross-domain authority escalation;
11. documented contract/version behavior.

## Validation

Before proposing an extension change:

```bash
npm run check:extension-contracts
npm run verify
```

If a legitimate public contract change causes the gate to fail, update the compatibility classification, inventory/authority documentation, runtime tests and `extension-contract-check.mjs` together. The gate represents the intended public model and must not be bypassed only to accommodate one provider implementation.
