import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/operator/operator.module.css";
import { getCustomerForOperations } from "@/lib/customer-auth";
import { getLocale } from "@/lib/get-locale";
import {
  accountStatusLabel,
  formatOperatorDate,
  formatOperatorMoney,
  reservationStatusLabel,
  tr
} from "@/lib/operator-i18n";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = {
  title: "Customer | Kairoseth Travel",
  description: "Protected Kairoseth Travel customer relationship detail."
};

export default async function OperatorCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
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
            <div className="eyebrow">{tr(locale, "Customer relationship", "Relación con el cliente")}</div>
            <h1>{customer.displayName}</h1>
            <p className={styles.lead}>
              {tr(
                locale,
                "Customer profile and reservation history. Authentication secrets are intentionally excluded from this operations view.",
                "Perfil del cliente e historial de reservas. Los secretos de autenticación se excluyen intencionadamente de esta vista operativa."
              )}
            </p>

            <dl className={styles.definitionList}>
              <div><dt>Email</dt><dd>{customer.email}</dd></div>
              <div><dt>{tr(locale, "Phone", "Teléfono")}</dt><dd>{customer.phone ?? "—"}</dd></div>
              <div><dt>{tr(locale, "Country", "País")}</dt><dd>{customer.country ?? "—"}</dd></div>
              <div><dt>{tr(locale, "Language", "Idioma")}</dt><dd>{customer.preferredLocale?.toUpperCase() ?? "—"}</dd></div>
              <div><dt>{tr(locale, "Status", "Estado")}</dt><dd><span className={styles.badge}>{accountStatusLabel(customer.status, locale)}</span></dd></div>
              <div><dt>{tr(locale, "Registered", "Registro")}</dt><dd>{formatOperatorDate(customer.createdAt, locale)}</dd></div>
              <div><dt>{tr(locale, "Last profile update", "Última actualización del perfil")}</dt><dd>{customer.updatedAt ? formatOperatorDate(customer.updatedAt, locale) : "—"}</dd></div>
              <div><dt>{tr(locale, "Customer ID", "ID de cliente")}</dt><dd>{customer.id}</dd></div>
            </dl>

            <div className={styles.actions}>
              <Link className="button button-secondary" href="/operator/customers">{tr(locale, "← Customers", "← Clientes")}</Link>
              <Link className="button button-secondary" href="/operator/reservations">{tr(locale, "Reservation queue", "Cola de reservas")}</Link>
            </div>
          </section>

          <aside className={styles.panel}>
            <div className="eyebrow">{tr(locale, "Customer value", "Valor del cliente")}</div>
            <h2>{tr(locale, "Booking summary", "Resumen de reservas")}</h2>
            <div className={styles.metrics} style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <div className={styles.metric}><strong>{customerReservations.length}</strong><span>{tr(locale, "Total", "Total")}</span></div>
              <div className={styles.metric}><strong>{pending}</strong><span>{tr(locale, "Pending", "Pendientes")}</span></div>
              <div className={styles.metric}><strong>{confirmed}</strong><span>{tr(locale, "Confirmed", "Confirmadas")}</span></div>
              <div className={styles.metric}><strong>{cancelled}</strong><span>{tr(locale, "Cancelled", "Canceladas")}</span></div>
            </div>
            <div className={styles.metric}>
              <strong>{formatOperatorMoney(confirmedValue, currency, locale)}</strong>
              <span>{tr(locale, "Confirmed value", "Valor confirmado")}</span>
            </div>
          </aside>
        </div>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Reservations", "Reservas")}</div>
          <h2>{tr(locale, "Customer reservation history", "Historial de reservas del cliente")}</h2>
          {customerReservations.length ? (
            <div className={styles.list}>
              {customerReservations.map((reservation) => (
                <Link className={styles.row} href={`/operator/reservations/${reservation.id}`} key={reservation.id}>
                  <div>
                    <strong>{reservation.tripTitle ?? reservation.tripId}</strong><br />
                    <span className={styles.muted}>{formatOperatorDate(reservation.createdAt, locale, true)}</span>
                  </div>
                  <span>{reservation.partySize} {tr(locale, "travellers", "viajeros")}</span>
                  <span className={styles.badge}>{reservationStatusLabel(reservation.status, locale)}</span>
                  <span>{formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.notice}>{tr(locale, "This customer has not created a reservation yet.", "Este cliente todavía no ha creado ninguna reserva.")}</div>
          )}
        </section>
      </div>
    </main>
  );
}
