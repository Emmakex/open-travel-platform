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
10.7     Trademark/branding and project identity policy ------ COMPLETE
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

Delivered supported upgrade paths, lifecycle `ACTIVE → DEPRECATED → REMOVED`, ordinary MAJOR-only removal, security exceptions and permanent `check:upgrade-deprecations` validation.

## 10.6 — Contribution and release templates — COMPLETE

Authoritative documents:

- [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md)
- [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md)

Delivered one canonical PR template, richer bug/feature forms, a reusable release template, `check:contribution-templates`, a dedicated workflow and contributor documentation synchronized with Phases 10.3–10.5.

## 10.7 — Trademark/branding and project identity policy — COMPLETE

Authoritative documents:

- [`TRADEMARKS.md`](TRADEMARKS.md)
- [`TRADEMARKS.es.md`](TRADEMARKS.es.md)

Delivered:

- explicit separation between MIT software rights and project/reference identity guidance;
- Open Travel Platform defined as the public upstream core identity;
- Kairoseth Travel defined as the official hosted/commercial reference implementation at `travel.kairoseth.com`;
- truthful “Based on/Powered by Open Travel Platform” attribution allowed for independent deployments when their own identity remains primary;
- independent modified/public commercial deployments are expected to configure their own `NEXT_PUBLIC_SITE_NAME`/presentation identity;
- no unverified registered, official, certified, approved, partner or endorsement claims;
- current repository contains no designated official logo package under this policy;
- legacy `KTRAVEL_*` configuration names classified as technical compatibility identifiers, not branding rights;
- future `KTRAVEL_*` namespace migration must follow the established deprecation/upgrade/migration lifecycle rather than a silent rename;
- PR/release templates include branding/identity impact classification;
- `scripts/branding-policy-check.mjs`, `npm run check:branding-policy` and dedicated `.github/workflows/branding-policy.yml`.

## Final Phase 10 closure work — PLANNED

No final closure slice is active until Phase 10.7 has green CI, is merged and `main` is verified.

The remaining Phase 10 blocker is a final documentation/release audit and public release cut. That slice should:

- audit links, EN/ES documentation, templates and permanent gates from a clean `main`;
- confirm fresh-clone/demo and standalone release paths;
- perform final SemVer classification of all post-1.0 productisation work;
- convert the current `Unreleased` work into the selected stable release (expected MINOR unless the final audit finds a breaking change);
- synchronize package version, README badge, CHANGELOG and immutable Git tag;
- run complete CI and verify `main` before creating the tag/GitHub Release;
- mark Phase 10 COMPLETE only after the release record is verified.

Optional adapters driven by commercial/community demand remain later evolution and are not a Phase 10 completion blocker unless deliberately promoted.

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
