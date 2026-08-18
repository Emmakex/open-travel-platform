# Changelog

All notable project changes are documented here.

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
- Homepage now links directly into the destination and trip catalogue experience.
- Navigation now exposes the dedicated trips catalogue.
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
