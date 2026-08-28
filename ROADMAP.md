# Roadmap

<p align="center"><strong>English</strong> · <a href="./ROADMAP.es.md">Español</a></p>

Open Travel Platform is the reusable MIT-licensed core. **Kairoseth Travel** is the official commercial/reference deployment at **https://travel.kairoseth.com**.

_Last updated: 28 August 2026._

## Current position

**Phase 8 — External integrations: COMPLETE.**  
**Phase 9 — Production hardening engineering baseline: COMPLETE.**  
**Phase 10 — Open-source productisation: COMPLETE.**  
**Phase 11 — Distribution & deployment ecosystem: IN PROGRESS.**

Phase 10 closeout release: **v1.1.0**.

```text
10.1     Reproducible fresh-clone/demo bootstrap ------------- COMPLETE
10.2     Provider-neutral standalone deployment -------------- COMPLETE
10.3     Extension contracts/reference adapters -------------- COMPLETE
10.4     Release and migration conventions ------------------- COMPLETE
10.5     Upgrade and deprecation lifecycle policy ------------ COMPLETE
10.6     Contribution and release templates ------------------ COMPLETE
10.7     Branding and trademark policy ----------------------- COMPLETE
10.8     Final documentation/release audit + v1.1.0 ---------- COMPLETE

11.1     Reproducible OCI/Docker distribution baseline ------- COMPLETE
11.2     Registry publication + provenance ------------------- COMPLETE
11.3     Deployment recipes / orchestrator examples ---------- PLANNED
11.4     Distribution release verification ------------------- PLANNED
```

Final Phase 10 audit: [`docs/PHASE-10-RELEASE-AUDIT.md`](docs/PHASE-10-RELEASE-AUDIT.md)  
Container deployment: [`docs/CONTAINERS.md`](docs/CONTAINERS.md)  
Registry/provenance: [`docs/REGISTRY.md`](docs/REGISTRY.md)

Credentialed Stripe/Redsys TEST/LIVE E2E remains a separate provider-dependent validation item and does not reopen Phase 9 or block provider-neutral distribution work.

---

# Completed platform foundations

Catalogue, identity, booking, commerce, post-purchase, operations, documents/reporting, external integrations, Phase 9 production hardening and Phase 10 open-source productisation are complete. The core includes persistent MongoDB capability adapters, provider-neutral payment boundaries, encrypted Traveller Data, operational workflows, signed outbound integrations, privacy/accessibility gates, recovery, repeatable performance baselines and a verified release lifecycle.

---

# Phase 10 — Open-source productisation — COMPLETE

Goal achieved: the MIT core can be evaluated, self-hosted, extended, released, upgraded and contributed to without hidden Kairoseth dependencies.

## 10.1 — Reproducible demo bootstrap — COMPLETE

- locked `npm ci` install contract;
- safe/non-destructive demo bootstrap;
- no mandatory external infrastructure for evaluation;
- clean-checkout build/start/HTTP smoke;
- EN/ES onboarding.

## 10.2 — Provider-neutral standalone deployment — COMPLETE

- Next.js `output: standalone` runtime;
- `npm run package:standalone`;
- real standalone HTTP/static smoke;
- readiness/TLS/MongoDB/worker/rollback deployment guidance.

## 10.3 — Extension contracts and reference adapters — COMPLETE

- nine verified provider-neutral extension interfaces;
- explicit authority map;
- compatibility/versioning rules;
- real contributor reference adapters;
- permanent `check:extension-contracts` gate and blocking workflow.

Documents: [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md), [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md), [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md), [`docs/EXTENSION-VALIDATION.md`](docs/EXTENSION-VALIDATION.md).

## 10.4 — Release and migration conventions — COMPLETE

- stable Semantic Versioning and immutable `vX.Y.Z` tags;
- release identity aligned across package/README/CHANGELOG/tag;
- releases from verified `main`;
- explicit migration classes and recovery;
- **expand → migrate → contract**;
- no hidden destructive startup migrations;
- permanent `check:release-migrations` gate.

Documents: [`docs/RELEASES.md`](docs/RELEASES.md), [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md).

## 10.5 — Upgrade and deprecation lifecycle — COMPLETE

- current-major stable release as primary support target;
- no implicit LTS/backport promise;
- documented same-major/adjacent-major upgrade paths;
- lifecycle `ACTIVE → DEPRECATED → REMOVED`;
- ordinary public removal only in MAJOR;
- explicit security exception;
- permanent `check:upgrade-deprecations` gate.

Documents: [`docs/UPGRADES.md`](docs/UPGRADES.md), [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md).

## 10.6 — Contribution and release templates — COMPLETE

- one canonical PR template;
- safer enriched issue forms;
- reusable release checklist;
- architecture/release/lifecycle/security/UX review fields;
- permanent `check:contribution-templates` gate.

Documents: [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md).

## 10.7 — Branding and trademark policy — COMPLETE

- MIT software rights separated from branding rights;
- Open Travel Platform = public provider-neutral core/project;
- Kairoseth Travel = official hosted/commercial reference implementation;
- official deployment = `https://travel.kairoseth.com`;
- truthful descriptive attribution allowed without implied official status;
- permanent `check:branding-policy` gate.

Documents: [`TRADEMARKS.md`](TRADEMARKS.md), [`TRADEMARKS.es.md`](TRADEMARKS.es.md).

## 10.8 — Final audit and v1.1.0 release — COMPLETE

- release classified MINOR/backward-compatible;
- package/README/CHANGELOG release identity moved to 1.1.0;
- final audit and bilingual release notes added;
- `check:phase-10-release` added to `npm run verify`;
- dedicated release-audit workflow validates merged `main`;
- publication workflow created the immutable `v1.1.0` tag and GitHub Release after that audit succeeded;
- historical 1.0.0 package state is documented honestly rather than fabricating a retroactive tag.

Documents: [`docs/PHASE-10-RELEASE-AUDIT.md`](docs/PHASE-10-RELEASE-AUDIT.md), [`docs/RELEASE-NOTES-1.1.0.md`](docs/RELEASE-NOTES-1.1.0.md).

---

# Phase 11 — Distribution & deployment ecosystem — IN PROGRESS

Goal: make the verified standalone core straightforward to distribute and operate as an immutable provider-neutral application artifact without leaking secrets, vendor coupling or private Kairoseth implementation details.

## 11.1 — Reproducible OCI/Docker distribution baseline — COMPLETE

Tracked by issue **#134**.

Delivered:

- provider-neutral multi-stage `Dockerfile` using Node.js 24 Debian slim;
- build stage reuses `npm ci`, `npm run build` and `npm run package:standalone`;
- final image contains the prepared standalone runtime rather than the full source/build toolchain;
- fixed non-root runtime identity `app` / `10001:10001`;
- runtime defaults limited to `NODE_ENV`, `HOSTNAME`, `PORT` and telemetry control;
- privileged configuration/secrets remain runtime-injected and are not baked into image layers;
- Docker healthcheck uses `/api/health/live`, while production routing remains tied to `/api/health/ready`;
- `.dockerignore` reduces build context and excludes local environment/runtime artifacts;
- `scripts/container-distribution-check.mjs` + `npm run check:container` are part of `npm run verify`;
- dedicated blocking `Container distribution` workflow performs a real image build, non-root inspection, health wait and HTTP/static-asset smoke;
- bilingual [`docs/CONTAINERS.md`](docs/CONTAINERS.md) / [`docs/CONTAINERS.es.md`](docs/CONTAINERS.es.md).

## 11.2 — Registry publication and provenance — COMPLETE

Tracked by issue **#136**.

Delivered:

- GHCR selected as the public reference registry without making it a core runtime dependency;
- publication chained to the successful audited release workflow rather than mutable branch state;
- SemVer tag must resolve to the exact audited `main` SHA before any image is published;
- historical `v1.1.0` is explicitly excluded from retroactive image publication because its immutable source tag predates the Dockerfile;
- only exact `vX.Y.Z` and `sha-<full-source-sha>` image tags are emitted; moving `latest`, major and minor aliases are forbidden;
- OCI source/revision/version/license metadata links image to source;
- Docker BuildKit emits `provenance: mode=max` and SBOM from the publishing build;
- GitHub artifact attestation is bound to the pushed OCI digest;
- publication actions are pinned to full commit SHAs and receive only required package/attestation/OIDC permissions;
- `scripts/registry-provenance-check.mjs` + `npm run check:registry-provenance` are part of `npm run verify`;
- dedicated `Registry publication and provenance` workflow protects this policy in PRs and `main`;
- bilingual [`docs/REGISTRY.md`](docs/REGISTRY.md) / [`docs/REGISTRY.es.md`](docs/REGISTRY.es.md) document digest-pinned pulls and `gh attestation verify`.

11.2 does not add orchestrator recipes or publish private Kairoseth/customer images.

## 11.3 — Deployment recipes / orchestrator examples — PLANNED

Candidate provider-neutral examples may cover:

- Docker Compose for local evaluation and controlled self-hosting;
- Kubernetes/container-platform deployment primitives;
- reverse proxy/TLS/readiness configuration;
- runtime secret/config injection and persistent external services;
- upgrade/rollback using immutable image digests.

No provider-specific platform becomes mandatory for the core.

## 11.4 — Distribution release verification — PLANNED

Potential closeout gate for Phase 11:

- verify published artifact digest ↔ source tag/commit identity;
- verify clean pull/run of the public artifact;
- validate release notes/upgrade/rollback documentation;
- preserve non-root, health and runtime-secret invariants in published artifacts;
- close Phase 11 only after the same permanent documentation/PR/CI/merge/main-verification gate.

## Permanent project gate

```text
implementation
→ tests/validation
→ synchronized EN/ES docs + README/ROADMAP/CHANGELOG
→ diff review
→ PR
→ required CI green
→ merge to main
→ verify main
→ immutable release/tag/artifact when applicable
→ subsequent roadmap work
```

## Core non-goals

The public core must not become permanently tied to one PSP, supplier, CRM/ERP, CMS, identity vendor, monitoring vendor, hosting provider, container registry or Kairoseth-only infrastructure.
