# Roadmap

<p align="center"><strong>English</strong> · <a href="./ROADMAP.es.md">Español</a></p>

Open Travel Platform is the reusable MIT-licensed open-source core. **Kairoseth Travel** is the official commercial/reference implementation deployed at **https://travel.kairoseth.com**.

The roadmap keeps two goals aligned:

1. keep the public core portable, provider-neutral and useful to other agencies/developers;
2. keep hardening Kairoseth Travel without coupling the core to one PSP, supplier, CRM, ERP, CMS, identity vendor or hosting provider.

_Last updated: 26 August 2026._

---

# Current position

The platform is well beyond the original catalogue/booking MVP. Persistent identity, transactional reservations/inventory, traveller pricing, accommodation, independent services, payments, post-purchase traveller data, amendments, rich Operator workflows, granular permissions, documents, reporting and the common integration infrastructure are already implemented.

**Phases 8A, 8B and 8C are COMPLETE. The core Phase 8 external-integration roadmap is complete. Phase 9 — Production hardening is NEXT.**

Stripe/Redsys credentialed TEST/LIVE end-to-end validation remains pending until suitable provider accounts are available. The adapters are implemented, but production payment capability is not considered validated until those provider flows have been exercised.

---

# Completed foundations

## Foundation, catalogue and identity — COMPLETE

- Next.js / React / TypeScript foundation;
- MongoDB capability adapters;
- CI/release quality gates;
- bilingual EN/ES public and Operator experience;
- destinations, trips, structured itineraries, departures and live inventory;
- GridFS media, covers, galleries and focal points;
- persistent customer and staff authentication;
- separate customer/staff sessions, RBAC, granular capabilities and auth audit;
- public reference deployment at `travel.kairoseth.com`.

## Phase 5 — Commerce foundation — COMPLETE / IMPLEMENTED

### 5A — Provider-neutral payment ledger — COMPLETE
- payment/refund movements separated from reservation state;
- manual bank transfer, cash and external terminal;
- reconciliation protections and provider/idempotency metadata.

### 5B — Travellers and age pricing — COMPLETE
- lead/individual travellers, minors/guardians and age bands;
- per-departure pricing and configurable inventory consumption;
- historical traveller/pricing snapshots.

### 5C–5E — Independent services — COMPLETE
- Activities, Transport and Travel protection catalogues;
- availability/inventory calendars;
- independent service reservations linked optionally to a trip;
- shared payment ledger.

### 5F — Stripe/Redsys unified checkout — IMPLEMENTED
- Admin TEST/LIVE provider configuration and encrypted credentials;
- Stripe signed webhooks/idempotency;
- Redsys signed server notifications;
- browser returns are non-authoritative;
- credentialed TEST/LIVE E2E still pending provider accounts.

### 5G — Deposits, installments and payment terms — COMPLETE
- full/deposit/installment policies;
- due-date snapshots, outstanding balance and next-payment calculation;
- customer schedule and Operator management.

## Phase 6 — Post-purchase and package integrity — COMPLETE

### 6A / 6A.1 — Secure post-purchase traveller data — COMPLETE
- requirement snapshots, deadlines and UX states;
- AES-256-GCM protected storage with TTL retention;
- field-name-only audit;
- passport/DNI scans and health data excluded from the standard flow.

### 6B — Reservation amendments — COMPLETE
- explicit actor/reason/before/after history;
- traveller corrections, atomic departure changes and inventory reallocation;
- financial delta without rewriting historical payment movements;
- controlled refund-review state and change-policy snapshots.

### 6C — Accommodation, room inventory and package supplements — COMPLETE
- reusable accommodation/room catalogue;
- seasonal/occupancy pricing;
- transactional trip + room inventory;
- traveller-to-room allocation;
- included/optional accommodation accounting;
- package supplements and post-booking supplement amendments.

---

# Phase 7A — Rich operations workflow — COMPLETE

- reservation ownership, notes, priority, tags and timeline;
- tasks/follow-ups with assignee, due date, status and comments;
- supplier fulfilment per trip/service/accommodation component;
- supplier status/reference/cost/deadline plus internal notes/audit;
- advanced search, filters, sorting and operational queues;
- post-booking package amendment workflow;
- Admin + granular Operator capability matrix with audited permission changes.

Supplier data does not rewrite customer totals or the payment ledger.

---

# Phase 7B — Documents, exports and reporting — COMPLETE

### 7B-1 — Booking confirmation PDFs — COMPLETE
- customer and Operator confirmations with EN/ES rendering;
- finance shown only when permission allows it;
- private `no-store` document endpoints.

### 7B-2 — Traveller manifests and rooming lists — COMPLETE
- departure manifests and rooming lists from reservation snapshots;
- protected Operator-only PDF routes;
- protected traveller values and internal supplier data excluded.

### 7B-3 — Vouchers and printable dossier — COMPLETE
- customer-safe accommodation/service vouchers;
- consolidated internal Operator dossier;
- exact supplier-reference disclosure requires separate explicit approval/audit;
- supplier costs, notes and protected traveller values excluded from customer vouchers.

### 7B-4 — CSV/XLSX and finance reporting — COMPLETE
- capability-aware `/operator/reports` workspace;
- reservations/services/customers CSV/XLSX;
- reconciliation, outstanding/overdue and revenue reports;
- currency-safe grouping;
- formula-injection mitigation;
- persistent export audit without storing cell values;
- purpose-bound, fail-closed protected traveller export.

---

# Phase 8 — External integrations — COMPLETE

Goal: connect real business systems through explicit adapters without leaking vendor payloads into core domains.

## 8A — Provider-neutral outbound integrations — COMPLETE

- versioned trip/service reservation events;
- transactional MongoDB outbox in the same reservation mutation;
- unique delivery per `(eventId, endpointId)`;
- Admin-managed signed HTTPS webhooks;
- encrypted signing secrets;
- SSRF/DNS-rebinding protections and validated-IP pinning;
- bounded timeout/response, leasing, retry/backoff, attempt history and dead-letter;
- protected post-purchase traveller data excluded from the generic event contract;
- permanent `check:outbound-integrations` gate.

## 8B — Scheduled delivery, replay and observability — COMPLETE

- server-only integration worker endpoint with Bearer auth;
- durable global worker lease and bounded cadence/batch;
- Admin dead-letter replay with preserved attempt history;
- event/delivery diagnostics and queue health metrics;
- completed-success retention policy and retention audit;
- permanent `check:integration-operations` gate.

## 8C — Business adapters — COMPLETE

### 8C-1 — Generic REST booking adapter — COMPLETE

- `BOOKING_MODE=rest` behind `BookingRepository`;
- versioned `/v1` contract and server-only Bearer auth;
- production HTTPS, redirect rejection, bounded transport;
- runtime validation, ownership/scope revalidation;
- idempotent create/cancel retries;
- payment ledger, staff operations, catalogue and traveller data remain separate capabilities;
- permanent `check:rest-booking-adapter` gate.

### 8C-2 — Supplier fulfilment adapter boundary — COMPLETE

- provider-neutral `SupplierFulfilmentAdapter`;
- opt-in REST v1 request/status/cancel flow;
- deterministic idempotency and stable provider errors;
- external response audit before local application;
- responses re-enter the existing local fulfilment state machine;
- invalid transitions are never forced;
- supplier costs/currency are preserved locally;
- customer voucher reference disclosure remains separate;
- permanent `check:supplier-fulfilment-adapter` gate.

### 8C-3 — CRM synchronization adapter — COMPLETE

- provider-neutral downstream-only `CrmSyncAdapter`;
- opt-in `CRM_SYNC_MODE=disabled|rest` and REST v1 reference implementation;
- contact and reservation upsert contracts with strict allowlists;
- customer registration/profile changes enqueue CRM triggers transactionally;
- `customer.*` events are not available to generic webhook subscriptions;
- CRM reuses the existing integration outbox/worker/retry/dead-letter/replay pipeline instead of creating a second queue;
- reservation events upsert the contact before the reservation;
- stable event-derived idempotency keys;
- payment values, supplier data, inventory mutation instructions, traveller arrays and protected post-purchase fields excluded from the generic CRM contract;
- CRM external IDs stored separately in `travel_crm_sync_links`;
- non-PII sync outcome audit in `travel_crm_sync_audit`;
- Admin diagnostics at `/operator/integrations/crm`;
- permanent `check:crm-sync-adapter` gate.

### 8C-4 — ERP/accounting adapter — COMPLETE

- provider-neutral downstream-only `ErpAccountingAdapter`;
- opt-in `ERP_ACCOUNTING_MODE=disabled|rest` and REST v1 movement upsert reference adapter;
- only authoritative local `succeeded` payment/refund ledger movements are eligible;
- payment/refund finalization and its ERP outbox trigger commit in the same MongoDB transaction;
- exact source amount, currency, provider and immutable payment reference are preserved;
- deterministic event IDs and stable event-derived idempotency keys;
- ERP financial events are not exposed to generic webhook subscriptions and are not consumed by CRM;
- the existing integration worker provides retry/backoff, dead-letter, replay and health visibility without a second queue;
- external references are stored separately in `travel_erp_accounting_links`;
- acknowledgement audit in `travel_erp_accounting_audit` excludes amounts, currency, provider references, customer PII and raw HTTP bodies;
- Admin diagnostics at `/operator/integrations/erp`;
- the generic core exports accounting-ready movements and deliberately does not claim jurisdiction-specific legal invoice generation without authoritative tax/billing data;
- vendor-specific chart-of-accounts/tax mapping remains inside downstream adapters;
- permanent `check:erp-accounting-adapter` gate.

### Optional future adapters

These are extensions rather than blockers for the completed Phase 8 core integration boundary:

- CMS/catalogue source adapter;
- enterprise identity/SSO where useful;
- additional payment providers when commercially justified;
- jurisdiction/vendor-specific invoicing adapters after authoritative fiscal data is modeled.

---

# Phase 9 — Production hardening — NEXT

The next priority is to harden the already broad product surface for production operation.

### Testing
- browser E2E registration → booking → package/services → payment → Operator;
- MongoDB integration/concurrency tests;
- payment webhook/idempotency tests;
- traveller/minor pricing and amendment E2E;
- adapter contract/integration tests;
- accessibility/performance review.

### Security/privacy
- CSRF, rate limiting, CSP/security headers and cookie/session review;
- dependency/secret scanning;
- privileged-action audit review;
- key recovery/rotation and backup/restore procedures;
- GDPR/privacy/booking/cookie/retention/export/deletion workflows;
- market-specific regulatory review.

### Observability/operations
- structured logs and centralized errors;
- uptime/health monitoring;
- payment/integration failure visibility;
- disaster recovery and rollback;
- database index/performance review.

Credentialed Stripe/Redsys TEST/LIVE validation should be inserted as soon as provider accounts are available and remains part of production hardening.

---

# Phase 10 — Open-source productisation

- production environment documentation;
- clean demo seed/setup;
- fresh-clone install/deployment guide;
- reference adapters and extension contracts;
- versioned releases/migrations;
- contribution templates and public API/extension docs;
- optional Docker/self-host example;
- trademark/branding policy;
- proprietary Kairoseth/customer adapters outside the MIT core where appropriate.

---

# Suggested delivery order

```text
9A    Production security / operability baseline
  ↓
9     Production hardening and credentialed E2E
  ↓
10    Open-source productisation / release
  ↓
optional adapters driven by commercial need
```

---

# Core non-goals

Open Travel Platform must not become permanently tied to one payment gateway, CMS, CRM/ERP, booking supplier, identity vendor, hosting platform or Kairoseth-only infrastructure.

The public core remains MIT licensed and reusable. Kairoseth Travel can add hosted/commercial services, premium/private adapters and customer-specific integrations around that core.
