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
    "featured": true,
    "translations": {
      "es": {
        "name": "Barcelona",
        "country": "España",
        "region": "Cataluña",
        "summary": "..."
      }
    }
  }
]
```

`translations` is optional. The canonical fields remain valid on their own, while supported localized fields can be supplied under a locale key such as `en` or `es`.

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
    "itinerary": [
      {
        "day": 1,
        "title": "Arrival",
        "summary": "..."
      }
    ],
    "included": ["Accommodation"],
    "notIncluded": ["Flights"],
    "featured": true,
    "translations": {
      "es": {
        "title": "Escapada a Barcelona",
        "summary": "...",
        "highlights": ["Arquitectura", "Barrios"],
        "itinerary": [
          {
            "day": 1,
            "title": "Llegada",
            "summary": "..."
          }
        ],
        "included": ["Alojamiento"],
        "notIncluded": ["Vuelos"]
      }
    }
  }
]
```

`itinerary`, `included`, `notIncluded` and `translations` are optional so existing catalogue adapters can continue returning the smaller core trip shape. Rich product pages progressively enhance when those fields are present.

## GET `/trips/:slug`

Returns one trip object. Return HTTP `404` when the slug does not exist.

## Relationships

`Trip.destinationId` references `Destination.id`. The UI resolves this relationship through domain identifiers rather than embedding backend-specific objects.

## Localization

The public Kairoseth Travel demo currently supports `en` and `es`. Locale preference is stored separately from catalogue data. The domain entities keep canonical values plus optional localized overlays, which allows future CMS, MongoDB or supplier adapters to expose multilingual content without changing page/component contracts.

## Search and filters

Catalogue search/filtering is performed client-side over the records returned by `listTrips()`. Search operates on the currently localized title, summary, highlights and destination content. A future high-volume adapter may expose server-side query capabilities without changing the core `Trip` and `Destination` domain entities.

## Security boundary

`NEXT_PUBLIC_TRAVEL_API_URL` is browser-visible configuration. Never place API keys, passwords, tokens or other secrets in `NEXT_PUBLIC_*` variables.

For authenticated or privileged operations, production implementations should use server-side route handlers, server actions or another backend-for-frontend boundary so secrets and trusted credentials remain server-side.
