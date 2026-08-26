# Roadmap

<p align="center"><strong>English</strong> · <a href="./ROADMAP.es.md">Español</a></p>

Open Travel Platform is the reusable MIT-licensed open-source core. **Kairoseth Travel** is the official commercial/reference implementation deployed at **https://travel.kairoseth.com**.

The roadmap keeps two goals aligned:

1. keep the public core portable, provider-neutral and useful to other agencies/developers;
2. continue hardening Kairoseth Travel into a complete production travel platform without coupling the core to one PSP, supplier, CRM, ERP, CMS or hosting provider.

_Last updated: 26 August 2026._

---

# Current position

The project is well beyond the original catalogue/booking MVP.

Completed foundations now include persistent customer/staff identity, RBAC, trip/service reservations, traveller pricing, independent services, transactional email, provider-neutral payment accounting, Stripe/Redsys checkout adapters, deposits/installments, encrypted post-purchase traveller data, reservation amendments, reusable accommodation, transactional room inventory, package supplements, rich operations, granular staff permissions, booking/departure documents, customer-safe vouchers, internal dossiers, CSV/XLSX reporting, audited sensitive exports, provider-neutral outbound events, scheduled integration operations, a generic REST booking adapter and a provider-neutral supplier-fulfilment adapter boundary.

Stripe/Redsys credentialed end-to-end validation remains pending until suitable provider accounts are available. Their adapters are implemented, but production payment capability is not considered validated until TEST/LIVE provider flows are exercised.

**Phases 6B, 6C, 7A, 7B, 8A and 8B are complete. Phase 8C — Business adapters is IN PROGRESS. Phase 8C-1 — Generic REST booking adapter and Phase 8C-2 — Supplier fulfilment adapter boundary are COMPLETE. Phase 8C-3 — CRM synchronization adapter is NEXT.**

---

# Completed milestones

## Foundation and catalogue — COMPLETE

- Next.js / React / TypeScript foundation;
- MongoDB capability adapters;
- CI/release quality gates;
- bilingual EN/ES public and Operator experience;
- destinations, trips and structured multilingual itineraries;
- GridFS media, covers, galleries and focal points;
- departures, capacity and live inventory;
- public reference deployment at `travel.kairoseth.com`.

## Identity, RBAC and account security — COMPLETE

- persistent customer and staff authentication;
- separate customer/staff sessions;
- server-side RBAC and granular capabilities;
- lockout, password change/recovery and SMTP delivery;
- authentication audit events.

## Reservation operations and email — COMPLETE

- persistent trip reservations;
- server-authoritative pricing, ownership and inventory;
- confirm/cancel workflows with transactional inventory release;
- customer/Operator views and operational audit;
- transactional reservation email.

## Phase 5A — Provider-neutral payments — COMPLETE

- payment/refund ledger separated from reservation state;
- bank transfer, cash and external terminal movements;
- controlled refunds and reconciliation protections;
- Operator finance visibility;
- provider/idempotency metadata.

## Phase 5B — Traveller and age pricing — COMPLETE

- lead/individual travellers;
- date of birth and nationality;
- configurable age bands and per-departure pricing;
- guardian rules for minors;
- configurable seat consumption;
- historical traveller/pricing snapshots.

## Phase 5C — Independent service catalogue — COMPLETE

- Activities, Transport and Travel protection;
- public catalogue/detail pages;
- protected Operator CRUD;
- multilingual content;
- per-person / booking / unit / age pricing.

## Phase 5D — Service availability and inventory — COMPLETE

- activity/transport calendars and slots;
- capacity/reserved-space and unit inventory;
- safe slot closing;
- service inventory separated from trip inventory.

## Phase 5E — Independent service reservations — COMPLETE

- activity, transport and protection reservations;
- optional relationship to a Kairoseth trip;
- transactional service inventory;
- customer My services and Operator queue;
- common payment ledger.

## Phase 5F — Payment providers and unified checkout — IMPLEMENTED

- Admin-only TEST/LIVE provider configuration;
- encrypted Stripe/Redsys credentials;
- unified trip/service checkout;
- signed Stripe webhooks + idempotency;
- signed Redsys server notifications;
- browser returns remain non-authoritative;
- credentialed TEST/LIVE E2E still pending provider accounts.

## Phase 5G — Deposits, installments and payment terms — COMPLETE

- full-payment/deposit policies;
- configurable deposits/installments;
- due-date snapshots;
- outstanding-balance and next-payment calculations;
- customer schedule and Operator management.

## Phase 6A — Secure post-purchase traveller data — COMPLETE

- requirement presets and reservation snapshots;
- advanced identity/document/residence fields only when required;
- deadlines;
- AES-256-GCM encryption and separate sensitive-data storage;
- TTL retention/deletion;
- field-name-only audit history;
- Operator completion visibility;
- passport/DNI scans and health data excluded from the standard flow.

## Phase 6A.1 — Traveller-data UX/documentation — COMPLETE

- Not required / Pending / Complete states;
- customer task visibility;
- aggregate/per-traveller completion;
- snapshot semantics and EN/ES guidance.

## Phase 6B — Reservation amendments — COMPLETE

- explicit amendment history with actor/reason/before/after/timestamp;
- controlled traveller corrections;
- atomic departure changes;
- traveller pricing/accommodation reallocation;
- financial delta without rewriting historical ledger movements;
- controlled refund-review state;
- linked-service handling;
- snapshotted change/cancellation deadlines and notifications.

## Phase 6C — Accommodation, supplements and package composition — COMPLETE

- reusable accommodation and room types;
- room inventory and occupancy limits;
- public/Operator accommodation catalogue and galleries;
- trip ↔ accommodation links;
- seasonal/occupancy pricing;
- automatic traveller-to-room allocation;
- transactional trip + room inventory;
- included/optional accommodation accounting;
- accommodation reallocation during amendments;
- package supplements and server-authoritative snapshots.

---

# Phase 7A — Rich operations workflow — COMPLETE

### 7A-1 — Reservation ownership, notes and priorities — COMPLETE
- owner assignment, internal notes, priority, tags and timeline;
- audited changes and customer privacy invariant.

### 7A-2 — Tasks and follow-ups — COMPLETE
- assignee, due date, status, comments and dashboard views;
- audited changes.

### 7A-3 — Supplier/fulfilment tracking — COMPLETE
- fulfilment per trip/service/accommodation component;
- supplier status/reference/cost/deadline;
- notes, audit, global queue and attention metrics;
- supplier data cannot rewrite customer totals or ledger.

### 7A-4 — Search, filters and operational queues — COMPLETE
- free-text search and reservation/payment/owner/priority/tag/departure filters;
- balance/installment filters;
- Mine / Needs attention / Unassigned views;
- sorting and pagination.

### 7A-5 — Package amendment workflow — COMPLETE
- add/remove supplements post-booking;
- traveller assignment changes;
- contracted-price preservation;
- exact before/after snapshots and financial delta.

### 7A-6 — Granular staff permissions — COMPLETE
- Admin superuser + narrower Operator matrix;
- reservations/catalogue/finance/traveller-data/suppliers/tasks capabilities;
- server-authoritative route/action/data boundaries;
- transactional permission audit;
- permanent CI invariant.

---

# Phase 7B — Documents, exports and reporting — COMPLETE

## 7B-1 — Booking confirmation PDFs — COMPLETE

- reusable `pdf-lib` document layer;
- customer and Operator confirmations;
- EN/ES rendering;
- trip dates, travellers, accommodation, package supplements and contact summary;
- finance details only when permitted;
- private `no-store` endpoints and permanent PDF invariant.

## 7B-2 — Traveller lists and rooming lists — COMPLETE

- departure traveller manifests;
- rooming lists from snapshotted allocations;
- protected Operator PDF routes;
- EN/ES printable output;
- protected post-purchase fields, supplier data and internal notes excluded;
- permanent `check:departure-documents` gate.

## 7B-3 — Vouchers and printable reservation dossier — COMPLETE

- customer-safe accommodation/service vouchers;
- authorized Operator download of the same safe vouchers;
- consolidated internal Operator dossier;
- finance/supplier sections loaded only with matching staff capability;
- explicit document version/status and UTC timestamp;
- supplier references internal by default and exact-reference disclosure explicitly approved/audited;
- changing a supplier reference invalidates previous disclosure approval;
- supplier costs, internal notes and protected traveller values excluded from customer vouchers;
- private `no-store` + `nosniff` responses;
- permanent `check:voucher-documents` invariant.

## 7B-4 — CSV/XLSX exports and reconciliation/reporting — COMPLETE

- protected `/operator/reports` workspace;
- trip/service/customer CSV/XLSX exports;
- stable shared tabular contracts;
- server-side date filtering and bounded browser exports;
- Finance-only reconciliation, outstanding/overdue and revenue reports;
- currency-safe grouping and dashboards;
- CSV/spreadsheet formula-injection mitigation;
- lightweight OOXML XLSX with frozen header/autofilter;
- persistent export audit without storing exported cell values;
- protected traveller export isolated, purpose-bound and fail-closed on audit persistence;
- permanent `check:reporting-exports` gate and EN/ES documentation.

---

# Phase 8 — External integrations — IN PROGRESS

Goal: connect deployments to real business ecosystems through adapters while keeping provider-specific payloads outside core domains.

## 8A — Provider-neutral outbound integrations — COMPLETE

- versioned trip/service reservation event envelope;
- transactional MongoDB outbox in the same reservation transaction;
- idempotent delivery per `(eventId, endpointId)`;
- Admin endpoint configuration and subscriptions;
- dedicated AES-256-GCM encrypted signing secrets;
- HMAC-SHA256 signed HTTPS webhook adapter;
- HTTPS-only validation, private/reserved-network blocking and DNS revalidation;
- validated-IP pinning with original SNI/Host;
- no redirects, bounded timeout/response body;
- leasing, crash recovery, retry/backoff and dead-letter history;
- protected traveller data excluded from generic events;
- permanent `check:outbound-integrations` gate.

## 8B — Scheduled delivery, replay and observability — COMPLETE

- server-only `POST /api/internal/integrations/process` worker entry point;
- dedicated Bearer authentication with timing-safe comparison;
- durable worker lease shared by scheduler/manual Admin execution;
- bounded batch/frequency controls and `Retry-After`;
- audited Admin dead-letter replay;
- event/delivery detail views and attempt history;
- health metrics for pending/retrying/dead-letter, oldest due and 24h success/failure;
- completed-success retention policy preserving active/dead-letter/replay audit;
- private `no-store` + `nosniff` scheduler responses;
- permanent `check:integration-operations` gate.

## 8C — Business adapters — IN PROGRESS

Concrete business adapters now sit behind provider-neutral interfaces and must not become authoritative outside their assigned capability.

### 8C-1 — Generic REST booking adapter — COMPLETE

- `BOOKING_MODE=rest` behind the existing `BookingRepository` interface;
- versioned `/v1` contract using `X-OTP-Contract-Version: 1`;
- server-only Bearer authentication and production HTTPS;
- no redirects, `no-store`, bounded timeout and streamed response cap;
- runtime validation before external JSON enters the booking domain;
- customer ownership and requested trip/departure scope revalidated after mapping;
- create/cancel use stable idempotency keys and bounded transient retries;
- stable application error translation;
- payment ledger, staff operations, catalogue, traveller data and outbound integrations stay separately composable;
- EN/ES documentation and permanent `check:rest-booking-adapter` gate.

### 8C-2 — Supplier fulfilment adapter boundary — COMPLETE

- provider-neutral `SupplierFulfilmentAdapter` interface;
- opt-in `disabled | rest` composition independent from booking persistence;
- versioned REST v1 `request`, `status` and `cancel` operations;
- `request` must normalize to `requested`; `cancel` must normalize to `cancelled`; confirmation/rejection arrives through `status`;
- server-only Bearer authentication and production HTTPS enforcement;
- redirect rejection, `no-store`, bounded timeout and streamed response cap;
- deterministic idempotency keys for request/cancel with bounded transient retries;
- minimal external payload: operational component IDs, supplier name/reference and deadline only;
- customer totals, payment/refund ledger, supplier cost, inventory instructions and protected traveller data excluded from the generic payload;
- normalized external response persisted to `travel_supplier_fulfilment_adapter_audit` before local application;
- response then re-enters the existing `saveSupplierFulfilment()` transition boundary;
- invalid external transitions are recorded as conflicts and never forced;
- existing local supplier cost/currency are explicitly preserved;
- supplier references returned externally remain internal until the separate exact-reference customer-voucher approval succeeds;
- Operator controls remain protected by the existing `suppliers` capability;
- manual supplier tracking stays fully available when the external adapter is disabled;
- EN/ES documentation, environment template and permanent `check:supplier-fulfilment-adapter` CI gate.

### 8C-3 — CRM synchronization adapter — NEXT

Goal: synchronize selected customer/reservation lifecycle information with CRM systems without making a CRM authoritative for booking, inventory, pricing or payment accounting.

Planned scope:

- provider-neutral CRM synchronization interface;
- normalized contact/reservation lifecycle contract;
- explicit create/update semantics with stable external references;
- idempotent outbound mutations and stable provider error translation;
- strict field allowlists and data minimization;
- no protected post-purchase traveller data in the generic CRM contract;
- audited synchronization outcomes and operational retry visibility;
- provider-specific CRM authentication/payload mapping contained inside adapters;
- booking, supplier fulfilment, payment ledger and inventory remain authoritative in their existing boundaries.

### Later 8C candidates

- ERP/accounting;
- CMS/catalogue sources;
- enterprise identity where appropriate;
- additional payment providers when commercially useful.

Vendor-specific payloads must remain inside adapters and consume stable provider-neutral boundaries rather than leaking into core domains.

---

# Phase 9 — Production hardening

### Testing
- browser E2E registration → booking → accommodation/extras → service → payment → Operator;
- MongoDB integration tests;
- payment webhook/idempotency tests;
- traveller/minor pricing tests;
- trip/service/room inventory concurrency tests;
- amendment/reallocation E2E;
- accessibility/performance and adapter contract tests.

### Security/privacy
- CSRF, rate limiting, CSP/security headers and cookie/session review;
- dependency/secret scanning;
- privileged-action audit review;
- key recovery/rotation and backup/restore procedures;
- GDPR/privacy/booking/cookie/retention/export/deletion workflows;
- regulatory review per market.

### Observability/operations
- structured logs and centralized errors;
- uptime/health monitoring;
- webhook/payment/integration failure visibility;
- disaster recovery and rollback;
- database index/performance review.

---

# Phase 10 — Open-source productisation

- production environment docs;
- clean demo seed/setup;
- fresh-clone install/deployment guide;
- reference adapters and extension contracts;
- versioned releases/migrations;
- contribution templates;
- public API/extension docs;
- optional Docker/self-host example;
- trademark/branding policy;
- proprietary Kairoseth/customer adapters outside the MIT core when appropriate.

---

# Suggested delivery order

```text
8C-3  CRM synchronization adapter
  ↓
8C    Remaining business adapters as commercially useful
  ↓
9     Production hardening
  ↓
10    Open-source productisation / release
```

Credentialed Stripe/Redsys TEST/LIVE validation should be inserted as soon as suitable provider accounts are available and does not need to block Phase 8.

Phase 9 testing/security work should continue incrementally rather than waiting until the end.

---

# Core non-goals

Open Travel Platform must not become permanently tied to one payment gateway, CMS, CRM/ERP, booking supplier, authentication vendor, hosting platform or Kairoseth-only infrastructure.

The public core remains MIT licensed and reusable. Kairoseth Travel can build commercial hosting, support, premium/private adapters and customer-specific integrations around that core.
