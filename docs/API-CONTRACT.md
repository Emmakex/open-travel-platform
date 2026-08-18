# HTTP catalogue adapter contract

The HTTP adapter is deliberately small and read-only. It proves that UI routes can switch away from demo data without changing page or component code.

Base URL:

```text
NEXT_PUBLIC_TRAVEL_API_URL=https://api.example.com
```

## GET `/destinations`

Returns an array of destination objects matching `domain/travel/types.ts`.

```json
[
  {
    "id": "dest-1",
    "slug": "barcelona",
    "name": "Barcelona",
    "country": "Spain",
    "region": "Catalonia",
    "summary": "...",
    "featured": true
  }
]
```

## GET `/destinations/:slug`

Returns one destination object. Return HTTP `404` when the slug does not exist; the adapter maps that response to `null`.

## GET `/trips`

Returns an array of trip objects.

```json
[
  {
    "id": "trip-1",
    "slug": "barcelona-city-break",
    "destinationId": "dest-1",
    "title": "Barcelona City Break",
    "summary": "...",
    "durationDays": 4,
    "fromPrice": 540,
    "currency": "EUR",
    "highlights": ["Architecture", "Neighbourhoods"],
    "featured": true
  }
]
```

## GET `/trips/:slug`

Returns one trip object. Return HTTP `404` when the slug does not exist.

## Relationships

`Trip.destinationId` references `Destination.id`. The UI resolves this relationship through domain identifiers rather than embedding backend-specific objects.

## Search and filters

In v0.2, catalogue search/filtering is performed client-side over the records returned by `listTrips()`. A future high-volume adapter may expose server-side query capabilities without changing the core `Trip` and `Destination` domain entities.

## Security boundary

`NEXT_PUBLIC_TRAVEL_API_URL` is browser-visible configuration. Never place API keys, passwords, tokens or other secrets in `NEXT_PUBLIC_*` variables.

For authenticated or privileged operations, future versions should use server-side route handlers, server actions or another backend-for-frontend boundary so secrets and trusted credentials remain server-side.
