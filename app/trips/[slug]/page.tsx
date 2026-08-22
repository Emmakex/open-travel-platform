import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTravelRepository } from "@/lib/travel-repository";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const formatPrice = (value: number, currency: string) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);

export async function generateStaticParams() {
  const trips = await getTravelRepository().listTrips();
  return trips.map((trip) => ({ slug: trip.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTravelRepository().getTripBySlug(slug);

  if (!trip) return { title: "Trip not found" };

  return {
    title: trip.title,
    description: trip.summary
  };
}

export default async function TripDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const repository = getTravelRepository();
  const trip = await repository.getTripBySlug(slug);

  if (!trip) notFound();

  const destinations = await repository.listDestinations();
  const destination = destinations.find((item) => item.id === trip.destinationId);

  return (
    <main>
      <section className="detail-hero">
        <div className="container detail-grid">
          <div>
            <div className="eyebrow">{destination?.name ?? "Travel itinerary"}</div>
            <h1>{trip.title}</h1>
            <p className="hero-copy">{trip.summary}</p>
            {destination ? (
              <Link className="text-link detail-link" href={`/destinations/${destination.slug}`}>
                Explore {destination.name} →
              </Link>
            ) : null}
          </div>
          <div className="detail-facts">
            <div><span>Duration</span><strong>{trip.durationDays} days</strong></div>
            <div><span>Starting price</span><strong>{formatPrice(trip.fromPrice, trip.currency)}</strong></div>
            <div><span>Highlights</span><strong>{trip.highlights.length}</strong></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container detail-content">
          <div>
            <div className="eyebrow">Your journey</div>
            <h2>Trip highlights</h2>
            <ul className="feature-list">
              {trip.highlights.map((highlight, index) => (
                <li key={highlight}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{highlight}</strong>
                </li>
              ))}
            </ul>
          </div>
          <aside className="booking-preview">
            <div className="card-kicker">Plan your departure</div>
            <h3>Check availability</h3>
            <p>
              Review available departures and current pricing, then continue to the reservation flow
              when you have found the option that works for you.
            </p>
            <Link className="button button-primary" href={`/trips/${trip.slug}/book`}>View departures</Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
