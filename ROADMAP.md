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

Completed foundations include persistent customer/staff identity, RBAC, trip/service reservations, traveller pricing, independent services, transactional email, payment accounting, encrypted PSP configuration, provider-neutral checkout adapters, deposits/installments, encrypted post-purchase traveller data, reservation amendments, reusable accommodation, transactional room inventory, package supplements, rich operations, granular staff permissions, booking/departure documents, customer-safe vouchers, an internal reservation dossier, CSV/XLSX operational exports, finance reconciliation/reporting, audited protected-traveller exports, provider-neutral outbound integration events, durable scheduled integration operations with replay/health/retention and the first concrete business adapter: a versioned generic REST `BookingRepository` implementation.

Stripe/Redsys credentialed end-to-end validation remains pending until suitable provider accounts are available. The adapters are implemented, but production payment capability is not considered validated until TEST/LIVE provider flows are exercised.

**Phases 6B, 6C, 7A, 7B, 8A and 8B are complete. Phase 8C — Business adapters is IN PROGRESS. Phase 8C-1 — Generic REST booking adapter is COMPLETE; Phase 8C-2 — Supplier fulfilment adapter boundary is NEXT.**

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

## Reservation operations and email foundation — COMPLETE

- persistent trip reservations;
- server-authoritative pricing/ownership/inventory;
- confirm/cancel workflows and transactional inventory release;
- customer/Operator reservation views;
- operational audit trail;
- transactional reservation email.

## Phase 5A — Provider-neutral payments — COMPLETE

- payment/refund ledger separated from reservation state;
- manual bank transfer / cash / external terminal;
- controlled refunds and reconciliation protections;
- Operator finance visibility;
- provider/idempotency metadata.

## Phase 5B — Traveller and age pricing — COMPLETE

- lead/individual travellers;
- date of birth / nationality;
- configurable age bands and per-departure pricing;
- guardian rules for minors;
- configurable seat consumption;
- historical traveller/pricing snapshots.

## Phase 5C — Independent service catalogue — COMPLETE

- Activities, Transport and Travel protection;
- public catalogue/detail pages;
- protected Operator CRUD;
- multilingual content;
- pricing per person / booking / unit / age.

## Phase 5D — Service availability and inventory — COMPLETE

- activity/transport calendars and slots;
- capacity/reserved-space and unit inventory;
- safe slot closing;
- service inventory separated from trip inventory.

## Phase 5E — Independent service reservations — COMPLETE

- activity, transport and protection reservations;
- optional relation to a Kairoseth trip;
- transactional service inventory;
- customer My services and Operator queue;
- common payment ledger.

## Phase 5F — Payment providers and unified checkout — IMPLEMENTED

- Admin-only TEST/LIVE provider configuration;
- Stripe/Redsys adapters and encrypted secrets;
- unified trip/service checkout;
- signed Stripe webhooks + idempotency;
- signed Redsys notifications;
- browser returns non-authoritative;
- credentialed TEST/LIVE E2E pending provider accounts.

## Phase 5G — Deposits, installments and payment terms — COMPLETE

- full-payment/deposit policies;
- configurable deposits/installments;
- payment-term snapshots and due dates;
- outstanding-balance / next-payment calculation;
- customer schedule and Operator management.

## Phase 6A — Secure post-purchase traveller data — COMPLETE

- requirement presets and reservation snapshots;
- advanced identity/document/residence fields only when required;
- customer deadlines;
- AES-256-GCM encryption and separate sensitive-data storage;
- TTL retention/deletion;
- field-name-only audit history;
- Operator completion visibility;
- passport/DNI scan and health data excluded from the standard flow.

## Phase 6A.1 — Traveller-data UX/documentation — COMPLETE

- Not required / Pending / Complete states;
- customer task visibility;
- aggregate/per-traveller Operator completion;
- snapshot semantics and EN/ES guidance.

## Phase 6B — Reservation amendments — COMPLETE

- explicit amendment history with actor/reason/before/after/timestamp;
- controlled traveller corrections;
- atomic departure changes;
- traveller pricing/accommodation reallocation on new date;
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
- owner assignment, internal notes, priority, tags and operational timeline;
- audited changes and customer privacy invariant.

### 7A-2 — Tasks and follow-ups — COMPLETE
- task targets, assignee, due date, status, comments and dashboard views;
- audited changes.

### 7A-3 — Supplier/fulfilment tracking — COMPLETE
- fulfilment per trip/service/accommodation component;
- supplier status/reference/cost/deadline;
- notes, audit, global queue and attention metrics;
- supplier data does not rewrite customer totals or ledger.

### 7A-4 — Search, filters and operational queues — COMPLETE
- free-text search, reservation/payment/owner/priority/tag/departure filters;
- balance/installment filters;
- Mine / Needs attention / Unassigned views;
- sorting and server-rendered pagination.

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

Goal achieved: provide travel-team operational documents, safe exports and commercial/finance reporting without leaking protected or internal-only data.

## 7B-1 — Booking confirmation PDFs — COMPLETE

- reusable `pdf-lib` document layer;
- customer and Operator confirmations;
- EN/ES rendering;
- trip dates, travellers, accommodation, package supplements and contact summary;
- finance details only when permitted;
- private `no-store` endpoints and permanent PDF invariant.

## 7B-2 — Traveller lists and rooming lists — COMPLETE

- departure traveller manifests;
- rooming lists from snapshotted room allocations;
- protected Operator PDF routes;
- EN/ES printable output;
- protected post-purchase fields, supplier data and internal notes excluded;
- permanent `check:departure-documents` gate.

## 7B-3 — Vouchers and printable reservation dossier — COMPLETE

- customer-safe accommodation vouchers for confirmed trip reservations with accommodation;
- customer-safe service vouchers for confirmed activities, transport and travel protection;
- authorized Operator download of the same customer-safe vouchers;
- consolidated printable Operator reservation dossier;
- dossier payment/supplier sections loaded only when staff capabilities allow them;
- explicit document version/status and UTC generated-at timestamp;
- supplier references internal by default and exact-reference disclosure explicitly approved/audited;
- changing a supplier reference invalidates the previous disclosure approval;
- supplier costs, internal notes and protected post-purchase traveller values excluded from customer vouchers;
- private `no-store` + `nosniff` responses;
- permanent `check:voucher-documents` invariant.

## 7B-4 — CSV/XLSX exports and reconciliation/reporting — COMPLETE

- protected `/operator/reports` workspace with capability-aware sections;
- trip-reservation, service-reservation and customer exports in CSV/XLSX;
- stable shared tabular column contracts for both formats;
- server-side creation-date filters with normalized reversed ranges;
- bounded browser exports: 10,000 ordinary rows and 500 protected travellers per selected reservation;
- Finance-only payment reconciliation, active outstanding-balance/overdue-installment and revenue-by-product/service reports;
- currency included in financial grouping keys and dashboard totals kept separate by currency;
- existing Payments dashboard corrected so currencies are never cross-summed;
- CSV/spreadsheet formula-injection mitigation for user-controlled text;
- minimal OOXML XLSX writer with frozen header row and autofilter;
- private `no-store` + `nosniff` download responses and safe filenames;
- persistent export audit records actor/type/format/filters/columns/row-count/timestamp without storing exported cell values;
- protected post-purchase traveller export isolated from ordinary exports;
- sensitive export requires Traveller data + Reservations capabilities, an active reservation and a 10–500 character operational reason;
- sensitive endpoint is POST-only so purpose/target do not enter browser URL history;
- sensitive export is fail-closed: persistent audit must succeed before decrypted CSV/XLSX bytes are returned;
- protected records respect the existing encrypted store and retention window;
- permanent `check:reporting-exports` invariant wired into `npm run verify` and GitHub CI;
- EN/ES reporting/export security documentation.

---

# Phase 8 — External integrations — IN PROGRESS

Goal: connect deployments to real business ecosystems through adapters while keeping provider payloads out of the core domains.

## 8A — Provider-neutral outbound integrations — COMPLETE

- versioned event envelope for trip/service reservation creation and status changes;
- MongoDB transactional outbox written inside the same reservation transaction/session;
- one idempotent durable delivery record per `(eventId, endpointId)`;
- Admin-only `/operator/integrations` configuration;
- endpoint subscriptions and enable/disable state;
- dedicated `INTEGRATION_SECRETS_KEY` with AES-256-GCM encrypted signing secrets;
- HMAC-SHA256 signed HTTPS webhook reference adapter;
- HTTPS-only target validation, URL credential/fragment rejection and localhost/private/reserved network blocking;
- all DNS answers inspected and DNS revalidated on every delivery;
- validated-IP pinning while preserving original TLS SNI and HTTP Host;
- redirects not followed, timeout bounded and response body limited;
- delivery leasing, crash recovery, bounded retry/backoff and `dead-letter` retention;
- durable per-attempt history;
- protected post-purchase traveller data excluded from the generic event contract;
- manual bounded Admin processor as the first execution surface;
- EN/ES integration documentation;
- permanent `check:outbound-integrations` gate wired into `npm run verify` and GitHub CI.

## 8B — Scheduled delivery, replay and observability — COMPLETE

- server-only `POST /api/internal/integrations/process` scheduler/worker entry point with no browser-session dependency;
- dedicated `KTRAVEL_INTEGRATION_WORKER_TOKEN` Bearer authentication with timing-safe comparison and minimum secret length;
- durable global worker lease shared by scheduler and manual Admin execution;
- server-side bounded batch size and minimum execution interval with `Retry-After` on contention/rate limiting;
- safe Admin-only dead-letter replay that atomically requeues the delivery and writes replay audit history;
- prior durable attempt history preserved across replay while each replay starts a fresh bounded retry cycle;
- Admin event detail and delivery detail views with attempt/replay history;
- queue health metrics for pending/retrying/dead-letter, oldest due delivery and 24-hour attempt success/failure rates;
- completed-success retention policy with bounded cleanup batches and aggregate retention audit metadata;
- dead-letter, active work and manual replay audit excluded from automatic completed-history cleanup;
- scheduler responses are private `no-store` + `nosniff` and diagnostics never expose worker/signing secrets or protected traveller values;
- deployment settings for worker token, batch size, minimum interval and completed-history retention;
- EN/ES integration-operations documentation;
- permanent `check:integration-operations` gate wired into `npm run verify` and GitHub CI.

## 8C — Business adapters — IN PROGRESS

The common integration and capability boundaries are now mature enough for concrete business adapters without vendor payloads leaking into the core.

### 8C-1 — Generic REST booking adapter — COMPLETE

- `BOOKING_MODE=rest` composes an external booking API behind the existing `BookingRepository` interface;
- stable versioned `/v1` contract using `X-OTP-Contract-Version: 1`;
- server-only Bearer authentication with no browser-visible secret;
- production HTTPS enforcement;
- redirect rejection, `no-store`, bounded timeout and bounded streamed response size;
- runtime validation before external JSON becomes domain data;
- customer ownership and requested trip/departure scope revalidated after mapping;
- create/cancel mutations use stable per-invocation idempotency keys and bounded transient retries;
- stable application-level error translation instead of leaking provider/network internals;
- payment ledger, staff operations, catalogue, traveller data and outbound integrations remain separately composable capabilities;
- EN/ES contract/deployment documentation;
- permanent `check:rest-booking-adapter` invariant wired into `npm run verify` and GitHub CI.

### 8C-2 — Supplier fulfilment adapter boundary — NEXT

- provider-neutral supplier fulfilment adapter interface;
- request / confirm / reject / cancel contract;
- normalized external supplier references and statuses;
- idempotent outbound mutations and stable provider error translation;
- auditable synchronization into the existing fulfilment workflow;
- provider-specific authentication and payload mapping kept inside adapters;
- external supplier responses must not automatically rewrite customer totals or payment ledger movements.

### Later 8C candidates

- CRM synchronization;
- ERP/accounting;
- CMS/catalogue sources;
- enterprise identity where appropriate;
- additional payment providers when commercially useful.

Vendor-specific payloads must remain inside adapters and consume stable provider-neutral boundaries rather than leaking into reservation domains.

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
- webhook/payment failure visibility;
- disaster recovery and rollback;
- database index/performance review.

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
8C-2  Supplier fulfilment adapter boundary
  ↓
8C    Remaining business adapters as commercially useful
  ↓
9     Production hardening
  ↓
10    Open-source productisation / release
```

Credentialed Stripe/Redsys TEST validation should be inserted as soon as provider accounts are available and does not need to block Phase 8.

Phase 9 testing/security work should continue incrementally rather than waiting until the end.

---

# Core non-goals

Open Travel Platform must not become permanently tied to one payment gateway, CMS, CRM/ERP, booking supplier, authentication vendor, hosting platform or Kairoseth-only infrastructure.

The public core remains MIT licensed and reusable. Kairoseth Travel can build commercial hosting, support, premium/private adapters and customer-specific integrations around that core.