# Registry publication and provenance

<p align="center"><strong>English</strong> · <a href="./REGISTRY.es.md">Español</a></p>

Status: **Phase 11.2 — COMPLETE when its closing PR is green, merged and verified on `main`**

## Purpose

Open Travel Platform uses GitHub Container Registry (GHCR) as the public reference registry for official MIT-core container releases. The registry is a distribution channel, not a new application runtime: images are built from the same verified Dockerfile and Next.js standalone bundle defined by Phase 11.1.

The public image namespace is:

```text
ghcr.io/emmakex/open-travel-platform
```

Registry choice does not make the application dependent on GHCR. Operators may build the OCI image themselves or mirror an immutable digest into another registry.

## Publication trigger

Container publication is downstream of the audited source release lifecycle:

```text
Phase 10 release audit
  → Publish audited release
  → immutable SemVer tag + GitHub Release
  → Publish audited container
```

`Publish audited container` is triggered by the successful `Publish audited release` workflow. It checks out the exact audited `main` SHA and publishes only when the repository SemVer tag resolves to that same commit.

A successful release workflow for an already-published historical version is therefore a safe no-op for container publication.

## Historical v1.1.0 boundary

`v1.1.0` was created before the Docker/OCI distribution baseline existed in the immutable source tag. It is intentionally **not** rebuilt or relabelled as a container image.

The first public GHCR image will be a future release whose immutable source tag already contains the Dockerfile, container validation and registry/provenance workflow. Release history must not be rewritten to manufacture a historical image.

## Immutable image identities

For a release `vX.Y.Z` built from source commit `<sha>`, the workflow publishes only:

```text
ghcr.io/emmakex/open-travel-platform:vX.Y.Z
ghcr.io/emmakex/open-travel-platform:sha-<full-source-sha>
```

Moving aliases are deliberately not published:

```text
latest
1
1.2
stable
```

Production deployments should resolve and record the OCI digest, then deploy by digest:

```bash
docker pull ghcr.io/emmakex/open-travel-platform@sha256:<digest>
```

A SemVer tag is convenient for discovery; the digest is the immutable deployment identity.

## OCI metadata

Published images carry at least these OCI annotations:

```text
org.opencontainers.image.source
org.opencontainers.image.revision
org.opencontainers.image.version
org.opencontainers.image.licenses=MIT
```

The revision points to the exact audited source SHA.

## SBOM and provenance

The release image is built with BuildKit attestations enabled:

- `provenance: mode=max`
- `sbom: true`

The provenance and SBOM are generated from the same build that pushes the release image. They are not produced by rebuilding the source later.

The workflow additionally creates a GitHub artifact attestation bound to the pushed OCI digest. The attestation identifies the repository/workflow identity that produced that digest.

## Verify an image

Pull by digest, not by a moving name:

```bash
docker pull ghcr.io/emmakex/open-travel-platform@sha256:<digest>
```

Verify the GitHub attestation for the OCI subject:

```bash
gh attestation verify \
  oci://ghcr.io/emmakex/open-travel-platform@sha256:<digest> \
  --repo Emmakex/open-travel-platform
```

Operators should compare:

1. the intended Open Travel Platform release;
2. its immutable source tag/commit;
3. the image OCI revision metadata;
4. the published OCI digest;
5. the GitHub artifact attestation.

A mismatch is a deployment stop condition.

## Workflow permissions and action pinning

The publication workflow receives only the permissions required for the release image:

- `contents: read`
- `packages: write`
- `attestations: write`
- `id-token: write`

Third-party and GitHub Actions used by the publishing job are pinned to full commit SHAs. Updating those action revisions is a reviewed supply-chain change and must pass the permanent registry/provenance gate.

## Secrets and private extensions

The public image is built from the MIT core only. Production credentials remain runtime-injected as defined by `CONTAINERS.md`; no MongoDB, SMTP, PSP, Traveller Data, adapter or integration secrets are baked into the image.

Private Kairoseth/customer adapters, private deployment configuration and proprietary service credentials must remain outside this public package. Publishing an independently operated image does not make that deployment an official Kairoseth Travel service; see `TRADEMARKS.md`.

## Validation

Static publication/provenance invariants:

```bash
npm run check:registry-provenance
```

The permanent `Registry publication and provenance` GitHub Actions workflow runs this gate and preserves the Phase 11.1 container and prior release gates.

The full project gate remains:

```bash
npm run verify
```

## Phase boundary

Phase 11.2 establishes registry publication and verifiable supply-chain identity only. Orchestrator/deployment recipes, multi-platform policy and later distribution capabilities remain separate Phase 11 slices and cannot be treated as complete by this document.
