import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelReservationAction } from "@/app/reservations/actions";
import styles from "@/app/account/account.module.css";
import { getAccountCopy } from "@/lib/account-i18n";
import { bookingConfig } from "@/lib/booking-config";
import { getBookingRepository } from "@/lib/booking-repository";
import { evaluateTripReservationPolicy } from "@/lib/change-policy";
import { getLocale } from "@/lib/get-locale";
import { formatCurrency, getDictionary, localizeTrip } from "@/lib/i18n";
import {
  paymentMethodLabel,
  paymentStatusLabel,
  paymentTransactionTypeLabel
} from "@/lib/payment-i18n";
import { getPaymentRepository } from "@/lib/payment-repository";
import { deriveReservationPaymentSchedule } from "@/lib/payment-terms";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { listServiceReservationsForRelatedTripForCustomer } from "@/lib/service-reservations";
import { getTravelRepository } from "@/lib/travel-repository";
import { buildTravellerDataCompletion, listTravellerDataForCustomer } from "@/lib/traveller-data";
import type { TravelLocale } from "@/domain/travel/types";

function formatDate(value: string, locale: TravelLocale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value: string, locale: TravelLocale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatMoney(value: number, currency: string, locale: TravelLocale) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export const metadata = {
  title: "Reservation detail",
  description: "Review a Kairoseth Travel reservation."
};

export default async function ReservationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const locale = await getLocale();
  const copy = getAccountCopy(locale).reservations;
  const generalCopy = getDictionary(locale);
  const identity = await requireCustomerIdentity();
  const { id } = await params;
  const { updated, error } = await searchParams;
  const bookingRepository = getBookingRepository();
  const reservation = await bookingRepository.getReservation(identity.id, id);

  if (!reservation) notFound();

  const travelRepository = getTravelRepository();
  const paymentRepository = getPaymentRepository();
  const [trips, availability, paymentSummary, paymentTransactions, linkedServices] = await Promise.all([
    travelRepository.listTrips(),
    bookingRepository.listAvailability(reservation.tripId),
    paymentRepository.getSummary(reservation),
    paymentRepository.listTransactions(reservation.id),
    listServiceReservationsForRelatedTripForCustomer(identity.id, reservation.id)
  ]);

  const trip = trips.find((item) => item.id === reservation.tripId);
  const localizedTrip = trip ? localizeTrip(trip, locale) : null;
  const departure = availability.find((item) => item.id === reservation.availabilityId);
  const departureDate = reservation.departureDate ?? departure?.departureDate;
  const returnDate = reservation.returnDate ?? departure?.returnDate;
  const status = locale === "es"
    ? reservation.status === "confirmed" ? "confirmada" : reservation.status === "cancelled" ? "cancelada" : "pendiente"
    : reservation.status;
  const persistenceNote = bookingConfig.mode === "mongodb"
    ? locale === "es"
      ? "Consulta aquí el estado actualizado de tu reserva, viajeros, pagos y próximos pasos."
      : "Review the latest status of your reservation, travellers, payments and next steps here."
    : copy.demoNote;
  const paymentSchedule = deriveReservationPaymentSchedule(reservation, paymentSummary);
  const changePolicy = evaluateTripReservationPolicy(reservation);
  const canCustomerCancel = reservation.status === "pending" &&
    bookingConfig.writesEnabled &&
    changePolicy.customerCancellationAllowed &&
    paymentSummary.netPaidAmount <= 0 &&
    paymentSummary.pendingPaymentAmount <= 0;
  const canPayOnline = reservation.status !== "cancelled" &&
    paymentSchedule.nextPaymentAmount > 0 &&
    paymentSummary.pendingPaymentAmount <= 0;
  const travellerRequirementsActive = Boolean(
    reservation.travellerRequirements &&
    reservation.travellerRequirements.preset !== "none" &&
    reservation.travellers?.length
  );
  const storedTravellerData = travellerRequirementsActive
    ? await listTravellerDataForCustomer({
        identityId: identity.id,
        targetType: "trip",
        reservationId: reservation.id
      })
    : new Map();
  const travellerDataCompletion = travellerRequirementsActive
    ? reservation.travellers!.map((traveller) =>
        buildTravellerDataCompletion(
          reservation.travellerRequirements,
          traveller,
          storedTravellerData.get(traveller.id)
        )
      )
    : [];
  const travellerDataCompletedCount = travellerDataCompletion.filter((item) => item.complete).length;
  const travellerDataComplete = travellerRequirementsActive &&
    travellerDataCompletion.length === reservation.travellers!.length &&
    travellerDataCompletedCount === reservation.travellers!.length;

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{copy.detailEyebrow}</div>
          <h1>{localizedTrip?.title ?? reservation.tripTitle ?? copy.detailEyebrow}</h1>
          <p className={styles.lead}>{persistenceNote}</p>

          {updated === "cancelled" ? (
            <div className={styles.notice}>{copy.cancelled}</div>
          ) : null}
          {error === "payment-active" ? (
            <div className={styles.notice}>
              {locale === "es"
                ? "La reserva tiene un pago realizado o pendiente. Gestiona primero el pago o el reembolso antes de cancelarla."
                : "This reservation has a completed or pending payment. Manage the payment or refund before cancelling it."}
            </div>
          ) : null}
          {error === "cancellation-policy" ? (
            <div className={styles.notice}>
              {locale === "es"
                ? "El plazo de cancelación directa de esta reserva ha finalizado. Contacta con el equipo de viajes si necesitas ayuda."
                : "The self-service cancellation period for this reservation has ended. Contact the travel team if you need help."}
            </div>
          ) : null}

          <dl className={styles.profileList}>
            <div><dt>{copy.status}</dt><dd>{status}</dd></div>
            <div><dt>{locale === "es" ? "Estado del pago" : "Payment status"}</dt><dd>{paymentStatusLabel(paymentSummary.status, locale)}</dd></div>
            <div><dt>{generalCopy.booking.travellers}</dt><dd>{reservation.partySize}</dd></div>
            {!reservation.travellers?.length ? <div><dt>{copy.unitPrice}</dt><dd>{formatCurrency(reservation.unitPrice, reservation.currency, locale)}</dd></div> : null}
            <div><dt>{copy.total}</dt><dd>{formatCurrency(reservation.totalPrice, reservation.currency, locale)}</dd></div>
            <div><dt>{copy.departure}</dt><dd>{departureDate ? formatDate(departureDate, locale) : copy.unavailable}</dd></div>
            <div><dt>{copy.return}</dt><dd>{returnDate ? formatDate(returnDate, locale) : copy.unavailable}</dd></div>
            <div><dt>{copy.reference}</dt><dd>{reservation.id}</dd></div>
          </dl>

          {reservation.status === "pending" && !changePolicy.customerCancellationAllowed ? (
            <div className={styles.notice}>
              <strong>{locale === "es" ? "Cancelación directa cerrada" : "Self-service cancellation closed"}</strong><br />
              {locale === "es"
                ? "Las condiciones guardadas con esta reserva ya no permiten cancelarla directamente desde Mi cuenta. Contacta con el equipo si necesitas solicitar un cambio."
                : "The conditions saved with this reservation no longer allow cancellation directly from My account. Contact the team if you need to request a change."}
            </div>
          ) : null}

          {travellerRequirementsActive ? (
            <div className={styles.notice}>
              <strong>
                {travellerDataComplete
                  ? (locale === "es" ? "✓ Datos de viajeros completos" : "✓ Traveller information complete")
                  : (locale === "es" ? "Acción pendiente · datos de viajeros" : "Action required · traveller information")}
              </strong><br />
              {travellerDataComplete
                ? (locale === "es"
                    ? "Ya has completado la información post-compra necesaria para todos los viajeros de esta reserva. Puedes revisarla mientras el plazo de edición siga abierto."
                    : "You have completed the required post-purchase information for every traveller in this reservation. You can review it while customer editing remains open.")
                : (locale === "es"
                    ? `${travellerDataCompletedCount}/${reservation.travellers!.length} viajeros completos. Completa los datos pendientes para que el equipo pueda gestionar correctamente la reserva.`
                    : `${travellerDataCompletedCount}/${reservation.travellers!.length} travellers complete. Finish the pending details so the team can manage the reservation correctly.`)}
            </div>
          ) : null}

          <div className={styles.actions}>
            {travellerRequirementsActive ? (
              <Link className={travellerDataComplete ? "button button-secondary" : "button button-primary"} href={`/account/traveller-data/trip/${encodeURIComponent(reservation.id)}`}>
                {travellerDataComplete
                  ? (locale === "es" ? "Revisar datos de viajeros" : "Review traveller information")
                  : (locale === "es" ? "Completar datos de viajeros" : "Complete traveller information")}
              </Link>
            ) : null}
            {canCustomerCancel ? (
              <form action={cancelReservationAction}>
                <input type="hidden" name="reservationId" value={reservation.id} />
                <button className="button button-secondary" type="submit">{copy.cancel}</button>
              </form>
            ) : null}
          </div>

          <p><Link className="text-link" href="/account/reservations">{copy.all}</Link></p>
        </section>

        {reservation.travellers?.length ? (
          <section className={styles.panel} style={{ marginTop: "1rem" }}>
            <div className="eyebrow">{locale === "es" ? "Viajeros" : "Travellers"}</div>
            <h2>{locale === "es" ? "Pasajeros de la reserva" : "Reservation travellers"}</h2>
            <p className={styles.lead}>
              {locale === "es"
                ? "Las edades y tarifas se calculan tomando como referencia la fecha de salida de esta reserva."
                : "Traveller ages and fares are calculated using this reservation's departure date."}
            </p>
            <dl className={styles.profileList}>
              {reservation.travellers.map((traveller) => {
                const guardian = traveller.guardianTravellerId
                  ? reservation.travellers?.find((item) => item.id === traveller.guardianTravellerId)
                  : null;
                const completion = travellerDataCompletion.find((item) => item.travellerId === traveller.id);
                return (
                  <div key={traveller.id}>
                    <dt>
                      {traveller.firstName} {traveller.lastName}{traveller.isLead ? ` · ${locale === "es" ? "principal" : "lead"}` : ""}
                    </dt>
                    <dd>
                      {travellerRequirementsActive ? (
                        <><strong>{locale === "es" ? "Datos adicionales" : "Additional details"}: {completion?.complete ? (locale === "es" ? "completos" : "complete") : (locale === "es" ? "pendientes" : "pending")}</strong><br /></>
                      ) : null}
                      {traveller.ageAtDeparture} {locale === "es" ? "años" : "years"} · {locale === "es" ? (traveller.pricingLabelEs || traveller.pricingLabel) : traveller.pricingLabel} · {formatCurrency(traveller.unitPrice, reservation.currency, locale)}<br />
                      {formatDate(traveller.dateOfBirth, locale)} · {traveller.nationality}
                      {guardian ? <><br />{locale === "es" ? "Adulto responsable" : "Responsible adult"}: {guardian.firstName} {guardian.lastName}</> : null}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ) : null}

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{locale === "es" ? "Servicios adicionales" : "Extras"}</div>
          <h2>{locale === "es" ? "Servicios vinculados" : "Linked services"}</h2>
          <p className={styles.lead}>
            {locale === "es"
              ? "Aquí aparecen las actividades, transportes y protecciones de viaje que has reservado vinculadas a este viaje. Cada servicio conserva sus propias fechas, pagos y condiciones."
              : "Activities, transport and travel protection booked for this trip appear here. Each service keeps its own dates, payments and conditions."}
          </p>
          {linkedServices.length ? (
            <div className={styles.profileList}>
              {linkedServices.map((service) => {
                const serviceDate = service.serviceDate || service.insuranceTrip?.startDate;
                const type = service.serviceType === "activity"
                  ? (locale === "es" ? "Actividad" : "Activity")
                  : service.serviceType === "transport"
                    ? (locale === "es" ? "Transporte" : "Transport")
                    : (locale === "es" ? "Protección de viaje" : "Travel protection");
                return (
                  <div key={service.id}>
                    <dt><Link className="text-link" href={`/account/services/${encodeURIComponent(service.id)}`}>{service.serviceTitle}</Link></dt>
                    <dd>
                      {type} · {service.status === "confirmed" ? (locale === "es" ? "Confirmado" : "Confirmed") : service.status === "cancelled" ? (locale === "es" ? "Cancelado" : "Cancelled") : (locale === "es" ? "Pendiente" : "Pending")}
                      {serviceDate ? ` · ${formatDate(serviceDate, locale)}` : ""}<br />
                      {formatMoney(service.totalPrice, service.currency, locale)}
                    </dd>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.notice}>{locale === "es" ? "Todavía no tienes servicios vinculados a este viaje." : "You do not have any services linked to this trip yet."}</div>
          )}
          <p><Link className="text-link" href="/services">{locale === "es" ? "Explorar servicios" : "Explore services"}</Link></p>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{locale === "es" ? "Pagos" : "Payments"}</div>
          <h2>{locale === "es" ? "Resumen de pago" : "Payment summary"}</h2>
          <p className={styles.lead}>
            {locale === "es"
              ? "Consulta cuánto has pagado, qué importe queda pendiente y los próximos vencimientos de esta reserva."
              : "See what you have paid, what remains outstanding and any upcoming due dates for this reservation."}
          </p>

          {paymentSummary.settlementStatus === "refund_review" ? (
            <div className={styles.notice}>
              <strong>{locale === "es" ? "Importe pendiente de revisión" : "Amount pending review"}</strong><br />
              {locale === "es"
                ? `Has pagado ${formatMoney(paymentSummary.overpaidAmount, paymentSummary.currency, locale)} por encima del total actual de la reserva. Nuestro equipo revisará el importe que corresponda devolver según las condiciones aplicables.`
                : `You have paid ${formatMoney(paymentSummary.overpaidAmount, paymentSummary.currency, locale)} above the current reservation total. Our team will review any refund due under the applicable booking conditions.`}
            </div>
          ) : paymentSummary.settlementStatus === "payment_due" ? (
            <div className={styles.notice}>
              <strong>{locale === "es" ? "Saldo pendiente" : "Outstanding balance"}</strong><br />
              {locale === "es"
                ? `Quedan ${formatMoney(paymentSummary.outstandingAmount, paymentSummary.currency, locale)} por pagar en esta reserva.`
                : `${formatMoney(paymentSummary.outstandingAmount, paymentSummary.currency, locale)} remains to be paid on this reservation.`}
            </div>
          ) : null}

          <dl className={styles.profileList}>
            <div><dt>{locale === "es" ? "Estado" : "Status"}</dt><dd>{paymentStatusLabel(paymentSummary.status, locale)}</dd></div>
            <div><dt>{locale === "es" ? "Total de la reserva" : "Reservation total"}</dt><dd>{formatMoney(paymentSummary.totalAmount, paymentSummary.currency, locale)}</dd></div>
            <div><dt>{locale === "es" ? "Pagado" : "Paid"}</dt><dd>{formatMoney(paymentSummary.paidAmount, paymentSummary.currency, locale)}</dd></div>
            <div><dt>{locale === "es" ? "Reembolsado" : "Refunded"}</dt><dd>{formatMoney(paymentSummary.refundedAmount, paymentSummary.currency, locale)}</dd></div>
            <div><dt>{locale === "es" ? "Pendiente total" : "Total outstanding"}</dt><dd>{formatMoney(paymentSummary.outstandingAmount, paymentSummary.currency, locale)}</dd></div>
            {paymentSummary.overpaidAmount > 0 ? (
              <div><dt>{locale === "es" ? "A revisar para devolución" : "To review for refund"}</dt><dd>{formatMoney(paymentSummary.overpaidAmount, paymentSummary.currency, locale)}</dd></div>
            ) : null}
          </dl>

          <h3>{locale === "es" ? "Calendario de pagos" : "Payment schedule"}</h3>
          {paymentSchedule.outdated ? (
            <div className={styles.notice}>
              {locale === "es"
                ? "Las condiciones de pago necesitan ser revisadas por el equipo porque el total actual de la reserva ha cambiado."
                : "The payment terms need staff review because the current reservation total has changed."}
            </div>
          ) : null}
          <div className={styles.profileList}>
            {paymentSchedule.installments.map((installment) => (
              <div key={installment.id}>
                <dt>{locale === "es" ? (installment.labelEs || installment.label) : installment.label}</dt>
                <dd>
                  {formatMoney(installment.amount, paymentSummary.currency, locale)}
                  {installment.dueDate ? ` · ${locale === "es" ? "vence" : "due"} ${formatDate(installment.dueDate, locale)}` : ""}
                  <br />
                  {installment.state === "paid"
                    ? (locale === "es" ? "Pagada" : "Paid")
                    : installment.state === "partially_paid"
                      ? (locale === "es" ? "Parcialmente pagada" : "Partially paid")
                      : installment.state === "overdue"
                        ? (locale === "es" ? "Vencida" : "Overdue")
                        : installment.state === "due"
                          ? (locale === "es" ? "Vence ahora" : "Due now")
                          : (locale === "es" ? "Próxima" : "Upcoming")}
                  {installment.outstandingAmount > 0 ? ` · ${locale === "es" ? "pendiente" : "remaining"} ${formatMoney(installment.outstandingAmount, paymentSummary.currency, locale)}` : ""}
                </dd>
              </div>
            ))}
          </div>

          {paymentSummary.pendingPaymentAmount > 0 ? (
            <div className={styles.notice}>
              {locale === "es"
                ? "Hay un pago online pendiente de confirmación. No repitas el pago hasta que la pasarela confirme o rechace la operación."
                : "An online payment is awaiting confirmation. Do not repeat the payment until the provider confirms or rejects it."}
            </div>
          ) : paymentSummary.pendingRefundAmount > 0 ? (
            <div className={styles.notice}>
              {locale === "es"
                ? "Hay un reembolso pendiente de confirmación. El estado se actualizará cuando la operación quede confirmada."
                : "A refund is awaiting confirmation. The status will update once the refund is confirmed."}
            </div>
          ) : canPayOnline ? (
            <div className={styles.actions}>
              <Link className="button button-primary" href={`/account/checkout/trip/${encodeURIComponent(reservation.id)}`}>
                {locale === "es"
                  ? `Pagar siguiente cuota · ${formatMoney(paymentSchedule.nextPaymentAmount, paymentSummary.currency, locale)}`
                  : `Pay next installment · ${formatMoney(paymentSchedule.nextPaymentAmount, paymentSummary.currency, locale)}`}
              </Link>
            </div>
          ) : null}

          <h3>{locale === "es" ? "Movimientos" : "Transactions"}</h3>
          {paymentTransactions.length ? (
            <div className={styles.profileList}>
              {paymentTransactions.map((transaction) => (
                <div key={transaction.id}>
                  <dt>
                    {paymentTransactionTypeLabel(transaction.type, locale)} · {formatDateTime(transaction.createdAt, locale)}
                  </dt>
                  <dd>
                    {formatMoney(transaction.amount, transaction.currency, locale)} · {paymentMethodLabel(transaction.method, locale)} · {transaction.provider}
                  </dd>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.notice}>
              {locale === "es" ? "Todavía no hay pagos registrados para esta reserva." : "No payments have been recorded for this reservation yet."}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
