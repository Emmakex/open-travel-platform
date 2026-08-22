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
            <h1>Travel discovery, booking and operations in one adaptable platform.</h1>
            <p className="hero-copy">
              {appConfig.siteTagline} Explore a complete travel journey today, with an architecture
              ready to connect real catalogues, booking engines, suppliers and operational systems.
            </p>
            <div className="actions">
              <Link className="button button-primary" href="/trips">Explore trips</Link>
              <Link className="button button-secondary" href="/destinations">Discover destinations</Link>
            </div>
          </div>

          <div className="hero-panel" aria-label="Kairoseth Travel platform overview">
            <div className="panel-map" />
            <div className="stat-row">
              <div className="stat"><strong>{destinations.length}</strong><span>Destinations</span></div>
              <div className="stat"><strong>{trips.length}</strong><span>Itineraries</span></div>
              <div className="stat"><strong>{appConfig.dataMode}</strong><span>Current environment</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Destinations</div>
              <h2>Discover places worth building a journey around.</h2>
            </div>
            <p>
              Browse destination experiences through a fast, structured catalogue designed to grow from curated demo content into live travel inventory.
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
              <h2>From inspiration to a bookable itinerary.</h2>
            </div>
            <p>
              Compare durations, prices and highlights, then continue into availability, reservation and customer-account flows without leaving the platform.
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
              <div className="eyebrow">Platform</div>
              <h2>Built to evolve with the travel operation behind it.</h2>
            </div>
            <p>
              The experience is separated from infrastructure so catalogues, identity, booking and backoffice systems can evolve independently as the product grows.
            </p>
          </div>
          <div className="architecture">
            <div><strong>Experience</strong>Fast destination and trip discovery across the public catalogue.</div>
            <div><strong>Booking</strong>Availability and reservation flows validated on the server.</div>
            <div><strong>Operations</strong>Customer accounts, staff workflows and reservation audit history.</div>
            <div><strong>Integrations</strong>Replaceable adapters for APIs, CMS, suppliers, CRM and booking systems.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
