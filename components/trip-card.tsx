import Link from "next/link";
import type { Trip } from "@/domain/travel/types";

const euro = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

export function TripCard({ trip }: { trip: Trip }) {
  const price = trip.currency === "EUR" ? euro.format(trip.fromPrice) : `${trip.fromPrice} ${trip.currency}`;

  return (
    <article className="card trip-card">
      <Link
        className="card-media trip-card-media"
        data-visual={trip.slug}
        href={`/trips/${trip.slug}`}
        aria-label={`Explore ${trip.title}`}
      >
        <span className="card-media-label">{trip.durationDays} days</span>
        <span className="card-media-title">From {price}</span>
      </Link>
      <div className="card-body">
        <div className="card-kicker">Curated journey</div>
        <h3><Link href={`/trips/${trip.slug}`}>{trip.title}</Link></h3>
        <p>{trip.summary}</p>
        <ul className="highlight-list">
          {trip.highlights.slice(0, 3).map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
        <div className="trip-meta">
          <Link className="text-link" href={`/trips/${trip.slug}`}>Explore trip →</Link>
          <strong>{price}</strong>
        </div>
      </div>
    </article>
  );
}
