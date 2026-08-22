import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelReservationAction } from "@/app/reservations/actions";
import styles from "@/app/account/account.module.css";
import { getAccountCopy } from "@/lib/account-i18n";
import { bookingConfig } from "@/lib/booking-config";
import { getBookingRepository } from "@/lib/booking-repository";
import { getLocale } from "@/lib/get-locale";
import { formatCurrency, getDictionary, localizeTrip } from "@/lib/i18n";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { getTravelRepository } from "@/lib/travel-repository";
import type { TravelLocale } from "@/domain/travel/types";

function formatDate(value: string, locale: TravelLocale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}

export const metadata = {
  title: "Reservation detail",
  description: "Review a fictional reservation in the Kairoseth Travel demo account."
};

export default async function ReservationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const locale = await getLocale();
  const copy = getAccountCopy(locale).reservations;
  const generalCopy = getDictionary(locale);
  const identity = await requireCustomerIdentity();
  const { id } = await params;
  const { updated } = await searchParams;
  const bookingRepository = getBookingRepository();
  const reservation = await bookingRepository.getReservation(identity.id, id);

  if (!reservation) notFound();

  const travelRepository = getTravelRepository();
  const [trips, availability] = await Promise.all([
    travelRepository.listTrips(),
    bookingRepository.listAvailability(reservation.tripId)
  ]);

  const trip = trips.find((item) => item.id === reservation.tripId);
  const localizedTrip = trip ? localizeTrip(trip, locale) : null;
  const departure = availability.find((item) => item.id === reservation.availabilityId);
  const status = locale === "es"
    ? reservation.status === "confirmed" ? "confirmada" : reservation.status === "cancelled" ? "cancelada" : "pendiente"
    : reservation.status;

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{copy.detailEyebrow}</div>
          <h1>{localizedTrip?.title ?? copy.detailEyebrow}</h1>
          <p className={styles.lead}>{copy.demoNote}</p>

          {updated === "cancelled" ? (
            <div className={styles.notice}>{copy.cancelled}</div>
          ) : null}

          <dl className={styles.profileList}>
            <div><dt>{copy.status}</dt><dd>{status}</dd></div>
            <div><dt>{generalCopy.booking.travellers}</dt><dd>{reservation.partySize}</dd></div>
            <div><dt>{copy.unitPrice}</dt><dd>{formatCurrency(reservation.unitPrice, reservation.currency, locale)}</dd></div>
            <div><dt>{copy.total}</dt><dd>{formatCurrency(reservation.totalPrice, reservation.currency, locale)}</dd></div>
            <div><dt>{copy.departure}</dt><dd>{departure ? formatDate(departure.departureDate, locale) : copy.unavailable}</dd></div>
            <div><dt>{copy.return}</dt><dd>{departure ? formatDate(departure.returnDate, locale) : copy.unavailable}</dd></div>
            <div><dt>{copy.reference}</dt><dd>{reservation.id}</dd></div>
          </dl>

          {reservation.status === "pending" && bookingConfig.demoWritesEnabled ? (
            <form action={cancelReservationAction}>
              <input type="hidden" name="reservationId" value={reservation.id} />
              <button className="button button-secondary" type="submit">{copy.cancel}</button>
            </form>
          ) : null}

          <p><Link className="text-link" href="/account/reservations">{copy.all}</Link></p>
        </section>
      </div>
    </main>
  );
}
