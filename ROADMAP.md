# Roadmap

Open Travel Platform is the reusable MIT-licensed open-source core. Kairoseth Travel is the official commercial/reference implementation deployed at **https://travel.kairoseth.com**.

The roadmap keeps those two goals aligned:

1. keep the public core portable, provider-neutral and useful to other agencies/developers;
2. continue hardening Kairoseth Travel into a complete production travel platform without coupling the core to one payment gateway, supplier, CRM, ERP or hosting provider.

## Current status

### Completed foundation
- Next.js / React / TypeScript application foundation and CI quality gates;
- bilingual EN/ES public and operator UI;
- public destinations and trips catalogue;
- MongoDB catalogue persistence and seed path;
- operator catalogue backoffice;
- cover media, galleries, GridFS media library and inline uploads;
- structured multilingual itineraries;
- departures, capacity and live inventory;
- persistent customer registration, sessions and profiles;
- persistent operator/admin authentication and RBAC separation;
- account lockout, password changes, password recovery and authentication audit;
- persistent reservations with inventory consumption/release;
- customer CRM view for staff;
- reservation status workflow and operations audit;
- SMTP password recovery and transactional reservation emails;
- provider-neutral payment ledger with manual payments/refunds and reconciliation summaries;
- live reference deployment at `travel.kairoseth.com`.

### Phase 5A — Payment foundation — COMPLETE
- `travel_payment_transactions` ledger;
- payment/refund records separated from reservation status;
- unpaid / pending / partially paid / paid / partially refunded / refunded summaries;
- manual bank transfer, cash, external terminal and reconciliation records;
- overpayment and over-refund protection;
- customer payment history;
- operator payment dashboard and reservation payment controls;
- provider/idempotency fields ready for PSP adapters.

---

## Next priorities

### Phase 5B — Real payment provider adapter — NEXT
Goal: allow a customer to pay online while keeping the core provider-neutral.

Planned Stripe reference adapter:
- Stripe Checkout hosted payment flow;
- test/live mode configuration;
- payment intent / checkout session linkage to the internal ledger;
- signed webhook verification;
- idempotent webhook processing;
- succeeded / failed / expired payment reconciliation;
- success and cancellation return pages;
- customer receipt/payment state refresh;
- operator-visible provider reference and status;
- server-side refund initiation from Operator where supported;
- no browser-reported payment success trusted as authoritative.

The domain remains compatible with future Redsys, Adyen, Mollie or other PSP adapters.

### Phase 5C — Deposits, installments and payment terms
Goal: support real travel-agency payment schedules instead of only one full balance.

- configurable deposit amount or percentage;
- deposit due date;
- final balance due date;
- optional installment schedules;
- automatic outstanding balance calculation;
- payment reminders by email;
- overdue status and operator visibility;
- payment-term snapshots stored with reservations;
- explicit refund/cancellation financial rules.

### Phase 6A — Traveller / passenger records
Goal: move from a reservation with only `partySize` to operational traveller data.

- lead traveller;
- traveller list per reservation;
- first/last name and required travel fields;
- optional date of birth/nationality/document fields when a trip requires them;
- data-minimisation rules so sensitive fields are not collected unnecessarily;
- traveller completion status;
- customer self-service editing before a configurable deadline;
- operator view and export.

### Phase 6B — Reservation amendments
Goal: handle the normal lifecycle after booking.

- change party size;
- change departure where availability permits;
- add/remove optional services;
- recalculate reservation totals server-side;
- retain historical pricing snapshots;
- amendment audit trail;
- cancellation policies and deadlines;
- controlled inventory release/reallocation;
- notifications for material changes.

### Phase 6C — Product components and advanced pricing
Goal: represent richer travel products without hard-coding one business model.

- accommodation components;
- transport components;
- activities/services;
- optional extras and supplements;
- per-person / per-booking pricing;
- age or traveller-type pricing where required;
- seasonal/departure-specific supplements;
- included/not-included service structure;
- pricing calculation service with tests.

### Phase 7A — Rich operations workflow
Goal: make the operator area usable for day-to-day agency operations.

- assign reservation owner/operator;
- internal notes;
- operational timeline;
- tasks/follow-ups;
- tags/priority;
- richer search, filters and pagination;
- bulk actions where safe;
- supplier status fields;
- customer contact history;
- least-privilege permissions beyond the current operator/admin split.

### Phase 7B — Documents, exports and reporting
Goal: support the documents and reports travel teams commonly need.

- booking confirmation document;
- traveller/rooming lists;
- voucher/document generation architecture;
- CSV/XLSX exports for reservations/customers/payments;
- payment reconciliation export;
- operational and commercial dashboards;
- basic revenue / outstanding balance reporting;
- printable operator summaries.

### Phase 8 — External integrations
Goal: connect Kairoseth Travel to real business ecosystems through adapters.

Candidate adapters:
- supplier/booking APIs;
- CRM/ERP synchronization;
- generic outbound webhooks;
- CMS/catalogue source example;
- accounting/export connector;
- Auth.js/OIDC enterprise identity example;
- generic REST booking adapter.

Provider-specific payloads must remain inside adapters and must not leak into the core domain/UI.

### Phase 9 — Production hardening
Goal: complete the work required before positioning a deployment as production-ready for real customers.

#### Testing
- browser end-to-end tests for registration → booking → payment → operator workflow;
- MongoDB integration tests;
- payment webhook/idempotency tests;
- accessibility regression checks;
- performance budgets;
- production-adapter contract tests.

#### Security
- CSRF review for all state-changing flows;
- rate limiting for authentication, password reset and sensitive write endpoints;
- security header/CSP review;
- session/cookie review;
- dependency and secret scanning;
- privileged-action audit review;
- backup/restore testing.

#### Observability and operations
- structured application logs;
- error reporting;
- uptime/health monitoring;
- payment/webhook failure visibility;
- backup and disaster-recovery procedure;
- deployment rollback procedure;
- database index/performance review.

#### Privacy/legal
- privacy policy;
- terms/booking conditions;
- cookie policy/consent where applicable;
- retention/deletion policy;
- customer data export/deletion workflow;
- configurable company/legal details per deployment;
- review of the exact regulatory requirements of each market/operator.

### Phase 10 — Open-source productisation
Goal: make Open Travel Platform easy for third parties to adopt while Kairoseth Travel remains the official commercial implementation.

- production-ready `.env.example` documentation;
- clean demo seed/setup workflow;
- installation/deployment guide for a fresh clone;
- reference adapter examples;
- clearer extension/plugin contracts;
- versioned releases and migration notes;
- contribution templates and issue templates;
- public API/extension documentation;
- optional Docker/self-host example;
- trademark/branding policy distinguishing **Open Travel Platform** from **Kairoseth Travel**;
- keep proprietary Kairoseth/customer-specific integrations outside the MIT core when appropriate.

---

## Suggested delivery order

```text
5B  Real online payments
 ↓
5C  Deposits / installments
 ↓
6A  Traveller records
 ↓
6B  Reservation amendments
 ↓
6C  Advanced product/pricing
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

Some Phase 9 security/testing work should be implemented continuously rather than postponed until the end, especially around payments and sensitive traveller data.

## Core non-goals

Open Travel Platform should **not** become permanently tied to:
- one payment gateway;
- one CMS;
- one CRM/ERP;
- one booking supplier;
- one authentication vendor;
- one hosting platform;
- Kairoseth-only infrastructure.

The public core remains MIT licensed and reusable. Kairoseth Travel can build commercial hosting, support, implementation, premium/private adapters and customer-specific integrations around that core.
