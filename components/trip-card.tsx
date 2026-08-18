import type { Trip } from "@/domain/travel/types";

const currency = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

export function TripCard({ trip }: { trip: Trip }) {
  const price = trip.currency === "EUR" ? currency.format(trip.fromPrice) : `${trip.fromPrice} ${trip.currency}`;

  return (
    <article className="card">
      <div className="card-kicker">{trip.durationDays} day itinerary</div>
      <h3>{trip.title}</h3>
      <p>{trip.summary}</p>
      <ul className="highlight-list">
        {trip.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
      <div className="trip-meta">
        <span>Demo catalogue</span>
        <strong>From {price}</strong>
      </div>
    </article>
  );
}
