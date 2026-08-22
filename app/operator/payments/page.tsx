import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { localizeTrip } from "@/lib/i18n";
import { formatOperatorDate, formatOperatorMoney, tr } from "@/lib/operator-i18n";
import {
  paymentMethodLabel,
  paymentStatusLabel,
  paymentTransactionTypeLabel
} from "@/lib/payment-i18n";
import { getPaymentRepository } from "@/lib/payment-repository";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "Payments | Kairoseth Travel",
  description: "Provider-neutral reservation payment ledger."
};

export default async function OperatorPaymentsPage() {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const operations = getOperationsRepository();
  const payments = getPaymentRepository();
  const [reservations, trips, recentTransactions] = await Promise.all([
    operations.listReservations(),
    getTravelRepository().listTrips(),
    payments.listRecentTransactions(100)
  ]);
  const summaries = await payments.getSummaries(reservations);

  const paid = Object.values(summaries).reduce((sum, item) => sum + item.paidAmount, 0);
  const refunded = Object.values(summaries).reduce((sum, item) => sum + item.refundedAmount, 0);
  const net = Object.values(summaries).reduce((sum, item) => sum + item.netPaidAmount, 0);
  const outstanding = reservations.reduce((sum, reservation) => {
    if (reservation.status === "cancelled") return sum;
    return sum + (summaries[reservation.id]?.outstandingAmount ?? 0);
  }, 0);
  const defaultCurrency = reservations[0]?.currency ?? "EUR";

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Payments", "Pagos")}</div>
          <h1>{tr(locale, "Payment operations", "Operativa de pagos")}</h1>
          <p className={styles.lead}>
            {tr(
              locale,
              "A provider-neutral ledger for reservation payments and refunds. Stripe, Redsys or other providers can plug into this layer without changing booking records.",
              "Un registro independiente del proveedor para pagos y reembolsos de reservas. Stripe, Redsys u otros proveedores podrán conectarse a esta capa sin modificar las reservas."
            )}
          </p>

          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{formatOperatorMoney(paid, defaultCurrency, locale, 2)}</strong><span>{tr(locale, "Gross paid", "Cobrado bruto")}</span></div>
            <div className={styles.metric}><strong>{formatOperatorMoney(refunded, defaultCurrency, locale, 2)}</strong><span>{tr(locale, "Refunded", "Reembolsado")}</span></div>
            <div className={styles.metric}><strong>{formatOperatorMoney(net, defaultCurrency, locale, 2)}</strong><span>{tr(locale, "Net collected", "Cobrado neto")}</span></div>
            <div className={styles.metric}><strong>{formatOperatorMoney(outstanding, defaultCurrency, locale, 2)}</strong><span>{tr(locale, "Active outstanding", "Pendiente activo")}</span></div>
          </div>

          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link>
            <Link className="button button-secondary" href="/operator/reservations">{tr(locale, "Reservation queue", "Cola de reservas")}</Link>
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Reservations", "Reservas")}</div>
          <h2>{tr(locale, "Payment status by reservation", "Estado de pago por reserva")}</h2>
          {reservations.length ? (
            <div className={styles.list}>
              {reservations.map((reservation) => {
                const summary = summaries[reservation.id];
                const trip = trips.find((item) => item.id === reservation.tripId);
                const localizedTrip = trip ? localizeTrip(trip, locale) : null;
                return (
                  <Link className={styles.row} href={`/operator/reservations/${reservation.id}`} key={reservation.id}>
                    <strong>{localizedTrip?.title ?? reservation.tripTitle ?? reservation.tripId}</strong>
                    <span className={styles.badge}>{summary ? paymentStatusLabel(summary.status, locale) : "—"}</span>
                    <span>{summary ? formatOperatorMoney(summary.netPaidAmount, summary.currency, locale, 2) : "—"}</span>
                    <span>{summary ? formatOperatorMoney(summary.outstandingAmount, summary.currency, locale, 2) : "—"}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.notice}>{tr(locale, "No reservations yet.", "Todavía no hay reservas.")}</div>
          )}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Ledger", "Registro")}</div>
          <h2>{tr(locale, "Recent payment movements", "Movimientos de pago recientes")}</h2>
          {recentTransactions.length ? (
            <div className={styles.auditList}>
              {recentTransactions.map((transaction) => (
                <div className={styles.auditItem} key={transaction.id}>
                  <strong>{paymentTransactionTypeLabel(transaction.type, locale)} · {formatOperatorMoney(transaction.amount, transaction.currency, locale, 2)}</strong><br />
                  {paymentMethodLabel(transaction.method, locale)} · {transaction.provider} · {transaction.reservationId}<br />
                  {formatOperatorDate(transaction.createdAt, locale, true)}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.muted}>{tr(locale, "No payment movements have been recorded yet.", "Todavía no se han registrado movimientos de pago.")}</p>
          )}
        </section>
      </div>
    </main>
  );
}
