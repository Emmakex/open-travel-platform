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

Locked installation, safe demo bootstrap, infrastructure-free evaluation, production build/start/HTTP smoke and EN/ES onboarding.

## 10.2 — Provider-neutral standalone deployment — COMPLETE

Next.js standalone runtime, packaging, real HTTP/static smoke and readiness/TLS/MongoDB/worker/rollback deployment guidance.

## 10.3 — Extension contracts and reference adapters — COMPLETE

Delivered nine verified provider-neutral extension interfaces, explicit authority map, compatibility/versioning policy, real reference adapters and permanent `check:extension-contracts` validation.

## 10.4 — Release and migration conventions — COMPLETE

Delivered Semantic Versioning, immutable `vX.Y.Z` tags, verified-`main` release identity, migration classes, **expand → migrate → contract**, recovery requirements and permanent `check:release-migrations` validation.

## 10.5 — Upgrade and deprecation lifecycle policy — COMPLETE

Delivered supported upgrade paths, lifecycle `ACTIVE → DEPRECATED → REMOVED`, ordinary MAJOR-only public removals, documented security exceptions and permanent `check:upgrade-deprecations` validation.

## 10.6 — Contribution and release templates — COMPLETE

Authoritative documents:

- [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md)
- [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md)

Delivered:

- one canonical `.github/PULL_REQUEST_TEMPLATE.md`; duplicate case-variant template removed;
- PR checklist aligned with capability boundaries, SemVer, migrations, lifecycle, authority/security/privacy, UX/accessibility and phase closure;
- richer bug/feature issue forms with exact-version, compatibility/public-contract and data-safety context;
- reusable `.github/RELEASE_TEMPLATE.md` covering release identity, compatibility, upgrade/migration, deprecations/removals, rollback, validation and publication;
- `scripts/contribution-template-check.mjs` and `npm run check:contribution-templates`;
- dedicated `.github/workflows/contribution-templates.yml`;
- gate registered inside `npm run verify` and contributor documentation.

## Planned later Phase 10 work

No later slice is active merely because it is listed. Each receives its own branch and full completion gate when started.

Potential next slices:

- trademark/branding policy between Open Travel Platform and Kairoseth Travel;
- final Phase 10 documentation/release audit and public release cut;
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
