import type { Metadata } from "next";
import { DestinationCard } from "@/components/destination-card";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Destination catalogue for Open Travel Platform."
};

export default async function DestinationsPage() {
  const destinations = await getTravelRepository().listDestinations();

  return (
    <main className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Catalogue</div>
            <h2>Destinations</h2>
          </div>
          <p>
            Records come from the active repository adapter. Each destination now has a stable detail URL and related-trip view.
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
