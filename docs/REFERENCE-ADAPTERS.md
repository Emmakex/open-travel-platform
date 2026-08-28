# Contributor-facing reference adapters

<p align="center"><strong>English</strong> · <a href="./REFERENCE-ADAPTERS.es.md">Español</a></p>

Status: **Phase 10.3.3 — COMPLETE candidate pending green CI + merge**  
Scope: provider-neutral reference implementations already shipped in the MIT core  
Prerequisites: [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md) and [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md)

## Purpose

Open Travel Platform already contains production-shaped generic adapters. Phase 10.3.3 designates a small set of those real implementations as the contributor-facing references instead of creating parallel toy adapters that could drift from the runtime.

The references demonstrate three different authority models:

1. `RestBookingRepository` — **bounded repository authority**;
2. `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — **workflow-subordinate synchronization with audit-before-apply**;
3. `RestCrmSyncAdapter` — **downstream-only synchronization**.

These are patterns, not vendor integrations. A commercial/Kairoseth/customer adapter may depend on the public contracts, but the MIT core must never depend on the proprietary implementation.

---

## Reference A — bounded repository authority

Primary implementation:

- `adapters/rest-booking-repository.ts`
- interface: `repositories/booking-repository.ts`
- contract parser/version: `lib/rest-booking-contract.ts`
- runtime config: `lib/rest-booking-config.ts`
- composition: `lib/booking-repository.ts`
- contract guide: [`REST-BOOKING-ADAPTER.md`](REST-BOOKING-ADAPTER.md)

### What this reference demonstrates

`RestBookingRepository` shows how to replace a bounded source/persistence capability without leaking provider payloads or silently gaining authority over other domains.

The implementation demonstrates:

- explicit interface implementation;
- server-only runtime configuration;
- versioned `/v1` HTTP contract;
- required response contract header;
- bounded timeouts and response sizes;
- redirect rejection;
- JSON/content-type validation;
- normalized stable application errors;
- explicit 404 handling where the interface permits `null`;
- request correlation IDs;
- deterministic idempotency keys on mutations;
- retry only for transient transport/server outcomes;
- runtime parsing before external data becomes domain data;
- customer identity/scope checks after parsing;
- trip/departure scope validation for created reservations.

### Authority rule

Implementing `BookingRepository` grants authority only inside the booking contract. It does **not** grant authority over:

- the local payment/refund ledger;
- staff workflow permissions;
- protected Traveller Data;
- CRM/ERP reverse writes;
- supplier fulfilment state outside its explicit workflow contract.

A provider response that contains unrelated fields must be ignored rather than promoted into domain authority.

### Minimal contributor sequence

When building another booking backend:

1. implement `BookingRepository` rather than importing provider types into pages/components;
2. normalize provider payloads inside the adapter;
3. preserve identity/scope checks;
4. preserve idempotency for create/cancel mutations;
5. absorb provider API version churn internally whenever the stable OTP contract can remain unchanged;
6. add a new public contract version only when the OTP-facing contract itself must break;
7. add provider-specific tests without weakening the existing generic v1 contract tests.

---

## Reference B — workflow-subordinate external state

Primary implementation:

- `adapters/rest-supplier-fulfilment-adapter.ts`
- interface: `repositories/supplier-fulfilment-adapter.ts`
- coordinator: `lib/supplier-fulfilment-sync.ts`
- response parser/version: `lib/rest-supplier-fulfilment-contract.ts`
- runtime config: `lib/supplier-fulfilment-adapter-config.ts`
- contract guide: [`SUPPLIER-FULFILMENT-ADAPTER.md`](SUPPLIER-FULFILMENT-ADAPTER.md)

### What this reference demonstrates

This pair shows the distinction between **transporting an external result** and **granting that result local workflow authority**.

`RestSupplierFulfilmentAdapter` demonstrates:

- an explicit outbound allowlist via `safeRequestBody()`;
- server-only authentication;
- contract-version headers;
- request IDs and operation headers;
- deterministic idempotency for request/cancel operations;
- bounded network behavior;
- runtime response validation and stable errors.

`performSupplierAdapterOperation()` demonstrates the local authority boundary:

1. validate whether the requested local operation is allowed;
2. call the external adapter;
3. validate the normalized result;
4. **persist an audit record for the received external response before local application**;
5. apply the result through the existing local `saveSupplierFulfilment()` workflow;
6. reject/conflict if the local state machine does not permit the external transition;
7. enrich the audit record with applied/no-change/conflict/failed outcome.

### Authority rule

The supplier system is not the local state machine. It may report a normalized supplier status/reference, but Open Travel Platform remains responsible for deciding whether that result can be applied locally.

A supplier adapter must not rewrite:

- customer totals;
- authoritative payment/refund movements;
- trip/service inventory;
- supplier costs unless a separate explicit contract permits it;
- traveller or protected post-purchase data.

### Minimal contributor sequence

For another supplier API:

1. implement `SupplierFulfilmentAdapter`;
2. keep provider request/response types private to the adapter;
3. return only normalized `SupplierAdapterResult` values;
4. preserve deterministic idempotency for mutating operations;
5. never call local persistence directly from the provider transport adapter;
6. route the result through the existing coordinator/audit/state-transition path.

---

## Reference C — downstream-only synchronization

Primary implementation:

- `adapters/rest-crm-sync-adapter.ts`
- interface: `repositories/crm-sync-adapter.ts`
- contract parser/version: `lib/rest-crm-contract.ts`
- runtime config: `lib/crm-sync-config.ts`
- composition/event delivery: `lib/crm-sync.ts` + integration outbox
- contract guide: [`CRM-SYNC-ADAPTER.md`](CRM-SYNC-ADAPTER.md)

### What this reference demonstrates

`RestCrmSyncAdapter` shows how to send normalized local snapshots to an external system without turning that system into a reverse mutation authority.

The implementation demonstrates:

- explicit allowlisted contact/reservation request bodies;
- no raw MongoDB/provider object forwarding;
- versioned `/v1` endpoints and response headers;
- server-only bearer credentials;
- request correlation and operation headers;
- event-derived idempotency supplied by the caller;
- bounded timeout/response size and redirect rejection;
- runtime validation of acknowledgement payloads;
- normalized stable error codes;
- transient retry without changing mutation identity.

### Authority rule

CRM is downstream-only. The acknowledgement (`externalId`, `outcome`) confirms delivery/upsert state but cannot mutate:

- booking/pricing/inventory authority;
- payment ledger history;
- supplier workflow state;
- protected Traveller Data;
- staff authorization.

Reverse CRM-to-core mutation requires a separate explicitly reviewed capability contract; it must never be smuggled into `CrmSyncAdapter`.

### Minimal contributor sequence

For another CRM:

1. map the normalized OTP snapshot to the vendor payload inside the adapter;
2. keep the same local idempotency key for retries;
3. return only the normalized acknowledgement contract;
4. store vendor-specific mapping/metadata outside core domain objects where needed;
5. do not add reverse writes to this downstream interface.

---

## Optional fourth pattern — monitoring-only delivery

`RestFailureTransport` is the reference for a best-effort, monitoring-only boundary:

- `adapters/rest-failure-transport.ts`
- `repositories/failure-transport.ts`
- [`FAILURE-TRANSPORT.md`](FAILURE-TRANSPORT.md)

It demonstrates normalized/redacted operational delivery with bounded transport. Collector availability must never affect booking/payment/integration authority.

---

## Common reference checklist

A new external adapter should preserve all applicable items below:

- explicit opt-in composition;
- provider-neutral public interface;
- server-only credentials for privileged integrations;
- HTTPS enforcement in production;
- redirect rejection across trust boundaries;
- bounded timeout and response size;
- runtime validation before provider data crosses into domain types;
- normalized stable errors;
- deterministic idempotency for mutating operations;
- explicit outbound data allowlists;
- no secret/raw-provider/protected Traveller Data leakage;
- no hidden cross-domain authority escalation;
- documented contract/version behavior;
- provider API version changes absorbed inside the adapter when possible.

## Copy pattern for a new adapter

A contributor should normally create these pieces:

```text
repositories/<capability>.ts            # stable OTP-facing interface (only if one does not already exist)
adapters/<provider>-<capability>.ts     # provider translation/transport
lib/<capability>-config.ts              # server-only validated runtime config
lib/<provider>-contract.ts              # runtime parser/version constants when network contract is public
lib/<capability>-composition.ts         # explicit opt-in selector
```

If the existing public interface is sufficient, **do not change it** just to mirror a provider SDK.

## v1 → v2 migration example

Suppose a future booking contract must change a required field or mutation semantic.

Correct migration:

1. keep `/v1/...` and `X-OTP-Contract-Version: 1` stable during the supported deprecation window;
2. introduce `/v2/...` with an explicit v2 contract/parser;
3. add a separately selected v2 adapter/mode or explicit configuration;
4. migrate deployments deliberately;
5. remove v1 only in a release that satisfies the published deprecation/major-version policy.

Incorrect migration:

- silently change the meaning of a v1 field;
- automatically retry a failed v2 mutation against v1;
- reuse the v1 header while sending a breaking v2 payload;
- make a downstream adapter authoritative as part of the migration.

See [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

## Proprietary adapter boundary

A private Kairoseth/customer adapter may have a layout such as:

```text
private-package/
  adapters/vendor-booking.ts
  config/vendor-booking-config.ts
  tests/vendor-booking-contract.test.ts
```

It may import the public OTP contract/types. The public MIT repository must not import the private package or require its credentials to build, demo, test or self-host.

## Verification before proposing an adapter

Run the existing relevant tests plus:

```bash
npm run verify
```

For network adapters, also add/extend real local-HTTP contract tests that cover:

- valid response;
- invalid JSON/schema/content type;
- wrong contract version;
- authentication failure;
- timeout/response-size bound;
- retry/idempotency behavior;
- scope/authority rejection where applicable.

Phase 10.3.4 will add a permanent static/runtime gate that protects the extension model itself. This guide intentionally does not claim that gate exists yet.

## Related documentation

- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md)
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md)
- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`REST-BOOKING-ADAPTER.md`](REST-BOOKING-ADAPTER.md)
- [`SUPPLIER-FULFILMENT-ADAPTER.md`](SUPPLIER-FULFILMENT-ADAPTER.md)
- [`CRM-SYNC-ADAPTER.md`](CRM-SYNC-ADAPTER.md)
- [`FAILURE-TRANSPORT.md`](FAILURE-TRANSPORT.md)
