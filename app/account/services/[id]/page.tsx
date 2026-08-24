import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelServiceReservationAction } from "@/app/service-reservations/actions";
import styles from "@/app/account/account.module.css";
import { evaluateServiceReservationPolicy } from "@/lib/change-policy";
import { getLocale } from "@/lib/get-locale";
import { formatCurrency } from "@/lib/i18n";
import {
  paymentMethodLabel,
  paymentStatusLabel,
  paymentTransactionTypeLabel
} from "@/lib/payment-i18n";
import { getPaymentRepository } from "@/lib/payment-repository";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { getServiceReservationForCustomer } from "@/lib/service-reservations";
import { buildTravellerDataCompletion, listTravellerDataForCustomer } from "@/lib/traveller-data";

function formatDate(value: string, locale: "en" | "es") {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatDateTime(value: string, locale: "en" | "es") {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatMoney(value: number, currency: string, locale: "en" | "es") {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
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
  const policy = evaluateServiceReservationPolicy(reservation);
  const paymentRepository = getPaymentRepository();
  const [paymentSummary, paymentTransactions] = await Promise.all([
    paymentRepository.getTargetSummary({
      id: reservation.id,
      totalPrice: reservation.totalPrice,
      currency: reservation.currency,
      targetType: "service"
    }),
    paymentRepository.listTransactions(reservation.id)
  ]);
  const canCustomerCancel = reservation.status === "pending" &&
    policy.customerCancellationAllowed &&
    paymentSummary.netPaidAmount <= 0 &&
    paymentSummary.pendingPaymentAmount <= 0;
  const canPayOnline = reservation.status !== "cancelled" &&
    paymentSummary.outstandingAmount > 0 &&
    paymentSummary.pendingPaymentAmount <= 0;
  const travellerRequirementsActive = Boolean(
    reservation.travellerRequirements &&
    reservation.travellerRequirements.preset !== "none" &&
    reservation.travellers.length
  );
  const storedTravellerData = travellerRequirementsActive
    ? await listTravellerDataForCustomer({
        identityId: identity.id,
        targetType: "service",
        reservationId: reservation.id
      })
    : new Map();
  const travellerDataCompletion = travellerRequirementsActive
    ? reservation.travellers.map((traveller) =>
        buildTravellerDataCompletion(
          reservation.travellerRequirements,
          traveller,
          storedTravellerData.get(traveller.id)
        )
      )
    : [];
  const travellerDataCompletedCount = travellerDataCompletion.filter((item) => item.complete).length;
  const travellerDataComplete = travellerRequirementsActive &&
    travellerDataCompletion.length === reservation.travellers.length &&
    travellerDataCompletedCount === reservation.travellers.length;

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{t("Service reservation", "Reserva de servicio")}</div>
          <h1>{reservation.serviceTitle}</h1>
          {query.created === "1" ? <div className={styles.notice}>{t("Your service reservation has been created.", "Tu reserva del servicio se ha creado correctamente.")}</div> : null}
          {query.updated === "cancelled" ? <div className={styles.notice}>{t("The reservation was cancelled successfully.", "La reserva se canceló correctamente.")}</div> : null}
          {query.error === "not-cancellable" ? <div className={styles.notice}>{t("This reservation can no longer be cancelled from your account.", "Esta reserva ya no puede cancelarse desde tu cuenta.")}</div> : null}
          {query.error === "cancellation-policy" ? <div className={styles.notice}>{t("The self-service cancellation period for this reservation has ended. Contact the travel team if you need help.", "El plazo de cancelación directa de esta reserva ha finalizado. Contacta con el equipo de viajes si necesitas ayuda.")}</div> : null}
          {query.error === "payment-active" ? <div className={styles.notice}>{t("This reservation has a completed or pending payment. Manage the payment or refund before cancelling it.", "La reserva tiene un pago realizado o pendiente. Gestiona primero el pago o el reembolso antes de cancelarla.")}</div> : null}

          <dl className={styles.profileList}>
            <div><dt>{t("Status", "Estado")}</dt><dd>{reservation.status === "pending" ? t("Pending", "Pendiente") : reservation.status === "confirmed" ? t("Confirmed", "Confirmada") : t("Cancelled", "Cancelada")}</dd></div>
            <div><dt>{t("Payment status", "Estado del pago")}</dt><dd>{paymentStatusLabel(paymentSummary.status, locale)}</dd></div>
            <div><dt>{t("Type", "Tipo")}</dt><dd>{reservation.serviceType === "activity" ? t("Activity", "Actividad") : reservation.serviceType === "transport" ? t("Transport", "Transporte") : t("Travel protection", "Protección de viaje")}</dd></div>
            {reservation.serviceDate ? <div><dt>{t("Date", "Fecha")}</dt><dd>{formatDate(reservation.serviceDate, locale)} · {reservation.startTime}{reservation.endTime ? `–${reservation.endTime}` : ""}</dd></div> : null}
            {reservation.insuranceTrip ? <><div><dt>{t("Destination", "Destino")}</dt><dd>{reservation.insuranceTrip.destination}</dd></div><div><dt>{t("Trip dates", "Fechas del viaje")}</dt><dd>{formatDate(reservation.insuranceTrip.startDate, locale)} → {formatDate(reservation.insuranceTrip.endDate, locale)}</dd></div></> : null}
            <div><dt>{t("Travellers", "Viajeros")}</dt><dd>{reservation.partySize}</dd></div>
            <div><dt>Total</dt><dd>{formatCurrency(reservation.totalPrice, reservation.currency, locale)}</dd></div>
            <div><dt>{t("Reference", "Referencia")}</dt><dd>{reservation.id}</dd></div>
            {reservation.relatedReservationId ? <div><dt>{t("Linked trip", "Viaje vinculado")}</dt><dd><Link className="text-link" href={`/account/reservations/${reservation.relatedReservationId}`}>{reservation.relatedReservationId}</Link></dd></div> : null}
          </dl>

          {reservation.status === "pending" && !policy.customerCancellationAllowed ? (
            <div className={styles.notice}>
              <strong>{t("Self-service cancellation closed", "Cancelación directa cerrada")}</strong><br />
              {t("The cancellation period saved with this reservation has ended. Contact the travel team if you need to request a change.", "El plazo de cancelación guardado con esta reserva ha finalizado. Contacta con el equipo de viajes si necesitas solicitar un cambio.")}
            </div>
          ) : null}

          {travellerRequirementsActive ? (
            <div className={styles.notice}>
              <strong>
                {travellerDataComplete
                  ? t("✓ Traveller information complete", "✓ Datos de viajeros completos")
                  : t("Action required · traveller information", "Acción pendiente · datos de viajeros")}
              </strong><br />
              {travellerDataComplete
                ? t(
                    "All required traveller information has been completed for this service. You can review it while customer editing remains open.",
                    "Ya se ha completado la información necesaria para todos los viajeros de este servicio. Puedes revisarla mientras el plazo de edición siga abierto."
                  )
                : t(
                    `${travellerDataCompletedCount}/${reservation.travellers.length} travellers complete. Finish the pending details required to manage this service.`,
                    `${travellerDataCompletedCount}/${reservation.travellers.length} viajeros completos. Completa los datos pendientes necesarios para gestionar este servicio.`
                  )}
            </div>
          ) : null}

          <h2>{t("Travellers", "Viajeros")}</h2>
          <dl className={styles.profileList}>
            {reservation.travellers.map((traveller) => {
              const completion = travellerDataCompletion.find((item) => item.travellerId === traveller.id);
              return (
                <div key={traveller.id}>
                  <dt>{traveller.firstName} {traveller.lastName}{traveller.isLead ? ` · ${t("lead", "principal")}` : ""}</dt>
                  <dd>
                    {travellerRequirementsActive ? <><strong>{t("Additional details", "Datos adicionales")}: {completion?.complete ? t("complete", "completos") : t("pending", "pendientes")}</strong><br /></> : null}
                    {traveller.ageAtDeparture} {t("years", "años")} · {locale === "es" ? traveller.pricingLabelEs || traveller.pricingLabel : traveller.pricingLabel} · {formatCurrency(traveller.unitPrice, reservation.currency, locale)}
                  </dd>
                </div>
              );
            })}
          </dl>

          <div className={styles.actions}>
            {travellerRequirementsActive ? (
              <Link className={travellerDataComplete ? "button button-secondary" : "button button-primary"} href={`/account/traveller-data/service/${encodeURIComponent(reservation.id)}`}>
                {travellerDataComplete
                  ? t("Review traveller information", "Revisar datos de viajeros")
                  : t("Complete traveller information", "Completar datos de viajeros")}
              </Link>
            ) : null}
            {canCustomerCancel ? <form action={cancelServiceReservationAction}><input type="hidden" name="reservationId" value={reservation.id} /><button className="button button-secondary" type="submit">{t("Cancel reservation", "Cancelar reserva")}</button></form> : null}
            <Link className="button button-secondary" href={`/${reservation.serviceType === "activity" ? "activities" : reservation.serviceType}/${reservation.serviceSlug}`}>{t("View service", "Ver servicio")}</Link>
            <Link className="button button-secondary" href="/account/services">{t("All services", "Todos los servicios")}</Link>
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{t("Payments", "Pagos")}</div>
          <h2>{t("Payment summary", "Resumen de pago")}</h2>
          <p className={styles.lead}>
            {t(
              "See what you have paid and what remains outstanding for this service reservation.",
              "Consulta cuánto has pagado y qué importe queda pendiente en esta reserva de servicio."
            )}
          </p>

          <dl className={styles.profileList}>
            <div><dt>{t("Status", "Estado")}</dt><dd>{paymentStatusLabel(paymentSummary.status, locale)}</dd></div>
            <div><dt>{t("Reservation total", "Total de la reserva")}</dt><dd>{formatMoney(paymentSummary.totalAmount, paymentSummary.currency, locale)}</dd></div>
            <div><dt>{t("Paid", "Pagado")}</dt><dd>{formatMoney(paymentSummary.paidAmount, paymentSummary.currency, locale)}</dd></div>
            <div><dt>{t("Refunded", "Reembolsado")}</dt><dd>{formatMoney(paymentSummary.refundedAmount, paymentSummary.currency, locale)}</dd></div>
            <div><dt>{t("Outstanding", "Pendiente")}</dt><dd>{formatMoney(paymentSummary.outstandingAmount, paymentSummary.currency, locale)}</dd></div>
          </dl>

          {paymentSummary.pendingPaymentAmount > 0 ? (
            <div className={styles.notice}>
              {t(
                "An online payment is awaiting confirmation. Do not repeat the payment until the provider confirms or rejects it.",
                "Hay un pago online pendiente de confirmación. No repitas el pago hasta que la pasarela confirme o rechace la operación."
              )}
            </div>
          ) : canPayOnline ? (
            <div className={styles.actions}>
              <Link className="button button-primary" href={`/account/checkout/service/${encodeURIComponent(reservation.id)}`}>
                {t("Pay now", "Pagar ahora")}
              </Link>
            </div>
          ) : null}

          <h3>{t("Transactions", "Movimientos")}</h3>
          {paymentTransactions.length ? (
            <dl className={styles.profileList}>
              {paymentTransactions.map((transaction) => (
                <div key={transaction.id}>
                  <dt>{paymentTransactionTypeLabel(transaction.type, locale)} · {formatDateTime(transaction.createdAt, locale)}</dt>
                  <dd>{formatMoney(transaction.amount, transaction.currency, locale)} · {paymentMethodLabel(transaction.method, locale)} · {transaction.provider}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className={styles.notice}>{t("No payments have been recorded for this service reservation yet.", "Todavía no hay pagos registrados para esta reserva de servicio.")}</div>
          )}
        </section>
      </div>
    </main>
  );
}
