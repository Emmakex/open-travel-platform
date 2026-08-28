# Release conventions

<p align="center"><strong>English</strong> · <a href="./RELEASES.es.md">Español</a></p>

Status: **Phase 10.4 — COMPLETE**

## Purpose

Open Travel Platform uses reproducible, immutable releases. A release is a reviewed commit from `main`, identified by the package version and an immutable Git tag.

This document defines the public release contract for the MIT core. Kairoseth Travel may deploy the core independently, but hosted deployment state does not redefine the public core version.

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
2. **Review migrations** — classify configuration, data and wire-contract changes using [`MIGRATIONS.md`](MIGRATIONS.md).
3. **Update version** — set `package.json` to the target stable version.
4. **Finalize changelog** — move relevant Unreleased entries into `## [X.Y.Z] - YYYY-MM-DD`; preserve an Unreleased section for future work.
5. **Synchronize documentation** — README, ROADMAP, migration guidance and capability docs must describe the release truthfully.
6. **Validate from the locked graph**:

```bash
npm ci
npm run verify
```

7. **Validate the production runtime boundary**:

```bash
npm run build
npm run package:standalone
```

8. **Merge the release PR to `main`** only after required CI is green.
9. **Verify `main`** after merge.
10. **Create immutable tag** `vX.Y.Z` on that verified `main` commit.
11. **Publish release notes** from the matching CHANGELOG entry, including migration/rollback notes when applicable.
12. **Deploy consumers separately**; a hosted deployment should record the exact core release/commit it runs.

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

Breaking or operationally significant changes must contain enough migration information to point operators to the exact required procedure.

Historical release entries are records. Do not rewrite them merely because current dependency/tool versions have changed.

## Release artifact contract

The provider-neutral production runtime is the Next.js standalone output documented in [`DEPLOYMENT.md`](DEPLOYMENT.md).

A release consumer should build from the exact tagged source/lockfile and treat the resulting runtime artifact as immutable. Runtime secrets and customer data are deployment state, not release contents.

Never commit or package production credentials into a public release.

## Migration gate

A release that changes persistent state, required configuration or a public wire contract must include migration guidance in the same release PR.

Required questions:

- Is the change backward-compatible?
- Does deployment require new environment variables?
- Does MongoDB data/index state need transformation?
- Is a public REST/event contract version changing?
- Is encrypted/protected data affected?
- Can old application code still read the migrated state during rollout?
- What is the rollback plan?

See [`MIGRATIONS.md`](MIGRATIONS.md).

## Rollback

Application rollback should normally deploy the previous known-good immutable release artifact/tag.

Do not solve a bad release by moving an existing tag.

If persistent data has already been migrated, rollback feasibility depends on the migration class:

- additive/expand migrations should preserve previous-reader compatibility during the declared window;
- destructive/contract steps require an explicit backup/restore or reverse-migration plan;
- irreversible changes must be declared before release and require a tested recovery procedure.

## Security releases

Security fixes may require compressed disclosure/deprecation timelines, but they do not bypass validation, release identity or migration safety.

Follow [`../SECURITY.md`](../SECURITY.md) for vulnerability handling.

## Automation

Release/migration convention drift is protected by:

```bash
npm run check:release
npm run check:release-migrations
npm run verify
```

The Phase 10.4 gate validates required docs, release identity conventions, migration safety language and CI registration.

## Phase completion record

Phase 10.4 satisfies the project completion rule: implementation, validation, EN/ES documentation, README/ROADMAP/CHANGELOG synchronization, required CI, merge to `main`, and verification of `main` are mandatory before any later Phase 10 slice is considered active.
