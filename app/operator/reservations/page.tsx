import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import type { ReservationStatus } from "@/domain/booking/types";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorMoney, reservationStatusLabel, tr } from "@/lib/operator-i18n";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { getTravelRepository } from "@/lib/travel-repository";

const statuses = new Set<ReservationStatus>(["pending", "confirmed", "cancelled"]);

export const metadata = {
  title: "Reservations | Kairoseth Travel",
  description: "Protected Kairoseth Travel reservation operations queue."
};

export default async function OperatorReservationsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const locale = await getLocale();
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
          <div className="eyebrow">{tr(locale, "Operations queue", "Cola de operaciones")}</div>
          <h1>{tr(locale, "Reservations", "Reservas")}</h1>
          <p className={styles.lead}>
            {tr(
              locale,
              "Review persistent customer reservations, current status, travellers and totals from one protected operations view.",
              "Revisa las reservas persistentes de los clientes, su estado, viajeros e importes desde una única vista operativa protegida."
            )}
          </p>

          {error === "not-found" ? <div className={styles.notice}>{tr(locale, "Reservation not found.", "Reserva no encontrada.")}</div> : null}

          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator/reservations">{tr(locale, "All", "Todas")}</Link>
            <Link className="button button-secondary" href="/operator/reservations?status=pending">{tr(locale, "Pending", "Pendientes")}</Link>
            <Link className="button button-secondary" href="/operator/reservations?status=confirmed">{tr(locale, "Confirmed", "Confirmadas")}</Link>
            <Link className="button button-secondary" href="/operator/reservations?status=cancelled">{tr(locale, "Cancelled", "Canceladas")}</Link>
          </div>

          {visible.length ? (
            <div className={styles.list}>
              {[...visible].reverse().map((reservation) => {
                const trip = trips.find((item) => item.id === reservation.tripId);
                return (
                  <Link className={styles.row} href={`/operator/reservations/${reservation.id}`} key={reservation.id}>
                    <strong>{trip?.title ?? reservation.tripTitle ?? reservation.tripId}</strong>
                    <span>{reservation.partySize} {tr(locale, "travellers", "viajeros")}</span>
                    <span className={styles.badge}>{reservationStatusLabel(reservation.status, locale)}</span>
                    <span>{formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.notice}>{tr(locale, "No reservations match this view.", "No hay reservas que coincidan con esta vista.")}</div>
          )}

          <p><Link className="text-link" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link></p>
        </section>
      </div>
    </main>
  );
}
