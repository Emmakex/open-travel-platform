import Link from "next/link";
import type { TravelLocale, Trip } from "@/domain/travel/types";
import { TravelImage } from "@/components/travel-image";
import { formatCurrency, getDictionary, localizeTrip } from "@/lib/i18n";

export function TripCard({ trip, locale = "en" }: { trip: Trip; locale?: TravelLocale }) {
  const localizedTrip = localizeTrip(trip, locale);
  const copy = getDictionary(locale);
  const price = formatCurrency(trip.fromPrice, trip.currency, locale);

  return (
    <article className="card trip-card">
      <Link
        className="card-media trip-card-media"
        data-visual={trip.slug}
        href={`/trips/${trip.slug}`}
        aria-label={`${copy.trips.explore} ${localizedTrip.title}`}
      >
        {trip.coverImage ? (
          <TravelImage
            className="card-media-image"
            media={trip.coverImage}
            fallbackAlt={localizedTrip.title}
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
          />
        ) : null}
        <span className="card-media-shade" aria-hidden="true" />
        <span className="card-media-label">{trip.durationDays} {copy.trips.days}</span>
        <span className="card-media-title">{copy.trips.from} {price}</span>
      </Link>
      <div className="card-body">
        <div className="card-kicker">{copy.home.featuredJourney}</div>
        <h3><Link href={`/trips/${trip.slug}`}>{localizedTrip.title}</Link></h3>
        <p>{localizedTrip.summary}</p>
        <ul className="highlight-list">
          {localizedTrip.highlights.slice(0, 3).map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
        <div className="trip-meta">
          <Link className="text-link" href={`/trips/${trip.slug}`}>{copy.trips.explore}</Link>
          <strong>{price}</strong>
        </div>
      </div>
    </article>
  );
}
