import type { Metadata } from "next";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Demo destination catalogue for Open Travel Platform."
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
            These records come from the active repository adapter. Switch from demo to API mode
            without changing this page.
          </p>
        </div>

        <div className="grid-3">
          {destinations.map((destination) => (
            <article className="card" key={destination.id}>
              <div className="card-kicker">{destination.region}</div>
              <h3>{destination.name}</h3>
              <p>{destination.country}</p>
              <p>{destination.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
