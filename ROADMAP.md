# Roadmap

<p align="center"><strong>English</strong> · <a href="./ROADMAP.es.md">Español</a></p>

Open Travel Platform is the reusable MIT-licensed core. **Kairoseth Travel** is the official commercial/reference deployment at **https://travel.kairoseth.com**.

_Last updated: 29 August 2026._

## Current position

**Phase 8 — External integrations: COMPLETE.**  
**Phase 9 — Production hardening engineering baseline: COMPLETE.**  
**Phase 10 — Open-source productisation: COMPLETE.**  
**Phase 11 — Distribution & deployment ecosystem — COMPLETE.**

Phase 10 closeout release: **v1.1.0**.  
Phase 11 closeout release candidate: **v1.2.0**.

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
11.3     Deployment recipes / orchestrator examples ---------- COMPLETE
11.4     Distribution release verification + v1.2.0 ---------- COMPLETE*
```

`*` The Phase 11 implementation and release candidate are complete in the closing branch/PR. Official operational closeout still requires the permanent gate: green PR, merge to `main`, green merged-`main` verification, immutable `v1.2.0` tag/GitHub Release, first audited public OCI publication, and successful verification of that exact published digest. No subsequent roadmap phase starts before that sequence finishes.

Key closeout documents:

- Phase 10 audit: [`docs/PHASE-10-RELEASE-AUDIT.md`](docs/PHASE-10-RELEASE-AUDIT.md)
- Phase 11 / v1.2.0 audit: [`docs/RELEASE-AUDIT-1.2.0.md`](docs/RELEASE-AUDIT-1.2.0.md)
- v1.2.0 release notes: [`docs/RELEASE-NOTES-1.2.0.md`](docs/RELEASE-NOTES-1.2.0.md)
- Container runtime: [`docs/CONTAINERS.md`](docs/CONTAINERS.md)
- Registry/provenance: [`docs/REGISTRY.md`](docs/REGISTRY.md)
- Deployment recipes: [`docs/DEPLOYMENT-RECIPES.md`](docs/DEPLOYMENT-RECIPES.md)

Credentialed Stripe/Redsys TEST/LIVE E2E remains a separate provider-dependent validation item. It does not reopen Phase 9 and does not block provider-neutral source/container distribution verification.

---

# Completed platform foundations

Catalogue, identity, booking, commerce, post-purchase, operations, documents/reporting, external integrations, Phase 9 production hardening and Phase 10 open-source productisation are complete. The core includes persistent MongoDB adapters, provider-neutral payment boundaries, encrypted Traveller Data, operational workflows, signed outbound integrations, privacy/accessibility gates, recovery, repeatable performance baselines and a verified release lifecycle.

# Phase 10 — Open-source productisation — COMPLETE

Goal achieved: the MIT core can be evaluated, self-hosted, extended, released, upgraded and contributed to without hidden Kairoseth dependencies.

## 10.1 — Reproducible demo bootstrap — COMPLETE

Locked `npm ci`, safe infrastructure-free demo bootstrap, clean-checkout build/start/HTTP smoke and EN/ES onboarding.

## 10.2 — Provider-neutral standalone deployment — COMPLETE

Next.js `output: standalone`, `npm run package:standalone`, real standalone HTTP/static smoke and readiness/TLS/MongoDB/worker/rollback guidance.

## 10.3 — Extension contracts and reference adapters — COMPLETE

Nine verified public extension interfaces, explicit authority map, compatibility/versioning rules, real reference adapters and permanent `check:extension-contracts` validation.

## 10.4 — Release and migration conventions — COMPLETE

Stable SemVer, immutable `vX.Y.Z` tags, verified-`main` release source, explicit migration classes, expand → migrate → contract and permanent release/migration validation.

## 10.5 — Upgrade and deprecation lifecycle — COMPLETE

Supported source/target paths, lifecycle `ACTIVE → DEPRECATED → REMOVED`, ordinary MAJOR-only removal and explicit security exception.

## 10.6 — Contribution and release templates — COMPLETE

Canonical PR template, safe issue forms, reusable release checklist and permanent template validation.

## 10.7 — Branding and trademark policy — COMPLETE

MIT software rights separated from Kairoseth/Kairoseth Travel branding and official-status rights.

## 10.8 — Final audit and v1.1.0 release — COMPLETE

Phase 10 closed with the immutable `v1.1.0` Git tag/GitHub Release. The earlier 1.0.0 package state remains an honest pre-policy historical record rather than a fabricated retroactive release tag.

---

# Phase 11 — Distribution & deployment ecosystem — COMPLETE

Goal achieved at the implementation/release-candidate level: distribute and operate the verified standalone core as an immutable provider-neutral OCI artifact without leaking secrets, vendor coupling or private Kairoseth implementation details. Final operational completion is effective only after the v1.2.0 publication/verification sequence described above succeeds on merged `main`.

## 11.1 — Reproducible OCI/Docker distribution baseline — COMPLETE

Tracked by issue **#134**.

Delivered:

- provider-neutral multi-stage Dockerfile using Node.js 24;
- build reuses locked install, production build and standalone packaging;
- fixed non-root runtime `app` / `10001:10001`;
- privileged configuration supplied only at runtime;
- `/api/health/live` Docker healthcheck and `/api/health/ready` routing semantics;
- hardened `.dockerignore`;
- `npm run check:container` in `npm run verify`;
- blocking real Docker build/start/non-root/health/HTTP workflow;
- bilingual container guidance.

## 11.2 — Registry publication and provenance — COMPLETE

Tracked by issue **#136**.

Delivered:

- GHCR as public reference registry without becoming a runtime dependency;
- publication only after a successful audited source release;
- exact SemVer tag ↔ audited `main` SHA equality before publishing;
- immutable `vX.Y.Z` and `sha-<full-source-sha>` tags only;
- no moving `latest`, major, minor or `stable` aliases;
- OCI source/revision/version/license metadata;
- BuildKit `provenance: mode=max` and SBOM from the publishing build;
- GitHub artifact attestation tied to the OCI digest;
- full-SHA-pinned publishing Actions and minimal permissions;
- permanent `check:registry-provenance` gate;
- explicit historical rule that `v1.1.0` receives no retroactive container image.

## 11.3 — Deployment recipes / orchestrator examples — COMPLETE

Tracked by issue **#138** and merged through PR **#139**.

Delivered:

- secret-free demo Docker Compose recipe;
- production Compose consuming only an explicit immutable OCI digest;
- provider-neutral Kubernetes Deployment/ClusterIP Service/ConfigMap/Kustomize baseline;
- external Secret and MongoDB/state boundaries;
- fixed UID/GID `10001:10001`, read-only root filesystem, dropped capabilities and no privilege escalation;
- Kubernetes `RuntimeDefault` seccomp;
- liveness/readiness separation;
- operator-controlled TLS/ingress/reverse proxy;
- upgrade/rollback by verified digest;
- permanent `check:deployment-recipes` gate and real Compose smoke.

11.3 is officially complete on `main` at merge commit `2d3e7e02134fe46a19a26595c02d493dde3f83fb`, after 30/30 merged-main workflows succeeded and the historical v1.1.0 container publisher again completed as a safe no-op.

## 11.4 — Distribution release verification — COMPLETE*

Tracked by issue **#140**.

Release candidate: **v1.2.0**, classified **MINOR / backward-compatible** from v1.1.0.

Delivered in the closing slice:

- reusable `check:release-audit` gate for the current stable release rather than hard-coding future releases to the historical Phase 10 audit;
- preserved historical `check:phase-10-release` validation for v1.1.0;
- permanent `check:phase-11-distribution` closeout gate;
- dedicated `Release audit` workflow for verified merged `main`;
- generalized immutable `Publish audited release` workflow downstream of that current-release audit;
- existing audited OCI publisher retained with exact tag/SHA matching, SBOM, max provenance and GitHub artifact attestation;
- new `Verify published distribution` workflow after publication;
- public pull of both immutable SemVer and digest identities;
- verification that SemVer and SHA image tags resolve to the same OCI digest;
- OCI source/revision/version/license label verification;
- SBOM and provenance verification;
- GitHub OCI attestation verification;
- clean runtime smoke **by digest** with the secret-free demo profile;
- verification of non-root UID/GID, liveness/readiness and representative routes/assets;
- machine-readable `distribution-verification-1.2.0.json` evidence uploaded to the GitHub Release;
- bilingual v1.2.0 audit and release notes.

The first audited public OCI distribution is created only after this slice is merged and the audited `v1.2.0` source release is published from verified `main`. Historical `v1.1.0` remains intentionally image-free.

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
→ verify the published artifact when applicable
→ subsequent roadmap work
```

## Core non-goals

The public core must not become permanently tied to one PSP, supplier, CRM/ERP, CMS, identity vendor, monitoring vendor, hosting provider, container registry or Kairoseth-only infrastructure.
