# Architecture

Open Travel Platform uses small ports-and-adapters boundaries so product UI and domain code do not depend directly on one backend, identity provider, booking engine, CRM or travel vendor.

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

### Identity and authorization

```text
Customer / staff routes
        |
        v
IdentityRepository
        |
        +--> DemoIdentityRepository
        |
        +--> Future Auth.js / OAuth / SSO / external identity adapter
        |
        v
server-side role checks
```

### Customer booking

```text
Trip/account UI
        |
        v
customer role check + server validation
        |
        v
BookingRepository
        |
        +--> DemoBookingRepository
        |
        +--> Future booking engine / database / supplier adapter
```

### Staff operations

```text
/operator routes + actions
        |
        v
operator/admin role check
        |
        v
OperationsRepository
        |
        +--> DemoOperationsRepository
        |
        +--> Future CRM / ERP / booking backoffice adapter
```

`BookingRepository` and `OperationsRepository` intentionally remain separate even though both interact with reservation records. Customer code should not receive administrative methods simply because it can create a booking.

## Layers

### `domain/`
Pure TypeScript entities and value shapes. Domain files must not import Next.js, browser APIs, databases or vendor SDKs.

### `repositories/`
Interfaces consumed by application code. They describe capabilities, not transport details. Current boundaries are travel, identity, booking and operations.

### `adapters/`
Infrastructure implementations. Current adapters include an in-memory travel catalogue, a generic HTTP travel adapter, fictional identity, cookie-backed fictional booking and cookie-backed fictional operations.

### `data/`
Original, non-production demo fixtures such as catalogue, availability and fixed fictional identities. Demo data exists so forks can run immediately and safely.

### `lib/`
Application configuration, capability composition, demo stores and shared authorization predicates. Security-sensitive server-only configuration lives here rather than in browser components.

### `app/` and `components/`
Next.js presentation layer and server actions. UI code consumes capability interfaces instead of hard-coded external URLs or provider SDKs.

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

```text
BOOKING_MODE=demo
DEMO_BOOKING_ENABLED=false
```

Development defaults to demo booking. Production defaults to booking disabled. Demo writes in production require explicit opt-in. See `BOOKING.md`.

## Operations modes

```text
OPERATIONS_MODE=demo
DEMO_OPERATIONS_ENABLED=false
```

Development defaults to demo operations. Production defaults to operations disabled. Demo staff writes in production require explicit opt-in. See `OPERATIONS.md`.

## Trust boundaries

Client-visible `NEXT_PUBLIC_*` variables must never contain credentials, secrets, private keys or privileged tokens.

Private operations are validated on trusted server-side boundaries. Current rules include:

- customer routes/actions require a resolved `customer` identity;
- operator routes/actions require a resolved `operator` or `admin` identity;
- browser-supplied role values are never authoritative;
- booking totals are derived from trusted trip data;
- availability, remaining capacity and identity ownership are checked server-side;
- operational state transitions are revalidated server-side;
- staff status changes emit a fictional audit event in demo mode.

## Demo-store limitation

Cookie-backed demo stores exist to make a fresh clone useful with no database. They are intentionally browser-local, capped and fictional. They are not substitutes for durable multi-user storage, transactional inventory or audit infrastructure.

## Future boundaries

Provider/payment/CRM integrations, notifications and broader administration should continue to be introduced as dedicated capabilities rather than leaking vendor-specific payloads across the application.
