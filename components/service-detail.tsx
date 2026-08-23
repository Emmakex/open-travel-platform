import Link from "next/link";
import { TravelImage } from "@/components/travel-image";
import { TravelMediaGallery } from "@/components/travel-media-gallery";
import type { TravelService } from "@/domain/services/types";
import type { TravelLocale } from "@/domain/travel/types";
import { formatCurrency } from "@/lib/i18n";
import {
  availableInventory,
  listPublishedServiceAvailability
} from "@/lib/service-availability";
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
      ...(service.capacity ? [[locale === "es" ? "Capacidad por unidad" : "Capacity per unit", `${service.capacity}`]] : [])
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

function formatSlotDate(date: string, locale: TravelLocale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${date}T12:00:00Z`));
}

export async function ServiceDetail({ service, locale }: { service: TravelService; locale: TravelLocale }) {
  const item = localizeTravelService(service, locale);
  const price = formatCurrency(item.fromPrice, item.currency, locale);
  const rows = detailRows(item, locale);
  const availability = item.serviceType === "insurance"
    ? []
    : await listPublishedServiceAvailability(item.id);
  const bookingPath = `/services/book/${item.serviceType}/${item.slug}`;

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
            <section className="card"><div className="card-body"><div className="card-kicker">Flexible</div><h3>{locale === "es" ? "Producto independiente" : "Independent product"}</h3><p>{locale === "es" ? "Puedes contratar este servicio aunque tu viaje se haya reservado en otra plataforma." : "You can contract this service even when your trip was booked on another platform."}</p>{item.serviceType === "insurance" ? <Link className="button button-primary" href={bookingPath}>{locale === "es" ? "Contratar seguro" : "Book insurance"}</Link> : null}</div></section>
          </div>
        </div>
      </section>

      {item.serviceType !== "insurance" ? (
        <section className="section section-soft">
          <div className="container">
            <div className="section-heading">
              <div><div className="eyebrow">{locale === "es" ? "Disponibilidad" : "Availability"}</div><h2>{locale === "es" ? "Próximas fechas y horarios" : "Upcoming dates and times"}</h2></div>
              <p>{locale === "es" ? "El cupo mostrado pertenece únicamente a este servicio y es independiente del inventario de los viajes." : "The inventory shown belongs only to this service and is independent from trip inventory."}</p>
            </div>
            {availability.length ? (
              <div className="grid-3">
                {availability.slice(0, 12).map((slot) => {
                  const remaining = availableInventory(slot);
                  const unit = slot.inventoryMode === "units"
                    ? (remaining === 1 ? (locale === "es" ? "unidad" : "unit") : (locale === "es" ? "unidades" : "units"))
                    : (remaining === 1 ? (locale === "es" ? "plaza" : "place") : (locale === "es" ? "plazas" : "places"));
                  const slotPrice = slot.priceOverride === undefined ? null : formatCurrency(slot.priceOverride, item.currency, locale);
                  return (
                    <article className="card" key={slot.id}>
                      <div className="card-body">
                        <div className="card-kicker">{formatSlotDate(slot.date, locale)}</div>
                        <h3>{slot.startTime}{slot.endTime ? ` – ${slot.endTime}` : ""}</h3>
                        <p><strong>{remaining}</strong> {unit} {locale === "es" ? "disponibles" : "available"}</p>
                        {item.serviceType === "transport" && slot.inventoryMode === "units" && item.capacity ? <p>{locale === "es" ? `Hasta ${item.capacity} pasajeros por unidad` : `Up to ${item.capacity} passengers per unit`}</p> : null}
                        {slotPrice ? <p><strong>{slotPrice}</strong> · {locale === "es" ? "precio de esta salida" : "price for this slot"}</p> : null}
                        <Link className="button button-primary" href={`${bookingPath}?slot=${encodeURIComponent(slot.id)}`}>{locale === "es" ? "Reservar este horario" : "Book this time"}</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state"><strong>{locale === "es" ? "No hay fechas publicadas todavía." : "No dates are published yet."}</strong><p>{locale === "es" ? "El producto sigue disponible para consulta y el equipo puede publicar nuevos horarios desde Operator." : "The product remains visible for discovery and the team can publish schedules from Operator."}</p></div>
            )}
          </div>
        </section>
      ) : (
        <section className="section section-soft">
          <div className="container">
            <div className="section-heading">
              <div><div className="eyebrow">{locale === "es" ? "Cotización" : "Quote basis"}</div><h2>{locale === "es" ? "Seguro adaptado a tu viaje" : "Insurance matched to your trip"}</h2></div>
              <p>{locale === "es" ? "Este producto no utiliza cupos por fecha. Para contratarlo se validarán los datos reales del viaje." : "This product does not use dated inventory. Real trip details are validated before booking."}</p>
            </div>
            <div className="grid-3">
              <article className="card"><div className="card-body"><div className="card-kicker">1</div><h3>{locale === "es" ? "Fechas y destino" : "Dates and destination"}</h3><p>{locale === "es" ? "Inicio, fin y destino real del viaje." : "Actual trip start, end and destination."}</p></div></article>
              <article className="card"><div className="card-body"><div className="card-kicker">2</div><h3>{locale === "es" ? "Viajeros y edades" : "Travellers and ages"}</h3><p>{locale === "es" ? "La prima puede variar por composición y edad." : "The premium may vary by party composition and age."}</p></div></article>
              <article className="card"><div className="card-body"><div className="card-kicker">3</div><h3>{locale === "es" ? "Elegibilidad" : "Eligibility"}</h3><p>{item.maxTripDays ? (locale === "es" ? `Este producto admite viajes de hasta ${item.maxTripDays} días.` : `This product supports trips up to ${item.maxTripDays} days.`) : (locale === "es" ? "Se validarán las condiciones del producto antes de contratar." : "Product conditions will be validated before purchase.")}</p></div></article>
            </div>
            <div style={{ marginTop: "1.5rem" }}><Link className="button button-primary" href={bookingPath}>{locale === "es" ? "Configurar y contratar" : "Configure and book"}</Link></div>
          </div>
        </section>
      )}

      {item.highlights.length ? (
        <section className="section"><div className="container"><div className="section-heading"><div><div className="eyebrow">{locale === "es" ? "Experiencia" : "Experience"}</div><h2>{locale === "es" ? "Lo más importante" : "Highlights"}</h2></div></div><div className="grid-3">{item.highlights.map((highlight) => <article className="card" key={highlight}><div className="card-body"><p>{highlight}</p></div></article>)}</div></div></section>
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
