import Link from "next/link";
import { notFound } from "next/navigation";
import { updateReservationStatusAction } from "@/app/operator/actions";
import { recordManualPaymentAction } from "@/app/operator/payments/actions";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { localizeTrip } from "@/lib/i18n";
import {
  formatOperatorDate,
  formatOperatorMoney,
  reservationStatusLabel,
  staffRoleLabel,
  tr
} from "@/lib/operator-i18n";
import { operationsConfig } from "@/lib/operations-config";
import { getOperationsRepository } from "@/lib/operations-repository";
import { paymentConfig } from "@/lib/payment-config";
import {
  paymentMethodLabel,
  paymentStatusLabel,
  paymentTransactionStatusLabel,
  paymentTransactionTypeLabel
} from "@/lib/payment-i18n";
import { getPaymentRepository } from "@/lib/payment-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "Reservation | Kairoseth Travel",
  description: "Protected Kairoseth Travel reservation detail."
};

export default async function OperatorReservationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    updated?: string;
    error?: string;
    paymentUpdated?: string;
    paymentError?: string;
  }>;
}) {
  const locale = await getLocale();
  const staff = await requireOperationsIdentity();
  const { id } = await params;
  const { updated, error, paymentUpdated, paymentError } = await searchParams;
  const operations = getOperationsRepository();
  const [reservation, trips, audit] = await Promise.all([
    operations.getReservation(id),
    getTravelRepository().listTrips(),
    operations.listAuditEvents()
  ]);

  if (!reservation) notFound();

  const paymentRepository = getPaymentRepository();
  const [paymentSummary, paymentTransactions] = await Promise.all([
    paymentRepository.getSummary(reservation),
    paymentRepository.listTransactions(reservation.id)
  ]);
  const trip = trips.find((item) => item.id === reservation.tripId);
  const localizedTrip = trip ? localizeTrip(trip, locale) : null;
  const reservationAudit = audit.filter((event) => event.reservationId === reservation.id);
  const errors: Record<string, string> = {
    "operations-disabled": tr(locale, "Operational writes are disabled in this deployment.", "Los cambios operativos están desactivados en este despliegue."),
    "invalid-request": tr(locale, "The requested status change is invalid.", "El cambio de estado solicitado no es válido."),
    "invalid-transition": tr(locale, "That reservation status transition is not allowed.", "Ese cambio de estado de la reserva no está permitido.")
  };
  const paymentErrors: Record<string, string> = {
    "payments-disabled": tr(locale, "Payment ledger writes are disabled.", "Los cambios en el registro de pagos están desactivados."),
    "invalid-request": tr(locale, "Check the payment amount and try again.", "Revisa el importe del pago e inténtalo de nuevo."),
    "reservation-not-found": tr(locale, "The reservation no longer exists.", "La reserva ya no existe."),
    "amount-invalid": tr(locale, "Enter a positive amount with no more than two decimals.", "Introduce un importe positivo con un máximo de dos decimales."),
    "currency-mismatch": tr(locale, "The payment currency does not match the reservation.", "La moneda del pago no coincide con la reserva."),
    "reference-conflict": tr(locale, "That payment reference is already in use.", "Esa referencia de pago ya está en uso."),
    "exceeds-balance": tr(locale, "The payment exceeds the outstanding balance.", "El pago supera el saldo pendiente."),
    "exceeds-refundable": tr(locale, "The refund exceeds the refundable balance.", "El reembolso supera el importe reembolsable."),
    "payment-error": tr(locale, "The payment ledger could not be updated.", "No se pudo actualizar el registro de pagos.")
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <div className={styles.detailGrid}>
          <section className={styles.panel}>
            <div className="eyebrow">{tr(locale, "Reservation operations", "Gestión de reserva")}</div>
            <h1>{localizedTrip?.title ?? reservation.tripTitle ?? tr(locale, "Reservation", "Reserva")}</h1>
            <p className={styles.lead}>
              {tr(locale, "Authorized staff member", "Personal autorizado")}{" "}
              <strong>{staff.displayName}</strong>{" "}
              {tr(locale, "can review and manage this persistent reservation.", "puede revisar y gestionar esta reserva persistente.")}
            </p>

            {updated ? (
              <div className={styles.notice}>
                {tr(locale, "Reservation status updated to", "Estado de la reserva actualizado a")} {reservationStatusLabel(updated, locale)}.
              </div>
            ) : null}
            {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}

            <dl className={styles.definitionList}>
              <div><dt>{tr(locale, "Status", "Estado")}</dt><dd><span className={styles.badge}>{reservationStatusLabel(reservation.status, locale)}</span></dd></div>
              <div><dt>{tr(locale, "Payment", "Pago")}</dt><dd><span className={styles.badge}>{paymentStatusLabel(paymentSummary.status, locale)}</span></dd></div>
              <div><dt>{tr(locale, "Customer ID", "ID de cliente")}</dt><dd>{reservation.identityId}</dd></div>
              <div><dt>{tr(locale, "Travellers", "Viajeros")}</dt><dd>{reservation.partySize}</dd></div>
              <div><dt>{tr(locale, "Total", "Total")}</dt><dd>{formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</dd></div>
              {reservation.departureDate ? <div><dt>{tr(locale, "Departure", "Salida")}</dt><dd>{formatOperatorDate(`${reservation.departureDate}T00:00:00Z`, locale)}</dd></div> : null}
              {reservation.returnDate ? <div><dt>{tr(locale, "Return", "Regreso")}</dt><dd>{formatOperatorDate(`${reservation.returnDate}T00:00:00Z`, locale)}</dd></div> : null}
              <div><dt>{tr(locale, "Reference", "Referencia")}</dt><dd>{reservation.id}</dd></div>
              <div><dt>{tr(locale, "Created", "Creada")}</dt><dd>{formatOperatorDate(reservation.createdAt, locale, true)}</dd></div>
              <div><dt>{tr(locale, "Last update", "Última actualización")}</dt><dd>{reservation.updatedAt ? formatOperatorDate(reservation.updatedAt, locale, true) : tr(locale, "Not updated", "Sin actualizar")}</dd></div>
            </dl>

            {operationsConfig.writesEnabled && reservation.status !== "cancelled" ? (
              <div className={styles.actions}>
                {reservation.status === "pending" ? (
                  <form action={updateReservationStatusAction}>
                    <input type="hidden" name="reservationId" value={reservation.id} />
                    <input type="hidden" name="status" value="confirmed" />
                    <button className="button button-primary" type="submit">{tr(locale, "Confirm reservation", "Confirmar reserva")}</button>
                  </form>
                ) : null}
                <form action={updateReservationStatusAction}>
                  <input type="hidden" name="reservationId" value={reservation.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button className="button button-secondary" type="submit">{tr(locale, "Cancel reservation", "Cancelar reserva")}</button>
                </form>
              </div>
            ) : null}

            <Link className="text-link" href="/operator/reservations">{tr(locale, "← Reservation queue", "← Cola de reservas")}</Link>
          </section>

          <aside className={styles.panel}>
            <div className="eyebrow">{tr(locale, "Audit", "Auditoría")}</div>
            <h2>{tr(locale, "Status history", "Historial de estados")}</h2>
            {reservationAudit.length ? (
              <div className={styles.auditList}>
                {reservationAudit.map((event) => (
                  <div className={styles.auditItem} key={event.id}>
                    <strong>{staffRoleLabel(event.actorRole, locale)}</strong><br />
                    {reservationStatusLabel(event.fromStatus, locale)} → {reservationStatusLabel(event.toStatus, locale)}<br />
                    {formatOperatorDate(event.occurredAt, locale, true)}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.muted}>{tr(locale, "No staff status changes recorded for this reservation.", "No hay cambios de estado registrados por el personal para esta reserva.")}</p>
            )}
          </aside>
        </div>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Payments", "Pagos")}</div>
          <h2>{tr(locale, "Payment ledger", "Registro de pagos")}</h2>
          <p className={styles.lead}>
            {tr(
              locale,
              "Provider-neutral payment accounting for this reservation. Manual entries record funds received outside the platform; they do not initiate a card charge.",
              "Contabilidad de pagos independiente del proveedor para esta reserva. Los apuntes manuales registran fondos recibidos fuera de la plataforma; no realizan ningún cargo en tarjeta."
            )}
          </p>

          {paymentUpdated ? (
            <div className={styles.notice}>
              {paymentUpdated === "refund"
                ? tr(locale, "Refund recorded successfully.", "Reembolso registrado correctamente.")
                : tr(locale, "Payment recorded successfully.", "Pago registrado correctamente.")}
            </div>
          ) : null}
          {paymentError && paymentErrors[paymentError] ? <div className={styles.notice}>{paymentErrors[paymentError]}</div> : null}
          {reservation.status === "cancelled" && paymentSummary.refundableAmount > 0 ? (
            <div className={styles.notice}>
              {tr(
                locale,
                "This cancelled reservation still has funds that may need to be refunded.",
                "Esta reserva cancelada todavía tiene fondos que pueden requerir reembolso."
              )}
            </div>
          ) : null}

          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{paymentStatusLabel(paymentSummary.status, locale)}</strong><span>{tr(locale, "Payment status", "Estado del pago")}</span></div>
            <div className={styles.metric}><strong>{formatOperatorMoney(paymentSummary.paidAmount, paymentSummary.currency, locale, 2)}</strong><span>{tr(locale, "Paid", "Pagado")}</span></div>
            <div className={styles.metric}><strong>{formatOperatorMoney(paymentSummary.refundedAmount, paymentSummary.currency, locale, 2)}</strong><span>{tr(locale, "Refunded", "Reembolsado")}</span></div>
            <div className={styles.metric}><strong>{formatOperatorMoney(paymentSummary.outstandingAmount, paymentSummary.currency, locale, 2)}</strong><span>{tr(locale, "Outstanding", "Pendiente")}</span></div>
          </div>

          {paymentConfig.writesEnabled ? (
            <div className={styles.formGrid}>
              {paymentSummary.outstandingAmount > 0 ? (
                <form action={recordManualPaymentAction} className={styles.editorForm}>
                  <input type="hidden" name="reservationId" value={reservation.id} />
                  <input type="hidden" name="type" value="payment" />
                  <h3>{tr(locale, "Record payment", "Registrar pago")}</h3>
                  <label className={styles.field}>
                    <span>{tr(locale, "Amount", "Importe")}</span>
                    <input name="amount" type="number" min="0.01" max={paymentSummary.outstandingAmount} step="0.01" required />
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Method", "Método")}</span>
                    <select name="method" defaultValue="bank_transfer">
                      <option value="bank_transfer">{tr(locale, "Bank transfer", "Transferencia bancaria")}</option>
                      <option value="cash">{tr(locale, "Cash", "Efectivo")}</option>
                      <option value="card">{tr(locale, "External card terminal", "Terminal de tarjeta externo")}</option>
                      <option value="other">{tr(locale, "Other", "Otro")}</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Reference", "Referencia")}</span>
                    <input name="providerReference" maxLength={160} placeholder={tr(locale, "Transfer or receipt reference", "Referencia de transferencia o recibo")} />
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Internal note", "Nota interna")}</span>
                    <input name="note" maxLength={500} />
                  </label>
                  <button className="button button-primary" type="submit">{tr(locale, "Record payment", "Registrar pago")}</button>
                </form>
              ) : null}

              {paymentSummary.refundableAmount > 0 ? (
                <form action={recordManualPaymentAction} className={styles.editorForm}>
                  <input type="hidden" name="reservationId" value={reservation.id} />
                  <input type="hidden" name="type" value="refund" />
                  <h3>{tr(locale, "Record refund", "Registrar reembolso")}</h3>
                  <label className={styles.field}>
                    <span>{tr(locale, "Amount", "Importe")}</span>
                    <input name="amount" type="number" min="0.01" max={paymentSummary.refundableAmount} step="0.01" required />
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Method", "Método")}</span>
                    <select name="method" defaultValue="bank_transfer">
                      <option value="bank_transfer">{tr(locale, "Bank transfer", "Transferencia bancaria")}</option>
                      <option value="cash">{tr(locale, "Cash", "Efectivo")}</option>
                      <option value="card">{tr(locale, "External card terminal", "Terminal de tarjeta externo")}</option>
                      <option value="other">{tr(locale, "Other", "Otro")}</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Reference", "Referencia")}</span>
                    <input name="providerReference" maxLength={160} />
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Internal note", "Nota interna")}</span>
                    <input name="note" maxLength={500} />
                  </label>
                  <button className="button button-secondary" type="submit">{tr(locale, "Record refund", "Registrar reembolso")}</button>
                </form>
              ) : null}
            </div>
          ) : null}

          <h3>{tr(locale, "Transaction history", "Historial de movimientos")}</h3>
          {paymentTransactions.length ? (
            <div className={styles.auditList}>
              {paymentTransactions.map((transaction) => (
                <div className={styles.auditItem} key={transaction.id}>
                  <strong>{paymentTransactionTypeLabel(transaction.type, locale)} · {formatOperatorMoney(transaction.amount, transaction.currency, locale, 2)}</strong><br />
                  {paymentTransactionStatusLabel(transaction.status, locale)} · {paymentMethodLabel(transaction.method, locale)} · {transaction.provider}<br />
                  {formatOperatorDate(transaction.createdAt, locale, true)}
                  {transaction.providerReference ? <><br />{tr(locale, "Reference", "Referencia")}: {transaction.providerReference}</> : null}
                  {transaction.note ? <><br />{tr(locale, "Note", "Nota")}: {transaction.note}</> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.muted}>{tr(locale, "No payment movements recorded yet.", "Todavía no hay movimientos de pago registrados.")}</p>
          )}
        </section>
      </div>
    </main>
  );
}
