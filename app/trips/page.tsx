import type { Metadata } from "next";
import { CatalogueExplorer } from "@/components/catalogue-explorer";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata: Metadata = {
  title: "Trips",
  description: "Search and compare curated travel itineraries with Kairoseth Travel."
};

export default async function TripsPage() {
  const repository = getTravelRepository();
  const [destinations, trips] = await Promise.all([
    repository.listDestinations(),
    repository.listTrips()
  ]);

  return (
    <main className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Find your journey</div>
            <h2>Explore trips</h2>
          </div>
          <p>
            Search by destination and compare journey length, highlights and starting price before
            checking available departures.
          </p>
        </div>
        <CatalogueExplorer destinations={destinations} trips={trips} />
      </div>
    </main>
  );
}
