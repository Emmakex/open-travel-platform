# Open Travel Platform

> Reusable open-source foundation for travel agencies, tour operators and booking products.

Open Travel Platform is a clean-room travel application starter with a complete fictional demo flow and explicit adapter boundaries for catalogue data, identity, booking and staff operations. A fresh clone works without external infrastructure, while production integrations can replace each demo capability independently.

![Version](https://img.shields.io/badge/version-1.0.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![License](https://img.shields.io/badge/license-MIT-45d6b5)

## 1.0.0 — Stable reusable starter

The first stable release includes four independent capability boundaries:

- **Catalogue** — destinations, trips, details, search and filters through `TravelRepository`;
- **Identity** — customer/operator/admin identities through `IdentityRepository`;
- **Booking** — availability and customer reservations through `BookingRepository`;
- **Operations** — staff queues, state transitions and audit events through `OperationsRepository`.

The bundled adapters use only fictional demo data. They exist so forks can understand and exercise the architecture immediately; they are not production authentication, inventory, booking, payment or backoffice systems.

## End-to-end demo

A local installation can exercise the complete product flow:

1. browse destinations and trips;
2. start the fictional customer session;
3. select availability and create a demo reservation;
4. review the reservation from the customer account;
5. switch to a fictional operator or admin identity;
6. review the operational queue;
7. confirm or cancel a reservation;
8. inspect the resulting audit event.

All trusted decisions remain server-side: browser-supplied roles, reservation totals and status transitions are not authoritative.

## Architecture

```text
Public catalogue           Customer area              Staff operations
      |                          |                           |
      v                          v                           v
TravelRepository         IdentityRepository          server RBAC
      |                          |                           |
 Demo / REST              Demo / future auth                 v
                                                       OperationsRepository
                                                            |
                                                 demo / CRM / ERP / backoffice

Customer reservation write
      |
server validation
      |
BookingRepository
      |
demo / booking engine / supplier
```

The UI consumes capability interfaces rather than provider SDKs or hard-coded external URLs. This allows a fork to replace one integration without rewriting unrelated product surfaces.

## Stack

- Next.js 16.3.1;
- React / ReactDOM 19.2.8;
- TypeScript 6;
- Node.js 24 LTS target;
- App Router and server actions;
- ports-and-adapters architecture;
- GitHub Actions CI;
- HTTP production smoke tests;
- source-safety and release-consistency checks;
- dependency audit;
- MIT license.

## Quick start

Requirements: **Node.js 24 LTS**.

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Development defaults to fictional demo capabilities, so no database, identity provider, supplier or external API is required.

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

In production, identity, booking and operations default to **disabled** when their mode variables are omitted. Fictional demo writes require explicit opt-in and must never be used with real customer or commercial data.

## Integration guides

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system boundaries and trust model;
- [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) — generic catalogue REST contract;
- [`docs/IDENTITY.md`](docs/IDENTITY.md) — identity replacement rules;
- [`docs/BOOKING.md`](docs/BOOKING.md) — booking integrity and adapter contract;
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — staff authorization and operational workflows;
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — how to add real providers cleanly;
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment model;
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — required production replacement/security review.

## Repository layout

```text
app/              routes, server actions and presentation
components/       reusable UI components
domain/           pure travel, identity, booking and operations types
data/             fictional demo fixtures
repositories/     stable capability interfaces
adapters/         infrastructure/provider implementations
lib/              configuration, authorization and composition
docs/             architecture and integration contracts
scripts/          safety and release validation
```

## Quality gates

```bash
npm run check:safety
npm run check:release
npm run typecheck
npm run build
npm run verify
```

CI additionally starts the production build and performs HTTP smoke tests against representative public and protected routes before running the dependency audit.

## Stable-release principles

- **Clean-room** — original project code, UI and fictional fixtures;
- **Demo-first** — useful immediately without external infrastructure;
- **Adapter-based** — provider-specific code stays behind capability interfaces;
- **Server-authorized** — customer/staff permissions are rechecked on trusted boundaries;
- **Server-validated booking** — totals, availability, ownership and state changes are not trusted from browser input;
- **Auditable operations** — staff transitions have an audit-event model;
- **Secure defaults** — privileged demo capabilities are off by default in production;
- **Portable** — no mandatory hosting provider, CMS, auth vendor, CRM, payment gateway or supplier;
- **Open source** — MIT licensed.

## Version history

| Version | Focus | Status |
|---|---|---|
| `0.1.0` | Foundation, demo data, architecture and CI | Done |
| `0.2.0` | Catalogue, detail views, search and filtering | Done |
| `0.3.0` | Identity and customer accounts | Done |
| `0.4.0` | Reservations and availability | Done |
| `0.5.0` | Operator/admin workflows | Done |
| `1.0.0` | Stable starter, release hardening and production guidance | Current |

Future work is tracked in [`ROADMAP.md`](ROADMAP.md).

## Contributing, support and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md), [`SUPPORT.md`](SUPPORT.md) and [`SECURITY.md`](SECURITY.md).

## License

MIT © 2026 Eduardo Yauri. See [`LICENSE`](LICENSE).
