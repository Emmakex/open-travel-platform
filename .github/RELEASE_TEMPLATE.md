# Open Travel Platform release X.Y.Z

## Summary

Describe the release outcome in user/operator/contributor terms.

## Release identity

- Version: `X.Y.Z`
- Git tag: `vX.Y.Z`
- Verified `main` commit SHA: `<sha>`
- Release type: PATCH / MINOR / MAJOR
- Previous supported release: `<version/tag>`
- OCI digest when registry distribution applies: `sha256:<digest>`

## Added / changed / fixed

- Added:
- Changed:
- Fixed:
- Security:

## Compatibility

- Public repository/adapter interfaces changed: yes / no
- REST/event/signature contracts changed: yes / no
- Authority/authentication/idempotency semantics changed: yes / no
- New/changed configuration: yes / no
- Container/distribution artifact changed: yes / no
- Registry/provenance policy changed: yes / no
- Deployment recipe/orchestrator contract changed: yes / no
- Minimum supported source release for upgrade: `<version>`

## Upgrade and migration

- Migration required: yes / no
- Migration class: configuration / persistent-data / wire / key / destructive / none
- Operator procedure: `<link or N/A>`
- Verification: `<link or steps>`
- Rollback/recovery: application-only / reverse migration / backup restore / forward-only / N/A

## Deprecations / removals

### Deprecated

For each item include surface, replacement, deprecated-since release, earliest ordinary removal and migration guidance.

### Removed

For each item include surface, prior deprecation notice/release, replacement/migration guidance and upgrade/rollback implications.

If none, state `None` explicitly.

## Branding / trademark

- [ ] Public names and official-status wording were reviewed against `TRADEMARKS.md`
- [ ] MIT software licensing is not represented as permission to claim official Kairoseth/Kairoseth Travel status
- [ ] Open Travel Platform attribution remains truthful and non-misleading
- [ ] Logo/wordmark/visual-brand use has appropriate permission or separate asset license
- [ ] N/A — no branding/trademark impact

## Container / distribution

- [ ] Provider-neutral Next.js standalone contract is preserved
- [ ] Final runtime remains non-root (`10001:10001` for the reference image)
- [ ] Secrets and privileged configuration are injected at runtime, not baked into image layers
- [ ] `/api/health/live` liveness and `/api/health/ready` readiness remain compatible
- [ ] `npm run check:container` passed
- [ ] Real container build/start/HTTP validation passed
- [ ] N/A — no container/distribution impact

## Registry / provenance

- [ ] Release source tag resolves to the exact audited `main` SHA before image publication
- [ ] Only immutable `vX.Y.Z` and `sha-<full-source-sha>` image tags are used
- [ ] No `latest`, major-only, minor-only or `stable` moving alias is published
- [ ] OCI source/revision/version/license metadata is present
- [ ] BuildKit `provenance: mode=max` and SBOM are produced by the publishing build
- [ ] GitHub artifact attestation is bound to the pushed OCI digest
- [ ] Publishing Actions remain pinned to full commit SHAs
- [ ] Public image contains no private Kairoseth/customer adapters, configuration or credentials
- [ ] `npm run check:registry-provenance` passed
- [ ] N/A — no registry/provenance impact

## Deployment recipes / orchestrators

- [ ] Production image identity is an immutable verified OCI digest
- [ ] Production Compose consumes the published artifact and does not rebuild source on the deployment host
- [ ] Compose/Kubernetes preserve non-root UID/GID `10001:10001`, read-only root filesystem, dropped capabilities and no privilege escalation
- [ ] Kubernetes preserves `RuntimeDefault` seccomp
- [ ] MongoDB and other durable production services remain external
- [ ] Secrets/privileged configuration remain runtime-injected
- [ ] TLS/ingress/reverse-proxy choice remains provider-neutral
- [ ] Upgrade and rollback procedures record exact verified digests
- [ ] `npm run check:deployment-recipes` passed
- [ ] Real deployment-recipe Compose smoke passed when applicable
- [ ] N/A — no deployment recipe/orchestrator impact

## Audited release / distribution verification

- [ ] Version-specific `docs/RELEASE-AUDIT-X.Y.Z.md` exists and explicitly approves `vX.Y.Z`
- [ ] Version-specific EN/ES release notes are synchronized
- [ ] `npm run check:release-audit` passed
- [ ] `npm run check:phase-11-distribution` passed when the Phase 11 distribution baseline is in scope
- [ ] Blocking `Release audit` succeeded on the exact merged `main` revision
- [ ] `Publish audited release` created or confirmed the immutable source tag/GitHub Release
- [ ] `Publish audited container` published only when tag SHA equals audited SHA
- [ ] Public SemVer and SHA image tags resolve to the same OCI digest
- [ ] Published OCI labels match source repository, audited revision, release version and MIT license
- [ ] BuildKit provenance and SBOM were verified on the published artifact
- [ ] `gh attestation verify` succeeded for the published OCI digest
- [ ] Clean public pull/run by digest succeeded
- [ ] Runtime UID/GID, liveness/readiness and representative HTTP/static smoke succeeded on the pulled artifact
- [ ] `distribution-verification-X.Y.Z.json` is attached to the GitHub Release when distribution applies
- [ ] Exact source tag/SHA/OCI digest are recorded for rollback
- [ ] N/A — no public OCI distribution applies

## Validation

- [ ] Release version, README badge, CHANGELOG and tag identity agree
- [ ] `npm ci`
- [ ] `npm run check:release`
- [ ] `npm run check:release-migrations`
- [ ] `npm run check:upgrade-deprecations`
- [ ] `npm run check:contribution-templates`
- [ ] `npm run check:branding-policy`
- [ ] `npm run check:phase-10-release` retains the historical v1.1.0 audit
- [ ] `npm run check:container`
- [ ] `npm run check:registry-provenance`
- [ ] `npm run check:deployment-recipes`
- [ ] `npm run check:release-audit`
- [ ] `npm run check:phase-11-distribution` when applicable
- [ ] `npm run verify`
- [ ] `npm run package:standalone`
- [ ] Fresh-clone/demo validation passed
- [ ] Relevant migration/upgrade path validated when applicable
- [ ] Relevant provider TEST/LIVE validation recorded when applicable

## Known external validation

State any provider-dependent checks that could not be completed. Do not represent external credential limitations as core CI failures.

## Documentation

- [ ] CHANGELOG release section finalized while retaining `Unreleased`
- [ ] README EN/ES updated when capabilities/version changed
- [ ] ROADMAP EN/ES updated when project state changed
- [ ] Upgrade/migration/deprecation docs updated when applicable
- [ ] Branding/trademark policy updated when public names, logos or official-status claims changed
- [ ] Container deployment docs updated when image/runtime behavior changed
- [ ] Registry/provenance docs updated when publication, tags, digest, SBOM or attestations changed
- [ ] Deployment recipe docs updated when Compose/Kubernetes/runtime topology changes
- [ ] Final release audit/release notes updated when closing a major project phase
- [ ] Release notes contain no credentials, private customer data or protected Traveller Data

## Publication record

- [ ] Closing PR merged to `main`
- [ ] `main` verified after merge
- [ ] Required dedicated release-audit workflow succeeded on the merged revision
- [ ] Immutable `vX.Y.Z` tag created on the audited `main` commit
- [ ] GitHub release published from that tag
- [ ] When registry distribution applies, exact SemVer/SHA image tags and OCI digest recorded
- [ ] When registry distribution applies, SBOM/provenance and GitHub artifact attestation verified
- [ ] When registry distribution applies, public pull/run verification completed by digest
- [ ] Deployment/consumer rollouts tracked separately with exact version/SHA/digest
