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
```

Credentialed Stripe/Redsys TEST/LIVE E2E remains a separate external dependency and does not reopen Phase 9.

---

# Completed platform foundations

## Catalogue, identity and booking — COMPLETE

- Next.js / React / TypeScript foundation;
- MongoDB capability adapters;
- bilingual EN/ES public and Operator surfaces;
- destinations, trips, itineraries, departures and inventory;
- persistent customer/staff identity and RBAC;
- transactional booking with trusted pricing/inventory;
- travellers/minors/guardians and historical pricing snapshots.

## Commerce, post-purchase and operations — COMPLETE

- provider-neutral payment/refund ledger and Stripe/Redsys checkout adapters;
- deposits/installments/outstanding balance;
- Activities, Transport and Travel protection;
- encrypted Traveller Data and amendments;
- accommodation/room inventory and package supplements;
- Operator workflows, supplier fulfilment, documents, exports and reporting.

---

# Phase 8 — External integrations — COMPLETE

- versioned integration events and transactional MongoDB outbox;
- signed HTTPS webhooks, retries/dead-letter and durable worker;
- generic REST `BookingRepository`;
- supplier fulfilment REST adapter;
- downstream-only CRM and ERP/accounting adapters;
- real local-HTTP contract validation.

---

# Phase 9 — Production hardening — COMPLETE

- CSP/security headers, HSTS, Origin checks and throttling;
- liveness/readiness and fail-closed `demo|live` profiles;
- MongoDB concurrency, rollback and idempotency validation;
- observability, recovery and privileged audit;
- privacy/retention;
- WCAG 2.2 AA-oriented accessibility gates;
- read, mutation-throughput and runtime-resource baselines.

---

# Phase 10 — Open-source productisation — IN PROGRESS

Goal: make the MIT core easy to adopt, self-host, extend, release and contribute to without hidden Kairoseth dependencies.

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

- nine verified provider-neutral public extension interfaces;
- explicit authority map;
- compatibility/versioning/deprecation rules;
- real contributor reference adapters;
- permanent `check:extension-contracts` gate and blocking workflow.

## 10.4 — Release and migration conventions — COMPLETE

Authoritative documents:

- [`docs/RELEASES.md`](docs/RELEASES.md)
- [`docs/RELEASES.es.md`](docs/RELEASES.es.md)
- [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md)
- [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md)

Release contract:

- stable public releases follow Semantic Versioning;
- `package.json` uses `X.Y.Z` and Git uses immutable `vX.Y.Z` tags;
- package version, README badge, CHANGELOG and tag must agree;
- releases are cut only from verified `main`;
- `npm ci` + `npm run verify` is mandatory before release;
- historical release entries/tags are immutable records.

Migration contract:

- configuration, persistent-data, wire-contract, encryption/key and destructive changes are explicitly classified;
- compatible persistent evolution follows **expand → migrate → contract**;
- operational migrations must be deterministic, bounded, retry-safe/idempotent or resumable, and verifiable;
- hidden destructive migrations during application startup are prohibited;
- payment/history, booking/inventory and protected Traveller Data receive explicit migration safeguards;
- every non-trivial migration declares rollback/recovery semantics.

Permanent automation:

```bash
npm run check:release
npm run check:release-migrations
npm run verify
```

Delivered:

- `scripts/release-migration-check.mjs`;
- `check:release-migrations` registered in `verify`;
- `release-check.mjs` now requires the bilingual release/migration policy files;
- dedicated blocking `.github/workflows/release-migrations.yml`;
- contribution guidance requires explicit release/migration impact classification.

## Planned Phase 10 work

No later slice is active merely because it appears below. Each receives its own branch and full completion gate when started.

Potential next slices:

- **10.5 — upgrade and deprecation lifecycle policy**;
- richer contribution/release templates;
- trademark/branding policy between Open Travel Platform and Kairoseth Travel;
- optional adapters driven by commercial/community demand.

## Permanent phase gate

Every phase/slice follows the same immutable sequence:

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
