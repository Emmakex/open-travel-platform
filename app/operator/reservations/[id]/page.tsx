import Link from "next/link";
import { notFound } from "next/navigation";
import { updateReservationStatusAction } from "@/app/operator/actions";
import styles from "@/app/operator/operator.module.css";
import { ReservationPaymentPanel } from "@/components/operator/reservation-payment-panel";
import { ReservationTravellers } from "@/components/operator/reservation-travellers";
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
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "Reservation | Kairoseth Travel",
  description: "Protected Kairoseth Travel reservation detail."
};

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
  }>;
}) {
  const locale = await getLocale();
  const staff = await requireOperationsIdentity();
  const { id } = await params;
  const { updated, error, paymentUpdated, paymentError } = await searchParams;
  const operations = getOperationsRepository();
  const [reservation, trips, audit] = await Promise.all([
    operations.getReservation(id),
    getTravelRepository().listTrips(),
    operations.listAuditEvents()
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
    "operations-disabled": tr(locale, "Operational writes are disabled in this deployment.", "Los cambios operativos están desactivados en este despliegue."),
    "invalid-request": tr(locale, "The requested status change is invalid.", "El cambio de estado solicitado no es válido."),
    "invalid-transition": tr(locale, "That reservation status transition is not allowed.", "Ese cambio de estado de la reserva no está permitido.")
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
              {tr(locale, "can review and manage this persistent reservation.", "puede revisar y gestionar esta reserva persistente.")}
            </p>

            {updated ? (
              <div className={styles.notice}>
                {tr(locale, "Reservation status updated to", "Estado de la reserva actualizado a")} {reservationStatusLabel(updated, locale)}.
              </div>
            ) : null}
            {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}

            <dl className={styles.definitionList}>
              <div><dt>{tr(locale, "Status", "Estado")}</dt><dd><span className={styles.badge}>{reservationStatusLabel(reservation.status, locale)}</span></dd></div>
              <div><dt>{tr(locale, "Payment", "Pago")}</dt><dd><span className={styles.badge}>{paymentStatusLabel(paymentSummary.status, locale)}</span></dd></div>
              <div><dt>{tr(locale, "Customer ID", "ID de cliente")}</dt><dd>{reservation.identityId}</dd></div>
              <div><dt>{tr(locale, "Travellers", "Viajeros")}</dt><dd>{reservation.partySize}</dd></div>
              <div><dt>{tr(locale, "Inventory spaces", "Plazas de inventario")}</dt><dd>{reservation.inventorySpaces ?? reservation.partySize}</dd></div>
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
          </aside>
        </div>

        <ReservationTravellers reservation={reservation} locale={locale} />

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
