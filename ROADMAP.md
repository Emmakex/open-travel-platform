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

Completed foundations include persistent customer/staff identity, RBAC, trip/service reservations, traveller pricing, independent services, transactional email, payment accounting, encrypted PSP configuration, provider-neutral checkout adapters, deposits/installments, encrypted post-purchase traveller data, reservation amendments, reusable accommodation, transactional room inventory, optional package supplements, reservation ownership/notes, tasks/follow-ups, supplier fulfilment, advanced operational queues, post-booking package-supplement amendments, granular staff permissions, booking-confirmation PDFs, traveller manifests and rooming-list PDFs.

Stripe/Redsys credentialed end-to-end validation remains intentionally pending until suitable provider accounts are available. The adapters are implemented, but production payment capability is not considered validated until TEST/LIVE provider flows are exercised.

**Phases 6B, 6C and 7A are functionally complete. Phase 7B — Documents, exports and reporting is IN PROGRESS: 7B-1 booking confirmation PDFs and 7B-2 traveller/rooming lists are complete. 7B-3 vouchers and printable reservation dossier is NEXT.**

---

# Completed milestones

## Foundation and catalogue — COMPLETE

- Next.js / React / TypeScript application foundation;
- MongoDB capability adapters;
- CI quality gates and release checks;
- bilingual EN/ES public and Operator experience;
- destinations and trips;
- GridFS media library, covers, galleries and focal points;
- structured multilingual itineraries;
- departures, capacity and live inventory;
- public reference deployment at `travel.kairoseth.com`.

## Identity, RBAC and account security — COMPLETE

- persistent customer registration/sign-in;
- persistent staff Operator/Admin authentication;
- separate customer/staff sessions;
- server-side RBAC and account lockout;
- password change/recovery with SMTP delivery;
- authentication audit events.

## Reservation operations and email foundation — COMPLETE

- persistent trip reservations;
- server-authoritative pricing/ownership/inventory;
- confirm/cancel workflows;
- transactional inventory release;
- customer and Operator reservation views;
- operational audit trail;
- transactional reservation email.

## Phase 5A — Provider-neutral payments — COMPLETE

- provider-neutral payment/refund ledger;
- payment state independent from reservation state;
- manual bank transfer / cash / external terminal;
- controlled refunds and reconciliation protections;
- Operator finance visibility;
- provider/idempotency metadata.

## Phase 5B — Traveller and age pricing — COMPLETE

- lead and individual travellers;
- date of birth / nationality;
- configurable age bands and per-departure pricing;
- guardian requirement for minors;
- configurable seat consumption by age band;
- historical traveller/pricing snapshots.

## Phase 5C — Independent service catalogue — COMPLETE

- Activities, Transport and Travel protection;
- public catalogue/detail pages;
- protected Operator CRUD;
- multilingual content;
- pricing per person / booking / unit / age.

## Phase 5D — Service availability and inventory — COMPLETE

- activity/transport availability calendars;
- date/time slots;
- capacity/reserved-space and unit inventory;
- safe slot closing;
- service inventory separated from trip inventory.

## Phase 5E — Independent service reservations — COMPLETE

- activity, transport and protection reservations;
- optional relation to a Kairoseth trip;
- independent mode for externally booked trips;
- transactional service inventory;
- customer My services and Operator service queue;
- service payments in the common ledger.

## Phase 5F — Payment providers and unified checkout — IMPLEMENTED

- Admin-only TEST/LIVE provider configuration;
- Stripe and Redsys adapters;
- encrypted provider secrets;
- unified checkout for trip/service reservations;
- signed Stripe webhooks + idempotency;
- signed Redsys server notifications;
- browser returns are non-authoritative;
- credentialed TEST/LIVE E2E remains pending provider accounts.

## Phase 5G — Deposits, installments and payment terms — COMPLETE

- full-payment/deposit policies;
- configurable deposits and installments;
- payment-term snapshots and due dates;
- outstanding-balance / next-payment calculation;
- customer payment schedule and Operator management.

## Phase 6A — Secure post-purchase traveller data — COMPLETE

- requirement presets and reservation snapshots;
- advanced identity/document/residence fields only when required;
- customer editing deadlines;
- AES-256-GCM encryption and separate sensitive-data storage;
- TTL retention/deletion;
- field-name-only audit history;
- Operator completion visibility;
- passport/DNI scans and health data excluded from the standard flow.

## Phase 6A.1 — Traveller-data UX/documentation — COMPLETE

- clear Not required / Pending / Complete states;
- customer task visibility;
- aggregate/per-traveller Operator completion;
- explicit snapshot semantics;
- EN/ES documentation and test guidance.

## Phase 6B — Reservation amendments — COMPLETE

- explicit amendment history with actor, reason, before/after and timestamp;
- controlled traveller corrections;
- atomic departure changes that reserve new capacity before releasing old capacity;
- traveller pricing and accommodation reallocation recalculated for the new date;
- financial delta without rewriting historical ledger movements;
- controlled refund-review state instead of automatic refund;
- linked-service visibility/cancellation;
- snapshotted modification/cancellation deadlines and configured customer notifications.

## Phase 6C — Accommodation, supplements and package composition — COMPLETE

- reusable accommodation domain and room types;
- room inventory and occupancy limits;
- public/Operator accommodation catalogue;
- property and room galleries;
- trip ↔ accommodation links and package reference rates;
- seasonal and occupancy pricing;
- automatic traveller-to-room allocation;
- transactional trip + room inventory;
- included vs optional accommodation accounting;
- accommodation reallocation on departure amendments;
- optional non-inventory package supplements;
- server-authoritative supplement pricing/snapshots.

---

# Operations maturity

## Phase 7A — Rich operations workflow — COMPLETE

Goal achieved: make Operator suitable for day-to-day travel operations rather than only catalogue and reservation-state management.

### 7A-1 — Reservation ownership, notes and priorities — COMPLETE

- owner/operator assignment;
- internal notes never exposed to customers;
- low / normal / high / urgent priority;
- normalized tags and operational timeline;
- audited changes and permanent privacy invariant.

### 7A-2 — Tasks and follow-ups — COMPLETE

- tasks attached to trip reservation / service reservation / customer;
- assignee, due date and status;
- overdue/today/upcoming views;
- global dashboard and My tasks;
- append-only comments and audited task changes.

### 7A-3 — Supplier/fulfilment tracking — COMPLETE

- fulfilment per trip/service/accommodation component;
- not requested / requested / confirmed / rejected / cancelled states;
- supplier reference/localizer;
- optional internal supplier cost + currency;
- confirmation deadline and overdue visibility;
- append-only notes/audit events;
- global supplier queue and attention metrics;
- supplier data does not rewrite customer totals or payment ledger.

### 7A-4 — Search, filters and operational queues — COMPLETE

- free-text search across reservation/customer/trip/traveller/owner/tag data;
- reservation/payment/owner/priority/tag/departure filters;
- outstanding-balance and overdue-installment filters;
- Mine / Needs attention / Unassigned quick views;
- sorting and server-rendered pagination;
- permanent CI invariant.

### 7A-5 — Package amendment workflow — COMPLETE

- add/remove package supplements after booking;
- change per-traveller assignments;
- preserve contracted prices for existing supplements;
- use current catalogue price only for newly added supplements;
- exact before/after supplement snapshots;
- financial delta handled by the existing 6B settlement model;
- customer notification without exposing internal reason.

### 7A-6 — Granular staff permissions — COMPLETE

- Admin full-access superuser;
- explicit narrower Operator capability matrix;
- legacy Operators preserve the role profile until explicitly restricted;
- capabilities separate reservations, catalogue, finance, protected traveller data, supplier fulfilment and tasks;
- route/action/data-loading authorization uses the same server-side boundaries;
- permission changes stored and audited transactionally;
- permanent `check:staff-permissions` CI invariant.

---

# Phase 7B — Documents, exports and reporting — IN PROGRESS

Goal: support operational documents and reports commonly required by travel teams without leaking protected or internal-only data.

## 7B-1 — Booking confirmation PDFs — COMPLETE

- reusable server-side PDF layer using `pdf-lib`;
- customer-owned booking confirmation download;
- protected Operator Documents workspace;
- EN/ES confirmation with trip dates, traveller names, accommodation and package supplements;
- contact summary and current reservation total;
- payment details for the customer and only for staff with Finance permission;
- no internal notes, supplier references/costs or protected traveller data in the renderer;
- private `no-store` endpoints;
- safe filenames and real-PDF CI invariant.

## 7B-2 — Traveller lists and rooming lists — COMPLETE

- operational traveller manifest grouped by departure/reservation;
- rooming list derived from snapshotted accommodation allocation;
- protected PDF routes from the Operator Documents workspace;
- EN/ES printable output;
- access controlled by server-side staff capabilities;
- only ordinary booking/traveller snapshot data is included;
- protected post-purchase document fields, supplier data and internal notes are excluded;
- private `no-store` responses and safe filenames;
- permanent `check:departure-documents` CI invariant.

## 7B-3 — Vouchers and printable reservation dossier — NEXT

- accommodation vouchers;
- independent-service vouchers;
- customer-facing supplier-safe references only where explicitly configured for disclosure;
- consolidated printable Operator reservation dossier;
- explicit generated-at timestamp and document version/status;
- privacy/authorization boundaries and permanent PDF invariants.

## 7B-4 — CSV/XLSX exports and reconciliation reports

- reservation/service exports;
- customer exports;
- payment/reconciliation and outstanding-balance reports;
- secure audited traveller-data export for legitimate operational use;
- revenue by product/service;
- operational/commercial dashboards.

---

# Phase 8 — External integrations

Goal: connect deployments to real business ecosystems through adapters while keeping provider payloads out of the core domain.

Candidate adapters:

- supplier/booking APIs;
- CRM synchronization;
- ERP/accounting;
- generic outbound webhooks;
- CMS/catalogue source;
- enterprise identity example;
- generic REST booking adapter;
- payment providers beyond Stripe/Redsys.

# Phase 9 — Production hardening

Testing:

- browser E2E registration → booking → accommodation/extras → service → payment → Operator;
- MongoDB integration tests;
- payment webhook/idempotency tests;
- traveller/minor pricing tests;
- trip/service/room inventory concurrency tests;
- amendment/reallocation E2E;
- accessibility regression checks and performance budgets;
- adapter contract tests.

Security and privacy:

- CSRF review, rate limiting and CSP/security headers;
- cookie/session review;
- dependency/secret scanning;
- privileged-action audit review;
- payment/traveller-data key recovery and rotation procedures;
- backup/restore testing;
- privacy policy, GDPR notices, booking terms, cookie policy, retention/deletion and customer export/deletion workflow;
- insurance-distribution and regulatory review per market where applicable.

Observability and operations:

- structured logs and centralized error reporting;
- uptime/health monitoring;
- webhook/payment failure visibility;
- backup/disaster-recovery and rollback procedures;
- database index/performance review.

# Phase 10 — Open-source productisation

- production-ready environment documentation;
- clean demo seed/setup flow;
- fresh-clone install/deployment guide;
- reference adapters and extension/plugin contracts;
- versioned releases and migration notes;
- issue/contribution templates;
- public API/extension documentation;
- optional Docker/self-host example;
- trademark/branding policy;
- proprietary Kairoseth/customer adapters remain outside the MIT core when appropriate.

---

# Suggested delivery order

```text
7B  Documents / exports / reporting
 ↓
8   External integrations
 ↓
9   Production hardening
 ↓
10  Open-source productisation / release
```

Credentialed Stripe/Redsys TEST validation should be inserted as soon as provider accounts are available and does not need to block 7B.

Phase 9 testing/security work should continue incrementally rather than waiting until the end, especially for payments, traveller data, amendments and concurrent inventory.

---

# Core non-goals

Open Travel Platform should **not** become permanently tied to one payment gateway, CMS, CRM/ERP, booking supplier, authentication vendor, hosting platform or Kairoseth-only infrastructure.

The public core remains MIT licensed and reusable. Kairoseth Travel can build commercial hosting, support, implementation, premium/private adapters and customer-specific integrations around that core.
