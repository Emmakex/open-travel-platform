# Roadmap

<p align="center"><strong>English</strong> · <a href="./ROADMAP.es.md">Español</a></p>

Open Travel Platform is the reusable MIT-licensed core. **Kairoseth Travel** is the official commercial/reference deployment at **https://travel.kairoseth.com**.

_Last updated: 28 August 2026._

## Current position

**Phase 8 — External integrations: COMPLETE.**  
**Phase 9 — Production hardening engineering baseline: COMPLETE.**  
**Phase 10 — Open-source productisation: IN PROGRESS.**  
**Phase 10.3 — Extension contracts and reference adapters: COMPLETE.**

```text
10.3.1   Extension inventory + authority map ----------------- COMPLETE
10.3.2   Compatibility/versioning policy --------------------- COMPLETE
10.3.3   Contributor-facing reference adapters --------------- COMPLETE
10.3.4   Permanent extension-contract validation ------------ COMPLETE
```

The permanent extension gate is now part of `npm run verify` and has its own blocking GitHub Actions workflow.

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

## Commerce and post-purchase — COMPLETE

- provider-neutral payment/refund ledger;
- Stripe/Redsys checkout integrations;
- deposits/installments/outstanding balance;
- Activities, Transport and Travel protection;
- encrypted post-purchase Traveller Data;
- amendments with transactional inventory handling;
- accommodation/room inventory and package supplements.

## Operations, documents and reporting — COMPLETE

- ownership, notes, tags, priority and timeline;
- tasks/follow-ups;
- supplier fulfilment;
- granular Operator/Admin permissions and audit;
- confirmations, manifests, rooming lists, vouchers and dossier;
- permission-aware CSV/XLSX exports;
- reconciliation, balance and revenue reporting.

---

# Phase 8 — External integrations — COMPLETE

- versioned integration events and transactional MongoDB outbox;
- signed HTTPS webhooks with retry/dead-letter handling;
- authenticated durable worker and Admin replay/diagnostics;
- generic REST `BookingRepository`;
- supplier fulfilment REST adapter;
- downstream-only CRM and ERP/accounting adapters;
- stable idempotency and real local-HTTP contract validation.

---

# Phase 9 — Production hardening — COMPLETE

- CSP/security headers, HSTS, Origin checks and throttling;
- liveness/readiness and fail-closed `demo|live` profiles;
- MongoDB concurrency, rollback and payment/webhook idempotency validation;
- structured logging, failure transport and external monitoring;
- privileged audit integrity and encryption keyrings;
- MongoDB backup/restore and query-plan/index validation;
- privacy-right execution and retention policy;
- WCAG 2.2 AA-oriented accessibility gates;
- read, mutation-throughput and runtime-resource baselines.

---

# Phase 10 — Open-source productisation — IN PROGRESS

Goal: make the MIT core easy to adopt, self-host, extend, release and contribute to without hidden Kairoseth dependencies.

## 10.1 — Reproducible demo bootstrap — COMPLETE

- locked `npm ci` install contract;
- safe demo configuration;
- non-destructive `npm run setup:demo`;
- no mandatory external infrastructure for evaluation;
- clean-checkout build/start/HTTP smoke;
- EN/ES onboarding.

## 10.2 — Provider-neutral standalone deployment — COMPLETE

- Next.js `output: standalone` runtime;
- `npm run package:standalone`;
- real standalone HTTP/static smoke;
- deployment docs covering readiness, TLS/proxy, MongoDB, workers and rollback;
- Kairoseth Travel remains a reference deployment, not a core dependency.

## 10.3 — Extension contracts and reference adapters — COMPLETE

### 10.3.1 — Inventory and authority map — COMPLETE

Authoritative inventory: [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md).

- verified exactly nine first-class `repositories/` interfaces;
- mapped composition, implementations and network contracts;
- classified bounded/local/workflow/downstream/monitoring authority;
- kept internal modules outside the public plugin contract;
- classified Stripe/Redsys as PSP integrations rather than ledger repositories.

### 10.3.2 — Compatibility/versioning — COMPLETE

Authoritative policy: [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md).

- public in-process interfaces follow core SemVer;
- existing REST v1 paths/headers remain stable;
- the unversioned catalogue is legacy-v1 semantics;
- event schema and signing-scheme versions are independent;
- authority/authentication/idempotency/state/data allowlists are contract-significant;
- hidden mutation downgrade is prohibited;
- breaking changes require explicit migration/deprecation/version handling.

### 10.3.3 — Contributor reference adapters — COMPLETE

Authoritative guide: [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md).

- `RestBookingRepository` — bounded repository reference;
- `RestSupplierFulfilmentAdapter` + coordinator — workflow-subordinate, audit-before-apply;
- `RestCrmSyncAdapter` — downstream-only reference;
- `RestFailureTransport` — optional monitoring-only pattern;
- references are tied to existing real HTTP contract tests.

### 10.3.4 — Permanent extension-contract validation — COMPLETE

Authoritative guide: [`docs/EXTENSION-VALIDATION.md`](docs/EXTENSION-VALIDATION.md).

Delivered:

- `scripts/extension-contract-check.mjs`;
- `npm run check:extension-contracts`;
- registration inside `npm run verify`;
- dedicated blocking `.github/workflows/extension-contracts.yml`;
- dedicated workflow executes both static invariants and `npm run test:rest-adapter-contracts`.

The gate protects:

- exact public interface inventory;
- provider-neutral interface purity;
- CRM/ERP downstream-only authority;
- supplier audit-before-apply and authority limits;
- provider-neutral payment-ledger boundary;
- stable v1 contract/header/schema/signature identifiers;
- reference-adapter transport safeguards;
- EN/ES documentation synchronization.

## Phase 10.3 completion record

All Phase 10.3 completion requirements are satisfied by the closing change:

1. 10.3.1–10.3.4 implementation scope is complete;
2. `npm run check:extension-contracts` is registered in `verify` and blocking CI;
3. EN/ES docs, README, ROADMAP and CHANGELOG are synchronized;
4. the dedicated gate and existing runtime contract suite validate the extension model;
5. proprietary Kairoseth/customer adapters remain decoupled from the MIT core.

The permanent project rule remains: required CI, merge to `main`, and verification of `main` are mandatory before starting the next phase.

## Planned later Phase 10 work

Following completed Phase 10.3, later Phase 10 work may cover:

- release and migration conventions;
- upgrade/deprecation policy;
- richer contribution/release templates;
- trademark/branding policy between Open Travel Platform and Kairoseth Travel;
- optional adapters driven by commercial/community demand.

No later slice is considered started merely because it is listed here; it receives its own branch and completion gate when work begins.

## Core non-goals

The public core must not become permanently tied to one PSP, supplier, CRM/ERP, CMS, identity vendor, monitoring vendor, hosting provider or Kairoseth-only infrastructure.
