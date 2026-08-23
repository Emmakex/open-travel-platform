import Link from "next/link";
import { notFound } from "next/navigation";
import { updateServiceReservationStatusAction } from "@/app/operator/service-reservations/actions";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
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
  const status = reservation.status === "pending" ? tr(locale, "Pending", "Pendiente") : reservation.status === "confirmed" ? tr(locale, "Confirmed", "Confirmada") : tr(locale, "Cancelled", "Cancelada");

  return (
    <main className="section"><div className={`container ${styles.shell}`}>
      <section className={styles.panel}>
        <div className="eyebrow">{tr(locale, "Independent service reservation", "Reserva de servicio independiente")}</div>
        <h1>{reservation.serviceTitle}</h1>
        {query.updated ? <div className={styles.notice}>{tr(locale, "Reservation status updated.", "Estado de la reserva actualizado.")}</div> : null}
        {query.error === "unchanged" ? <div className={styles.notice}>{tr(locale, "The reservation could not be changed from its current state.", "La reserva no se puede cambiar desde su estado actual.")}</div> : null}
        <dl className={styles.detailList}>
          <div><dt>{tr(locale, "Status", "Estado")}</dt><dd><span className={styles.badge}>{status}</span></dd></div>
          <div><dt>{tr(locale, "Customer ID", "ID de cliente")}</dt><dd>{reservation.identityId}</dd></div>
          <div><dt>{tr(locale, "Type", "Tipo")}</dt><dd>{reservation.serviceType === "activity" ? tr(locale, "Activity", "Actividad") : reservation.serviceType === "transport" ? tr(locale, "Transport", "Transporte") : tr(locale, "Insurance", "Seguro")}</dd></div>
          {reservation.serviceDate ? <div><dt>{tr(locale, "Date and time", "Fecha y horario")}</dt><dd>{formatDate(reservation.serviceDate, locale)} · {reservation.startTime}{reservation.endTime ? `–${reservation.endTime}` : ""}</dd></div> : null}
          {reservation.insuranceTrip ? <><div><dt>{tr(locale, "Destination", "Destino")}</dt><dd>{reservation.insuranceTrip.destination}</dd></div><div><dt>{tr(locale, "Trip dates", "Fechas del viaje")}</dt><dd>{formatDate(reservation.insuranceTrip.startDate, locale)} → {formatDate(reservation.insuranceTrip.endDate, locale)}</dd></div>{reservation.insuranceTrip.insuredAmount !== undefined ? <div><dt>{tr(locale, "Insured trip amount", "Importe del viaje asegurado")}</dt><dd>{formatOperatorMoney(reservation.insuranceTrip.insuredAmount, reservation.currency, locale)}</dd></div> : null}</> : null}
          <div><dt>{tr(locale, "Travellers", "Viajeros")}</dt><dd>{reservation.partySize}</dd></div>
          <div><dt>{tr(locale, "Inventory consumed", "Inventario consumido")}</dt><dd>{reservation.inventoryUnits}</dd></div>
          <div><dt>Total</dt><dd>{formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</dd></div>
          <div><dt>{tr(locale, "Reference", "Referencia")}</dt><dd>{reservation.id}</dd></div>
          {reservation.relatedReservationId ? <div><dt>{tr(locale, "Linked trip reservation", "Reserva de viaje vinculada")}</dt><dd><Link className="text-link" href={`/operator/reservations/${reservation.relatedReservationId}`}>{reservation.relatedReservationId}</Link></dd></div> : null}
        </dl>

        <div className={styles.editorSection} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Travellers", "Viajeros")}</div>
          <div className={styles.list}>{reservation.travellers.map((traveller) => <div className={styles.row} key={traveller.id}><strong>{traveller.firstName} {traveller.lastName}{traveller.isLead ? ` · ${tr(locale, "lead", "principal")}` : ""}</strong><span>{traveller.dateOfBirth} · {traveller.nationality}</span><span>{traveller.ageAtDeparture} {tr(locale, "years", "años")} · {locale === "es" ? traveller.pricingLabelEs || traveller.pricingLabel : traveller.pricingLabel}</span><span>{formatOperatorMoney(traveller.unitPrice, reservation.currency, locale)}</span></div>)}</div>
        </div>

        {reservation.status !== "cancelled" ? <div className={styles.actions} style={{ marginTop: "1rem" }}>
          {reservation.status === "pending" ? <form action={updateServiceReservationStatusAction}><input type="hidden" name="reservationId" value={reservation.id} /><input type="hidden" name="status" value="confirmed" /><button className="button button-primary" type="submit">{tr(locale, "Confirm reservation", "Confirmar reserva")}</button></form> : null}
          <form action={updateServiceReservationStatusAction}><input type="hidden" name="reservationId" value={reservation.id} /><input type="hidden" name="status" value="cancelled" /><button className="button button-secondary" type="submit">{tr(locale, "Cancel reservation", "Cancelar reserva")}</button></form>
        </div> : null}
        <p><Link className="text-link" href="/operator/service-reservations">{tr(locale, "← Service reservation queue", "← Cola de reservas de servicios")}</Link></p>
      </section>
    </div></main>
  );
}
