# Open Travel Platform

> Modern, reusable open-source starter for travel agencies, tour operators and booking products.

Open Travel Platform is a clean-room travel product starter that runs immediately with fictional demo data and can later connect to external APIs, CMSs, identity providers, supplier systems or booking backends through explicit adapters.

![Version](https://img.shields.io/badge/version-0.4.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![License](https://img.shields.io/badge/license-MIT-45d6b5)

## v0.4.0 — Reservations & availability

The current milestone adds a booking capability without coupling catalogue or account UI to a specific booking engine:

- typed availability and reservation domain models;
- `BookingRepository` capability boundary;
- fictional availability windows for the demo catalogue;
- server-side reservation creation and validation;
- protected booking flow per trip;
- customer reservation list and detail pages;
- identity-scoped reservation reads and cancellation;
- fictional cookie-backed demo persistence capped at five reservations;
- production-safe booking defaults;
- booking trust-boundary documentation.

### Server-side booking integrity

The browser never submits a trusted reservation total. The server resolves the trip and selected availability, validates party size and remaining spaces, uses the trusted trip price/currency and calculates the total before creating the reservation.

The demo adapter is only for fictional data. It is **not** a production booking, inventory or payment system.

## Previous capabilities

### v0.3 — Identity & customer accounts

- `IdentityRepository` provider boundary;
- typed identity/profile/role models;
- passwordless fictional demo session;
- protected `/account` surface;
- provider-neutral identity architecture and production-safe defaults.

### v0.2 — Catalogue

- destination and trip catalogues/details;
- search and filtering;
- trip-to-destination relationships;
- demo and generic REST travel adapters.

## Stack

- Next.js 16.3.1;
- React / ReactDOM 19.2.8;
- TypeScript 6;
- Node.js 24 LTS target;
- ports-and-adapters boundaries for catalogue, identity and booking;
- GitHub Actions CI with source-safety, type, build and production dependency checks;
- MIT license.

## Architecture

```text
Catalogue UI          Account UI            Booking UI
    |                    |                     |
    v                    v                     v
TravelRepository    IdentityRepository    server validation
    |                    |                     |
    |                    |                     v
    |                    |               BookingRepository
    |                    |                     |
 Demo / REST         Demo / future auth    Demo / future booking engine
```

Read:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md)
- [`docs/IDENTITY.md`](docs/IDENTITY.md)
- [`docs/BOOKING.md`](docs/BOOKING.md)

## Quick start

Requirements: **Node.js 24 LTS**.

```bash
git clone <your-fork-url>
cd open-travel-platform
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. During local development catalogue, identity and booking use fictional demo adapters without external infrastructure.

## Routes

```text
/                               landing page
/destinations                   destination catalogue
/destinations/[slug]            destination detail + related trips
/trips                          searchable/filterable trip catalogue
/trips/[slug]                   trip detail
/trips/[slug]/book              availability + reservation form
/account/sign-in                identity entry surface
/account                         protected customer account
/account/reservations            customer reservation history
/account/reservations/[id]       reservation detail + demo cancellation
```

## Configuration

```text
NEXT_PUBLIC_SITE_NAME=Open Travel Platform
NEXT_PUBLIC_SITE_TAGLINE=Build travel products without vendor lock-in.
NEXT_PUBLIC_DATA_MODE=demo
NEXT_PUBLIC_TRAVEL_API_URL=

IDENTITY_MODE=demo
DEMO_IDENTITY_ENABLED=false

BOOKING_MODE=demo
DEMO_BOOKING_ENABLED=false
```

`NEXT_PUBLIC_*` values are browser-visible and must never contain secrets. Identity and booking configuration are server-only.

Development defaults to demo identity/booking. Production defaults both capabilities to disabled when their mode variables are omitted. Demo identity/booking writes in production require explicit opt-in.

## Repository layout

```text
app/              routes, server actions and presentation
components/       reusable UI/catalogue components
domain/           pure travel, identity and booking types
data/             fictional catalogue and availability fixtures
repositories/     stable capability interfaces
adapters/         infrastructure/provider implementations
lib/              configuration and composition
docs/             architecture and integration contracts
scripts/          repository safety checks
```

## Quality checks

```bash
npm run check:safety
npm run typecheck
npm run build
```

`npm run check` executes the local validation sequence. GitHub Actions also performs a production dependency audit on pull requests and `main`.

## Principles

- **Clean-room implementation** — original code, UI and demo data created for this repository.
- **Demo-first** — fresh clones are useful without external infrastructure.
- **Adapter-based** — external systems sit behind explicit capabilities.
- **Server-validated writes** — private mutations do not trust browser totals, ownership or availability claims.
- **Secure defaults** — production identity and booking demo modes are opt-in.
- **Portable** — no mandatory hosting provider, CMS, auth provider, payment gateway or supplier.
- **Open source** — MIT licensed from the first project commit.

## Roadmap

| Version | Focus | Status |
|---|---|---|
| `0.1.0` | Foundation, demo data, architecture and CI | Done |
| `0.2.0` | Catalogue, detail views, search and filtering | Done |
| `0.3.0` | Identity and customer accounts | Done |
| `0.4.0` | Reservations and availability | Current |
| `0.5.0` | Operator/admin workflows | Planned |
| `1.0.0` | Stable reusable travel starter | Planned |

## Contributing and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`SECURITY.md`](SECURITY.md).

## License

MIT © 2026 Eduardo Yauri. See [`LICENSE`](LICENSE).
