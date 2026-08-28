# Roadmap

<p align="center"><strong>English</strong> · <a href="./ROADMAP.es.md">Español</a></p>

Open Travel Platform is the reusable MIT-licensed open-source core. **Kairoseth Travel** is the official commercial/reference implementation deployed at **https://travel.kairoseth.com**.

The roadmap keeps two goals aligned:

1. keep the public core portable, provider-neutral and useful to agencies/developers;
2. keep hardening and extending Kairoseth Travel without coupling the core to a single PSP, supplier, CRM, ERP, CMS, identity vendor or hosting provider.

_Last updated: 28 August 2026._

---

# Current position

The platform is well beyond the original catalogue/booking MVP. Persistent identity, transactional reservations/inventory, traveller pricing, accommodation, independent services, payments, protected post-purchase Traveller Data, amendments, Operator workflows, granular permissions, documents, reporting, integration infrastructure, production-hardening controls and open-source self-host onboarding are implemented.

**Phase 8 — External integrations is COMPLETE.**

**Phase 9 — Production hardening engineering baseline is COMPLETE.** This includes security/operability, critical persistence/concurrency/contract validation, observability/recovery/audit hardening, privacy/retention, accessibility and performance/load readiness.

**Phase 10 — Open-source productisation is IN PROGRESS. Phase 10.1 and 10.2 are COMPLETE. Phase 10.3 — Extension contracts and reference adapters is ACTIVE: 10.3.1 extension inventory/authority map and 10.3.2 compatibility/versioning policy are COMPLETE; 10.3.3 contributor-facing reference adapters is ACTIVE.**

Credentialed Stripe/Redsys TEST/LIVE E2E remains pending until suitable provider accounts are available. It remains an explicit provider-dependent release validation and does not reopen the completed Phase 9 engineering baseline.

---

# Completed foundations

## Foundation, catalogue and identity — COMPLETE

- Next.js / React / TypeScript foundation;
- MongoDB capability adapters;
- bilingual EN/ES public and Operator experience;
- destinations, trips, itineraries, departures and live inventory;
- GridFS media, galleries and focal points;
- persistent customer/staff authentication;
- separate sessions, RBAC, granular capabilities and auth audit;
- public reference deployment at `travel.kairoseth.com`.

## Phase 5 — Commerce foundation — COMPLETE / IMPLEMENTED

- **5A Payment ledger:** provider-neutral payment/refund accounting separated from reservation state;
- **5B Travellers:** minors, guardians, age bands and trusted pricing snapshots;
- **5C–5E Independent services:** Activities, Transport and Travel protection with availability/reservations;
- **5F Stripe/Redsys checkout:** adapters implemented; credentialed TEST/LIVE validation still pending;
- **5G Payment terms:** full payment, deposits, installments and outstanding-balance logic.

## Phase 6 — Post-purchase and package integrity — COMPLETE

- encrypted post-purchase Traveller Data with retention controls;
- reservation amendments with atomic inventory reallocation and explicit financial delta;
- reusable accommodation/room inventory, seasonal/occupancy pricing and package supplements.

## Phase 7A — Rich operations workflow — COMPLETE

- reservation ownership, notes, priority, tags and timeline;
- tasks/follow-ups;
- supplier fulfilment by reservation component;
- advanced queues/search/filtering;
- Admin + granular Operator permissions with audit.

## Phase 7B — Documents, exports and reporting — COMPLETE

- booking confirmations, manifests and rooming lists;
- customer-safe vouchers and internal Operator dossier;
- controlled supplier-reference disclosure;
- permission-aware CSV/XLSX exports;
- reconciliation, outstanding-balance and revenue reporting;
- audited protected Traveller Data export.

---

# Phase 8 — External integrations — COMPLETE

Goal: connect real business systems through explicit provider-neutral boundaries without leaking vendor payloads or authority into core domains.

## 8A — Outbound integrations — COMPLETE

- versioned reservation events;
- transactional MongoDB outbox;
- Admin-managed signed HTTPS webhooks;
- encrypted secrets, SSRF/DNS-rebinding protection, bounded transports;
- retry/backoff, leasing, delivery history and dead-letter retention.

## 8B — Integration operations — COMPLETE

- authenticated server-only worker;
- durable worker locking and bounded cadence/batch;
- Admin dead-letter replay;
- queue/event/delivery diagnostics and retention controls.

## 8C — Business adapters — COMPLETE

- generic REST `BookingRepository` adapter;
- supplier-fulfilment request/status/cancel adapter;
- downstream-only CRM synchronization adapter;
- downstream-only ERP/accounting movement adapter;
- real local-HTTP contract validation and stable idempotency rules.

Optional future adapters remain commercial/ecosystem extensions rather than blockers: CMS/catalogue, SSO, additional PSPs and jurisdiction/vendor-specific invoicing.

---

# Phase 9 — Production hardening — COMPLETE

## 9A — Security / operability — COMPLETE

- CSP and defensive HTTP headers;
- production HSTS;
- trusted-Origin checks on cookie-authenticated mutations;
- persistent authentication throttling;
- secure session handling;
- `/api/health/live` and `/api/health/ready`;
- fail-closed `KTRAVEL_DEPLOYMENT_PROFILE=demo|live` contract.

## 9B — Persistence / concurrency / contract validation — COMPLETE

- persistent browser journey retained as informational/non-blocking CI;
- MongoDB booking concurrency and rollback validation;
- payment/webhook idempotency validation;
- traveller/minor pricing and amendment validation;
- Booking/Supplier/CRM/ERP real-HTTP contract validation.

## 9C — Observability / recovery / privileged audit — COMPLETE

- structured JSON logging and request correlation;
- provider-neutral failure transport;
- external uptime/readiness monitoring contract;
- fail-closed privileged-action audit integrity;
- versioned encryption keyrings and Traveller Data re-encryption;
- MongoDB backup/restore disaster-recovery drill;
- real MongoDB query-plan/index validation.

## 9D — Privacy / regulatory / accessibility / performance readiness — COMPLETE

- authenticated privacy-right workflows and controlled execution;
- explicit retention-policy registry and hold semantics;
- WCAG 2.2 AA-oriented accessibility engineering baseline;
- dedicated blocking accessibility journeys;
- repeatable public/authenticated read performance baselines;
- bounded mutation throughput/correctness baseline;
- standalone runtime RSS/file-descriptor/thread baseline and spike recovery.

Credentialed Stripe/Redsys TEST/LIVE validation remains a separate external dependency.

---

# Phase 10 — Open-source productisation — IN PROGRESS

Goal: make the MIT core reproducible to adopt, deploy, extend, release and contribute to without creating a hidden dependency on Kairoseth infrastructure.

## 10.1 — Reproducible fresh-clone/demo bootstrap — COMPLETE

- versioned npm lockfile and `npm ci` clean-install contract;
- safe `.env.demo.example`;
- non-destructive `npm run setup:demo`;
- no mandatory MongoDB, SMTP, PSP, CRM, ERP or supplier credentials for evaluation;
- blocking clean-checkout typecheck/build/start/HTTP smoke;
- EN/ES getting-started guidance.

## 10.2 — Provider-neutral self-host standalone deployment — COMPLETE

- Next.js `output: standalone` production boundary;
- `npm run package:standalone` stages traced runtime, static assets and `public` assets;
- blocking real `.next/standalone/server.js` HTTP/static-asset smoke;
- runtime-resource baseline aligned with the same standalone process;
- bilingual deployment guidance covering runtime secrets, live readiness, TLS/reverse proxy, MongoDB, workers, immutable releases and rollback;
- `travel.kairoseth.com` remains a reference deployment, not an MIT-core dependency.

## 10.3 — Extension contracts and reference adapters — ACTIVE

Authoritative phase document: [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md).

### 10.3.1 — Extension-point inventory and authority map — COMPLETE

Authoritative inventory: [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md).

- verified all 9 first-class `repositories/` extension interfaces against code;
- mapped composition points, bundled implementations and network contracts;
- added the previously omitted `PaymentRepository` to the public inventory;
- classified authority as bounded repository, local-authoritative, workflow-subordinate, downstream-only or monitoring-only;
- confirmed generic webhooks are downstream delivery, not reverse mutation authority;
- explicitly kept SMTP/email and arbitrary internal modules outside public plugin-contract status;
- classified Stripe/Redsys as PSP integrations rather than `PaymentRepository` replacements.

### 10.3.2 — Contract compatibility and versioning — COMPLETE

Authoritative policy: [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md).

- in-process repository/adapter interfaces follow core release SemVer instead of independent numeric versions;
- current REST v1 paths and header names are preserved exactly;
- Booking/Supplier/CRM may share `X-OTP-Contract-Version` without sharing one schema lifecycle;
- ERP/accounting and FailureTransport retain their specialized v1 headers;
- the current unversioned HTTP catalogue is frozen as legacy-v1 semantics and cannot be broken in place;
- integration event schema version and webhook signature version are explicitly independent;
- authority, authentication, idempotency, state semantics and protected-data allowlists are contract-significant;
- automatic wire-version downgrade for mutations is prohibited;
- ordinary public-contract removal requires deprecation and migration guidance;
- breaking changes require a major core release or deliberate parallel/new wire contract.

### 10.3.3 — Contributor-facing reference adapters — ACTIVE

- provide minimal provider-neutral implementations/examples using the existing generic contracts;
- demonstrate a bounded source/repository adapter and a downstream-only adapter;
- demonstrate server-only credentials, runtime validation, bounded transport and stable error normalization;
- demonstrate idempotency for mutations and audit-before-apply where applicable;
- show provider API upgrades absorbed inside adapters while the public core contract remains stable;
- show deliberate v1 → v2 migration behavior without hidden mutation fallback;
- show how proprietary integrations stay outside the generic MIT core.

### 10.3.4 — Permanent extension-contract validation — PLANNED

- add static/runtime invariants for public extension boundaries;
- prevent provider payload leakage into core domain types;
- prevent downstream CRM/ERP/supplier systems from becoming booking/payment authority;
- validate contract version headers/identifiers where applicable;
- register the final Phase 10.3 gate in `npm run verify`.

### Phase 10.3 completion criteria

10.3 can be marked COMPLETE only when:

1. the extension inventory and authority matrix are documented EN/ES;
2. compatibility/versioning policy is explicit and contributor-facing;
3. reference adapter examples are present and provider-neutral;
4. permanent automated validation protects the extension boundaries;
5. README/ROADMAP/ADAPTER-GUIDE and contract docs agree on the same model;
6. Kairoseth/customer-specific adapters remain outside the generic MIT core where appropriate;
7. CI is green after the new validation is registered.

## Later Phase 10 slices

After 10.3:

- release and migration conventions;
- upgrade/deprecation policy;
- richer contribution/release templates;
- trademark and branding policy for Open Travel Platform versus Kairoseth Travel;
- optional adapters driven by commercial/community demand.

---

# Suggested delivery order

```text
Phase 8  External integrations ------------------------------- COMPLETE
Phase 9  Production hardening engineering baseline ---------- COMPLETE
10.1     Fresh-clone/demo bootstrap -------------------------- COMPLETE
10.2     Self-host standalone deployment --------------------- COMPLETE
10.3.1   Extension inventory + authority map ----------------- COMPLETE
10.3.2   Compatibility/versioning policy --------------------- COMPLETE
10.3.3   Reference adapter examples -------------------------- ACTIVE
10.3.4   Permanent extension-contract validation ------------ PLANNED
          ↓
Later     Release/migration/contribution/branding conventions
```

---

# Core non-goals

Open Travel Platform must not become permanently tied to one payment gateway, CMS, CRM/ERP, booking supplier, identity vendor, monitoring vendor, hosting platform or Kairoseth-only infrastructure.

The public core remains MIT licensed and reusable. Kairoseth Travel can add hosted/commercial services, premium/private adapters and customer-specific integrations around that core.
