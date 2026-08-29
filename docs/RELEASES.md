# Release conventions

<p align="center"><strong>English</strong> · <a href="./RELEASES.es.md">Español</a></p>

Status: **Phase 10.4 policy COMPLETE; Phase 11.4 audited distribution lifecycle added**

## Purpose

Open Travel Platform uses reproducible, immutable public releases. A release is a reviewed commit already merged to `main`, identified by the package version, an immutable Git tag and—when OCI distribution applies—the verified published image digest.

This policy is complemented by [`MIGRATIONS.md`](MIGRATIONS.md), [`UPGRADES.md`](UPGRADES.md), [`DEPRECATIONS.md`](DEPRECATIONS.md), [`REGISTRY.md`](REGISTRY.md) and [`DEPLOYMENT-RECIPES.md`](DEPLOYMENT-RECIPES.md).

## Version format

Public stable releases use Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Git tags use:

```text
vX.Y.Z
```

Release identity must agree across:

```text
package.json  -> X.Y.Z
README badge  -> X.Y.Z
CHANGELOG.md  -> ## [X.Y.Z] - YYYY-MM-DD
Git tag       -> vX.Y.Z
```

**Tags are immutable.** Never move, delete/recreate or reuse a published version tag to change release contents.

Current project checks accept stable `x.y.z` versions only. A prerelease policy would require an explicit future change.

## SemVer policy

### PATCH

Backward-compatible fixes that do not require consumers to change supported public contracts, required configuration or persistent-data interpretation.

### MINOR

Backward-compatible additions such as optional capabilities, additive adapters or new optional distribution surfaces.

PATCH/MINOR releases must not perform an ordinary removal of a supported public surface.

### MAJOR

Breaking public changes, including incompatible required fields/methods/configuration, authority/authentication/idempotency semantics, wire contracts or persistent-data migrations.

Extension compatibility remains governed by [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

## Source of truth

A public release is cut only from a reviewed revision already **merged to `main`**.

Before release publication, maintainers must **Verify `main`** and ensure the current release audit passes on that exact revision.

The version-specific audit and release notes are:

```text
docs/RELEASE-AUDIT-X.Y.Z.md
docs/RELEASE-AUDIT-X.Y.Z.es.md
docs/RELEASE-NOTES-X.Y.Z.md
docs/RELEASE-NOTES-X.Y.Z.es.md
```

Historical audits remain historical records. For example, `check:phase-10-release` preserves the v1.1.0 closeout rather than being rewritten for newer versions.

## Required release sequence

1. **Choose SemVer impact** from the actual compatibility change.
2. **Review deprecations/removals** with `DEPRECATIONS.md`.
3. **Review migrations** with `MIGRATIONS.md`.
4. **Review supported upgrade path** with `UPGRADES.md`.
5. **Update release identity** across `package.json`, README, CHANGELOG and version-specific audit/release notes.
6. **Retain `Unreleased`** in CHANGELOG.
7. **Synchronize EN/ES documentation.**
8. **Validate from the locked graph:**

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:release-audit
npm run verify
npm run package:standalone
```

9. **Open/review the closing PR.**
10. **Merge to `main` only after required CI is green.**
11. **Verify `main`** after merge.
12. Let the blocking **`Release audit`** workflow validate that exact merged revision.
13. Let **`Publish audited release`** create the immutable `vX.Y.Z` tag and GitHub Release only when the version audit explicitly approves it.
14. When OCI distribution applies, let **`Publish audited container`** publish only if the SemVer tag resolves to the exact audited SHA.
15. Let **`Verify published distribution`** verify the exact public OCI digest, metadata, provenance, SBOM, attestation and runtime before declaring the distribution release complete.
16. Deploy consumers separately using exact version/SHA/digest identities.

A public tag must never be created from an unmerged feature branch.

## Audited publication automation

### Release audit

`Release audit` runs on the merged `main` revision and requires:

- release identity consistency;
- version-specific release approval;
- `npm run verify`;
- standalone packaging.

### Immutable source release

`Publish audited release` is downstream of the successful `Release audit`. It refuses to rewrite an existing tag/release and uses the reviewed version-specific release notes.

### OCI publication

`Publish audited container` is downstream of the source release. It requires tag SHA = audited SHA and emits only immutable SemVer/SHA image tags. Historical `v1.1.0` is deliberately excluded from retroactive OCI publication.

### Published artifact verification

For releases with OCI distribution, `Verify published distribution` verifies:

- public pullability;
- SemVer/SHA image tags resolving to the same digest;
- OCI source/revision/version/license metadata;
- BuildKit provenance;
- SBOM;
- GitHub artifact attestation;
- clean runtime by digest;
- non-root identity;
- liveness/readiness and representative HTTP/static behavior.

The verification record is attached to the GitHub Release when the workflow succeeds.

## Changelog contract

`CHANGELOG.md` keeps an `Unreleased` section plus immutable historical release entries. Release entries should cover relevant Added, Changed, Fixed, Security, Deprecated, Removed, Migration and Compatibility information.

Historical release entries are records; do not rewrite them merely because current tooling or policy has evolved.

## Migration gate

Any release that changes persistent state, required configuration or public wire contracts must include migration and supported-upgrade guidance in the same release PR.

Required review questions include:

- Is it backward-compatible?
- Are new environment variables required?
- Does MongoDB data/index state change?
- Does a REST/event contract version change?
- Is encrypted/protected data affected?
- Is any public surface deprecated or removed?
- What source release is the minimum supported upgrade point?
- Can previous code still read state during rollout?
- What is the rollback/recovery plan?

See [`MIGRATIONS.md`](MIGRATIONS.md), [`UPGRADES.md`](UPGRADES.md) and [`DEPRECATIONS.md`](DEPRECATIONS.md).

## Rollback

Application **Rollback** normally deploys the previous known-good immutable application identity. Never solve a bad release by moving an existing Git tag or a published OCI tag.

For OCI deployments, record the exact previous digest and roll back by digest. If persistent data already changed, recovery depends on the documented migration class: application-only rollback, reverse migration, backup restore or forward-only recovery.

## Security releases

Security fixes may compress deprecation/removal timelines, but they do not bypass release identity, validation, migration safety or artifact verification. Follow `SECURITY.md` and the security exception in `DEPRECATIONS.md`.

## Permanent validation

```bash
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:release-audit
npm run check:phase-11-distribution
npm run verify
```

Phase 10.4 remains the release/migration policy foundation. Phase 11.4 adds the reusable audited source + OCI publication/verification lifecycle without rewriting historical release records.
