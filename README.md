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

The project is now beyond a basic catalogue/booking MVP. The current implementation includes:

- bilingual public catalogue and Operator backoffice;
- MongoDB persistence;
- customer and staff authentication with RBAC;
- trip departures and transactional inventory;
- traveller records, minors and age-based pricing;
- independent activities, transport and travel-protection products;
- independent service availability and reservations;
- payment ledger, payment terms, deposits and installments;
- Stripe and Redsys adapters behind a provider-neutral checkout layer;
- encrypted post-purchase traveller data;
- reservation amendments with audit history and safe inventory reallocation;
- reusable accommodation with room types, occupancy, pricing, media galleries and inventory;
- accommodation linked to trips and reserved transactionally with trip bookings;
- seasonal/occupancy accommodation pricing;
- optional package supplements priced and snapshotted inside trip reservations.

Stripe and Redsys credentialed end-to-end validation is intentionally deferred until suitable provider accounts are available. The adapters and checkout architecture are implemented, but production payment capability must not be considered validated until provider TEST/LIVE flows have been exercised.

## Current capabilities

### Public catalogue and commerce

- bilingual EN/ES public experience;
- destinations and trips with localized content;
- public trip departures and live availability;
- public accommodation catalogue and detail pages;
- property galleries and room-specific galleries;
- public independent **Activities**, **Transport** and **Travel protection** catalogues;
- service detail pages with availability and pricing;
- trip booking with traveller composition, accommodation and optional package extras;
- customer authentication only when required for account/reservation flows.

### Catalogue backoffice

- protected Operator/Admin catalogue management;
- destinations and trips;
- accommodations and room types;
- cover images, galleries, GridFS media library and focal-point controls;
- property and room galleries;
- structured multilingual itineraries;
- trip departures, capacities and inventory;
- room inventory periods;
- room occupancy rules;
- room base rates and meal plans;
- seasonal and occupancy pricing rules;
- trip ↔ accommodation links;
- optional package supplements;
- independent activity, transport and travel-protection products;
- service pricing models: per person, per booking, per unit and age-based;
- service availability/inventory calendars for activities and transport;
- draft/published lifecycle;
- per-product post-purchase traveller-data requirements.

### Travellers and pricing

- lead traveller and individual traveller records;
- date of birth and nationality;
- age calculated against the relevant departure/service/check-in date;
- configurable age bands;
- server-authoritative traveller pricing;
- per-departure traveller-price overrides;
- guardian relationship required for minors;
- configurable inventory consumption by age band;
- historical pricing snapshots;
- optional encrypted post-purchase identity/document/residence data;
- retention deadlines and MongoDB TTL deletion.

### Accommodation and package composition

Accommodation is a reusable domain, not embedded inside one trip.

- one accommodation can be used by multiple trips;
- one trip can contain multiple linked stays;
- room types support single/double/twin/triple/family/suite/other classification;
- meal plans and base nightly rates;
- adult/child occupancy limits;
- room inventory by period;
- property gallery plus independent room galleries;
- seasonal fixed/percentage adjustments;
- occupancy rules including single supplements and child-sharing adjustments;
- package reference pricing by departure;
- automatic room allocation from real travellers during booking;
- minimum valid room count selection;
- transactional room inventory reservation/release together with trip inventory;
- included accommodation is snapshotted without being charged twice;
- optional accommodation is added to the reservation total;
- departure amendments reprice and reallocate accommodation safely;
- accommodation snapshots remain stable even if later catalogue values change.

### Optional package supplements

Trips can contain lightweight commercial extras that do **not** need their own dated inventory.

Examples: luggage upgrade, private upgrade, special dinner or other non-capacity supplement.

- bilingual EN/ES titles/descriptions;
- charge once per booking or per selected traveller;
- enable/disable customer availability;
- server-authoritative selection and pricing;
- disabled, unknown or manipulated selections are rejected;
- customer booking shows supplements separately from accommodation;
- reservation snapshots store title, pricing mode, unit price, quantity, traveller IDs and total;
- later catalogue price changes do not alter existing bookings;
- departure changes preserve the contracted supplement snapshot.

Capacity-based activities, dated transport and other inventory-controlled services remain independent service reservations rather than package supplements.

### Reservations and amendments

- persistent trip reservations with capacity control;
- persistent independent service reservations;
- service reservations may link to a Kairoseth trip or remain independent;
- inventory reservation/release protected transactionally where applicable;
- customer reservation/service history;
- Operator trip/service queues;
- confirm/cancel workflows and audit history;
- traveller corrections recorded as amendments;
- departure changes reserve new capacity before releasing old capacity;
- accommodation inventory moves inside the same amendment transaction;
- financial delta derives from the new reservation total without rewriting historical ledger movements;
- overpayment creates a controlled refund-review state rather than automatic refunds;
- configurable modification/cancellation deadlines;
- customer notifications for configured material changes;
- linked services remain independent reservation records with their own conditions.

### Identity and security

- persistent customer registration and sessions;
- separate staff operator/admin authentication and RBAC;
- customer/staff session separation;
- account lockout after repeated failures;
- password change and password recovery;
- SMTP password-reset emails;
- authentication audit events;
- privileged payment-provider configuration restricted to admins;
- payment-provider secrets encrypted with AES-256-GCM;
- advanced traveller data stored separately and encrypted with AES-256-GCM.

### Transactional email

- SMTP using a server-side mail transport;
- reservation received emails;
- reservation confirmed/cancelled notifications;
- traveller and pricing breakdowns;
- configured amendment notifications;
- service reservation notifications;
- password recovery email flow.

### Payments and finance

- provider-neutral payment/refund ledger;
- reservation state and payment state remain independent;
- unpaid / pending / partially paid / paid / partially refunded / refunded summaries;
- manual bank-transfer, cash and external-terminal movements;
- controlled refunds and reconciliation protections;
- same ledger for trip and service reservations;
- unified checkout architecture;
- Stripe Checkout adapter with signed webhook verification and idempotency;
- Redsys redirect adapter with signed server-notification validation;
- browser returns are never trusted as payment confirmation;
- admin-managed TEST/LIVE provider profiles;
- full-payment, deposit and installment snapshots;
- server-derived outstanding balances and next-payment schedules;
- reservation amendments can create additional balance or refund-review amounts without rewriting old transactions.

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
```

Provider-specific payloads stay inside adapters. Catalogue, booking, accommodation, identity, service reservations, operations and payment accounting remain replaceable capability boundaries.

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
/activities/[slug]                     activity detail
/transport                             public transport services
/transport/[slug]                      transport detail
/insurance                             public travel-protection products
/insurance/[slug]                      protection detail
/services/book/[type]/[slug]           independent service booking

/account/sign-in                       customer sign-in
/account                               protected customer account
/account/reservations                  trip reservations
/account/reservations/[id]             reservation + travellers + accommodation + extras + finance
/account/services                      service reservations
/account/services/[id]                 service reservation detail
/account/traveller-data/[targetType]/[id] post-purchase traveller data
/account/checkout/[targetType]/[id]    unified online checkout
/account/security                      customer security

/operator/sign-in                      staff sign-in
/operator                              operations dashboard
/operator/reservations                 trip reservation queue
/operator/service-reservations         service reservation queue
/operator/customers                    customer management
/operator/catalogue                    catalogue management
/operator/catalogue/accommodations     accommodation management
/operator/media                        media library
/operator/payments                     finance dashboard
/operator/payments/providers           admin-only PSP configuration
/operator/security                     staff security
/operator/staff                        admin staff management
```

## Configuration overview

The full template lives in [`.env.example`](.env.example).

Important server-side capabilities include:

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

`PAYMENT_SECRETS_KEY` and `TRAVELLER_DATA_KEY` should be stable high-entropy 32-byte keys. Do not rotate them without a migration plan because they protect persisted encrypted records.

Stripe/Redsys credentials are managed from the Admin UI and are not required as environment variables.

`NEXT_PUBLIC_*` variables are browser-visible and must never contain secrets.

## Persistent data

MongoDB-backed deployments keep capability boundaries in separate collections, including catalogue, departures, trip reservations, accommodation/inventory, service catalogue/availability/reservations, payment transactions, audit history, identity/authentication, provider configuration and encrypted traveller data.

Infrastructure credentials and sensitive implementation details are intentionally kept out of the public/Operator UI.

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
- [`docs/PACKAGE-SUPPLEMENTS.md`](docs/PACKAGE-SUPPLEMENTS.md) — optional package extras and reservation snapshots.
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — adding integrations.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment model.
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — production review.

## Quality gates

```bash
npm run check:safety
npm run check:ux
npm run check:release
npm run check:amendments
npm run check:accommodation
npm run check:supplements
npm run typecheck
npm run build
npm run verify
```

CI resolves the dependency lock, performs a clean install, runs public-safety/UX/release checks, validates reservation-amendment, accommodation and package-supplement invariants, type-checks, builds the production app, runs HTTP smoke tests and performs a dependency audit.

## Project status

| Area | Status |
|---|---|
| Foundation, architecture and CI | Done |
| Bilingual public catalogue | Done |
| MongoDB catalogue backoffice and media | Done |
| Persistent customer/staff identity and security | Done |
| Trip reservations and departure inventory | Done |
| Traveller records, minors and age pricing | Done |
| Independent activities / transport / travel protection | Done |
| Independent service availability and reservations | Done |
| Operator/admin workflows and audit foundation | Done |
| Transactional email | Done |
| Provider-neutral payment ledger | Done |
| Admin TEST/LIVE Stripe and Redsys configuration | Done |
| Unified Stripe/Redsys checkout adapters | Implemented; credentialed E2E validation pending |
| Deposits / installments / payment terms | Done |
| Secure post-purchase traveller data | Done |
| Reservation amendments, financial delta and deadlines | Done |
| Accommodation catalogue, rooms, galleries and inventory | Done |
| Seasonal / occupancy accommodation pricing | Done |
| Transactional accommodation inside trip booking | Done |
| Optional package supplements | Done |
| Rich day-to-day Operator workflow | **Next** |

Future work is tracked in **[ROADMAP.md](ROADMAP.md)** · **[ROADMAP.es.md](ROADMAP.es.md)**.

## Next development priority

The next major block is **Phase 7A — Rich operations workflow**.

The goal is to turn Operator from a strong reservation-management backoffice into a complete daily operations workspace:

- assign an owner/operator to each reservation;
- internal notes that are never exposed to customers;
- tasks and follow-ups with due dates;
- reservation priority and tags;
- richer operational timeline;
- supplier/fulfilment status tracking;
- customer contact history;
- stronger reservation search, filters and pagination;
- safe bulk actions;
- more granular permissions beyond the current operator/admin split.

A small package-amendment extension — adding/removing package supplements after booking with the existing financial-delta engine — can be implemented at the start of Phase 7A because it is primarily an Operator workflow on top of the completed reservation/pricing foundations.

## Project principles

- clean-room implementation;
- provider-neutral capability interfaces;
- server-authorized customer and staff operations;
- server-validated pricing, inventory, ownership and state transitions;
- historical snapshots preserve contracted traveller, accommodation, package and financial values;
- reservation state remains separate from payment state;
- advanced traveller data is collected only after purchase when required;
- inventory-controlled services remain independent from lightweight package supplements;
- public UX is bilingual, responsive and free of internal development terminology;
- proprietary Kairoseth/customer-specific integrations stay outside the MIT core when appropriate.

## License

MIT. See [`LICENSE`](LICENSE).
