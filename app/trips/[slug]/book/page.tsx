import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/trips/[slug]/book/booking.module.css";
import { TravellerBookingForm } from "@/components/traveller-booking-form";
import { hasCustomerAccess, hasOperationsAccess } from "@/lib/access-control";
import { bookingConfig } from "@/lib/booking-config";
import { getBookingRepository } from "@/lib/booking-repository";
import { getLocale } from "@/lib/get-locale";
import { formatCurrency, getDictionary, localizeTrip } from "@/lib/i18n";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getTravelRepository } from "@/lib/travel-repository";
import { getTravellerBandPrice, getTravellerPricingBands } from "@/lib/traveller-pricing";
import type { TravelLocale } from "@/domain/travel/types";

function formatDate(value: string, locale: TravelLocale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const trip = await getTravelRepository().getTripBySlug(slug);
  const localizedTrip = trip ? localizeTrip(trip, locale) : null;

  return {
    title: localizedTrip
      ? locale === "es" ? `Reservar ${localizedTrip.title}` : `Book ${localizedTrip.title}`
      : locale === "es" ? "Reservar viaje" : "Book trip",
    description: localizedTrip
      ? locale === "es" ? `Elige una salida y añade los viajeros de ${localizedTrip.title}.` : `Choose a departure and add travellers for ${localizedTrip.title}.`
      : locale === "es" ? "Elige una salida para tu viaje." : "Choose a trip departure."
  };
}

export default async function BookTripPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const { slug } = await params;
  const { error } = await searchParams;
  const locale = await getLocale();
  const copy = getDictionary(locale);
  const errorMessages: Record<string, string> = {
    "booking-disabled": copy.booking.errors.bookingDisabled,
    "invalid-party-size": copy.booking.errors.invalidParty,
    "invalid-availability": copy.booking.errors.invalidAvailability,
    "insufficient-space": copy.booking.errors.insufficientSpace,
    "invalid-travellers": locale === "es" ? "Revisa los datos de todos los viajeros." : "Review the details for every traveller.",
    "lead-must-be-adult": locale === "es" ? "El viajero principal debe tener al menos 18 años en la fecha de salida." : "The lead traveller must be at least 18 on the departure date.",
    "minor-guardian-required": locale === "es" ? "Todos los menores deben tener asociado un adulto responsable de la misma reserva." : "Every minor must be linked to a responsible adult on the same booking.",
    "pricing-unavailable": locale === "es" ? "No se ha podido calcular una tarifa válida para uno de los viajeros." : "A valid fare could not be calculated for one of the travellers."
  };
  const travelRepository = getTravelRepository();
  const trip = await travelRepository.getTripBySlug(slug);
  if (!trip) notFound();

  const localizedTrip = localizeTrip(trip, locale);
  const [availability, identity] = await Promise.all([
    getBookingRepository().listAvailability(trip.id),
    getIdentityRepository().getCurrentIdentity()
  ]);
  const customer = hasCustomerAccess(identity);
  const staff = hasOperationsAccess(identity);
  const pricingBands = getTravellerPricingBands(trip);
  const availabilityCopy = locale === "es"
    ? "Las plazas y tarifas se comprueban para la salida seleccionada. La edad de cada viajero se calcula en la fecha de salida."
    : "Spaces and fares are checked for the selected departure. Each traveller's age is calculated on the departure date.";

  return (
    <main className="section">
      <div className={`container ${styles.grid}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{copy.booking.eyebrow}</div>
          <h1>{localizedTrip.title}</h1>
          <p className={styles.lead}>{locale === "es" ? "Elige la salida e introduce los datos de cada viajero. Menores y adultos se tarifan según su edad real el día de salida." : "Choose the departure and enter each traveller. Adults and minors are priced using their actual age on departure."}</p>

          {error && errorMessages[error] ? <div className={styles.error}>{errorMessages[error]}</div> : null}
          {!identity ? <div className={styles.notice}><strong>{copy.booking.customerRequired}</strong> {copy.booking.customerRequiredCopy}{" "}<Link className="text-link" href="/account/sign-in">{copy.booking.signIn}</Link></div> : null}
          {staff ? <div className={styles.notice}>{copy.booking.staffActive}{" "}<Link className="text-link" href="/operator">{copy.booking.openOperator}</Link></div> : null}

          {customer && bookingConfig.writesEnabled && availability.length > 0 ? (
            <TravellerBookingForm tripSlug={trip.slug} fromPrice={trip.fromPrice} currency={trip.currency} pricingBands={pricingBands} hasExplicitPricing={Boolean(trip.travellerPricing?.length)} availability={availability} locale={locale} />
          ) : null}
          {customer && !bookingConfig.writesEnabled ? <div className={styles.notice}>{copy.booking.writesDisabled}</div> : null}
          {availability.length === 0 ? <div className={styles.notice}>{copy.booking.noDepartures}</div> : null}
          <p><Link className="text-link" href={`/trips/${trip.slug}`}>{copy.booking.back}</Link></p>
        </section>

        <aside className={styles.panel}>
          <div className="eyebrow">{copy.booking.availabilityEyebrow}</div>
          <h2>{copy.booking.departuresTitle}</h2>
          <p className={styles.muted}>{availabilityCopy}</p>

          <div className={styles.fareBands}>
            {pricingBands.map((band) => (
              <div key={band.id}>
                <span>{locale === "es" ? (band.labelEs || band.label) : band.label} · {band.minAge}{band.maxAge === undefined ? "+" : `–${band.maxAge}`}</span>
                <strong>{formatCurrency(band.price, trip.currency, locale)}</strong>
              </div>
            ))}
          </div>

          <div className={styles.availabilityList}>
            {availability.map((item) => {
              const prices = pricingBands.map((band) => getTravellerBandPrice({ trip, availability: item, band }));
              const minimum = Math.min(...prices);
              return (
                <div className={styles.availabilityItem} key={item.id}>
                  <div>
                    <strong>{formatDate(item.departureDate, locale)}</strong><br />
                    <span>{locale === "es" ? "a" : "to"} {formatDate(item.returnDate, locale)}</span><br />
                    <span>{locale === "es" ? "desde" : "from"} {formatCurrency(minimum, trip.currency, locale)}</span>
                  </div>
                  <strong>{item.remainingSpaces} {copy.booking.left}</strong>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}
