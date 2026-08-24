import Link from "next/link";
import { recordManualPaymentAction } from "@/app/operator/payments/actions";
import styles from "@/app/operator/operator.module.css";
import type { Reservation } from "@/domain/booking/types";
import type { PaymentSummary, PaymentTransaction } from "@/domain/payment/types";
import type { ServiceReservation } from "@/domain/services/booking-types";
import type { TravelLocale } from "@/domain/travel/types";
import { formatOperatorDate, formatOperatorMoney, tr } from "@/lib/operator-i18n";
import { paymentConfig } from "@/lib/payment-config";
import {
  paymentMethodLabel,
  paymentStatusLabel,
  paymentTransactionStatusLabel,
  paymentTransactionTypeLabel
} from "@/lib/payment-i18n";
import { listServiceReservationsForRelatedTrip } from "@/lib/service-reservations";

const errorKeys = {
  "payments-disabled": ["Payment changes are disabled.", "Los cambios de pago están desactivados."],
  "invalid-request": ["Check the payment amount and try again.", "Revisa el importe del pago e inténtalo de nuevo."],
  "reservation-not-found": ["The reservation no longer exists.", "La reserva ya no existe."],
  "amount-invalid": ["Enter a positive amount with no more than two decimals.", "Introduce un importe positivo con un máximo de dos decimales."],
  "currency-mismatch": ["The payment currency does not match the reservation.", "La moneda del pago no coincide con la reserva."],
  "reference-conflict": ["That payment reference is already in use.", "Esa referencia de pago ya está en uso."],
  "exceeds-balance": ["The payment exceeds the outstanding balance.", "El pago supera el saldo pendiente."],
  "exceeds-refundable": ["The refund exceeds the refundable balance.", "El reembolso supera el importe reembolsable."],
  "exceeds-adjustment": ["For an active reservation, the refund cannot exceed the amount paid above the current total.", "En una reserva activa, el reembolso no puede superar el importe pagado por encima del total actual."],
  "payment-error": ["The payment could not be updated.", "No se pudo actualizar el pago."]
} as const;

function serviceTypeLabel(reservation: ServiceReservation, locale: TravelLocale) {
  if (reservation.serviceType === "activity") return tr(locale, "Activity", "Actividad");
  if (reservation.serviceType === "transport") return tr(locale, "Transport", "Transporte");
  return tr(locale, "Travel protection", "Protección de viaje");
}

function serviceStatusLabel(reservation: ServiceReservation, locale: TravelLocale) {
  if (reservation.status === "confirmed") return tr(locale, "Confirmed", "Confirmado");
  if (reservation.status === "cancelled") return tr(locale, "Cancelled", "Cancelado");
  return tr(locale, "Pending", "Pendiente");
}

function serviceDateLabel(reservation: ServiceReservation, locale: TravelLocale) {
  const start = reservation.serviceDate || reservation.insuranceTrip?.startDate;
  if (!start) return tr(locale, "Date not set", "Fecha no indicada");
  const formatted = formatOperatorDate(start, locale);
  return reservation.startTime ? `${formatted} · ${reservation.startTime}` : formatted;
}

function ManualMovementForm({
  reservationId,
  type,
  maxAmount,
  currency,
  locale
}: {
  reservationId: string;
  type: "payment" | "refund";
  maxAmount: number;
  currency: string;
  locale: TravelLocale;
}) {
  const refund = type === "refund";
  return (
    <form action={recordManualPaymentAction} className={styles.editorForm}>
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="type" value={type} />
      <h3>{refund ? tr(locale, "Record refund", "Registrar reembolso") : tr(locale, "Record payment", "Registrar pago")}</h3>
      {refund ? (
        <p className={styles.muted}>
          {tr(
            locale,
            `Maximum amount to review: ${formatOperatorMoney(maxAmount, currency, locale, 2)}. Confirm the applicable conditions before recording a refund.`,
            `Importe máximo a revisar: ${formatOperatorMoney(maxAmount, currency, locale, 2)}. Confirma las condiciones aplicables antes de registrar un reembolso.`
          )}
        </p>
      ) : null}
      <label className={styles.field}>
        <span>{tr(locale, "Amount", "Importe")}</span>
        <input name="amount" type="number" min="0.01" max={maxAmount} step="0.01" required />
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
        <input name="providerReference" maxLength={160} placeholder={refund ? undefined : tr(locale, "Transfer or receipt reference", "Referencia de transferencia o recibo")} />
      </label>
      <label className={styles.field}>
        <span>{tr(locale, "Internal note", "Nota interna")}</span>
        <input name="note" maxLength={500} />
      </label>
      <button className={refund ? "button button-secondary" : "button button-primary"} type="submit">
        {refund ? tr(locale, "Record refund", "Registrar reembolso") : tr(locale, "Record payment", "Registrar pago")}
      </button>
    </form>
  );
}

export async function ReservationPaymentPanel({
  reservation,
  summary,
  transactions,
  paymentUpdated,
  paymentError,
  locale
}: {
  reservation: Reservation;
  summary: PaymentSummary;
  transactions: PaymentTransaction[];
  paymentUpdated?: string;
  paymentError?: string;
  locale: TravelLocale;
}) {
  const linkedServices = await listServiceReservationsForRelatedTrip(reservation.id);
  const errorCopy = paymentError && paymentError in errorKeys
    ? errorKeys[paymentError as keyof typeof errorKeys]
    : null;
  const refundReviewAmount = reservation.status === "cancelled"
    ? summary.refundableAmount
    : summary.overpaidAmount;

  return (
    <>
      <section className={styles.panel} style={{ marginTop: "1rem" }} id="linked-services">
        <div className="eyebrow">{tr(locale, "Extras", "Servicios adicionales")}</div>
        <h2>{tr(locale, "Linked services", "Servicios vinculados")}</h2>
        <p className={styles.lead}>
          {tr(
            locale,
            "Activities, transport and travel protection linked to this trip remain separate reservations so each one can keep its own dates, payments and cancellation conditions.",
            "Las actividades, transportes y protecciones de viaje vinculadas a este viaje se gestionan como reservas independientes para conservar sus propias fechas, pagos y condiciones de cancelación."
          )}
        </p>
        {linkedServices.length ? (
          <div className={styles.auditList}>
            {linkedServices.map((service) => (
              <div className={styles.auditItem} key={service.id}>
                <strong>{service.serviceTitle}</strong><br />
                {serviceTypeLabel(service, locale)} · {serviceStatusLabel(service, locale)}<br />
                {serviceDateLabel(service, locale)} · {formatOperatorMoney(service.totalPrice, service.currency, locale, 2)}<br />
                <Link className="text-link" href={`/operator/service-reservations/${encodeURIComponent(service.id)}`}>
                  {tr(locale, "Open service reservation", "Abrir reserva del servicio")}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.muted}>{tr(locale, "No services are linked to this trip yet.", "Todavía no hay servicios vinculados a este viaje.")}</p>
        )}
        <p>
          <Link className="text-link" href="/operator/service-reservations">
            {tr(locale, "View all service reservations", "Ver todas las reservas de servicios")}
          </Link>
        </p>
      </section>

      <section className={styles.panel} style={{ marginTop: "1rem" }}>
        <div className="eyebrow">{tr(locale, "Payments", "Pagos")}</div>
        <h2>{tr(locale, "Payments & balance", "Pagos y saldo")}</h2>
        <p className={styles.lead}>
          {tr(
            locale,
            "Review the current reservation total, funds received, amount still due and any refund that needs staff review.",
            "Revisa el total actual de la reserva, los importes recibidos, el saldo pendiente y cualquier reembolso que deba revisar el equipo."
          )}
        </p>

        {paymentUpdated ? (
          <div className={styles.notice}>
            {paymentUpdated === "refund"
              ? tr(locale, "Refund recorded successfully.", "Reembolso registrado correctamente.")
              : tr(locale, "Payment recorded successfully.", "Pago registrado correctamente.")}
          </div>
        ) : null}
        {errorCopy ? <div className={styles.notice}>{tr(locale, errorCopy[0], errorCopy[1])}</div> : null}

        {summary.settlementStatus === "refund_review" ? (
          <div className={styles.notice}>
            <strong>{tr(locale, "Refund review required", "Revisión de reembolso necesaria")}</strong><br />
            {tr(
              locale,
              `Payments exceed the current reservation total by ${formatOperatorMoney(summary.overpaidAmount, summary.currency, locale, 2)}. Review the booking conditions before recording any refund.`,
              `Los pagos superan el total actual de la reserva en ${formatOperatorMoney(summary.overpaidAmount, summary.currency, locale, 2)}. Revisa las condiciones de la reserva antes de registrar cualquier reembolso.`
            )}
          </div>
        ) : summary.settlementStatus === "payment_due" ? (
          <div className={styles.notice}>
            <strong>{tr(locale, "Amount still to collect", "Importe pendiente de cobro")}</strong><br />
            {tr(
              locale,
              `The current balance is ${formatOperatorMoney(summary.outstandingAmount, summary.currency, locale, 2)}.`,
              `El saldo actual pendiente es ${formatOperatorMoney(summary.outstandingAmount, summary.currency, locale, 2)}.`
            )}
          </div>
        ) : summary.settlementStatus === "pending" ? (
          <div className={styles.notice}>
            {tr(
              locale,
              "A payment or refund is awaiting confirmation. Review the pending movement before recording another adjustment.",
              "Hay un pago o reembolso pendiente de confirmación. Revisa el movimiento pendiente antes de registrar otro ajuste."
            )}
          </div>
        ) : summary.netPaidAmount > 0 ? (
          <div className={styles.notice}>
            {tr(locale, "Payments match the current reservation total.", "Los pagos coinciden con el total actual de la reserva.")}
          </div>
        ) : null}

        {reservation.status === "cancelled" && summary.refundableAmount > 0 ? (
          <div className={styles.notice}>
            {tr(locale, "This cancelled reservation still has funds that may need to be refunded.", "Esta reserva cancelada todavía tiene fondos que pueden requerir reembolso.")}
          </div>
        ) : null}

        <div className={styles.metrics}>
          <div className={styles.metric}><strong>{paymentStatusLabel(summary.status, locale)}</strong><span>{tr(locale, "Payment status", "Estado del pago")}</span></div>
          <div className={styles.metric}><strong>{formatOperatorMoney(summary.totalAmount, summary.currency, locale, 2)}</strong><span>{tr(locale, "Current total", "Total actual")}</span></div>
          <div className={styles.metric}><strong>{formatOperatorMoney(summary.netPaidAmount, summary.currency, locale, 2)}</strong><span>{tr(locale, "Net paid", "Pagado neto")}</span></div>
          <div className={styles.metric}>
            <strong>{formatOperatorMoney(summary.settlementAmount, summary.currency, locale, 2)}</strong>
            <span>{summary.overpaidAmount > 0 ? tr(locale, "Refund review", "Revisar reembolso") : tr(locale, "Outstanding", "Pendiente")}</span>
          </div>
        </div>

        {paymentConfig.writesEnabled ? (
          <div className={styles.formGrid}>
            {summary.outstandingAmount > 0 && summary.pendingPaymentAmount <= 0 ? (
              <ManualMovementForm reservationId={reservation.id} type="payment" maxAmount={summary.outstandingAmount} currency={summary.currency} locale={locale} />
            ) : null}
            {refundReviewAmount > 0 && summary.pendingRefundAmount <= 0 ? (
              <ManualMovementForm reservationId={reservation.id} type="refund" maxAmount={refundReviewAmount} currency={summary.currency} locale={locale} />
            ) : null}
          </div>
        ) : null}

        <h3>{tr(locale, "Transaction history", "Historial de movimientos")}</h3>
        {transactions.length ? (
          <div className={styles.auditList}>
            {transactions.map((transaction) => (
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
    </>
  );
}
