# Permanent extension-contract validation

<p align="center"><strong>English</strong> · <a href="./EXTENSION-VALIDATION.es.md">Español</a></p>

Status: **Phase 10.3.4 — COMPLETE**  
Gate: `npm run check:extension-contracts`  
Implementation: `scripts/extension-contract-check.mjs`  
Dedicated CI: `.github/workflows/extension-contracts.yml`

## Purpose

Phase 10.3.4 turns the extension model documented in 10.3.1–10.3.3 into a permanent automated contract. The goal is to fail early when a future change silently alters the public extension inventory, authority boundaries, wire versions, reference-adapter safety or contributor documentation.

The gate complements the existing adapter-specific checks. It does not replace real integration tests.

## What the static gate protects

`check:extension-contracts` verifies the following categories.

### 1. Public extension inventory

The current public `repositories/*.ts` inventory must remain exactly the documented nine first-class interfaces:

- `BookingRepository`
- `CrmSyncAdapter`
- `ErpAccountingAdapter`
- `FailureTransport`
- `IdentityRepository`
- `OperationsRepository`
- `PaymentRepository`
- `SupplierFulfilmentAdapter`
- `TravelRepository`

If a contributor adds/removes a first-class interface, the gate fails until the inventory, authority map and validation rules are deliberately updated.

### 2. Repository/interface purity

Public repository/adapter contracts may not directly depend on:

- concrete `adapters/*` implementations;
- application `lib/*` implementations;
- MongoDB;
- deployment environment variables;
- direct network `fetch()` calls.

This keeps public contracts provider-neutral and prevents implementation details from becoming accidental API dependencies.

### 3. Downstream/workflow authority

The gate fixes the allowed method surfaces of the authority-sensitive interfaces:

- `CrmSyncAdapter`: `upsertContact`, `upsertReservation` only;
- `ErpAccountingAdapter`: `upsertMovement` only;
- `SupplierFulfilmentAdapter`: `execute` only;
- `FailureTransport`: `deliver` only.

It also rejects common reverse-authority method shapes in CRM/ERP and prevents supplier fulfilment from gaining customer-total or supplier-cost mutation fields through its public command/result contract.

A legitimate future expansion requires an explicit contract review and a corresponding gate update; it cannot arrive silently.

### 4. Supplier audit-before-apply

The supplier synchronization coordinator must retain this order:

```text
external response
    ↓
persist received-response audit
    ↓
apply through local saveSupplierFulfilment/state-transition path
    ↓
record applied/no-change/conflict/failed outcome
```

The gate asserts that the received-response audit occurs before the local application call and that invalid transitions remain rejected.

### 5. Contract/version identifiers

The gate protects the existing v1 identifiers documented by Phase 10.3.2:

- Booking: `X-OTP-Contract-Version: 1`;
- Supplier: `X-OTP-Contract-Version: 1`;
- CRM: `X-OTP-Contract-Version: 1`;
- ERP/accounting: `X-OTP-Accounting-Contract-Version: 1`;
- FailureTransport: `X-OTP-Failure-Contract-Version: 1`;
- `FailureTransportEvent.schemaVersion: 1`;
- `IntegrationEventEnvelope.version: 1`;
- generic webhook signing scheme: `X-OTP-Signature: v1=...`.

Changing one of these requires deliberate version/migration work under `EXTENSION-COMPATIBILITY.md` rather than an in-place edit.

### 6. Reference-adapter safety

The designated Booking, Supplier and CRM references must retain:

- redirect rejection;
- bounded timeout handling;
- bounded response handling;
- JSON media-type validation;
- no `NEXT_PUBLIC_*` privileged configuration;
- HTTPS enforcement in production configuration.

`RestFailureTransport` is checked for the equivalent monitoring-transport protections.

### 7. Documentation synchronization

The permanent gate requires the core extension documents and central project files to remain present and to document `check:extension-contracts`.

This makes README/ROADMAP/CONTRIBUTING drift a CI failure rather than a manual discovery later.

## Runtime validation

The dedicated **Extension contract validation** workflow is blocking and executes:

```bash
npm run check:extension-contracts
npm run test:rest-adapter-contracts
```

The second command uses a real local HTTP server and continues to verify actual Booking/Supplier/CRM/ERP contract behavior such as version headers, schema/content-type rejection, retries, response-size bounds, scope checks and stable idempotency keys.

The main `CI` workflow also retains the real REST adapter contract suite.

## Registration

The permanent static gate is registered in:

```text
package.json
  check:extension-contracts -> node scripts/extension-contract-check.mjs
  verify                    -> ... && npm run check:extension-contracts && ...
```

CI registration:

```text
.github/workflows/extension-contracts.yml
```

Therefore a normal contributor can run the same static invariant locally through either:

```bash
npm run check:extension-contracts
```

or the complete project validation:

```bash
npm run verify
```

## How to change the extension model intentionally

When a legitimate change needs to alter a protected invariant:

1. update the public interface or wire contract deliberately;
2. classify the change under `EXTENSION-COMPATIBILITY.md`;
3. create the required new version/migration path when breaking;
4. update `EXTENSION-POINT-INVENTORY.md` and authority documentation;
5. update contributor references when the recommended pattern changes;
6. update `extension-contract-check.mjs` to encode the new intended invariant;
7. add/adjust runtime contract tests;
8. update EN/ES README, ROADMAP, CHANGELOG and relevant contract docs;
9. require green CI, merge to `main`, and verify `main` before advancing.

The gate is intentionally strict: updating it is part of changing the public extension contract, not a workaround for a failing test.

## Relationship to existing checks

`check:extension-contracts` is the architectural umbrella gate. Existing focused checks remain valuable and are not removed, including:

- `check:rest-booking-adapter`;
- `check:supplier-fulfilment-adapter`;
- `check:crm-sync-adapter`;
- `check:erp-accounting-adapter`;
- `check:adapter-contract-validation`;
- `check:failure-transport`;
- `test:rest-adapter-contracts` in CI.

Focused checks test each capability deeply; the new gate protects cross-capability extension-model consistency.

## Phase 10.3 completion

All Phase 10.3 slices are complete:

```text
10.3.1  Inventory + authority map                 COMPLETE
10.3.2  Compatibility/versioning                  COMPLETE
10.3.3  Contributor reference adapters            COMPLETE
10.3.4  Permanent automated validation            COMPLETE
10.3     Extension contracts/reference adapters   COMPLETE
```

The permanent validation introduced here remains a required safeguard for future public extension changes. Every later phase must still satisfy the project completion rule before the next phase begins.

## Related documentation

- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md)
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md)
- [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md)
- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
