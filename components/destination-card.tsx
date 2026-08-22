import Link from "next/link";
import type { Destination } from "@/domain/travel/types";

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <article className="card destination-card">
      <Link
        className="card-media"
        data-visual={destination.slug}
        href={`/destinations/${destination.slug}`}
        aria-label={`Discover ${destination.name}`}
      >
        <span className="card-media-label">{destination.country}</span>
        <span className="card-media-title">{destination.name}</span>
      </Link>
      <div className="card-body">
        <div className="card-kicker">{destination.region}</div>
        <h3><Link href={`/destinations/${destination.slug}`}>{destination.name}</Link></h3>
        <p>{destination.summary}</p>
        <div className="trip-meta">
          <span>Curated destination</span>
          <Link className="text-link" href={`/destinations/${destination.slug}`}>Discover →</Link>
        </div>
      </div>
    </article>
  );
}
