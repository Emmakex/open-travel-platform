# Roadmap

<p align="center"><strong>English</strong> · <a href="./ROADMAP.es.md">Español</a></p>

Open Travel Platform is the reusable MIT-licensed core. **Kairoseth Travel** is the official commercial/reference deployment at **https://travel.kairoseth.com**.

_Last updated: 28 August 2026._

## Current position

**Phase 8 — External integrations: COMPLETE.**  
**Phase 9 — Production hardening engineering baseline: COMPLETE.**  
**Phase 10 — Open-source productisation — COMPLETE.**

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
```

Final audit: [`docs/PHASE-10-RELEASE-AUDIT.md`](docs/PHASE-10-RELEASE-AUDIT.md)  
Release notes: [`docs/RELEASE-NOTES-1.1.0.md`](docs/RELEASE-NOTES-1.1.0.md)

Credentialed Stripe/Redsys TEST/LIVE E2E remains a separate provider-dependent validation item and does not reopen Phase 9 or block the provider-neutral v1.1.0 release.

---

# Completed platform foundations

Catalogue, identity, booking, commerce, post-purchase, operations, documents/reporting, external integrations and the Phase 9 production-hardening baseline are complete. The core includes persistent MongoDB capability adapters, provider-neutral payment boundaries, encrypted Traveller Data, operational workflows, signed outbound integrations, privacy/accessibility gates, recovery and repeatable performance baselines.

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
- dedicated release-audit workflow validates the merged `main` revision;
- publication workflow creates the immutable `v1.1.0` tag and GitHub Release only after that main audit succeeds;
- existing tags are never moved/recreated;
- historical 1.0.0 package state is documented honestly rather than fabricating a retroactive tag.

Documents: [`docs/PHASE-10-RELEASE-AUDIT.md`](docs/PHASE-10-RELEASE-AUDIT.md), [`docs/RELEASE-NOTES-1.1.0.md`](docs/RELEASE-NOTES-1.1.0.md).

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
→ immutable release/tag when applicable
→ subsequent roadmap work
```

## Post-Phase-10 evolution

Optional adapters driven by commercial/community demand and Kairoseth-specific capabilities continue as normal evolution. They are not retroactive Phase 10 blockers unless deliberately promoted into a new core roadmap phase.

Potential future roadmap themes may include additional provider adapters, ecosystem packaging/distribution and new product capabilities, each with its own explicit phase/scope before implementation.

## Core non-goals

The public core must not become permanently tied to one PSP, supplier, CRM/ERP, CMS, identity vendor, monitoring vendor, hosting provider or Kairoseth-only infrastructure.
