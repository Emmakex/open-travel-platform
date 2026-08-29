# Registry publication and provenance

<p align="center"><strong>English</strong> · <a href="./REGISTRY.es.md">Español</a></p>

Status: **Phase 11.2 policy COMPLETE; Phase 11.4 closes the first audited public OCI distribution with v1.2.0**

## Purpose

GitHub Container Registry (GHCR) is the public reference registry for official Open Travel Platform MIT-core container releases. It is a distribution channel, not a runtime dependency: operators may self-build or mirror a verified OCI digest elsewhere.

Public image namespace:

```text
ghcr.io/emmakex/open-travel-platform
```

## Audited publication chain

The reusable publication chain is:

```text
verified merged main
  → Release audit
  → Publish audited release
  → immutable vX.Y.Z tag + GitHub Release
  → Publish audited container
  → Verify published distribution
```

The source release publisher creates a new tag/release only when the version-specific release audit explicitly approves the current version. Existing immutable history is never moved or recreated.

The container publisher then checks out the exact audited SHA and publishes only when the SemVer source tag resolves to that same commit.

## Historical v1.1.0 boundary

`v1.1.0` was published before the Docker/OCI distribution baseline existed inside its immutable source tag. It is intentionally **not** rebuilt or relabelled retroactively as a container image.

`v1.2.0` is the first release eligible for the complete audited public OCI pipeline because its immutable source revision contains the Dockerfile, container validation, registry/provenance policy, deployment recipes and post-publication verification workflow.

## Immutable image identities

For release `vX.Y.Z` from audited source commit `<sha>`, only these discovery tags are emitted:

```text
ghcr.io/emmakex/open-travel-platform:vX.Y.Z
ghcr.io/emmakex/open-travel-platform:sha-<full-source-sha>
```

Moving aliases are prohibited:

```text
latest
1
1.2
stable
```

Production deployment identity is the OCI digest:

```bash
docker pull ghcr.io/emmakex/open-travel-platform@sha256:<digest>
```

SemVer/SHA tags are discovery identities; `@sha256:<digest>` is the immutable runtime identity.

## OCI metadata

Published images carry at least:

```text
org.opencontainers.image.source
org.opencontainers.image.revision
org.opencontainers.image.version
org.opencontainers.image.licenses=MIT
```

The revision must equal the audited source SHA and the version must equal the immutable source release.

## SBOM and provenance

The publishing build emits:

- BuildKit `provenance: mode=max`;
- `sbom: true`;
- GitHub artifact attestation bound to the pushed OCI digest.

SBOM and provenance come from the same build that pushes the release image; they are not produced by rebuilding later.

Publishing Actions are pinned to full commit SHAs and receive only required permissions (`contents: read`, `packages: write`, `attestations: write`, `id-token: write`).

## Post-publication verification

Phase 11.4 adds `Verify published distribution`, downstream of `Publish audited container`.

For a newly published audited release the workflow verifies:

1. the public SemVer image can be pulled without registry credentials;
2. the SemVer tag and `sha-<full-source-sha>` tag resolve to the same OCI digest;
3. the digest matches the exact subject subsequently executed;
4. OCI source/revision/version/license labels match the audited source release;
5. BuildKit provenance is present;
6. an SPDX SBOM is present;
7. GitHub artifact attestation verifies for the OCI subject;
8. the image can be pulled and run by digest with the secret-free demo profile;
9. runtime UID/GID is `10001:10001`;
10. `/api/health/live`, `/api/health/ready` and representative routes/assets succeed.

A machine-readable `distribution-verification-X.Y.Z.json` record is attached to the GitHub Release after successful verification. It records the release tag, audited source SHA and OCI digest for operator rollback/reference.

## Operator verification

Pull by digest:

```bash
docker pull ghcr.io/emmakex/open-travel-platform@sha256:<digest>
```

Verify the GitHub OCI attestation:

```bash
gh attestation verify \
  oci://ghcr.io/emmakex/open-travel-platform@sha256:<digest> \
  --repo Emmakex/open-travel-platform
```

Compare:

- intended `vX.Y.Z` source release;
- source tag commit;
- OCI revision/version labels;
- OCI digest;
- release-attached distribution verification record;
- GitHub artifact attestation.

Any mismatch is a deployment stop condition.

## Secrets and private extensions

The public image contains the MIT core only. MongoDB, SMTP, PSP, Traveller Data, adapter/integration secrets and customer configuration remain runtime/external state.

Private Kairoseth/customer adapters and proprietary configuration remain outside the public image. Running or mirroring this image does not make an independent deployment official Kairoseth Travel; see `TRADEMARKS.md`.

## Permanent validation

```bash
npm run check:registry-provenance
npm run check:release-audit
npm run check:phase-11-distribution
npm run verify
```

`Registry publication and provenance` protects static supply-chain policy. `Release audit` protects the current source release, and `Verify published distribution` provides runtime/supply-chain evidence for the actual public artifact after publication.
