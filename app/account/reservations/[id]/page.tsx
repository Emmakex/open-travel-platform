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
  searchParams: Promise<{ updated?: string }>;
}) {
  const locale = await getLocale();
  const copy = getAccountCopy(locale).reservations;
  const generalCopy = getDictionary(locale);
  const identity = await requireCustomerIdentity();
  const { id } = await params;
  const { updated } = await searchParams;
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

          <dl className={styles.profileList}>
            <div><dt>{copy.status}</dt><dd>{status}</dd></div>
            <div><dt>{locale === "es" ? "Estado del pago" : "Payment status"}</dt><dd>{paymentStatusLabel(paymentSummary.status, locale)}</dd></div>
            <div><dt>{generalCopy.booking.travellers}</dt><dd>{reservation.partySize}</dd></div>
            <div><dt>{copy.unitPrice}</dt><dd>{formatCurrency(reservation.unitPrice, reservation.currency, locale)}</dd></div>
            <div><dt>{copy.total}</dt><dd>{formatCurrency(reservation.totalPrice, reservation.currency, locale)}</dd></div>
            <div><dt>{copy.departure}</dt><dd>{departureDate ? formatDate(departureDate, locale) : copy.unavailable}</dd></div>
            <div><dt>{copy.return}</dt><dd>{returnDate ? formatDate(returnDate, locale) : copy.unavailable}</dd></div>
            <div><dt>{copy.reference}</dt><dd>{reservation.id}</dd></div>
          </dl>

          {reservation.status === "pending" && bookingConfig.writesEnabled ? (
            <form action={cancelReservationAction}>
              <input type="hidden" name="reservationId" value={reservation.id} />
              <button className="button button-secondary" type="submit">{copy.cancel}</button>
            </form>
          ) : null}

          <p><Link className="text-link" href="/account/reservations">{copy.all}</Link></p>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{locale === "es" ? "Pagos" : "Payments"}</div>
          <h2>{locale === "es" ? "Resumen de pago" : "Payment summary"}</h2>
          <p className={styles.lead}>
            {locale === "es"
              ? "Consulta los importes registrados para esta reserva. Los pagos online se incorporarán sobre esta misma capa de pagos."
              : "Review the amounts recorded for this reservation. Online payments will use this same payment layer."}
          </p>

          <dl className={styles.profileList}>
            <div><dt>{locale === "es" ? "Estado" : "Status"}</dt><dd>{paymentStatusLabel(paymentSummary.status, locale)}</dd></div>
            <div><dt>{locale === "es" ? "Total de la reserva" : "Reservation total"}</dt><dd>{formatMoney(paymentSummary.totalAmount, paymentSummary.currency, locale)}</dd></div>
            <div><dt>{locale === "es" ? "Pagado" : "Paid"}</dt><dd>{formatMoney(paymentSummary.paidAmount, paymentSummary.currency, locale)}</dd></div>
            <div><dt>{locale === "es" ? "Reembolsado" : "Refunded"}</dt><dd>{formatMoney(paymentSummary.refundedAmount, paymentSummary.currency, locale)}</dd></div>
            <div><dt>{locale === "es" ? "Pendiente" : "Outstanding"}</dt><dd>{formatMoney(paymentSummary.outstandingAmount, paymentSummary.currency, locale)}</dd></div>
          </dl>

          <h3>{locale === "es" ? "Movimientos" : "Transactions"}</h3>
          {paymentTransactions.length ? (
            <div className={styles.profileList}>
              {paymentTransactions.map((transaction) => (
                <div key={transaction.id}>
                  <dt>
                    {paymentTransactionTypeLabel(transaction.type, locale)} · {formatDateTime(transaction.createdAt, locale)}
                  </dt>
                  <dd>
                    {formatMoney(transaction.amount, transaction.currency, locale)} · {paymentMethodLabel(transaction.method, locale)}
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
