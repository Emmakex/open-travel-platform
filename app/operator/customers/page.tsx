import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { listCustomersForOperations } from "@/lib/customer-auth";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

function formatMoney(value: number, currency = "EUR") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export const metadata = {
  title: "Customers | Kairoseth Travel",
  description: "Role-protected customer directory for Kairoseth Travel operations."
};

export default async function OperatorCustomersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireOperationsIdentity();
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const [customers, reservations] = await Promise.all([
    listCustomersForOperations(),
    getOperationsRepository().listReservations()
  ]);

  const customerRows = customers.map((customer) => {
    const customerReservations = reservations.filter((item) => item.identityId === customer.id);
    const confirmedReservations = customerReservations.filter((item) => item.status === "confirmed");
    const confirmedValue = confirmedReservations.reduce((sum, item) => sum + item.totalPrice, 0);
    const currency = confirmedReservations[0]?.currency ?? "EUR";
    const latestReservation = customerReservations
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

    return {
      customer,
      reservationCount: customerReservations.length,
      confirmedValue,
      currency,
      latestReservationAt: latestReservation?.createdAt
    };
  });

  const filteredRows = query
    ? customerRows.filter(({ customer }) =>
        [customer.displayName, customer.email, customer.country ?? "", customer.phone ?? ""]
          .some((value) => value.toLowerCase().includes(query))
      )
    : customerRows;

  const activeCustomers = customers.filter((customer) => customer.status === "active").length;
  const customersWithBookings = customerRows.filter((item) => item.reservationCount > 0).length;
  const confirmedRevenue = reservations
    .filter((item) => item.status === "confirmed")
    .reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Customer operations</div>
          <h1>Customers</h1>
          <p className={styles.lead}>
            Search registered customers and review their booking relationship without exposing passwords, session tokens or authentication secrets.
          </p>

          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{customers.length}</strong><span>Total customers</span></div>
            <div className={styles.metric}><strong>{activeCustomers}</strong><span>Active</span></div>
            <div className={styles.metric}><strong>{customersWithBookings}</strong><span>With bookings</span></div>
            <div className={styles.metric}><strong>{formatMoney(confirmedRevenue)}</strong><span>Confirmed value</span></div>
          </div>

          <form className={styles.toolbar} method="get">
            <label className={styles.field} style={{ minWidth: "280px", flex: "1 1 320px" }}>
              <span>Search customers</span>
              <input name="q" defaultValue={q} placeholder="Name, email, country or phone…" />
            </label>
            <div className={styles.actions} style={{ alignItems: "end", margin: 0 }}>
              <button className="button button-primary" type="submit">Search</button>
              {q ? <Link className="button button-secondary" href="/operator/customers">Clear</Link> : null}
            </div>
          </form>

          <div className={styles.managementList}>
            {filteredRows.map(({ customer, reservationCount, confirmedValue, currency }) => (
              <Link className={styles.row} href={`/operator/customers/${customer.id}`} key={customer.id}>
                <div>
                  <strong>{customer.displayName}</strong><br />
                  <span className={styles.muted}>{customer.email}</span>
                </div>
                <span>{customer.country ?? "—"}</span>
                <span>{reservationCount} booking{reservationCount === 1 ? "" : "s"}</span>
                <span>{formatMoney(confirmedValue, currency)}</span>
              </Link>
            ))}
          </div>

          {!filteredRows.length ? (
            <div className={styles.notice}>No customers match this search.</div>
          ) : null}

          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator">← Operator dashboard</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
