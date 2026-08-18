# Architecture

Open Travel Platform uses a small ports-and-adapters boundary so travel-domain code and UI do not depend directly on one backend vendor.

## Current flow

```text
Next.js pages/components
        |
        v
TravelRepository interface
        |
        +--> DemoTravelRepository
        |
        +--> HttpTravelRepository
```

## Layers

### `domain/`
Pure TypeScript entities and value shapes. Domain files must not import Next.js, browser APIs, databases or vendor SDKs.

### `repositories/`
Interfaces consumed by application code. They describe capabilities, not transport details.

### `adapters/`
Infrastructure implementations. The initial release includes an in-memory demo catalogue and a generic HTTP implementation.

### `data/`
Original, non-production demo fixtures. Demo data exists so forks can run immediately and safely.

### `lib/`
Application configuration and composition. Adapter selection happens here rather than inside pages.

### `app/` and `components/`
Next.js presentation layer. UI code should consume repository capabilities instead of hard-coded external URLs.

## Data modes

### Demo mode

```text
NEXT_PUBLIC_DATA_MODE=demo
```

No external service is required.

### API mode

```text
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_TRAVEL_API_URL=https://api.example.com
```

The v0.1 HTTP adapter expects read-only catalogue endpoints documented in `API-CONTRACT.md`.

## Future boundaries

Planned capabilities include authentication, reservations, availability, operator/admin workflows and optional provider/payment/CRM connectors. Each external integration should live behind a dedicated interface or adapter rather than leaking vendor-specific payloads into the UI.
