# Open Travel Platform

> Modern, reusable open-source starter for travel agencies, tour operators and booking products.

Open Travel Platform is a clean-room travel product starter built to run immediately in demo mode and later connect to external APIs, CMSs, supplier systems or booking backends through explicit adapters.

![Version](https://img.shields.io/badge/version-0.2.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000)
![React](https://img.shields.io/badge/React-19.2-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![License](https://img.shields.io/badge/license-MIT-45d6b5)

## v0.2.0 — Catalogue

The current milestone provides a navigable travel catalogue on top of the foundation architecture:

- destination list and stable destination detail routes;
- trip list and stable trip detail routes;
- trip-to-destination relations through domain IDs;
- live text search across trip and destination content;
- destination, duration and starting-price filters;
- explicit empty/reset states;
- metadata generation for catalogue detail pages;
- demo and generic REST adapters using the same repository interface;
- responsive catalogue/detail UI without inherited media assets.

## Foundation stack

- Next.js 16.3 / React 19.2 / TypeScript 6;
- Node.js 24 LTS runtime target;
- strict TypeScript configuration;
- original responsive UI and fictional demo content;
- typed travel-domain entities;
- repository interfaces separating UI from infrastructure;
- demo and generic HTTP catalogue adapters;
- environment-driven adapter selection;
- CI with safety, type, build and production dependency checks;
- MIT licensing, contribution and security policies.

## Why this project exists

Many travel frontends become tightly coupled to a single API, CMS, supplier or booking engine. Open Travel Platform takes the opposite approach: the travel domain and UI depend on stable repository interfaces, while integrations live behind replaceable adapters.

```text
Next.js UI
    |
    v
TravelRepository
    |
    +--> Demo adapter
    |
    +--> Generic REST adapter
    |
    +--> Future CMS / supplier / CRM / booking adapters
```

## Quick start

Requirements: **Node.js 24 LTS**.

```bash
git clone <your-fork-url>
cd open-travel-platform
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Demo mode is the default and requires no backend.

## Routes

```text
/                       landing page
/destinations           destination catalogue
/destinations/[slug]    destination detail + related trips
/trips                  searchable/filterable trip catalogue
/trips/[slug]           trip detail
```

## Configuration

```text
NEXT_PUBLIC_SITE_NAME=Open Travel Platform
NEXT_PUBLIC_SITE_TAGLINE=Build travel products without vendor lock-in.
NEXT_PUBLIC_DATA_MODE=demo
NEXT_PUBLIC_TRAVEL_API_URL=
```

Use `NEXT_PUBLIC_DATA_MODE=api` only when a compatible API is configured. The read-only contract is documented in [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md).

## Architecture

```text
app/              Next.js routes and pages
components/       reusable presentation and catalogue components
domain/           pure travel-domain types
data/             fictional demo catalogue
repositories/     stable capability interfaces
adapters/         infrastructure implementations
lib/              configuration and composition
docs/             architecture and integration contracts
scripts/          repository safety checks
```

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the architectural rules.

## Current domain

The catalogue model includes:

- destinations with stable slugs, regions and summaries;
- trips/itineraries related to destinations by ID;
- duration;
- pricing and currency;
- highlights;
- featured catalogue state.

Authentication, reservations, availability and operator workflows will be added as separate capability boundaries rather than embedded directly in catalogue UI code.

## Quality checks

```bash
npm run check:safety
npm run typecheck
npm run build
```

`npm run check` executes the complete local validation sequence. GitHub Actions also performs a production dependency audit on pull requests and `main`.

## TypeScript version note

TypeScript 7 is available, but its native compiler does not currently expose the JavaScript compiler API expected by the Next.js build integration. The project therefore uses TypeScript 6.0 for stable framework compatibility and will move to TypeScript 7 when that integration no longer requires a compatibility layer.

## Principles

- **Clean-room implementation** — original code, UI and demo data created for this repository.
- **Demo-first** — a fresh clone renders without external infrastructure.
- **Adapter-based** — integrations sit behind explicit interfaces.
- **Secure defaults** — no production endpoints, secrets or customer data in source control.
- **Portable** — no mandatory hosting provider, CMS, payment gateway or supplier.
- **Open source** — MIT licensed from the first project commit.

## Roadmap

| Version | Focus | Status |
|---|---|---|
| `0.1.0` | Foundation, demo data, architecture and CI | Done |
| `0.2.0` | Destination/trip catalogue, detail views, search and filtering | Current |
| `0.3.0` | Authentication and customer accounts | Planned |
| `0.4.0` | Reservations and availability | Planned |
| `0.5.0` | Operator/admin workflows | Planned |
| `1.0.0` | Stable reusable travel starter | Planned |

## Contributing and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`SECURITY.md`](SECURITY.md).

## License

MIT © 2026 Eduardo Yauri. See [`LICENSE`](LICENSE).
