import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TravelImage } from "@/components/travel-image";
import { TravelMediaGallery } from "@/components/travel-media-gallery";
import { TripCard } from "@/components/trip-card";
import { getLocale } from "@/lib/get-locale";
import { getDictionary, localizeDestination } from "@/lib/i18n";
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
  const locale = await getLocale();
  const destination = await getTravelRepository().getDestinationBySlug(slug);

  if (!destination) return { title: "Destination not found" };

  const localizedDestination = localizeDestination(destination, locale);
  return {
    title: localizedDestination.name,
    description: localizedDestination.summary
  };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const copy = getDictionary(locale);
  const repository = getTravelRepository();
  const [destination, trips] = await Promise.all([
    repository.getDestinationBySlug(slug),
    repository.listTrips()
  ]);

  if (!destination) notFound();

  const localizedDestination = localizeDestination(destination, locale);
  const relatedTrips = trips.filter((trip) => trip.destinationId === destination.id);

  return (
    <main>
      <section className="detail-hero detail-hero-with-media">
        <div className="container detail-grid">
          <div>
            <div className="eyebrow">{localizedDestination.region}</div>
            <h1>{localizedDestination.name}</h1>
            <p className="hero-copy">{localizedDestination.summary}</p>
          </div>
          <div className="detail-side">
            {destination.coverImage ? (
              <div className="detail-cover">
                <TravelImage
                  media={destination.coverImage}
                  fallbackAlt={localizedDestination.name}
                  priority
                  sizes="(max-width: 880px) 100vw, 38vw"
                  quality={88}
                />
              </div>
            ) : null}
            <div className="detail-facts">
              <div><span>{copy.destinations.country}</span><strong>{localizedDestination.country}</strong></div>
              <div><span>{copy.destinations.region}</span><strong>{localizedDestination.region}</strong></div>
              <div><span>{copy.destinations.availableTrips}</span><strong>{relatedTrips.length}</strong></div>
            </div>
          </div>
        </div>
      </section>

      {destination.gallery?.length ? (
        <section className="media-gallery-section">
          <div className="container">
            <TravelMediaGallery items={destination.gallery} title={localizedDestination.name} />
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">{copy.destinations.itineraries}</div>
              <h2>{copy.destinations.tripsIn} {localizedDestination.name}</h2>
            </div>
            <p>{copy.destinations.relatedCopy}</p>
          </div>

          {relatedTrips.length ? (
            <div className="grid-3">
              {relatedTrips.map((trip) => <TripCard trip={trip} locale={locale} key={trip.id} />)}
            </div>
          ) : (
            <div className="empty-state">
              <strong>{copy.destinations.noTrips}</strong>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
