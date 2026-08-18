import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import type { ReservationStatus } from "@/domain/booking/types";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { getTravelRepository } from "@/lib/travel-repository";

const statuses = new Set<ReservationStatus>(["pending", "confirmed", "cancelled"]);

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export const metadata = {
  title: "Reservation operations",
  description: "Role-protected reservation queue for Open Travel Platform."
};

export default async function OperatorReservationsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  await requireOperationsIdentity();
  const { status, error } = await searchParams;
  const activeStatus = status && statuses.has(status as ReservationStatus)
    ? status as ReservationStatus
    : null;

  const [reservations, trips] = await Promise.all([
    getOperationsRepository().listReservations(),
    getTravelRepository().listTrips()
  ]);
  const visible = activeStatus
    ? reservations.filter((reservation) => reservation.status === activeStatus)
    : reservations;

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Operations queue</div>
          <h1>Reservations</h1>
          <p className={styles.lead}>
            Staff can inspect fictional reservations across the current demo browser session without exposing customer mutation methods to this UI.
          </p>

          {error === "not-found" ? <div className={styles.notice}>Reservation not found.</div> : null}

          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator/reservations">All</Link>
            <Link className="button button-secondary" href="/operator/reservations?status=pending">Pending</Link>
            <Link className="button button-secondary" href="/operator/reservations?status=confirmed">Confirmed</Link>
            <Link className="button button-secondary" href="/operator/reservations?status=cancelled">Cancelled</Link>
          </div>

          {visible.length ? (
            <div className={styles.list}>
              {[...visible].reverse().map((reservation) => {
                const trip = trips.find((item) => item.id === reservation.tripId);
                return (
                  <Link className={styles.row} href={`/operator/reservations/${reservation.id}`} key={reservation.id}>
                    <strong>{trip?.title ?? reservation.tripId}</strong>
                    <span>{reservation.partySize} pax</span>
                    <span className={styles.badge}>{reservation.status}</span>
                    <span>{formatMoney(reservation.totalPrice, reservation.currency)}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.notice}>No reservations match this operational view.</div>
          )}

          <p><Link className="text-link" href="/operator">← Operator dashboard</Link></p>
        </section>
      </div>
    </main>
  );
}
