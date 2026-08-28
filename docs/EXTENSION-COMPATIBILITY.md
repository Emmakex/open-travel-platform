# Public extension compatibility and versioning policy

<p align="center"><strong>English</strong> · <a href="./EXTENSION-COMPATIBILITY.es.md">Español</a></p>

Status: **Phase 10.3.2 — COMPLETE**  
Scope: compatibility, deprecation and breaking-change policy for the public extension surfaces inventoried in Phase 10.3.1  
Reference inventory: [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md)

## Purpose

Open Travel Platform already exposes several kinds of extension contract:

- TypeScript repository/adapter interfaces used in-process;
- versioned REST contracts used by external adapters;
- versioned integration-event envelopes;
- webhook signing semantics;
- a versioned failure-event/transport contract;
- a legacy read-only HTTP catalogue contract without an explicit version header.

These surfaces do not need one artificial global version. They do need one consistent policy for deciding when a change is compatible, when it requires deprecation, and when a new contract version is mandatory.

## Governing principles

1. **Authority is part of the contract.** A change that gives an adapter new cross-domain authority is breaking even if the JSON or TypeScript shape is unchanged.
2. **Provider churn should be absorbed inside adapters.** A vendor API version change is not automatically a core-contract change.
3. **Existing v1 wire identifiers are preserved.** Renaming a current header/path merely for consistency would itself be a breaking change.
4. **No silent downgrade for mutations.** A v2 mutation must never automatically retry as v1 after a version mismatch.
5. **Event-schema version and signature-scheme version are different dimensions.** `event.version` does not version HMAC syntax, and `X-OTP-Signature: v1=...` does not version event payload semantics.
6. **Deprecation precedes removal when practical.** Security fixes can require faster action, but ordinary public-contract removal needs a documented migration path.
7. **The code is authoritative for shipped identifiers.** Documentation may name a contract family, but existing header/path/schema constants define the actual wire contract.

## Current contract families and identifiers

| Contract family | Public identity today | Current versioning mechanism | Compatibility owner |
|---|---|---|---|
| In-process repository/adapter interfaces | files under `repositories/` | Open Travel Platform release SemVer; no per-interface numeric version | core release |
| HTTP catalogue source | `TravelRepository` HTTP implementation | legacy unversioned endpoints (`/destinations`, `/trips`, detail routes) | core release + legacy HTTP compatibility |
| REST booking | `rest-booking-v1` | `/v1` + `X-OTP-Contract-Version: 1` | booking REST contract |
| REST supplier fulfilment | `supplier-fulfilment-rest-v1` | v1 endpoints + `X-OTP-Contract-Version: 1` | supplier REST contract |
| REST CRM sync | `rest-crm-v1` | `/v1/crm/...` + `X-OTP-Contract-Version: 1` | CRM REST contract |
| REST ERP/accounting | `erp-accounting-rest-v1` | `/v1/accounting/...` + `X-OTP-Accounting-Contract-Version: 1` | accounting REST contract |
| Failure transport | `rest-failure-v1` | `X-OTP-Failure-Contract-Version: 1` + `FailureTransportEvent.schemaVersion = 1` | failure transport/event contract |
| Generic integration events | integration-event v1 | `IntegrationEventEnvelope.version = 1` | integration event schema |
| Generic webhook signature | OTP HMAC-SHA256 signing scheme v1 | `X-OTP-Signature: v1=<hex>` | webhook signing scheme |

### Important: shared header name does not mean shared schema

Booking, Supplier and CRM currently use `X-OTP-Contract-Version: 1`. That header name is a common transport convention, **not** a declaration that all three APIs share one schema or one release lifecycle. The endpoint family and adapter contract define the scope of the version value.

ERP/accounting and FailureTransport already use specialized version headers. Phase 10.3.2 preserves those names. Renaming them to the generic header inside v1 would create unnecessary incompatibility.

## 1. In-process TypeScript interface compatibility

The repository is not currently published as a separate public npm SDK (`package.json` is private). Therefore first-class TypeScript interfaces under `repositories/` follow the **Open Travel Platform core release version** rather than carrying independent numeric constants.

### Compatible in-process changes

Normally compatible in a minor or patch release when behavior is preserved:

- adding an optional input field;
- adding an optional output/domain field that existing consumers can ignore;
- widening documentation or error detail without changing stable error semantics;
- adding a new adapter implementation behind an existing interface and explicit opt-in configuration;
- adding a new public interface/capability without changing existing interfaces;
- internal refactoring that leaves the public interface and authority model unchanged.

### Breaking in-process changes

Require a major core compatibility transition or a new parallel contract:

- removing or renaming a public method;
- adding a new **required** method to an interface implemented by third parties;
- changing parameter order or required parameter types;
- making an optional input required;
- removing a returned field that consumers may rely on;
- narrowing accepted values;
- changing a status/state meaning;
- changing idempotency or concurrency expectations;
- moving authority from one domain boundary to another;
- turning a downstream-only/workflow-subordinate adapter into a reverse mutation API.

### Union and enum evolution

Adding a new status/union member can break exhaustive consumers or runtime mappings even when TypeScript structural typing appears additive. Treat new externally observable state values as **contract-significant**. Add them within the current version only when the contract explicitly allows unknown/future values; otherwise use a breaking transition or a compatibility shim.

## 2. REST/HTTP contract compatibility

### Version handshake

For adapters with explicit version headers, the client sends the exact supported version and the successful response must return the expected version when the current implementation requires response validation.

A version mismatch is a contract error. The adapter must fail closed rather than guessing payload semantics.

### Compatible REST changes within v1

Normally compatible:

- adding optional request fields that the server may ignore;
- adding optional response fields that the existing parser ignores;
- adding new endpoints without changing existing endpoints;
- adding new stable error codes while preserving existing success/error meaning;
- improving transport hardening without changing successful contract semantics;
- increasing implementation detail inside the provider adapter while keeping the normalized core contract unchanged.

### Breaking REST changes

Require a new wire version/path/header value or a deliberate migration layer:

- removing/renaming required request or response fields;
- making an optional field required;
- changing an endpoint path or HTTP method used by the current contract;
- changing authentication requirements or the required version header;
- changing status values or their meaning;
- changing mutation idempotency semantics or `Idempotency-Key` meaning;
- changing ownership/scope assumptions;
- changing amount/currency/reference semantics in accounting/payment-related contracts;
- widening outbound data beyond the documented privacy/security allowlist;
- converting a downstream-only operation into reverse mutation authority.

### No automatic downgrade for mutations

A failed v2 `POST`/mutation must not be automatically retried against v1. The first request may have reached the provider even if the response failed or the version handshake was rejected. Automatic protocol fallback can create duplicate or semantically different writes.

Read-only migrations may support explicit caller-selected fallback only if documented and tested, never as hidden behavior.

## 3. Legacy HTTP catalogue contract

`HttpTravelRepository` currently calls unversioned read-only routes:

```text
GET /destinations
GET /destinations/:slug
GET /trips
GET /trips/:slug
```

The contract predates Phase 10.3 version formalization and does not send a contract-version header.

Phase 10.3.2 freezes the current behavior as **legacy catalogue v1 semantics**:

- additive optional fields remain allowed;
- current route/method and core field semantics remain stable;
- existing clients must not be broken in place;
- a future breaking catalogue API must introduce a new explicit versioned contract (for example a new path/mode/adapter) rather than silently changing these legacy routes;
- no secret authentication should be added to the current browser-visible `NEXT_PUBLIC_TRAVEL_API_URL` contract. A privileged catalogue source requires a server-side boundary.

This preserves current adopters without pretending an unversioned URL was always formally versioned.

## 4. Integration-event compatibility

`IntegrationEventEnvelope.version` currently has the literal value `1`.

### Compatible event-v1 changes

Normally compatible:

- adding an optional payload field whose absence has a safe meaning;
- adding metadata that old consumers can ignore;
- adding a **new event type** when existing generic webhook endpoints receive events only through explicit subscription and are not silently subscribed to the new type.

### Breaking event changes

Require a new event schema version for the affected event contract:

- removing/renaming a required payload field;
- changing field type or semantic meaning;
- changing aggregate identity semantics;
- changing monetary meaning/currency semantics;
- changing an existing event type to represent a different business transition;
- making previously omitted protected/internal data part of the generic event contract;
- changing replay/idempotency identity in a way that can duplicate downstream business actions.

### Event version is not signature version

`event.version = 1` versions the event envelope/payload contract.

`X-OTP-Signature: v1=<hex>` versions the signature construction/verification scheme.

A future event-v2 can still use signature-v1 if the HMAC algorithm/canonical signing input is unchanged. Conversely, a future signature-v2 could sign event-v1 payloads. These dimensions must be migrated and tested independently.

## 5. Failure transport compatibility

Failure visibility has two explicit compatibility dimensions today:

- wire transport header: `X-OTP-Failure-Contract-Version: 1`;
- normalized event object: `FailureTransportEvent.schemaVersion = 1`.

They are currently aligned but should not be assumed inseparable.

Compatible changes include optional allowlisted fields that preserve redaction and safe-token rules. Any change that widens sensitive data exposure, changes severity semantics, changes required envelope fields or turns monitoring into application authority is breaking regardless of version syntax.

## 6. Authority changes are always breaking

The Phase 10.3.1 authority map is part of compatibility.

The following changes are breaking even if no field changes:

- CRM gaining reverse reservation mutation;
- ERP acknowledgement rewriting the local ledger;
- supplier response bypassing the local fulfilment state machine;
- failure collector availability becoming a readiness dependency;
- browser payment return becoming authoritative payment confirmation;
- catalogue or identity adapters receiving unrelated booking/payment mutation authority.

A new business requirement for one of these behaviors requires a separate, explicitly reviewed capability contract.

## 7. Idempotency and retry compatibility

For mutation contracts, idempotency is a public behavior:

- the same logical operation must keep its documented stable idempotency identity across transport retry and durable replay where applicable;
- changing idempotency-key construction in a way that can create duplicate downstream rows/actions is breaking;
- retryable HTTP status categories may be refined only when duplicate-write safety remains preserved;
- a provider adapter may change its internal retry implementation without a contract bump if externally observable mutation semantics remain unchanged.

## 8. Deprecation lifecycle

Ordinary public contract removal should follow this sequence:

1. **announce** the deprecated interface/field/endpoint/version in documentation and `CHANGELOG.md`;
2. **provide replacement guidance** including mapping and authority differences;
3. **support coexistence** where practical for at least one tagged minor-release transition or an explicitly documented migration window;
4. **avoid new features** on the deprecated version except security/correctness fixes;
5. **remove only in a breaking release/version transition** unless urgent security constraints require faster action;
6. **retain migration notes** after removal so self-hosters can upgrade old deployments safely.

Because this repository is an application/core rather than a separately published SDK, migration windows are expressed through tagged releases and release notes rather than npm package deprecation metadata.

## 9. Core SemVer policy for extension contracts

For releases after this policy is adopted:

- **PATCH** — bug fixes, security hardening or documentation corrections that preserve public extension shape/semantics/authority;
- **MINOR** — additive compatible capabilities, optional fields, new adapters behind explicit opt-in, new event types with safe subscription semantics;
- **MAJOR** — breaking interface/wire/schema changes or authority/idempotency/authentication/state-semantic changes that cannot be preserved through a compatibility layer.

A provider-specific private adapter can release independently as long as it continues satisfying the supported public core contract.

## 10. Migration documentation requirements

Any breaking extension-contract change must document:

- old and new contract identifiers;
- exact affected interfaces/endpoints/events;
- field/status/error/auth/idempotency differences;
- authority-model differences;
- configuration changes;
- whether both versions can coexist;
- data/backfill/replay implications;
- rollback constraints;
- minimum Open Travel Platform release supporting the new contract.

Payment/accounting/supplier mutations additionally require explicit duplicate/reconciliation considerations.

## 11. Compatibility matrix

| Change | Typed interface | REST/HTTP | Event schema | Default classification |
|---|---:|---:|---:|---|
| Add optional field with safe absence | Compatible | Compatible | Compatible | additive |
| Add required input field | Breaking | Breaking | Breaking when producer/consumer requirement changes | major/new version |
| Remove/rename field or method | Breaking | Breaking | Breaking | major/new version |
| Add new implementation behind existing opt-in mode | Compatible | n/a | n/a | minor |
| Add new endpoint/event type without changing old subscriptions | n/a | Compatible | Compatible | minor |
| Add new observable status value | Usually breaking | Usually breaking | Usually breaking | review/new version |
| Change auth/version header | n/a | Breaking | n/a | new wire version |
| Change idempotency semantics | Breaking behavior | Breaking | Breaking if replay identity changes | new version/major |
| Change authority model | Breaking | Breaking | Breaking | separate reviewed contract |
| Widen protected-data allowlist | Security/contract review | Breaking by default | Breaking by default | new version + review |
| Internal provider API upgrade absorbed inside adapter | Compatible | Compatible to core | Compatible to core | adapter implementation change |

## 12. Phase 10.3.2 decisions

Phase 10.3.2 closes with these decisions:

- no global extension-version constant is introduced;
- in-process interface compatibility follows core release SemVer;
- current REST v1 paths/headers are preserved exactly;
- ERP and FailureTransport specialized headers are not renamed inside v1;
- the unversioned HTTP catalogue is frozen as legacy-v1 semantics and cannot be broken in place;
- event schema version and webhook signature version are explicitly independent;
- authority, idempotency, authentication and protected-data boundaries are contract semantics, not implementation details;
- automatic protocol downgrade for mutations is prohibited;
- breaking changes require explicit migration documentation and a major/new-version transition.

## Next slice

**Phase 10.3.3 — contributor-facing reference adapters/examples** should demonstrate these compatibility rules in concrete provider-neutral examples without adding a commercial vendor dependency.

Reference examples should show how to:

- implement a new bounded source/repository adapter;
- implement a downstream-only adapter without reverse authority;
- preserve stable idempotency/version headers;
- map a provider API upgrade inside the adapter while keeping the public core contract stable;
- handle a deliberate v1 → v2 migration without hidden fallback.

## Related documentation

- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md)
- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`REST-BOOKING-ADAPTER.md`](REST-BOOKING-ADAPTER.md)
- [`SUPPLIER-FULFILMENT-ADAPTER.md`](SUPPLIER-FULFILMENT-ADAPTER.md)
- [`CRM-SYNC-ADAPTER.md`](CRM-SYNC-ADAPTER.md)
- [`ERP-ACCOUNTING-ADAPTER.md`](ERP-ACCOUNTING-ADAPTER.md)
- [`OUTBOUND-INTEGRATIONS.md`](OUTBOUND-INTEGRATIONS.md)
- [`FAILURE-TRANSPORT.md`](FAILURE-TRANSPORT.md)
- [`API-CONTRACT.md`](API-CONTRACT.md)
