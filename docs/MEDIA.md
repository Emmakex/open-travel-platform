# Travel media pipeline

Kairoseth Travel treats destination and trip media as first-class catalogue data rather than hard-coded presentation assets.

## Media shape

`Destination.coverImage`, `Destination.gallery`, `Trip.coverImage` and `Trip.gallery` use the shared `TravelMedia` type.

```ts
{
  src: "/media/peru-cover.webp",
  alt: "Andean landscape in Peru",
  caption: "Sacred Valley",
  width: 1600,
  height: 1000,
  focalPoint: "center",
  credit: "Photographer / source"
}
```

Only `src` is required. The remaining fields progressively improve accessibility, cropping, editorial presentation and future backoffice management.

## Rendering

All catalogue and detail images go through `components/travel-image.tsx`, which wraps `next/image` with consistent defaults:

- responsive `sizes` values per surface
- lazy loading for non-priority imagery
- priority loading for detail hero media
- image quality defaults tuned for travel photography
- focal-point-aware cropping
- AVIF and WebP generation for optimizable raster sources
- one-day optimized image cache by default

The current demo artwork is SVG and therefore remains lightweight without raster conversion. Real JPEG/PNG/WebP photography will use the Next.js optimizer automatically.

## Recommended source assets

For future real photography:

- cover / hero: at least 1600×1000 px
- gallery: at least 1400 px on the long edge
- source format: high-quality JPEG, PNG or WebP
- preferred aspect ratio: approximately 16:10 for covers
- avoid baking text or logos into travel photos
- always provide meaningful `alt` text
- store photographer/source credit when required

Do not upload images unless Kairoseth or the customer has the right to use them.

## Remote media hosts

Local assets under `/public` work without configuration.

For a future CDN or media storage provider, set a comma-separated server-side build variable:

```env
TRAVEL_MEDIA_HOSTS=media.example.com,cdn.example.com
```

Only HTTPS hosts in that allowlist are accepted by the Next.js image configuration. Do not use `NEXT_PUBLIC_*` for secrets; this value contains hostnames only.

When using Hostinger auto-deploy, changing `TRAVEL_MEDIA_HOSTS` requires a new build because `next.config.ts` reads the allowlist at build time.

## Backoffice / API readiness

The media fields belong to the provider-neutral domain entities, so a future MongoDB/CMS/backoffice implementation can persist them directly. A typical media-management flow can become:

```text
Upload image
  → storage/CDN
  → save src + dimensions + alt + focal point + credit
  → assign as cover or gallery item
  → TravelRepository
  → Kairoseth Travel UI
```

This keeps storage/provider choices outside the page components and allows the current demo repository, a MongoDB-backed repository or an HTTP adapter to expose the same contract.
