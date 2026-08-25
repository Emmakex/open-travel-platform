import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorDate, formatOperatorMoney, reservationStatusLabel, tr } from "@/lib/operator-i18n";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireStaffCapability } from "@/lib/require-staff-capability";
import { hasStaffCapability } from "@/lib/staff-capabilities";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "Documents | Kairoseth Travel",
  description: "Protected booking documents workspace."
};

export default async function OperatorDocumentsPage() {
  const locale = await getLocale();
  const identity = await requireStaffCapability("reservations");
  const canFinance = hasStaffCapability(identity, "finance");
  const [reservations, trips] = await Promise.all([
    getOperationsRepository().listReservations(),
    getTravelRepository().listTrips()
  ]);
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Documents", "Documentos")}</div>
          <h1>{tr(locale, "Booking confirmations", "Confirmaciones de reserva")}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "Generate a customer-facing PDF from the current reservation snapshot. The document includes travellers, accommodation and package supplements without exposing internal notes, supplier costs or protected post-purchase traveller data.",
            "Genera un PDF para el cliente a partir del snapshot actual de la reserva. El documento incluye viajeros, alojamiento y suplementos del paquete sin exponer notas internas, costes de proveedor ni datos post-compra protegidos de viajeros."
          )}</p>
          <div className={styles.notice}>
            {canFinance
              ? tr(locale, "Your Finance permission allows the generated PDF to include payment status, paid amount and outstanding balance.", "Tu permiso de Finanzas permite que el PDF generado incluya estado de pago, importe pagado y saldo pendiente.")
              : tr(locale, "Financial payment details are omitted because this account does not have Finance permission.", "Los detalles financieros de pago se omiten porque esta cuenta no tiene permiso de Finanzas.")}
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Reservation documents", "Documentos de reserva")}</div>
          <h2>{tr(locale, "Available confirmations", "Confirmaciones disponibles")}</h2>
          {reservations.length ? (
            <div className={styles.managementList}>
              {reservations.map((reservation) => {
                const trip = tripById.get(reservation.tripId);
                return (
                  <div className={styles.managementRow} key={reservation.id}>
                    <span>
                      <strong>{trip?.title ?? reservation.tripTitle ?? reservation.tripId}</strong>
                      <span>
                        {reservation.id} · {reservation.departureDate ? formatOperatorDate(`${reservation.departureDate}T12:00:00Z`, locale) : "—"} · {reservationStatusLabel(reservation.status, locale)} · {formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}
                      </span>
                    </span>
                    <a className="button button-secondary" href={`/operator/reservations/${encodeURIComponent(reservation.id)}/confirmation`}>
                      {tr(locale, "Download PDF", "Descargar PDF")}
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.notice}>{tr(locale, "No trip reservations are available yet.", "Todavía no hay reservas de viaje disponibles.")}</div>
          )}
        </section>

        <div className={styles.toolbar}>
          <Link className="button button-secondary" href="/operator/reservations">{tr(locale, "Reservation queue", "Cola de reservas")}</Link>
          <Link className="button button-secondary" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link>
        </div>
      </div>
    </main>
  );
}
