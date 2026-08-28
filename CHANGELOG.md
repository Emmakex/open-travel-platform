# Changelog

All notable project changes are documented here.

## [Unreleased] - 2026-08-28

### Added
- Phase 10.3 extension-contract documentation in English and Spanish.
- Explicit authority model for repository, workflow-sync, downstream CRM/ERP and delivery/observability extensions.
- Code-backed Phase 10.3.1 public extension inventory in English and Spanish.
- Verified map of all 9 first-class `repositories/` interfaces, composition selectors, bundled implementations and network contracts.
- Explicit `PaymentRepository` classification as the local provider-neutral financial-ledger boundary.
- Phase 10.3.2 compatibility/versioning policy in English and Spanish through `docs/EXTENSION-COMPATIBILITY.md` and `docs/EXTENSION-COMPATIBILITY.es.md`.
- Compatibility matrix covering typed in-process interfaces, REST/HTTP contracts, event envelopes, failure-event schemas and webhook signature versions.
- Explicit migration/deprecation rules for breaking public contract changes, including no hidden downgrade fallback for mutating v2-to-v1 flows.
- Phase 10.3.3 contributor-facing reference-adapter guides in English and Spanish through `docs/REFERENCE-ADAPTERS.md` and `docs/REFERENCE-ADAPTERS.es.md`.
- Official reference patterns backed by existing real implementations: `RestBookingRepository`, `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()`, `RestCrmSyncAdapter`, and optional monitoring-only `RestFailureTransport`.
- Reference guidance for server-only credentials, bounded transport, runtime validation, stable error normalization, deterministic idempotency, audit-before-apply, provider-version absorption and deliberate v1-to-v2 migration.
- Explicit project phase-completion rule in `CONTRIBUTING.md`: implementation -> validation -> EN/ES documentation -> PR review -> green CI -> merge -> verify `main` before starting the next phase.

### Changed
- Phase 10 is documented as **IN PROGRESS**, with 10.1 and 10.2 complete and 10.3 active.
- **Phase 10.3.1, 10.3.2 and 10.3.3 are COMPLETE; Phase 10.3.4 permanent extension-contract validation becomes ACTIVE only after the 10.3.3 closing PR merges.**
- README and ROADMAP EN/ES are synchronized with the completed extension inventory, compatibility policy and contributor reference adapters.
- Existing REST v1 paths/headers remain unchanged; compatibility policy documents them instead of silently rewriting deployed contracts.
- Typed repository/adapter interfaces are governed by the SemVer/release lifecycle of the core rather than a synthetic global extension version.
- The read-only catalogue HTTP contract is treated as a legacy-v1 compatibility surface: additive evolution is allowed, while breaking evolution requires a new versioned surface.
- Outbound event schema version and webhook signature algorithm version are explicitly treated as independent compatibility dimensions.
- Adapter guidance now identifies real tested implementations as the canonical contributor references instead of introducing parallel toy adapters.
- The reference network adapters are explicitly tied to the existing `tests/rest-adapter-contracts.ts` coverage for contract version, invalid schema/content type, scope, size bounds, retries and idempotency where applicable.
- README runtime badge reflects Next.js 16.3.2.
- Quick-start and contribution workflows use reproducible `npm ci` + non-destructive `npm run setup:demo` instead of ad-hoc `npm install` setup.
- Adapter guidance covers `PaymentRepository`, CRM, ERP/accounting, supplier fulfilment, failure visibility, generic webhooks and explicit authority boundaries.
- Stripe/Redsys are classified as PSP/checkout integrations rather than `PaymentRepository` implementations.
- SMTP/email and arbitrary internal modules are explicitly not promoted to public plugin contracts.

### External validation still pending
- Credentialed Stripe/Redsys TEST/LIVE end-to-end validation remains pending suitable provider accounts. This does not reopen the completed Phase 9 engineering baseline.

## [1.0.0] - 2026-08-18

### Added
- Stable release documentation for catalogue, identity, booking and operations capability boundaries.
- `docs/ADAPTER-GUIDE.md` for replacing demo implementations with production providers.
- `docs/DEPLOYMENT.md` and `docs/PRODUCTION-CHECKLIST.md` for deployment and production-readiness review.
- `ROADMAP.md` and `SUPPORT.md` for post-1.0 maintenance and support expectations.
- GitHub issue forms and pull-request template.
- Release consistency validation through `scripts/release-check.mjs`.
- Stronger public-source safety rules.
- HTTP smoke tests against the production build in CI.

### Changed
- Package version promoted to `1.0.0`.
- README reframed around the stable reusable starter rather than an in-progress milestone.
- CI now validates safe production capability defaults, release consistency, TypeScript, production build, HTTP routes and dependency security.
- Runtime versions remain explicitly pinned for stable-release predictability.

### Security
- Release checks require safe demo defaults in `.env.example`.
- Source safety now rejects additional high-risk patterns such as dynamic code execution, direct cookie access and unsafe HTML injection in application source.
- Production deployment guidance requires replacing fictional identity, booking and operations persistence before using real data.
- Smoke tests verify representative public/protected routes after the production server starts.

### Compatibility
- Node.js 24 LTS target.
- Next.js 16.3.1.
- React / ReactDOM 19.2.8.
- TypeScript 6.x.

## [0.5.0] - 2026-08-18

### Added
- Fixed fictional customer, operator and admin identity fixtures.
- Server-side role predicates and reusable customer/staff authorization helpers.
- Dedicated `OperationsRepository` capability boundary.
- Staff operations dashboard with pending/confirmed/cancelled metrics.
- Role-protected reservation queue and detail routes.
- Validated staff reservation status transitions.
- Fictional staff audit events recording actor, role, transition and timestamp.
- Shared demo reservation store used by customer booking and staff operations adapters.
- Dedicated operations architecture/trust-boundary documentation.

### Security
- Customer routes/actions explicitly require the `customer` role.
- Staff routes/actions require `operator` or `admin` on the server.
- Demo staff identities are fixed server-side; browser role input is never authoritative.
- Production operations default to disabled.
- Production demo staff writes require `OPERATIONS_MODE=demo` and `DEMO_OPERATIONS_ENABLED=true`.
- Unsupported reservation status transitions are rejected server-side.

### Changed
- Customer and staff surfaces are separated even when a valid session exists.
- Demo reservation cancellation records `updatedAt`.
- Primary navigation exposes the operator demo entry.

## [0.4.0] - 2026-08-18

### Added
- Availability and reservation domain models.
- `BookingRepository` capability boundary.
- Fictional availability fixtures for demo trips.
- Server-side reservation creation with trusted trip price calculation.
- Trip booking route with departure and party-size selection.
- Customer reservation history and reservation detail routes.
- Identity-scoped demo cancellation flow.
- Cookie-backed fictional demo reservation persistence.
- Dedicated booking architecture and trust-boundary documentation.

### Security
- Booking defaults to disabled in production when not explicitly configured.
- Production demo writes require `BOOKING_MODE=demo` and `DEMO_BOOKING_ENABLED=true`.
- Reservation creation validates identity, trip, selected availability, party size and remaining spaces server-side.
- Client-supplied totals are never trusted.
- Reservation reads and cancellation are scoped by identity.

### Changed
- Trip detail pages now link to the booking/availability capability.
- Customer account shows reservation summary/history.
- React and ReactDOM aligned to 19.2.8.

## [0.3.0] - 2026-08-18

### Added
- Typed identity, customer profile and role domain models.
- `IdentityRepository` provider boundary.
- Fictional passwordless demo customer session using an HTTP-only cookie.
- Protected customer account page and provider-neutral sign-in surface.
- Account entry in primary navigation.
- Dedicated identity/security architecture documentation.
- Scoped account CSS module.

### Security
- Production identity defaults to disabled when not explicitly configured.
- Production demo sign-in requires an explicit `DEMO_IDENTITY_ENABLED=true` opt-in.
- Identity configuration remains server-only; no credentials are handled by the demo flow.

## [0.2.0] - 2026-08-18

### Added
- Searchable and filterable trip catalogue.
- Destination detail pages with related itineraries.
- Trip detail pages with destination relationships and itinerary highlights.
- Destination detail capability in `TravelRepository`.
- Generic REST endpoint contract for destination detail.
- Reusable destination cards and catalogue explorer UI.

### Changed
- Homepage links directly into the destination and trip catalogue experience.
- Navigation exposes the dedicated trips catalogue.
- Catalogue documentation expanded for v0.2.

## [0.1.0] - 2026-08-18

### Added
- Clean-room Next.js application foundation.
- Original responsive visual system and fictional demo catalogue.
- Typed destination and trip domain models.
- `TravelRepository` interface with demo and generic REST adapters.
- Demo/API environment-driven composition.
- Public-source safety checks, TypeScript validation, production build and dependency audit in CI.
- MIT license, contribution guidelines and security policy.
