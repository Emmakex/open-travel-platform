import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "@/app/account/account.module.css";
import { getBookingRepository } from "@/lib/booking-repository";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getTravelRepository } from "@/lib/travel-repository";

const money = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

export const metadata = {
  title: "My reservations",
  description: "Fictional reservation history for the Open Travel Platform demo account."
};

export default async function ReservationsPage() {
  const identity = await getIdentityRepository().getCurrentIdentity();
  if (!identity) redirect("/account/sign-in");

  const bookingRepository = getBookingRepository();
  const [reservations, trips] = await Promise.all([
    bookingRepository.listReservations(identity.id),
    getTravelRepository().listTrips()
  ]);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Customer account</div>
          <h1>My reservations</h1>
          <p className={styles.lead}>
            Reservations shown here are fictional demo records stored only in the demo session cookie.
          </p>

          {reservations.length ? (
            <div className={styles.profileList}>
              {reservations.map((reservation) => {
                const trip = trips.find((item) => item.id === reservation.tripId);
                const total = reservation.currency === "EUR"
                  ? money.format(reservation.totalPrice)
                  : `${reservation.totalPrice} ${reservation.currency}`;

                return (
                  <div key={reservation.id}>
                    <dt>{trip?.title ?? "Trip"}</dt>
                    <dd>
                      {reservation.partySize} traveller{reservation.partySize === 1 ? "" : "s"} · {total} · {reservation.status}
                      <br />
                      <Link className="text-link" href={`/account/reservations/${reservation.id}`}>
                        View reservation →
                      </Link>
                    </dd>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.notice}>
              No demo reservations yet. Browse <Link className="text-link" href="/trips">trips</Link> to create one.
            </div>
          )}

          <Link className="text-link" href="/account">← Back to account</Link>
        </section>
      </div>
    </main>
  );
}
