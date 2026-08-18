import type { Metadata } from "next";
import { CatalogueExplorer } from "@/components/catalogue-explorer";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata: Metadata = {
  title: "Trips",
  description: "Search and filter travel itineraries in the Open Travel Platform catalogue."
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
            <div className="eyebrow">Catalogue explorer</div>
            <h2>Find a trip</h2>
          </div>
          <p>
            Search and filter the active catalogue without coupling the interface to a specific backend.
          </p>
        </div>
        <CatalogueExplorer destinations={destinations} trips={trips} />
      </div>
    </main>
  );
}
