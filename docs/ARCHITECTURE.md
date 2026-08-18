# Architecture

Open Travel Platform uses small ports-and-adapters boundaries so product UI and domain code do not depend directly on one backend, identity provider, booking engine or travel vendor.

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

### Booking

```text
Trip/account UI
        |
        v
Server-side validation
        |
        v
BookingRepository
        |
        +--> DemoBookingRepository
        |
        +--> Future booking engine / database / supplier adapter
```

## Layers

### `domain/`
Pure TypeScript entities and value shapes. Domain files must not import Next.js, browser APIs, databases or vendor SDKs.

### `repositories/`
Interfaces consumed by application code. They describe capabilities, not transport details.

### `adapters/`
Infrastructure implementations. Current adapters include an in-memory travel catalogue, a generic HTTP travel adapter, a fictional demo identity adapter and a cookie-backed fictional booking adapter.

### `data/`
Original, non-production demo fixtures such as catalogue and availability records. Demo data exists so forks can run immediately and safely.

### `lib/`
Application configuration and composition. Adapter selection and security-sensitive server-only configuration live here rather than inside pages.

### `app/` and `components/`
Next.js presentation layer and server actions. UI code consumes repository capabilities instead of hard-coded external URLs or provider SDKs.

## Travel data modes

```text
NEXT_PUBLIC_DATA_MODE=demo
```

No external travel service is required.

For an external read-only catalogue:

```text
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_TRAVEL_API_URL=https://api.example.com
```

See `API-CONTRACT.md`.

## Identity modes

Identity configuration is server-only.

```text
IDENTITY_MODE=demo
DEMO_IDENTITY_ENABLED=false
```

Development defaults to demo identity when `IDENTITY_MODE` is omitted. Production defaults to identity disabled. See `IDENTITY.md`.

## Booking modes

Booking configuration is also server-only.

```text
BOOKING_MODE=demo
DEMO_BOOKING_ENABLED=false
```

Development defaults to demo booking. Production defaults to booking disabled. Demo writes in production require explicit opt-in. See `BOOKING.md`.

## Trust boundaries

Client-visible `NEXT_PUBLIC_*` variables must never contain credentials, secrets, private keys or privileged tokens.

Private operations must be validated on trusted server-side boundaries. In v0.4 this includes:

- resolving the current identity;
- resolving the trip from the travel repository;
- validating availability and remaining spaces;
- calculating reservation totals from trusted server-side catalogue data;
- scoping reservation reads/cancellation by identity.

## Future boundaries

Operator/admin workflows and optional provider/payment/CRM connectors will be added as dedicated capabilities rather than leaking vendor-specific payloads across the application.
