# Roadmap

<p align="center"><strong>English</strong> · <a href="./ROADMAP.es.md">Español</a></p>

Open Travel Platform is the reusable MIT-licensed core. **Kairoseth Travel** is the official commercial/reference deployment at **https://travel.kairoseth.com**.

_Last updated: 28 August 2026._

## Current position

**Phase 8 — External integrations: COMPLETE.**  
**Phase 9 — Production hardening engineering baseline: COMPLETE.**  
**Phase 10 — Open-source productisation: IN PROGRESS.**

Phase 10 status after the 10.3.3 closing merge:

```text
10.1     Fresh-clone/demo bootstrap -------------------------- COMPLETE
10.2     Self-host standalone deployment --------------------- COMPLETE
10.3.1   Extension inventory + authority map ----------------- COMPLETE
10.3.2   Compatibility/versioning policy --------------------- COMPLETE
10.3.3   Contributor-facing reference adapters --------------- COMPLETE
10.3.4   Permanent extension-contract validation ------------ ACTIVE
```

Credentialed Stripe/Redsys TEST/LIVE E2E remains a separate external dependency and does not reopen Phase 9.

---

# Completed foundations

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
- structured logging, failure transport and external monitoring contract;
- privileged audit integrity and encryption keyrings;
- MongoDB backup/restore and query-plan/index validation;
- privacy-right execution and retention policy;
- WCAG 2.2 AA-oriented accessibility gates;
- public/authenticated read, mutation-throughput and runtime-resource baselines.

---

# Phase 10 — Open-source productisation — IN PROGRESS

Goal: make the MIT core easy to adopt, self-host, extend, release and contribute to without hidden Kairoseth dependencies.

## 10.1 — Reproducible demo bootstrap — COMPLETE

- locked `npm ci` install contract;
- safe `.env.demo.example`;
- non-destructive `npm run setup:demo`;
- no mandatory external infrastructure for evaluation;
- clean-checkout build/start/HTTP smoke;
- EN/ES onboarding.

## 10.2 — Provider-neutral standalone deployment — COMPLETE

- Next.js `output: standalone` runtime;
- `npm run package:standalone`;
- real standalone HTTP/static smoke;
- deployment docs for runtime secrets, readiness, TLS/proxy, MongoDB, workers, rollback;
- Kairoseth Travel remains a reference deployment, not a core dependency.

## 10.3 — Extension contracts and reference adapters — ACTIVE

Authoritative phase document: [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md).

### 10.3.1 — Inventory and authority map — COMPLETE

Authoritative inventory: [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md).

Completed:

- verified all 9 first-class `repositories/` interfaces;
- mapped composition, implementations and network contracts;
- added `PaymentRepository` to the formal inventory;
- classified bounded, local-authoritative, workflow-subordinate, downstream-only and monitoring-only authority;
- kept SMTP/internal modules outside public plugin-contract status;
- classified Stripe/Redsys as PSP integrations rather than payment-ledger repositories.

### 10.3.2 — Compatibility/versioning policy — COMPLETE

Authoritative policy: [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md).

Completed:

- public in-process interfaces follow core SemVer;
- existing REST v1 paths/headers remain stable;
- the unversioned catalogue is frozen as legacy-v1 semantics;
- event-schema and webhook-signature versions are independent;
- authority/authentication/idempotency/state/data allowlists are contract-significant;
- hidden mutation downgrade is prohibited;
- breaking evolution requires explicit version/migration/deprecation handling.

### 10.3.3 — Contributor-facing reference adapters — COMPLETE

Authoritative guide: [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md).

Completed:

- designated `RestBookingRepository` as the bounded-authority repository reference;
- designated `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` as the workflow-subordinate/audit-before-apply reference;
- designated `RestCrmSyncAdapter` as the downstream-only reference;
- documented `RestFailureTransport` as an optional monitoring-only pattern;
- documented server-only credentials, HTTPS/redirect safety, bounded transport, runtime validation and stable error normalization;
- documented deterministic idempotency and audit-before-apply;
- documented provider-version absorption inside adapters;
- documented deliberate v1→v2 migration without hidden fallback;
- documented the proprietary Kairoseth/customer adapter boundary;
- confirmed existing `tests/rest-adapter-contracts.ts` coverage for the designated network references.

### 10.3.4 — Permanent extension-contract validation — ACTIVE after merge

Next work must add a permanent automated gate that protects the model formalized in 10.3.1–10.3.3.

Target coverage:

- verified public interfaces/reference paths remain present;
- version declarations and documentation remain synchronized;
- provider payload types cannot leak into shared domain interfaces;
- CRM/ERP remain downstream-only;
- supplier responses still pass through audit/local transition validation;
- reference adapters retain server-only credentials, bounded transport and runtime parsing;
- project/contract/adapter docs remain consistent;
- final gate is registered in `npm run verify` and CI.

## Phase 10.3 completion gate

Phase 10.3 is not complete until:

1. 10.3.1–10.3.4 are complete;
2. EN/ES docs, README, ROADMAP and CHANGELOG are synchronized;
3. the permanent validation is running in `npm run verify` and CI;
4. required CI is green;
5. the closing PR is merged to `main`;
6. `main` is verified before any later Phase 10 slice begins.

---

# Later Phase 10 slices

After Phase 10.3 closes:

- release and migration conventions;
- upgrade/deprecation policy;
- richer contribution/release templates;
- trademark/branding policy between Open Travel Platform and Kairoseth Travel;
- optional adapters driven by commercial/community demand.

## Core non-goals

The public core must not become permanently tied to one PSP, supplier, CRM/ERP, CMS, identity vendor, monitoring vendor, hosting provider or Kairoseth-only infrastructure.
