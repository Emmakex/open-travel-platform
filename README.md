# Open Travel Platform

<p align="center"><strong>English</strong> · <a href="./README.es.md">Español</a></p>

> Reusable open-source travel platform foundation for agencies, tour operators and booking products.

Open Travel Platform is a clean-room Next.js + TypeScript platform built around explicit domain, repository and adapter boundaries. It can run with bundled demo data for local evaluation or use persistent MongoDB-backed catalogue, identity, booking, service, operations and payment capabilities.

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

## Live reference deployment

**[travel.kairoseth.com](https://travel.kairoseth.com)** is used to validate the platform end to end.

The current reference deployment includes persistent catalogue/media management, customer and staff authentication, reservation operations, traveller records, independent travel services, inventory, transactional email, payment accounting and admin-managed payment-provider configuration.

Stripe and Redsys adapters plus the unified online checkout are already implemented in the codebase, but credentialed end-to-end payment testing is intentionally deferred until suitable provider accounts are available. No payment provider is enabled automatically.

## Current capabilities

### Public catalogue and commerce

- bilingual EN/ES public experience;
- destinations and trips with localized content;
- public trip departures and live availability;
- public independent **Activities**, **Transport** and **Insurance** catalogues without login;
- service detail pages with availability and pricing;
- customer login/registration only when needed for account/reservation flows.

### Catalogue backoffice

- protected Operator/Admin catalogue management;
- destinations and trips;
- cover images, galleries, GridFS media library and focal-point controls;
- structured multilingual itineraries;
- trip departures, capacities and inventory;
- independent activity, transport and insurance products;
- service pricing models: per person, per booking, per unit and age-based;
- service availability/inventory calendars for activities and transport;
- draft/published lifecycle.

### Travellers and pricing

- lead traveller and individual traveller records;
- date of birth and nationality;
- age calculated against the departure/service date;
- configurable age bands (for example infant/child/youth/adult);
- server-authoritative traveller pricing;
- per-departure traveller-price overrides;
- guardian relationship required for minors;
- configurable inventory consumption by age band (for example infants can be free and consume no seat);
- pricing snapshots stored with reservations so historical bookings do not change when catalogue prices change.

### Reservations and services

- persistent trip reservations with capacity control;
- persistent independent service reservations for activities, transport and insurance;
- service reservations can optionally link to a Kairoseth trip or remain completely independent for externally booked travel;
- inventory reservation/release protected transactionally where applicable;
- customer reservation/service history;
- customer account prioritizes the actual next future trip and only falls back to catalogue recommendations when no future trip exists;
- operator queues for trip reservations and service reservations;
- confirm/cancel workflows and operational audit history.

### Identity and security

- persistent customer registration and sessions;
- separate staff operator/admin authentication and RBAC;
- customer/staff session separation;
- account lockout after repeated failures;
- password change and password recovery;
- SMTP password-reset emails;
- authentication audit events;
- active-session role indicator in the frontend;
- privileged payment-provider configuration restricted to admins.

### Transactional email

- SMTP using a server-side mail transport;
- reservation received emails;
- reservation confirmed/cancelled notifications;
- traveller and pricing breakdowns in customer emails;
- password recovery email flow.

### Payments and finance

- provider-neutral payment/refund ledger;
- independent reservation and payment states;
- unpaid / pending / partially paid / paid / partially refunded / refunded summaries;
- manual bank-transfer, cash and external-terminal movements;
- manual refunds and reconciliation protections;
- service reservations supported by the same payment ledger;
- unified checkout architecture for trips and services;
- Stripe Checkout adapter with signed webhook verification and idempotent processing;
- Redsys redirect adapter with signed server notification validation;
- browser return URLs are never trusted as payment confirmation;
- admin-managed TEST/LIVE payment profiles;
- Stripe/Redsys secrets encrypted at rest with AES-256-GCM;
- provider credentials are never returned to the browser after saving;
- adapters are designed so additional PSPs can be introduced without rewriting booking logic.

## Architecture

```text
                         Public catalogue
                               |
                        TravelRepository
                               |
                    destinations + trips
                               |
                    departures / inventory
                               |
                        BookingRepository
                               |
                         trip reservations

       public services ------------------------------+
          |                                           |
   activities / transport / insurance                |
          |                                           |
   service availability                              |
          |                                           |
   service reservations                              |
          |                                           |
          +-------------------+-----------------------+
                              |
                       PaymentRepository
                              |
                    provider-neutral ledger
                              |
                    unified checkout layer
                       /              \
                  Stripe              Redsys
                       \              /
                    signed callbacks

 customer area ---------------- staff/operator/admin
      |                                  |
 IdentityRepository              Operations / RBAC
```

Provider-specific payloads stay inside adapters. Catalogue, booking, identity, service reservations, operations and payment accounting remain replaceable capability boundaries.

## Reservation and payment states are independent

A reservation is a commercial booking record. A payment transaction is a financial movement. One does not silently mutate the other.

Examples:

- a reservation can be `confirmed` and still `unpaid`;
- a reservation can be `pending` and already `paid`;
- a cancelled reservation can remain paid until an explicit refund is processed.

Payment summaries currently derive:

```text
unpaid
pending
partially_paid
paid
partially_refunded
refunded
```

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
/services                              services hub
/activities                            public activities
/activities/[slug]                     activity detail
/transport                             public transport services
/transport/[slug]                      transport detail
/insurance                             public insurance products
/insurance/[slug]                      insurance detail
/services/book/[type]/[slug]           independent service booking

/account/sign-in                       customer sign-in
/account                               protected customer account
/account/reservations                  trip reservations
/account/reservations/[id]             trip reservation + finance
/account/services                      service reservations
/account/services/[id]                 service reservation detail
/account/checkout/[targetType]/[id]    unified online checkout
/account/security                      customer security

/operator/sign-in                      staff sign-in
/operator                              operations dashboard
/operator/reservations                 trip reservation queue
/operator/service-reservations         service reservation queue
/operator/customers                    customer management
/operator/catalogue                    catalogue management
/operator/media                        media library
/operator/payments                     finance dashboard
/operator/payments/providers           admin-only PSP configuration
/operator/security                     staff security
/operator/staff                        admin staff management
```

## Configuration overview

The complete template lives in [`.env.example`](.env.example).

Important server-side capabilities include:

```text
# Public URL
KTRAVEL_PUBLIC_URL=https://travel.kairoseth.com

# Persistence
MONGODB_URI=
MONGODB_DB_NAME=ktravel

# Identity / booking / operations
IDENTITY_MODE=demo
STAFF_AUTH_MODE=demo
BOOKING_MODE=demo
OPERATIONS_MODE=demo

# SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Kairoseth Travel
KTRAVEL_OPERATIONS_EMAILS=

# Encrypts payment-provider secrets stored by Admin
PAYMENT_SECRETS_KEY=
```

`PAYMENT_SECRETS_KEY` should be a stable high-entropy 32-byte key (for example generated with `openssl rand -base64 32`). Do not rotate it without a migration plan because it protects the PSP credentials stored by the application.

Stripe/Redsys credentials themselves are managed from the admin UI and are not required as environment variables.

`NEXT_PUBLIC_*` variables are browser-visible and must never contain secrets.

## Persistent data

MongoDB-backed deployments use separate collections for capability boundaries, including reservations, departures, service catalogue/availability/reservations, payment transactions, operations audit, authentication data and payment-provider configuration.

Infrastructure-specific collection names and credentials are intentionally not exposed in the Operator UI.

## Integration and production docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capability and trust boundaries.
- [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) — generic catalogue REST contract.
- [`docs/IDENTITY.md`](docs/IDENTITY.md) — identity modes and replacement rules.
- [`docs/BOOKING.md`](docs/BOOKING.md) — booking integrity and adapter rules.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — staff authorization and workflows.
- [`docs/CATALOGUE-BACKOFFICE.md`](docs/CATALOGUE-BACKOFFICE.md) — persistent catalogue management.
- [`docs/DEPARTURES.md`](docs/DEPARTURES.md) — departure inventory model.
- [`docs/MEDIA.md`](docs/MEDIA.md) — media library and upload model.
- [`docs/TRANSACTIONAL-EMAILS.md`](docs/TRANSACTIONAL-EMAILS.md) — SMTP notifications.
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md) — payment ledger and PSP integration contract.
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — adding integrations.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment model.
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — production review.

## Quality gates

```bash
npm run check:safety
npm run check:release
npm run typecheck
npm run build
npm run verify
```

CI resolves the dependency lock, performs a clean install, validates release consistency, type-checks, builds the production app, runs representative HTTP smoke tests and performs a dependency audit.

## Project status

| Area | Status |
|---|---|
| Foundation, architecture and CI | Done |
| Bilingual public catalogue | Done |
| MongoDB catalogue backoffice and media | Done |
| Persistent customer/staff identity and security | Done |
| Trip reservations and departure inventory | Done |
| Traveller records, minors and age pricing | Done (advanced travel-document requirements remain) |
| Independent activities / transport / insurance catalogue | Done |
| Independent service availability and reservations | Done |
| Operator/admin workflows and audit | Done |
| Transactional email | Done |
| Provider-neutral payment ledger | Done |
| Admin TEST/LIVE Stripe and Redsys configuration | Done |
| Unified Stripe/Redsys checkout adapters | Implemented; credentialed E2E validation pending |
| Deposits / installments / payment terms | **Next** |

Future work is tracked in **[ROADMAP.md](ROADMAP.md)** · **[ROADMAP.es.md](ROADMAP.es.md)**.

## Next development priority

The next major block is **deposits, installments and payment terms**:

- full payment vs deposit;
- fixed or percentage deposit;
- deposit/final-balance due dates;
- optional installment schedules;
- outstanding-balance calculations;
- reminder emails and overdue visibility;
- payment-term snapshots stored with each reservation.

This work can be completed on top of the current ledger before Stripe/Redsys credentials are available.

## Project principles

- clean-room implementation;
- provider-neutral capability interfaces;
- server-authorized customer and staff operations;
- server-validated pricing, inventory, ownership and state transitions;
- traveller and financial snapshots preserve historical bookings;
- reservation state separated from payment state;
- secrets remain server-side and encrypted when persisted;
- no mandatory hosting, CMS, auth, CRM, payment or supplier vendor;
- MIT-licensed open-source core.

## License and reuse

This repository is released under the **MIT License**.

MIT permits people and companies to use, copy, modify, merge, publish, distribute, sublicense and sell software based on this code, including commercial and closed-source derivative products, provided the required copyright and permission notice is retained.

Downstream users are not required to publish their modifications. The software is provided without warranty, as stated in [`LICENSE`](LICENSE).

This permissive model is intentional for the open-source foundation. Commercial Kairoseth services, private integrations, hosted environments, credentials, customer data and other assets can remain separate from this repository.

MIT © 2026 Eduardo Yauri. See [`LICENSE`](LICENSE).
