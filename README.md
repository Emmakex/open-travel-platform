# Open Travel Platform

<p align="center"><strong>English</strong> · <a href="./README.es.md">Español</a></p>

> Reusable open-source travel platform foundation for agencies, tour operators and booking products.

Open Travel Platform is a clean-room **Next.js + TypeScript + MongoDB** platform built around explicit domain, repository and adapter boundaries. It supports infrastructure-free demo onboarding, persistent production capabilities and provider-neutral self-host deployment.

The official commercial/reference implementation is **Kairoseth Travel**, deployed at **[travel.kairoseth.com](https://travel.kairoseth.com)**.

![Version](https://img.shields.io/badge/version-1.0.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.2-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![MongoDB](https://img.shields.io/badge/MongoDB-supported-47A248)
![License](https://img.shields.io/badge/license-MIT-45d6b5)

## Project model

This repository is the **MIT-licensed provider-neutral core**. Kairoseth Travel is the hosted/commercial reference implementation.

- customer data and proprietary customer integrations stay outside the public repository;
- private Kairoseth/customer adapters may depend on public OTP contracts, never the reverse;
- downstream providers never receive implicit booking, inventory, pricing or payment authority;
- the MIT software license does not by itself grant permission to present an independent fork/service as official Kairoseth Travel.

Branding and trademark usage is documented separately in [`TRADEMARKS.md`](TRADEMARKS.md).

## Current position

**Phase 8 — External integrations: COMPLETE.**  
**Phase 9 — Production hardening engineering baseline: COMPLETE.**  
**Phase 10 — Open-source productisation: IN PROGRESS.**

Completed Phase 10 slices:

- **10.1 Reproducible fresh-clone/demo bootstrap — COMPLETE**
- **10.2 Provider-neutral self-host standalone deployment — COMPLETE**
- **10.3 Extension contracts and reference adapters — COMPLETE**
- **10.4 Release and migration conventions — COMPLETE**
- **10.5 Upgrade and deprecation lifecycle policy — COMPLETE**
- **10.6 Contribution and release templates — COMPLETE**
- **10.7 Branding and trademark policy — COMPLETE**

Phase 10.7 establishes:

- explicit separation between MIT software rights and project/commercial branding;
- **Open Travel Platform** as the public provider-neutral core/project name;
- **Kairoseth Travel** as the official hosted/commercial reference implementation;
- `https://travel.kairoseth.com` as the official reference deployment;
- truthful descriptive use such as “based on Open Travel Platform” / “compatible with Open Travel Platform”;
- distinct primary branding for independently operated forks/services;
- no implied sponsorship, certification or official status from use of the MIT code;
- separate permission expectations for Kairoseth/Kairoseth Travel logos, wordmarks and official-status claims;
- permanent validation through `npm run check:branding-policy`.

This policy does not claim that any mark is registered in every jurisdiction; it defines the project's usage rules for project/commercial branding. See [`TRADEMARKS.md`](TRADEMARKS.md) and [`TRADEMARKS.es.md`](TRADEMARKS.es.md).

Credentialed Stripe/Redsys TEST/LIVE E2E remains a separate provider-dependent release validation until suitable provider accounts are available.

## Core capabilities

### Catalogue and commerce

- bilingual EN/ES catalogue and Operator experience;
- destinations, trips, itineraries, departures and live inventory;
- accommodation/rooms and seasonal/occupancy pricing;
- Activities, Transport and Travel protection;
- transactional reservations with server-authoritative pricing/inventory;
- travellers/minors/guardians and historical pricing snapshots;
- package supplements and post-booking amendments.

### Identity and operations

- persistent customer/staff authentication and separate sessions;
- RBAC and granular Operator/Admin capabilities;
- operational ownership, notes, priority, tags and timeline;
- tasks/follow-ups, supplier fulfilment and advanced queues;
- privileged audit where required.

### Payments and finance

- provider-neutral payment/refund ledger;
- bank transfer, cash and external-terminal movements;
- Stripe/Redsys checkout integrations;
- deposits/installments/outstanding balance;
- reconciliation/revenue reporting;
- downstream-only ERP/accounting synchronization.

### Traveller data and production hardening

- encrypted post-purchase Traveller Data and key rotation;
- privacy-right workflows and retention policy;
- WCAG 2.2 AA-oriented accessibility baseline;
- CSP/security headers, Origin validation and throttling;
- liveness/readiness and `demo|live` deployment profiles;
- MongoDB concurrency/idempotency, backup/restore and index validation;
- repeatable performance/resource baselines.

### Integrations and extension model

- transactional MongoDB integration outbox;
- signed HTTPS webhooks with retry/dead-letter handling;
- REST `BookingRepository`, supplier fulfilment, downstream CRM/ERP and failure transport;
- nine verified first-class public extension interfaces;
- explicit provider/authority boundaries;
- permanent extension gate through `check:extension-contracts`.

## Quick start

Requires **Node.js 24 LTS** and the npm version declared in `packageManager`.

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm ci
npm run setup:demo
npm run dev
```

The demo profile requires no MongoDB, SMTP, PSP, CRM, ERP or supplier credentials.

## Self-host standalone

```bash
npm ci
npm run setup:demo
npm run build
npm run package:standalone
node .next/standalone/server.js
```

For production deployment see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md).

## Release, upgrade and branding contract

Stable releases use:

```text
package.json  -> X.Y.Z
Git tag       -> vX.Y.Z
CHANGELOG     -> ## [X.Y.Z] - YYYY-MM-DD
```

A production upgrade identifies exact source/target versions and SHAs, reviews all intervening migrations/deprecations, validates a representative target environment and declares recovery before persistent changes.

Public lifecycle:

```text
ACTIVE → DEPRECATED → REMOVED
```

Ordinary removal occurs only at/after the announced MAJOR boundary. PATCH/MINOR releases do not silently remove or reinterpret supported public surfaces.

Before release validation:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:contribution-templates
npm run check:branding-policy
npm run verify
```

See [`docs/RELEASES.md`](docs/RELEASES.md), [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md), [`docs/UPGRADES.md`](docs/UPGRADES.md), [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md), [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md) and [`TRADEMARKS.md`](TRADEMARKS.md).

## Documentation

### Project and delivery

- [`ROADMAP.md`](ROADMAP.md)
- [`ROADMAP.es.md`](ROADMAP.es.md)
- [`CHANGELOG.md`](CHANGELOG.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`SUPPORT.md`](SUPPORT.md)
- [`TRADEMARKS.md`](TRADEMARKS.md)
- [`TRADEMARKS.es.md`](TRADEMARKS.es.md)
- [`docs/RELEASES.md`](docs/RELEASES.md)
- [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md)
- [`docs/UPGRADES.md`](docs/UPGRADES.md)
- [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md)
- [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

### Extensions

- [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md)
- [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md)
- [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md)
- [`docs/EXTENSION-VALIDATION.md`](docs/EXTENSION-VALIDATION.md)
- [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md)
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md)

## Permanent validation

Important project-level gates include:

```bash
npm run check:extension-contracts
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:contribution-templates
npm run check:branding-policy
npm run verify
```

Dedicated workflows protect extension contracts, release/migration conventions, upgrade/deprecation lifecycle, contribution/release templates and branding/trademark separation in pull requests and on `main`.

## Phase completion rule

A phase/slice is not complete until implementation and tests are finished, EN/ES documentation/README/ROADMAP/CHANGELOG are synchronized, the PR scope is reviewed, required CI is green, the PR is merged to `main`, and `main` is verified before the next phase starts.

Phase 10.7 follows the same rule; the final Phase 10 documentation/release audit remains separate until this slice is merged and verified.

## License and branding

Software: MIT. See [`LICENSE`](LICENSE).

Project/commercial names and visual identity are governed separately by [`TRADEMARKS.md`](TRADEMARKS.md). The branding policy does not silently relicense the software.
