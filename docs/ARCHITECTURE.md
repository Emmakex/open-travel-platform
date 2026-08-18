# Architecture

Open Travel Platform uses small ports-and-adapters boundaries so product UI and domain code do not depend directly on one backend, identity provider or travel vendor.

## Current flows

### Catalogue

```text
Next.js pages/components
        |
        v
TravelRepository
        |
        +--> DemoTravelRepository
        |
        +--> HttpTravelRepository
```

### Identity

```text
Account UI / server actions
        |
        v
IdentityRepository
        |
        +--> DemoIdentityRepository
        |
        +--> Future Auth.js / OAuth / SSO / external identity adapter
```

## Layers

### `domain/`
Pure TypeScript entities and value shapes. Domain files must not import Next.js, browser APIs, databases or vendor SDKs.

### `repositories/`
Interfaces consumed by application code. They describe capabilities, not transport details.

### `adapters/`
Infrastructure implementations. Current adapters include an in-memory travel catalogue, a generic HTTP travel adapter and a fictional demo identity adapter.

### `data/`
Original, non-production demo fixtures. Demo data exists so forks can run immediately and safely.

### `lib/`
Application configuration and composition. Adapter selection and security-sensitive server-only configuration live here rather than inside pages.

### `app/` and `components/`
Next.js presentation layer. UI code consumes repository capabilities instead of hard-coded external URLs or provider SDKs.

## Travel data modes

### Demo mode

```text
NEXT_PUBLIC_DATA_MODE=demo
```

No external travel service is required.

### API mode

```text
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_TRAVEL_API_URL=https://api.example.com
```

The HTTP adapter expects the read-only catalogue endpoints documented in `API-CONTRACT.md`.

## Identity modes

Identity configuration is server-only.

```text
IDENTITY_MODE=demo
DEMO_IDENTITY_ENABLED=false
```

Development defaults to demo identity when `IDENTITY_MODE` is omitted. Production defaults to identity disabled. A production deployment must explicitly opt into the fictional demo session or, preferably, replace it with a real identity adapter.

See `IDENTITY.md` for the trust model and production integration rules.

## Security rule

Client-visible `NEXT_PUBLIC_*` variables must never contain credentials, secrets, private keys or privileged tokens. Authentication and authorization for private resources belong on trusted server-side boundaries.

## Future boundaries

Reservations, availability, operator/admin workflows and optional provider/payment/CRM connectors will each be added as dedicated capabilities rather than leaking vendor-specific payloads across the application.
