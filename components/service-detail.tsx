import Link from "next/link";
import { TravelImage } from "@/components/travel-image";
import { TravelMediaGallery } from "@/components/travel-media-gallery";
import type { TravelService } from "@/domain/services/types";
import type { TravelLocale } from "@/domain/travel/types";
import { formatCurrency } from "@/lib/i18n";
import {
  localizeTravelService,
  serviceBasePath,
  serviceTypeLabel
} from "@/lib/travel-services";

function detailRows(service: TravelService, locale: TravelLocale) {
  if (service.serviceType === "activity") {
    return [
      [locale === "es" ? "Categoría" : "Category", service.activityCategory],
      [locale === "es" ? "Ubicación" : "Location", service.location],
      [locale === "es" ? "Duración" : "Duration", service.durationLabel],
      ...(service.meetingPoint ? [[locale === "es" ? "Punto de encuentro" : "Meeting point", service.meetingPoint]] : [])
    ];
  }
  if (service.serviceType === "transport") {
    return [
      [locale === "es" ? "Tipo" : "Mode", service.transportMode],
      [locale === "es" ? "Origen" : "Origin", service.origin],
      [locale === "es" ? "Destino" : "Destination", service.destination],
      ...(service.capacity ? [[locale === "es" ? "Capacidad" : "Capacity", `${service.capacity}`]] : [])
    ];
  }
  return [
    [locale === "es" ? "Cobertura" : "Coverage", service.coverageType],
    ...(service.maxTripDays ? [[locale === "es" ? "Duración máxima del viaje" : "Maximum trip duration", `${service.maxTripDays} ${locale === "es" ? "días" : "days"}`]] : [])
  ];
}

function pricingModeLabel(service: TravelService, locale: TravelLocale) {
  const labels = {
    "per-person": ["Per person", "Por persona"],
    "per-booking": ["Per booking", "Por reserva"],
    "per-unit": ["Per unit", "Por unidad"],
    "per-age-band": ["By traveller age", "Según edad del viajero"]
  } as const;
  return locale === "es" ? labels[service.pricingMode][1] : labels[service.pricingMode][0];
}

export function ServiceDetail({ service, locale }: { service: TravelService; locale: TravelLocale }) {
  const item = localizeTravelService(service, locale);
  const price = formatCurrency(item.fromPrice, item.currency, locale);
  const rows = detailRows(item, locale);

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">{serviceTypeLabel(item.serviceType, locale)}</div>
              <h1>{item.title}</h1>
            </div>
            <p>{item.summary}</p>
          </div>

          {item.coverImage ? (
            <div className="card-media" style={{ minHeight: "420px", borderRadius: "24px", overflow: "hidden" }}>
              <TravelImage className="card-media-image" media={item.coverImage} fallbackAlt={item.title} sizes="100vw" />
              <span className="card-media-shade" aria-hidden="true" />
              <span className="card-media-label">{pricingModeLabel(item, locale)}</span>
              <span className="card-media-title">{locale === "es" ? "Desde" : "From"} {price}</span>
            </div>
          ) : null}

          <div className="grid-3" style={{ marginTop: "1.5rem" }}>
            <section className="card"><div className="card-body"><div className="card-kicker">{locale === "es" ? "Información" : "Information"}</div><h3>{locale === "es" ? "Detalles del servicio" : "Service details"}</h3><ul className="highlight-list">{rows.map(([label, value]) => <li key={label}><strong>{label}:</strong> {value}</li>)}</ul></div></section>
            <section className="card"><div className="card-body"><div className="card-kicker">{locale === "es" ? "Precio" : "Pricing"}</div><h3>{locale === "es" ? "Precio desde" : "Starting price"}</h3><p><strong>{price}</strong></p><p>{pricingModeLabel(item, locale)}</p></div></section>
            <section className="card"><div className="card-body"><div className="card-kicker">{locale === "es" ? "Flexible" : "Flexible"}</div><h3>{locale === "es" ? "Producto independiente" : "Independent product"}</h3><p>{locale === "es" ? "Puedes contratar este servicio aunque tu viaje se haya reservado en otra plataforma." : "You can contract this service even when your trip was booked on another platform."}</p></div></section>
          </div>
        </div>
      </section>

      {item.highlights.length ? (
        <section className="section section-soft"><div className="container"><div className="section-heading"><div><div className="eyebrow">{locale === "es" ? "Experiencia" : "Experience"}</div><h2>{locale === "es" ? "Lo más importante" : "Highlights"}</h2></div></div><div className="grid-3">{item.highlights.map((highlight) => <article className="card" key={highlight}><div className="card-body"><p>{highlight}</p></div></article>)}</div></div></section>
      ) : null}

      {item.included?.length || item.notIncluded?.length ? (
        <section className="section"><div className="container"><div className="grid-3">
          {item.included?.length ? <article className="card"><div className="card-body"><h3>{locale === "es" ? "Incluido" : "Included"}</h3><ul className="highlight-list">{item.included.map((value) => <li key={value}>{value}</li>)}</ul></div></article> : null}
          {item.notIncluded?.length ? <article className="card"><div className="card-body"><h3>{locale === "es" ? "No incluido" : "Not included"}</h3><ul className="highlight-list">{item.notIncluded.map((value) => <li key={value}>{value}</li>)}</ul></div></article> : null}
        </div></div></section>
      ) : null}

      <section className="section"><div className="container"><TravelMediaGallery items={item.gallery} title={item.title} /><div style={{ marginTop: "1.5rem" }}><Link className="text-link" href={serviceBasePath(item.serviceType)}>{locale === "es" ? "← Volver al catálogo" : "← Back to catalogue"}</Link></div></div></section>
    </main>
  );
}
