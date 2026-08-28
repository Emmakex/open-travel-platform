# Release conventions

<p align="center"><strong>English</strong> · <a href="./RELEASES.es.md">Español</a></p>

Status: **Phase 10.4 — COMPLETE**

## Purpose

Open Travel Platform uses reproducible, immutable releases. A release is a reviewed commit from `main`, identified by the package version and an immutable Git tag.

This document defines the public release contract for the MIT core. Kairoseth Travel may deploy the core independently, but hosted deployment state does not redefine the public core version.

Release identity is complemented by the operational lifecycle policies in [`UPGRADES.md`](UPGRADES.md) and [`DEPRECATIONS.md`](DEPRECATIONS.md).

## Version format

Public stable releases use Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Git tags use:

```text
vX.Y.Z
```

Examples:

```text
package.json  -> 1.2.3
Git tag       -> v1.2.3
CHANGELOG     -> ## [1.2.3] - YYYY-MM-DD
```

Current project checks intentionally accept stable `x.y.z` package versions only. Introducing prerelease versions such as `-rc.1` requires a deliberate future policy/check change.

## SemVer policy

### PATCH

Use a patch release for backward-compatible fixes that do not require consumers to change public configuration, public contracts or persistent data interpretation.

Examples:

- bug fixes;
- security fixes that preserve supported public behavior;
- documentation corrections;
- performance improvements without contract changes.

### MINOR

Use a minor release for backward-compatible additions.

Examples:

- new optional capabilities;
- new opt-in adapters behind existing contracts;
- additive optional fields with safe absence;
- new endpoints/event types that do not alter existing subscribers.

PATCH/MINOR releases must not perform an ordinary removal of a previously supported public surface. Deprecation and ordinary removal follow [`DEPRECATIONS.md`](DEPRECATIONS.md).

### MAJOR

Use a major release for breaking public changes.

Examples:

- removed or renamed required public fields/methods;
- incompatible environment/configuration requirements;
- changed authority, authentication or idempotency semantics;
- breaking wire-contract changes without a parallel compatible version;
- persistent-data changes that require an incompatible migration.

Extension-specific compatibility rules remain authoritative in [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

## Release source of truth

A public release must be cut from a reviewed commit already merged to `main`.

The following values must agree:

- `package.json` version;
- README version badge;
- `CHANGELOG.md` release heading;
- Git tag `vX.Y.Z`.

Tags are immutable. Never move, delete/recreate or reuse a published version tag to change release contents.

## Required release sequence

1. **Choose version impact** — PATCH, MINOR or MAJOR from the actual compatibility impact.
2. **Review deprecations/removals** — classify lifecycle changes through [`DEPRECATIONS.md`](DEPRECATIONS.md).
3. **Review migrations** — classify configuration, data and wire-contract changes using [`MIGRATIONS.md`](MIGRATIONS.md).
4. **Review supported upgrade path** — ensure the target release documents its supported source path through [`UPGRADES.md`](UPGRADES.md).
5. **Update version** — set `package.json` to the target stable version.
6. **Finalize changelog** — move relevant Unreleased entries into `## [X.Y.Z] - YYYY-MM-DD`; preserve an Unreleased section for future work.
7. **Synchronize documentation** — README, ROADMAP, migration/upgrade/deprecation guidance and capability docs must describe the release truthfully.
8. **Validate from the locked graph**:

```bash
npm ci
npm run verify
```

9. **Validate the production runtime boundary**:

```bash
npm run build
npm run package:standalone
```

10. **Merge the release PR to `main`** only after required CI is green.
11. **Verify `main`** after merge.
12. **Create immutable tag** `vX.Y.Z` on that verified `main` commit.
13. **Publish release notes** from the matching CHANGELOG entry, including migration/upgrade/deprecation notes when applicable.
14. **Deploy consumers separately**; a hosted deployment should record the exact core release/commit it runs.

A release tag must never be created from an unmerged feature branch.

## Changelog contract

`CHANGELOG.md` follows a release-history model with an Unreleased section plus immutable historical release entries.

Each release entry should distinguish relevant categories such as:

- Added;
- Changed;
- Fixed;
- Security;
- Deprecated;
- Removed;
- Migration;
- Compatibility.

A deprecation entry identifies the replacement and earliest ordinary removal boundary. A removal entry links the corresponding upgrade/migration path. Breaking or operationally significant changes must contain enough information to reach the exact required procedure.

Historical release entries are records. Do not rewrite them merely because current dependency/tool versions or lifecycle state have changed.

## Release artifact contract

The provider-neutral production runtime is the Next.js standalone output documented in [`DEPLOYMENT.md`](DEPLOYMENT.md).

A release consumer should build from the exact tagged source/lockfile and treat the resulting runtime artifact as immutable. Runtime secrets and customer data are deployment state, not release contents.

Never commit or package production credentials into a public release.

## Migration and upgrade gate

A release that changes persistent state, required configuration or a public wire contract must include migration and supported-upgrade guidance in the same release PR.

Required questions:

- Is the change backward-compatible?
- Does deployment require new environment variables?
- Does MongoDB data/index state need transformation?
- Is a public REST/event contract version changing?
- Is encrypted/protected data affected?
- Is any surface deprecated or removed?
- What is the minimum supported source release?
- Can old application code still read the migrated state during rollout?
- What is the rollback/recovery plan?

See [`MIGRATIONS.md`](MIGRATIONS.md), [`UPGRADES.md`](UPGRADES.md) and [`DEPRECATIONS.md`](DEPRECATIONS.md).

## Rollback

Application rollback should normally deploy the previous known-good immutable release artifact/tag.

Do not solve a bad release by moving an existing tag.

If persistent data has already been migrated, rollback feasibility depends on the migration class:

- additive/expand migrations should preserve previous-reader compatibility during the declared window;
- destructive/contract steps require an explicit backup/restore or reverse-migration plan;
- irreversible changes must be declared before release and require a tested recovery procedure.

## Security releases

Security fixes may require compressed deprecation/removal timelines, but they do not bypass validation, release identity or migration safety. Accelerated removal must follow the security exception in [`DEPRECATIONS.md`](DEPRECATIONS.md).

Follow [`../SECURITY.md`](../SECURITY.md) for vulnerability handling.

## Automation

Release/lifecycle convention drift is protected by:

```bash
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run verify
```

Phase 10.4 protects release/migration identity and Phase 10.5 protects the upgrade/deprecation lifecycle layered on top of it.
