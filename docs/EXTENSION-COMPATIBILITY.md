# Public extension compatibility and versioning policy

<p align="center"><strong>English</strong> · <a href="./EXTENSION-COMPATIBILITY.es.md">Español</a></p>

Status: **Phase 10.3.2 — COMPLETE**  
Permanent enforcement: `npm run check:extension-contracts`

## Purpose

Open Travel Platform exposes several different extension-contract forms:

- TypeScript repository/adapter interfaces;
- versioned REST contracts;
- versioned integration-event envelopes;
- webhook-signature semantics;
- failure-event/transport schema;
- a legacy read-only HTTP catalogue contract without an explicit version header.

These surfaces do not use one artificial global extension version. They share one compatibility policy.

## Governing principles

1. **Authority is part of the contract.** Giving an adapter new cross-domain authority is breaking even when the shape is unchanged.
2. **Provider churn should be absorbed inside adapters.** Vendor API upgrades are not automatically OTP contract changes.
3. **Existing v1 wire identifiers stay stable.** Renaming an existing v1 path/header is itself breaking.
4. **No silent downgrade for mutations.** A v2 mutation may not retry as v1 after a mismatch.
5. **Event-schema and signature-scheme versions are independent.** `event.version` does not version the HMAC syntax and `X-OTP-Signature: v1=...` does not version payload semantics.
6. **Deprecation precedes ordinary removal.** Breaking removal requires a migration path unless an urgent security change makes a faster transition necessary.
7. **Shipped code identifiers are authoritative.** Documentation must follow the actual constants and paths.

## Current contract families

| Family | Current identity | Version mechanism |
|---|---|---|
| In-process interfaces | `repositories/*.ts` | core SemVer |
| Booking REST | `/v1/...` | `X-OTP-Contract-Version: 1` |
| Supplier REST | `/v1/...` | `X-OTP-Contract-Version: 1` |
| CRM REST | `/v1/...` | `X-OTP-Contract-Version: 1` |
| ERP/accounting REST | `/v1/...` | `X-OTP-Accounting-Contract-Version: 1` |
| Failure transport | normalized failure event | `X-OTP-Failure-Contract-Version: 1` + `schemaVersion: 1` |
| Integration events | `IntegrationEventEnvelope` | `version: 1` |
| Webhook signing | signed HTTPS delivery | `X-OTP-Signature: v1=...` |
| HTTP catalogue | read-only routes | legacy-v1 semantics, no explicit version header |

## In-process interface compatibility

Public repository/adapter interfaces are released with the core package/repository version.

Normally compatible:

- new optional fields with safe absence/default behavior;
- a new implementation behind existing composition without changing the interface;
- new helper types that do not make existing implementations invalid.

Normally breaking:

- removing/renaming a required method;
- adding a required method that existing implementations must implement;
- changing required argument/result semantics;
- changing authority or ownership assumptions;
- changing idempotency or state-transition meaning.

A vendor SDK shape is never sufficient reason to break a public interface. Map it inside the adapter where possible.

## REST/HTTP compatibility

Within an existing v1 contract, normally compatible changes include optional response fields that consumers may ignore and new endpoints that do not change old endpoint behavior.

Breaking changes include:

- required-field removal/rename/addition;
- path/method changes;
- auth/version-header changes;
- status/state semantic changes;
- idempotency semantic changes;
- authority expansion;
- protected-data allowlist expansion.

A breaking wire change requires a new explicit versioned surface such as `/v2` rather than changing `/v1` in place.

The specialized ERP/accounting and FailureTransport v1 headers remain valid and are not renamed merely for cosmetic consistency.

## Legacy catalogue compatibility

The current read-only catalogue HTTP source has no explicit version header. It is therefore treated as **legacy-v1 semantics**:

- additive optional evolution is allowed;
- existing route/result meaning remains stable;
- breaking evolution requires a new explicitly versioned catalogue contract rather than changing current routes in place.

## Event compatibility

`IntegrationEventEnvelope.version` versions event schema/payload semantics.

Compatible evolution can include a new event type or optional payload field when existing consumers can ignore it safely.

Breaking evolution includes removing/renaming required payload fields, changing replay/idempotency identity or changing the meaning of an existing event/state.

A breaking schema requires a new event version and explicit consumer migration.

## Webhook signature compatibility

`X-OTP-Signature: v1=...` versions the cryptographic signing format only.

A future signature algorithm/canonicalization change must introduce a new signing-scheme version and a deliberate transition. It does not automatically imply an event schema change.

## Failure transport compatibility

Failure delivery has two explicit dimensions:

- wire header `X-OTP-Failure-Contract-Version: 1`;
- normalized `FailureTransportEvent.schemaVersion: 1`.

Changing the collector transport and changing the failure event shape are separate decisions.

## Compatibility matrix

| Change | Default classification |
|---|---|
| Add optional field with safe absence | compatible |
| Add required field/method | breaking |
| Remove/rename field/method | breaking |
| Add new implementation behind existing interface | compatible |
| Add new endpoint/event type without changing old behavior | compatible |
| Add new observable status/state | breaking by default; review required |
| Change auth/version header | breaking |
| Change idempotency semantics | breaking |
| Change authority model | breaking/new reviewed contract |
| Widen protected-data allowlist | breaking/security review |
| Upgrade provider API internally while normalized OTP contract stays stable | compatible to OTP |

## Deprecation and migration

The global lifecycle is defined by [`DEPRECATIONS.md`](DEPRECATIONS.md) and supported upgrade paths by [`UPGRADES.md`](UPGRADES.md). Ordinary removal of a public extension surface occurs only at/after its announced MAJOR boundary; PATCH/MINOR releases do not use migration work to bypass that lifecycle.

A breaking public change should document:

- old and new contract identities;
- deprecation period and earliest ordinary removal release;
- deployment/configuration migration steps;
- idempotency/replay implications;
- rollback constraints;
- minimum OTP release supporting the new contract.

Mutating payment/accounting/supplier flows additionally require explicit duplicate/reconciliation analysis.

## v1 → v2 rule

Correct migration:

1. keep v1 stable during the supported migration period;
2. introduce explicit v2 contract/parser;
3. select/migrate v2 deliberately;
4. retire v1 only according to [`DEPRECATIONS.md`](DEPRECATIONS.md) and the release lifecycle.

Never retry a failed v2 mutation as v1 automatically.

## Permanent enforcement

Phase 10.3.4 encodes the shipped compatibility identities in:

```bash
npm run check:extension-contracts
```

Phase 10.5 additionally protects the upgrade/deprecation lifecycle through:

```bash
npm run check:upgrade-deprecations
```

See [`EXTENSION-VALIDATION.md`](EXTENSION-VALIDATION.md).

## Related documentation

- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md)
- [`REFERENCE-ADAPTERS.md`](REFERENCE-ADAPTERS.md)
- [`EXTENSION-VALIDATION.md`](EXTENSION-VALIDATION.md)
- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md)
- [`UPGRADES.md`](UPGRADES.md)
- [`DEPRECATIONS.md`](DEPRECATIONS.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
