import Link from "next/link";
import { notFound } from "next/navigation";
import { createReservationAction } from "@/app/reservations/actions";
import styles from "@/app/trips/[slug]/book/booking.module.css";
import { hasCustomerAccess, hasOperationsAccess } from "@/lib/access-control";
import { bookingConfig } from "@/lib/booking-config";
import { getBookingRepository } from "@/lib/booking-repository";
import { getLocale } from "@/lib/get-locale";
import { formatCurrency, getDictionary, localizeTrip } from "@/lib/i18n";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getTravelRepository } from "@/lib/travel-repository";
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
      ? locale === "es" ? `Elige una salida para ${localizedTrip.title}.` : `Choose a departure for ${localizedTrip.title}.`
      : locale === "es" ? "Elige una salida para tu viaje." : "Choose a trip departure."
  };
}

export default async function BookTripPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const locale = await getLocale();
  const copy = getDictionary(locale);
  const errorMessages: Record<string, string> = {
    "booking-disabled": copy.booking.errors.bookingDisabled,
    "invalid-party-size": copy.booking.errors.invalidParty,
    "invalid-availability": copy.booking.errors.invalidAvailability,
    "insufficient-space": copy.booking.errors.insufficientSpace
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
  const persistentBooking = bookingConfig.mode === "mongodb";
  const availabilityCopy = persistentBooking
    ? locale === "es"
      ? "Disponibilidad gestionada por Kairoseth Travel y almacenada de forma persistente en el inventario del viaje."
      : "Availability is managed by Kairoseth Travel and stored persistently against the trip inventory."
    : copy.booking.departuresCopy;

  return (
    <main className="section">
      <div className={`container ${styles.grid}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{copy.booking.eyebrow}</div>
          <h1>{localizedTrip.title}</h1>
          <p className={styles.lead}>{copy.booking.intro}</p>

          {error && errorMessages[error] ? (
            <div className={styles.error}>{errorMessages[error]}</div>
          ) : null}

          {!identity ? (
            <div className={styles.notice}>
              <strong>{copy.booking.customerRequired}</strong> {copy.booking.customerRequiredCopy}{" "}
              <Link className="text-link" href="/account/sign-in">{copy.booking.signIn}</Link>
            </div>
          ) : null}

          {staff ? (
            <div className={styles.notice}>
              {copy.booking.staffActive}{" "}
              <Link className="text-link" href="/operator">{copy.booking.openOperator}</Link>
            </div>
          ) : null}

          {customer && bookingConfig.writesEnabled && availability.length > 0 ? (
            <form action={createReservationAction} className={styles.form}>
              <input type="hidden" name="tripSlug" value={trip.slug} />

              <label className={styles.field}>
                <span>{copy.booking.departure}</span>
                <select name="availabilityId" required defaultValue={availability[0].id}>
                  {availability.map((item) => {
                    const departurePrice = formatCurrency(item.unitPrice ?? trip.fromPrice, trip.currency, locale);
                    return (
                      <option key={item.id} value={item.id}>
                        {formatDate(item.departureDate, locale)} → {formatDate(item.returnDate, locale)} · {item.remainingSpaces} {copy.booking.spaces} · {departurePrice}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className={styles.field}>
                <span>{copy.booking.travellers}</span>
                <input name="partySize" type="number" min="1" max="8" step="1" defaultValue="2" required />
              </label>

              <button className="button button-primary" type="submit">{copy.booking.create}</button>
            </form>
          ) : null}

          {customer && !bookingConfig.writesEnabled ? (
            <div className={styles.notice}>{copy.booking.writesDisabled}</div>
          ) : null}

          {availability.length === 0 ? (
            <div className={styles.notice}>{copy.booking.noDepartures}</div>
          ) : null}

          <p><Link className="text-link" href={`/trips/${trip.slug}`}>{copy.booking.back}</Link></p>
        </section>

        <aside className={styles.panel}>
          <div className="eyebrow">{copy.booking.availabilityEyebrow}</div>
          <h2>{copy.booking.departuresTitle}</h2>
          <p className={styles.muted}>{availabilityCopy}</p>
          <div className={styles.availabilityList}>
            {availability.map((item) => (
              <div className={styles.availabilityItem} key={item.id}>
                <div>
                  <strong>{formatDate(item.departureDate, locale)}</strong><br />
                  <span>{locale === "es" ? "a" : "to"} {formatDate(item.returnDate, locale)}</span><br />
                  <span>{formatCurrency(item.unitPrice ?? trip.fromPrice, trip.currency, locale)} / {locale === "es" ? "persona" : "traveller"}</span>
                </div>
                <strong>{item.remainingSpaces} {copy.booking.left}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
