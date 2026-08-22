import Link from "next/link";
import { notFound } from "next/navigation";
import { updateReservationStatusAction } from "@/app/operator/actions";
import styles from "@/app/operator/operator.module.css";
import { operationsConfig } from "@/lib/operations-config";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { getTravelRepository } from "@/lib/travel-repository";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

function formatTimestamp(value?: string) {
  if (!value) return "Not updated";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

const errorMessages: Record<string, string> = {
  "operations-disabled": "Operational writes are disabled in this deployment.",
  "invalid-request": "The requested status change is invalid.",
  "invalid-transition": "That reservation status transition is not allowed."
};

export const metadata = {
  title: "Operator reservation detail",
  description: "Role-protected reservation operations detail for Kairoseth Travel."
};

export default async function OperatorReservationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const staff = await requireOperationsIdentity();
  const { id } = await params;
  const { updated, error } = await searchParams;
  const operations = getOperationsRepository();
  const [reservation, trips, audit] = await Promise.all([
    operations.getReservation(id),
    getTravelRepository().listTrips(),
    operations.listAuditEvents()
  ]);

  if (!reservation) notFound();

  const trip = trips.find((item) => item.id === reservation.tripId);
  const reservationAudit = audit.filter((event) => event.reservationId === reservation.id);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <div className={styles.detailGrid}>
          <section className={styles.panel}>
            <div className="eyebrow">Reservation operations</div>
            <h1>{trip?.title ?? reservation.tripTitle ?? "Reservation"}</h1>
            <p className={styles.lead}>
              Staff identity <strong>{staff.displayName}</strong> is authorized on the server before this record can be read or changed.
            </p>

            {updated ? (
              <div className={styles.notice}>Reservation status updated to {updated}.</div>
            ) : null}
            {error && errorMessages[error] ? (
              <div className={styles.notice}>{errorMessages[error]}</div>
            ) : null}

            <dl className={styles.definitionList}>
              <div><dt>Status</dt><dd><span className={styles.badge}>{reservation.status}</span></dd></div>
              <div><dt>Customer identity</dt><dd>{reservation.identityId}</dd></div>
              <div><dt>Travellers</dt><dd>{reservation.partySize}</dd></div>
              <div><dt>Total</dt><dd>{formatMoney(reservation.totalPrice, reservation.currency)}</dd></div>
              {reservation.departureDate ? <div><dt>Departure</dt><dd>{reservation.departureDate}</dd></div> : null}
              {reservation.returnDate ? <div><dt>Return</dt><dd>{reservation.returnDate}</dd></div> : null}
              <div><dt>Reference</dt><dd>{reservation.id}</dd></div>
              <div><dt>Created</dt><dd>{formatTimestamp(reservation.createdAt)}</dd></div>
              <div><dt>Last update</dt><dd>{formatTimestamp(reservation.updatedAt)}</dd></div>
            </dl>

            {operationsConfig.writesEnabled && reservation.status !== "cancelled" ? (
              <div className={styles.actions}>
                {reservation.status === "pending" ? (
                  <form action={updateReservationStatusAction}>
                    <input type="hidden" name="reservationId" value={reservation.id} />
                    <input type="hidden" name="status" value="confirmed" />
                    <button className="button button-primary" type="submit">Confirm reservation</button>
                  </form>
                ) : null}
                <form action={updateReservationStatusAction}>
                  <input type="hidden" name="reservationId" value={reservation.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button className="button button-secondary" type="submit">Cancel reservation</button>
                </form>
              </div>
            ) : null}

            <Link className="text-link" href="/operator/reservations">← Reservation queue</Link>
          </section>

          <aside className={styles.panel}>
            <div className="eyebrow">Audit</div>
            <h2>Status history</h2>
            {reservationAudit.length ? (
              <div className={styles.auditList}>
                {reservationAudit.map((event) => (
                  <div className={styles.auditItem} key={event.id}>
                    <strong>{event.actorRole}</strong><br />
                    {event.fromStatus} → {event.toStatus}<br />
                    {formatTimestamp(event.occurredAt)}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.muted}>No staff status changes recorded for this reservation.</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
