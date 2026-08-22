import type { Metadata } from "next";
import { DestinationCard } from "@/components/destination-card";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/lib/i18n";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Explore destinations and travel inspiration with Kairoseth Travel."
};

export default async function DestinationsPage() {
  const locale = await getLocale();
  const copy = getDictionary(locale);
  const destinations = await getTravelRepository().listDestinations();

  return (
    <main className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">{copy.destinations.eyebrow}</div>
            <h2>{copy.destinations.title}</h2>
          </div>
          <p>{copy.destinations.copy}</p>
        </div>

        <div className="grid-3">
          {destinations.map((destination) => (
            <DestinationCard destination={destination} locale={locale} key={destination.id} />
          ))}
        </div>
      </div>
    </main>
  );
}
