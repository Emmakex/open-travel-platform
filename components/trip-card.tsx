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
    <article className="card">
      <div className="card-kicker">{trip.durationDays} days</div>
      <h3><Link href={`/trips/${trip.slug}`}>{trip.title}</Link></h3>
      <p>{trip.summary}</p>
      <ul className="highlight-list">
        {trip.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
      <div className="trip-meta">
        <Link className="text-link" href={`/trips/${trip.slug}`}>Explore trip →</Link>
        <strong>From {price}</strong>
      </div>
    </article>
  );
}
