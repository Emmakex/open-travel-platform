# Travel media pipeline

Kairoseth Travel treats destination and trip media as first-class catalogue data rather than hard-coded presentation assets.

## Media shape

`Destination.coverImage`, `Destination.gallery`, `Trip.coverImage` and `Trip.gallery` use the shared `TravelMedia` type.

```ts
{
  src: "/media/68a8...",
  alt: "Andean landscape in Peru",
  caption: "Sacred Valley",
  width: 1600,
  height: 1000,
  focalPoint: "center",
  credit: "Photographer / source"
}
```

Only `src` is required. The remaining fields progressively improve accessibility, cropping and editorial presentation.

## Rendering

All catalogue and detail images go through `components/travel-image.tsx`, which wraps `next/image` with consistent defaults:

- responsive `sizes` values per surface
- lazy loading for non-priority imagery
- priority loading for detail hero media
- image quality defaults tuned for travel photography
- focal-point-aware cropping
- AVIF and WebP generation for optimizable raster sources
- one-day optimized image cache by default

## Built-in MongoDB media library

The operator media manager is available at `/operator/media` and is protected by the existing operator/admin authorization boundary.

Uploaded images are stored in the `ktravel` MongoDB database using GridFS bucket `travel_media`. GridFS creates the standard collections:

- `travel_media.files`
- `travel_media.chunks`

This makes uploaded media persistent across Hostinger redeploys without relying on the application server filesystem.

Supported upload formats:

- JPEG
- PNG
- WebP
- AVIF

The default upload limit is 8 MB per file. SVG uploads are intentionally not accepted because user-supplied same-origin SVG can introduce active-content security risks.

Every uploaded asset receives a stable application URL:

```text
/media/<GridFS ObjectId>
```

## Catalogue-editor workflow

Destination and trip editors support both workflows:

1. **Upload image** directly beside a cover or gallery field. The file is written to GridFS immediately, its `/media/<id>` URL is selected automatically, and saving the destination/trip assigns it to that field.
2. **Choose from media library** to reuse an image that has already been uploaded.

The editor shows an immediate preview of the selected source and also lets the operator clear the assignment before saving. Inline uploads still become normal media-library assets, so there is only one underlying storage system.

ALT text, caption, credit and focal point remain catalogue metadata and can be edited alongside the selected image.

Deletion is protected: an asset cannot be deleted while a destination or trip references it as a cover or gallery image.

## Recommended source assets

For real photography:

- cover / hero: at least 1600×1000 px
- gallery: at least 1400 px on the long edge
- source format: high-quality JPEG, PNG, WebP or AVIF
- preferred aspect ratio: approximately 16:10 for covers
- avoid baking text or logos into travel photos
- always provide meaningful `alt` text
- store photographer/source credit when required

Do not upload images unless Kairoseth or the customer has the right to use them.

## Remote media hosts

The built-in `/media/<id>` GridFS URLs and local assets under `/public` work without additional host configuration.

For an optional external CDN or storage provider, set a comma-separated server-side build variable:

```env
TRAVEL_MEDIA_HOSTS=media.example.com,cdn.example.com
```

Only HTTPS hosts in that allowlist are accepted by the Next.js image configuration. Changing `TRAVEL_MEDIA_HOSTS` requires a new build because `next.config.ts` reads the allowlist at build time.

## Architecture

```text
Catalogue editor / media library
  → protected upload API
  → MongoDB GridFS (ktravel / travel_media)
  → stable /media/<id> URL
  → cover/gallery assignment
  → TravelRepository
  → Kairoseth Travel UI
```

Storage remains separate from catalogue entities: destinations and trips store media metadata and URLs, while GridFS owns the binary files. This keeps the domain provider-neutral and leaves the door open for a future CDN/S3-compatible storage adapter without redesigning the catalogue.
