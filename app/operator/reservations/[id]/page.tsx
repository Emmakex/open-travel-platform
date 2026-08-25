import Link from "next/link";
import { notFound } from "next/navigation";
import { updateReservationStatusAction } from "@/app/operator/actions";
import styles from "@/app/operator/operator.module.css";
import { PaymentTermsEditor } from "@/components/operator/payment-terms-editor";
import { ReservationAccommodation } from "@/components/operator/reservation-accommodation";
import { ReservationDepartureChange } from "@/components/operator/reservation-departure-change";
import { ReservationPackageAddOns } from "@/components/operator/reservation-package-addons";
import { ReservationPaymentPanel } from "@/components/operator/reservation-payment-panel";
import { ReservationTravellers } from "@/components/operator/reservation-travellers";
import type { ReservationAmendmentField } from "@/domain/operations/types";
import type { TravelLocale } from "@/domain/travel/types";
import { evaluateTripReservationPolicy } from "@/lib/change-policy";
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
import { requireStaffCapability } from "@/lib/require-staff-capability";
import { listReservationAmendments } from "@/lib/reservation-amendments";
import { hasStaffCapability } from "@/lib/staff-capabilities";
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
  if (
    field === "unitPrice" ||
    field === "totalPrice" ||
    field === "accommodationTotal" ||
    field === "accommodationAdditionalTotal" ||
    field === "packageAddOnTotal"
  ) {
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
  const staff = await requireStaffCapability("reservations");
  const canFinance = hasStaffCapability(staff, "finance");
  const canViewTravellerData = hasStaffCapability(staff, "traveller-data");
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
  const [paymentSummary, paymentTransactions] = canFinance
    ? await Promise.all([
        paymentRepository.getSummary(reservation),
        paymentRepository.listTransactions(reservation.id)
      ])
    : [null, []];
  const trip = trips.find((item) => item.id === reservation.tripId);
  const localizedTrip = trip ? localizeTrip(trip, locale) : null;
  const reservationAudit = audit.filter((event) => event.reservationId === reservation.id);
  const changePolicy = evaluateTripReservationPolicy(reservation);
  const errors: Record<string, string> = {
    "operations-disabled": tr(locale, "Reservation changes are unavailable.", "Los cambios de reserva no están disponibles."),
    "invalid-request": tr(locale, "The requested status change is invalid.", "El cambio de estado solicitado no es válido."),
    "invalid-transition": tr(locale, "That reservation status transition is not allowed.", "Ese cambio de estado de la reserva no está permitido."),
    "change-deadline": tr(locale, "The configured cancellation deadline has passed for this reservation.", "El plazo de cancelación configurado para esta reserva ya ha finalizado.")
  };
  const amendmentErrors: Record<string, string> = {
    "amendments-unavailable": tr(locale, "Reservation changes are unavailable.", "Las modificaciones de reserva no están disponibles."),
    "amendment-deadline": tr(locale, "The configured modification deadline has passed for this reservation.", "El plazo de modificación configurado para esta reserva ya ha finalizado."),
    "invalid-request": tr(locale, "Complete the required fields and provide a reason.", "Completa los campos obligatorios e indica un motivo."),
    "reservation-cancelled": tr(locale, "Cancelled reservations cannot be amended.", "Las reservas canceladas no se pueden modificar."),
    "traveller-not-found": tr(locale, "The traveller could not be found on this reservation.", "No se ha encontrado el viajero en esta reserva."),
    "departure-unavailable": tr(locale, "The selected departure is no longer available or does not have enough space.", "La salida seleccionada ya no está disponible o no tiene plazas suficientes."),
    "trip-not-found": tr(locale, "The trip linked to this reservation could not be found.", "No se ha encontrado el viaje vinculado a esta reserva."),
    "pricing-unavailable": tr(locale, "The traveller composition is not valid for the selected departure. Review traveller ages and responsible-adult relationships.", "La composición de viajeros no es válida para la salida seleccionada. Revisa las edades y las relaciones con adultos responsables."),
    "inventory-release-failed": tr(locale, "The previous departure could not be released safely, so no changes were applied.", "No se pudo liberar la salida anterior de forma segura, por lo que no se aplicó ningún cambio."),
    "accommodation-unavailable": tr(locale, "The new departure does not have enough room inventory for the accommodation saved with this reservation.", "La nueva salida no tiene suficientes habitaciones para el alojamiento guardado con esta reserva."),
    "accommodation-reprice-failed": tr(locale, "The saved accommodation cannot be repriced or allocated for the selected departure. Review room, occupancy and pricing configuration.", "El alojamiento guardado no puede recalcularse o distribuirse para la salida seleccionada. Revisa habitación, ocupación y tarifas."),
    "accommodation-release-failed": tr(locale, "The previous room inventory could not be released safely, so the departure change was rolled back.", "No se pudo liberar de forma segura el inventario anterior de habitaciones, por lo que se revirtió el cambio de salida."),
    "addon-configuration-invalid": tr(locale, "The trip supplement configuration is invalid and must be corrected before this reservation can be amended.", "La configuración de suplementos del viaje no es válida y debe corregirse antes de modificar esta reserva."),
    "addon-selection-invalid": tr(locale, "The selected supplement combination is no longer valid. Review the available extras and travellers.", "La combinación de suplementos seleccionada ya no es válida. Revisa los extras y viajeros disponibles."),
    "addon-disabled-expansion": tr(locale, "A historical supplement that is no longer offered cannot be assigned to additional travellers.", "Un suplemento histórico que ya no se ofrece no puede asignarse a viajeros adicionales."),
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
    inventorySpaces: tr(locale, "Reserved spaces", "Plazas reservadas"),
    accommodationTotal: tr(locale, "Accommodation value", "Valor del alojamiento"),
    accommodationAdditionalTotal: tr(locale, "Accommodation added to total", "Alojamiento añadido al total"),
    packageAddOnTotal: tr(locale, "Package supplements", "Suplementos del paquete")
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
                {tr(locale, "Review the new dates, traveller fares and accommodation below.", "Revisa las nuevas fechas, las tarifas de viajeros y el alojamiento a continuación.")}
              </div>
            ) : null}
            {amendmentUpdated === "package-addons" ? (
              <div className={styles.notice}>
                <strong>{tr(locale, "Package supplements updated.", "Suplementos del paquete actualizados.")}</strong><br />
                {canFinance
                  ? tr(locale, "Review the new reservation total and payment settlement below. Historical payment movements were not changed.", "Revisa el nuevo total de la reserva y la situación de pago. Los movimientos históricos de pago no se han modificado.")
                  : tr(locale, "The reservation total was recalculated. Finance details are available only to staff with Finance permission.", "El total de la reserva se ha recalculado. Los datos financieros solo están disponibles para personal con permiso de Finanzas.")}
              </div>
            ) : null}
            {amendmentError && amendmentErrors[amendmentError] ? (
              <div className={styles.notice}>{amendmentErrors[amendmentError]}</div>
            ) : null}

            {!changePolicy.staffModificationAllowed && reservation.status !== "cancelled" ? (
              <div className={styles.notice}>
                <strong>{tr(locale, "Modification deadline reached", "Plazo de modificación finalizado")}</strong><br />
                {tr(locale, "Traveller corrections, departure changes and package supplement changes are closed under the conditions saved with this reservation.", "Las correcciones de viajeros, cambios de salida y cambios de suplementos están cerrados según las condiciones guardadas con esta reserva.")}
              </div>
            ) : null}
            {!changePolicy.staffCancellationAllowed && reservation.status !== "cancelled" ? (
              <div className={styles.notice}>
                {tr(locale, "The configured staff cancellation period has ended for this reservation.", "El plazo configurado de cancelación por personal ha finalizado para esta reserva.")}
              </div>
            ) : null}

            <dl className={styles.definitionList}>
              <div><dt>{tr(locale, "Status", "Estado")}</dt><dd><span className={styles.badge}>{reservationStatusLabel(reservation.status, locale)}</span></dd></div>
              {paymentSummary ? <div><dt>{tr(locale, "Payment", "Pago")}</dt><dd><span className={styles.badge}>{paymentStatusLabel(paymentSummary.status, locale)}</span></dd></div> : null}
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
                {changePolicy.staffCancellationAllowed ? (
                  <form action={updateReservationStatusAction}>
                    <input type="hidden" name="reservationId" value={reservation.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <button className="button button-secondary" type="submit">{tr(locale, "Cancel reservation", "Cancelar reserva")}</button>
                  </form>
                ) : null}
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
                          : amendment.type === "package-addons-change"
                            ? tr(locale, "Package supplement change", "Cambio de suplementos")
                            : tr(locale, "Traveller correction", "Corrección de viajero")}
                      </strong><br />
                      {amendment.changes.map((change) => (
                        <span key={`${amendment.id}-${change.field}`}>
                          {amendmentFieldLabels[change.field]}: {amendmentValue(change.field, change.before, amendment.currency ?? reservation.currency, locale)} → {amendmentValue(change.field, change.after, amendment.currency ?? reservation.currency, locale)}<br />
                        </span>
                      ))}
                      {(amendment.type === "departure-change" || amendment.type === "package-addons-change") && amendment.priceDelta !== undefined ? (
                        <><span>
                          <strong>{tr(locale, "Price difference", "Diferencia de precio")}:</strong>{" "}
                          {Math.abs(amendment.priceDelta) < 0.005
                            ? tr(locale, "No change", "Sin cambios")
                            : `${amendment.priceDelta > 0 ? "+" : "−"}${formatOperatorMoney(Math.abs(amendment.priceDelta), amendment.currency ?? reservation.currency, locale, 2)}`}
                        </span><br /></>
                      ) : null}
                      {amendment.accommodationBefore?.length || amendment.accommodationAfter?.length ? (
                        <><span><strong>{tr(locale, "Accommodation snapshot", "Snapshot de alojamiento")}:</strong> {amendment.accommodationBefore?.reduce((sum, item) => sum + item.rooms.length, 0) ?? 0} → {amendment.accommodationAfter?.reduce((sum, item) => sum + item.rooms.length, 0) ?? 0} {tr(locale, "room(s)", "habitación(es)")}</span><br /></>
                      ) : null}
                      {amendment.packageAddOnsBefore || amendment.packageAddOnsAfter ? (
                        <><span><strong>{tr(locale, "Supplement snapshot", "Snapshot de suplementos")}:</strong> {amendment.packageAddOnsBefore?.length ?? 0} → {amendment.packageAddOnsAfter?.length ?? 0}</span><br /></>
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

        {changePolicy.staffModificationAllowed ? (
          <ReservationDepartureChange reservation={reservation} trip={trip ?? null} locale={locale} />
        ) : null}

        <ReservationTravellers reservation={reservation} locale={locale} canViewTravellerData={canViewTravellerData} />
        <ReservationAccommodation reservation={reservation} locale={locale} />
        <ReservationPackageAddOns
          reservation={reservation}
          trip={trip ?? null}
          locale={locale}
          writesEnabled={operationsConfig.writesEnabled}
          modificationAllowed={changePolicy.staffModificationAllowed}
        />

        {paymentSummary ? (
          <>
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
          </>
        ) : (
          <section className={styles.panel}>
            <div className="eyebrow">{tr(locale, "Finance", "Finanzas")}</div>
            <h2>{tr(locale, "Restricted financial details", "Datos financieros restringidos")}</h2>
            <p className={styles.muted}>{tr(
              locale,
              "Payments, refunds, balances and payment terms require the Finance permission.",
              "Pagos, reembolsos, saldos y condiciones de pago requieren el permiso de Finanzas."
            )}</p>
          </section>
        )}
      </div>
    </main>
  );
}
