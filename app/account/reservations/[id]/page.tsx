import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cancelReservationAction } from "@/app/reservations/actions";
import styles from "@/app/account/account.module.css";
import { bookingConfig } from "@/lib/booking-config";
import { getBookingRepository } from "@/lib/booking-repository";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getTravelRepository } from "@/lib/travel-repository";

const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric"
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

export const metadata = {
  title: "Reservation detail",
  description: "Fictional reservation detail for the Open Travel Platform demo account."
};

export default async function ReservationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const identity = await getIdentityRepository().getCurrentIdentity();
  if (!identity) redirect("/account/sign-in");

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
  const departure = availability.find((item) => item.id === reservation.availabilityId);
  const money = new Intl.NumberFormat("en", {
    style: "currency",
    currency: reservation.currency,
    maximumFractionDigits: 0
  });

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Demo reservation</div>
          <h1>{trip?.title ?? "Reservation"}</h1>
          <p className={styles.lead}>
            This record is fictional and stored only in the demo session cookie. A production adapter
            would persist reservations in a trusted booking system or database.
          </p>

          {updated === "cancelled" ? (
            <div className={styles.notice}>Reservation status updated to cancelled.</div>
          ) : null}

          <dl className={styles.profileList}>
            <div><dt>Status</dt><dd>{reservation.status}</dd></div>
            <div><dt>Travellers</dt><dd>{reservation.partySize}</dd></div>
            <div><dt>Unit price</dt><dd>{money.format(reservation.unitPrice)}</dd></div>
            <div><dt>Total</dt><dd>{money.format(reservation.totalPrice)}</dd></div>
            <div><dt>Departure</dt><dd>{departure ? formatDate(departure.departureDate) : "Unavailable"}</dd></div>
            <div><dt>Return</dt><dd>{departure ? formatDate(departure.returnDate) : "Unavailable"}</dd></div>
            <div><dt>Reference</dt><dd>{reservation.id}</dd></div>
          </dl>

          {reservation.status === "pending" && bookingConfig.demoWritesEnabled ? (
            <form action={cancelReservationAction}>
              <input type="hidden" name="reservationId" value={reservation.id} />
              <button className="button button-secondary" type="submit">Cancel demo reservation</button>
            </form>
          ) : null}

          <p><Link className="text-link" href="/account/reservations">← All reservations</Link></p>
        </section>
      </div>
    </main>
  );
}
