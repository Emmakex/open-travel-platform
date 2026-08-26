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
import { deriveReservationPaymentSchedule } from "@/lib/payment-terms";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "Payments | Kairoseth Travel",
  description: "Provider-neutral reservation payment ledger."
};

type CurrencyMetrics = {
  currency: string;
  paid: number;
  refunded: number;
  net: number;
  outstanding: number;
  overdueAmount: number;
  overdueReservations: number;
};

export default async function OperatorPaymentsPage() {
  const locale = await getLocale();
  const identity = await requireOperationsIdentity();
  const operations = getOperationsRepository();
  const payments = getPaymentRepository();
  const [reservations, trips, recentTransactions] = await Promise.all([
    operations.listReservations(),
    getTravelRepository().listTrips(),
    payments.listRecentTransactions(100)
  ]);
  const summaries = await payments.getSummaries(reservations);
  const schedules = Object.fromEntries(
    reservations.map((reservation) => [
      reservation.id,
      deriveReservationPaymentSchedule(reservation, summaries[reservation.id])
    ])
  );

  const metricsByCurrency = new Map<string, CurrencyMetrics>();
  for (const reservation of reservations) {
    const summary = summaries[reservation.id];
    if (!summary) continue;
    const schedule = schedules[reservation.id];
    const overdueAmount = reservation.status === "cancelled"
      ? 0
      : schedule.installments
          .filter((item) => item.state === "overdue")
          .reduce((subtotal, item) => subtotal + item.outstandingAmount, 0);
    const current = metricsByCurrency.get(summary.currency) ?? {
      currency: summary.currency,
      paid: 0,
      refunded: 0,
      net: 0,
      outstanding: 0,
      overdueAmount: 0,
      overdueReservations: 0
    };
    current.paid += summary.paidAmount;
    current.refunded += summary.refundedAmount;
    current.net += summary.netPaidAmount;
    current.outstanding += reservation.status === "cancelled" ? 0 : summary.outstandingAmount;
    current.overdueAmount += overdueAmount;
    if (overdueAmount > 0) current.overdueReservations += 1;
    metricsByCurrency.set(summary.currency, current);
  }
  const currencyMetrics = [...metricsByCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency));

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Payments", "Pagos")}</div>
          <h1>{tr(locale, "Payment operations", "Operativa de pagos")}</h1>
          <p className={styles.lead}>
            {tr(
              locale,
              "A provider-neutral ledger for reservation payments and refunds, plus the expected deposit/installment schedule for each trip reservation.",
              "Un registro independiente del proveedor para pagos y reembolsos, junto con el calendario esperado de depósitos y cuotas de cada reserva de viaje."
            )}
          </p>
          <div className={styles.notice}>{tr(
            locale,
            "Financial totals are separated by currency. Amounts in different currencies are never added together.",
            "Los totales financieros se separan por moneda. Los importes de monedas distintas nunca se suman entre sí."
          )}</div>

          {currencyMetrics.length ? currencyMetrics.map((metrics) => (
            <div key={metrics.currency} style={{ marginTop: "1rem" }}>
              <div className="eyebrow">{metrics.currency}</div>
              <div className={styles.metrics}>
                <div className={styles.metric}><strong>{formatOperatorMoney(metrics.paid, metrics.currency, locale, 2)}</strong><span>{tr(locale, "Gross paid", "Cobrado bruto")}</span></div>
                <div className={styles.metric}><strong>{formatOperatorMoney(metrics.net, metrics.currency, locale, 2)}</strong><span>{tr(locale, "Net collected", "Cobrado neto")}</span></div>
                <div className={styles.metric}><strong>{formatOperatorMoney(metrics.outstanding, metrics.currency, locale, 2)}</strong><span>{tr(locale, "Active outstanding", "Pendiente activo")}</span></div>
                <div className={styles.metric}><strong>{formatOperatorMoney(metrics.overdueAmount, metrics.currency, locale, 2)}</strong><span>{tr(locale, `Overdue · ${metrics.overdueReservations} reservations`, `Vencido · ${metrics.overdueReservations} reservas`)}</span></div>
              </div>
              <p className={styles.muted}>{tr(locale, "Refunded", "Reembolsado")}: {formatOperatorMoney(metrics.refunded, metrics.currency, locale, 2)}</p>
            </div>
          )) : <div className={styles.notice}>{tr(locale, "No reservation payment totals are available yet.", "Todavía no hay totales de pago de reservas disponibles.")}</div>}

          <div className={styles.actions}>
            <Link className="button button-primary" href="/operator/reports">{tr(locale, "Reports and exports", "Informes y exportaciones")}</Link>
            <Link className="button button-secondary" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link>
            <Link className="button button-secondary" href="/operator/reservations">{tr(locale, "Reservation queue", "Cola de reservas")}</Link>
            {identity.role === "admin" ? (
              <Link className="button button-primary" href="/operator/payments/providers">
                {tr(locale, "Payment providers", "Pasarelas de pago")}
              </Link>
            ) : null}
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Reservations", "Reservas")}</div>
          <h2>{tr(locale, "Payment status by reservation", "Estado de pago por reserva")}</h2>
          {reservations.length ? (
            <div className={styles.list}>
              {reservations.map((reservation) => {
                const summary = summaries[reservation.id];
                const schedule = schedules[reservation.id];
                const trip = trips.find((item) => item.id === reservation.tripId);
                const localizedTrip = trip ? localizeTrip(trip, locale) : null;
                const overdue = schedule.installments.some((item) => item.state === "overdue");
                return (
                  <Link className={styles.row} href={`/operator/reservations/${reservation.id}`} key={reservation.id}>
                    <strong>{localizedTrip?.title ?? reservation.tripTitle ?? reservation.tripId}</strong>
                    <span className={styles.badge}>{overdue ? tr(locale, "Overdue", "Vencido") : summary ? paymentStatusLabel(summary.status, locale) : "—"}</span>
                    <span>{summary ? formatOperatorMoney(summary.netPaidAmount, summary.currency, locale, 2) : "—"}</span>
                    <span>{schedule.nextInstallment ? `${tr(locale, "Next", "Próximo")}: ${formatOperatorMoney(schedule.nextPaymentAmount, reservation.currency, locale, 2)}` : tr(locale, "Complete", "Completo")}</span>
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
