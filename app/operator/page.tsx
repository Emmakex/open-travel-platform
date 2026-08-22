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
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "Operator | Kairoseth Travel",
  description: "Protected Kairoseth Travel operations dashboard."
};

export default async function OperatorPage() {
  const locale = await getLocale();
  const identity = await requireOperationsIdentity();
  const operations = getOperationsRepository();
  const [summary, reservations, audit, trips] = await Promise.all([
    operations.getSummary(),
    operations.listReservations(),
    operations.listAuditEvents(),
    getTravelRepository().listTrips()
  ]);

  const persistentOperations = operationsConfig.mode === "mongodb";

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">
            {tr(locale, "Operations console", "Consola de operaciones")} · {staffRoleLabel(identity.role, locale)}
          </div>
          <h1>{identity.displayName}</h1>
          <p className={styles.lead}>
            {persistentOperations
              ? tr(
                  locale,
                  "Reservations, status changes and audit history are stored persistently in MongoDB and protected by staff permissions.",
                  "Las reservas, los cambios de estado y el historial de auditoría se almacenan de forma persistente en MongoDB y están protegidos por los permisos del personal."
                )
              : tr(
                  locale,
                  "Operations are available through the configured staff repository.",
                  "Las operaciones están disponibles mediante el repositorio de personal configurado."
                )}
          </p>

          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{summary.total}</strong><span>{tr(locale, "Total", "Total")}</span></div>
            <div className={styles.metric}><strong>{summary.pending}</strong><span>{tr(locale, "Pending", "Pendientes")}</span></div>
            <div className={styles.metric}><strong>{summary.confirmed}</strong><span>{tr(locale, "Confirmed", "Confirmadas")}</span></div>
            <div className={styles.metric}><strong>{summary.cancelled}</strong><span>{tr(locale, "Cancelled", "Canceladas")}</span></div>
          </div>

          {!operationsConfig.writesEnabled ? (
            <div className={styles.notice}>
              {tr(
                locale,
                "Operations are read-only in this deployment. Enable an operations write adapter to change reservation status.",
                "Las operaciones están en modo de solo lectura en este despliegue. Activa un adaptador de escritura para cambiar estados de reserva."
              )}
            </div>
          ) : null}

          <div className={styles.actions}>
            <Link className="button button-primary" href="/operator/reservations">{tr(locale, "Review reservations", "Revisar reservas")}</Link>
            <Link className="button button-secondary" href="/operator/customers">{tr(locale, "Customers", "Clientes")}</Link>
            <Link className="button button-secondary" href="/operator/payments">{tr(locale, "Payments", "Pagos")}</Link>
            <Link className="button button-secondary" href="/operator/catalogue">{tr(locale, "Catalogue", "Catálogo")}</Link>
            <Link className="button button-secondary" href="/operator/media">{tr(locale, "Media", "Multimedia")}</Link>
            <Link className="button button-secondary" href="/operator/security">{tr(locale, "Security", "Seguridad")}</Link>
            {identity.role === "admin" ? (
              <Link className="button button-secondary" href="/operator/staff">{tr(locale, "Staff access", "Acceso del personal")}</Link>
            ) : null}
            <Link className="button button-secondary" href="/trips">{tr(locale, "Public catalogue", "Catálogo público")}</Link>
            <form action={endStaffSession}>
              <button className="button button-secondary" type="submit">{tr(locale, "Sign out", "Cerrar sesión")}</button>
            </form>
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Recent reservations", "Reservas recientes")}</div>
          <h2>{tr(locale, "Operational queue", "Cola operativa")}</h2>
          {reservations.length ? (
            <div className={styles.list}>
              {reservations.slice(0, 5).map((reservation) => {
                const trip = trips.find((item) => item.id === reservation.tripId);
                return (
                  <Link className={styles.row} href={`/operator/reservations/${reservation.id}`} key={reservation.id}>
                    <strong>{trip?.title ?? reservation.tripTitle ?? reservation.tripId}</strong>
                    <span>{reservation.partySize} {tr(locale, "travellers", "viajeros")}</span>
                    <span className={styles.badge}>{reservationStatusLabel(reservation.status, locale)}</span>
                    <span>{formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.notice}>
              {tr(
                locale,
                "No reservations have been created yet.",
                "Todavía no se han creado reservas."
              )}
            </div>
          )}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Audit trail", "Auditoría")}</div>
          <h2>{tr(locale, "Recent staff actions", "Acciones recientes del personal")}</h2>
          {audit.length ? (
            <div className={styles.auditList}>
              {audit.slice(0, 5).map((event) => (
                <div className={styles.auditItem} key={event.id}>
                  <strong>{staffRoleLabel(event.actorRole, locale)}</strong>{" "}
                  {tr(locale, "changed reservation", "cambió la reserva")} {event.reservationId}{" "}
                  {tr(locale, "from", "de")} {reservationStatusLabel(event.fromStatus, locale)} {tr(locale, "to", "a")} {reservationStatusLabel(event.toStatus, locale)}.
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.muted}>{tr(locale, "No staff status changes have been recorded yet.", "Todavía no se han registrado cambios de estado realizados por el personal.")}</p>
          )}
        </section>
      </div>
    </main>
  );
}
