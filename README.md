# Open Travel Platform

<p align="center"><strong>English</strong> · <a href="./README.es.md">Español</a></p>

> Reusable open-source travel platform foundation for agencies, tour operators and booking products.

Open Travel Platform is a clean-room **Next.js + TypeScript + MongoDB** platform built around explicit domain, repository and adapter boundaries. It can run with bundled demo data for local evaluation or with persistent catalogue, identity, booking, accommodation, services, operations and payment capabilities.

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
- export audit metadata without persisting exported cell values;
- currency-safe finance dashboards and reports that never aggregate different currencies together.

Stripe and Redsys credentialed end-to-end validation remains intentionally pending until suitable provider accounts are available. The adapters are implemented, but production payment capability is not considered validated until provider TEST/LIVE flows have been exercised.

**Phase 7B — Documents, exports and reporting is complete: booking confirmations, traveller/rooming lists, vouchers/dossiers, CSV/XLSX exports, reconciliation and reporting are implemented. The next delivery phase is Phase 8 — External integrations.**

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
- audited permission changes.

### Identity and security

- persistent customer registration and sessions;
- separate staff Operator/Admin authentication;
- customer/staff session separation;
- account lockout after repeated failures;
- password change and SMTP recovery;
- authentication audit events;
- payment-provider secrets encrypted with AES-256-GCM;
- advanced traveller data stored separately and encrypted with AES-256-GCM;
- privileged configuration and sensitive data protected by server-side capabilities.

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
- finance dashboard totals grouped by currency, never cross-currency summed.

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
- protected traveller-data export requires both Traveller data and Reservations capabilities, an active reservation and an explicit operational reason;
- protected traveller export is POST-only and fail-closed: persistent audit must succeed before sensitive bytes are returned;
- financial metrics and revenue groups remain separated by currency.

## Architecture

```text
Public catalogue
      |
TravelRepository
      |
destinations + trips + accommodation + services
      |
      +---------------- trip departures / inventory
      |                         |
      |                  BookingRepository
      |                         |
      |                 trip reservations
      |                         |
      |                 accommodation booking
      |                         |
      |                  room inventory
      |
      +---------------- independent services
                                |
                    service availability/reservations
                                |
                         PaymentRepository
                                |
                    provider-neutral ledger
                          /             \
                     Stripe             Redsys

customer area ---------------------- staff/operator/admin
     |                                      |
IdentityRepository                 Operations / RBAC / audit
                                           |
                     documents / reports / fulfilment / tasks
```

Provider-specific payloads stay inside adapters. Catalogue, booking, accommodation, identity, services, operations, documents, reporting and payment accounting remain replaceable capability boundaries.

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

A fresh clone can use the safe demo/read-only modes documented in `.env.example`. Persistent MongoDB, SMTP and payment capabilities are optional integrations.

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
/operator/staff                        staff and capability management
```

## Configuration overview

The full template lives in [`.env.example`](.env.example).

```text
KTRAVEL_PUBLIC_URL=https://travel.kairoseth.com
MONGODB_URI=
MONGODB_DB_NAME=ktravel
IDENTITY_MODE=demo
STAFF_AUTH_MODE=demo
BOOKING_MODE=demo
OPERATIONS_MODE=demo
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Kairoseth Travel
KTRAVEL_OPERATIONS_EMAILS=
PAYMENT_SECRETS_KEY=
TRAVELLER_DATA_KEY=
```

`PAYMENT_SECRETS_KEY` and `TRAVELLER_DATA_KEY` should be stable high-entropy 32-byte keys. Do not rotate them without a migration plan. Stripe/Redsys credentials are managed from Admin. `NEXT_PUBLIC_*` variables are browser-visible and must never contain secrets.

## Documentation

- [`ROADMAP.md`](ROADMAP.md) — current delivery status and next priorities.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capability and trust boundaries.
- [`docs/BOOKING.md`](docs/BOOKING.md) — booking integrity and adapter rules.
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
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — adding integrations.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment model.
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — production review.

## Quality gates

The complete validation command is:

```bash
npm run verify
```

It currently includes:

```text
check:safety
check:ux
check:release
check:amendments
check:accommodation
check:package-addons
check:package-addon-amendments
check:operations
check:tasks
check:fulfilment
check:operations-queue
check:staff-permissions
check:booking-documents
check:departure-documents
check:voucher-documents
check:reporting-exports
typecheck
build
```

CI performs a clean install, runs the invariant checks, type-checks, builds the production application, runs HTTP smoke validation and audits dependencies.

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
| Booking confirmation PDFs | Done |
| Traveller manifests and rooming-list PDFs | Done |
| Vouchers and printable reservation dossier | Done |
| CSV/XLSX exports and reconciliation/reporting | Done |
| Phase 7B — Documents, exports and reporting | **Complete** |

Future work is tracked in **[ROADMAP.md](ROADMAP.md)** · **[ROADMAP.es.md](ROADMAP.es.md)**.

## Next development priority

The next block is **Phase 8 — External integrations**. The core should now connect to real business ecosystems through provider-neutral adapters without leaking provider payloads into core domains.

Initial adapter priorities are:

- supplier/booking APIs;
- generic outbound webhooks;
- CRM synchronization;
- ERP/accounting integration;
- CMS/catalogue sources;
- generic REST booking adapter;
- additional payment providers where commercially useful.

Credentialed Stripe/Redsys TEST/LIVE validation should be inserted as soon as suitable provider accounts are available and does not need to block Phase 8 adapter work.

## Project principles

- clean-room implementation;
- provider-neutral capability interfaces;
- server-authorized customer and staff operations;
- server-validated pricing, inventory, ownership and state transitions;
- historical snapshots preserve contracted traveller, accommodation, package and financial values;
- reservation state remains separate from payment state;
- advanced traveller data is collected only after purchase when required;
- inventory-controlled services remain independent from lightweight package supplements;
- customer-safe documents exclude internal notes, protected traveller data and supplier costs;
- sensitive exports are capability-gated, purpose-bound and persistently audited before delivery;
- public UX is bilingual, responsive and free of internal development terminology;
- proprietary Kairoseth/customer-specific integrations stay outside the MIT core when appropriate.

## License

MIT. See [`LICENSE`](LICENSE).
