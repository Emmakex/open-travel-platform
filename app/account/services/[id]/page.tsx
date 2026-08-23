import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelServiceReservationAction } from "@/app/service-reservations/actions";
import styles from "@/app/account/account.module.css";
import { getLocale } from "@/lib/get-locale";
import { formatCurrency } from "@/lib/i18n";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { getServiceReservationForCustomer } from "@/lib/service-reservations";

function formatDate(value: string, locale: "en" | "es") {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

export default async function AccountServiceReservationPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const [{ id }, query, locale] = await Promise.all([params, searchParams, getLocale()]);
  const identity = await requireCustomerIdentity();
  const reservation = await getServiceReservationForCustomer(identity.id, id);
  if (!reservation) notFound();
  const t = (en: string, es: string) => locale === "es" ? es : en;

  return (
    <main className="section"><div className={`container ${styles.shell}`}><section className={styles.panel}>
      <div className="eyebrow">{t("Service reservation", "Reserva de servicio")}</div>
      <h1>{reservation.serviceTitle}</h1>
      {query.created === "1" ? <div className={styles.notice}>{t("Your service reservation has been created.", "Tu reserva del servicio se ha creado correctamente.")}</div> : null}
      {query.updated === "cancelled" ? <div className={styles.notice}>{t("The reservation was cancelled and its inventory was released.", "La reserva se canceló y su cupo fue liberado.")}</div> : null}
      {query.error === "not-cancellable" ? <div className={styles.notice}>{t("This reservation can no longer be cancelled from your account.", "Esta reserva ya no puede cancelarse desde tu cuenta.")}</div> : null}
      <dl className={styles.profileList}>
        <div><dt>{t("Status", "Estado")}</dt><dd>{reservation.status === "pending" ? t("Pending", "Pendiente") : reservation.status === "confirmed" ? t("Confirmed", "Confirmada") : t("Cancelled", "Cancelada")}</dd></div>
        <div><dt>{t("Type", "Tipo")}</dt><dd>{reservation.serviceType === "activity" ? t("Activity", "Actividad") : reservation.serviceType === "transport" ? t("Transport", "Transporte") : t("Insurance", "Seguro")}</dd></div>
        {reservation.serviceDate ? <div><dt>{t("Date", "Fecha")}</dt><dd>{formatDate(reservation.serviceDate, locale)} · {reservation.startTime}{reservation.endTime ? `–${reservation.endTime}` : ""}</dd></div> : null}
        {reservation.insuranceTrip ? <><div><dt>{t("Destination", "Destino")}</dt><dd>{reservation.insuranceTrip.destination}</dd></div><div><dt>{t("Trip dates", "Fechas del viaje")}</dt><dd>{formatDate(reservation.insuranceTrip.startDate, locale)} → {formatDate(reservation.insuranceTrip.endDate, locale)}</dd></div></> : null}
        <div><dt>{t("Travellers", "Viajeros")}</dt><dd>{reservation.partySize}</dd></div>
        <div><dt>Total</dt><dd>{formatCurrency(reservation.totalPrice, reservation.currency, locale)}</dd></div>
        <div><dt>{t("Reference", "Referencia")}</dt><dd>{reservation.id}</dd></div>
        {reservation.relatedReservationId ? <div><dt>{t("Linked trip reservation", "Reserva de viaje vinculada")}</dt><dd><Link className="text-link" href={`/account/reservations/${reservation.relatedReservationId}`}>{reservation.relatedReservationId}</Link></dd></div> : null}
      </dl>

      <h2>{t("Travellers", "Viajeros")}</h2>
      <dl className={styles.profileList}>
        {reservation.travellers.map((traveller) => <div key={traveller.id}><dt>{traveller.firstName} {traveller.lastName}{traveller.isLead ? ` · ${t("lead", "principal")}` : ""}</dt><dd>{traveller.ageAtDeparture} {t("years", "años")} · {locale === "es" ? traveller.pricingLabelEs || traveller.pricingLabel : traveller.pricingLabel} · {formatCurrency(traveller.unitPrice, reservation.currency, locale)}</dd></div>)}
      </dl>

      <div className={styles.actions}>
        {reservation.status === "pending" ? <form action={cancelServiceReservationAction}><input type="hidden" name="reservationId" value={reservation.id} /><button className="button button-secondary" type="submit">{t("Cancel reservation", "Cancelar reserva")}</button></form> : null}
        <Link className="button button-primary" href={`/${reservation.serviceType === "activity" ? "activities" : reservation.serviceType}/${reservation.serviceSlug}`}>{t("View service", "Ver servicio")}</Link>
        <Link className="button button-secondary" href="/account/services">{t("All services", "Todos los servicios")}</Link>
      </div>
    </section></div></main>
  );
}
