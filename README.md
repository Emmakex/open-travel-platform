# Open Travel Platform

<p align="center"><strong>English</strong> · <a href="./README.es.md">Español</a></p>

> Reusable open-source foundation for travel agencies, tour operators and booking products.

Open Travel Platform is a clean-room Next.js starter with a complete fictional travel flow and explicit adapter boundaries for catalogue data, identity, booking and staff operations. A fresh clone runs without external infrastructure; production integrations can replace each demo capability independently.

![Version](https://img.shields.io/badge/version-1.0.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![License](https://img.shields.io/badge/license-MIT-45d6b5)

## What 1.0 includes

- **Catalogue** — destinations, trips, details, search and filters through `TravelRepository`.
- **Identity** — customer/operator/admin identities through `IdentityRepository`.
- **Booking** — availability and customer reservations through `BookingRepository`.
- **Operations** — staff queues, validated state transitions and audit events through `OperationsRepository`.
- **Security boundaries** — server-side role checks, ownership checks and trusted price/availability validation.
- **Release quality** — source-safety checks, TypeScript, production build, HTTP smoke tests and dependency audit in CI.

The bundled adapters contain only fictional demo data. They are intentionally replaceable examples, **not** production authentication, inventory, payment, booking or backoffice systems.

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

Provider-specific payloads stay inside adapters rather than leaking through pages and components.

## End-to-end demo

1. Browse destinations and trips.
2. Start the fictional customer session.
3. Choose availability and create a demo reservation.
4. Review it in the customer account.
5. Switch to the fictional operator/admin surface.
6. Confirm or cancel the reservation.
7. Inspect the generated audit event.

Browser-supplied roles, totals and state transitions never become authoritative decisions.

## Quick start

Requires **Node.js 24 LTS**. The project declares the npm toolchain and exact direct dependency versions in `package.json`.

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Main routes

```text
/                                landing page
/destinations                    destination catalogue
/destinations/[slug]             destination detail
/trips                           searchable/filterable trips
/trips/[slug]                    trip detail
/trips/[slug]/book               availability + reservation
/account/sign-in                 customer demo entry
/account                         protected customer account
/account/reservations            reservation history
/account/reservations/[id]       customer reservation detail
/operator/sign-in                operator/admin demo entry
/operator                        operations dashboard
/operator/reservations           staff reservation queue
/operator/reservations/[id]      status workflow + audit history
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

`NEXT_PUBLIC_*` variables are browser-visible and must never contain secrets. In production, identity, booking and operations default to **disabled** when their mode variables are omitted. Fictional demo writes require explicit opt-in and must never be used with real customer or commercial data.

## Integration and production docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capability and trust boundaries.
- [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) — generic catalogue REST contract.
- [`docs/IDENTITY.md`](docs/IDENTITY.md) — replacing demo identity.
- [`docs/BOOKING.md`](docs/BOOKING.md) — booking integrity and adapter rules.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — staff authorization/workflows.
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — adding real integrations.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment model.
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — mandatory production review.

## Quality gates

```bash
npm run check:safety
npm run check:release
npm run typecheck
npm run build
npm run verify
```

CI resolves a fresh dependency lock, performs a clean `npm ci` install, validates the release, builds the application, starts the production server, smoke-tests representative routes and runs `npm audit`.

## Project principles

- Clean-room implementation and fictional demo fixtures.
- Provider-neutral capability interfaces.
- Server-authorized customer/staff operations.
- Server-validated pricing, availability, ownership and state transitions.
- Production-safe defaults.
- No mandatory hosting, CMS, auth, CRM, payment or supplier vendor.
- MIT licensed.

## Version history

| Version | Focus | Status |
|---|---|---|
| `0.1.0` | Foundation and CI | Done |
| `0.2.0` | Catalogue and discovery | Done |
| `0.3.0` | Identity and customer accounts | Done |
| `0.4.0` | Reservations and availability | Done |
| `0.5.0` | Operator/admin workflows | Done |
| `1.0.0` | Stable starter and release hardening | Current |

Future work is tracked in [`ROADMAP.md`](ROADMAP.md). For contribution, support and security guidance see [`CONTRIBUTING.md`](CONTRIBUTING.md), [`SUPPORT.md`](SUPPORT.md) and [`SECURITY.md`](SECURITY.md).

## License

MIT © 2026 Eduardo Yauri. See [`LICENSE`](LICENSE).
