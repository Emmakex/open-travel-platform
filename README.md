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
- downstream providers never receive implicit booking, inventory, pricing or payment authority.

## Current position

**Phase 8 — External integrations: COMPLETE.**  
**Phase 9 — Production hardening engineering baseline: COMPLETE.**  
**Phase 10 — Open-source productisation: IN PROGRESS.**  
**Phase 10.3 — Extension contracts and reference adapters: COMPLETE.**

Phase 10.3 status:

- **10.3.1 Extension inventory and authority map — COMPLETE**
- **10.3.2 Compatibility/versioning policy — COMPLETE**
- **10.3.3 Contributor-facing reference adapters — COMPLETE**
- **10.3.4 Permanent extension-contract validation — COMPLETE**

The completed Phase 10.3 extension model is now protected by a permanent architecture-level gate:

```bash
npm run check:extension-contracts
```

It is part of `npm run verify` and is backed by a dedicated blocking GitHub Actions workflow that also runs the real local-HTTP adapter contract suite.

Phase 10.3 documentation:

- [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md)
- [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md)
- [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md)
- [`docs/EXTENSION-VALIDATION.md`](docs/EXTENSION-VALIDATION.md)
- [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md)

Credentialed Stripe/Redsys TEST/LIVE E2E remains a separate provider-dependent release validation until suitable provider accounts are available.

## Core capabilities

### Catalogue and commerce

- bilingual EN/ES catalogue and Operator experience;
- destinations, trips, itineraries, departures and live inventory;
- accommodation/rooms and seasonal/occupancy pricing;
- Activities, Transport and Travel protection products;
- transactional reservations with server-authoritative pricing/inventory;
- travellers/minors/guardians and historical pricing snapshots;
- package supplements and post-booking amendments.

### Identity and operations

- persistent customer/staff authentication;
- separate customer/staff sessions;
- RBAC and granular Operator/Admin capabilities;
- operational ownership, notes, priority, tags and timeline;
- tasks/follow-ups and supplier fulfilment;
- advanced queues/filtering;
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

### Integrations

- transactional MongoDB integration outbox;
- signed HTTPS webhooks with retry/dead-letter handling;
- durable integration worker;
- REST `BookingRepository`;
- supplier fulfilment REST adapter;
- downstream CRM and ERP/accounting adapters;
- provider-neutral failure transport;
- SSRF/DNS-rebinding protections and bounded external transport.

## Extension architecture

```text
TravelRepository + IdentityRepository
        |
BookingRepository (demo / MongoDB / REST v1)
        |
reservations + transactional inventory
        |
PaymentRepository -> local provider-neutral ledger -> PSP/manual flows
        |
transactional integration outbox
        |
        +--> signed webhooks
        +--> CRM REST (downstream-only)
        +--> ERP/accounting REST (downstream-only)

OperationsRepository
        |
SupplierFulfilmentAdapter -> audit-before-apply -> local workflow

Operational failures -> optional FailureTransport
```

Provider-specific payloads stay inside adapters. Core authority remains explicit.

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

## Public extension model

Verified first-class interfaces:

- `TravelRepository`
- `IdentityRepository`
- `BookingRepository`
- `OperationsRepository`
- `PaymentRepository`
- `SupplierFulfilmentAdapter`
- `CrmSyncAdapter`
- `ErpAccountingAdapter`
- `FailureTransport`

Official contributor references:

- `RestBookingRepository` — bounded repository authority;
- `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — workflow-subordinate and audit-before-apply;
- `RestCrmSyncAdapter` — downstream-only;
- `RestFailureTransport` — optional monitoring-only pattern.

## Permanent extension validation

`check:extension-contracts` protects:

- exact public extension inventory;
- provider-neutral interface purity;
- downstream-only CRM/ERP authority surfaces;
- supplier audit-before-apply and authority limits;
- provider-neutral `PaymentRepository` semantics;
- documented v1 header/schema/signature identifiers;
- reference-adapter transport safeguards;
- central EN/ES documentation consistency.

Run locally:

```bash
npm run check:extension-contracts
npm run verify
```

Dedicated CI: `.github/workflows/extension-contracts.yml`.

See [`docs/EXTENSION-VALIDATION.md`](docs/EXTENSION-VALIDATION.md).

## Documentation

### Project

- [`ROADMAP.md`](ROADMAP.md)
- [`ROADMAP.es.md`](ROADMAP.es.md)
- [`CHANGELOG.md`](CHANGELOG.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)

### Extensions

- [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md)
- [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md)
- [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md)
- [`docs/EXTENSION-VALIDATION.md`](docs/EXTENSION-VALIDATION.md)
- [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md)
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md)

## Phase completion rule

A phase/slice is not complete until implementation and tests are finished, EN/ES documentation/README/ROADMAP/CHANGELOG are synchronized, the PR scope is reviewed, required CI is green, the PR is merged to `main`, and `main` is verified before the next phase starts.

Phase 10.3 satisfies this rule. Any later Phase 10 work must follow the same completion gate before advancing again.

## License

MIT. See [`LICENSE`](LICENSE).
