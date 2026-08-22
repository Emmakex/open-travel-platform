# Catalogue backoffice

Kairoseth Travel keeps destination and trip catalogue data in MongoDB and edits it through the protected operator backoffice.

## Structured media editing

Destination and trip forms can store a cover image and a gallery using URL-based media entries. Each media item supports:

- `src`
- `alt`
- `caption`
- `credit`
- `focalPoint`

Media URLs are stored as catalogue data only. Upload/storage infrastructure is intentionally a separate concern and can be added later without changing the public catalogue model.

External image hosts must be included in the server-side `TRAVEL_MEDIA_HOSTS` allowlist used by Next.js image configuration. Local `/...` paths continue to work without an external host.

## Trip itinerary editing

Trip forms store itinerary rows as structured `TripDay` entries. Spanish itinerary rows are stored independently in `translations.es.itinerary`.

The backoffice also edits English and Spanish included/not-included lists.

Public MongoDB reads continue to hide draft records. All catalogue writes require the existing operator/admin authorization boundary.
