# Open Travel Platform

<p align="center"><strong>English</strong> · <a href="./README.es.md">Español</a></p>

> Reusable open-source travel platform foundation for agencies, tour operators and booking products.

Open Travel Platform is a clean-room **Next.js + TypeScript + MongoDB** platform built around explicit domain, repository and adapter boundaries. It supports a safe infrastructure-free demo profile, persistent production capabilities and provider-neutral self-host deployment.

The official commercial/reference implementation is **Kairoseth Travel**, deployed at **[travel.kairoseth.com](https://travel.kairoseth.com)**.

![Version](https://img.shields.io/badge/version-1.0.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.2-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![MongoDB](https://img.shields.io/badge/MongoDB-supported-47A248)
![License](https://img.shields.io/badge/license-MIT-45d6b5)
[![Live reference](https://img.shields.io/badge/live-travel.kairoseth.com-45d6b5)](https://travel.kairoseth.com)

## Project model

This repository is the **MIT-licensed open-source core**. Kairoseth Travel is the official hosted/commercial implementation built on top of it.

That separation is intentional:

- Open Travel Platform remains reusable, provider-neutral and self-hostable;
- Kairoseth Travel can add hosted operations, support, commercial services and private integrations;
- customer data, production credentials and proprietary customer integrations remain outside the public repository;
- downstream providers never receive implicit authority over core booking, inventory or payment state.

## Current position

The original catalogue/booking MVP has evolved into a broad travel-operations platform. The production-hardening engineering baseline is complete and the open-source productisation programme is underway.

**Phase 8 — External integrations: COMPLETE.**  
**Phase 9 — Production hardening engineering baseline: COMPLETE.**  
**Phase 10 — Open-source productisation: IN PROGRESS.**

Phase 10 status:

- **10.1 Reproducible fresh-clone/demo bootstrap — COMPLETE**
- **10.2 Provider-neutral self-host standalone deployment — COMPLETE**
- **10.3 Extension contracts and reference adapters — ACTIVE**

The active Phase 10.3 work formalizes public extension points, contract compatibility/versioning and contributor-facing reference adapters without weakening local domain authority. See [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md).

Credentialed Stripe/Redsys TEST/LIVE E2E remains an explicit external-dependency release validation and must be completed when suitable provider accounts are available.

## Current capabilities

### Catalogue and commerce

- bilingual EN/ES public catalogue and Operator experience;
- destinations, trips, structured itineraries, departures and live inventory;
- accommodations, room types, seasonal/occupancy pricing and galleries;
- independent Activities, Transport and Travel protection products;
- transactional trip/service reservations with server-authoritative pricing and inventory;
- travellers, minors, age bands, guardians and historical pricing snapshots;
- optional package supplements and post-booking amendments.

### Identity and operations

- persistent customer and staff authentication;
- separate customer/staff sessions;
- RBAC and granular Operator/Admin capabilities;
- reservation ownership, notes, priority, tags and operational timeline;
- tasks/follow-ups and supplier fulfilment workflows;
- advanced operational queues, filtering, sorting and pagination;
- privileged changes coupled to persistent audit where required.

### Payments and finance

- provider-neutral payment/refund ledger independent from reservation status;
- bank transfer, cash and external-terminal movements;
- Stripe and Redsys adapters behind unified checkout;
- deposits, installments, outstanding balance and next-payment calculations;
- reconciliation and revenue reporting grouped safely by currency;
- downstream ERP/accounting synchronization of finalized movements only.

### Traveller data, privacy and accessibility

- encrypted post-purchase Traveller Data with staged key rotation;
- authenticated privacy-right requests and Admin review;
- approved access/portability exports;
- controlled restriction and erasure with retention review;
- explicit retention-policy registry and hold handling;
- WCAG 2.2 AA-oriented accessibility engineering baseline across critical customer and Operator journeys;
- dedicated blocking Chromium accessibility workflows.

### Documents and reporting

- booking-confirmation PDFs;
- traveller manifests and rooming lists;
- customer-safe accommodation/service vouchers;
- internal Operator dossier;
- permission-aware CSV/XLSX exports;
- reconciliation, balance and revenue reporting;
- audited protected-data export for legitimate operational use.

### Integrations and adapters

- transactional MongoDB integration outbox;
- signed HTTPS webhooks with encrypted secrets, retries and dead-letter handling;
- durable server-only integration worker with locking, replay and retention;
- generic REST `BookingRepository` adapter;
- provider-neutral supplier-fulfilment adapter;
- downstream-only CRM synchronization adapter;
- downstream-only ERP/accounting adapter;
- structured operational logs and optional provider-neutral failure transport;
- SSRF/DNS-rebinding protections and bounded external transports.

### Production hardening

- global CSP and defensive HTTP headers;
- persistent authentication throttling and explicit Origin checks;
- liveness/readiness endpoints and `demo|live` deployment profiles;
- real MongoDB concurrency, idempotency and amendment validation;
- real local-HTTP adapter contract tests;
- MongoDB backup/restore disaster-recovery drills;
- real MongoDB query-plan/index validation;
- repeatable public/authenticated read, mutation-throughput and runtime-resource baselines.

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
PaymentRepository -> provider-neutral ledger -> Stripe / Redsys / manual
        |                                      |
        |                              succeeded movements
        |                                      |
customer/reservation events                    |
        |                                      |
        +---------- transactional integration outbox ----------+
                                |
                         durable worker
                    /             |              \
             signed webhooks    CRM REST      ERP/accounting REST

Operational failures
        |
structured JSON logs -> optional FailureTransport -> deployment monitoring

Operator/Admin
    |
Operations / RBAC / audit / documents / reports / tasks
    |
SupplierFulfilmentAdapter -> disabled / REST v1
```

Provider-specific payloads stay inside adapters. Core domain rules remain server-authoritative.

## Quick start

Requires **Node.js 24 LTS** and the npm version declared in `packageManager`.

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm ci
npm run setup:demo
npm run dev
```

Open `http://localhost:3000`.

The demo bootstrap is intentionally infrastructure-free: MongoDB, SMTP, PSP, CRM, ERP and supplier credentials are not required for evaluation. `setup:demo` is non-destructive and refuses to overwrite an existing `.env.local` unless explicitly forced.

## Self-host standalone

The project uses Next.js `output: standalone` for a provider-neutral production runtime.

```bash
npm ci
npm run setup:demo
npm run build
npm run package:standalone
node .next/standalone/server.js
```

For real production deployment, use runtime-only secrets and the `live` readiness profile. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and the production checklist before exposing the service publicly.

## Configuration overview

The complete production template lives in [`.env.example`](.env.example). The infrastructure-free evaluation template lives in [`.env.demo.example`](.env.demo.example).

Important rules:

- `KTRAVEL_DEPLOYMENT_PROFILE=live` is a fail-closed readiness contract;
- production REST targets must use HTTPS;
- provider credentials, worker tokens and encryption keys are server-only;
- never place secrets in `NEXT_PUBLIC_*` variables;
- production keys must be stable, high-entropy values and follow the documented rotation/recovery procedure;
- proprietary Kairoseth/customer adapters should remain outside the MIT core when appropriate.

## Documentation

### Project and onboarding

- [`ROADMAP.md`](ROADMAP.md) — delivery status and priorities.
- [`ROADMAP.es.md`](ROADMAP.es.md) — Spanish roadmap.
- [`CHANGELOG.md`](CHANGELOG.md) — notable project changes.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution expectations.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — provider-neutral deployment model.
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — production review.

### Active Phase 10.3

- [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md) — extension authority, compatibility/versioning and Phase 10.3 completion contract.
- [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md) — Spanish version.
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — implementing provider adapters.
- [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) — public catalogue HTTP contract.

### Core domains and operations

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capability, event and trust boundaries.
- [`docs/BOOKING.md`](docs/BOOKING.md) — booking integrity and adapter rules.
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md) — payment ledger and PSP contract.
- [`docs/TRAVELLER-DATA.md`](docs/TRAVELLER-DATA.md) — post-purchase traveller data.
- [`docs/ACCOMMODATION.md`](docs/ACCOMMODATION.md) — accommodation and room inventory.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — staff authorization and workflows.
- [`docs/REPORTING-EXPORTS.md`](docs/REPORTING-EXPORTS.md) — reports and exports.

### Integration contracts

- [`docs/REST-BOOKING-ADAPTER.md`](docs/REST-BOOKING-ADAPTER.md)
- [`docs/SUPPLIER-FULFILMENT-ADAPTER.md`](docs/SUPPLIER-FULFILMENT-ADAPTER.md)
- [`docs/CRM-SYNC-ADAPTER.md`](docs/CRM-SYNC-ADAPTER.md)
- [`docs/ERP-ACCOUNTING-ADAPTER.md`](docs/ERP-ACCOUNTING-ADAPTER.md)
- [`docs/OUTBOUND-INTEGRATIONS.md`](docs/OUTBOUND-INTEGRATIONS.md)
- [`docs/INTEGRATION-OPERATIONS.md`](docs/INTEGRATION-OPERATIONS.md)

### Production engineering

- [`docs/PRODUCTION-SECURITY.md`](docs/PRODUCTION-SECURITY.md)
- [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md)
- [`docs/FAILURE-TRANSPORT.md`](docs/FAILURE-TRANSPORT.md)
- [`docs/ACCESSIBILITY-OPERATOR.md`](docs/ACCESSIBILITY-OPERATOR.md)
- [`docs/PERFORMANCE-LOAD-READINESS.md`](docs/PERFORMANCE-LOAD-READINESS.md)
- [`docs/PERFORMANCE-MUTATION-THROUGHPUT.md`](docs/PERFORMANCE-MUTATION-THROUGHPUT.md)
- [`docs/PERFORMANCE-RUNTIME-RESOURCE.md`](docs/PERFORMANCE-RUNTIME-RESOURCE.md)

## Quality gates

The complete validation command is:

```bash
npm run verify
```

Long-lived blocking/static validation includes, among others:

```text
check:fresh-clone
check:self-host
check:production-security
check:mongodb-concurrency
check:payment-idempotency
check:traveller-amendment-validation
check:adapter-contract-validation
check:observability
check:failure-transport
check:external-monitoring
check:privileged-audit
check:encryption-keyring
check:traveller-key-rotation
check:mongodb-recovery
check:mongodb-index-performance
check:privacy-rights
check:privacy-execution
check:privacy-retention-policy
check:accessibility-foundation
check:accessibility-auth
check:accessibility-traveller-privacy
check:accessibility-booking-payment
check:accessibility-operator
check:performance-load
check:performance-authenticated-read
check:performance-mutation-throughput
check:performance-runtime-resource
check:browser-e2e
typecheck
build
```

Dedicated CI jobs also exercise real MongoDB replica sets, local HTTP contracts, privacy execution, accessibility journeys and performance/resource baselines. The broad registration -> booking -> customer -> Operator browser journey remains informational/non-blocking by explicit project policy.

## Project status

| Area | Status |
|---|---|
| Foundation, architecture and CI | **Complete** |
| Catalogue, identity, reservations and inventory | **Complete** |
| Payments, finance and payment terms | **Complete** |
| Accommodation and package composition | **Complete** |
| Operator workflows and permissions | **Complete** |
| Documents, exports and reporting | **Complete** |
| Phase 8 — External integrations | **Complete** |
| Phase 9 — Production hardening engineering baseline | **Complete** |
| Stripe/Redsys credentialed TEST/LIVE validation | **Pending external provider accounts** |
| Phase 10.1 — Fresh-clone/demo bootstrap | **Complete** |
| Phase 10.2 — Self-host standalone deployment | **Complete** |
| Phase 10.3 — Extension contracts/reference adapters | **Active** |
| Phase 10 — Open-source productisation | **In progress** |

## Active development priority — Phase 10.3

The current block is **Phase 10.3 — Extension contracts and reference adapters**.

Delivery goals:

1. inventory and classify the public extension points already present in the codebase;
2. document which side remains authoritative for booking, inventory, payments, identity, supplier fulfilment, CRM and ERP/accounting flows;
3. define contract compatibility/versioning rules before expanding the adapter ecosystem;
4. add contributor-facing reference implementations and examples;
5. add permanent validation that prevents provider payload/authority leakage across extension boundaries;
6. keep Kairoseth-only and customer-specific adapters outside the generic MIT core when appropriate.

The detailed scope and completion criteria are tracked in [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md) and [`ROADMAP.md`](ROADMAP.md).

After 10.3, Phase 10 continues with release/migration conventions, contribution/release templates and trademark/branding policy.

## License

MIT. See [`LICENSE`](LICENSE).