# Contributing

Thanks for helping improve Open Travel Platform.

## Development setup

1. Fork or clone the repository.
2. Use Node.js 24 LTS and the npm version declared in `packageManager`.
3. Install the locked dependency graph with `npm ci`.
4. Run the non-destructive demo bootstrap for ordinary local work.
5. Keep external integrations disabled unless the change specifically targets that adapter/capability.

```bash
npm ci
npm run setup:demo
npm run dev
```

The demo bootstrap is infrastructure-free and does not require MongoDB, SMTP, payment-provider, CRM, ERP or supplier credentials. It refuses to overwrite an existing `.env.local` unless explicitly forced.

Use `.env.example` only when you need persistent/live capabilities. Never commit production credentials or customer data.

## Required validation

Before opening a pull request, run:

```bash
npm run verify
```

`verify` runs permanent safety/domain/security/extension-adjacent invariants, TypeScript validation and the production build. Dedicated GitHub Actions workflows additionally exercise real MongoDB replica sets, local HTTP contracts, accessibility journeys, recovery and performance/resource baselines.

The broad registration -> booking -> customer -> Operator browser journey remains informational/non-blocking by explicit project policy; dedicated critical gates remain blocking.

## Architecture rules

- Keep `domain/` independent from Next.js, browser APIs, persistence and vendor SDKs.
- Put provider integrations behind repository/adapter boundaries instead of importing vendor SDKs throughout UI code.
- Do not expand `BookingRepository` into a staff administration API; internal workflows belong behind `OperationsRepository`.
- Keep authorization checks on trusted server-side boundaries. UI visibility is never sufficient authorization.
- Revalidate prices, availability, capacity, ownership and state transitions server-side for real writes.
- Keep demo data fictional and free of real customer information.
- Never add production credentials, access tokens or customer data to the repository.
- Document environment variables in `.env.example` and deployment docs.
- New demo capabilities must default to disabled in production unless explicitly opted in.
- Provider-specific payloads stay inside adapters and must be normalized before entering shared domain types.
- A downstream provider must never silently gain booking, inventory, pricing, payment or staff authority outside its explicit contract.

## Extensions and adapters

Phase 10.3 formalizes the public extension model. Before introducing or changing an adapter, read:

- [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md) — authority and Phase 10.3 lifecycle;
- [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md) — code-backed public extension inventory;
- [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md) — compatibility/versioning/deprecation/migration;
- [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md) — contributor-facing references backed by existing tested adapters;
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — implementation checklist;
- the capability-specific contract document for Booking, Supplier fulfilment, CRM, ERP/accounting, failure transport or outbound integrations.

### Official reference patterns

Phase 10.3.3 designates these existing implementations as the primary contributor references:

- `RestBookingRepository` — bounded repository authority;
- `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — workflow-subordinate sync with audit-before-apply;
- `RestCrmSyncAdapter` — downstream-only sync;
- `RestFailureTransport` — optional monitoring-only pattern.

Do not create a second toy adapter layer when an existing real reference already demonstrates the pattern.

A production integration should implement the smallest appropriate capability interface and keep provider-specific authentication, payloads and status mapping inside its adapter.

### Compatibility

Changes to public extension contracts must state whether they are backward-compatible or breaking.

- in-process public interfaces follow core SemVer;
- preserve current v1 wire paths/header names unless introducing an explicit new version;
- provider API changes should be absorbed inside the adapter whenever possible;
- mutating adapters must not silently fall back from a newer contract to an older contract;
- breaking public changes require deliberate migration/versioning guidance.

### Adapter pull-request checklist

For a new external adapter, explain and test as applicable:

- explicit opt-in composition;
- server-only credentials;
- HTTPS and redirect policy;
- timeout/response-size bounds;
- runtime provider-to-domain validation;
- stable normalized errors;
- deterministic idempotency for mutations;
- audit-before-apply for external workflow state;
- outbound data allowlist;
- scope/authority checks;
- public contract/version behavior;
- proprietary/private package boundary if the implementation does not belong in the MIT core.

Network adapters should add or extend local-HTTP contract tests for successful responses, invalid schema/content type, wrong version, auth failures, bounds, retry/idempotency and scope/authority rejection where applicable.

## Pull requests

A pull request should explain:

- what changes and why;
- affected capability/extension boundary;
- authority/security implications;
- whether a public contract changes and its compatibility impact;
- configuration or migration requirements;
- how the change was validated.

Small, focused pull requests are preferred. Breaking changes after 1.0 require clear migration/versioning guidance.

Kairoseth-specific or customer-specific adapters may remain outside the public MIT core when appropriate. The public core may define the contract they consume, but must not depend on proprietary implementations.

## Phase completion rule

Project phases/slices are not considered complete until:

1. implementation/scope is finished;
2. tests/validation pass;
3. relevant EN/ES documentation, README, ROADMAP and CHANGELOG are synchronized;
4. the PR is reviewed against the intended phase scope;
5. required CI is green;
6. the PR is merged to `main`;
7. `main` is verified before the next phase starts.

## Security reports

Do not disclose exploitable vulnerabilities or secrets in public issues. Follow `SECURITY.md` for private reporting guidance.
