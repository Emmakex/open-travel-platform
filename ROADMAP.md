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

Completed foundations include persistent customer/staff identity, RBAC, trip/service reservations, traveller pricing, independent services, transactional email, payment accounting, encrypted PSP configuration, provider-neutral checkout adapters, deposits/installments, encrypted post-purchase traveller data, reservation amendments, reusable accommodation, transactional room inventory, package supplements, rich operations, granular staff permissions, booking-confirmation PDFs, traveller manifests, rooming-list PDFs, customer-safe accommodation/service vouchers and an internal reservation dossier.

Stripe/Redsys credentialed end-to-end validation remains pending until suitable provider accounts are available. The adapters are implemented, but production payment capability is not considered validated until TEST/LIVE provider flows are exercised.

**Phases 6B, 6C and 7A are complete. Phase 7B — Documents, exports and reporting is IN PROGRESS: 7B-1, 7B-2 and 7B-3 are complete. Phase 7B-4 — CSV/XLSX exports and reconciliation/reporting is NEXT.**

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

# Phase 7B — Documents, exports and reporting — IN PROGRESS

Goal: provide travel-team operational documents and reporting without leaking protected or internal-only data.

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
- dossier sections for payment and supplier fulfilment loaded only when the current staff capabilities allow them;
- explicit document version/status and UTC generated-at timestamp;
- supplier references internal by default;
- exact supplier reference must be explicitly approved by staff with Suppliers capability before customer disclosure;
- disclosure policy stored separately from fulfilment and audited;
- changing a supplier reference automatically invalidates the old approval because the approved value must exactly match the current value;
- supplier costs, internal free-text notes and protected post-purchase traveller values excluded from customer vouchers;
- customer ownership and confirmed-booking guards on customer routes;
- private `no-store` + `nosniff` PDF responses;
- permanent `check:voucher-documents` invariant wired into `npm run verify` and GitHub CI.

## 7B-4 — CSV/XLSX exports and reconciliation reports — NEXT

Goal: make operational and commercial data exportable without weakening permission/privacy boundaries.

Planned scope:

- reservation export;
- independent-service reservation export;
- customer export;
- CSV and XLSX formats with stable column contracts;
- payment reconciliation report;
- outstanding-balance and overdue-installment report;
- revenue by trip/product/service;
- server-side filters/date ranges for large exports;
- Finance capability required for financial columns/reports;
- secure audited traveller-data export only for legitimate operational use and only with Traveller data capability;
- no protected traveller fields in ordinary customer/reservation exports;
- export audit event including actor, export type, filters and timestamp without persisting exported sensitive values;
- operational/commercial reporting foundations and summary dashboards;
- permanent export privacy/authorization CI invariants.

---

# Phase 8 — External integrations

Candidate adapters:

- supplier/booking APIs;
- CRM synchronization;
- ERP/accounting;
- generic outbound webhooks;
- CMS/catalogue source;
- enterprise identity;
- generic REST booking adapter;
- payment providers beyond Stripe/Redsys.

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
7B-4  CSV/XLSX exports / reconciliation / reporting
  ↓
8     External integrations
  ↓
9     Production hardening
  ↓
10    Open-source productisation / release
```

Credentialed Stripe/Redsys TEST validation should be inserted as soon as provider accounts are available and does not block 7B-4.

Phase 9 testing/security work should continue incrementally rather than waiting until the end.

---

# Core non-goals

Open Travel Platform must not become permanently tied to one payment gateway, CMS, CRM/ERP, booking supplier, authentication vendor, hosting platform or Kairoseth-only infrastructure.

The public core remains MIT licensed and reusable. Kairoseth Travel can build commercial hosting, support, premium/private adapters and customer-specific integrations around that core.
