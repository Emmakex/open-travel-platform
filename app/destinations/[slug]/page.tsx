import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TripCard } from "@/components/trip-card";
import { getTravelRepository } from "@/lib/travel-repository";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const destinations = await getTravelRepository().listDestinations();
  return destinations.map((destination) => ({ slug: destination.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getTravelRepository().getDestinationBySlug(slug);

  if (!destination) return { title: "Destination not found" };

  return {
    title: destination.name,
    description: destination.summary
  };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const repository = getTravelRepository();
  const [destination, trips] = await Promise.all([
    repository.getDestinationBySlug(slug),
    repository.listTrips()
  ]);

  if (!destination) notFound();

  const relatedTrips = trips.filter((trip) => trip.destinationId === destination.id);

  return (
    <main>
      <section className="detail-hero">
        <div className="container detail-grid">
          <div>
            <div className="eyebrow">{destination.region}</div>
            <h1>{destination.name}</h1>
            <p className="hero-copy">{destination.summary}</p>
          </div>
          <div className="detail-facts">
            <div><span>Country</span><strong>{destination.country}</strong></div>
            <div><span>Region</span><strong>{destination.region}</strong></div>
            <div><span>Available trips</span><strong>{relatedTrips.length}</strong></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Itineraries</div>
              <h2>Trips in {destination.name}</h2>
            </div>
            <p>
              Related products are resolved through domain IDs, keeping destination and trip data independent from presentation.
            </p>
          </div>

          {relatedTrips.length ? (
            <div className="grid-3">
              {relatedTrips.map((trip) => <TripCard trip={trip} key={trip.id} />)}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No trips published for this destination yet.</strong>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
