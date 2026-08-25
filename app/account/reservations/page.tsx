import Link from "next/link";
import styles from "@/app/account/account.module.css";
import { getAccountCopy } from "@/lib/account-i18n";
import { getBookingRepository } from "@/lib/booking-repository";
import { getLocale } from "@/lib/get-locale";
import { formatCurrency, localizeTrip } from "@/lib/i18n";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "My reservations",
  description: "Review your Kairoseth Travel reservations."
};

export default async function ReservationsPage() {
  const locale = await getLocale();
  const copy = getAccountCopy(locale).reservations;
  const identity = await requireCustomerIdentity();
  const bookingRepository = getBookingRepository();
  const [reservations, trips] = await Promise.all([
    bookingRepository.listReservations(identity.id),
    getTravelRepository().listTrips()
  ]);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1>{copy.title}</h1>
          <p className={styles.lead}>{copy.lead}</p>

          {reservations.length ? (
            <div className={styles.profileList}>
              {reservations.map((reservation) => {
                const trip = trips.find((item) => item.id === reservation.tripId);
                const localizedTrip = trip ? localizeTrip(trip, locale) : null;
                const total = formatCurrency(reservation.totalPrice, reservation.currency, locale);
                const travellerLabel = reservation.partySize === 1 ? copy.traveller : copy.travellers;
                const status = locale === "es"
                  ? reservation.status === "confirmed" ? "confirmada" : reservation.status === "cancelled" ? "cancelada" : "pendiente"
                  : reservation.status;

                return (
                  <div key={reservation.id}>
                    <dt>{localizedTrip?.title ?? reservation.tripTitle ?? (locale === "es" ? "Viaje" : "Trip")}</dt>
                    <dd>
                      {reservation.partySize} {travellerLabel} · {total} · {status}
                      <br />
                      <Link className="text-link" href={`/account/reservations/${reservation.id}`}>{copy.view}</Link>
                      {" · "}
                      <a className="text-link" href={`/account/reservations/${encodeURIComponent(reservation.id)}/confirmation`}>
                        {locale === "es" ? "Descargar confirmación PDF" : "Download confirmation PDF"}
                      </a>
                    </dd>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.notice}>
              {copy.empty} {copy.browse}{" "}
              <Link className="text-link" href="/trips">{locale === "es" ? "Explorar viajes →" : "Browse trips →"}</Link>
            </div>
          )}

          <Link className="text-link" href="/account">{copy.backAccount}</Link>
        </section>
      </div>
    </main>
  );
}
