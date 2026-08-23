# Roadmap

<p align="center"><strong>English</strong> · <a href="./ROADMAP.es.md">Español</a></p>

Open Travel Platform is the reusable MIT-licensed open-source core. **Kairoseth Travel** is the official commercial/reference implementation deployed at **https://travel.kairoseth.com**.

The roadmap keeps two goals aligned:

1. keep the public core portable, provider-neutral and useful to other agencies/developers;
2. continue hardening Kairoseth Travel into a complete production travel platform without coupling the core to one PSP, supplier, CRM, ERP, CMS or hosting provider.

_Last updated: 23 August 2026._

---

## Current position

The project is beyond the original catalogue/booking MVP. The current codebase already includes persistent identity, customer/staff RBAC, trip and service reservations, traveller age pricing, independent activities/transport/insurance, transactional email, payment accounting, encrypted admin-managed PSP configuration, provider-neutral online checkout adapters, deposits/installments and encrypted post-purchase traveller data.

Stripe/Redsys credentialed end-to-end validation is intentionally deferred until suitable provider accounts are available. The implementation is present, but production payment capability must not be considered validated until TEST and LIVE provider flows have been exercised.

**Phase 6A is functionally complete.** Before starting 6B, a 6A.1 UX/documentation layer has been added so product activation and the `Not required / Pending / Complete` states are obvious to both customers and Operator staff.

---

# Completed milestones

## Foundation and catalogue — COMPLETE

- Next.js / React / TypeScript application foundation;
- CI quality gates and release checks;
- bilingual EN/ES public and operator interfaces;
- destinations and trips catalogue;
- persistent MongoDB catalogue adapters;
- protected catalogue backoffice;
- GridFS media library, galleries, covers and focal points;
- multilingual structured itineraries;
- departures, capacity and live inventory;
- public reference deployment at `travel.kairoseth.com`.

## Identity, RBAC and account security — COMPLETE

- persistent customer registration/sign-in;
- persistent staff operator/admin authentication;
- separate customer/staff sessions;
- server-side RBAC checks;
- account lockout after repeated failed sign-ins;
- password change and session revocation;
- password recovery with single-use expiring tokens;
- SMTP password-reset delivery;
- authentication audit events;
- active-session/role indicator in the frontend.

## Reservation operations and email — COMPLETE

- persistent trip reservations;
- server-authoritative ownership, pricing and inventory checks;
- confirm/cancel state workflow;
- inventory release on cancellation;
- operator reservation queue;
- customer CRM-style view;
- operational audit history;
- transactional reservation-received / confirmed / cancelled emails;
- customer account reservation history.

## Phase 5A — Provider-neutral payment foundation — COMPLETE

- `travel_payment_transactions` ledger;
- payment and refund movements separated from reservation state;
- unpaid / pending / partially paid / paid / partially refunded / refunded summaries;
- manual bank-transfer, cash and external-terminal payment recording;
- manual refunds;
- overpayment / over-refund protections;
- customer payment history;
- operator finance dashboard;
- provider/idempotency metadata ready for PSP adapters.

## Phase 5B — Traveller & age pricing engine — COMPLETE

- lead traveller and individual traveller records;
- date of birth and nationality;
- age calculated against departure/service date;
- configurable age bands;
- per-traveller pricing;
- per-departure traveller-price overrides;
- guardian requirement for minors;
- configurable inventory consumption by age band;
- historical pricing snapshots;
- traveller details visible to customer and Operator.

## Phase 5C — Independent service catalogue — COMPLETE

- independent **Activities**, **Transport** and **Insurance** products;
- public catalogue and detail pages available without login;
- protected Operator CRUD;
- multilingual content;
- pricing models: per person / per booking / per unit / by age;
- age-band pricing reused from the traveller engine;
- public/service-specific product URLs and navigation.

## Phase 5D — Service availability & inventory — COMPLETE

- independent availability calendar for activities and transport;
- date/time slots;
- capacity and reserved-space tracking;
- transport unit inventory and capacity-per-unit;
- safe slot closing instead of destructive deletion when reservations exist;
- future/open/available public slot display;
- service inventory kept independent from trip inventory.

## Phase 5E — Independent service reservations — COMPLETE

- activity reservations;
- transport reservations;
- insurance reservations using trip dates/destination/travellers rather than slot inventory;
- service reservations linked optionally to a Kairoseth trip;
- fully independent reservation mode for externally booked trips;
- transactional service inventory consumption/release where applicable;
- customer `My services` area;
- operator service-reservation queue;
- confirm/cancel service workflow;
- service reservation support in the payment ledger.

## Phase 5F — Payment providers and unified checkout — IMPLEMENTED

### Admin provider management

- admin-only payment-provider configuration;
- separate TEST and LIVE profiles;
- provider enable/disable switch;
- Stripe and Redsys initial adapters;
- AES-256-GCM encryption for persisted provider secrets;
- stable `PAYMENT_SECRETS_KEY` server key;
- saved secrets never returned to the browser;
- infrastructure credentials remain outside the Operator UI.

### Unified checkout

- common checkout for trip and service reservations;
- Stripe hosted Checkout Session flow;
- signed Stripe webhook verification;
- idempotent Stripe webhook processing;
- Redsys redirect/form flow;
- Redsys signed server notification validation;
- provider references mapped back into the internal payment ledger;
- browser success/cancel returns are not authoritative payment confirmation;
- customers cannot directly cancel reservations with completed/pending financial movements that require operator handling.

### Validation status

- source safety: complete;
- TypeScript/build/smoke CI: complete;
- adapter implementation: complete;
- **credentialed Stripe TEST E2E: pending provider account**;
- **credentialed Redsys TEST E2E: pending provider account**;
- LIVE activation: intentionally pending.

## Customer-account trip context — COMPLETE

- the account prioritizes the customer's actual next non-cancelled future trip;
- future reservations are ordered by departure date;
- direct links to reservation, itinerary and complementary services;
- catalogue recommendation is only a fallback when no future trip exists;
- fallback prefers a trip the customer has not previously reserved.

## Phase 5G — Deposits, installments and payment terms — COMPLETE

Goal achieved: support real travel-agency payment schedules without breaking the provider-neutral ledger.

- full-payment versus deposit policies;
- configurable deposits;
- optional installments;
- due dates;
- payment-term snapshot stored with the reservation;
- server-side outstanding-balance and next-payment calculation;
- customer-facing payment schedule;
- controlled Operator visibility/editing;
- compatibility with manual movements and the existing online checkout;
- safe fallback to the full outstanding balance when saved terms become stale relative to the reservation total.

## Phase 6A — Secure post-purchase traveller data — COMPLETE

Goal achieved: collect only the extra traveller data required by each product/supplier after purchase, keeping it separate from checkout and the main reservation record.

- per-product requirement presets: `none`, `travel-document`, `international-air`, `spanish-lodging`, `maritime` and `custom`;
- requirement snapshots stored with each reservation;
- document, issuing-country, expiry, residence and other fields only when required;
- customer post-purchase self-service editing until a configurable deadline;
- AES-256-GCM encryption using `TRAVELLER_DATA_KEY`;
- sensitive data stored separately from reservation collections;
- configurable retention and automatic TTL deletion;
- audit records that store changed field names, not old/new values;
- Operator completion overview without exposing decrypted values;
- no DNI/passport image-copy upload;
- health/medical data deliberately excluded from the standard flow;
- presets designed around data minimisation and reviewed regulatory use cases.

Operational/document exports of traveller data remain outside this phase and fit **Phase 7B — Documents, exports and reporting**, where they can be implemented with dedicated permissions and audit controls.

## Phase 6A.1 — Traveller-data UX and documentation — COMPLETE

Goal: make the feature obvious and consistent for Operator and customer before starting reservation amendments.

- product editor explains whether traveller data is `Not required` or `Active for new reservations`;
- UI explicitly explains that the product must be saved and a new reservation created to test changed requirements;
- existing reservations keep their snapshot and do not silently change;
- Operator displays aggregate `NOT REQUIRED / PENDING / COMPLETE` status;
- Operator displays per-traveller status without exposing sensitive values;
- My account highlights the pending task for the next trip;
- trip and service reservation details calculate real completion instead of permanently displaying “information required”;
- customer sees `Action required` while data is missing and `Traveller information complete` when finished;
- CTA changes from `Complete` to `Review` when all required data is complete;
- README EN/ES and `docs/TRAVELLER-DATA.md` document activation, workflow, security and the test checklist.

---

# Next priorities

## Phase 6B — Reservation amendments — NEXT

Goal: support the normal post-booking lifecycle without destroying the original record.

- add/remove/change travellers;
- change departure when inventory permits;
- add/remove activities, transport and insurance;
- recalculate totals server-side;
- preserve original and amended pricing snapshots;
- amendment timeline/audit;
- controlled inventory reallocation;
- charge additional balance when price increases;
- create a refundable balance when price decreases;
- amendment notifications;
- configurable cancellation/change deadlines.

Implementation principle: amendments must add history and financial adjustments rather than silently rewriting the past. Existing ledger movements remain historical facts.

## Phase 6C — Accommodation, supplements and package composition

Goal: evolve from trips + independent services into richer package construction.

- accommodation products/components;
- room types;
- occupancy rules;
- single supplement;
- double/twin/triple pricing;
- child-sharing rules;
- room inventory;
- seasonal supplements;
- optional extras;
- included/not-included components;
- package composition using reusable travel products;
- server-side package pricing service with tests.

## Phase 7A — Rich operations workflow

Goal: make Operator suitable for day-to-day agency operations.

- assign reservation owner/operator;
- internal notes;
- tasks/follow-ups;
- tags and priority;
- richer operational timeline;
- supplier status fields;
- customer contact history;
- search, filters and pagination;
- safe bulk actions;
- more granular least-privilege permissions beyond operator/admin.

## Phase 7B — Documents, exports and reporting

Goal: support documents and reports commonly required by travel teams.

- booking confirmation PDF/document;
- traveller lists / rooming lists;
- vouchers;
- reservation and service exports;
- secure, audited traveller-data export where there is a legitimate operational need;
- CSV/XLSX customer/payment exports;
- payment reconciliation export;
- outstanding-balance report;
- revenue by product/service;
- operational/commercial dashboards;
- printable operator dossier.

## Phase 8 — External integrations

Goal: connect Kairoseth Travel to real business ecosystems through adapters while keeping provider payloads out of the core domain.

Candidate adapters:

- supplier/booking APIs;
- CRM synchronization;
- ERP/accounting integrations;
- generic outbound webhooks;
- CMS/catalogue-source example;
- Auth.js/OIDC enterprise identity example;
- generic REST booking adapter;
- payment providers beyond Stripe/Redsys.

## Phase 9 — Production hardening

Goal: complete the work required before positioning a deployment for real production customers.

### Testing

- browser E2E tests for registration → booking → service → payment → operator workflow;
- MongoDB integration tests;
- payment webhook/idempotency tests;
- traveller/minor pricing tests;
- inventory concurrency tests;
- accessibility regression checks;
- performance budgets;
- production-adapter contract tests.

### Security

- CSRF review for state-changing flows;
- rate limiting for authentication, password reset and sensitive endpoints;
- CSP/security-header review;
- cookie/session review;
- dependency and secret scanning;
- privileged-action audit review;
- payment/traveller-data secret recovery and rotation procedures;
- backup/restore testing.

### Observability and operations

- structured application logs;
- centralized error reporting;
- uptime/health monitoring;
- payment/webhook failure visibility;
- backup/disaster-recovery procedure;
- deployment rollback procedure;
- database index/performance review.

### Privacy/legal

- privacy policy;
- deployment-specific first-layer / GDPR Article 13 information at personal-data collection points;
- terms and booking conditions;
- cookie policy/consent where applicable;
- data-retention/deletion policy;
- customer data export/deletion workflow;
- configurable legal/company details per deployment;
- insurance-distribution/legal review where insurance is commercially sold;
- review regulatory requirements per operator/market.

## Phase 10 — Open-source productisation

Goal: make Open Travel Platform straightforward for third parties to adopt while Kairoseth Travel remains the official commercial implementation.

- production-ready `.env.example` documentation;
- clean demo seed/setup workflow;
- installation/deployment guide for a fresh clone;
- reference adapter examples;
- clearer extension/plugin contracts;
- versioned releases and migration notes;
- contribution/issue templates;
- public API and extension documentation;
- optional Docker/self-host example;
- trademark/branding policy distinguishing **Open Travel Platform** from **Kairoseth Travel**;
- keep proprietary Kairoseth/customer-specific integrations outside the MIT core where appropriate.

---

# Suggested delivery order

```text
6B  Reservation amendments
 ↓
6C  Accommodation / supplements / package composition
 ↓
7A  Rich operator workflow
 ↓
7B  Documents / exports / reporting
 ↓
8   External integrations
 ↓
9   Production hardening
 ↓
10  Open-source productisation / release
```

Credentialed Stripe/Redsys TEST validation should be inserted as soon as the required provider accounts are available; it does not need to block Phase 6B.

Some Phase 9 testing/security work should continue incrementally rather than waiting until the end, especially around payments, traveller data and inventory concurrency.

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
