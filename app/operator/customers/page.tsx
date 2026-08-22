import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { listCustomersForOperations } from "@/lib/customer-auth";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorMoney, tr } from "@/lib/operator-i18n";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = {
  title: "Customers | Kairoseth Travel",
  description: "Protected Kairoseth Travel customer directory."
};

export default async function OperatorCustomersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await getLocale();
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
    return { customer, reservationCount: customerReservations.length, confirmedValue, currency };
  });

  const filteredRows = query
    ? customerRows.filter(({ customer }) =>
        [customer.displayName, customer.email, customer.country ?? "", customer.phone ?? ""]
          .some((item) => item.toLowerCase().includes(query))
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
          <div className="eyebrow">{tr(locale, "Customer operations", "Gestión de clientes")}</div>
          <h1>{tr(locale, "Customers", "Clientes")}</h1>
          <p className={styles.lead}>
            {tr(
              locale,
              "Search registered customers and review their booking relationship without exposing authentication secrets.",
              "Busca clientes registrados y revisa su relación de reservas sin exponer secretos de autenticación."
            )}
          </p>

          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{customers.length}</strong><span>{tr(locale, "Total customers", "Total clientes")}</span></div>
            <div className={styles.metric}><strong>{activeCustomers}</strong><span>{tr(locale, "Active", "Activos")}</span></div>
            <div className={styles.metric}><strong>{customersWithBookings}</strong><span>{tr(locale, "With reservations", "Con reservas")}</span></div>
            <div className={styles.metric}><strong>{formatOperatorMoney(confirmedRevenue, "EUR", locale)}</strong><span>{tr(locale, "Confirmed value", "Valor confirmado")}</span></div>
          </div>

          <form className={styles.toolbar} method="get">
            <label className={styles.field} style={{ minWidth: "280px", flex: "1 1 320px" }}>
              <span>{tr(locale, "Search customers", "Buscar clientes")}</span>
              <input name="q" defaultValue={q} placeholder={tr(locale, "Name, email, country or phone…", "Nombre, email, país o teléfono…")} />
            </label>
            <div className={styles.actions} style={{ alignItems: "end", margin: 0 }}>
              <button className="button button-primary" type="submit">{tr(locale, "Search", "Buscar")}</button>
              {q ? <Link className="button button-secondary" href="/operator/customers">{tr(locale, "Clear", "Limpiar")}</Link> : null}
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
                <span>{reservationCount} {reservationCount === 1 ? tr(locale, "reservation", "reserva") : tr(locale, "reservations", "reservas")}</span>
                <span>{formatOperatorMoney(confirmedValue, currency, locale)}</span>
              </Link>
            ))}
          </div>

          {!filteredRows.length ? <div className={styles.notice}>{tr(locale, "No customers match this search.", "No hay clientes que coincidan con esta búsqueda.")}</div> : null}

          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
