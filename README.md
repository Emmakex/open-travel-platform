# Open Travel Platform

<p align="center"><strong>English</strong> · <a href="./README.es.md">Español</a></p>

> Reusable open-source travel platform foundation for agencies, tour operators and booking products.

Open Travel Platform is a clean-room **Next.js + TypeScript + MongoDB** platform built around explicit domain, repository and adapter boundaries. It can run with bundled demo data for local evaluation or with persistent catalogue, identity, booking, accommodation, services, operations, payment and integration capabilities.

The official commercial/reference implementation is **Kairoseth Travel**, deployed at **[travel.kairoseth.com](https://travel.kairoseth.com)**.

![Version](https://img.shields.io/badge/version-1.0.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![MongoDB](https://img.shields.io/badge/MongoDB-supported-47A248)
![License](https://img.shields.io/badge/license-MIT-45d6b5)
[![Live reference](https://img.shields.io/badge/live-travel.kairoseth.com-45d6b5)](https://travel.kairoseth.com)

## Project model

This repository is the **MIT-licensed open-source core**. Kairoseth Travel is the official hosted/commercial implementation built on top of it.

That separation is intentional:

- Open Travel Platform remains reusable, provider-neutral and useful to other agencies/developers;
- Kairoseth Travel can add hosted operations, support, commercial services, private integrations and deployment-specific capabilities;
- customer data, production credentials and proprietary customer integrations stay outside the public repository.

## Current position

The platform is well beyond the original catalogue/booking MVP. The implementation currently includes:

- bilingual public catalogue and Operator backoffice;
- MongoDB persistence;
- persistent customer/staff authentication with RBAC and granular capabilities;
- trip departures and transactional inventory;
- travellers, minors and age-based pricing;
- independent activities, transport and travel-protection products;
- independent service availability and reservations;
- provider-neutral payment ledger, deposits, installments and payment terms;
- Stripe and Redsys adapters behind a unified checkout layer;
- encrypted post-purchase traveller data;
- reservation amendments with safe inventory reallocation and financial delta;
- reusable accommodation, room inventory and seasonal/occupancy pricing;
- transactional accommodation inside trip bookings;
- optional package supplements and post-booking supplement amendments;
- rich Operator workflow with ownership, internal notes, priority, tags, tasks and supplier fulfilment;
- advanced operational queues and granular Operator permissions;
- booking-confirmation PDFs, traveller manifests and rooming-list PDFs;
- customer-safe accommodation/service vouchers and an internal printable Operator dossier;
- explicitly approved/audited supplier-reference disclosure for customer vouchers;
- permission-aware CSV/XLSX exports for reservations, services and customers;
- payment reconciliation, outstanding-balance and revenue reporting;
- audited fail-closed export of retained protected traveller data for legitimate operational use;
- currency-safe finance dashboards and reports that never aggregate different currencies together;
- provider-neutral outbound reservation events with a transactional MongoDB outbox;
- Admin-managed signed HTTPS webhooks with encrypted secrets, retries, delivery history and dead-letter retention;
- SSRF/DNS-rebinding protections for configurable outbound webhook targets;
- server-only scheduled integration delivery with durable worker locking, replay and retention;
- a versioned generic REST `BookingRepository` adapter with server-only authentication and idempotent mutations;
- an optional provider-neutral supplier-fulfilment adapter with audited request/status/cancel synchronization;
- a downstream-only CRM synchronization adapter that reuses the same durable integration worker and keeps customer/profile events out of generic webhook subscriptions;
- a downstream-only ERP/accounting adapter that exports only finalized payment/refund ledger movements through the same durable worker without granting the ERP authority over local booking/payment history;
- global CSP/security headers, persistent auth throttling, explicit Origin checks for cookie-authenticated Route Handler mutations and health/readiness endpoints;
- explicit `demo|live` deployment readiness profiles that fail closed when a live configuration still relies on demo capabilities or required infrastructure is unavailable;
- deterministic real-MongoDB concurrency/idempotency/amendment validation and real-local-HTTP adapter contract tests;
- provider-neutral structured JSON operational logs with validated `X-Request-Id` correlation and central sensitive-data redaction;
- an optional centralized failure transport with strict outbound allowlists, stable SHA-256 grouping fingerprints and best-effort single-attempt delivery;
- external uptime/readiness monitoring contracts, actionable alert routing, fail-closed privileged-action audit integrity and staged encryption-key rotation;
- real MongoDB backup/restore disaster-recovery drills and query-plan/index validation;
- authenticated privacy-right workflows, controlled access/portability/restriction/erasure execution and an explicit retention-policy registry;
- a WCAG 2.2 AA-oriented accessibility engineering baseline across global navigation, customer authentication, Traveller Data/privacy, booking/payment and Operator workflows, backed by dedicated blocking browser journeys.
- repeatable performance/load baselines covering public and authenticated reads, bounded mutation contention, runtime RSS/file-descriptor/thread behavior and post-spike liveness/recovery.
- reproducible fresh-clone demo bootstrap with a versioned npm lockfile and no mandatory external infrastructure;
- provider-neutral self-host packaging around the real Next.js standalone runtime, with EN/ES deployment guidance and blocking HTTP/static-asset smoke.

Stripe and Redsys credentialed end-to-end validation remains intentionally pending until suitable provider accounts are available. The adapters are implemented, but production payment capability is not considered validated until provider TEST/LIVE flows have been exercised.

**Phase 8 — External integrations and the Phase 9 — Production hardening engineering baseline are COMPLETE. Phase 10 — Open-source productisation is IN PROGRESS: 10.1 reproducible fresh-clone/demo bootstrap and 10.2 provider-neutral self-host standalone deployment are COMPLETE; 10.3 extension contracts/reference adapters is NEXT.**

## Current capabilities

### Public catalogue and commerce

- bilingual EN/ES public experience;
- destinations and trips with localized content;
- public trip departures and live availability;
- accommodation catalogue, room types and galleries;
- independent Activities, Transport and Travel protection catalogues;
- service detail pages with availability and pricing;
- trip booking with traveller composition, accommodation and optional package extras;
- customer authentication only when required for account/reservation flows.

### Catalogue and inventory backoffice

- protected Operator/Admin catalogue management;
- destinations, trips, accommodations, room types and independent services;
- GridFS media library, covers, galleries and focal-point controls;
- structured multilingual itineraries;
- trip departures, capacities and inventory;
- room inventory, occupancy rules, meal plans and rates;
- seasonal and occupancy pricing rules;
- trip ↔ accommodation links;
- optional package supplements;
- service availability/inventory calendars;
- draft/published lifecycle;
- per-product post-purchase traveller-data requirements.

### Reservations, travellers and package composition

- persistent trip and independent-service reservations;
- server-authoritative pricing and inventory;
- lead traveller and individual traveller records;
- age bands, guardian rules and configurable inventory consumption;
- historical traveller/pricing snapshots;
- accommodation snapshotted transactionally inside trip reservations;
- optional package supplements snapshotted at contracted prices;
- confirm/cancel workflows and audit history;
- traveller corrections and departure changes as explicit amendments;
- post-booking package-supplement amendments;
- financial deltas without rewriting historical payment movements;
- configurable modification/cancellation deadlines.

### Rich Operator workflow

- reservation owner/operator assignment;
- internal notes outside customer surfaces;
- low / normal / high / urgent priority and normalized tags;
- operational timeline;
- tasks/follow-ups with assignee, due date, status and comments;
- supplier fulfilment by trip/service/accommodation component;
- supplier confirmation states, deadlines, references and optional internal costs;
- advanced search, filters, quick queues, sorting and pagination;
- server-authoritative granular staff capabilities;
- audited permission changes;
- accessible success/error live regions, contextual repeated-form names and targeted invalid-control relationships on critical reservation/task/supplier workflows.

### Identity, security and operational observability

- persistent customer registration and sessions;
- separate staff Operator/Admin authentication;
- customer/staff session separation;
- opaque session tokens stored only as SHA-256 hashes with TTL expiry and server-side revocation;
- `HttpOnly` session cookies with production `Secure`, customer `SameSite=Lax` and staff `SameSite=Strict`;
- account lockout after repeated failures;
- persistent MongoDB auth throttling for customer/staff sign-in, registration and password-reset requests;
- rate-limit buckets store only SHA-256 identifiers, not raw email addresses or client IP values;
- optional per-client throttling only when trusted proxy IP headers are explicitly enabled;
- password change and SMTP recovery with non-enumerating reset-request responses;
- authentication audit events;
- global Content Security Policy and defensive HTTP security headers;
- production HSTS and insecure-request upgrade;
- explicit trusted-Origin checks for cookie-authenticated Route Handler mutations while provider webhooks retain signature-based authentication;
- `/api/health/live`, `/api/health/ready` and versioned monitoring surfaces for independent external probes;
- `KTRAVEL_DEPLOYMENT_PROFILE=demo|live` readiness contract;
- payment-provider and integration secrets protected by a versioned AES-256-GCM keyring with staged rotation support;
- advanced traveller data stored separately with AES-256-GCM keyring rotation and bounded transactional re-encryption;
- privileged configuration mutations coupled transactionally with their persistent audit event;
- provider-neutral MongoDB backup/restore and disaster-recovery procedure with a real isolated recovery drill;
- additive query-aligned MongoDB index baseline validated using real `explain("executionStats")` runs;
- versioned JSON operational logs to stdout/stderr with safe request correlation;
- generic exception logging limited to safe error type/code, never exception `message` or `stack`;
- optional provider-neutral `FailureTransport` for warning/error/critical operational events;
- external failure payloads use an explicit allowlist and exclude credentials, customer/traveller data, provider references, raw payloads and monetary values;
- failure-collector outages never alter booking/payment/integration/readiness authority and never trigger automatic retries.

### Privacy and accessibility

- authenticated customer requests for access, rectification, erasure, restriction, objection and portability;
- Admin-only privacy review with bounded deadlines/extensions and explicit retention review;
- approved access/portability JSON exports with narrower portability scope and fail-closed protected-data handling;
- controlled restriction and erasure execution that preserves required booking/inventory/financial structure while anonymising or pseudonymising eligible identity data;
- explicit retention registry for every personal-data inventory area with `ttl`, case-review, business-record-review or security-review ownership;
- holds override expiry eligibility and the generic evaluator never emits an automatic legal delete instruction;
- bilingual skip navigation, visible keyboard focus, reduced-motion/forced-colors support and narrow reflow checks;
- accessible customer authentication, Traveller Data/privacy, booking/payment and Operator workflow feedback with stable alert/status semantics;
- dedicated blocking Chromium journeys backed by MongoDB for critical accessibility slices;
- accessibility work is an engineering baseline, not a certification; each deployment still requires manual keyboard, screen-reader, contrast, zoom/reflow and content review.

### Payments and finance

- provider-neutral payment/refund ledger;
- reservation state independent from payment state;
- unpaid / pending / partially paid / paid / partially refunded / refunded summaries;
- manual bank-transfer, cash and external-terminal movements;
- controlled refunds and reconciliation protections;
- Stripe signed webhooks and idempotency;
- Redsys signed server notifications;
- browser returns never trusted as payment confirmation;
- Admin-managed TEST/LIVE provider profiles;
- full-payment, deposit and installment snapshots;
- outstanding-balance and next-payment calculations;
- finance dashboard totals grouped by currency, never cross-currency summed;
- finalized `succeeded` ledger movements can be synchronized downstream to ERP/accounting without changing local financial authority.

### Documents

- reusable server-side PDF generation with `pdf-lib`;
- customer and Operator booking-confirmation PDFs;
- EN/ES traveller manifests and rooming lists by departure;
- customer-safe accommodation vouchers for confirmed eligible trip reservations;
- customer-safe service vouchers for confirmed activities, transport and travel protection;
- consolidated internal Operator reservation dossier;
- explicit document version/status and UTC generation timestamp;
- payment information in staff documents only when Finance permission allows it;
- supplier fulfilment section in the internal dossier only when Suppliers permission allows it;
- supplier references on customer vouchers only after explicit approval of the exact current reference;
- changing a supplier locator invalidates the previous customer-disclosure approval automatically;
- supplier-reference approvals stored separately and audited;
- internal notes, supplier costs and protected post-purchase traveller values excluded from customer-safe renderers;
- private `no-store` + `nosniff` PDF endpoints and safe filenames.

### Reports and exports

- protected `/operator/reports` workspace;
- CSV/XLSX trip-reservation, service-reservation and customer exports;
- server-side creation-date filters and bounded browser export sizes;
- Finance-only reconciliation, active outstanding-balance/overdue-installment and revenue-by-product/service exports;
- common typed tabular definitions used by CSV and XLSX renderers;
- spreadsheet-formula injection mitigation for user-controlled text;
- minimal OOXML XLSX generation with frozen header and autofilter;
- private `no-store` + `nosniff` download responses;
- export audit with actor, type, format, filters, columns, row count and timestamp but no exported cell values;
- protected traveller-data export requires Traveller data + Reservations capabilities, an active reservation and an explicit operational reason;
- protected traveller export is POST-only and fail-closed: persistent audit must succeed before sensitive bytes are returned;
- financial metrics and revenue groups remain separated by currency.

### Outbound integrations

- Admin-only `/operator/integrations` workspace;
- versioned provider-neutral reservation events;
- transactional outbox committed with the source mutation;
- idempotent delivery records per event/endpoint pair;
- HMAC-SHA256 signed HTTPS webhook reference adapter;
- encrypted write-only signing secrets using `INTEGRATION_SECRETS_KEY`;
- HTTPS-only targets with private/local/reserved network rejection and DNS revalidation before delivery;
- validated-IP pinning while preserving the original hostname for TLS SNI and HTTP Host;
- redirects disabled, bounded request timeouts and bounded response bodies;
- per-delivery leasing, crash recovery, retry/backoff, attempt history and dead-letter retention;
- server-only `POST /api/internal/integrations/process` scheduler entry point with Bearer authentication;
- durable global worker lock shared by scheduled and manual Admin runs;
- server-side batch/frequency limits and `Retry-After` for overlapping/rate-limited runs;
- Admin health metrics, event detail and delivery detail views;
- Admin-only audited dead-letter requeue with prior attempt history preserved;
- bounded retention for old successful delivery history with retention audit metadata;
- protected post-purchase traveller values, signing secrets and worker credentials excluded from operational diagnostics;
- CRM and ERP/accounting reuse this same delivery infrastructure as isolated virtual destinations rather than creating separate queues.

### Business adapters

#### Generic REST booking

- `BOOKING_MODE=rest` composes an external booking API behind the existing `BookingRepository` interface;
- versioned `/v1` contract with `X-OTP-Contract-Version: 1`;
- server-only Bearer authentication and production HTTPS enforcement;
- redirect rejection, `no-store`, bounded timeout and streamed-response size;
- runtime validation before external JSON becomes booking-domain data;
- customer ownership and requested trip/departure scope verified after mapping;
- create/cancel mutations use stable idempotency keys and bounded transient retries.

#### Supplier fulfilment

- `SUPPLIER_FULFILMENT_ADAPTER_MODE=rest` enables an external adapter without replacing the local fulfilment store;
- REST v1 operations are explicit `request`, `status` and `cancel`;
- request normalizes only to `requested`; cancel only to `cancelled`; confirmation/rejection is synchronized through `status`;
- request/cancel mutations use deterministic idempotency keys and bounded transient retries;
- external responses are persistently audited before local application and re-enter `saveSupplierFulfilment()`;
- invalid external transitions are recorded as conflicts and never forced;
- external supplier payloads exclude customer totals, payment/refund ledger data, supplier costs, inventory instructions and protected traveller data;
- local supplier cost/currency are preserved;
- returned references remain internal until the separate voucher-disclosure approval succeeds.

#### CRM synchronization

- `CRM_SYNC_MODE=rest` enables a downstream-only provider-neutral `CrmSyncAdapter`;
- REST v1 endpoints: `/v1/crm/contacts/upsert` and `/v1/crm/reservations/upsert`;
- customer registration/profile updates enqueue `customer.created` / `customer.profile.updated` in the same MongoDB transaction as the customer write;
- `customer.*` events are deliberately unavailable to generic webhook subscriptions;
- CRM deliveries reuse the existing integration outbox, worker, retry/backoff, dead-letter, replay and health metrics through the virtual `crm-rest:primary` destination;
- reservation events upsert the contact first and then the reservation;
- event-derived `Idempotency-Key` values remain stable across transport retry, queue retry and dead-letter replay;
- generic contact and reservation snapshots use explicit field allowlists;
- reservation snapshots exclude prices, currency/payment terms, supplier data, inventory mutations, traveller arrays and protected post-purchase traveller fields;
- CRM external IDs are stored separately in `travel_crm_sync_links`;
- normalized sync outcomes are stored without contact PII in `travel_crm_sync_audit`;
- Admin diagnostics are available at `/operator/integrations/crm`;
- CRM cannot mutate local booking, pricing, inventory, supplier fulfilment or payment-ledger state.

#### ERP / accounting synchronization

- `ERP_ACCOUNTING_MODE=rest` enables a downstream-only provider-neutral `ErpAccountingAdapter`;
- REST v1 endpoint: `/v1/accounting/movements/upsert`;
- only authoritative local payment/refund movements with status `succeeded` are eligible;
- a movement created as `succeeded` and a `pending → succeeded` transition both commit the financial mutation and ERP trigger in the same MongoDB transaction;
- deterministic event IDs (`intevt-payment-{transactionId}-succeeded`) and event-derived idempotency keys prevent duplicate downstream accounting rows across retries/replay;
- ERP events are unavailable to generic webhook subscriptions and are not consumed by CRM;
- exact amount, currency, provider, method/reference and occurrence time come from the immutable local ledger movement;
- external ERP IDs are stored separately in `travel_erp_accounting_links`;
- acknowledgement metadata in `travel_erp_accounting_audit` intentionally excludes amount, currency, provider reference, customer PII and raw HTTP bodies;
- Admin diagnostics are available at `/operator/integrations/erp`;
- ERP acknowledgements cannot mutate reservations, inventory or payment/refund history;
- the generic contract represents accounting-ready movements, not jurisdiction-specific statutory invoices; fiscal identity, invoice numbering and tax mapping require separate authoritative modeling and vendor/market-specific adapters.

Provider-specific payloads must be normalized inside adapters instead of leaking into core domains.

## Architecture

```text
Public catalogue / customer area
        |
TravelRepository + IdentityRepository
        |
BookingRepository (demo / MongoDB / REST v1)
        |
reservations + transactional inventory
        |
PaymentRepository → provider-neutral ledger → Stripe / Redsys / manual
        |                                      |
        |                              succeeded movements
        |                                      |
customer/reservation events                    |
        |                                      |
        +---------- transactional integration outbox ----------+
                                |
                         durable worker
                    /             |              \
             signed webhooks    CRM REST      ERP/accounting REST

Operational failures
        |
structured JSON logs → optional FailureTransport REST → deployment monitoring stack

Operator/Admin
    |
Operations / RBAC / audit / documents / reports / tasks
    |
SupplierFulfilmentAdapter → disabled / REST v1
```

Provider-specific payloads stay inside adapters. Catalogue, booking, accommodation, identity, services, operations, documents, reporting, payment accounting, supplier fulfilment, CRM, ERP/accounting and operational failure transport remain explicit replaceable capability boundaries.

## Reservation and payment states are independent

A reservation is a commercial booking record. A payment transaction is a financial movement. One does not silently rewrite the other.

Examples:

- a reservation can be `confirmed` and still `unpaid`;
- a reservation can be `pending` and already `paid`;
- a cancelled reservation can remain paid until an explicit refund is processed;
- an amendment can increase the reservation total and create an outstanding balance;
- an amendment can decrease the total below net paid and create a refund-review amount.

See [`docs/PAYMENTS.md`](docs/PAYMENTS.md).

## Quick start

Requires **Node.js 24 LTS**.

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

A fresh clone can use the safe demo/read-only modes documented in `.env.example`. Persistent MongoDB, SMTP, payment and integration capabilities are optional.

## Main routes

```text
/                                      landing page
/destinations                          destination catalogue
/destinations/[slug]                   destination detail
/trips                                 trip catalogue
/trips/[slug]                          trip detail
/trips/[slug]/book                     trip booking
/accommodations                        accommodation catalogue
/accommodations/[slug]                 accommodation detail
/services                              services hub
/activities                            public activities
/transport                             public transport services
/insurance                             public travel-protection products
/services/book/[type]/[slug]           independent service booking

/account/sign-in                       customer sign-in
/account                               protected customer account
/account/reservations                  trip reservations
/account/services                      service reservations
/account/traveller-data/[targetType]/[id] post-purchase traveller data
/account/checkout/[targetType]/[id]    unified online checkout

/operator/sign-in                      staff sign-in
/operator                              operations dashboard
/operator/reservations                 trip reservation queue
/operator/service-reservations         service reservation queue
/operator/customers                    customer management
/operator/catalogue                    catalogue management
/operator/media                        media library
/operator/documents                    documents workspace
/operator/reports                      reporting and CSV/XLSX exports
/operator/tasks                        tasks and follow-ups
/operator/fulfilment                   supplier fulfilment queue
/operator/payments                     finance dashboard
/operator/payments/providers           admin-only PSP configuration
/operator/integrations                 admin-only webhooks / integration queue
/operator/integrations/crm             admin-only CRM sync status/audit
/operator/integrations/erp             admin-only ERP/accounting sync status/audit
/operator/integrations/events/[eventId] admin-only integration event diagnostics
/operator/integrations/deliveries/[deliveryId] admin-only delivery/replay diagnostics
/operator/staff                        staff and capability management

/api/health/live                       process liveness probe
/api/health/ready                      configuration/infrastructure readiness probe
/api/internal/integrations/process     server-only scheduled integration worker (POST)
```

## Configuration overview

The full template lives in [`.env.example`](.env.example).

```text
KTRAVEL_PUBLIC_URL=https://travel.kairoseth.com
KTRAVEL_DEPLOYMENT_PROFILE=demo
KTRAVEL_ALLOWED_BROWSER_ORIGINS=
KTRAVEL_TRUST_PROXY_IP_HEADERS=false
MONGODB_URI=
MONGODB_DB_NAME=ktravel
IDENTITY_MODE=demo
STAFF_AUTH_MODE=demo
BOOKING_MODE=demo
REST_BOOKING_BASE_URL=
REST_BOOKING_BEARER_TOKEN=
REST_BOOKING_TIMEOUT_MS=10000
REST_BOOKING_MAX_RESPONSE_BYTES=2000000
OPERATIONS_MODE=demo
SUPPLIER_FULFILMENT_ADAPTER_MODE=disabled
REST_SUPPLIER_FULFILMENT_BASE_URL=
REST_SUPPLIER_FULFILMENT_BEARER_TOKEN=
REST_SUPPLIER_FULFILMENT_TIMEOUT_MS=10000
REST_SUPPLIER_FULFILMENT_MAX_RESPONSE_BYTES=262144
CRM_SYNC_MODE=disabled
REST_CRM_BASE_URL=
REST_CRM_BEARER_TOKEN=
REST_CRM_TIMEOUT_MS=10000
REST_CRM_MAX_RESPONSE_BYTES=262144
ERP_ACCOUNTING_MODE=disabled
REST_ERP_ACCOUNTING_BASE_URL=
REST_ERP_ACCOUNTING_BEARER_TOKEN=
REST_ERP_ACCOUNTING_TIMEOUT_MS=10000
REST_ERP_ACCOUNTING_MAX_RESPONSE_BYTES=262144
FAILURE_TRANSPORT_MODE=disabled
REST_FAILURE_TRANSPORT_URL=
REST_FAILURE_TRANSPORT_BEARER_TOKEN=
REST_FAILURE_TRANSPORT_TIMEOUT_MS=3000
REST_FAILURE_TRANSPORT_MAX_RESPONSE_BYTES=65536
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Kairoseth Travel
KTRAVEL_OPERATIONS_EMAILS=
PAYMENT_SECRETS_KEY=
TRAVELLER_DATA_KEY=
INTEGRATION_SECRETS_KEY=
KTRAVEL_INTEGRATION_WORKER_TOKEN=
INTEGRATION_WORKER_BATCH_SIZE=10
INTEGRATION_WORKER_MIN_INTERVAL_SECONDS=60
INTEGRATION_COMPLETED_RETENTION_DAYS=180
```

`KTRAVEL_DEPLOYMENT_PROFILE=live` turns readiness into a stricter production contract: demo capabilities, invalid canonical HTTPS configuration, unavailable required MongoDB and missing outbound worker authentication make `/api/health/ready` fail with 503. `KTRAVEL_ALLOWED_BROWSER_ORIGINS` accepts exact additional browser origins only. Leave `KTRAVEL_TRUST_PROXY_IP_HEADERS=false` unless the deployment edge strips spoofed forwarding headers and writes trusted client IP values.

`REST_BOOKING_BEARER_TOKEN`, `REST_SUPPLIER_FULFILMENT_BEARER_TOKEN`, `REST_CRM_BEARER_TOKEN`, `REST_ERP_ACCOUNTING_BEARER_TOKEN` and `REST_FAILURE_TRANSPORT_BEARER_TOKEN` are server-only and must never use `NEXT_PUBLIC_*` variables. Production REST booking, supplier, CRM, ERP/accounting and failure-collector targets must use HTTPS. Encryption keys must be stable high-entropy 32-byte keys and should follow the documented staged keyring rotation/re-encryption procedure. `KTRAVEL_INTEGRATION_WORKER_TOKEN` is a separate server-only Bearer credential and must contain at least 32 high-entropy characters. `NEXT_PUBLIC_*` variables are browser-visible and must never contain secrets.

## Documentation

- [`ROADMAP.md`](ROADMAP.md) — current delivery status and next priorities.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capability, event and trust boundaries.
- [`docs/BOOKING.md`](docs/BOOKING.md) — booking integrity and adapter rules.
- [`docs/REST-BOOKING-ADAPTER.md`](docs/REST-BOOKING-ADAPTER.md) — generic external BookingRepository `/v1` contract.
- [`docs/SUPPLIER-FULFILMENT-ADAPTER.md`](docs/SUPPLIER-FULFILMENT-ADAPTER.md) — supplier request/status/cancel contract and audit-before-apply boundary.
- [`docs/CRM-SYNC-ADAPTER.md`](docs/CRM-SYNC-ADAPTER.md) — downstream CRM contract, privacy allowlists, one-queue design, idempotency and audit.
- [`docs/ERP-ACCOUNTING-ADAPTER.md`](docs/ERP-ACCOUNTING-ADAPTER.md) — downstream accounting-movement contract, transactional payment outbox, authority boundary and fiscal-invoice separation.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — staff authorization and workflows.
- [`docs/CATALOGUE-BACKOFFICE.md`](docs/CATALOGUE-BACKOFFICE.md) — persistent catalogue management.
- [`docs/DEPARTURES.md`](docs/DEPARTURES.md) — departure inventory.
- [`docs/MEDIA.md`](docs/MEDIA.md) — media library.
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md) — payment ledger and PSP contract.
- [`docs/TRAVELLER-DATA.md`](docs/TRAVELLER-DATA.md) — post-purchase traveller data.
- [`docs/ACCOMMODATION.md`](docs/ACCOMMODATION.md) — accommodation, occupancy, pricing and room inventory.
- [`docs/TRIP-PACKAGE-ADDONS.md`](docs/TRIP-PACKAGE-ADDONS.md) — package supplements and amendments.
- [`docs/STAFF-PERMISSIONS.md`](docs/STAFF-PERMISSIONS.md) — granular staff capabilities.
- [`docs/BOOKING-DOCUMENTS.md`](docs/BOOKING-DOCUMENTS.md) — booking confirmation PDFs.
- [`docs/DEPARTURE-DOCUMENTS.md`](docs/DEPARTURE-DOCUMENTS.md) — traveller and rooming-list PDFs.
- [`docs/VOUCHERS-DOSSIERS.md`](docs/VOUCHERS-DOSSIERS.md) — vouchers, dossier and supplier-reference disclosure.
- [`docs/REPORTING-EXPORTS.md`](docs/REPORTING-EXPORTS.md) — CSV/XLSX, finance reports and audited protected-data exports.
- [`docs/OUTBOUND-INTEGRATIONS.md`](docs/OUTBOUND-INTEGRATIONS.md) — event contract, signed webhooks, transactional outbox and delivery security.
- [`docs/INTEGRATION-OPERATIONS.md`](docs/INTEGRATION-OPERATIONS.md) — scheduler, replay, queue health, diagnostics and retention.
- [`docs/PRODUCTION-SECURITY.md`](docs/PRODUCTION-SECURITY.md) / [`docs/PRODUCTION-SECURITY.es.md`](docs/PRODUCTION-SECURITY.es.md) — production HTTP, Origin/CSRF, rate-limit, session and readiness baseline.
- [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md) / [`docs/OBSERVABILITY.es.md`](docs/OBSERVABILITY.es.md) — structured operational logging, request correlation and redaction boundary.
- [`docs/FAILURE-TRANSPORT.md`](docs/FAILURE-TRANSPORT.md) / [`docs/FAILURE-TRANSPORT.es.md`](docs/FAILURE-TRANSPORT.es.md) — provider-neutral centralized failure delivery, severity, allowlists and best-effort semantics.
- [`docs/ACCESSIBILITY-OPERATOR.md`](docs/ACCESSIBILITY-OPERATOR.md) / [`docs/ACCESSIBILITY-OPERATOR.es.md`](docs/ACCESSIBILITY-OPERATOR.es.md) — Operator accessibility closeout, live-region/form semantics and manual review boundary.
- [`docs/PERFORMANCE-LOAD-READINESS.md`](docs/PERFORMANCE-LOAD-READINESS.md) / [`docs/PERFORMANCE-LOAD-READINESS.es.md`](docs/PERFORMANCE-LOAD-READINESS.es.md) — consolidated Phase 9D-5 latency, throughput, capacity assumptions and production follow-up.
- [`docs/PERFORMANCE-MUTATION-THROUGHPUT.md`](docs/PERFORMANCE-MUTATION-THROUGHPUT.md) / [`docs/PERFORMANCE-MUTATION-THROUGHPUT.es.md`](docs/PERFORMANCE-MUTATION-THROUGHPUT.es.md) — bounded booking/cancellation contention and post-load correctness.
- [`docs/PERFORMANCE-RUNTIME-RESOURCE.md`](docs/PERFORMANCE-RUNTIME-RESOURCE.md) / [`docs/PERFORMANCE-RUNTIME-RESOURCE.es.md`](docs/PERFORMANCE-RUNTIME-RESOURCE.es.md) — runtime RSS/file-descriptor/thread baseline, bounded spike recovery and capacity guidance.
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — adding integrations.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment model.
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — production review.

## Quality gates

The complete validation command is:

```bash
npm run verify
```

It includes the long-lived domain/security gates plus the current production-hardening checks. The latest critical additions include:

```text
check:production-security
check:mongodb-concurrency
check:payment-idempotency
check:traveller-amendment-validation
check:adapter-contract-validation
check:observability
check:failure-transport
check:external-monitoring
check:privileged-audit
check:encryption-keyring
check:traveller-key-rotation
check:mongodb-recovery
check:mongodb-index-performance
check:privacy-rights
check:privacy-execution
check:privacy-retention-policy
check:accessibility-foundation
check:accessibility-auth
check:accessibility-traveller-privacy
check:accessibility-booking-payment
check:accessibility-operator
check:performance-load
check:performance-authenticated-read
check:performance-mutation-throughput
check:performance-runtime-resource
check:browser-e2e
typecheck
build
```

CI performs a clean install, runs deterministic invariants, type-checks and builds the production application. Dedicated blocking jobs exercise real MongoDB 8 replica sets, local HTTP adapter contracts, privileged-audit rollback, key rotation, backup/restore, query plans, privacy execution, critical accessibility journeys in Chromium and the four performance/load slices: public reads, authenticated reads, bounded mutations and runtime-resource spike recovery. The broad registration → booking → customer → Operator Browser E2E remains a separate informational/non-blocking signal by policy; feature-specific accessibility browser gates are blocking.

## Project status

| Area | Status |
|---|---|
| Foundation, architecture and CI | Done |
| Bilingual catalogue + MongoDB backoffice/media | Done |
| Persistent customer/staff identity and security | Done |
| Trip/service reservations and transactional inventory | Done |
| Traveller records, minors and age pricing | Done |
| Provider-neutral payment ledger and payment terms | Done |
| Stripe/Redsys checkout adapters | Implemented; credentialed E2E validation pending |
| Secure post-purchase traveller data | Done |
| Reservation amendments and financial delta | Done |
| Accommodation and package composition | Done |
| Rich day-to-day Operator workflow | Done |
| Granular staff permissions | Done |
| Booking/departure PDFs, vouchers and dossier | Done |
| CSV/XLSX exports and reconciliation/reporting | Done |
| Phase 7B — Documents, exports and reporting | **Complete** |
| Phase 8 — External integrations | **Complete** |
| Phase 9A — Production security / operability baseline | **Complete** |
| Phase 9B — Critical persistence/concurrency/contract validation baseline | **Complete** |
| Phase 9C — Observability, recovery and privileged audit hardening | **Complete** |
| Phase 9D-1 — Privacy rights and retention review | **Complete** |
| Phase 9D-2 — Access/portability, restriction and controlled erasure | **Complete** |
| Phase 9D-3 — Regulatory retention-policy baseline | **Complete** |
| Phase 9D-4 — Accessibility readiness | **Complete** |
| Phase 9D-5 — Performance/load readiness | **Complete** |
| Phase 9 — Production hardening engineering baseline | **Complete; provider credentialed validation pending** |
| Phase 10 — Open-source productisation | **Next** |

Future work is tracked in **[ROADMAP.md](ROADMAP.md)** · **[ROADMAP.es.md](ROADMAP.es.md)**.

## Next development priority

The next block is **Phase 10 — Open-source productisation**.

The production-hardening engineering baseline is complete. The next work should make a fresh public clone easier to adopt, extend and release without mixing Kairoseth-only infrastructure into the MIT core:

- validate a clean demo seed/setup from a fresh clone;
- publish a fresh-clone install/deployment path and an optional Docker/self-host reference;
- formalize reference adapters and extension contracts for external capabilities;
- define versioned release and migration conventions;
- add contribution templates and public API/extension documentation;
- document trademark/branding rules for the open-source core versus Kairoseth Travel;
- keep proprietary Kairoseth/customer adapters outside the public core where appropriate.

Credentialed Stripe/Redsys TEST/LIVE E2E remains an external-dependency production-hardening requirement and should be inserted as soon as suitable provider accounts are available.