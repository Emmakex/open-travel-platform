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

- customer data, production credentials and proprietary customer integrations stay outside the public repository;
- private Kairoseth/customer adapters may depend on public OTP contracts, never the reverse;
- downstream providers never receive implicit booking, inventory, pricing or payment authority.

## Current position

**Phase 8 — External integrations: COMPLETE.**  
**Phase 9 — Production hardening engineering baseline: COMPLETE.**  
**Phase 10 — Open-source productisation: IN PROGRESS.**

Phase 10 status after this merge:

- **10.1 Reproducible fresh-clone/demo bootstrap — COMPLETE**
- **10.2 Provider-neutral self-host standalone deployment — COMPLETE**
- **10.3 Extension contracts and reference adapters — ACTIVE**
  - **10.3.1 Extension inventory and authority map — COMPLETE**
  - **10.3.2 Compatibility/versioning policy — COMPLETE**
  - **10.3.3 Contributor-facing reference adapters — COMPLETE**
  - **10.3.4 Permanent extension-contract validation — ACTIVE**

Phase 10.3 now has a code-backed extension inventory, a formal compatibility/versioning policy and contributor-facing references backed by existing tested adapters. See:

- [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md)
- [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md)
- [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md)
- [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md)

Credentialed Stripe/Redsys TEST/LIVE E2E remains a separate provider-dependent release validation until suitable provider accounts are available.

## Core capabilities

### Catalogue and commerce

- bilingual EN/ES catalogue and Operator experience;
- destinations, trips, itineraries, departures and live inventory;
- accommodation/rooms, seasonal and occupancy pricing;
- Activities, Transport and Travel protection products;
- transactional reservations with server-authoritative pricing/inventory;
- travellers, minors, age bands, guardians and historical pricing snapshots;
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
- bank transfer, cash and external terminal movements;
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
- MongoDB concurrency, idempotency, backup/restore and index validation;
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

## Architecture

```text
Public catalogue / customer area
        |
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

Operator/Admin
        |
OperationsRepository + audit/tasks/documents/reports
        |
SupplierFulfilmentAdapter -> audit-before-apply -> local workflow

Operational failures
        |
structured logs -> optional FailureTransport
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

For real production deployment use runtime-only secrets and the `live` readiness profile. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md).

## Extension model

Phase 10.3 has formalized the public extension boundary.

### Verified public interfaces

- `TravelRepository`
- `IdentityRepository`
- `BookingRepository`
- `OperationsRepository`
- `PaymentRepository`
- `SupplierFulfilmentAdapter`
- `CrmSyncAdapter`
- `ErpAccountingAdapter`
- `FailureTransport`

Generic signed webhooks are a separate downstream delivery surface.

### Official contributor references — 10.3.3 COMPLETE

- `RestBookingRepository` — bounded repository authority;
- `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — workflow-subordinate, audit-before-apply;
- `RestCrmSyncAdapter` — downstream-only;
- `RestFailureTransport` — optional monitoring-only pattern.

These existing implementations are already covered by the real local-HTTP contract suite where applicable. The reference guide includes a copy pattern, v1→v2 migration example and proprietary-adapter boundary.

See [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md).

## Documentation

### Project

- [`ROADMAP.md`](ROADMAP.md)
- [`ROADMAP.es.md`](ROADMAP.es.md)
- [`CHANGELOG.md`](CHANGELOG.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)

### Phase 10.3

- [`docs/EXTENSION-POINT-INVENTORY.md`](docs/EXTENSION-POINT-INVENTORY.md)
- [`docs/EXTENSION-COMPATIBILITY.md`](docs/EXTENSION-COMPATIBILITY.md)
- [`docs/REFERENCE-ADAPTERS.md`](docs/REFERENCE-ADAPTERS.md)
- [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md)
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md)

### Integration contracts

- [`docs/REST-BOOKING-ADAPTER.md`](docs/REST-BOOKING-ADAPTER.md)
- [`docs/SUPPLIER-FULFILMENT-ADAPTER.md`](docs/SUPPLIER-FULFILMENT-ADAPTER.md)
- [`docs/CRM-SYNC-ADAPTER.md`](docs/CRM-SYNC-ADAPTER.md)
- [`docs/ERP-ACCOUNTING-ADAPTER.md`](docs/ERP-ACCOUNTING-ADAPTER.md)
- [`docs/OUTBOUND-INTEGRATIONS.md`](docs/OUTBOUND-INTEGRATIONS.md)
- [`docs/FAILURE-TRANSPORT.md`](docs/FAILURE-TRANSPORT.md)

## Quality gates

Run:

```bash
npm run verify
```

CI additionally exercises real MongoDB replica sets, local HTTP adapter contracts, privacy, accessibility, recovery and performance/resource baselines.

## Phase completion rule

A phase/slice is not complete until:

1. implementation/scope is finished;
2. validation is complete;
3. relevant EN/ES documentation, README, ROADMAP and CHANGELOG are synchronized;
4. the PR diff matches the intended phase scope;
5. required CI is green;
6. the PR is merged to `main`;
7. `main` is verified before the next phase begins.

## Active priority — Phase 10.3.4

After the 10.3.3 closing PR merges, the only active slice is **10.3.4 — permanent extension-contract validation**.

It must add a permanent static/runtime gate that protects interface/reference presence, version/document consistency, provider-payload isolation, downstream authority limits, supplier audit-before-apply and reference-adapter safety, and register that gate in `npm run verify`/CI.

No 10.3.4 implementation is included in the 10.3.3 closing branch.

## License

MIT. See [`LICENSE`](LICENSE).
