import type { Metadata } from "next";
import { CatalogueExplorer } from "@/components/catalogue-explorer";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/lib/i18n";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata: Metadata = {
  title: "Trips",
  description: "Search and compare curated travel itineraries with Kairoseth Travel."
};

export default async function TripsPage() {
  const repository = getTravelRepository();
  const locale = await getLocale();
  const copy = getDictionary(locale);
  const [destinations, trips] = await Promise.all([
    repository.listDestinations(),
    repository.listTrips()
  ]);

  return (
    <main className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">{copy.trips.eyebrow}</div>
            <h2>{copy.trips.title}</h2>
          </div>
          <p>{copy.trips.copy}</p>
        </div>
        <CatalogueExplorer destinations={destinations} trips={trips} locale={locale} />
      </div>
    </main>
  );
}
