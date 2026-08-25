import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { groupReservationsByDeparture } from "@/lib/departure-manifests";
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
  const departures = groupReservationsByDeparture(reservations);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Documents", "Documentos")}</div>
          <h1>{tr(locale, "Travel documents", "Documentos de viaje")}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "Generate private booking confirmations and departure-level operational documents from the current reservation snapshots.",
            "Genera confirmaciones privadas de reserva y documentos operativos por salida a partir de los snapshots actuales de las reservas."
          )}</p>
          <div className={styles.notice}>
            {tr(
              locale,
              "Traveller and rooming lists use only basic booking data. Protected post-purchase traveller data, internal notes and supplier information are not exported in these documents.",
              "Las listas de viajeros y rooming lists utilizan únicamente datos básicos de reserva. Los datos post-compra protegidos, notas internas e información de proveedores no se exportan en estos documentos."
            )}
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Departure documents", "Documentos por salida")}</div>
          <h2>{tr(locale, "Traveller and rooming lists", "Listas de viajeros y rooming lists")}</h2>
          <p className={styles.lead}>{tr(
            locale,
            "Each row groups all non-cancelled reservations for the same trip departure. The rooming list follows the room allocations stored in each reservation snapshot.",
            "Cada fila agrupa todas las reservas no canceladas de una misma salida. El rooming list respeta la distribución de habitaciones guardada en cada snapshot de reserva."
          )}</p>
          {departures.length ? (
            <div className={styles.managementList}>
              {departures.map((departure) => {
                const trip = tripById.get(departure.tripId);
                const base = `/operator/documents/departures/${encodeURIComponent(departure.tripId)}/${encodeURIComponent(departure.availabilityId)}`;
                return (
                  <div className={styles.managementRow} key={departure.key}>
                    <span>
                      <strong>{trip?.title ?? departure.tripTitle}</strong>
                      <span>
                        {departure.departureDate ? formatOperatorDate(`${departure.departureDate}T12:00:00Z`, locale) : "—"}
                        {departure.returnDate ? ` → ${formatOperatorDate(`${departure.returnDate}T12:00:00Z`, locale)}` : ""}
                      </span>
                    </span>
                    <span>
                      {departure.reservationCount} {tr(locale, "bookings", "reservas")} · {departure.travellerCount} {tr(locale, "travellers", "viajeros")}
                    </span>
                    <a className="button button-secondary" href={`${base}/travellers`}>
                      {tr(locale, "Traveller list", "Lista de viajeros")}
                    </a>
                    <a className="button button-secondary" href={`${base}/rooming-list`}>
                      Rooming list
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.notice}>{tr(locale, "No active trip departures have reservations yet.", "Todavía no hay salidas activas con reservas.")}</div>
          )}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Reservation documents", "Documentos de reserva")}</div>
          <h2>{tr(locale, "Booking confirmations", "Confirmaciones de reserva")}</h2>
          <div className={styles.notice}>
            {canFinance
              ? tr(locale, "Your Finance permission allows confirmation PDFs to include payment status, paid amount and outstanding balance.", "Tu permiso de Finanzas permite que las confirmaciones PDF incluyan estado de pago, importe pagado y saldo pendiente.")
              : tr(locale, "Financial payment details are omitted from confirmation PDFs because this account does not have Finance permission.", "Los detalles financieros se omiten de las confirmaciones PDF porque esta cuenta no tiene permiso de Finanzas.")}
          </div>
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
                      {tr(locale, "Download confirmation", "Descargar confirmación")}
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
