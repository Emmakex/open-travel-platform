# Open Travel Platform

<p align="center"><strong>English</strong> · <a href="./README.es.md">Español</a></p>

> Reusable open-source travel platform foundation for agencies, tour operators and booking products.

Open Travel Platform is a clean-room Next.js + TypeScript project built around explicit domain and repository boundaries. It can run with bundled fictional data for local evaluation, or use persistent MongoDB-backed catalogue, identity, booking, operations and payment-ledger capabilities.

The public reference deployment is branded as **Kairoseth Travel** and is available at **[travel.kairoseth.com](https://travel.kairoseth.com)**.

![Version](https://img.shields.io/badge/version-1.0.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![MongoDB](https://img.shields.io/badge/MongoDB-supported-47A248)
![License](https://img.shields.io/badge/license-MIT-45d6b5)
[![Live reference](https://img.shields.io/badge/live-travel.kairoseth.com-45d6b5)](https://travel.kairoseth.com)

## Live reference deployment

**[travel.kairoseth.com](https://travel.kairoseth.com)** is the reference implementation used to validate the platform end to end.

The current deployment demonstrates persistent catalogue and media management, customer and staff authentication, booking inventory, reservation operations, transactional email and the provider-neutral payment ledger. Content and payment movements used while developing/testing the reference deployment should still be treated as non-production test data unless the deployment owner explicitly enables a production integration.

A live card payment gateway is **not** part of the current open-source core yet. Phase 5A provides the financial ledger and operator workflow required to connect Stripe, Redsys or another PSP without coupling booking records to one provider.

## Current capabilities

- **Bilingual interface** — English and Spanish across the public catalogue, customer account and operator surfaces.
- **Catalogue** — destinations, trips, localized content, search/filtering and publication state through `TravelRepository`.
- **Catalogue backoffice** — create/edit destinations and trips from the protected operator area.
- **Media library** — persistent uploads, reusable media selection, cover images, metadata and focal-point controls.
- **Departures & inventory** — persistent departure windows, capacity, reserved spaces and availability validation.
- **Customer identity** — persistent registration/sign-in and protected customer sessions with MongoDB mode.
- **Staff identity** — operator/admin authentication, protected sessions, password flows and role checks.
- **Booking** — persistent reservations with server-authoritative price, inventory and ownership validation.
- **Operations** — protected reservation queue, confirm/cancel transitions and audit history.
- **Customers** — operator CRM-style customer list, profile detail and reservation value summary.
- **Transactional email** — SMTP notifications for reservation receipt and reservation status changes.
- **Payments foundation (Phase 5A)** — provider-neutral payment/refund ledger, payment summaries, manual payment/refund recording, operator finance dashboard and customer payment history.
- **Release quality** — source-safety checks, TypeScript, production build, HTTP smoke tests and dependency audit in CI.

## Architecture

```text
                         Public catalogue
                               |
                        TravelRepository
                               |
                  demo / REST API / MongoDB
                               |
                    destinations + trips
                               |
                    departures / inventory
                               |
                        BookingRepository
                               |
                         reservations
                          /          \
                         /            \
                customer area      staff operations
                    |                    |
            IdentityRepository   OperationsRepository
                    |                    |
          demo / MongoDB auth      audit + workflows
                         \            /
                          \          /
                           reservation
                               |
                        PaymentRepository
                               |
                  provider-neutral ledger
                               |
             manual / Stripe / Redsys / future PSP
```

Provider-specific payloads stay inside adapters. Catalogue, booking, identity, operations and payment accounting remain separate so integrations can be replaced independently.

## Reservation and payment states are independent

A reservation is a commercial booking record. A payment transaction is a financial movement. The project deliberately does not make one state automatically authoritative for the other.

Examples:

- a reservation can be `confirmed` and still `unpaid`;
- a reservation can be `pending` and already `paid`;
- a cancelled reservation can remain paid until an explicit refund is recorded or completed by the PSP.

The payment ledger currently derives:

```text
unpaid
pending
partially_paid
paid
partially_refunded
refunded
```

See [`docs/PAYMENTS.md`](docs/PAYMENTS.md) for the full model.

## Open-source core vs Kairoseth Travel

This repository is intentionally a **reusable open-source foundation**. Kairoseth Travel is the public reference deployment and product showcase built from that foundation.

That distinction allows the project to evolve in two directions at the same time:

- the **open-source repository** can remain useful to developers, agencies and travel companies;
- Kairoseth can build commercial hosting, support, private connectors, customer-specific integrations, content and operational services around the same core.

Private credentials, customer data and deployment-specific proprietary services do not belong in the public repository.

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

A fresh clone can use the safe demo/read-only modes documented in `.env.example`. MongoDB, SMTP and persistent write modes are optional integrations.

## Main routes

```text
/                                landing page
/destinations                    destination catalogue
/destinations/[slug]             destination detail
/trips                           searchable/filterable trips
/trips/[slug]                    trip detail
/trips/[slug]/book               availability + reservation

/account/sign-in                 customer sign-in
/account                         protected customer account
/account/reservations            reservation history
/account/reservations/[id]       reservation + payment detail

/operator/sign-in                staff sign-in
/operator                        operations dashboard
/operator/reservations           reservation queue
/operator/reservations/[id]      reservation + audit + payments
/operator/customers              customer management
/operator/catalogue              catalogue management
/operator/media                  media library
/operator/payments               financial/payment dashboard
/operator/security               staff security
/operator/staff                  admin staff management
```

## Configuration overview

The complete template lives in [`.env.example`](.env.example). Important capability switches include:

```text
# Public / catalogue
NEXT_PUBLIC_SITE_NAME=Open Travel Platform
NEXT_PUBLIC_SITE_TAGLINE=Build travel products without vendor lock-in.
KTRAVEL_PUBLIC_URL=https://travel.kairoseth.com
NEXT_PUBLIC_DATA_MODE=demo
TRAVEL_DATA_MODE=demo
NEXT_PUBLIC_TRAVEL_API_URL=

# Persistence
MONGODB_URI=
MONGODB_DB_NAME=ktravel

# Identity
IDENTITY_MODE=demo
STAFF_AUTH_MODE=demo
DEMO_IDENTITY_ENABLED=false

# Booking / operations
BOOKING_MODE=demo
OPERATIONS_MODE=demo
DEMO_BOOKING_ENABLED=false
DEMO_OPERATIONS_ENABLED=false

# SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Kairoseth Travel
KTRAVEL_OPERATIONS_EMAILS=

# Optional payment ledger override
# PAYMENT_LEDGER_MODE=mongodb
```

`NEXT_PUBLIC_*` variables are browser-visible and must never contain secrets. Database, authentication, SMTP and payment credentials must remain server-side.

When `PAYMENT_LEDGER_MODE` is omitted, the current payment layer automatically follows MongoDB booking mode when `BOOKING_MODE=mongodb`.

## MongoDB collections

The persistent adapters currently use collections such as:

```text
travel_reservations
travel_departures
travel_payment_transactions
travel_operations_audit
travel_staff_users
travel_staff_sessions
```

Catalogue, media and customer identity adapters use their own persistent collections as documented in the corresponding implementation/docs.

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
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md) — payment ledger and future PSP integration contract.
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — adding real integrations.
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

CI resolves the dependency lock, performs a clean install, validates release consistency, type-checks, builds the production application, runs representative HTTP smoke tests and performs a dependency audit.

## Project principles

- Clean-room implementation.
- Provider-neutral capability interfaces.
- Server-authorized customer and staff operations.
- Server-validated pricing, inventory, ownership and state transitions.
- Persistent adapters without forcing one vendor for every capability.
- Reservation state separated from payment state.
- Production-safe defaults and server-only secrets.
- No mandatory hosting, CMS, auth, CRM, payment or supplier vendor.
- MIT licensed open-source core.

## Project status

| Area | Status |
|---|---|
| Foundation, architecture and CI | Done |
| Catalogue and discovery | Done |
| MongoDB catalogue backoffice | Done |
| Media library | Done |
| Persistent customer/staff identity | Done |
| Reservations and departure inventory | Done |
| Operator/admin workflows and audit | Done |
| Transactional email | Done |
| Phase 5A — provider-neutral payment ledger | Done |
| Live PSP/card integration | Next |

Future work is tracked in [`ROADMAP.md`](ROADMAP.md). For contribution, support and security guidance see [`CONTRIBUTING.md`](CONTRIBUTING.md), [`SUPPORT.md`](SUPPORT.md) and [`SECURITY.md`](SECURITY.md).

## License and reuse

This repository is released under the **MIT License**.

In practical terms, MIT allows people and companies to use, copy, modify, merge, publish, distribute, sublicense and sell software based on this code, including commercial and closed-source derivative products, provided the required copyright and permission notice is retained.

There is no requirement for downstream users to publish their modifications. The software is provided without warranty, as stated in [`LICENSE`](LICENSE).

This permissive model is intentional for the open-source foundation. Commercial Kairoseth services, private integrations, hosted environments, credentials, customer data and other assets can remain separate from this repository.

MIT © 2026 Eduardo Yauri. See [`LICENSE`](LICENSE).
