import Link from "next/link";
import { notFound } from "next/navigation";
import { updateReservationStatusAction } from "@/app/operator/actions";
import styles from "@/app/operator/operator.module.css";
import { PaymentTermsEditor } from "@/components/operator/payment-terms-editor";
import { ReservationDepartureChange } from "@/components/operator/reservation-departure-change";
import { ReservationPaymentPanel } from "@/components/operator/reservation-payment-panel";
import { ReservationTravellers } from "@/components/operator/reservation-travellers";
import type { ReservationAmendmentField } from "@/domain/operations/types";
import type { TravelLocale } from "@/domain/travel/types";
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
import { paymentStatusLabel } from "@/lib/payment-i18n";
import { getPaymentRepository } from "@/lib/payment-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { listReservationAmendments } from "@/lib/reservation-amendments";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "Reservation",
  description: "Protected reservation detail."
};

function amendmentValue(
  field: ReservationAmendmentField,
  value: string,
  currency: string,
  locale: TravelLocale
) {
  if (field === "unitPrice" || field === "totalPrice") {
    const number = Number(value);
    return Number.isFinite(number) ? formatOperatorMoney(number, currency, locale, 2) : value;
  }
  if ((field === "departureDate" || field === "returnDate") && value) {
    return formatOperatorDate(`${value}T00:00:00Z`, locale);
  }
  return value || "—";
}

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
    termsUpdated?: string;
    termsError?: string;
    termsReminder?: string;
    amendmentUpdated?: string;
    amendmentError?: string;
  }>;
}) {
  const locale = await getLocale();
  const staff = await requireOperationsIdentity();
  const { id } = await params;
  const {
    updated,
    error,
    paymentUpdated,
    paymentError,
    termsUpdated,
    termsError,
    termsReminder,
    amendmentUpdated,
    amendmentError
  } = await searchParams;
  const operations = getOperationsRepository();
  const [reservation, trips, audit, amendments] = await Promise.all([
    operations.getReservation(id),
    getTravelRepository().listTrips(),
    operations.listAuditEvents(),
    listReservationAmendments(id)
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
    "operations-disabled": tr(locale, "Reservation changes are unavailable.", "Los cambios de reserva no están disponibles."),
    "invalid-request": tr(locale, "The requested status change is invalid.", "El cambio de estado solicitado no es válido."),
    "invalid-transition": tr(locale, "That reservation status transition is not allowed.", "Ese cambio de estado de la reserva no está permitido.")
  };
  const amendmentErrors: Record<string, string> = {
    "amendments-unavailable": tr(locale, "Reservation changes are unavailable.", "Las modificaciones de reserva no están disponibles."),
    "invalid-request": tr(locale, "Complete the required fields and provide a reason.", "Completa los campos obligatorios e indica un motivo."),
    "reservation-cancelled": tr(locale, "Cancelled reservations cannot be amended.", "Las reservas canceladas no se pueden modificar."),
    "traveller-not-found": tr(locale, "The traveller could not be found on this reservation.", "No se ha encontrado el viajero en esta reserva."),
    "departure-unavailable": tr(locale, "The selected departure is no longer available or does not have enough space.", "La salida seleccionada ya no está disponible o no tiene plazas suficientes."),
    "trip-not-found": tr(locale, "The trip linked to this reservation could not be found.", "No se ha encontrado el viaje vinculado a esta reserva."),
    "pricing-unavailable": tr(locale, "The traveller composition is not valid for the selected departure. Review traveller ages and responsible-adult relationships.", "La composición de viajeros no es válida para la salida seleccionada. Revisa las edades y las relaciones con adultos responsables."),
    "inventory-release-failed": tr(locale, "The previous departure could not be released safely, so no changes were applied.", "No se pudo liberar la salida anterior de forma segura, por lo que no se aplicó ningún cambio."),
    "not-found": tr(locale, "The reservation could not be found.", "No se ha encontrado la reserva."),
    "no-changes": tr(locale, "No changes were detected. Choose a different value.", "No se detectaron cambios. Selecciona un valor diferente."),
    "update-conflict": tr(locale, "The reservation changed at the same time. Review it and try again.", "La reserva cambió al mismo tiempo. Revísala y vuelve a intentarlo."),
    "update-failed": tr(locale, "The change could not be saved.", "No se pudo guardar el cambio.")
  };
  const amendmentFieldLabels: Record<ReservationAmendmentField, string> = {
    firstName: tr(locale, "First name", "Nombre"),
    lastName: tr(locale, "Last name", "Apellidos"),
    nationality: tr(locale, "Nationality", "Nacionalidad"),
    availabilityId: tr(locale, "Departure reference", "Referencia de salida"),
    departureDate: tr(locale, "Departure", "Salida"),
    returnDate: tr(locale, "Return", "Regreso"),
    unitPrice: tr(locale, "Lead fare", "Tarifa principal"),
    totalPrice: tr(locale, "Reservation total", "Total de la reserva"),
    inventorySpaces: tr(locale, "Reserved spaces", "Plazas reservadas")
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
              {tr(locale, "can review and manage this reservation.", "puede revisar y gestionar esta reserva.")}
            </p>

            {updated ? (
              <div className={styles.notice}>
                {tr(locale, "Reservation status updated to", "Estado de la reserva actualizado a")} {reservationStatusLabel(updated, locale)}.
              </div>
            ) : null}
            {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}
            {amendmentUpdated === "traveller" ? (
              <div className={styles.notice}>
                <strong>{tr(locale, "Traveller correction saved.", "Corrección del viajero guardada.")}</strong><br />
                {tr(locale, "The previous value remains available in the change history.", "El valor anterior permanece disponible en el historial de cambios.")}
              </div>
            ) : null}
            {amendmentUpdated === "departure" ? (
              <div className={styles.notice}>
                <strong>{tr(locale, "Departure changed successfully.", "Salida cambiada correctamente.")}</strong><br />
                {tr(locale, "Review the new dates, traveller fares and payment summary below.", "Revisa las nuevas fechas, las tarifas de viajeros y el resumen de pagos a continuación.")}
              </div>
            ) : null}
            {amendmentError && amendmentErrors[amendmentError] ? (
              <div className={styles.notice}>{amendmentErrors[amendmentError]}</div>
            ) : null}

            <dl className={styles.definitionList}>
              <div><dt>{tr(locale, "Status", "Estado")}</dt><dd><span className={styles.badge}>{reservationStatusLabel(reservation.status, locale)}</span></dd></div>
              <div><dt>{tr(locale, "Payment", "Pago")}</dt><dd><span className={styles.badge}>{paymentStatusLabel(paymentSummary.status, locale)}</span></dd></div>
              <div><dt>{tr(locale, "Customer ID", "ID de cliente")}</dt><dd>{reservation.identityId}</dd></div>
              <div><dt>{tr(locale, "Travellers", "Viajeros")}</dt><dd>{reservation.partySize}</dd></div>
              <div><dt>{tr(locale, "Reserved spaces", "Plazas reservadas")}</dt><dd>{reservation.inventorySpaces ?? reservation.partySize}</dd></div>
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

            <div style={{ marginTop: "1.5rem" }}>
              <div className="eyebrow">{tr(locale, "Amendments", "Modificaciones")}</div>
              <h2>{tr(locale, "Change history", "Historial de cambios")}</h2>
              {amendments.length ? (
                <div className={styles.auditList}>
                  {amendments.map((amendment) => (
                    <div className={styles.auditItem} key={amendment.id}>
                      <strong>
                        {amendment.type === "departure-change"
                          ? tr(locale, "Departure change", "Cambio de salida")
                          : tr(locale, "Traveller correction", "Corrección de viajero")}
                      </strong><br />
                      {amendment.changes.map((change) => (
                        <span key={`${amendment.id}-${change.field}`}>
                          {amendmentFieldLabels[change.field]}: {amendmentValue(change.field, change.before, amendment.currency ?? reservation.currency, locale)} → {amendmentValue(change.field, change.after, amendment.currency ?? reservation.currency, locale)}<br />
                        </span>
                      ))}
                      {amendment.type === "departure-change" && amendment.priceDelta !== undefined ? (
                        <><span>
                          <strong>{tr(locale, "Price difference", "Diferencia de precio")}:</strong>{" "}
                          {Math.abs(amendment.priceDelta) < 0.005
                            ? tr(locale, "No change", "Sin cambios")
                            : `${amendment.priceDelta > 0 ? "+" : "−"}${formatOperatorMoney(Math.abs(amendment.priceDelta), amendment.currency ?? reservation.currency, locale, 2)}`}
                        </span><br /></>
                      ) : null}
                      <span><strong>{tr(locale, "Reason", "Motivo")}:</strong> {amendment.reason}</span><br />
                      <span>{staffRoleLabel(amendment.actorRole, locale)} · {amendment.actorIdentityId}</span><br />
                      {formatOperatorDate(amendment.occurredAt, locale, true)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.muted}>{tr(locale, "No reservation amendments have been recorded yet.", "Todavía no se han registrado modificaciones de esta reserva.")}</p>
              )}
            </div>
          </aside>
        </div>

        <ReservationDepartureChange reservation={reservation} trip={trip ?? null} locale={locale} />

        <ReservationTravellers reservation={reservation} locale={locale} />

        <PaymentTermsEditor
          reservation={reservation}
          summary={paymentSummary}
          locale={locale}
          termsUpdated={termsUpdated}
          termsError={termsError}
          termsReminder={termsReminder}
        />

        <ReservationPaymentPanel
          reservation={reservation}
          summary={paymentSummary}
          transactions={paymentTransactions}
          paymentUpdated={paymentUpdated}
          paymentError={paymentError}
          locale={locale}
        />
      </div>
    </main>
  );
}
