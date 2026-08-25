# Roadmap

<p align="center"><strong>English</strong> · <a href="./ROADMAP.es.md">Español</a></p>

Open Travel Platform is the reusable MIT-licensed open-source core. **Kairoseth Travel** is the official commercial/reference implementation deployed at **https://travel.kairoseth.com**.

The roadmap keeps two goals aligned:

1. keep the public core portable, provider-neutral and useful to other agencies/developers;
2. continue hardening Kairoseth Travel into a complete production travel platform without coupling the core to one PSP, supplier, CRM, ERP, CMS or hosting provider.

_Last updated: 25 August 2026._

---

# Current position

The project is well beyond the original catalogue/booking MVP.

Completed foundations now include persistent customer/staff identity, RBAC, trip/service reservations, traveller pricing, independent services, transactional email, payment accounting, encrypted PSP configuration, provider-neutral checkout adapters, deposits/installments, encrypted post-purchase traveller data, reservation amendments, reusable accommodation, transactional room inventory, optional package supplements, reservation ownership/notes, internal tasks/follow-ups, supplier fulfilment tracking, advanced operational queues, post-booking package-supplement amendments, granular staff permissions and customer-facing booking confirmation PDFs.

Stripe/Redsys credentialed end-to-end validation remains intentionally pending until suitable provider accounts are available. The adapters are implemented, but production payment capability is not considered validated until TEST/LIVE provider flows are exercised.

**Phases 6B, 6C and 7A are functionally complete. Phase 7B — Documents, exports and reporting is IN PROGRESS: 7B-1 booking confirmation PDFs are complete and 7B-2 traveller/rooming lists is next.**

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
- persistent staff operator/admin authentication;
- separate customer/staff sessions;
- server-side RBAC;
- account lockout;
- password change/recovery;
- SMTP recovery delivery;
- authentication audit events.

## Reservation operations and email foundation — COMPLETE

- persistent trip reservations;
- server-authoritative ownership/pricing/inventory;
- confirm/cancel workflows;
- transactional inventory release;
- Operator reservation queue;
- customer reservation history;
- operational audit trail;
- reservation transactional emails.

## Phase 5A — Provider-neutral payments — COMPLETE

- provider-neutral payment/refund ledger;
- payment state independent from reservation state;
- unpaid / pending / partially paid / paid / partially refunded / refunded summaries;
- manual bank transfer / cash / external terminal;
- controlled refunds and reconciliation protections;
- Operator finance visibility;
- provider/idempotency metadata.

## Phase 5B — Traveller and age pricing — COMPLETE

- lead and individual travellers;
- date of birth / nationality;
- configurable age bands;
- per-traveller and per-departure pricing;
- guardian requirement for minors;
- configurable seat consumption by age band;
- historical pricing snapshots.

## Phase 5C — Independent service catalogue — COMPLETE

- Activities, Transport and Travel protection;
- public catalogue/detail pages;
- protected Operator CRUD;
- multilingual content;
- pricing per person / booking / unit / age.

## Phase 5D — Service availability and inventory — COMPLETE

- activity/transport availability calendars;
- date/time slots;
- capacity/reserved-space tracking;
- transport unit inventory;
- safe slot closing;
- service inventory separated from trip inventory.

## Phase 5E — Independent service reservations — COMPLETE

- activity, transport and protection reservations;
- optional link to a Kairoseth trip;
- independent mode for externally booked trips;
- transactional service inventory;
- My services area;
- Operator service queue;
- service payments in the common ledger.

## Phase 5F — Payment providers and unified checkout — IMPLEMENTED

- admin-only TEST/LIVE provider configuration;
- Stripe and Redsys adapters;
- encrypted provider secrets;
- unified checkout for trip/service reservations;
- Stripe signed webhooks and idempotency;
- Redsys signed server notifications;
- browser returns are non-authoritative;
- credentialed TEST E2E pending provider accounts.

## Phase 5G — Deposits, installments and payment terms — COMPLETE

- full-payment/deposit policies;
- configurable deposits;
- optional installments and due dates;
- payment-term snapshots;
- outstanding-balance / next-payment calculation;
- customer payment schedule;
- Operator management;
- compatibility with manual and online movements.

## Phase 6A — Secure post-purchase traveller data — COMPLETE

- requirement presets per product;
- requirement snapshot per reservation;
- advanced identity/document/residence fields only when required;
- customer editing deadlines;
- AES-256-GCM encryption;
- separate sensitive-data storage;
- TTL retention/deletion;
- field-name-only audit history;
- Operator completion visibility;
- no passport/DNI scan upload in the standard flow;
- health/medical data excluded from the standard flow.

## Phase 6A.1 — Traveller-data UX/documentation — COMPLETE

- clear Not required / Pending / Complete states;
- customer task visibility;
- Operator aggregate/per-traveller completion;
- explicit snapshot semantics;
- EN/ES documentation and test guidance.

## Phase 6B — Reservation amendments — COMPLETE

Goal achieved: support normal post-booking changes without destroying the original reservation/payment history.

### 6B-1 — Amendment model and traveller corrections

- separate `travel_reservation_amendments` history;
- before/after field changes;
- actor, reason and timestamp;
- controlled Operator traveller corrections;
- original financial history preserved.

### 6B-2 — Departure change and atomic inventory

- alternative departure selection from Operator;
- traveller age/pricing recalculated for the new date;
- new capacity reserved before old capacity is released;
- MongoDB transaction/rollback protection;
- no silent overselling;
- amendment records include inventory movement and price change.

### 6B-3 — Financial delta

- updated reservation total after amendments;
- additional outstanding balance when price increases;
- controlled refund-review amount when price decreases below net paid;
- no automatic refund;
- historical ledger transactions never rewritten;
- server-side refund guardrails.

### 6B-4 — Linked services, notifications and deadlines

- services remain independent reservations linked to the trip;
- linked services visible from trip reservations;
- controlled service cancellation and inventory release;
- change/cancellation policies snapshotted into reservations;
- customer/staff deadlines enforced server-side;
- configured amendment notifications;
- internal reasons never leaked to customer emails.

## Phase 6C — Accommodation, supplements and package composition — COMPLETE

Goal achieved: evolve from trips + independent services into reusable package composition with transactional accommodation.

### 6C-1 — Accommodation foundation

- reusable accommodation domain;
- room types and occupancy limits;
- room inventory periods;
- accommodation public catalogue;
- Operator accommodation management;
- inventory invariants preventing unsafe manual reserved-space edits;
- cover upload through the shared media library.

### 6C-2 — Trip links and room commercial rates

- accommodation can be reused across multiple trips;
- a trip can contain multiple stays;
- trip component references accommodation + room type + check-in day + nights;
- room classification and meal plan;
- base nightly rates;
- package reference preview by departure.

### 6C-3 — Galleries, seasonal pricing and occupancy pricing

- general property gallery;
- gallery per room type;
- fixed/percentage seasonal adjustments;
- single supplements;
- occupancy adjustments;
- child-sharing rules;
- package pricing by real departure date;
- permanent CI pricing invariants.

### 6C-4 — Transactional accommodation booking

- automatic traveller-to-room allocation;
- minimum valid room count;
- occupancy validation using real traveller ages;
- server-authoritative room pricing;
- included accommodation snapshotted without double charge;
- optional accommodation added to reservation total;
- trip and room inventory reserved/released in the same MongoDB transaction;
- accommodation snapshots visible to customer and Operator;
- departure amendments reprice/reallocate accommodation safely.

### Package supplements — COMPLETE

- non-inventory trip extras configured by Operator;
- bilingual EN/ES content;
- once-per-booking or per-selected-traveller pricing;
- server-authoritative selection and total;
- reservation snapshot of price/quantity/traveller assignment;
- catalogue changes do not rewrite historical bookings;
- permanent package-supplement invariant CI gate.

Capacity/date-based activities and transport remain independent service reservations rather than lightweight package supplements.

---

# Next priorities

## Phase 7A — Rich operations workflow — COMPLETE

Goal achieved: make Operator suitable for the day-to-day work of a real travel agency/team, not only catalogue and reservation-state management.

### 7A-1 — Reservation ownership, notes and priorities — COMPLETE

- reservation owner/operator assignment with active-staff server validation;
- internal notes stored separately and never visible to customers;
- low / normal / high / urgent priority;
- normalized tags;
- operational timeline;
- audited ownership/priority/tag changes;
- permanent customer-route privacy invariant.

### 7A-2 — Tasks and follow-ups — COMPLETE

- tasks attached to trip reservation / service reservation / customer;
- assignee and due date;
- open / in progress / completed / cancelled status;
- overdue/today/upcoming visibility;
- global task dashboard and My tasks view;
- append-only follow-up comments and task-change audit;
- server-side target/assignee validation;
- permanent task/privacy CI gate.

### 7A-3 — Supplier/fulfilment tracking — COMPLETE

- supplier confirmation state per trip/service/accommodation component;
- real component keys resolved server-side from reservation snapshots;
- not requested / requested / confirmed / rejected / cancelled states;
- supplier reference/localizer;
- optional internal supplier cost + currency;
- confirmation deadline and overdue visibility;
- append-only supplier notes and before/after audit events;
- global supplier fulfilment queue;
- dashboard supplier-attention metrics;
- supplier costs/references remain staff-only and never rewrite customer totals or payment ledger;
- adapter-ready boundary for future supplier APIs.

### 7A-4 — Search, filters and operational queues — COMPLETE

- free-text search across reservation reference, customer, trip, travellers, owner and tags;
- filters by reservation status, owner, priority, exact tag, payment state and departure range;
- outstanding-balance and overdue-installment filters;
- task/supplier/payment/unassigned attention signals;
- quick views for Mine / Needs attention / Unassigned;
- sorting by departure, creation date or priority;
- 20-row server-rendered pagination preserving filters;
- permanent search/filter/sorting/pagination CI gate.

Saved operational views and bulk actions remain later extensions if they prove useful; no unsafe generic bulk mutation was added.

### 7A-5 — Package amendment workflow — COMPLETE

- Operator can add/remove package supplements after booking;
- per-traveller supplement assignments can be changed;
- existing contracted supplements preserve their stored unit price;
- new supplements use the current catalogue price;
- disabled historical supplements can be kept/reduced/removed but cannot be expanded to new travellers;
- server-authoritative snapshot rebuilding and traveller validation;
- amendment history stores exact before/after supplement snapshots and price delta;
- 6B financial settlement automatically exposes additional balance or refund review without rewriting ledger transactions;
- stale payment terms use the existing safe fallback;
- configured customer notification is reused without exposing the internal reason;
- permanent package-supplement amendment invariant CI gate.

### 7A-6 — More granular permissions — COMPLETE

- Admin remains a full-access superuser while Operator accounts can receive narrower explicit capabilities;
- existing Operators without an explicit assignment preserve the legacy role profile until an Admin deliberately saves a narrower matrix;
- server-authoritative capabilities separate reservations, catalogue, finance, protected traveller data, supplier fulfilment and tasks;
- protected route layouts and sensitive server actions enforce the same capability boundaries;
- shared dashboards, reservation queues and workspaces only fetch finance/task/supplier/traveller datasets when the current staff account is authorized;
- explicit assignments are stored in `travel_staff_capabilities`;
- every real permission change writes before/after capability state, administrator identity and timestamp to `travel_staff_capability_audit` in the same MongoDB transaction;
- Operator navigation and metrics expose only permitted operational areas;
- permanent `check:staff-permissions` CI invariant protects the permission model and sensitive boundaries.

## Phase 7B — Documents, exports and reporting — IN PROGRESS

Goal: support operational documents and reports commonly required by travel teams.

### 7B-1 — Booking confirmation PDFs — COMPLETE

- reusable server-side PDF document layer using `pdf-lib`;
- customer-owned booking confirmation download from My reservations;
- protected Operator Documents workspace;
- EN/ES reservation confirmation with trip dates, traveller names, accommodation and package supplements;
- customer contact summary and current reservation total;
- payment status/paid/outstanding details included for the customer and only for staff with Finance permission;
- no internal notes, supplier references/costs or protected post-purchase traveller data in the renderer;
- private `no-store` document endpoints;
- safe PDF filenames and permanent real-PDF CI invariant.

### 7B-2 — Traveller lists and rooming lists — NEXT

- operational traveller manifest by reservation/departure;
- rooming list derived from snapshotted accommodation allocation;
- printable/PDF formats;
- access rules aligned with Reservations and Traveller data capabilities;
- no accidental export of protected document fields unless explicitly authorized and audited.

### 7B-3 — Vouchers and printable reservation dossier

- accommodation/service vouchers;
- customer-facing supplier-safe references only where configured for disclosure;
- consolidated printable Operator dossier;
- document status/version timestamp.

### 7B-4 — CSV/XLSX exports and reconciliation reports

- reservation/service exports;
- customer exports;
- payment/reconciliation and outstanding-balance reports;
- secure audited traveller-data export for legitimate operational use;
- revenue by product/service;
- operational/commercial dashboards.

## Phase 8 — External integrations

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

## Phase 9 — Production hardening

Goal: complete the work required before positioning a deployment for real production customers.

### Testing

- browser E2E registration → booking → accommodation/extras → service → payment → Operator;
- MongoDB integration tests;
- payment webhook/idempotency tests;
- traveller/minor pricing tests;
- trip/service/room inventory concurrency tests;
- amendment/reallocation E2E;
- accessibility regression checks;
- performance budgets;
- adapter contract tests.

### Security

- CSRF review;
- rate limiting;
- CSP/security headers;
- cookie/session review;
- dependency/secret scanning;
- privileged-action audit review;
- payment/traveller-data key recovery and rotation procedures;
- backup/restore testing.

### Observability and operations

- structured application logs;
- centralized error reporting;
- uptime/health monitoring;
- webhook/payment failure visibility;
- backup/disaster-recovery procedure;
- deployment rollback procedure;
- database index/performance review.

### Privacy/legal

- privacy policy and deployment-specific GDPR notices;
- terms and booking conditions;
- cookie policy/consent where applicable;
- retention/deletion policy;
- customer export/deletion workflow;
- configurable legal/company details;
- insurance-distribution review where protection is commercially sold;
- regulatory review per operator/market.

## Phase 10 — Open-source productisation

Goal: make Open Travel Platform easy for third parties to adopt while Kairoseth Travel remains the official commercial implementation.

- production-ready environment documentation;
- clean demo seed/setup flow;
- fresh-clone installation/deployment guide;
- reference adapters;
- clearer extension/plugin contracts;
- versioned releases and migration notes;
- issue/contribution templates;
- public API/extension documentation;
- optional Docker/self-host example;
- trademark/branding policy;
- keep proprietary Kairoseth/customer adapters outside the MIT core when appropriate.

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

Open Travel Platform should **not** become permanently tied to:

- one payment gateway;
- one CMS;
- one CRM/ERP;
- one booking supplier;
- one authentication vendor;
- one hosting platform;
- Kairoseth-only infrastructure.

The public core remains MIT licensed and reusable. Kairoseth Travel can build commercial hosting, support, implementation, premium/private adapters and customer-specific integrations around that core.
