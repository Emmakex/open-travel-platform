import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { groupReservationsByDeparture } from "@/lib/departure-manifests";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorDate, formatOperatorMoney, reservationStatusLabel, tr } from "@/lib/operator-i18n";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireStaffCapability } from "@/lib/require-staff-capability";
import { listServiceReservationsForOperator } from "@/lib/service-reservations";
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
  const [reservations, trips, serviceReservations] = await Promise.all([
    getOperationsRepository().listReservations(),
    getTravelRepository().listTrips(),
    listServiceReservationsForOperator()
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
            "Generate private confirmations, customer-safe vouchers, departure documents and internal reservation dossiers from current reservation snapshots.",
            "Genera confirmaciones privadas, vouchers seguros para cliente, documentos por salida y expedientes internos desde los snapshots actuales de las reservas."
          )}</p>
          <div className={styles.notice}>
            {tr(
              locale,
              "Customer vouchers never include supplier costs, internal notes or protected post-purchase traveller fields. Supplier references are included only after explicit approval of that exact reference in Supplier fulfilment.",
              "Los vouchers del cliente nunca incluyen costes de proveedor, notas internas ni campos post-compra protegidos del viajero. Las referencias de proveedor solo se incluyen tras aprobar explícitamente esa referencia exacta en Gestión de proveedores."
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
                    <span>{departure.reservationCount} {tr(locale, "bookings", "reservas")} · {departure.travellerCount} {tr(locale, "travellers", "viajeros")}</span>
                    <a className="button button-secondary" href={`${base}/travellers`}>{tr(locale, "Traveller list", "Lista de viajeros")}</a>
                    <a className="button button-secondary" href={`${base}/rooming-list`}>Rooming list</a>
                  </div>
                );
              })}
            </div>
          ) : <div className={styles.notice}>{tr(locale, "No active trip departures have reservations yet.", "Todavía no hay salidas activas con reservas.")}</div>}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Trip reservation documents", "Documentos de reservas de viaje")}</div>
          <h2>{tr(locale, "Confirmations, vouchers and dossiers", "Confirmaciones, vouchers y expedientes")}</h2>
          <div className={styles.notice}>
            {canFinance
              ? tr(locale, "Your Finance permission allows booking confirmations and internal dossiers to include payment summaries.", "Tu permiso de Finanzas permite que las confirmaciones y expedientes internos incluyan resúmenes de pago.")
              : tr(locale, "Financial payment details are omitted because this account does not have Finance permission.", "Los datos financieros se omiten porque esta cuenta no tiene permiso de Finanzas.")}
          </div>
          {reservations.length ? (
            <div className={styles.managementList}>
              {reservations.map((reservation) => {
                const trip = tripById.get(reservation.tripId);
                const base = `/operator/reservations/${encodeURIComponent(reservation.id)}`;
                const voucherAvailable = reservation.status === "confirmed" && Boolean(reservation.accommodationBookings?.length);
                return (
                  <div className={styles.managementRow} key={reservation.id}>
                    <span>
                      <strong>{trip?.title ?? reservation.tripTitle ?? reservation.tripId}</strong>
                      <span>{reservation.id} · {reservation.departureDate ? formatOperatorDate(`${reservation.departureDate}T12:00:00Z`, locale) : "—"} · {reservationStatusLabel(reservation.status, locale)} · {formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</span>
                    </span>
                    <a className="button button-secondary" href={`${base}/confirmation`}>{tr(locale, "Confirmation", "Confirmación")}</a>
                    {voucherAvailable ? <a className="button button-secondary" href={`${base}/accommodation-voucher`}>{tr(locale, "Accommodation voucher", "Voucher alojamiento")}</a> : null}
                    <a className="button button-secondary" href={`${base}/dossier`}>{tr(locale, "Operator dossier", "Expediente Operator")}</a>
                  </div>
                );
              })}
            </div>
          ) : <div className={styles.notice}>{tr(locale, "No trip reservations are available yet.", "Todavía no hay reservas de viaje disponibles.")}</div>}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Service documents", "Documentos de servicios")}</div>
          <h2>{tr(locale, "Independent service vouchers", "Vouchers de servicios independientes")}</h2>
          <p className={styles.lead}>{tr(
            locale,
            "Confirmed activities, transport and travel-protection reservations can generate a customer-safe service voucher.",
            "Las actividades, transportes y protecciones de viaje confirmadas pueden generar un voucher de servicio seguro para el cliente."
          )}</p>
          {serviceReservations.length ? (
            <div className={styles.managementList}>
              {serviceReservations.map((reservation) => (
                <div className={styles.managementRow} key={reservation.id}>
                  <span>
                    <strong>{reservation.serviceTitle}</strong>
                    <span>{reservation.id} · {reservation.serviceDate ? formatOperatorDate(`${reservation.serviceDate}T12:00:00Z`, locale) : "—"} · {reservationStatusLabel(reservation.status, locale)}</span>
                  </span>
                  {reservation.status === "confirmed" ? (
                    <a className="button button-secondary" href={`/operator/service-reservations/${encodeURIComponent(reservation.id)}/voucher`}>
                      {tr(locale, "Service voucher", "Voucher de servicio")}
                    </a>
                  ) : <span className={styles.badge}>{tr(locale, "Voucher available after confirmation", "Voucher disponible tras confirmar")}</span>}
                </div>
              ))}
            </div>
          ) : <div className={styles.notice}>{tr(locale, "No service reservations are available yet.", "Todavía no hay reservas de servicios disponibles.")}</div>}
        </section>

        <div className={styles.toolbar}>
          <Link className="button button-primary" href="/operator/reports">{tr(locale, "Reports and exports", "Informes y exportaciones")}</Link>
          <Link className="button button-secondary" href="/operator/reservations">{tr(locale, "Reservation queue", "Cola de reservas")}</Link>
          <Link className="button button-secondary" href="/operator/service-reservations">{tr(locale, "Service queue", "Cola de servicios")}</Link>
          <Link className="button button-secondary" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link>
        </div>
      </div>
    </main>
  );
}
