# Open Travel Platform

> Modern, reusable open-source starter for travel agencies, tour operators and booking products.

Open Travel Platform is a clean-room travel product starter that runs immediately with fictional demo data and can later connect to external APIs, CMSs, identity providers, supplier systems, booking engines, CRMs or operations backends through explicit adapters.

![Version](https://img.shields.io/badge/version-0.5.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![License](https://img.shields.io/badge/license-MIT-45d6b5)

## v0.5.0 — Operator & admin workflows

The current milestone adds a separate staff operations surface instead of exposing customer booking methods to internal users:

- fixed fictional `customer`, `operator` and `admin` identities;
- server-side role checks for customer and staff routes/actions;
- dedicated `OperationsRepository` capability boundary;
- operator dashboard with pending/confirmed/cancelled metrics;
- reservation queue with status filtering;
- role-protected reservation detail;
- validated reservation transitions (`pending → confirmed/cancelled`, `confirmed → cancelled`);
- fictional staff audit trail recording actor, role, previous/new status and timestamp;
- production-safe operations defaults;
- customer and staff surfaces kept separate even when a session exists.

The demo staff selector is intentionally available only for fictional data. Production roles must come from a trusted identity provider or backend and must be re-authorized on the server.

## Booking integrity

v0.4 introduced availability and reservations behind `BookingRepository`. The browser never submits a trusted reservation total: the server resolves the trip and availability, validates capacity and party size, uses the trusted price/currency and calculates the total before writing.

The demo booking/operations adapters store only fictional records in HTTP-only cookies and are **not** production inventory, booking, payment or authorization systems.

## Architecture

```text
Public catalogue          Customer area             Staff operations
      |                         |                         |
      v                         v                         v
TravelRepository        IdentityRepository        server role checks
      |                         |                         |
 Demo / REST              demo / future auth             v
                                                     OperationsRepository
                                                          |
                                                    demo / CRM / ERP /
                                                    booking backoffice

Customer booking writes
      |
server validation
      |
BookingRepository
      |
demo / booking engine
```

Read:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md)
- [`docs/IDENTITY.md`](docs/IDENTITY.md)
- [`docs/BOOKING.md`](docs/BOOKING.md)
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md)

## Stack

- Next.js 16.3.1;
- React / ReactDOM 19.2.8;
- TypeScript 6;
- Node.js 24 LTS target;
- ports-and-adapters boundaries for catalogue, identity, booking and operations;
- GitHub Actions CI with source-safety, type, build and production dependency checks;
- MIT license.

## Quick start

Requirements: **Node.js 24 LTS**.

```bash
git clone <your-fork-url>
cd open-travel-platform
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. During local development catalogue, identity, booking and staff operations use fictional demo adapters without external infrastructure.

A useful end-to-end demo is:

1. start the fictional customer session;
2. create a reservation from a trip;
3. open `/operator/sign-in` and switch to the fictional operator/admin identity;
4. review the reservation and change its status;
5. inspect the generated audit event.

## Routes

```text
/                                landing page
/destinations                    destination catalogue
/destinations/[slug]             destination detail + related trips
/trips                           searchable/filterable trip catalogue
/trips/[slug]                    trip detail
/trips/[slug]/book               availability + customer reservation form
/account/sign-in                 customer identity entry
/account                         protected customer account
/account/reservations            customer reservation history
/account/reservations/[id]       customer reservation detail/cancellation
/operator/sign-in                fictional operator/admin entry
/operator                        role-protected operations dashboard
/operator/reservations           staff reservation queue
/operator/reservations/[id]      staff status workflow + audit history
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

OPERATIONS_MODE=demo
DEMO_OPERATIONS_ENABLED=false
```

`NEXT_PUBLIC_*` values are browser-visible and must never contain secrets. Identity, booking and operations configuration is server-only.

Development defaults to demo adapters. Production defaults identity, booking and operations to disabled when their mode variables are omitted. Fictional demo identity/booking/operations writes in production require explicit opt-in.

## Repository layout

```text
app/              routes, server actions and presentation
components/       reusable UI/catalogue components
domain/           pure travel, identity, booking and operations types
data/             fictional catalogue, availability and identity fixtures
repositories/     stable capability interfaces
adapters/         infrastructure/provider implementations
lib/              configuration, authorization and composition
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

- **Clean-room implementation** — original code, UI and fictional data created for this repository.
- **Demo-first** — fresh clones are useful without external infrastructure.
- **Adapter-based** — external systems sit behind explicit capabilities.
- **Role-separated surfaces** — customer booking and staff operations are different capability boundaries.
- **Server-authorized operations** — staff pages/actions re-check trusted role state server-side.
- **Server-validated booking writes** — private mutations do not trust browser totals, ownership or availability claims.
- **Auditable state changes** — demo staff transitions generate a minimal audit record.
- **Secure defaults** — production demo capabilities are disabled unless explicitly enabled.
- **Portable** — no mandatory hosting provider, CMS, auth provider, payment gateway, CRM or supplier.
- **Open source** — MIT licensed from the first project commit.

## Roadmap

| Version | Focus | Status |
|---|---|---|
| `0.1.0` | Foundation, demo data, architecture and CI | Done |
| `0.2.0` | Catalogue, detail views, search and filtering | Done |
| `0.3.0` | Identity and customer accounts | Done |
| `0.4.0` | Reservations and availability | Done |
| `0.5.0` | Operator/admin workflows | Current |
| `1.0.0` | Stable reusable travel starter | Planned |

## Contributing and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`SECURITY.md`](SECURITY.md).

## License

MIT © 2026 Eduardo Yauri. See [`LICENSE`](LICENSE).
