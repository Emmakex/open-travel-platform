# Changelog

All notable project changes are documented here.

## [Unreleased]

### Added
- Bilingual `MAINTENANCE.md` / `MAINTENANCE.es.md` policy defining Open Travel Platform v1.2.0 as the feature-frozen stable public baseline.

### Changed
- Open Travel Platform is now explicitly **stable / maintenance-only** after the fully verified Phase 11 v1.2.0 closeout.
- The public OTP feature roadmap is frozen; no Phase 12 is planned. Future public-repository work is limited to security, critical correctness/reliability, necessary compatibility/runtime maintenance and documentation corrections.
- Active commercial/product development continues separately in **Kairoseth Travel**; new Kairoseth/customer features are not automatically backported to OTP and the public core never depends on proprietary implementations.
- README and ROADMAP EN/ES now record the completed v1.2.0 publication/verification rather than the earlier release-candidate wording.
- SUPPORT and CONTRIBUTING now reflect the maintenance-only scope while preserving all existing validation, release, migration, security, branding and distribution contracts.
- The stable verified OCI identity is documented as `ghcr.io/emmakex/open-travel-platform@sha256:aeda693786e6f7c69fd61348a1098acc5bdf09ddaf859cfe16314ce72d7ba6ac` from source SHA `aae9b2dcd4529cafba37cc44e7cdfec740731508`.

## [1.2.0] - 2026-08-29

### Added
- Phase 11 distribution/deployment ecosystem tracking through issues #133, #134, #136, #138 and #140.
- Phase 11.1 provider-neutral multi-stage `Dockerfile` built from the existing Next.js standalone runtime.
- Non-root final container runtime (`app`, UID/GID `10001:10001`), built-in `/api/health/live` Docker healthcheck and runtime-only privileged configuration.
- `.dockerignore` build-context hardening that excludes local environment and generated runtime artifacts.
- Bilingual container deployment guidance through `docs/CONTAINERS.md` and `docs/CONTAINERS.es.md`.
- Permanent container-distribution gate through `scripts/container-distribution-check.mjs` and `npm run check:container`.
- Blocking `Container distribution` GitHub Actions workflow performing a real Docker build/start, non-root inspection, health validation and representative HTTP/static-asset smoke.
- Phase 11.2 audited GHCR publication workflow downstream of `Publish audited release`.
- Immutable public image identities using exact `vX.Y.Z` and `sha-<full-source-sha>` tags only.
- OCI source/revision/version/license metadata, BuildKit `provenance: mode=max`, SBOM generation and GitHub artifact attestation bound to the pushed OCI digest.
- Bilingual registry/provenance guidance through `docs/REGISTRY.md` and `docs/REGISTRY.es.md`, including digest-pinned pulls and `gh attestation verify`.
- Permanent registry/provenance gate through `scripts/registry-provenance-check.mjs` and `npm run check:registry-provenance`.
- Dedicated `Registry publication and provenance` workflow preserving registry policy together with the prior container and release invariants.
- Phase 11.3 Docker Compose demo recipe that reuses the repository Dockerfile and secret-free demo profile.
- Phase 11.3 production Compose recipe that requires an immutable OCI digest and never rebuilds source on the deployment host.
- Provider-neutral Kubernetes base containing Deployment, ClusterIP Service, safe ConfigMap and Kustomize entry point, with external Secret/state boundaries.
- Bilingual deployment-recipe guidance through `docs/DEPLOYMENT-RECIPES.md` and `docs/DEPLOYMENT-RECIPES.es.md`, including reverse proxy/TLS, readiness, external MongoDB, digest upgrade and rollback guidance.
- Permanent deployment-recipe gate through `scripts/deployment-recipes-check.mjs` and `npm run check:deployment-recipes`.
- Blocking `Deployment recipe validation` workflow that renders Compose/Kustomize and performs a real Compose build/start, UID/GID and liveness/readiness smoke.
- Phase 11.4 reusable current-release audit through `scripts/release-audit-check.mjs`, `npm run check:release-audit` and the blocking `Release audit` workflow.
- Permanent Phase 11 distribution closeout gate through `scripts/phase-11-distribution-check.mjs` and `npm run check:phase-11-distribution`.
- Bilingual v1.2.0 distribution audit and release notes through `docs/RELEASE-AUDIT-1.2.0*.md` and `docs/RELEASE-NOTES-1.2.0*.md`.
- `Verify published distribution` workflow that verifies the first audited public OCI distribution after publication by immutable digest.
- Post-publication verification of SemVer/SHA tag digest equality, OCI source/revision/version/license labels, BuildKit provenance, SPDX SBOM and GitHub artifact attestation.
- Clean public pull/run smoke by OCI digest with the secret-free demo profile, including UID/GID `10001:10001`, `/api/health/live`, `/api/health/ready`, representative routes and static assets.
- Machine-readable `distribution-verification-1.2.0.json` evidence uploaded to the immutable GitHub Release after successful public-artifact verification.

### Changed
- Package/release identity moves from **1.1.0** to **1.2.0** as a backward-compatible MINOR release.
- **Phase 11 — Distribution & deployment ecosystem is COMPLETE** at the implementation/release-candidate level; operational closeout becomes effective only after the closing PR is merged, merged `main` is green, `v1.2.0` is published and its exact public OCI digest passes the post-publication verification workflow.
- `Publish audited release` now follows the reusable current `Release audit` rather than binding future releases to the historical Phase 10 v1.1.0 audit.
- The historical `check:phase-10-release` gate remains preserved as an immutable v1.1.0 audit while future release identity is checked by `check:release-audit`.
- `npm run verify` now includes `check:release-audit` and `check:phase-11-distribution` in addition to the existing container, registry/provenance and deployment-recipe gates.
- README and ROADMAP EN/ES document completed Phase 11 slices 11.1 through 11.4 and the v1.2.0 distribution release candidate.
- GHCR remains the public reference registry but not a mandatory runtime dependency; operators may self-build or mirror verified OCI digests.
- Container publication still requires the SemVer source tag to resolve to the exact audited `main` SHA before pushing.
- Historical `v1.1.0` remains deliberately excluded from retroactive container publication because its immutable source tag predates the Dockerfile and registry workflow.
- Production orchestrator examples continue to consume immutable digests, keep durable state/secrets external and preserve `/api/health/live` versus `/api/health/ready` semantics.

### Security
- Container builds exclude local `.env*`, `.next`, `node_modules` and repository/runtime artifacts from the build context while retaining reviewed public environment examples only.
- Docker/Compose/Kubernetes artifacts never bake MongoDB, SMTP, PSP, Traveller Data, integration or adapter credentials into public image layers/manifests.
- The final runtime executes as fixed non-root UID/GID `10001:10001`; privileged capability configuration remains runtime-injected.
- Container publication actions remain pinned to full commit SHAs and use only the package/attestation/OIDC permissions required for publishing.
- Moving image aliases such as `latest`, major-only, minor-only and `stable` remain prohibited; production deployment records and uses immutable OCI digests.
- Compose/Kubernetes examples preserve a read-only root filesystem, dropped capabilities and no privilege escalation; Kubernetes additionally uses `RuntimeDefault` seccomp.
- Production MongoDB, TLS certificates, secret-manager material and private Kairoseth/customer configuration remain external to public deployment recipes.
- Post-publication verification treats any mismatch between source tag/SHA, OCI digest, metadata or attestation as a release/distribution failure.

### Compatibility
- v1.2.0 is classified **MINOR / backward-compatible** relative to v1.1.0.
- No supported public repository/adapter interface, REST/event/signature identifier or persistent-data schema is intentionally removed or broken by Phase 11.
- No application-data migration is required by the distribution/deployment release itself.
- The OCI path reuses the existing supported Next.js standalone runtime rather than introducing a second application execution model.
- GHCR, Docker Compose and Kubernetes remain optional operational/distribution surfaces rather than mandatory core dependencies.
- The provider-dependent Stripe/Redsys TEST/LIVE credentialed E2E item remains separate and does not block provider-neutral v1.2.0 distribution verification.

### Release history
- `v1.1.0` remains the first release published under the immutable source-tag/GitHub-Release convention and intentionally has no retroactive OCI image.
- `v1.2.0` is the first release eligible for the audited public OCI publication/verification pipeline because its immutable source revision contains the Docker, registry/provenance and deployment baseline.

## [1.1.0] - 2026-08-28

### Added
- Phase 10 open-source productisation closeout across reproducible evaluation, self-hosting, extensions, release lifecycle, contribution tooling, branding and final release automation.
- Phase 10.1 reproducible infrastructure-free demo bootstrap and clean-checkout validation.
- Phase 10.2 provider-neutral standalone/self-host packaging and real runtime smoke validation.
- Phase 10.3 extension-contract documentation in English and Spanish.
- Explicit authority model for repository, workflow-sync, downstream CRM/ERP and delivery/observability extensions.
- Code-backed public inventory of all 9 first-class `repositories/` interfaces, composition selectors, bundled implementations and network contracts.
- Explicit `PaymentRepository` classification as the local provider-neutral financial-ledger boundary.
- Compatibility/versioning policy covering typed interfaces, REST/HTTP contracts, event envelopes, failure schemas and webhook signature versions.
- Contributor-facing reference-adapter guides backed by real implementations: `RestBookingRepository`, `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()`, `RestCrmSyncAdapter` and monitoring-only `RestFailureTransport`.
- Permanent architecture-level extension gate through `scripts/extension-contract-check.mjs`, `npm run check:extension-contracts` and its dedicated workflow.
- Phase 10.4 release and migration conventions in English and Spanish.
- Permanent release/migration convention gate through `scripts/release-migration-check.mjs`, `npm run check:release-migrations` and its dedicated workflow.
- Phase 10.5 upgrade policy and deprecation lifecycle policy in English and Spanish.
- Permanent upgrade/deprecation lifecycle gate through `scripts/upgrade-deprecation-check.mjs`, `npm run check:upgrade-deprecations` and its dedicated workflow.
- Phase 10.6 bilingual contribution/release template guidance.
- One canonical `.github/PULL_REQUEST_TEMPLATE.md`, enriched issue forms and reusable `.github/RELEASE_TEMPLATE.md`.
- Permanent contribution/release template gate through `scripts/contribution-template-check.mjs`, `npm run check:contribution-templates` and its dedicated workflow.
- Phase 10.7 bilingual branding/trademark policy through `TRADEMARKS.md` and `TRADEMARKS.es.md`.
- Explicit separation between MIT software rights and Open Travel Platform / Kairoseth / Kairoseth Travel branding and official-status claims.
- Permanent branding/trademark gate through `scripts/branding-policy-check.mjs`, `npm run check:branding-policy` and its dedicated workflow.
- Phase 10.8 bilingual final audit through `docs/PHASE-10-RELEASE-AUDIT.md` and `docs/PHASE-10-RELEASE-AUDIT.es.md`.
- Bilingual v1.1.0 release notes through `docs/RELEASE-NOTES-1.1.0.md` and `docs/RELEASE-NOTES-1.1.0.es.md`.
- Final release identity/documentation gate through `scripts/phase-10-release-check.mjs` and `npm run check:phase-10-release`.
- Dedicated `Phase 10 release audit` workflow that runs the final gate, full `npm run verify` and standalone packaging.
- Audited release-publication workflow that creates an immutable version tag and GitHub Release only after the release audit succeeds on merged `main`.

### Changed
- Package/release identity moves from the documented 1.0.0 baseline to **1.1.0** as a backward-compatible MINOR release.
- **Phase 10 — Open-source productisation is COMPLETE**, including slices 10.1 through 10.8.
- `npm run verify` includes `check:extension-contracts`, `check:release-migrations`, `check:upgrade-deprecations`, `check:contribution-templates`, `check:branding-policy` and `check:phase-10-release`.
- Public stable releases are governed by Semantic Versioning with immutable `vX.Y.Z` Git tags and release identity aligned across `package.json`, README badge, CHANGELOG and tag.
- Public releases are cut only from a reviewed, verified `main` commit; published tags are never moved or reused.
- Compatible persistent-data evolution follows **expand -> migrate -> contract**; hidden destructive migrations during application startup are prohibited.
- The latest stable release in the current major is the primary support/upgrade target; no LTS/backport line is guaranteed unless explicitly announced.
- Same-major upgrades are supported with documented migrations; skip-major upgrades are not guaranteed.
- Public lifecycle is standardized as **ACTIVE -> DEPRECATED -> REMOVED** with ordinary removal only in a MAJOR release.
- The duplicate case-variant PR template was removed; contributor and release workflows use one canonical checklist model.
- CONTRIBUTING and SUPPORT distinguish MIT software/open-source support from Kairoseth/Kairoseth Travel commercial or official status.
- Open Travel Platform remains the public provider-neutral core/project identity, while Kairoseth Travel remains the official hosted/commercial reference implementation at `https://travel.kairoseth.com`.
- README and ROADMAP EN/ES are synchronized through the completed Phase 10 and v1.1.0 release identity.
- Existing REST v1 paths/headers remain unchanged; typed repository/adapter interfaces remain governed by core SemVer.
- The read-only catalogue HTTP contract remains a legacy-v1 compatibility surface; breaking evolution requires a new explicit versioned surface.
- Event schema version and webhook-signature scheme version remain independent compatibility dimensions.
- Stripe/Redsys remain PSP/checkout integrations rather than `PaymentRepository` implementations.
- SMTP/email and arbitrary internal modules remain outside public plugin contracts.

### Compatibility
- v1.1.0 is classified **MINOR / backward-compatible** relative to the documented 1.0.0 package baseline.
- No supported public repository/adapter surface is intentionally removed.
- No required destructive persistent-data migration is introduced by the Phase 10 closeout.
- Demo and provider-neutral self-host evaluation do not require new external provider credentials.

### Release history
- The repository recorded package version 1.0.0 before the Phase 10 release convention, but the final audit found **no historical Git tag and no GitHub Release object** for that version.
- No retroactive `v1.0.0` tag is fabricated. v1.1.0 is the first release published under the completed immutable-tag/GitHub-Release convention.

### External validation still pending
- Credentialed Stripe/Redsys TEST/LIVE end-to-end validation remains pending suitable provider accounts. This is provider-dependent validation, does not reopen the completed Phase 9 engineering baseline and does not block the provider-neutral v1.1.0 core release.

## [1.0.0] - 2026-08-18

### Added
- Stable release documentation for catalogue, identity, booking and operations capability boundaries.
- `docs/ADAPTER-GUIDE.md` for replacing demo implementations with production providers.
- `docs/DEPLOYMENT.md` and `docs/PRODUCTION-CHECKLIST.md` for deployment and production-readiness review.
- `ROADMAP.md` and `SUPPORT.md` for post-1.0 maintenance and support expectations.
- GitHub issue forms and pull-request template.
- Release consistency validation through `scripts/release-check.mjs`.
- Stronger public-source safety rules.
- HTTP smoke tests against the production build in CI.

### Changed
- Package version promoted to `1.0.0`.
- README reframed around the stable reusable starter rather than an in-progress milestone.
- CI validates safe production capability defaults, release consistency, TypeScript, production build, HTTP routes and dependency security.
- Runtime versions remain explicitly pinned for stable-release predictability.

### Security
- Release checks require safe demo defaults in `.env.example`.
- Source safety rejects high-risk patterns such as dynamic code execution, direct cookie access and unsafe HTML injection in application source.
- Production deployment guidance requires replacing fictional identity, booking and operations persistence before using real data.
- Smoke tests verify representative public/protected routes after the production server starts.

### Compatibility
- Node.js 24 LTS target.
- Next.js 16.3.1.
- React / ReactDOM 19.2.8.
- TypeScript 6.x.

> Historical note: this repository version predates the Phase 10 immutable-tag/GitHub-Release convention and was not retrospectively tagged.

## [0.5.0] - 2026-08-18

### Added
- Fixed fictional customer, operator and admin identity fixtures.
- Server-side role predicates and reusable customer/staff authorization helpers.
- Dedicated `OperationsRepository` capability boundary.
- Staff operations dashboard with pending/confirmed/cancelled metrics.
- Role-protected reservation queue and detail routes.
- Validated staff reservation status transitions.
- Fictional staff audit events recording actor, role, transition and timestamp.
- Shared demo reservation store used by customer booking and staff operations adapters.
- Dedicated operations architecture/trust-boundary documentation.

### Security
- Customer routes/actions explicitly require the `customer` role.
- Staff routes/actions require `operator` or `admin` on the server.
- Demo staff identities are fixed server-side; browser role input is never authoritative.
- Production operations default to disabled.
- Production demo staff writes require `OPERATIONS_MODE=demo` and `DEMO_OPERATIONS_ENABLED=true`.
- Unsupported reservation status transitions are rejected server-side.

### Changed
- Customer and staff surfaces are separated even when a valid session exists.
- Demo reservation cancellation records `updatedAt`.
- Primary navigation exposes the operator demo entry.

## [0.4.0] - 2026-08-18

### Added
- Availability and reservation domain models.
- `BookingRepository` capability boundary.
- Fictional availability fixtures for demo trips.
- Server-side reservation creation with trusted trip price calculation.
- Trip booking route with departure and party-size selection.
- Customer reservation history and reservation detail routes.
- Identity-scoped demo cancellation flow.
- Cookie-backed fictional demo reservation persistence.
- Dedicated booking architecture and trust-boundary documentation.

### Security
- Booking defaults to disabled in production when not explicitly configured.
- Production demo writes require `BOOKING_MODE=demo` and `DEMO_BOOKING_ENABLED=true`.
- Reservation creation validates identity, trip, selected availability, party size and remaining spaces server-side.
- Client-supplied totals are never trusted.
- Reservation reads and cancellation are scoped by identity.

### Changed
- Trip detail pages link directly to booking/availability.
- Customer account shows reservation summary/history.
- React and ReactDOM aligned to 19.2.8.

## [0.3.0] - 2026-08-18

### Added
- Typed identity, customer profile and role domain models.
- `IdentityRepository` provider boundary.
- Fictional passwordless demo customer session using an HTTP-only cookie.
- Protected customer account page and provider-neutral sign-in surface.
- Account entry in primary navigation.
- Dedicated identity/security architecture documentation.
- Scoped account CSS module.

### Security
- Production identity defaults to disabled when not explicitly configured.
- Production demo sign-in requires an explicit `DEMO_IDENTITY_ENABLED=true` opt-in.
- Identity configuration remains server-only; no credentials are handled by the demo flow.

## [0.2.0] - 2026-08-18

### Added
- Searchable and filterable trip catalogue.
- Destination detail pages with related itineraries.
- Trip detail pages with destination relationships and itinerary highlights.
- Destination detail capability in `TravelRepository`.
- Generic REST endpoint contract for destination detail.
- Reusable destination cards and catalogue explorer UI.

### Changed
- Homepage links directly into the destination and trip catalogue experience.
- Navigation exposes the dedicated trips catalogue.
- Catalogue documentation expanded for v0.2.

## [0.1.0] - 2026-08-18

### Added
- Clean-room Next.js application foundation.
- Original responsive visual system and fictional demo catalogue.
- Typed destination and trip domain models.
- `TravelRepository` interface with demo and generic REST adapters.
- Demo/API environment-driven composition.
- Public-source safety checks, TypeScript validation, production build and dependency audit in CI.
- MIT license, contribution guidelines and security policy.