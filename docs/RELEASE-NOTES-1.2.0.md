# Open Travel Platform v1.2.0

**Released:** 29 August 2026  
**Classification:** backward-compatible MINOR release  
**Milestone:** Phase 11 — Distribution & deployment ecosystem

v1.2.0 turns the verified standalone Open Travel Platform core into a reproducible, attestable and provider-neutral distribution artifact while preserving the existing public application/domain contracts.

## Highlights

- reproducible multi-stage OCI/Docker image based on the verified Next.js standalone runtime;
- fixed non-root runtime identity `10001:10001` and runtime-only privileged configuration;
- audited GHCR publication chained to an immutable source release;
- exact `v1.2.0` and `sha-<audited-source-sha>` image identities with no moving `latest`, major or minor aliases;
- OCI source/revision/version/license metadata;
- BuildKit `provenance: mode=max` and SBOM generation;
- GitHub artifact attestation bound to the pushed OCI digest;
- provider-neutral Docker Compose demo/production recipes;
- provider-neutral Kubernetes Deployment/Service/ConfigMap/Kustomize baseline;
- external MongoDB, secrets, TLS and ingress boundaries;
- liveness through `/api/health/live` and traffic readiness through `/api/health/ready`;
- upgrades and rollback by exact verified image digest;
- automated clean public pull/run verification of the published artifact.

## Compatibility

v1.2.0 is a **backward-compatible MINOR** release relative to v1.1.0.

There are no intentional breaking changes to:

- public repository/adapter interfaces;
- supported REST/event/signature identifiers;
- authority/authentication/idempotency semantics;
- persistent MongoDB schemas required by existing deployments.

No Phase 11 data migration is required. Existing source and standalone deployment paths remain valid. Container/Compose/Kubernetes distribution paths are additive and optional.

## Distribution identity

The source release is immutable:

```text
v1.2.0
```

The public OCI image is published as:

```text
ghcr.io/emmakex/open-travel-platform:v1.2.0
ghcr.io/emmakex/open-travel-platform:sha-<audited-main-sha>
```

Production deployments should use the verified digest rather than either human-readable tag:

```text
ghcr.io/emmakex/open-travel-platform@sha256:<verified-digest>
```

After publication and clean verification, the GitHub Release receives:

```text
distribution-verification-1.2.0.json
```

That asset is the machine-readable record of the exact source SHA and OCI digest verified by the Phase 11 closeout workflow.

## Verification performed after publication

The release pipeline must prove that:

- the public GHCR image can be pulled before registry authentication;
- SemVer and source-SHA image tags resolve to the same digest;
- OCI source/revision/version/license labels match v1.2.0 and its source commit;
- BuildKit provenance exposes SLSA metadata;
- the SBOM exposes SPDX data;
- the GitHub artifact attestation verifies against the OCI digest;
- a clean digest pull runs as UID/GID `10001:10001`;
- liveness/readiness and representative HTTP/static routes pass.

Phase 11 remains open until that post-publication verification succeeds.

## Deployment

Local evaluation:

```bash
docker compose -f deploy/compose/compose.demo.yml up -d --build --wait
```

Production self-hosting should consume the immutable published digest through `deploy/compose/compose.production.yml` or an operator-controlled Kubernetes overlay based on `deploy/kubernetes/base/`.

MongoDB, other durable services, privileged secrets, TLS and ingress remain operator-managed external dependencies.

See:

- `docs/CONTAINERS.md`
- `docs/REGISTRY.md`
- `docs/DEPLOYMENT-RECIPES.md`
- `docs/RELEASE-AUDIT-1.2.0.md`

## Upgrade from v1.1.0

No persistent-data migration is introduced by Phase 11.

1. complete normal application/configuration review for the target deployment;
2. verify the v1.2.0 source release and distribution evidence;
3. record the current deployment identity;
4. deploy v1.2.0 by exact source artifact or OCI digest;
5. wait for `/api/health/ready` before routing traffic;
6. run critical application smoke checks.

## Rollback

The previous source release is `v1.1.0`.

v1.1.0 predates the Docker distribution baseline, so there is intentionally **no public v1.1.0 OCI digest**. The first distribution verification record therefore states:

```text
rollbackSourceTag: v1.1.0
rollbackImageDigest: null
```

For source/standalone consumers, rollback to the previous immutable source release remains possible subject to normal application/data compatibility. For OCI consumers, v1.2.0 is the first verified public image and there is no fabricated earlier image to roll back to.

## Historical integrity

The project does not rebuild or relabel v1.1.0 retroactively. Its immutable release history remains unchanged.

## External provider validation

Credentialed Stripe/Redsys TEST/LIVE end-to-end validation remains pending suitable provider accounts. This external dependency does not reopen the completed Phase 9 engineering baseline and is separate from provider-neutral v1.2.0 distribution verification.

## License and branding

The software remains MIT-licensed. Kairoseth Travel remains the official hosted/commercial reference implementation. The distribution release does not grant independent deployments the right to present themselves as official Kairoseth Travel.
