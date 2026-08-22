import Link from "next/link";
import { ServiceCard } from "@/components/service-card";
import type { TravelServiceType } from "@/domain/services/types";
import type { TravelLocale } from "@/domain/travel/types";
import {
  listPublishedTravelServices,
  serviceTypePluralLabel
} from "@/lib/travel-services";

const copy: Record<TravelServiceType, { en: [string, string]; es: [string, string] }> = {
  activity: {
    en: ["Experiences", "Book activities independently or add them around a trip you already have."],
    es: ["Experiencias", "Contrata actividades de forma independiente o añádelas alrededor de un viaje que ya tengas."]
  },
  transport: {
    en: ["Move with clarity", "Explore transfers and transport services without needing to buy a trip package."],
    es: ["Muévete con claridad", "Explora transfers y servicios de transporte sin necesidad de comprar un paquete de viaje."]
  },
  insurance: {
    en: ["Travel with protection", "Explore travel insurance products that can be contracted with or without a Kairoseth trip."],
    es: ["Viaja con protección", "Explora seguros de viaje que pueden contratarse con o sin un viaje de Kairoseth."]
  }
};

export async function ServiceCatalogue({ type, locale }: { type: TravelServiceType; locale: TravelLocale }) {
  const services = await listPublishedTravelServices(type);
  const text = copy[type][locale];

  return (
    <main className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Kairoseth Travel · {serviceTypePluralLabel(type, locale)}</div>
            <h2>{text[0]}</h2>
          </div>
          <p>{text[1]}</p>
        </div>

        {services.length ? (
          <div className="grid-3">
            {services.map((service) => <ServiceCard service={service} locale={locale} key={service.id} />)}
          </div>
        ) : (
          <div className="empty-state">
            <strong>{locale === "es" ? "Todavía no hay productos publicados en esta categoría." : "No products are published in this category yet."}</strong>
            <p>{locale === "es" ? "Puedes seguir explorando viajes y destinos mientras incorporamos nuevas opciones." : "You can keep exploring trips and destinations while new options are added."}</p>
            <Link className="button button-secondary" href="/trips">{locale === "es" ? "Ver viajes" : "Explore trips"}</Link>
          </div>
        )}
      </div>
    </main>
  );
}
