# Roadmap

<p align="center"><strong>English</strong> · <a href="./ROADMAP.es.md">Español</a></p>

Open Travel Platform is the reusable MIT-licensed core. **Kairoseth Travel** is the official commercial/reference deployment at **https://travel.kairoseth.com**.

_Last updated: 28 August 2026._

## Current position

**Phase 8 — External integrations: COMPLETE.**  
**Phase 9 — Production hardening engineering baseline: COMPLETE.**  
**Phase 10 — Open-source productisation: IN PROGRESS.**

Completed Phase 10 slices:

```text
10.1     Reproducible fresh-clone/demo bootstrap ------------- COMPLETE
10.2     Provider-neutral standalone deployment -------------- COMPLETE
10.3     Extension contracts/reference adapters -------------- COMPLETE
10.4     Release and migration conventions ------------------- COMPLETE
10.5     Upgrade and deprecation lifecycle policy ------------ COMPLETE
10.6     Contribution and release templates ------------------ COMPLETE
```

Credentialed Stripe/Redsys TEST/LIVE E2E remains a separate external dependency and does not reopen Phase 9.

---

# Completed platform foundations

Catalogue, identity, booking, commerce, post-purchase, operations, documents/reporting, external integrations and the Phase 9 production-hardening baseline are complete. The core includes persistent MongoDB capability adapters, provider-neutral payment boundaries, encrypted Traveller Data, operational workflows, signed outbound integrations, privacy/accessibility gates, recovery and repeatable performance baselines.

---

# Phase 10 — Open-source productisation — IN PROGRESS

Goal: make the MIT core easy to adopt, self-host, extend, release, upgrade and contribute to without hidden Kairoseth dependencies.

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

Authoritative documents:

- [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md)
- [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md)
- [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md)
- [`docs/EXTENSION-VALIDATION.md`](docs/EXTENSION-VALIDATION.md)

Delivered:

- nine verified provider-neutral extension interfaces;
- explicit authority map;
- compatibility/versioning rules;
- real contributor reference adapters;
- permanent `check:extension-contracts` gate and blocking workflow.

## 10.4 — Release and migration conventions — COMPLETE

Authoritative documents:

- [`docs/RELEASES.md`](docs/RELEASES.md)
- [`docs/RELEASES.es.md`](docs/RELEASES.es.md)
- [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md)
- [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md)

Delivered:

- stable Semantic Versioning and immutable `vX.Y.Z` tags;
- release identity aligned across package/README/CHANGELOG/tag;
- releases cut only from verified `main`;
- migration classes for configuration, persistent state, wire contracts, key rotation and destructive changes;
- **expand → migrate → contract** persistent evolution;
- no hidden destructive startup migrations;
- `check:release-migrations` and dedicated blocking workflow.

## 10.5 — Upgrade and deprecation lifecycle policy — COMPLETE

Authoritative documents:

- [`docs/UPGRADES.md`](docs/UPGRADES.md)
- [`docs/UPGRADES.es.md`](docs/UPGRADES.es.md)
- [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md)
- [`docs/DEPRECATIONS.es.md`](docs/DEPRECATIONS.es.md)

Support/upgrade contract:

- latest stable release of the current major is the primary supported target;
- no guaranteed LTS/backport line unless explicitly announced;
- same-major upgrades are supported with documented migrations;
- major upgrade path starts from the latest stable release of the immediately previous major when documented;
- skip-major upgrades require explicit support documentation;
- operators record exact source/target versions/SHAs and recovery classification.

Deprecation contract:

```text
ACTIVE → DEPRECATED → REMOVED
```

- ordinary removal of a public surface occurs only in a **MAJOR** release;
- deprecation notices identify replacement, first deprecated release and earliest ordinary removal release;
- PATCH/MINOR releases do not silently remove or reinterpret supported public contracts/configuration;
- configuration, extension interfaces, wire contracts and persistent data follow the same lifecycle;
- security can accelerate removal only through an explicit documented exception;
- warnings must not leak secrets/protected data.

Permanent automation:

```bash
npm run check:upgrade-deprecations
npm run verify
```

Delivered:

- `scripts/upgrade-deprecation-check.mjs`;
- `check:upgrade-deprecations` registered in `verify`;
- dedicated `.github/workflows/upgrade-deprecations.yml`;
- release, migration, extension compatibility, SUPPORT and CONTRIBUTING integration.

## 10.6 — Contribution and release templates — COMPLETE

Authoritative documents:

- [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md)
- [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md)

Delivered:

- exactly one canonical `.github/PULL_REQUEST_TEMPLATE.md`;
- PR checklist aligned with capability/extension boundaries, SemVer, migrations, lifecycle, authority/security/privacy, UX/accessibility and phase completion;
- richer bug/feature issue forms with exact-version, upgrade/public-contract, provider-neutrality and data-safety context;
- reusable `.github/RELEASE_TEMPLATE.md` for release identity, compatibility, migrations, deprecations/removals, rollback, validation and publication;
- `scripts/contribution-template-check.mjs` and `check:contribution-templates` inside `npm run verify`;
- dedicated `.github/workflows/contribution-templates.yml`;
- contributor documentation synchronized with Phases 10.3–10.5.

## Planned later Phase 10 work

No later slice is active merely because it is listed. Each receives its own branch and full completion gate when started.

Potential next slices:

- trademark/branding policy between Open Travel Platform and Kairoseth Travel;
- final Phase 10 documentation/release audit and next public release cut;
- optional adapters driven by commercial/community demand, outside the Phase 10 completion blocker unless deliberately promoted.

## Permanent phase gate

```text
implementation
→ tests/validation
→ synchronized EN/ES docs + README/ROADMAP/CHANGELOG
→ diff review
→ PR
→ required CI green
→ merge to main
→ verify main
→ next phase
```

## Core non-goals

The public core must not become permanently tied to one PSP, supplier, CRM/ERP, CMS, identity vendor, monitoring vendor, hosting provider or Kairoseth-only infrastructure.
