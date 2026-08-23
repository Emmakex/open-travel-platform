import Link from "next/link";
import { TravelImage } from "@/components/travel-image";
import { TravelMediaGallery } from "@/components/travel-media-gallery";
import type { TravelService } from "@/domain/services/types";
import type { TravelLocale } from "@/domain/travel/types";
import { formatCurrency } from "@/lib/i18n";
import { availableInventory, listPublishedServiceAvailability } from "@/lib/service-availability";
import { localizeTravelService, serviceBasePath, serviceTypeLabel } from "@/lib/travel-services";

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
      [locale === "es" ? "Servicio" : "Service", service.transportMode],
      [locale === "es" ? "Origen" : "Origin", service.origin],
      [locale === "es" ? "Destino" : "Destination", service.destination],
      ...(service.capacity ? [[locale === "es" ? "Pasajeros por unidad" : "Passengers per unit", `${service.capacity}`]] : [])
    ];
  }
  return [
    ...(service.providerName ? [[locale === "es" ? "Proveedor" : "Provider", service.providerName]] : []),
    [locale === "es" ? "Cobertura" : "Coverage", service.coverageType],
    ...(service.policyReference ? [[locale === "es" ? "Referencia" : "Reference", service.policyReference]] : []),
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

function displayStartingPrice(service: TravelService) {
  if (service.pricingMode !== "per-age-band" || !service.travellerPricing?.length) return service.fromPrice;
  const paidPrices = service.travellerPricing.map((band) => band.price).filter((value) => Number.isFinite(value) && value > 0);
  return paidPrices.length ? Math.min(...paidPrices) : service.fromPrice;
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
  const price = formatCurrency(displayStartingPrice(item), item.currency, locale);
  const rows = detailRows(item, locale);
  const availability = item.serviceType === "insurance" ? [] : await listPublishedServiceAvailability(item.id);
  const bookingPath = `/services/book/${item.serviceType}/${item.slug}`;
  const insuranceReady = item.serviceType !== "insurance" || Boolean(item.providerName && item.termsUrl);
  const t = (en: string, es: string) => locale === "es" ? es : en;

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
              <span className="card-media-title">{t("From", "Desde")} {price}</span>
            </div>
          ) : null}

          <div className="grid-3" style={{ marginTop: "1.5rem" }}>
            <section className="card"><div className="card-body"><div className="card-kicker">{t("At a glance", "De un vistazo")}</div><h2>{t("Service details", "Datos del servicio")}</h2><ul className="highlight-list">{rows.map(([label, value]) => <li key={label}><strong>{label}:</strong> {value}</li>)}</ul></div></section>
            <section className="card"><div className="card-body"><div className="card-kicker">{t("Price", "Precio")}</div><h2>{t("Starting price", "Precio desde")}</h2><p><strong>{price}</strong></p><p>{pricingModeLabel(item, locale)}</p></div></section>
            <section className="card"><div className="card-body"><div className="card-kicker">{t("Your plans", "Tu viaje")}</div><h2>{t("Book it your way", "Añádelo a tus planes")}</h2><p>{t("You can book this service for a Kairoseth trip or for travel arranged elsewhere.", "Puedes reservar este servicio para un viaje Kairoseth o para un viaje organizado por tu cuenta.")}</p>{item.serviceType === "insurance" && insuranceReady ? <Link className="button button-primary" href={bookingPath}>{t("Continue", "Continuar")}</Link> : null}</div></section>
          </div>
        </div>
      </section>

      {item.serviceType !== "insurance" ? (
        <section className="section section-soft">
          <div className="container">
            <div className="section-heading">
              <div><div className="eyebrow">{t("Availability", "Disponibilidad")}</div><h2>{t("Choose a date and time", "Elige fecha y horario")}</h2></div>
              <p>{t("See the options that can be booked online for this service.", "Consulta las opciones que puedes reservar online para este servicio.")}</p>
            </div>
            {availability.length ? (
              <div className="grid-3">
                {availability.slice(0, 12).map((slot) => {
                  const remaining = availableInventory(slot);
                  const unit = slot.inventoryMode === "units"
                    ? (remaining === 1 ? t("unit", "unidad") : t("units", "unidades"))
                    : (remaining === 1 ? t("place", "plaza") : t("places", "plazas"));
                  const slotPrice = item.pricingMode === "per-age-band" || slot.priceOverride === undefined ? null : formatCurrency(slot.priceOverride, item.currency, locale);
                  return (
                    <article className="card" key={slot.id}>
                      <div className="card-body">
                        <div className="card-kicker">{formatSlotDate(slot.date, locale)}</div>
                        <h3>{slot.startTime}{slot.endTime ? ` – ${slot.endTime}` : ""}</h3>
                        <p><strong>{remaining}</strong> {unit} {t("available", "disponibles")}</p>
                        {item.serviceType === "transport" && slot.inventoryMode === "units" && item.capacity ? <p>{t(`Up to ${item.capacity} passengers per vehicle`, `Hasta ${item.capacity} pasajeros por vehículo`)}</p> : null}
                        {item.pricingMode === "per-age-band" ? <p><strong>{price}</strong> · {t("from · fare depends on traveller age", "desde · tarifa según la edad del viajero")}</p> : slotPrice ? <p><strong>{slotPrice}</strong> · {t("for this time", "para este horario")}</p> : null}
                        <Link className="button button-primary" href={`${bookingPath}?slot=${encodeURIComponent(slot.id)}`}>{t("Book this time", "Reservar este horario")}</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <strong>{t("No online times are available for this service right now.", "Ahora mismo no hay horarios disponibles para reservar online en este servicio.")}</strong>
                <p>{t("Explore another service or return to the catalogue to continue planning your trip.", "Explora otro servicio o vuelve al catálogo para seguir organizando tu viaje.")}</p>
                <Link className="button button-secondary" href={serviceBasePath(item.serviceType)}>{t("Explore alternatives", "Ver alternativas")}</Link>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="section section-soft">
          <div className="container">
            <div className="section-heading">
              <div><div className="eyebrow">{t("Before you book", "Antes de contratar")}</div><h2>{t("Check the product conditions", "Revisa las condiciones del producto")}</h2></div>
              <p>{t("Travel protection should only be purchased after checking the provider, coverage and conditions that apply to your trip.", "La protección de viaje debe contratarse después de revisar el proveedor, la cobertura y las condiciones aplicables a tu viaje.")}</p>
            </div>
            {insuranceReady && item.serviceType === "insurance" ? (
              <div className="grid-3">
                <article className="card"><div className="card-body"><div className="card-kicker">1</div><h3>{t("Trip details", "Datos del viaje")}</h3><p>{t("Enter the actual destination and travel dates so eligibility can be checked.", "Indica el destino y las fechas reales para comprobar si el producto es aplicable.")}</p></div></article>
                <article className="card"><div className="card-body"><div className="card-kicker">2</div><h3>{t("Provider conditions", "Condiciones del proveedor")}</h3><p>{item.providerName}</p>{item.termsUrl ? <p><a className="text-link" href={item.termsUrl} target="_blank" rel="noreferrer">{t("Read provider terms ↗", "Consultar condiciones del proveedor ↗")}</a></p> : null}</div></article>
                <article className="card"><div className="card-body"><div className="card-kicker">3</div><h3>{t("Eligibility", "Aplicabilidad")}</h3><p>{item.maxTripDays ? t(`Trips of up to ${item.maxTripDays} days can be evaluated for this product.`, `Este producto puede evaluarse para viajes de hasta ${item.maxTripDays} días.`) : t("Eligibility is checked against the product conditions before booking.", "La aplicabilidad se comprueba con las condiciones del producto antes de contratar.")}</p></div></article>
              </div>
            ) : (
              <div className="empty-state">
                <strong>{t("This product is not available for online purchase yet.", "Este producto todavía no está disponible para contratación online.")}</strong>
                <p>{t("Provider and product conditions must be completed before it can be sold online.", "Antes de venderlo online deben completarse el proveedor y las condiciones del producto.")}</p>
              </div>
            )}
            {insuranceReady ? <div style={{ marginTop: "1.5rem" }}><Link className="button button-primary" href={bookingPath}>{t("Continue to trip details", "Continuar con los datos del viaje")}</Link></div> : null}
          </div>
        </section>
      )}

      {item.highlights.length ? (
        <section className="section"><div className="container"><div className="section-heading"><div><div className="eyebrow">{t("Highlights", "Destacados")}</div><h2>{t("Why choose this service", "Lo más importante del servicio")}</h2></div></div><div className="grid-3">{item.highlights.map((highlight) => <article className="card" key={highlight}><div className="card-body"><p>{highlight}</p></div></article>)}</div></div></section>
      ) : null}

      {item.included?.length || item.notIncluded?.length ? (
        <section className="section"><div className="container"><div className="grid-3">
          {item.included?.length ? <article className="card"><div className="card-body"><h2>{t("Included", "Incluido")}</h2><ul className="highlight-list">{item.included.map((value) => <li key={value}>{value}</li>)}</ul></div></article> : null}
          {item.notIncluded?.length ? <article className="card"><div className="card-body"><h2>{t("Not included", "No incluido")}</h2><ul className="highlight-list">{item.notIncluded.map((value) => <li key={value}>{value}</li>)}</ul></div></article> : null}
        </div></div></section>
      ) : null}

      <section className="section"><div className="container"><TravelMediaGallery items={item.gallery} title={item.title} /><div style={{ marginTop: "1.5rem" }}><Link className="text-link" href={serviceBasePath(item.serviceType)}>{t("← Back to catalogue", "← Volver al catálogo")}</Link></div></div></section>
    </main>
  );
}
