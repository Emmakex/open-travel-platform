import { savePaymentTermsAction } from "@/app/operator/payments/actions";
import styles from "@/app/operator/operator.module.css";
import type { Reservation } from "@/domain/booking/types";
import type { PaymentSummary } from "@/domain/payment/types";
import type { TravelLocale } from "@/domain/travel/types";
import { formatOperatorDate, formatOperatorMoney, tr } from "@/lib/operator-i18n";
import { deriveReservationPaymentSchedule, type PaymentInstallmentState } from "@/lib/payment-terms";

const stateCopy: Record<PaymentInstallmentState, [string, string]> = {
  paid: ["Paid", "Pagada"],
  partially_paid: ["Partially paid", "Parcialmente pagada"],
  due: ["Due", "Vence ahora"],
  upcoming: ["Upcoming", "Próxima"],
  overdue: ["Overdue", "Vencida"]
};

const errorKeys: Record<string, [string, string]> = {
  "invalid-request": ["Check all payment-term fields and try again.", "Revisa todos los campos de las condiciones de pago e inténtalo de nuevo."],
  "terms-disabled": ["Payment-term changes are disabled in this deployment.", "Los cambios de condiciones de pago están desactivados en este despliegue."],
  "reservation-not-found": ["The reservation no longer exists.", "La reserva ya no existe."],
  "terms-date-invalid": ["One of the due dates is invalid.", "Una de las fechas de vencimiento no es válida."],
  "terms-date-order": ["Due dates must be in chronological order.", "Las fechas de vencimiento deben estar en orden cronológico."],
  "terms-after-departure": ["Payment due dates cannot be after departure.", "Los vencimientos no pueden ser posteriores a la salida."],
  "terms-amount-invalid": ["Every scheduled payment must have a positive amount.", "Cada pago programado debe tener un importe positivo."],
  "terms-deposit-invalid": ["The deposit must be positive and lower than the reservation total.", "El depósito debe ser positivo y menor que el total de la reserva."],
  "terms-installment-count": ["Use between 2 and 6 installments.", "Utiliza entre 2 y 6 cuotas."],
  "terms-total-mismatch": ["The installments must add up exactly to the reservation total.", "Las cuotas deben sumar exactamente el total de la reserva."],
  "terms-error": ["Payment terms could not be saved.", "No se pudieron guardar las condiciones de pago."]
};

function dateValue(value?: string) {
  return value || "";
}

export function PaymentTermsEditor({
  reservation,
  summary,
  locale,
  termsUpdated,
  termsError
}: {
  reservation: Reservation;
  summary: PaymentSummary;
  locale: TravelLocale;
  termsUpdated?: string;
  termsError?: string;
}) {
  const schedule = deriveReservationPaymentSchedule(reservation, summary);
  const terms = reservation.paymentTerms;
  const deposit = terms?.mode === "deposit" ? terms : undefined;
  const customInstallments = terms?.mode === "installments" ? terms.installments : [];
  const full = terms?.mode === "full" ? terms.installments[0] : undefined;
  const errorCopy = termsError ? errorKeys[termsError] : undefined;

  return (
    <section className={styles.panel} style={{ marginTop: "1rem" }}>
      <div className="eyebrow">{tr(locale, "Payment terms", "Condiciones de pago")}</div>
      <h2>{tr(locale, "Deposits and installments", "Depósitos y cuotas")}</h2>
      <p className={styles.lead}>
        {tr(
          locale,
          "The ledger records money actually received. This schedule only defines how the reservation balance is expected to be paid.",
          "El registro financiero guarda el dinero realmente recibido. Este calendario solo define cómo debe abonarse el saldo de la reserva."
        )}
      </p>

      {termsUpdated ? <div className={styles.notice}>{tr(locale, "Payment terms saved.", "Condiciones de pago guardadas.")}</div> : null}
      {errorCopy ? <div className={styles.notice}>{tr(locale, errorCopy[0], errorCopy[1])}</div> : null}
      {schedule.outdated ? (
        <div className={styles.notice}>
          {tr(
            locale,
            "The reservation total or currency changed after these terms were configured. A full-balance fallback is being used until the schedule is saved again.",
            "El total o la moneda de la reserva cambió después de configurar estas condiciones. Se usa temporalmente pago completo hasta volver a guardar el calendario."
          )}
        </div>
      ) : null}

      <h3>{tr(locale, "Current schedule", "Calendario actual")}</h3>
      <div className={styles.auditList}>
        {schedule.installments.map((installment) => (
          <div className={styles.auditItem} key={installment.id}>
            <strong>{locale === "es" ? (installment.labelEs || installment.label) : installment.label} · {formatOperatorMoney(installment.amount, reservation.currency, locale, 2)}</strong><br />
            {installment.dueDate
              ? `${tr(locale, "Due", "Vence")}: ${formatOperatorDate(`${installment.dueDate}T00:00:00Z`, locale)}`
              : tr(locale, "No due date", "Sin fecha de vencimiento")}
            <br />
            {tr(locale, stateCopy[installment.state][0], stateCopy[installment.state][1])} · {tr(locale, "Remaining", "Pendiente")}: {formatOperatorMoney(installment.outstandingAmount, reservation.currency, locale, 2)}
          </div>
        ))}
      </div>

      <div className={styles.formGrid}>
        <form action={savePaymentTermsAction} className={styles.editorForm}>
          <input type="hidden" name="reservationId" value={reservation.id} />
          <input type="hidden" name="mode" value="full" />
          <h3>{tr(locale, "Full balance", "Pago completo")}</h3>
          <p className={styles.muted}>{tr(locale, "One payment for the complete reservation total.", "Un único pago por el total completo de la reserva.")}</p>
          <label className={styles.field}>
            <span>{tr(locale, "Due date (optional)", "Fecha límite (opcional)")}</span>
            <input name="fullDueDate" type="date" defaultValue={dateValue(full?.dueDate)} max={reservation.departureDate} />
          </label>
          <button className="button button-secondary" type="submit">{tr(locale, "Use full balance", "Usar pago completo")}</button>
        </form>

        <form action={savePaymentTermsAction} className={styles.editorForm}>
          <input type="hidden" name="reservationId" value={reservation.id} />
          <input type="hidden" name="mode" value="deposit" />
          <h3>{tr(locale, "Deposit + final balance", "Depósito + saldo final")}</h3>
          <label className={styles.field}>
            <span>{tr(locale, "Deposit calculation", "Cálculo del depósito")}</span>
            <select name="depositType" defaultValue={deposit?.depositType ?? "percentage"}>
              <option value="percentage">{tr(locale, "Percentage", "Porcentaje")}</option>
              <option value="fixed">{tr(locale, "Fixed amount", "Importe fijo")}</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>{tr(locale, "Deposit value", "Valor del depósito")}</span>
            <input name="depositValue" type="number" min="0.01" step="0.01" defaultValue={deposit?.depositValue ?? 20} required />
          </label>
          <label className={styles.field}>
            <span>{tr(locale, "Deposit due date", "Vencimiento del depósito")}</span>
            <input name="depositDueDate" type="date" defaultValue={dateValue(deposit?.installments[0]?.dueDate)} max={reservation.departureDate} required />
          </label>
          <label className={styles.field}>
            <span>{tr(locale, "Final balance due date", "Vencimiento del saldo final")}</span>
            <input name="balanceDueDate" type="date" defaultValue={dateValue(deposit?.installments[1]?.dueDate)} max={reservation.departureDate} required />
          </label>
          <button className="button button-primary" type="submit">{tr(locale, "Save deposit terms", "Guardar depósito")}</button>
        </form>
      </div>

      <form action={savePaymentTermsAction} className={styles.editorForm} style={{ marginTop: "1rem" }}>
        <input type="hidden" name="reservationId" value={reservation.id} />
        <input type="hidden" name="mode" value="installments" />
        <h3>{tr(locale, "Custom installment schedule", "Calendario de cuotas personalizado")}</h3>
        <p className={styles.muted}>
          {tr(
            locale,
            "Use between 2 and 6 rows. Leave unused rows empty. The amounts must add up exactly to the reservation total.",
            "Utiliza entre 2 y 6 filas. Deja vacías las que no uses. Los importes deben sumar exactamente el total de la reserva."
          )}
        </p>
        <div className={styles.formGrid}>
          {Array.from({ length: 6 }, (_, index) => {
            const current = customInstallments[index];
            return (
              <div className={styles.editorForm} key={index}>
                <strong>{tr(locale, `Installment ${index + 1}`, `Cuota ${index + 1}`)}</strong>
                <label className={styles.field}>
                  <span>{tr(locale, "Amount", "Importe")}</span>
                  <input name={`installmentAmount__${index + 1}`} type="number" min="0.01" step="0.01" defaultValue={current?.amount ?? ""} />
                </label>
                <label className={styles.field}>
                  <span>{tr(locale, "Due date", "Vencimiento")}</span>
                  <input name={`installmentDueDate__${index + 1}`} type="date" defaultValue={dateValue(current?.dueDate)} max={reservation.departureDate} />
                </label>
              </div>
            );
          })}
        </div>
        <button className="button button-primary" type="submit">{tr(locale, "Save installment schedule", "Guardar calendario de cuotas")}</button>
      </form>
    </section>
  );
}
