import Link from "next/link";
import { DestinationCard } from "@/components/destination-card";
import { TripCard } from "@/components/trip-card";
import { appConfig } from "@/lib/config";
import { getTravelRepository } from "@/lib/travel-repository";

export default async function HomePage() {
  const repository = getTravelRepository();
  const [destinations, trips] = await Promise.all([
    repository.listDestinations(),
    repository.listTrips()
  ]);

  const featuredDestinations = destinations.filter((item) => item.featured).slice(0, 3);
  const featuredTrips = trips.filter((item) => item.featured).slice(0, 3);

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Open-source travel product foundation</div>
            <h1>Build the travel experience. Keep the architecture yours.</h1>
            <p className="hero-copy">
              {appConfig.siteTagline} Start with local demo data, then swap in a REST API,
              CMS, supplier connector or booking backend through explicit adapters.
            </p>
            <div className="actions">
              <Link className="button button-primary" href="/trips">Search the catalogue</Link>
              <Link className="button button-secondary" href="/destinations">Browse destinations</Link>
            </div>
          </div>

          <div className="hero-panel" aria-label="Platform architecture illustration">
            <div className="panel-map" />
            <div className="stat-row">
              <div className="stat"><strong>{destinations.length}</strong><span>Demo destinations</span></div>
              <div className="stat"><strong>{trips.length}</strong><span>Demo itineraries</span></div>
              <div className="stat"><strong>{appConfig.dataMode}</strong><span>Active data adapter</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Destinations</div>
              <h2>Demo content, production-ready boundaries.</h2>
            </div>
            <p>
              A fresh clone renders immediately without third-party services or inherited media, while every destination has a stable detail route.
            </p>
          </div>
          <div className="grid-3">
            {featuredDestinations.map((destination) => (
              <DestinationCard destination={destination} key={destination.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="trips">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Trips</div>
              <h2>A catalogue model ready to extend.</h2>
            </div>
            <p>
              Trips carry duration, pricing, currency, highlights and destination relations. Search and filtering now run above the same domain layer.
            </p>
          </div>
          <div className="grid-3">
            {featuredTrips.map((trip) => <TripCard trip={trip} key={trip.id} />)}
          </div>
          <div className="actions">
            <Link className="button button-secondary" href="/trips">Explore all trips →</Link>
          </div>
        </div>
      </section>

      <section className="section" id="architecture">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Architecture</div>
              <h2>Designed around replaceable adapters.</h2>
            </div>
            <p>
              UI components consume repository interfaces rather than vendor APIs. This keeps integrations replaceable and demo, test and production modes explicit.
            </p>
          </div>
          <div className="architecture">
            <div><strong>UI</strong>Next.js App Router and server-first rendering.</div>
            <div><strong>Domain</strong>Typed travel entities independent from infrastructure.</div>
            <div><strong>Repository</strong>Stable interface used by pages and services.</div>
            <div><strong>Adapters</strong>Demo and generic REST implementations.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
