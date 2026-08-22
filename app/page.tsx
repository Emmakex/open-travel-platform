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
            <div className="eyebrow">Kairoseth Travel</div>
            <h1>Discover extraordinary journeys. Book with clarity. Travel with confidence.</h1>
            <p className="hero-copy">
              {appConfig.siteTagline} Browse curated destinations and itineraries, check availability
              and manage your journey from one connected experience.
            </p>
            <div className="actions">
              <Link className="button button-primary" href="/trips">Explore trips</Link>
              <Link className="button button-secondary" href="/destinations">Discover destinations</Link>
            </div>
          </div>

          <div className="hero-panel" aria-label="Kairoseth Travel journey overview">
            <div className="panel-map" />
            <div className="stat-row">
              <div className="stat"><strong>{destinations.length}</strong><span>Destinations</span></div>
              <div className="stat"><strong>{trips.length}</strong><span>Curated journeys</span></div>
              <div className="stat"><strong>End-to-end</strong><span>Booking journey</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Destinations</div>
              <h2>Where will you go next?</h2>
            </div>
            <p>
              Start with places that inspire you, then discover journeys built around culture,
              landscapes, food and memorable local experiences.
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
              <div className="eyebrow">Featured journeys</div>
              <h2>Trips designed around the experience.</h2>
            </div>
            <p>
              Compare duration, starting price and highlights, then continue directly to available
              departures and reservation.
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

      <section className="section" id="platform">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">One connected journey</div>
              <h2>From inspiration to operations.</h2>
            </div>
            <p>
              Kairoseth Travel brings the customer journey and the operational workflow together
              while keeping each part ready to evolve as the business grows.
            </p>
          </div>
          <div className="architecture">
            <div><strong>Discover</strong>Explore destinations and compare curated travel experiences.</div>
            <div><strong>Reserve</strong>Check departures, availability and pricing before booking.</div>
            <div><strong>Manage</strong>Keep reservations and journey details together in the customer area.</div>
            <div><strong>Operate</strong>Give travel teams a clear workflow for reservations and status changes.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
