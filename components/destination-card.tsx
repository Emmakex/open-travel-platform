import Image from "next/image";
import Link from "next/link";
import type { Destination, TravelLocale } from "@/domain/travel/types";
import { getDictionary, localizeDestination } from "@/lib/i18n";

export function DestinationCard({
  destination,
  locale = "en"
}: {
  destination: Destination;
  locale?: TravelLocale;
}) {
  const localizedDestination = localizeDestination(destination, locale);
  const copy = getDictionary(locale);

  return (
    <article className="card destination-card">
      <Link
        className="card-media"
        data-visual={destination.slug}
        href={`/destinations/${destination.slug}`}
        aria-label={`${copy.destinations.discover} ${localizedDestination.name}`}
      >
        {destination.coverImage ? (
          <Image
            className="card-media-image"
            src={destination.coverImage.src}
            alt={destination.coverImage.alt ?? localizedDestination.name}
            fill
            sizes="(max-width: 880px) 100vw, 33vw"
          />
        ) : null}
        <span className="card-media-shade" aria-hidden="true" />
        <span className="card-media-label">{localizedDestination.country}</span>
        <span className="card-media-title">{localizedDestination.name}</span>
      </Link>
      <div className="card-body">
        <div className="card-kicker">{localizedDestination.region}</div>
        <h3><Link href={`/destinations/${destination.slug}`}>{localizedDestination.name}</Link></h3>
        <p>{localizedDestination.summary}</p>
        <div className="trip-meta">
          <span>{copy.destinations.curated}</span>
          <Link className="text-link" href={`/destinations/${destination.slug}`}>{copy.destinations.discover}</Link>
        </div>
      </div>
    </article>
  );
}
