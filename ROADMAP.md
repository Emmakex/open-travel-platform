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
10.7     Branding and trademark policy ----------------------- COMPLETE
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

Delivered:

- latest stable release of the current major as the primary support/upgrade target;
- no guaranteed LTS/backport line unless explicitly announced;
- supported same-major and adjacent-major upgrade paths;
- lifecycle `ACTIVE → DEPRECATED → REMOVED`;
- ordinary public removal only in a MAJOR release;
- explicit accelerated security exception;
- `check:upgrade-deprecations` and dedicated workflow.

## 10.6 — Contribution and release templates — COMPLETE

Authoritative documents:

- [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md)
- [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md)

Delivered:

- one canonical pull request template;
- enriched bug/feature issue forms;
- reusable release template;
- architecture/release/lifecycle/security/UX checklists;
- `check:contribution-templates` inside `npm run verify`;
- dedicated contribution-template workflow.

## 10.7 — Branding and trademark policy — COMPLETE

Authoritative documents:

- [`TRADEMARKS.md`](TRADEMARKS.md)
- [`TRADEMARKS.es.md`](TRADEMARKS.es.md)

Policy contract:

- MIT continues to license the software and is not changed by the branding policy;
- **Open Travel Platform** identifies the public provider-neutral core/project;
- **Kairoseth Travel** identifies the official hosted/commercial reference implementation;
- `https://travel.kairoseth.com` is the official reference deployment;
- truthful descriptive attribution/compatibility references remain allowed;
- independently operated forks/services use distinct primary branding and must not imply official Kairoseth status;
- Kairoseth/Kairoseth Travel logos, wordmarks and official-status claims require separate authorization where applicable;
- the policy does not claim that any mark is registered in every jurisdiction;
- support status, software licensing and commercial/official branding are explicitly separate.

Permanent automation:

```bash
npm run check:branding-policy
npm run verify
```

Delivered:

- `scripts/branding-policy-check.mjs`;
- `check:branding-policy` registered in `verify`;
- dedicated `.github/workflows/branding-policy.yml`;
- branding review integrated into PR and release templates, CONTRIBUTING, SUPPORT and release consistency.

## Planned final Phase 10 work

No later slice is active merely because it is listed. It receives its own branch and full completion gate when started.

Next completion slice:

- **10.8 — final Phase 10 documentation/release audit and next public release cut**.

Optional adapters driven by commercial/community demand remain ongoing evolution and are not a Phase 10 completion blocker unless deliberately promoted into the core roadmap.

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
