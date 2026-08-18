# Open Travel Platform

> Modern, reusable open-source starter for travel agencies, tour operators and booking products.

Open Travel Platform is a clean-room travel product starter that runs immediately in demo mode and can later connect to external APIs, CMSs, identity providers, supplier systems or booking backends through explicit adapters.

![Version](https://img.shields.io/badge/version-0.3.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000)
![React](https://img.shields.io/badge/React-19.2-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![License](https://img.shields.io/badge/license-MIT-45d6b5)

## v0.3.0 — Identity & customer accounts

The current milestone adds a provider-neutral customer account layer without making an authentication vendor mandatory:

- typed `UserIdentity`, `CustomerProfile` and role domain models;
- `IdentityRepository` capability boundary;
- fictional `DemoIdentityRepository`;
- passwordless demo session using an HTTP-only cookie;
- protected `/account` route;
- `/account/sign-in` provider-neutral entry surface;
- customer profile and role presentation;
- account-aware navigation;
- production-safe defaults: identity is disabled when not explicitly configured;
- documentation for replacing the demo adapter with Auth.js, OAuth, SSO or an external identity backend.

The demo identity grants access only to fictional local data and is **not** a production authentication mechanism.

## Catalogue capabilities

v0.2 provides:

- destination catalogue and detail routes;
- trip catalogue and detail routes;
- trip-to-destination relations;
- live text search;
- destination, duration and starting-price filters;
- reusable cards, generated metadata and catalogue-aware 404 handling;
- demo and generic REST travel adapters behind the same repository interface.

## Foundation stack

- Next.js 16.3.1 / React 19.2 / TypeScript 6;
- Node.js 24 LTS target;
- strict TypeScript configuration;
- original responsive UI and fictional demo content;
- ports-and-adapters boundaries for travel data and identity;
- environment-driven adapter selection;
- CI with public-safety, type, build and production dependency checks;
- MIT licensing, contribution and security policies.

## Architecture

```text
Travel UI                         Account UI
   |                                 |
   v                                 v
TravelRepository                IdentityRepository
   |                                 |
   +--> Demo adapter                 +--> Demo identity
   +--> REST adapter                 +--> future Auth/OAuth/SSO adapter
```

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) and [`docs/IDENTITY.md`](docs/IDENTITY.md).

## Quick start

Requirements: **Node.js 24 LTS**.

```bash
git clone <your-fork-url>
cd open-travel-platform
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Travel data and customer identity run in demo mode during local development without external infrastructure.

## Routes

```text
/                       landing page
/destinations           destination catalogue
/destinations/[slug]    destination detail + related trips
/trips                  searchable/filterable trip catalogue
/trips/[slug]           trip detail
/account/sign-in        identity entry surface
/account                 protected customer account
```

## Configuration

```text
NEXT_PUBLIC_SITE_NAME=Open Travel Platform
NEXT_PUBLIC_SITE_TAGLINE=Build travel products without vendor lock-in.
NEXT_PUBLIC_DATA_MODE=demo
NEXT_PUBLIC_TRAVEL_API_URL=

IDENTITY_MODE=demo
DEMO_IDENTITY_ENABLED=false
```

`NEXT_PUBLIC_*` values are visible to browser code and must never contain secrets. Identity configuration is server-only.

Development defaults to demo identity. Production defaults to identity disabled unless explicitly configured; demo sign-in additionally requires `DEMO_IDENTITY_ENABLED=true` in production.

## Repository layout

```text
app/              routes, server actions and presentation
components/       reusable UI/catalogue components
domain/           pure travel and identity domain types
data/             fictional demo catalogue
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
- **Adapter-based** — integrations sit behind explicit interfaces.
- **Secure defaults** — no production endpoints, credentials or customer data in source control.
- **Provider-neutral identity** — account UI does not depend directly on one auth SDK.
- **Portable** — no mandatory hosting provider, CMS, payment gateway or supplier.
- **Open source** — MIT licensed from the first project commit.

## Roadmap

| Version | Focus | Status |
|---|---|---|
| `0.1.0` | Foundation, demo data, architecture and CI | Done |
| `0.2.0` | Catalogue, detail views, search and filtering | Done |
| `0.3.0` | Identity and customer accounts | Current |
| `0.4.0` | Reservations and availability | Planned |
| `0.5.0` | Operator/admin workflows | Planned |
| `1.0.0` | Stable reusable travel starter | Planned |

## Contributing and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`SECURITY.md`](SECURITY.md).

## License

MIT © 2026 Eduardo Yauri. See [`LICENSE`](LICENSE).
