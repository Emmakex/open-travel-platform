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
npm run check:upgrade-deprecations
npm run check:contribution-templates
npm run verify
```

The permanent gates protect extension architecture, release/migration conventions, upgrade/deprecation lifecycle and contribution/release templates. `verify` includes them plus the other project checks, TypeScript validation and production build.

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

Official reference patterns remain `RestBookingRepository`, `RestSupplierFulfilmentAdapter` + coordinator, `RestCrmSyncAdapter` and monitoring-only `RestFailureTransport`.

## Compatibility

- public in-process interfaces follow core SemVer;
- preserve current v1 wire paths/header names unless introducing an explicit new version;
- provider API changes should be absorbed inside the adapter whenever possible;
- mutating adapters must not silently fall back from a newer contract to an older one;
- breaking public changes require explicit migration/versioning guidance;
- ordinary public removal follows the Phase 10.5 deprecation lifecycle and does not occur in PATCH/MINOR releases.

## Release and migration impact

Read:

- [`docs/RELEASES.md`](docs/RELEASES.md) — SemVer, immutable tags, CHANGELOG and release sequence;
- [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md) — configuration/data/wire/key migration, expand → migrate → contract, verification and recovery;
- [`docs/UPGRADES.md`](docs/UPGRADES.md) — supported source/target paths and production upgrade sequence;
- [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md) — lifecycle `ACTIVE → DEPRECATED → REMOVED` and ordinary major-only removal.

Every non-trivial PR must classify, when applicable:

- PATCH/MINOR/MAJOR compatibility impact;
- configuration/environment changes;
- persistent-data/index/backfill changes;
- public wire/event migration;
- protected/encrypted data impact;
- deployment order/compatibility window;
- rollback/recovery path.

Do not add hidden destructive database migrations to application startup. Operational migrations must be deliberate, reviewable and recoverable.

## Upgrade and deprecation impact

A PR that changes a public surface must state whether the lifecycle impact is:

- no lifecycle change;
- `active → deprecated`;
- `deprecated → removed`;
- accelerated security exception.

For a deprecation/removal include the deprecated surface, replacement, first deprecated release, earliest ordinary removal release, supported source/target path, migration/rollback impact, warning/documentation changes and any security rationale.

A routine removal without a prior deprecation notice is breaking by default and must not be represented as PATCH/MINOR maintenance.

## Contribution and release templates

Read [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md) before changing GitHub contribution/release workflow.

The repository uses exactly one canonical pull request template:

```text
.github/PULL_REQUEST_TEMPLATE.md
```

It turns the architecture/release policies into a practical checklist covering scope, SemVer, migrations, lifecycle, authority/security/privacy, UX/accessibility, validation and documentation.

Issue forms under `.github/ISSUE_TEMPLATE/` collect safe triage context without asking reporters for production credentials, private customer data or protected Traveller Data. Security vulnerabilities go through `SECURITY.md` rather than public issues.

Maintainers use:

```text
.github/RELEASE_TEMPLATE.md
```

as the reusable release-notes checklist. It does not automate publication: releases still require verified `main`, immutable `vX.Y.Z` tags and the procedures in `RELEASES.md`, `MIGRATIONS.md`, `UPGRADES.md` and `DEPRECATIONS.md`.

The permanent template gate is:

```bash
npm run check:contribution-templates
```

Do not reintroduce case-variant duplicate PR templates.

## Pull requests

A PR should explain:

- what changes and why;
- affected capability/extension boundary;
- authority/security implications;
- compatibility impact;
- release/migration impact;
- upgrade/deprecation impact;
- configuration/migration requirements;
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
