import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelReservationAction } from "@/app/reservations/actions";
import styles from "@/app/account/account.module.css";
import { getAccountCopy } from "@/lib/account-i18n";
import { bookingConfig } from "@/lib/booking-config";
import { getBookingRepository } from "@/lib/booking-repository";
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
import { getTravelRepository } from "@/lib/travel-repository";
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
  const [trips, availability, paymentSummary, paymentTransactions] = await Promise.all([
    travelRepository.listTrips(),
    bookingRepository.listAvailability(reservation.tripId),
    paymentRepository.getSummary(reservation),
    paymentRepository.listTransactions(reservation.id)
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
      ? "Esta reserva está almacenada de forma persistente en Kairoseth Travel."
      : "This reservation is stored persistently in Kairoseth Travel."
    : copy.demoNote;
  const paymentSchedule = deriveReservationPaymentSchedule(reservation, paymentSummary);
  const canCustomerCancel = reservation.status === "pending" &&
    bookingConfig.writesEnabled &&
    paymentSummary.netPaidAmount <= 0 &&
    paymentSummary.pendingPaymentAmount <= 0;
  const canPayOnline = reservation.status !== "cancelled" &&
    paymentSchedule.nextPaymentAmount > 0 &&
    paymentSummary.pendingPaymentAmount <= 0;

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

          {canCustomerCancel ? (
            <form action={cancelReservationAction}>
              <input type="hidden" name="reservationId" value={reservation.id} />
              <button className="button button-secondary" type="submit">{copy.cancel}</button>
            </form>
          ) : null}

          <p><Link className="text-link" href="/account/reservations">{copy.all}</Link></p>
        </section>

        {reservation.travellers?.length ? (
          <section className={styles.panel} style={{ marginTop: "1rem" }}>
            <div className="eyebrow">{locale === "es" ? "Viajeros" : "Travellers"}</div>
            <h2>{locale === "es" ? "Pasajeros de la reserva" : "Reservation travellers"}</h2>
            <p className={styles.lead}>
              {locale === "es"
                ? "Las edades y tarifas quedan fijadas con referencia a la fecha de salida de esta reserva."
                : "Traveller ages and fares are snapshotted against this reservation's departure date."}
            </p>
            <dl className={styles.profileList}>
              {reservation.travellers.map((traveller) => {
                const guardian = traveller.guardianTravellerId
                  ? reservation.travellers?.find((item) => item.id === traveller.guardianTravellerId)
                  : null;
                return (
                  <div key={traveller.id}>
                    <dt>
                      {traveller.firstName} {traveller.lastName}{traveller.isLead ? ` · ${locale === "es" ? "principal" : "lead"}` : ""}
                    </dt>
                    <dd>
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
          <div className="eyebrow">{locale === "es" ? "Pagos" : "Payments"}</div>
          <h2>{locale === "es" ? "Resumen de pago" : "Payment summary"}</h2>
          <p className={styles.lead}>
            {locale === "es"
              ? "Los pagos manuales y online se registran en la misma capa de pagos para mantener un único saldo de la reserva."
              : "Manual and online payments use the same payment ledger so the reservation always has one authoritative balance."}
          </p>

          <dl className={styles.profileList}>
            <div><dt>{locale === "es" ? "Estado" : "Status"}</dt><dd>{paymentStatusLabel(paymentSummary.status, locale)}</dd></div>
            <div><dt>{locale === "es" ? "Total de la reserva" : "Reservation total"}</dt><dd>{formatMoney(paymentSummary.totalAmount, paymentSummary.currency, locale)}</dd></div>
            <div><dt>{locale === "es" ? "Pagado" : "Paid"}</dt><dd>{formatMoney(paymentSummary.paidAmount, paymentSummary.currency, locale)}</dd></div>
            <div><dt>{locale === "es" ? "Reembolsado" : "Refunded"}</dt><dd>{formatMoney(paymentSummary.refundedAmount, paymentSummary.currency, locale)}</dd></div>
            <div><dt>{locale === "es" ? "Pendiente total" : "Total outstanding"}</dt><dd>{formatMoney(paymentSummary.outstandingAmount, paymentSummary.currency, locale)}</dd></div>
          </dl>

          <h3>{locale === "es" ? "Calendario de pagos" : "Payment schedule"}</h3>
          {paymentSchedule.outdated ? (
            <div className={styles.notice}>
              {locale === "es"
                ? "Las condiciones de pago necesitan ser revisadas por el equipo. Mientras tanto se muestra el saldo completo pendiente."
                : "The payment terms need staff review. Until then the full outstanding balance is shown."}
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
