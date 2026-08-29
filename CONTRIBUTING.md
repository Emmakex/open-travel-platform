# Contributing

Thanks for helping improve Open Travel Platform.

## Development setup

Use Node.js 24 LTS and the npm version declared in `packageManager`.

```bash
npm ci
npm run setup:demo
npm run dev
```

The demo bootstrap is infrastructure-free. Use `.env.example` only when persistent/live capabilities are required. Do not commit real customer data, credentials or production configuration.

## Required validation

Before opening a pull request, run the relevant permanent gates and always finish with `npm run verify`:

```bash
npm run check:extension-contracts
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:contribution-templates
npm run check:branding-policy
npm run check:phase-10-release
npm run check:container
npm run check:registry-provenance
npm run check:deployment-recipes
npm run check:release-audit
npm run check:phase-11-distribution
npm run verify
```

The gates protect extension architecture, release/migration conventions, upgrade/deprecation lifecycle, contribution/release templates, branding/trademark separation, the historical Phase 10 v1.1.0 audit, container distribution, registry/provenance policy, deployment recipes, the current release audit and the Phase 11 distribution closeout.

GitHub Actions additionally exercises MongoDB replica sets, adapter contracts, privacy, accessibility, recovery, performance/resource baselines, standalone packaging, Docker build/start, Compose deployment recipes and post-publication OCI verification when a new audited container release exists.

## Architecture rules

- Keep `domain/` independent from Next.js, browser APIs, persistence and vendor SDKs.
- Put provider integrations behind explicit repository/adapter boundaries.
- Do not expand `BookingRepository` into staff administration; staff workflows belong behind `OperationsRepository`.
- Keep authorization checks on trusted server-side boundaries.
- Revalidate prices, availability, capacity, ownership and state transitions server-side for real writes.
- Keep demo data fictional.
- Normalize provider payloads before shared domain types.
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

## Release and migration impact

Read:

- [`docs/RELEASES.md`](docs/RELEASES.md)
- [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md)
- [`docs/UPGRADES.md`](docs/UPGRADES.md)
- [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md)

Every non-trivial PR must classify, when applicable:

- PATCH / MINOR / MAJOR compatibility impact;
- configuration/environment changes;
- persistent-data/index/backfill changes;
- public wire/event changes;
- protected/encrypted data impact;
- deployment order/compatibility window;
- rollback/recovery path.

Public in-process interfaces follow core SemVer. Preserve existing v1 wire identifiers unless adding an explicit new version. Ordinary public removal follows `ACTIVE → DEPRECATED → REMOVED` and does not occur in PATCH/MINOR releases.

Do not add hidden destructive database migrations to application startup. Operational migrations must be deliberate, reviewable and recoverable.

## Upgrade and deprecation impact

For public-surface changes, state whether the lifecycle impact is no change, `ACTIVE → DEPRECATED`, `DEPRECATED → REMOVED`, or an accelerated security exception. Include replacement, migration path, earliest ordinary removal boundary and rollback/recovery implications whenever lifecycle changes.

## Contribution and release templates

Read [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md).

Canonical surfaces:

```text
.github/PULL_REQUEST_TEMPLATE.md
.github/RELEASE_TEMPLATE.md
```

The release template supplements, but does not replace, the policies in `RELEASES.md`, `MIGRATIONS.md`, `UPGRADES.md` and `DEPRECATIONS.md`.

Permanent gate:

```bash
npm run check:contribution-templates
```

Do not reintroduce case-variant duplicate PR templates.

## Branding / trademark impact

Read [`TRADEMARKS.md`](TRADEMARKS.md) before changing public project names, Kairoseth/Kairoseth Travel wording, official-status claims, logos or wordmarks.

The software remains MIT-licensed. That license does not by itself permit an independently operated fork/service to claim it is official Kairoseth Travel.

Permanent gate:

```bash
npm run check:branding-policy
```

## Container and distribution changes

Read [`docs/CONTAINERS.md`](docs/CONTAINERS.md).

Container changes must preserve:

- Node.js 24-compatible standalone runtime;
- non-root final user `app` / UID/GID `10001:10001`;
- secrets and privileged configuration supplied only at runtime;
- `/api/health/live` liveness and `/api/health/ready` production readiness;
- infrastructure-free demo operation;
- no private Kairoseth/customer adapters or credentials in the public image.

Validate with:

```bash
npm run check:container
```

## Registry and provenance changes

**Phase 11.2** defines the public registry/provenance contract. Read [`docs/REGISTRY.md`](docs/REGISTRY.md).

Preserve:

- publication only after a successful audited source release;
- exact SemVer tag ↔ audited `main` SHA equality;
- immutable `vX.Y.Z` and `sha-<full-source-sha>` tags only;
- no `latest`, moving major/minor or `stable` aliases;
- deployment identity by OCI digest;
- OCI source/revision/version/license metadata;
- BuildKit `provenance: mode=max` and SBOM from the publishing build;
- GitHub artifact attestation tied to the pushed digest;
- full-SHA-pinned publishing Actions and minimal permissions;
- no retroactive image for historical v1.1.0;
- no private Kairoseth/customer configuration in the public package.

Validate with:

```bash
npm run check:registry-provenance
```

## Deployment recipe changes

**Phase 11.3** defines the provider-neutral orchestration baseline. Read [`docs/DEPLOYMENT-RECIPES.md`](docs/DEPLOYMENT-RECIPES.md).

Preserve immutable production digests, no source rebuild on production hosts, fixed non-root UID/GID, read-only root filesystem, dropped capabilities, no privilege escalation, Kubernetes `RuntimeDefault` seccomp, external secrets/state, external production MongoDB, liveness/readiness semantics, provider-neutral TLS/ingress and upgrade/rollback by verified digest.

Validate with:

```bash
npm run check:deployment-recipes
```

## Audited releases and published distribution

**Phase 11.4** separates historical release audits from the reusable current-release pipeline.

For a new public stable release:

1. classify SemVer from actual compatibility impact;
2. synchronize `package.json`, README badge, CHANGELOG, version-specific release audit and release notes;
3. run `npm run check:release-audit` and `npm run verify`;
4. merge only after required PR CI is green;
5. verify merged `main`;
6. let the blocking `Release audit` workflow validate that exact `main` revision;
7. create/publish the immutable source tag/GitHub Release only through `Publish audited release`;
8. publish the OCI artifact only when the tag resolves to the exact audited SHA;
9. verify the published distribution by exact digest before considering the distribution release complete.

The historical Phase 10 audit remains intentionally version-specific for `v1.1.0`; do not mutate it to represent newer releases.

Permanent current-release and Phase 11 gates:

```bash
npm run check:release-audit
npm run check:phase-11-distribution
```

A distribution verification must confirm SemVer/SHA tag digest equality, OCI labels, SBOM, provenance, GitHub artifact attestation, public pull, digest-based runtime, UID/GID, liveness/readiness and representative HTTP/static behavior. The release record should retain the exact source tag/SHA and OCI digest for rollback.

## Pull requests

A PR should explain:

- what changes and why;
- affected capability/extension boundary;
- authority/security/privacy implications;
- compatibility and SemVer impact;
- release/migration and upgrade/deprecation impact;
- branding/trademark impact when public identity changes;
- container/distribution impact when the deployable artifact changes;
- registry/provenance impact when image publication or supply-chain identity changes;
- deployment recipe/orchestrator impact when topology changes;
- configuration/migration requirements;
- rollback/recovery;
- validation performed.

Kairoseth-specific/customer-specific adapters may remain outside the public MIT core. The public core may define the contract they consume but must not depend on proprietary implementations.

## Phase completion rule

A phase/slice is not complete until:

1. implementation/scope is finished;
2. tests/validation pass;
3. relevant EN/ES documentation, README, ROADMAP and CHANGELOG are synchronized;
4. the PR diff matches the intended phase scope;
5. required CI is green;
6. the PR is merged to `main`;
7. `main` is verified;
8. when the phase creates a public release/distribution, the immutable release and artifact are published and verified before later roadmap work starts.

## Security reports

Do not disclose exploitable vulnerabilities in public issues. Follow `SECURITY.md` for private reporting guidance.
