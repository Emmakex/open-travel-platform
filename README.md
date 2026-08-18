# Open Travel Platform

> Modern, reusable open-source starter for travel agencies, tour operators and booking products.

Open Travel Platform is a clean-room travel product starter built to run immediately in demo mode and later connect to external APIs, CMSs, supplier systems or booking backends through explicit adapters.

![Version](https://img.shields.io/badge/version-0.1.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.2.11-000000)
![React](https://img.shields.io/badge/React-19.2-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178c6)
![License](https://img.shields.io/badge/license-MIT-45d6b5)

## v0.1.0 — Foundation

The first milestone establishes:

- Next.js 16.2 / React 19.2 / TypeScript 7;
- Node.js 24 LTS runtime target;
- strict TypeScript configuration;
- original responsive UI and demo content;
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

Open `http://localhost:3000`.

Demo mode is the default and requires no backend.

## Configuration

```text
NEXT_PUBLIC_SITE_NAME=Open Travel Platform
NEXT_PUBLIC_SITE_TAGLINE=Build travel products without vendor lock-in.
NEXT_PUBLIC_DATA_MODE=demo
NEXT_PUBLIC_TRAVEL_API_URL=
```

Use `NEXT_PUBLIC_DATA_MODE=api` only when a compatible API is configured. The initial read-only contract is documented in [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md).

## Architecture

The codebase intentionally separates concerns:

```text
app/              Next.js routes and pages
components/       reusable presentation components
domain/           pure travel-domain types
data/             fictional demo catalogue
repositories/     stable capability interfaces
adapters/         infrastructure implementations
lib/              configuration and composition
docs/             architecture and integration contracts
scripts/          repository safety checks
```

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the architectural rules.

## Current demo model

The initial domain includes:

- destinations;
- trips/itineraries;
- duration;
- pricing and currency;
- highlights;
- featured catalogue state.

The next milestones will add search/filtering, accounts, reservations, availability and operator workflows without coupling those features to one vendor.

## Quality checks

```bash
npm run check:safety
npm run typecheck
npm run build
```

`npm run check` executes the complete local validation sequence. GitHub Actions also performs a production dependency audit on pull requests and `main`.

## Principles

- **Clean-room implementation** — original code, UI and demo data created for this repository.
- **Demo-first** — a fresh clone renders without external infrastructure.
- **Adapter-based** — integrations sit behind explicit interfaces.
- **Secure defaults** — no production endpoints, secrets or customer data in source control.
- **Portable** — no mandatory hosting provider, CMS, payment gateway or supplier.
- **Open source** — MIT licensed from the first project commit.

## Roadmap

| Version | Focus |
|---|---|
| `0.1.0` | Foundation, demo data, architecture and CI |
| `0.2.0` | Destination/trip catalogue, detail views, search and filtering |
| `0.3.0` | Authentication and customer accounts |
| `0.4.0` | Reservations and availability |
| `0.5.0` | Operator/admin workflows |
| `1.0.0` | Stable reusable travel starter |

## Contributing and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`SECURITY.md`](SECURITY.md).

## License

MIT © 2026 Eduardo Yauri. See [`LICENSE`](LICENSE).
