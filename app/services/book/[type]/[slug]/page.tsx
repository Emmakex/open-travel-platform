import type { Metadata } from "next";
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
import { getPublishedTravelService, localizeTravelService, serviceBasePath, serviceTypeLabel } from "@/lib/travel-services";

type PageProps = {
  params: Promise<{ type: string; slug: string }>;
  searchParams: Promise<{ slot?: string; error?: string }>;
};

function validType(value: string): TravelServiceType | null {
  return value === "activity" || value === "transport" || value === "insurance" ? value : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [{ type: rawType, slug }, locale] = await Promise.all([params, getLocale()]);
  const type = validType(rawType);
  if (!type) return { title: locale === "es" ? "Reserva de servicio" : "Service booking" };
  const service = await getPublishedTravelService(type, slug);
  if (!service) return { title: locale === "es" ? "Reserva de servicio" : "Service booking" };
  const item = localizeTravelService(service, locale);
  return {
    title: locale === "es" ? `Reservar ${item.title}` : `Book ${item.title}`,
    description: item.summary
  };
}

export default async function ServiceBookingPage({ params, searchParams }: PageProps) {
  const [{ type: rawType, slug }, query, locale] = await Promise.all([params, searchParams, getLocale()]);
  const type = validType(rawType);
  if (!type) notFound();
  const service = await getPublishedTravelService(type, slug);
  if (!service) notFound();
  const item = localizeTravelService(service, locale);
  const insuranceReady = service.serviceType !== "insurance" || Boolean(service.providerName && service.termsUrl);
  const [identity, availability] = await Promise.all([
    getIdentityRepository().getCurrentIdentity(),
    service.serviceType === "insurance" ? Promise.resolve([]) : listPublishedServiceAvailability(service.id)
  ]);
  const customer = hasCustomerAccess(identity);
  const staff = hasOperationsAccess(identity);
  const customerReservations = customer ? await getBookingRepository().listReservations(identity.id) : [];
  const relatedReservations = customerReservations
    .filter((reservation) => reservation.status !== "cancelled")
    .map((reservation) => ({ id: reservation.id, label: `${reservation.tripTitle ?? reservation.tripId} · ${reservation.departureDate}` }));
  const currentPath = `/services/book/${service.serviceType}/${service.slug}${query.slot ? `?slot=${encodeURIComponent(query.slot)}` : ""}`;
  const next = encodeURIComponent(currentPath);
  const t = (en: string, es: string) => locale === "es" ? es : en;
  const errors: Record<string, string> = {
    "invalid-travellers": t("Review all traveller details.", "Revisa los datos de todos los viajeros."),
    "lead-must-be-adult": t("The lead traveller must be an adult.", "El viajero principal debe ser mayor de edad."),
    "minor-guardian-required": t("Every minor must be linked to a responsible adult.", "Todos los menores deben estar vinculados a un adulto responsable."),
    "pricing-unavailable": t("A valid fare could not be calculated. Review the traveller details.", "No se ha podido calcular una tarifa válida. Revisa los datos de los viajeros."),
    "invalid-availability": t("The selected date or time is no longer available.", "La fecha u horario seleccionado ya no está disponible."),
    "insufficient-space": t("There is no longer enough availability for this selection.", "Ya no queda disponibilidad suficiente para esta selección."),
    "insurance-details": t("Review the destination and travel dates.", "Revisa el destino y las fechas del viaje."),
    "invalid-related-reservation": t("The selected trip could not be linked.", "No se ha podido vincular el viaje seleccionado.")
  };

  return (
    <main className={`section ${styles.bookingPage}`}>
      <div className={`container ${styles.grid} ${styles.bookingGrid}`}>
        <section className={`${styles.panel} ${styles.bookingMainPanel}`}>
          <div className="eyebrow">{serviceTypeLabel(service.serviceType, locale)} · {t("Booking", "Reserva")}</div>
          <h1>{item.title}</h1>
          <p className={styles.lead}>{t("Choose the details for this service and review the price before confirming. You can link it to one of your Kairoseth trips when relevant.", "Configura los datos de este servicio y revisa el precio antes de confirmar. Cuando corresponda, puedes vincularlo a uno de tus viajes Kairoseth.")}</p>

          {query.error && errors[query.error] ? <div id="service-booking-error" className={styles.error} role="alert" aria-live="assertive">{errors[query.error]}</div> : null}

          {service.serviceType === "insurance" && !insuranceReady ? (
            <div className={styles.notice}>
              <strong>{t("Online purchase is not available for this product yet.", "La contratación online de este producto todavía no está disponible.")}</strong>{" "}
              {t("The provider and product conditions must be completed before booking can continue.", "Antes de continuar deben completarse el proveedor y las condiciones del producto.")}
            </div>
          ) : null}

          {!customer && insuranceReady ? (
            <div className={styles.notice}>
              <strong>{t("Sign in to complete your booking.", "Inicia sesión para completar la reserva.")}</strong>{" "}
              {t("You can explore the service and prices without an account; sign-in is only needed when you are ready to reserve.", "Puedes consultar el servicio y los precios sin una cuenta; solo necesitas iniciar sesión cuando quieras reservar.")}
              <div style={{ marginTop: "1rem", display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                <Link className="button button-primary" href={`/account/sign-in?next=${next}`}>{t("Sign in", "Iniciar sesión")}</Link>
                <Link className="button button-secondary" href={`/account/register?next=${next}`}>{t("Create account", "Crear cuenta")}</Link>
              </div>
            </div>
          ) : null}

          {staff ? <div className={styles.notice}>{t("A staff session is active. Sign out of the staff area and use a customer account to create a personal booking.", "Hay una sesión de personal activa. Cierra esa sesión y utiliza una cuenta de cliente para crear una reserva personal.")}</div> : null}

          {customer && insuranceReady && (service.serviceType === "insurance" || availability.length > 0) ? (
            <ServiceBookingForm service={service} availability={availability} initialAvailabilityId={query.slot} relatedReservations={relatedReservations} locale={locale} />
          ) : null}

          {service.serviceType !== "insurance" && availability.length === 0 ? (
            <div className={styles.notice}>{t("No online dates are available for this service right now.", "Ahora mismo no hay fechas disponibles para reservar online en este servicio.")}</div>
          ) : null}
          <p><Link className="text-link" href={`${serviceBasePath(service.serviceType)}/${service.slug}`}>{t("← Back to service", "← Volver al servicio")}</Link></p>
        </section>

        <aside className={`${styles.panel} ${styles.bookingSummaryPanel}`}>
          <div className="eyebrow">{t("Your selection", "Tu selección")}</div>
          <h2>{item.title}</h2>
          <p>{item.summary}</p>
          <dl className={styles.priceSummary}>
            <div><span>{t("Starting price", "Precio desde")}</span><strong>{formatCurrency(service.fromPrice, service.currency, locale)}</strong></div>
            <div><span>{t("Price basis", "Tipo de tarifa")}</span><strong>{service.pricingMode === "per-age-band" ? t("By traveller age", "Según edad del viajero") : service.pricingMode === "per-person" ? t("Per person", "Por persona") : service.pricingMode === "per-booking" ? t("Per booking", "Por reserva") : t("Per unit", "Por unidad")}</strong></div>
          </dl>
          {!customer && service.serviceType !== "insurance" && availability.length ? <p className={styles.muted}>{t(`${availability.length} online times are available. Choose one from the service page before continuing.`, `Hay ${availability.length} horarios disponibles online. Elige uno desde la ficha del servicio antes de continuar.`)}</p> : null}
          {service.serviceType === "insurance" && service.providerName ? <p className={styles.muted}>{t("Provider", "Proveedor")}: <strong>{service.providerName}</strong></p> : null}
        </aside>
      </div>
    </main>
  );
}
