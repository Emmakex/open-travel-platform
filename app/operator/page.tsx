import Link from "next/link";
import { endDemoStaffSession } from "@/app/operator/actions";
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

export const metadata = {
  title: "Operator dashboard",
  description: "Role-protected operations dashboard for Kairoseth Travel."
};

export default async function OperatorPage() {
  const identity = await requireOperationsIdentity();
  const operations = getOperationsRepository();
  const [summary, reservations, audit, trips] = await Promise.all([
    operations.getSummary(),
    operations.listReservations(),
    operations.listAuditEvents(),
    getTravelRepository().listTrips()
  ]);

  const persistentOperations = operationsConfig.mode === "mongodb";

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Operations console</div>
          <h1>{identity.displayName}</h1>
          <p className={styles.lead}>
            {persistentOperations
              ? "Reservations, status changes and audit history are persisted in MongoDB while access remains protected by the operations role boundary."
              : "A role-protected staff surface backed by a dedicated OperationsRepository rather than customer booking methods."}
          </p>

          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{summary.total}</strong><span>Total</span></div>
            <div className={styles.metric}><strong>{summary.pending}</strong><span>Pending</span></div>
            <div className={styles.metric}><strong>{summary.confirmed}</strong><span>Confirmed</span></div>
            <div className={styles.metric}><strong>{summary.cancelled}</strong><span>Cancelled</span></div>
          </div>

          {!operationsConfig.writesEnabled ? (
            <div className={styles.notice}>
              Operations are read-only/disabled in this deployment. Writes require an explicitly enabled operations adapter.
            </div>
          ) : null}

          <div className={styles.actions}>
            <Link className="button button-primary" href="/operator/reservations">Review reservations</Link>
            <Link className="button button-secondary" href="/operator/customers">Customers</Link>
            <Link className="button button-secondary" href="/operator/catalogue">Catalogue data</Link>
            <Link className="button button-secondary" href="/trips">Public catalogue</Link>
            <form action={endDemoStaffSession}>
              <button className="button button-secondary" type="submit">End staff session</button>
            </form>
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">Recent reservations</div>
          <h2>Operational queue</h2>
          {reservations.length ? (
            <div className={styles.list}>
              {reservations.slice(0, 5).map((reservation) => {
                const trip = trips.find((item) => item.id === reservation.tripId);
                return (
                  <Link className={styles.row} href={`/operator/reservations/${reservation.id}`} key={reservation.id}>
                    <strong>{trip?.title ?? reservation.tripTitle ?? reservation.tripId}</strong>
                    <span>{reservation.partySize} pax</span>
                    <span className={styles.badge}>{reservation.status}</span>
                    <span>{formatMoney(reservation.totalPrice, reservation.currency)}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.notice}>
              No reservations have been created yet. Create one from the customer booking flow, then return to the operator console.
            </div>
          )}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">Audit trail</div>
          <h2>Recent staff actions</h2>
          {audit.length ? (
            <div className={styles.auditList}>
              {audit.slice(0, 5).map((event) => (
                <div className={styles.auditItem} key={event.id}>
                  <strong>{event.actorRole}</strong> changed reservation {event.reservationId} from {event.fromStatus} to {event.toStatus}.
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.muted}>No staff status changes have been recorded yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
