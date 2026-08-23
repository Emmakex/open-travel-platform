import Link from "next/link";
import { ServiceCard } from "@/components/service-card";
import type { TravelServiceType } from "@/domain/services/types";
import type { TravelLocale } from "@/domain/travel/types";
import { getPublicCopy } from "@/lib/public-copy";
import { listPublishedTravelServices, serviceTypePluralLabel } from "@/lib/travel-services";

export async function ServiceCatalogue({ type, locale }: { type: TravelServiceType; locale: TravelLocale }) {
  const services = await listPublishedTravelServices(type);
  const publicCopy = getPublicCopy(locale);
  const section = type === "activity"
    ? publicCopy.activityCatalogue
    : type === "transport"
      ? publicCopy.transportCatalogue
      : publicCopy.insuranceCatalogue;

  return (
    <main className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">{serviceTypePluralLabel(type, locale)}</div>
            <h1>{section.title}</h1>
          </div>
          <p>{section.intro}</p>
        </div>

        {services.length ? (
          <div className="grid-3">
            {services.map((service) => <ServiceCard service={service} locale={locale} key={service.id} />)}
          </div>
        ) : (
          <div className="empty-state">
            <strong>{publicCopy.emptyServices.title}</strong>
            <p>{publicCopy.emptyServices.body}</p>
            <Link className="button button-secondary" href="/trips">{publicCopy.emptyServices.trips}</Link>
          </div>
        )}
      </div>
    </main>
  );
}
