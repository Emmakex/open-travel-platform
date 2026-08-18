# Changelog

All notable project changes are documented here.

## [0.3.0] - 2026-08-18

### Added
- Typed identity, customer profile and role domain models.
- `IdentityRepository` provider boundary.
- Fictional passwordless demo customer session using an HTTP-only cookie.
- Protected customer account page and provider-neutral sign-in surface.
- Account-aware primary navigation.
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
