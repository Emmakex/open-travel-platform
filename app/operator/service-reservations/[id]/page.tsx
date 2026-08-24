import Link from "next/link";
import { notFound } from "next/navigation";
import { updateServiceReservationStatusAction } from "@/app/operator/service-reservations/actions";
import styles from "@/app/operator/operator.module.css";
import { evaluateServiceReservationPolicy } from "@/lib/change-policy";
import { getLocale } from "@/lib/get-locale";
import { listTravellerCompletionForOperator } from "@/lib/traveller-data";
import { formatOperatorMoney, tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { getServiceReservationForOperator } from "@/lib/service-reservations";

function formatDate(value: string, locale: "en" | "es") {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

export default async function OperatorServiceReservationPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const [{ id }, query, locale] = await Promise.all([params, searchParams, getLocale()]);
  await requireOperationsIdentity();
  const reservation = await getServiceReservationForOperator(id);
  if (!reservation) notFound();
  const policy = evaluateServiceReservationPolicy(reservation);
  const status = reservation.status === "pending" ? tr(locale, "Pending", "Pendiente") : reservation.status === "confirmed" ? tr(locale, "Confirmed", "Confirmada") : tr(locale, "Cancelled", "Cancelada");
  const requirementsActive = Boolean(
    reservation.travellerRequirements &&
    reservation.travellerRequirements.preset !== "none"
  );
  const completion = requirementsActive
    ? await listTravellerCompletionForOperator({
        targetType: "service",
        reservationId: reservation.id,
        profile: reservation.travellerRequirements,
        travellers: reservation.travellers
      }).catch(() => [])
    : [];
  const completionByTraveller = new Map(completion.map((item) => [item.travellerId, item]));
  const completedCount = completion.filter((item) => item.complete).length;
  const allComplete = requirementsActive &&
    completion.length === reservation.travellers.length &&
    completedCount === reservation.travellers.length;

  return (
    <main className="section"><div className={`container ${styles.shell}`}>
      <section className={styles.panel}>
        <div className="eyebrow">{tr(locale, "Service reservation", "Reserva de servicio")}</div>
        <h1>{reservation.serviceTitle}</h1>
        {query.updated ? <div className={styles.notice}>{tr(locale, "Reservation status updated.", "Estado de la reserva actualizado.")}</div> : null}
        {query.error === "unchanged" ? <div className={styles.notice}>{tr(locale, "The reservation could not be changed from its current state.", "La reserva no se puede cambiar desde su estado actual.")}</div> : null}
        {query.error === "change-deadline" ? <div className={styles.notice}>{tr(locale, "The configured cancellation deadline has passed for this reservation.", "El plazo de cancelación configurado para esta reserva ya ha finalizado.")}</div> : null}
        {query.error === "inventory-release" ? <div className={styles.notice}>{tr(locale, "The reservation was not cancelled because its capacity could not be released safely.", "La reserva no se ha cancelado porque no se pudo liberar su capacidad de forma segura.")}</div> : null}
        {query.error === "update-failed" ? <div className={styles.notice}>{tr(locale, "The reservation could not be updated. Try again.", "No se pudo actualizar la reserva. Inténtalo de nuevo.")}</div> : null}
        <dl className={styles.detailList}>
          <div><dt>{tr(locale, "Status", "Estado")}</dt><dd><span className={styles.badge}>{status}</span></dd></div>
          <div><dt>{tr(locale, "Customer ID", "ID de cliente")}</dt><dd>{reservation.identityId}</dd></div>
          <div><dt>{tr(locale, "Type", "Tipo")}</dt><dd>{reservation.serviceType === "activity" ? tr(locale, "Activity", "Actividad") : reservation.serviceType === "transport" ? tr(locale, "Transport", "Transporte") : tr(locale, "Travel protection", "Protección de viaje")}</dd></div>
          {reservation.serviceDate ? <div><dt>{tr(locale, "Date and time", "Fecha y horario")}</dt><dd>{formatDate(reservation.serviceDate, locale)} · {reservation.startTime}{reservation.endTime ? `–${reservation.endTime}` : ""}</dd></div> : null}
          {reservation.insuranceTrip ? <><div><dt>{tr(locale, "Destination", "Destino")}</dt><dd>{reservation.insuranceTrip.destination}</dd></div><div><dt>{tr(locale, "Trip dates", "Fechas del viaje")}</dt><dd>{formatDate(reservation.insuranceTrip.startDate, locale)} → {formatDate(reservation.insuranceTrip.endDate, locale)}</dd></div>{reservation.insuranceTrip.insuredAmount !== undefined ? <div><dt>{tr(locale, "Insured trip amount", "Importe del viaje asegurado")}</dt><dd>{formatOperatorMoney(reservation.insuranceTrip.insuredAmount, reservation.currency, locale)}</dd></div> : null}</> : null}
          <div><dt>{tr(locale, "Travellers", "Viajeros")}</dt><dd>{reservation.partySize}</dd></div>
          <div><dt>{tr(locale, "Capacity used", "Capacidad utilizada")}</dt><dd>{reservation.inventoryUnits}</dd></div>
          <div><dt>Total</dt><dd>{formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</dd></div>
          <div><dt>{tr(locale, "Reference", "Referencia")}</dt><dd>{reservation.id}</dd></div>
          {reservation.relatedReservationId ? <div><dt>{tr(locale, "Linked trip", "Viaje vinculado")}</dt><dd><Link className="text-link" href={`/operator/reservations/${reservation.relatedReservationId}`}>{reservation.relatedReservationId}</Link></dd></div> : null}
        </dl>

        {reservation.status !== "cancelled" && !policy.staffCancellationAllowed ? (
          <div className={styles.notice}>
            <strong>{tr(locale, "Cancellation deadline reached", "Plazo de cancelación finalizado")}</strong><br />
            {tr(locale, "This reservation can no longer be cancelled from Operations under the conditions saved when it was booked.", "Esta reserva ya no puede cancelarse desde Operaciones según las condiciones guardadas cuando se realizó la reserva.")}
          </div>
        ) : null}
        {reservation.status === "pending" && !policy.customerCancellationAllowed ? (
          <div className={styles.notice}>
            {tr(locale, "Customer self-service cancellation is no longer available for this reservation.", "La cancelación directa por el cliente ya no está disponible para esta reserva.")}
          </div>
        ) : null}

        <div className={styles.editorSection} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Travellers", "Viajeros")}</div>
          <h2>{tr(locale, "Traveller-data status", "Estado de datos de viajeros")}</h2>
          {requirementsActive ? (
            <div className={styles.notice}>
              <strong>
                {allComplete
                  ? tr(locale, "Post-purchase traveller data: COMPLETE", "Datos post-compra de viajeros: COMPLETOS")
                  : tr(locale, "Post-purchase traveller data: PENDING", "Datos post-compra de viajeros: PENDIENTES")}
              </strong><br />
              {tr(
                locale,
                `${completedCount}/${reservation.travellers.length} travellers complete. The customer manages this task from My account → Service reservation → Traveller information.`,
                `${completedCount}/${reservation.travellers.length} viajeros completos. El cliente gestiona esta tarea desde Mi cuenta → Reserva de servicio → Datos de viajeros.`
              )}
            </div>
          ) : (
            <div className={styles.notice}>
              <strong>{tr(locale, "Post-purchase traveller data: NOT REQUIRED", "Datos post-compra de viajeros: NO REQUERIDOS")}</strong><br />
              {tr(
                locale,
                "This service reservation was created without additional traveller-data requirements.",
                "Esta reserva de servicio se creó sin requisitos adicionales de datos de viajeros."
              )}
            </div>
          )}
          <div className={styles.list}>{reservation.travellers.map((traveller) => {
            const travellerCompletion = completionByTraveller.get(traveller.id);
            return <div className={styles.row} key={traveller.id}><strong>{traveller.firstName} {traveller.lastName}{traveller.isLead ? ` · ${tr(locale, "lead", "principal")}` : ""}</strong>{requirementsActive ? <span><strong>{tr(locale, "Traveller-data status", "Estado de datos")}: {travellerCompletion?.complete ? tr(locale, "Complete", "Completo") : tr(locale, "Pending", "Pendiente")}</strong></span> : null}<span>{traveller.dateOfBirth} · {traveller.nationality}</span><span>{traveller.ageAtDeparture} {tr(locale, "years", "años")} · {locale === "es" ? traveller.pricingLabelEs || traveller.pricingLabel : traveller.pricingLabel}</span><span>{formatOperatorMoney(traveller.unitPrice, reservation.currency, locale)}</span></div>;
          })}</div>
        </div>

        {reservation.status !== "cancelled" ? <div className={styles.actions} style={{ marginTop: "1rem" }}>
          {reservation.status === "pending" ? <form action={updateServiceReservationStatusAction}><input type="hidden" name="reservationId" value={reservation.id} /><input type="hidden" name="status" value="confirmed" /><button className="button button-primary" type="submit">{tr(locale, "Confirm reservation", "Confirmar reserva")}</button></form> : null}
          {policy.staffCancellationAllowed ? <form action={updateServiceReservationStatusAction}><input type="hidden" name="reservationId" value={reservation.id} /><input type="hidden" name="status" value="cancelled" /><button className="button button-secondary" type="submit">{tr(locale, "Cancel reservation", "Cancelar reserva")}</button></form> : null}
        </div> : null}
        <p><Link className="text-link" href="/operator/service-reservations">{tr(locale, "← Service reservation queue", "← Cola de reservas de servicios")}</Link></p>
      </section>
    </div></main>
  );
}
