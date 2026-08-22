import Link from "next/link";
import { DestinationCard } from "@/components/destination-card";
import { TripCard } from "@/components/trip-card";
import { getLocale } from "@/lib/get-locale";
import {
  formatCurrency,
  getDictionary,
  localizeDestination,
  localizeTrip
} from "@/lib/i18n";
import { getTravelRepository } from "@/lib/travel-repository";

export default async function HomePage() {
  const repository = getTravelRepository();
  const locale = await getLocale();
  const copy = getDictionary(locale);
  const [destinations, trips] = await Promise.all([
    repository.listDestinations(),
    repository.listTrips()
  ]);

  const featuredDestinations = destinations.filter((item) => item.featured).slice(0, 3);
  const featuredTrips = trips.filter((item) => item.featured).slice(0, 3);
  const peruTripSource = trips.find((item) => item.slug === "peru-andes-discovery") ?? featuredTrips[0];
  const barcelonaSource = destinations.find((item) => item.slug === "barcelona") ?? featuredDestinations[0];
  const peruTrip = peruTripSource ? localizeTrip(peruTripSource, locale) : null;
  const barcelona = barcelonaSource ? localizeDestination(barcelonaSource, locale) : null;

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy-block">
            <div className="eyebrow">{copy.home.eyebrow}</div>
            <h1>{copy.home.title}</h1>
            <p className="hero-copy">{copy.home.intro}</p>
            <div className="actions">
              <Link className="button button-primary" href="/trips">{copy.home.exploreTrips}</Link>
              <Link className="button button-secondary" href="/destinations">{copy.home.discoverDestinations}</Link>
            </div>
            <div className="hero-trust" aria-label="Platform highlights">
              {copy.home.trust.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>

          <div className="hero-panel" aria-label="Kairoseth Travel journey overview">
            <div className="panel-map">
              {peruTrip && peruTripSource ? (
                <div className="journey-card journey-card-primary">
                  <span>{copy.home.featuredJourney}</span>
                  <strong>{peruTrip.title}</strong>
                  <small>
                    {peruTrip.durationDays} {copy.trips.days} · {copy.trips.from.toLowerCase()} {formatCurrency(peruTrip.fromPrice, peruTrip.currency, locale)}
                  </small>
                </div>
              ) : null}
              {barcelona ? (
                <div className="journey-card journey-card-secondary">
                  <span>{copy.home.cityEscape}</span>
                  <strong>{barcelona.name}</strong>
                  <small>4 {copy.trips.days} · Mediterranean</small>
                </div>
              ) : null}
              <div className="journey-pin journey-pin-one" aria-hidden="true" />
              <div className="journey-pin journey-pin-two" aria-hidden="true" />
              <div className="journey-route" aria-hidden="true" />
            </div>
            <div className="stat-row">
              <div className="stat"><strong>{destinations.length}</strong><span>{copy.home.destinations}</span></div>
              <div className="stat"><strong>{trips.length}</strong><span>{copy.home.curatedJourneys}</span></div>
              <div className="stat"><strong>{copy.home.endToEnd}</strong><span>{copy.home.bookingJourney}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">{copy.home.destinationsEyebrow}</div>
              <h2>{copy.home.destinationsTitle}</h2>
            </div>
            <p>{copy.home.destinationsCopy}</p>
          </div>
          <div className="grid-3">
            {featuredDestinations.map((destination) => (
              <DestinationCard destination={destination} locale={locale} key={destination.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft" id="trips">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">{copy.home.tripsEyebrow}</div>
              <h2>{copy.home.tripsTitle}</h2>
            </div>
            <p>{copy.home.tripsCopy}</p>
          </div>
          <div className="grid-3">
            {featuredTrips.map((trip) => <TripCard trip={trip} locale={locale} key={trip.id} />)}
          </div>
          <div className="actions">
            <Link className="button button-secondary" href="/trips">{copy.home.allTrips}</Link>
          </div>
        </div>
      </section>

      <section className="section" id="platform">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">{copy.home.platformEyebrow}</div>
              <h2>{copy.home.platformTitle}</h2>
            </div>
            <p>{copy.home.platformCopy}</p>
          </div>
          <div className="architecture">
            {copy.home.platformItems.map(([title, description]) => (
              <div key={title}><strong>{title}</strong>{description}</div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
