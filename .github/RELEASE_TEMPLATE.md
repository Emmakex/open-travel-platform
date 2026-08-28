# Open Travel Platform release X.Y.Z

## Summary

Describe the release outcome in user/operator/contributor terms.

## Release identity

- Version: `X.Y.Z`
- Git tag: `vX.Y.Z`
- Verified `main` commit SHA: `<sha>`
- Release type: PATCH / MINOR / MAJOR
- Previous supported release: `<version/tag>`

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
- Minimum supported source release for upgrade: `<version>`

## Upgrade and migration

- Migration required: yes / no
- Migration class: configuration / persistent-data / wire / key / destructive / none
- Operator procedure: `<link or N/A>`
- Verification: `<link or steps>`
- Rollback/recovery: application-only / reverse migration / backup restore / forward-only / N/A

## Deprecations / removals

### Deprecated

For each item include:

- Surface:
- Replacement:
- Deprecated since:
- Earliest ordinary removal:
- Migration guidance:

### Removed

For each item include:

- Surface:
- Prior deprecation notice/release:
- Replacement/migration guidance:
- Upgrade/rollback implications:

If none, state `None` explicitly.

## Branding / trademark

- [ ] Public names and official-status wording were reviewed against `TRADEMARKS.md`
- [ ] MIT software licensing is not represented as permission to claim official Kairoseth/Kairoseth Travel status
- [ ] Any Open Travel Platform attribution remains truthful and non-misleading
- [ ] Any logo/wordmark/visual-brand use has the appropriate permission or separate asset license
- [ ] N/A — no branding/trademark impact

## Container / distribution

- [ ] `Dockerfile` / container runtime changes preserve the provider-neutral standalone contract
- [ ] Final runtime remains non-root
- [ ] Secrets and privileged configuration are injected at runtime, not baked into image layers
- [ ] Liveness/readiness semantics remain documented and compatible
- [ ] `npm run check:container` passed when container/distribution behavior changed
- [ ] Real container build/start/HTTP validation passed when applicable
- [ ] N/A — no container/distribution impact

## Registry / provenance

- [ ] Release source tag resolves to the exact audited `main` SHA before any image publication
- [ ] Only immutable `vX.Y.Z` and `sha-<full-source-sha>` image tags are used
- [ ] No `latest`, major-only, minor-only or `stable` moving alias is published
- [ ] OCI source/revision/version/license metadata is present
- [ ] BuildKit `provenance: mode=max` and SBOM are produced by the publishing build
- [ ] GitHub artifact attestation is bound to the pushed OCI digest
- [ ] Publishing Actions remain pinned to full commit SHAs
- [ ] Public image contains no private Kairoseth/customer adapters, configuration or credentials
- [ ] `npm run check:registry-provenance` passed
- [ ] N/A — no registry/provenance impact

## Validation

- [ ] Release version, README badge, CHANGELOG and tag identity agree
- [ ] `npm ci`
- [ ] `npm run check:release`
- [ ] `npm run check:release-migrations`
- [ ] `npm run check:upgrade-deprecations`
- [ ] `npm run check:contribution-templates`
- [ ] `npm run check:branding-policy`
- [ ] `npm run check:phase-10-release` when auditing the Phase 10 release baseline
- [ ] `npm run check:container`
- [ ] `npm run check:registry-provenance`
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
- [ ] Final release audit/release notes updated when closing a major project phase
- [ ] Release notes contain no credentials, private customer data or protected Traveller Data

## Publication record

- [ ] Closing PR merged to `main`
- [ ] `main` verified after merge
- [ ] Required dedicated release-audit workflow succeeded on the merged revision when applicable
- [ ] Immutable `vX.Y.Z` tag created on the audited `main` commit
- [ ] GitHub release published from that tag
- [ ] When registry distribution applies, exact SemVer/SHA image tags and OCI digest recorded
- [ ] When registry distribution applies, SBOM/provenance and GitHub artifact attestation verified
- [ ] Deployment/consumer rollouts tracked separately with exact version/SHA/digest
