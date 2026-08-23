import Link from "next/link";
import { endStaffSession } from "@/app/operator/actions";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import {
  formatOperatorMoney,
  reservationStatusLabel,
  staffRoleLabel,
  tr
} from "@/lib/operator-i18n";
import { operationsConfig } from "@/lib/operations-config";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { listServiceReservationsForOperator } from "@/lib/service-reservations";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "Operator | Kairoseth Travel",
  description: "Protected Kairoseth Travel operations dashboard."
};

export default async function OperatorPage() {
  const locale = await getLocale();
  const identity = await requireOperationsIdentity();
  const operations = getOperationsRepository();
  const [summary, reservations, audit, trips, serviceReservations] = await Promise.all([
    operations.getSummary(),
    operations.listReservations(),
    operations.listAuditEvents(),
    getTravelRepository().listTrips(),
    listServiceReservationsForOperator()
  ]);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Operations console", "Consola de operaciones")} · {staffRoleLabel(identity.role, locale)}</div>
          <h1>{identity.displayName}</h1>
          <p className={styles.lead}>{tr(locale, "Reservations, customers, payments, catalogue and audit history are managed through protected staff permissions.", "Las reservas, clientes, pagos, catálogo e historial de auditoría se gestionan mediante permisos protegidos del personal.")}</p>

          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{summary.total}</strong><span>{tr(locale, "Trip reservations", "Reservas de viaje")}</span></div>
            <div className={styles.metric}><strong>{summary.pending}</strong><span>{tr(locale, "Trip pending", "Viajes pendientes")}</span></div>
            <div className={styles.metric}><strong>{serviceReservations.length}</strong><span>{tr(locale, "Service reservations", "Reservas de servicios")}</span></div>
            <div className={styles.metric}><strong>{serviceReservations.filter((item) => item.status === "pending").length}</strong><span>{tr(locale, "Services pending", "Servicios pendientes")}</span></div>
          </div>

          {!operationsConfig.writesEnabled ? <div className={styles.notice}>{tr(locale, "Operations are read-only in this deployment. Enable an operations write adapter to change reservation status.", "Las operaciones están en modo de solo lectura en este despliegue. Activa un adaptador de escritura para cambiar estados de reserva.")}</div> : null}

          <div className={styles.actions}>
            <Link className="button button-primary" href="/operator/reservations">{tr(locale, "Trip reservations", "Reservas de viaje")}</Link>
            <Link className="button button-secondary" href="/operator/service-reservations">{tr(locale, "Service reservations", "Reservas de servicios")}</Link>
            <Link className="button button-secondary" href="/operator/customers">{tr(locale, "Customers", "Clientes")}</Link>
            <Link className="button button-secondary" href="/operator/payments">{tr(locale, "Payments", "Pagos")}</Link>
            <Link className="button button-secondary" href="/operator/catalogue">{tr(locale, "Catalogue", "Catálogo")}</Link>
            <Link className="button button-secondary" href="/operator/media">{tr(locale, "Media", "Multimedia")}</Link>
            <Link className="button button-secondary" href="/operator/security">{tr(locale, "Security", "Seguridad")}</Link>
            {identity.role === "admin" ? <Link className="button button-secondary" href="/operator/staff">{tr(locale, "Staff access", "Acceso del personal")}</Link> : null}
            <Link className="button button-secondary" href="/services">{tr(locale, "Public services", "Servicios públicos")}</Link>
            <form action={endStaffSession}><button className="button button-secondary" type="submit">{tr(locale, "Sign out", "Cerrar sesión")}</button></form>
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Recent trip reservations", "Reservas de viaje recientes")}</div>
          <h2>{tr(locale, "Trip queue", "Cola de viajes")}</h2>
          {reservations.length ? <div className={styles.list}>{reservations.slice(0, 5).map((reservation) => {
            const trip = trips.find((item) => item.id === reservation.tripId);
            return <Link className={styles.row} href={`/operator/reservations/${reservation.id}`} key={reservation.id}><strong>{trip?.title ?? reservation.tripTitle ?? reservation.tripId}</strong><span>{reservation.partySize} {tr(locale, "travellers", "viajeros")}</span><span className={styles.badge}>{reservationStatusLabel(reservation.status, locale)}</span><span>{formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</span></Link>;
          })}</div> : <div className={styles.notice}>{tr(locale, "No trip reservations have been created yet.", "Todavía no se han creado reservas de viaje.")}</div>}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Recent service reservations", "Reservas de servicios recientes")}</div>
          <h2>{tr(locale, "Services queue", "Cola de servicios")}</h2>
          {serviceReservations.length ? <div className={styles.list}>{serviceReservations.slice(0, 5).map((reservation) => <Link className={styles.row} href={`/operator/service-reservations/${reservation.id}`} key={reservation.id}><strong>{reservation.serviceTitle}</strong><span>{reservation.serviceType === "activity" ? tr(locale, "Activity", "Actividad") : reservation.serviceType === "transport" ? tr(locale, "Transport", "Transporte") : tr(locale, "Insurance", "Seguro")}</span><span className={styles.badge}>{reservation.status === "pending" ? tr(locale, "Pending", "Pendiente") : reservation.status === "confirmed" ? tr(locale, "Confirmed", "Confirmada") : tr(locale, "Cancelled", "Cancelada")}</span><span>{formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</span></Link>)}</div> : <div className={styles.notice}>{tr(locale, "No service reservations have been created yet.", "Todavía no se han creado reservas de servicios.")}</div>}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Audit trail", "Auditoría")}</div>
          <h2>{tr(locale, "Recent staff actions", "Acciones recientes del personal")}</h2>
          {audit.length ? <div className={styles.auditList}>{audit.slice(0, 5).map((event) => <div className={styles.auditItem} key={event.id}><strong>{staffRoleLabel(event.actorRole, locale)}</strong>{" "}{tr(locale, "changed reservation", "cambió la reserva")} {event.reservationId}{" "}{tr(locale, "from", "de")} {reservationStatusLabel(event.fromStatus, locale)} {tr(locale, "to", "a")} {reservationStatusLabel(event.toStatus, locale)}.</div>)}</div> : <p className={styles.muted}>{tr(locale, "No staff status changes have been recorded yet.", "Todavía no se han registrado cambios de estado realizados por el personal.")}</p>}
        </section>
      </div>
    </main>
  );
}
