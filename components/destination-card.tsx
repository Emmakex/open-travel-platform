import Link from "next/link";
import type { Destination } from "@/domain/travel/types";

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <article className="card">
      <div className="card-kicker">{destination.region}</div>
      <h3><Link href={`/destinations/${destination.slug}`}>{destination.name}</Link></h3>
      <p>{destination.summary}</p>
      <div className="trip-meta">
        <span>{destination.country}</span>
        <Link className="text-link" href={`/destinations/${destination.slug}`}>Explore →</Link>
      </div>
    </article>
  );
}
