import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TravelImage } from "@/components/travel-image";
import { TravelMediaGallery } from "@/components/travel-media-gallery";
import { TripAccommodationSection } from "@/components/trip-accommodation-section";
import { TripAddOnSection } from "@/components/trip-add-on-section";
import { getLocale } from "@/lib/get-locale";
import {
  formatCurrency,
  getDictionary,
  localizeDestination,
  localizeTrip
} from "@/lib/i18n";
import { getTravelRepository } from "@/lib/travel-repository";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const trips = await getTravelRepository().listTrips();
  return trips.map((trip) => ({ slug: trip.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const trip = await getTravelRepository().getTripBySlug(slug);

  if (!trip) return { title: "Trip not found" };

  const localizedTrip = localizeTrip(trip, locale);
  return {
    title: localizedTrip.title,
    description: localizedTrip.summary
  };
}

export default async function TripDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const copy = getDictionary(locale);
  const repository = getTravelRepository();
  const trip = await repository.getTripBySlug(slug);

  if (!trip) notFound();

  const destinations = await repository.listDestinations();
  const destination = destinations.find((item) => item.id === trip.destinationId);
  const localizedTrip = localizeTrip(trip, locale);
  const localizedDestination = destination ? localizeDestination(destination, locale) : null;
  const price = formatCurrency(trip.fromPrice, trip.currency, locale);

  return (
    <main>
      <section className="detail-hero detail-hero-with-media">
        <div className="container detail-grid">
          <div>
            <div className="eyebrow">{localizedDestination?.name ?? copy.trips.eyebrow}</div>
            <h1>{localizedTrip.title}</h1>
            <p className="hero-copy">{localizedTrip.summary}</p>
            {localizedDestination && destination ? (
              <Link className="text-link detail-link" href={`/destinations/${destination.slug}`}>
                {copy.trips.exploreDestination} {localizedDestination.name} →
              </Link>
            ) : null}
          </div>
          <div className="detail-side">
            {trip.coverImage ? (
              <div className="detail-cover">
                <TravelImage
                  media={trip.coverImage}
                  fallbackAlt={localizedTrip.title}
                  priority
                  sizes="(max-width: 880px) 100vw, 38vw"
                  quality={88}
                />
              </div>
            ) : null}
            <div className="detail-facts">
              <div><span>{copy.trips.duration}</span><strong>{trip.durationDays} {copy.trips.days}</strong></div>
              <div><span>{copy.trips.startingPrice}</span><strong>{price}</strong></div>
              <div><span>{copy.trips.highlightCount}</span><strong>{localizedTrip.highlights.length}</strong></div>
            </div>
          </div>
        </div>
      </section>

      {trip.gallery?.length ? (
        <section className="media-gallery-section">
          <div className="container">
            <TravelMediaGallery items={trip.gallery} title={localizedTrip.title} />
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container trip-detail-main">
          <div className="rich-trip-content">
            <section className="trip-section">
              <div className="eyebrow">{copy.trips.highlightsEyebrow}</div>
              <h2>{copy.trips.highlights}</h2>
              <ul className="feature-list">
                {localizedTrip.highlights.map((highlight, index) => (
                  <li key={highlight}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{highlight}</strong>
                  </li>
                ))}
              </ul>
            </section>

            {localizedTrip.itinerary?.length ? (
              <section className="trip-section">
                <div className="eyebrow">{copy.trips.itineraryEyebrow}</div>
                <h2>{copy.trips.itineraryTitle}</h2>
                <ol className="itinerary-list">
                  {localizedTrip.itinerary.map((item) => (
                    <li className="itinerary-day" key={`${item.day}-${item.title}`}>
                      <span className="itinerary-day-number">
                        {locale === "es" ? "Día" : "Day"} {item.day}
                      </span>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <TripAccommodationSection trip={trip} locale={locale} />
            <TripAddOnSection trip={trip} locale={locale} />

            {localizedTrip.included?.length || localizedTrip.notIncluded?.length ? (
              <section className="trip-section">
                <div className="eyebrow">{copy.trips.includedEyebrow}</div>
                <div className="inclusions-grid">
                  <div className="inclusion-panel">
                    <h3>{copy.trips.includedTitle}</h3>
                    <ul className="inclusion-list">
                      {localizedTrip.included?.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="inclusion-panel is-excluded">
                    <h3>{copy.trips.notIncludedTitle}</h3>
                    <ul className="inclusion-list">
                      {localizedTrip.notIncluded?.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="booking-preview">
            <div className="card-kicker">{copy.trips.reserveEyebrow}</div>
            <h3>{copy.trips.reserveTitle}</h3>
            <p>{copy.trips.reserveCopy}</p>
            <div className="booking-price">
              <span>{copy.trips.startingPrice}</span>
              <strong>{price}</strong>
            </div>
            <Link className="button button-primary" href={`/trips/${trip.slug}/book`}>{copy.trips.viewDepartures}</Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
