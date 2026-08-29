# Open Travel Platform v1.2.0 release audit

**Phase 11 — Distribution & deployment ecosystem closeout**  
**Release classification:** MINOR / backward-compatible  
**Audit date:** 29 August 2026

## Approval

**RELEASE APPROVED FOR v1.2.0** subject to the permanent delivery gate: this release PR must be fully green, squash-merged to `main`, and the merged `main` revision must pass the reusable `Release audit`. Only then may the immutable source tag/GitHub Release and OCI distribution be published. Phase 11 is only operationally closed after the published distribution itself passes `Verify published distribution`.

## Why 1.2.0

v1.2.0 adds backward-compatible distribution and deployment capabilities to the existing v1.1.0 public core:

- reproducible OCI/Docker packaging;
- audited GHCR publication with immutable SemVer/SHA identities;
- OCI source/revision/version/license metadata;
- BuildKit max provenance and SBOM;
- GitHub artifact attestation tied to the OCI digest;
- provider-neutral Docker Compose and Kubernetes deployment recipes;
- digest-based upgrade/rollback guidance;
- clean published-distribution verification.

No supported repository/adapter interface, REST/event/signature contract or persistent-data schema is intentionally removed or incompatibly changed. This is therefore a MINOR release under the existing SemVer policy.

## Compatibility and migration

- Public API/domain compatibility: backward-compatible.
- Required persistent-data migration: none.
- Required MongoDB/index migration: none introduced by Phase 11.
- Required configuration migration: none for existing source/standalone consumers.
- Container/registry usage: optional and additive.
- Docker Compose/Kubernetes usage: optional and additive.
- Existing provider-neutral standalone build remains supported.
- Private Kairoseth/customer adapters remain outside the MIT core.

## Release identity

Authoritative release identity before merge:

```text
package.json   1.2.0
Git tag        v1.2.0 (must not exist before audited publication)
CHANGELOG      [1.2.0] - 2026-08-29
Release notes  docs/RELEASE-NOTES-1.2.0.md
```

The immutable tag must be created only on the exact merged `main` SHA that passed the reusable `Release audit` workflow. Tags are never moved or recreated.

## Distribution identity

The first public OCI distribution is expected at:

```text
ghcr.io/emmakex/open-travel-platform:v1.2.0
ghcr.io/emmakex/open-travel-platform:sha-<audited-main-sha>
```

Both names must resolve to one immutable OCI digest.

The exact SHA and digest cannot truthfully be pre-recorded inside this pre-merge audit because they are outputs of the merged release pipeline. After publication, `Verify published distribution` must upload this release asset:

```text
distribution-verification-1.2.0.json
```

That machine-readable record contains the exact source tag, source SHA, image digest, digest reference and verification timestamp.

## Published-artifact verification gate

For v1.2.0, the automated post-publication verifier must prove all of the following against the public registry artifact rather than a local rebuild:

1. anonymous/public pull of `ghcr.io/emmakex/open-travel-platform:v1.2.0` succeeds before registry login;
2. the SemVer tag and `sha-<audited-main-sha>` tag resolve to the same digest;
3. OCI labels identify the expected source repository, exact source SHA, version `1.2.0` and MIT license;
4. BuildKit provenance is present and exposes SLSA provenance metadata;
5. BuildKit SBOM is present and exposes SPDX data;
6. GitHub artifact attestation verifies for the OCI digest;
7. a clean pull by digest runs successfully with the secret-free demo profile;
8. the running container reports UID/GID `10001:10001`;
9. `/api/health/live` and `/api/health/ready` return success;
10. representative public routes and static media return success;
11. `distribution-verification-1.2.0.json` is attached to the GitHub Release.

Failure of any item means Phase 11 remains open. The verifier must not hide public-registry visibility failures by authenticating before the clean public pull.

## Supply-chain invariants

- No moving `latest`, major-only, minor-only or `stable` image aliases.
- Source tag `v1.2.0` must resolve to the exact audited `main` SHA before image publication.
- Publishing Actions remain pinned by full commit SHA.
- Build/push uses `provenance: mode=max` and `sbom: true`.
- GitHub artifact attestation is bound to the pushed digest.
- Production consumers deploy by digest.
- Credentials, protected Traveller Data and proprietary Kairoseth/customer configuration are not included in the image.

## Historical v1.1.0 boundary

v1.1.0 remains the immutable Phase 10 closeout source release. Its source tag predates the Docker distribution baseline, so there is intentionally **no retroactive v1.1.0 public OCI image**.

The v1.2.0 distribution pipeline must not rebuild, relabel or fabricate a historical v1.1.0 image. Consequently, the distribution verification record truthfully uses:

```text
rollbackSourceTag: v1.1.0
rollbackImageDigest: null
```

This records that source rollback exists while no previous public OCI digest exists.

## Runtime and deployment guarantees

The published image must preserve:

- Node.js 24-compatible standalone runtime;
- fixed non-root user `app`, UID/GID `10001:10001`;
- runtime-only privileged configuration;
- `/api/health/live` liveness;
- `/api/health/ready` production readiness;
- provider-neutral operation;
- no bundled production MongoDB or customer-specific infrastructure.

Provider-neutral deployment examples remain in `deploy/compose/` and `deploy/kubernetes/base/` and are protected by `check:deployment-recipes`.

## Permanent gates

v1.2.0 keeps all prior gates and adds:

```bash
npm run check:release-audit
npm run check:phase-11-distribution
```

Both are included in `npm run verify`. The reusable `Release audit` workflow executes the current release audit, full project verification and standalone packaging on PRs and merged `main`.

## External provider validation

Credentialed Stripe/Redsys TEST/LIVE end-to-end validation remains pending suitable provider accounts. This provider-dependent validation does not change the backward-compatible Phase 11 distribution classification and does not permit bypassing payment-provider validation where those providers are used in a live deployment.

## Closeout decision

v1.2.0 is approved as the Phase 11 MINOR release once the immutable process completes:

```text
release PR green
→ squash merge to main
→ merged-main Release audit green
→ immutable v1.2.0 source tag + GitHub Release
→ audited OCI image publication
→ clean public digest verification + attestations
→ distribution-verification-1.2.0.json attached
→ Phase 11 complete
```

No subsequent roadmap phase starts before that final published-artifact verification succeeds.
