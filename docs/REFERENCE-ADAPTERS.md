# Contributor-facing reference adapters

<p align="center"><strong>English</strong> · <a href="./REFERENCE-ADAPTERS.es.md">Español</a></p>

Status: **Phase 10.3.3 — COMPLETE**  
Scope: provider-neutral reference implementations already shipped in the MIT core

## Purpose

Phase 10.3.3 designates real, production-shaped generic adapters already present in Open Travel Platform as the official contributor references. This avoids creating parallel toy adapters that could drift from runtime behavior or from CI coverage.

The reference set demonstrates three authority models:

1. `RestBookingRepository` — **bounded repository authority**;
2. `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — **workflow-subordinate synchronization with audit-before-apply**;
3. `RestCrmSyncAdapter` — **downstream-only synchronization**.

`RestFailureTransport` is an optional fourth monitoring-only pattern.

## Reference A — bounded booking repository

Files:

- `adapters/rest-booking-repository.ts`
- `repositories/booking-repository.ts`
- `lib/rest-booking-contract.ts`
- `lib/rest-booking-config.ts`
- `lib/booking-repository.ts`
- [`REST-BOOKING-ADAPTER.md`](REST-BOOKING-ADAPTER.md)

This reference demonstrates:

- explicit interface implementation;
- server-only runtime configuration;
- versioned `/v1` wire contract;
- required contract-version response header;
- bounded timeout/response size and redirect rejection;
- runtime JSON/content-type/schema parsing;
- normalized stable errors;
- request correlation;
- deterministic idempotency on mutations;
- transient retry while preserving mutation identity;
- customer identity/scope validation;
- trip/departure scope validation.

Authority stays bounded to booking. The adapter does not gain payment-ledger, staff-workflow, CRM/ERP, supplier or protected-Traveller-Data authority.

## Reference B — supplier workflow synchronization

Files:

- `adapters/rest-supplier-fulfilment-adapter.ts`
- `repositories/supplier-fulfilment-adapter.ts`
- `lib/supplier-fulfilment-sync.ts`
- `lib/rest-supplier-fulfilment-contract.ts`
- `lib/supplier-fulfilment-adapter-config.ts`
- [`SUPPLIER-FULFILMENT-ADAPTER.md`](SUPPLIER-FULFILMENT-ADAPTER.md)

The transport adapter demonstrates:

- explicit outbound allowlist through `safeRequestBody()`;
- server-only authentication;
- versioned contract headers;
- request/operation correlation;
- deterministic idempotency for request/cancel;
- bounded network behavior;
- runtime response normalization.

The coordinator demonstrates the authority boundary:

1. validate the requested local operation;
2. call the external adapter;
3. validate the normalized result;
4. **persist the received external response audit before local application**;
5. apply through the existing local state-transition path;
6. reject a conflicting external state if local workflow rules do not permit it;
7. record applied/no-change/conflict/failed outcome.

The supplier never becomes the local state machine and cannot rewrite unrelated customer totals, payment history, inventory or protected traveller data.

## Reference C — downstream-only CRM synchronization

Files:

- `adapters/rest-crm-sync-adapter.ts`
- `repositories/crm-sync-adapter.ts`
- `lib/rest-crm-contract.ts`
- `lib/crm-sync-config.ts`
- `lib/crm-sync.ts`
- [`CRM-SYNC-ADAPTER.md`](CRM-SYNC-ADAPTER.md)

This reference demonstrates:

- allowlisted normalized customer/reservation snapshots;
- no raw provider/MongoDB object forwarding;
- versioned `/v1` contract;
- server-only bearer credentials;
- request/operation correlation;
- event-derived idempotency;
- bounded timeout/response size and redirect rejection;
- runtime acknowledgement parsing;
- normalized stable errors;
- transient retry with the same idempotency identity.

CRM remains downstream-only. Its acknowledgement cannot mutate booking, pricing, inventory, payment, supplier workflow, protected Traveller Data or staff authorization.

## Optional monitoring-only reference

`RestFailureTransport` demonstrates best-effort normalized/redacted operational delivery with bounded transport. Collector availability never changes application authority.

See [`FAILURE-TRANSPORT.md`](FAILURE-TRANSPORT.md).

## Common contributor checklist

A new adapter should preserve all applicable properties:

- explicit opt-in composition;
- provider-neutral public interface;
- server-only credentials for privileged transports;
- HTTPS enforcement in production;
- redirect rejection across trust boundaries;
- bounded timeout and response size;
- runtime validation before external data enters domain types;
- stable normalized application errors;
- deterministic idempotency for mutations;
- explicit outbound data allowlists;
- no protected Traveller Data, secrets or raw-provider leakage;
- no hidden cross-domain authority escalation;
- documented contract/version behavior;
- vendor API churn absorbed inside the adapter whenever the public OTP contract can remain stable.

## Suggested file layout

```text
repositories/<capability>.ts            # only if a stable OTP interface does not already exist
adapters/<provider>-<capability>.ts     # provider translation/transport
lib/<capability>-config.ts              # validated server-only config
lib/<provider>-contract.ts              # runtime parser/version constants when needed
lib/<capability>-composition.ts         # explicit opt-in selector
```

If the existing public interface is sufficient, do not change it just to mirror a vendor SDK.

## v1 → v2 example

For a genuinely breaking booking-wire change:

1. keep `/v1/...` and `X-OTP-Contract-Version: 1` stable during the deprecation window;
2. introduce a separate `/v2/...` parser/contract;
3. select v2 explicitly in configuration/composition;
4. migrate deployments deliberately;
5. remove v1 only under the published deprecation/major-version policy.

Never:

- silently change v1 semantics;
- retry a failed v2 mutation against v1;
- send a breaking v2 payload under the v1 header;
- use a version migration to grant new cross-domain authority.

See [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

## Proprietary adapter boundary

Private Kairoseth/customer/vendor adapters may import public OTP contracts and types. The MIT core must not import the private package or require its credentials for build, test, demo or self-host.

## Permanent validation

The Phase 10.3.4 gate now protects these reference patterns through:

```bash
npm run check:extension-contracts
npm run test:rest-adapter-contracts
npm run verify
```

`check:extension-contracts` verifies the public extension inventory, authority surfaces, v1 identifiers, audit-before-apply ordering, server-only/bounded transport properties, reference documentation and CI registration. The local-HTTP suite continues to exercise runtime contract behavior such as version rejection, scope checks, response bounds, retries and idempotency.

Any contributor adding or changing a public extension surface must update the implementation, the relevant EN/ES documentation and the permanent gate in the same pull request.

See [`EXTENSION-VALIDATION.md`](EXTENSION-VALIDATION.md).

## Related documentation

- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md)
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md)
- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md)
- [`EXTENSION-VALIDATION.md`](EXTENSION-VALIDATION.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
