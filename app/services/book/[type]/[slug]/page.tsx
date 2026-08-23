import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/trips/[slug]/book/booking.module.css";
import { ServiceBookingForm } from "@/components/service-booking-form";
import type { TravelServiceType } from "@/domain/services/types";
import { hasCustomerAccess, hasOperationsAccess } from "@/lib/access-control";
import { getBookingRepository } from "@/lib/booking-repository";
import { getLocale } from "@/lib/get-locale";
import { formatCurrency } from "@/lib/i18n";
import { getIdentityRepository } from "@/lib/identity-repository";
import { listPublishedServiceAvailability } from "@/lib/service-availability";
import {
  getPublishedTravelService,
  localizeTravelService,
  serviceBasePath,
  serviceTypeLabel
} from "@/lib/travel-services";

function validType(value: string): TravelServiceType | null {
  return value === "activity" || value === "transport" || value === "insurance" ? value : null;
}

export default async function ServiceBookingPage({
  params,
  searchParams
}: {
  params: Promise<{ type: string; slug: string }>;
  searchParams: Promise<{ slot?: string; error?: string }>;
}) {
  const [{ type: rawType, slug }, query, locale] = await Promise.all([params, searchParams, getLocale()]);
  const type = validType(rawType);
  if (!type) notFound();
  const service = await getPublishedTravelService(type, slug);
  if (!service) notFound();
  const item = localizeTravelService(service, locale);
  const [identity, availability] = await Promise.all([
    getIdentityRepository().getCurrentIdentity(),
    service.serviceType === "insurance" ? Promise.resolve([]) : listPublishedServiceAvailability(service.id)
  ]);
  const customer = hasCustomerAccess(identity);
  const staff = hasOperationsAccess(identity);
  const customerReservations = customer
    ? await getBookingRepository().listReservations(identity.id)
    : [];
  const relatedReservations = customerReservations
    .filter((reservation) => reservation.status !== "cancelled")
    .map((reservation) => ({ id: reservation.id, label: `${reservation.tripTitle ?? reservation.tripId} · ${reservation.departureDate}` }));
  const currentPath = `/services/book/${service.serviceType}/${service.slug}${query.slot ? `?slot=${encodeURIComponent(query.slot)}` : ""}`;
  const next = encodeURIComponent(currentPath);
  const errors: Record<string, string> = {
    "invalid-travellers": locale === "es" ? "Revisa los datos de todos los viajeros." : "Review all traveller details.",
    "lead-must-be-adult": locale === "es" ? "El viajero principal debe ser mayor de edad." : "The lead traveller must be an adult.",
    "minor-guardian-required": locale === "es" ? "Todos los menores deben estar vinculados a un adulto responsable." : "Every minor must be linked to a responsible adult.",
    "pricing-unavailable": locale === "es" ? "No se ha podido calcular una tarifa válida." : "A valid fare could not be calculated.",
    "invalid-availability": locale === "es" ? "La fecha u horario seleccionado ya no está disponible." : "The selected date or time is no longer available.",
    "insufficient-space": locale === "es" ? "Ya no queda disponibilidad suficiente para esta selección." : "There is no longer enough availability for this selection.",
    "insurance-details": locale === "es" ? "Revisa el destino y las fechas del viaje asegurado." : "Review the insured trip destination and dates.",
    "invalid-related-reservation": locale === "es" ? "No se ha podido vincular la reserva de viaje seleccionada." : "The selected trip reservation could not be linked."
  };

  return (
    <main className="section">
      <div className={`container ${styles.grid}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{serviceTypeLabel(service.serviceType, locale)} · {locale === "es" ? "Reserva" : "Booking"}</div>
          <h1>{item.title}</h1>
          <p className={styles.lead}>{locale === "es" ? "Configura este servicio de forma independiente. Puedes vincularlo a un viaje Kairoseth o contratarlo para un viaje reservado en otra plataforma." : "Book this service independently. Link it to a Kairoseth trip or use it for a trip booked elsewhere."}</p>

          {query.error && errors[query.error] ? <div className={styles.error}>{errors[query.error]}</div> : null}

          {!customer ? (
            <div className={styles.notice}>
              <strong>{locale === "es" ? "Inicia sesión para confirmar la reserva." : "Sign in to confirm the reservation."}</strong>{" "}
              {locale === "es" ? "El catálogo, precios y disponibilidad son públicos; la cuenta solo es necesaria al reservar." : "Catalogue, pricing and availability stay public; an account is only required when booking."}
              <div style={{ marginTop: "1rem", display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                <Link className="button button-primary" href={`/account/sign-in?next=${next}`}>{locale === "es" ? "Iniciar sesión" : "Sign in"}</Link>
                <Link className="button button-secondary" href={`/account/register?next=${next}`}>{locale === "es" ? "Crear cuenta" : "Create account"}</Link>
              </div>
            </div>
          ) : null}

          {staff ? <div className={styles.notice}>{locale === "es" ? "Tienes una sesión de operador activa. Cambia a una cuenta de cliente para crear una reserva personal." : "An operator session is active. Switch to a customer account to create a personal booking."}</div> : null}

          {customer && (service.serviceType === "insurance" || availability.length > 0) ? (
            <ServiceBookingForm service={service} availability={availability} initialAvailabilityId={query.slot} relatedReservations={relatedReservations} locale={locale} />
          ) : null}

          {service.serviceType !== "insurance" && availability.length === 0 ? <div className={styles.notice}>{locale === "es" ? "No hay fechas reservables disponibles actualmente." : "There are currently no bookable dates."}</div> : null}
          <p><Link className="text-link" href={`${serviceBasePath(service.serviceType)}/${service.slug}`}>{locale === "es" ? "← Volver al servicio" : "← Back to service"}</Link></p>
        </section>

        <aside className={styles.panel}>
          <div className="eyebrow">{locale === "es" ? "Resumen" : "Summary"}</div>
          <h2>{item.title}</h2>
          <p>{item.summary}</p>
          <dl className={styles.priceSummary}>
            <div><span>{locale === "es" ? "Precio desde" : "Starting price"}</span><strong>{formatCurrency(service.fromPrice, service.currency, locale)}</strong></div>
            <div><span>{locale === "es" ? "Modelo" : "Pricing"}</span><strong>{service.pricingMode === "per-age-band" ? (locale === "es" ? "Según edad" : "By age") : service.pricingMode === "per-person" ? (locale === "es" ? "Por persona" : "Per person") : service.pricingMode === "per-booking" ? (locale === "es" ? "Por reserva" : "Per booking") : (locale === "es" ? "Por unidad" : "Per unit")}</strong></div>
          </dl>
          {!customer && service.serviceType !== "insurance" && availability.length ? <p className={styles.muted}>{locale === "es" ? `${availability.length} horarios disponibles. Elige uno desde la ficha del servicio y vuelve aquí para reservar.` : `${availability.length} slots available. Choose one from the service page and return here to book.`}</p> : null}
        </aside>
      </div>
    </main>
  );
}
