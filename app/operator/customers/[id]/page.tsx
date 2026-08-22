import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/operator/operator.module.css";
import { getCustomerForOperations } from "@/lib/customer-auth";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

function formatMoney(value: number, currency = "EUR") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

function formatTimestamp(value?: string | Date) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: typeof value === "string" && value.includes("T") ? "short" : undefined
  }).format(new Date(value));
}

export const metadata = {
  title: "Customer detail | Kairoseth Travel",
  description: "Role-protected Kairoseth Travel customer relationship detail."
};

export default async function OperatorCustomerDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOperationsIdentity();
  const { id } = await params;
  const [customer, reservations] = await Promise.all([
    getCustomerForOperations(id),
    getOperationsRepository().listReservations()
  ]);

  if (!customer) notFound();

  const customerReservations = reservations
    .filter((item) => item.identityId === customer.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pending = customerReservations.filter((item) => item.status === "pending").length;
  const confirmed = customerReservations.filter((item) => item.status === "confirmed").length;
  const cancelled = customerReservations.filter((item) => item.status === "cancelled").length;
  const confirmedValue = customerReservations
    .filter((item) => item.status === "confirmed")
    .reduce((sum, item) => sum + item.totalPrice, 0);
  const currency = customerReservations.find((item) => item.status === "confirmed")?.currency ?? "EUR";

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <div className={styles.detailGrid}>
          <section className={styles.panel}>
            <div className="eyebrow">Customer relationship</div>
            <h1>{customer.displayName}</h1>
            <p className={styles.lead}>
              Customer profile and booking history. Authentication secrets are intentionally excluded from the operations surface.
            </p>

            <dl className={styles.definitionList}>
              <div><dt>Email</dt><dd>{customer.email}</dd></div>
              <div><dt>Phone</dt><dd>{customer.phone ?? "—"}</dd></div>
              <div><dt>Country</dt><dd>{customer.country ?? "—"}</dd></div>
              <div><dt>Language</dt><dd>{customer.preferredLocale?.toUpperCase() ?? "—"}</dd></div>
              <div><dt>Status</dt><dd><span className={styles.badge}>{customer.status}</span></dd></div>
              <div><dt>Registered</dt><dd>{formatTimestamp(customer.createdAt)}</dd></div>
              <div><dt>Last profile update</dt><dd>{formatTimestamp(customer.updatedAt)}</dd></div>
              <div><dt>Customer ID</dt><dd>{customer.id}</dd></div>
            </dl>

            <div className={styles.actions}>
              <Link className="button button-secondary" href="/operator/customers">← Customers</Link>
              <Link className="button button-secondary" href="/operator/reservations">Reservation queue</Link>
            </div>
          </section>

          <aside className={styles.panel}>
            <div className="eyebrow">Customer value</div>
            <h2>Booking summary</h2>
            <div className={styles.metrics} style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <div className={styles.metric}><strong>{customerReservations.length}</strong><span>Total</span></div>
              <div className={styles.metric}><strong>{pending}</strong><span>Pending</span></div>
              <div className={styles.metric}><strong>{confirmed}</strong><span>Confirmed</span></div>
              <div className={styles.metric}><strong>{cancelled}</strong><span>Cancelled</span></div>
            </div>
            <div className={styles.metric}>
              <strong>{formatMoney(confirmedValue, currency)}</strong>
              <span>Confirmed value</span>
            </div>
          </aside>
        </div>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">Reservations</div>
          <h2>Customer booking history</h2>
          {customerReservations.length ? (
            <div className={styles.list}>
              {customerReservations.map((reservation) => (
                <Link className={styles.row} href={`/operator/reservations/${reservation.id}`} key={reservation.id}>
                  <div>
                    <strong>{reservation.tripTitle ?? reservation.tripId}</strong><br />
                    <span className={styles.muted}>{formatTimestamp(reservation.createdAt)}</span>
                  </div>
                  <span>{reservation.partySize} pax</span>
                  <span className={styles.badge}>{reservation.status}</span>
                  <span>{formatMoney(reservation.totalPrice, reservation.currency)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.notice}>This customer has not created a reservation yet.</div>
          )}
        </section>
      </div>
    </main>
  );
}
