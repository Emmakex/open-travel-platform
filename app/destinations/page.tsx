import type { Metadata } from "next";
import { DestinationCard } from "@/components/destination-card";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Explore destinations and travel inspiration with Kairoseth Travel."
};

export default async function DestinationsPage() {
  const destinations = await getTravelRepository().listDestinations();

  return (
    <main className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Explore the world</div>
            <h2>Destinations</h2>
          </div>
          <p>
            Discover places through their culture, landscapes and travel possibilities, then choose
            the itinerary that best matches the experience you want.
          </p>
        </div>

        <div className="grid-3">
          {destinations.map((destination) => (
            <DestinationCard destination={destination} key={destination.id} />
          ))}
        </div>
      </div>
    </main>
  );
}
