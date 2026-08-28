# Contributing

Thanks for helping improve Open Travel Platform.

## Development setup

Use Node.js 24 LTS and the npm version declared in `packageManager`.

```bash
npm ci
npm run setup:demo
npm run dev
```

The demo bootstrap is infrastructure-free. Use `.env.example` only when persistent/live capabilities are required. Do not commit real customer data or production configuration.

## Required validation

Before opening a pull request, run:

```bash
npm run check:extension-contracts
npm run check:release-migrations
npm run verify
```

`check:extension-contracts` protects the public extension architecture. `check:release-migrations` protects release and migration conventions. `verify` includes both gates plus the other permanent project checks, TypeScript validation and production build.

GitHub Actions additionally exercises real MongoDB replica sets, local HTTP adapter contracts, privacy, accessibility, recovery and performance/resource baselines.

## Architecture rules

- Keep `domain/` independent from Next.js, browser APIs, persistence and vendor SDKs.
- Put provider integrations behind explicit repository/adapter boundaries.
- Do not expand `BookingRepository` into a staff administration API; internal workflows belong behind `OperationsRepository`.
- Keep authorization checks on trusted server-side boundaries.
- Revalidate prices, availability, capacity, ownership and state transitions server-side for real writes.
- Keep demo data fictional.
- Provider-specific payloads stay inside adapters and must be normalized before entering shared domain types.
- A downstream provider must never silently gain booking, inventory, pricing, payment or staff authority outside its contract.

## Extension model

Read before introducing or changing an adapter:

- [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md)
- [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md)
- [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md)
- [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md)
- [`docs/EXTENSION-VALIDATION.md`](docs/EXTENSION-VALIDATION.md)
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md)

Official reference patterns:

- `RestBookingRepository` — bounded repository authority;
- `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — workflow-subordinate, audit-before-apply;
- `RestCrmSyncAdapter` — downstream-only;
- `RestFailureTransport` — monitoring-only reference.

## Permanent extension validation

The static gate is implemented at:

```text
scripts/extension-contract-check.mjs
```

and exposed as:

```bash
npm run check:extension-contracts
```

It protects the public interface inventory, interface purity, authority-sensitive method surfaces, supplier audit-before-apply, v1 contract identifiers, reference-adapter transport properties and central documentation consistency.

The blocking workflow `.github/workflows/extension-contracts.yml` runs both the static gate and:

```bash
npm run test:rest-adapter-contracts
```

If a legitimate public contract change requires changing a protected invariant, update the compatibility classification, inventory/authority docs, runtime tests and the gate together. Do not weaken the gate only to mirror a provider SDK.

## Compatibility

- public in-process interfaces follow core SemVer;
- preserve current v1 wire paths/header names unless introducing an explicit new version;
- provider API changes should be absorbed inside the adapter whenever possible;
- mutating adapters must not silently fall back from a newer contract to an older one;
- breaking public changes require explicit migration/versioning guidance.

## Release and migration impact

Every non-trivial PR must classify whether it affects release or migration behavior.

Read:

- [`docs/RELEASES.md`](docs/RELEASES.md) — SemVer, immutable `vX.Y.Z` tags, CHANGELOG and release sequence;
- [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md) — configuration/data/wire/key migration classes, expand → migrate → contract, verification and rollback.

A PR should explicitly state when applicable:

- PATCH/MINOR/MAJOR compatibility impact;
- required environment/configuration changes;
- persistent-data/index/backfill changes;
- public wire/event contract migration;
- protected/encrypted data impact;
- deployment order/compatibility window;
- rollback/recovery path.

Do not add hidden destructive database migrations to application startup. Operational migrations must be deliberate, reviewable and recoverable.

A public release is cut only from verified `main`; package version, README badge, CHANGELOG entry and immutable Git tag must agree.

## Pull requests

A PR should explain:

- what changes and why;
- affected capability/extension boundary;
- authority/security implications;
- compatibility impact;
- **Release and migration impact**;
- configuration or migration requirements;
- rollback/recovery when state changes;
- how the change was validated.

Kairoseth-specific or customer-specific adapters may remain outside the public MIT core. The core may define the contract they consume but must not depend on proprietary implementations.

## Phase completion rule

A phase/slice is not complete until:

1. implementation/scope is finished;
2. tests/validation pass;
3. relevant EN/ES documentation, README, ROADMAP and CHANGELOG are synchronized;
4. the PR diff matches the intended phase scope;
5. required CI is green;
6. the PR is merged to `main`;
7. `main` is verified before the next phase starts.

## Security reports

Do not disclose exploitable vulnerabilities in public issues. Follow `SECURITY.md` for private reporting guidance.
