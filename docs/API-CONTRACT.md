# HTTP catalogue adapter contract

The initial HTTP adapter is deliberately small and read-only. It exists to prove that the UI can switch away from demo data without changing page code.

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

## GET `/trips`

Returns an array of trip objects.

## GET `/trips/:slug`

Returns one trip or `null`.

## Security boundary

`NEXT_PUBLIC_TRAVEL_API_URL` is browser-visible configuration. Never place API keys, passwords, tokens or other secrets in `NEXT_PUBLIC_*` variables.

For authenticated or privileged operations, future versions should use server-side route handlers, server actions or another backend-for-frontend boundary so secrets and trusted credentials remain server-side.
