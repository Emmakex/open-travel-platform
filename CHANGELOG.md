# Changelog

All notable project changes are documented here.

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
