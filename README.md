# Open Travel Platform

<p align="center"><strong>English</strong> · <a href="./README.es.md">Español</a></p>

> Reusable open-source travel platform foundation for agencies, tour operators and booking products.

Open Travel Platform is a clean-room **Next.js + TypeScript + MongoDB** platform built around explicit domain, repository and adapter boundaries. It supports infrastructure-free demo onboarding, persistent production capabilities, reproducible OCI distribution and provider-neutral self-host/orchestrator deployment.

The official commercial/reference implementation is **Kairoseth Travel**, deployed at **[travel.kairoseth.com](https://travel.kairoseth.com)**.

![Version](https://img.shields.io/badge/version-1.2.0-0d1b2d)
![Status](https://img.shields.io/badge/status-stable%20%7C%20maintenance--only-2f855a)
![Next.js](https://img.shields.io/badge/Next.js-16.3.2-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![MongoDB](https://img.shields.io/badge/MongoDB-supported-47A248)
![License](https://img.shields.io/badge/license-MIT-45d6b5)

## Development status — stable / maintenance only

**Open Travel Platform v1.2.0 is the feature-frozen stable open-source baseline.** Phase 11 is fully closed and there is no active OTP feature roadmap.

The repository remains public and unarchived for cloning, self-hosting, forks, security reports and relevant maintenance bugs. Future OTP changes are limited to security, critical correctness/reliability, necessary compatibility/runtime maintenance and documentation corrections. New commercial product features are out of scope for this repository.

Active product development continues separately in **Kairoseth Travel**. New Kairoseth Travel features are not automatically backported to OTP, and OTP never depends on private Kairoseth/customer code.

See [`MAINTENANCE.md`](MAINTENANCE.md) for the maintenance boundary and [`ROADMAP.md`](ROADMAP.md) for the frozen historical roadmap.

## Project model

This repository is the **MIT-licensed provider-neutral core**. Kairoseth Travel is the hosted/commercial reference implementation.

- customer data and proprietary customer integrations stay outside the public repository;
- private Kairoseth/customer adapters may depend on public OTP contracts, never the reverse;
- downstream providers never receive implicit booking, inventory, pricing or payment authority;
- the MIT software license does not by itself grant permission to present an independent fork/service as official Kairoseth Travel.

Branding and trademark usage is documented separately in [`TRADEMARKS.md`](TRADEMARKS.md).

## Current position

**Phase 8 — External integrations: COMPLETE.**  
**Phase 9 — Production hardening engineering baseline: COMPLETE.**  
**Phase 10 — Open-source productisation: COMPLETE.**  
**Phase 11 — Distribution & deployment ecosystem: COMPLETE.**

Phase 10 closed with immutable source release **v1.1.0**. Its final slices remain recorded as **10.7 — Branding and trademark policy — COMPLETE** and **10.8 — Final documentation/release audit and v1.1.0 publication — COMPLETE**, with the closeout documented in [`docs/PHASE-10-RELEASE-AUDIT.md`](docs/PHASE-10-RELEASE-AUDIT.md).

Phase 11 closed with backward-compatible MINOR release **v1.2.0**:

- **11.1 Reproducible OCI/Docker distribution baseline — COMPLETE**
- **11.2 Registry publication and provenance — COMPLETE**
- **11.3 Orchestrator/deployment recipes — COMPLETE**
- **11.4 Distribution release verification — COMPLETE**

The v1.2.0 release audit is [`docs/RELEASE-AUDIT-1.2.0.md`](docs/RELEASE-AUDIT-1.2.0.md). The closing PR was squash-merged to verified `main`, the immutable `v1.2.0` GitHub Release was published, the first public OCI image was created, and `Verify published distribution` succeeded against the registry artifact itself.

The verified stable distribution identity is:

```text
Source release: v1.2.0
Source SHA: aae9b2dcd4529cafba37cc44e7cdfec740731508
OCI digest: sha256:aeda693786e6f7c69fd61348a1098acc5bdf09ddaf859cfe16314ce72d7ba6ac
```

The GitHub Release contains `distribution-verification-1.2.0.json`, the machine-readable verification record. The historical v1.1.0 source release is never retroactively rebuilt as an image.

Credentialed Stripe/Redsys TEST/LIVE E2E remains a separate provider-dependent validation item. It does not reopen the completed Phase 9 baseline and is not required for the stable provider-neutral OTP baseline.

## Core capabilities

### Catalogue and commerce

- bilingual EN/ES catalogue and Operator experience;
- destinations, trips, itineraries, departures and live inventory;
- accommodation/rooms and seasonal/occupancy pricing;
- Activities, Transport and Travel protection;
- transactional reservations with server-authoritative pricing/inventory;
- travellers/minors/guardians and historical pricing snapshots;
- package supplements and post-booking amendments.

### Identity and operations

- persistent customer/staff authentication and separate sessions;
- RBAC and granular Operator/Admin capabilities;
- operational ownership, notes, priority, tags and timeline;
- tasks/follow-ups, supplier fulfilment and advanced queues;
- privileged audit where required.

### Payments and finance

- provider-neutral payment/refund ledger;
- bank transfer, cash and external-terminal movements;
- Stripe/Redsys checkout integrations;
- deposits/installments/outstanding balance;
- reconciliation/revenue reporting;
- downstream-only ERP/accounting synchronization.

### Traveller data and production hardening

- encrypted post-purchase Traveller Data and key rotation;
- privacy-right workflows and retention policy;
- WCAG 2.2 AA-oriented accessibility baseline;
- CSP/security headers, Origin validation and throttling;
- liveness/readiness and `demo|live` deployment profiles;
- MongoDB concurrency/idempotency, backup/restore and index validation;
- repeatable performance/resource baselines.

### Integrations and extension model

- transactional MongoDB integration outbox;
- signed HTTPS webhooks with retry/dead-letter handling;
- REST `BookingRepository`, supplier fulfilment, downstream CRM/ERP and failure transport;
- nine verified first-class public extension interfaces;
- explicit provider/authority boundaries;
- permanent extension gate through `check:extension-contracts`.

## Quick start

Requires **Node.js 24 LTS** and the npm version declared in `packageManager`.

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm ci
npm run setup:demo
npm run dev
```

The demo profile requires no MongoDB, SMTP, PSP, CRM, ERP or supplier credentials.

## Self-host standalone

```bash
npm ci
npm run setup:demo
npm run build
npm run package:standalone
node .next/standalone/server.js
```

For production deployment see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md).

## Container deployment

Build the same standalone runtime as a provider-neutral OCI/Docker image:

```bash
docker build -t open-travel-platform:local .

docker run --rm \
  --env-file .env.demo.example \
  -p 127.0.0.1:3000:3000 \
  open-travel-platform:local
```

The final image runs as non-root user `app` (`10001:10001`) and exposes a Docker healthcheck backed by `/api/health/live`. Production routing should use `/api/health/ready` and inject secrets/configuration only at runtime.

See [`docs/CONTAINERS.md`](docs/CONTAINERS.md).

## Registry and provenance

GHCR is the public reference registry for the stable audited distribution:

```text
ghcr.io/emmakex/open-travel-platform:v1.2.0
ghcr.io/emmakex/open-travel-platform:sha-aae9b2dcd4529cafba37cc44e7cdfec740731508
```

No moving `latest`, major or minor aliases are published. Production should deploy the verified digest:

```bash
docker pull ghcr.io/emmakex/open-travel-platform@sha256:aeda693786e6f7c69fd61348a1098acc5bdf09ddaf859cfe16314ce72d7ba6ac
```

The image includes SBOM, BuildKit `provenance: mode=max`, OCI source/revision/version/license metadata and a GitHub artifact attestation tied to the image digest. `v1.1.0` remains source-only because its immutable tag predates the Docker baseline.

See [`docs/REGISTRY.md`](docs/REGISTRY.md).

## Deployment recipes

Provider-neutral orchestration examples do not make a hosting platform mandatory:

```bash
docker compose -f deploy/compose/compose.demo.yml up -d --build --wait
kubectl kustomize deploy/kubernetes/base
```

Production Compose and Kubernetes recipes consume an immutable identity such as `ghcr.io/emmakex/open-travel-platform@sha256:<digest>`, preserve UID/GID `10001:10001`, keep the root filesystem read-only, require external runtime secrets/state and distinguish `/api/health/live` from `/api/health/ready`. Production MongoDB is deliberately not bundled.

See [`docs/DEPLOYMENT-RECIPES.md`](docs/DEPLOYMENT-RECIPES.md).

## Published distribution verification

`Verify published distribution` validates the **registry artifact**, not a local rebuild. For v1.2.0 it proved:

- public pull succeeds before registry authentication;
- SemVer and source-SHA tags resolve to one digest;
- OCI source/revision/version/license labels match the audited release;
- BuildKit SLSA provenance and SPDX SBOM are present;
- GitHub artifact attestation verifies against the digest;
- clean run by digest preserves UID/GID `10001:10001`;
- `/api/health/live`, `/api/health/ready` and representative routes/assets succeed.

The resulting `distribution-verification-1.2.0.json` GitHub Release asset is the exact machine-readable verification record.

## Release, upgrade and branding contract

Stable releases use:

```text
package.json  -> X.Y.Z
Git tag       -> vX.Y.Z
CHANGELOG     -> ## [X.Y.Z] - YYYY-MM-DD
```

A future maintenance release, when necessary, must still identify exact source/target versions and SHAs, review migration/deprecation impact, validate a representative target environment and declare recovery before persistent changes.

Public lifecycle:

```text
ACTIVE → DEPRECATED → REMOVED
```

Ordinary removal occurs only at/after the announced MAJOR boundary. PATCH/MINOR releases do not silently remove or reinterpret supported public surfaces.

Before release validation:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:contribution-templates
npm run check:branding-policy
npm run check:phase-10-release
npm run check:container
npm run check:registry-provenance
npm run check:deployment-recipes
npm run check:release-audit
npm run check:phase-11-distribution
npm run verify
```

See [`MAINTENANCE.md`](MAINTENANCE.md), [`docs/RELEASES.md`](docs/RELEASES.md), [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md), [`docs/UPGRADES.md`](docs/UPGRADES.md), [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md), [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md), [`TRADEMARKS.md`](TRADEMARKS.md), [`docs/CONTAINERS.md`](docs/CONTAINERS.md), [`docs/REGISTRY.md`](docs/REGISTRY.md), [`docs/DEPLOYMENT-RECIPES.md`](docs/DEPLOYMENT-RECIPES.md), [`docs/PHASE-10-RELEASE-AUDIT.md`](docs/PHASE-10-RELEASE-AUDIT.md) and [`docs/RELEASE-AUDIT-1.2.0.md`](docs/RELEASE-AUDIT-1.2.0.md).

## Documentation

### Project and delivery

- [`MAINTENANCE.md`](MAINTENANCE.md)
- [`MAINTENANCE.es.md`](MAINTENANCE.es.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`ROADMAP.es.md`](ROADMAP.es.md)
- [`CHANGELOG.md`](CHANGELOG.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`SUPPORT.md`](SUPPORT.md)
- [`TRADEMARKS.md`](TRADEMARKS.md)
- [`TRADEMARKS.es.md`](TRADEMARKS.es.md)
- [`docs/PHASE-10-RELEASE-AUDIT.md`](docs/PHASE-10-RELEASE-AUDIT.md)
- [`docs/RELEASE-NOTES-1.1.0.md`](docs/RELEASE-NOTES-1.1.0.md)
- [`docs/RELEASE-AUDIT-1.2.0.md`](docs/RELEASE-AUDIT-1.2.0.md)
- [`docs/RELEASE-AUDIT-1.2.0.es.md`](docs/RELEASE-AUDIT-1.2.0.es.md)
- [`docs/RELEASE-NOTES-1.2.0.md`](docs/RELEASE-NOTES-1.2.0.md)
- [`docs/RELEASE-NOTES-1.2.0.es.md`](docs/RELEASE-NOTES-1.2.0.es.md)
- [`docs/RELEASES.md`](docs/RELEASES.md)
- [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md)
- [`docs/UPGRADES.md`](docs/UPGRADES.md)
- [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md)
- [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/CONTAINERS.md`](docs/CONTAINERS.md)
- [`docs/CONTAINERS.es.md`](docs/CONTAINERS.es.md)
- [`docs/REGISTRY.md`](docs/REGISTRY.md)
- [`docs/REGISTRY.es.md`](docs/REGISTRY.es.md)
- [`docs/DEPLOYMENT-RECIPES.md`](docs/DEPLOYMENT-RECIPES.md)
- [`docs/DEPLOYMENT-RECIPES.es.md`](docs/DEPLOYMENT-RECIPES.es.md)

### Extensions

- [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md)
- [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md)
- [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md)
- [`docs/EXTENSION-VALIDATION.md`](docs/EXTENSION-VALIDATION.md)
- [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md)
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md)

## Permanent validation

Important project-level gates include:

```bash
npm run check:extension-contracts
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:contribution-templates
npm run check:branding-policy
npm run check:phase-10-release
npm run check:container
npm run check:registry-provenance
npm run check:deployment-recipes
npm run check:release-audit
npm run check:phase-11-distribution
npm run verify
```

Dedicated workflows protect extension contracts, releases/migrations, upgrades/deprecations, contribution templates, branding, historical Phase 10 release identity, container distribution, registry/provenance, deployment recipes, current release audit and published-distribution verification.

## Phase completion rule

A phase/slice is not complete until implementation and tests are finished, EN/ES documentation/README/ROADMAP/CHANGELOG are synchronized, PR scope is reviewed, required CI is green, the PR is merged to `main`, merged `main` is verified, and any release artifact required by the phase is published and independently verified before subsequent roadmap work begins.

Phase 10 is historically closed by v1.1.0. Phase 11 is fully closed by verified v1.2.0. **No Phase 12 is planned for OTP; the public roadmap is frozen under the maintenance policy.**

## License and branding

Software: MIT. See [`LICENSE`](LICENSE).

Project/commercial names and visual identity are governed separately by [`TRADEMARKS.md`](TRADEMARKS.md). The branding policy does not silently relicense the software.