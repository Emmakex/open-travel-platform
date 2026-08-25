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
import { isOperationsTaskOpen, isOperationsTaskOverdue } from "@/lib/operations-task-rules";
import { listOperationsTasks } from "@/lib/operations-tasks";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { hasStaffCapability } from "@/lib/staff-capabilities";
import { listServiceReservationsForOperator } from "@/lib/service-reservations";
import { isSupplierFulfilmentOverdue } from "@/lib/supplier-fulfilment-rules";
import { listSupplierFulfilmentQueue } from "@/lib/supplier-fulfilment";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "Operator | Kairoseth Travel",
  description: "Protected Kairoseth Travel operations dashboard."
};

export default async function OperatorPage() {
  const locale = await getLocale();
  const identity = await requireOperationsIdentity();
  const canReservations = hasStaffCapability(identity, "reservations");
  const canCatalogue = hasStaffCapability(identity, "catalogue");
  const canFinance = hasStaffCapability(identity, "finance");
  const canTravellerData = hasStaffCapability(identity, "traveller-data");
  const canSuppliers = hasStaffCapability(identity, "suppliers");
  const canTasks = hasStaffCapability(identity, "tasks");
  const operations = getOperationsRepository();

  const [summary, reservations, audit, trips, serviceReservations, tasks, fulfilmentRows] = await Promise.all([
    canReservations ? operations.getSummary() : Promise.resolve(null),
    canReservations ? operations.listReservations() : Promise.resolve([]),
    canReservations ? operations.listAuditEvents() : Promise.resolve([]),
    canReservations ? getTravelRepository().listTrips() : Promise.resolve([]),
    canReservations ? listServiceReservationsForOperator() : Promise.resolve([]),
    canTasks ? listOperationsTasks() : Promise.resolve([]),
    canSuppliers ? listSupplierFulfilmentQueue() : Promise.resolve([])
  ]);
  const openTasks = tasks.filter(isOperationsTaskOpen);
  const overdueTasks = openTasks.filter((task) => isOperationsTaskOverdue(task));
  const myTasks = openTasks.filter((task) => task.assigneeStaffId === identity.id);
  const activeFulfilment = fulfilmentRows.filter((row) => (row.item?.status ?? "not-requested") !== "cancelled");
  const requestedFulfilment = activeFulfilment.filter((row) => row.item?.status === "requested");
  const attentionFulfilment = activeFulfilment.filter((row) => row.item?.status === "rejected" || (row.item ? isSupplierFulfilmentOverdue(row.item) : false));

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Operations console", "Consola de operaciones")} · {staffRoleLabel(identity.role, locale)}</div>
          <h1>{identity.displayName}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "Your console only loads and shows the operational areas granted to this staff account.",
            "Tu consola solo carga y muestra las áreas operativas concedidas a esta cuenta de personal."
          )}</p>

          {(canReservations || canTasks || canSuppliers) ? <div className={styles.metrics}>
            {canReservations && summary ? <>
              <div className={styles.metric}><strong>{summary.total}</strong><span>{tr(locale, "Trip reservations", "Reservas de viaje")}</span></div>
              <div className={styles.metric}><strong>{summary.pending}</strong><span>{tr(locale, "Trip pending", "Viajes pendientes")}</span></div>
              <div className={styles.metric}><strong>{serviceReservations.length}</strong><span>{tr(locale, "Service reservations", "Reservas de servicios")}</span></div>
              <div className={styles.metric}><strong>{serviceReservations.filter((item) => item.status === "pending").length}</strong><span>{tr(locale, "Services pending", "Servicios pendientes")}</span></div>
            </> : null}
            {canTasks ? <>
              <div className={styles.metric}><strong>{myTasks.length}</strong><span>{tr(locale, "My open tasks", "Mis tareas abiertas")}</span></div>
              <div className={styles.metric}><strong>{overdueTasks.length}</strong><span>{tr(locale, "Overdue tasks", "Tareas vencidas")}</span></div>
            </> : null}
            {canSuppliers ? <>
              <div className={styles.metric}><strong>{requestedFulfilment.length}</strong><span>{tr(locale, "Supplier confirmations pending", "Confirmaciones de proveedor pendientes")}</span></div>
              <div className={styles.metric}><strong>{attentionFulfilment.length}</strong><span>{tr(locale, "Supplier items needing attention", "Proveedores que requieren atención")}</span></div>
            </> : null}
          </div> : <div className={styles.notice}>{tr(
            locale,
            "This account has a limited specialist profile. Use the permitted sections below.",
            "Esta cuenta tiene un perfil especializado limitado. Utiliza las secciones permitidas que aparecen abajo."
          )}</div>}

          {!operationsConfig.writesEnabled ? <div className={styles.notice}>{tr(locale, "Operations are read-only in this deployment. Enable an operations write adapter to change reservation status, tasks or supplier tracking.", "Las operaciones están en modo de solo lectura en este despliegue. Activa un adaptador de escritura para cambiar estados de reserva, tareas o seguimiento de proveedores.")}</div> : null}

          <div className={styles.actions}>
            {canReservations ? <Link className="button button-primary" href="/operator/reservations">{tr(locale, "Trip reservations", "Reservas de viaje")}</Link> : null}
            {canReservations ? <Link className="button button-primary" href="/operator/documents">{tr(locale, "Documents", "Documentos")}</Link> : null}
            {canTasks ? <Link className="button button-primary" href="/operator/tasks">{tr(locale, "Tasks", "Tareas")}</Link> : null}
            {canSuppliers ? <Link className="button button-primary" href="/operator/fulfilment">{tr(locale, "Suppliers", "Proveedores")}</Link> : null}
            {canTasks ? <Link className="button button-secondary" href="/operator/tasks/new">{tr(locale, "New task", "Nueva tarea")}</Link> : null}
            {canReservations ? <Link className="button button-secondary" href="/operator/service-reservations">{tr(locale, "Service reservations", "Reservas de servicios")}</Link> : null}
            {canReservations ? <Link className="button button-secondary" href="/operator/customers">{tr(locale, "Customers", "Clientes")}</Link> : null}
            {canFinance ? <Link className="button button-secondary" href="/operator/payments">{tr(locale, "Payments", "Pagos")}</Link> : null}
            {canCatalogue ? <Link className="button button-secondary" href="/operator/catalogue">{tr(locale, "Catalogue", "Catálogo")}</Link> : null}
            {canCatalogue ? <Link className="button button-secondary" href="/operator/catalogue/accommodations">{tr(locale, "Accommodation", "Alojamiento")}</Link> : null}
            {canCatalogue ? <Link className="button button-secondary" href="/operator/media">{tr(locale, "Media", "Multimedia")}</Link> : null}
            {canTravellerData && canReservations ? <Link className="button button-secondary" href="/operator/reservations">{tr(locale, "Traveller-data status", "Estado de datos de viajeros")}</Link> : null}
            <Link className="button button-secondary" href="/operator/security">{tr(locale, "Security", "Seguridad")}</Link>
            {identity.role === "admin" ? <Link className="button button-secondary" href="/operator/payments/providers">{tr(locale, "Payment providers", "Pasarelas de pago")}</Link> : null}
            {identity.role === "admin" ? <Link className="button button-secondary" href="/operator/staff">{tr(locale, "Staff access", "Acceso del personal")}</Link> : null}
            <Link className="button button-secondary" href="/accommodations">{tr(locale, "Public accommodation", "Alojamiento público")}</Link>
            <Link className="button button-secondary" href="/services">{tr(locale, "Public services", "Servicios públicos")}</Link>
            <form action={endStaffSession}><button className="button button-secondary" type="submit">{tr(locale, "Sign out", "Cerrar sesión")}</button></form>
          </div>
        </section>

        {canSuppliers ? <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Supplier follow-up", "Seguimiento de proveedores")}</div>
          <h2>{tr(locale, "Supplier items needing attention", "Proveedores que requieren atención")}</h2>
          {attentionFulfilment.length ? <div className={styles.list}>{attentionFulfilment.slice(0, 5).map((row) => {
            const href = row.component.targetType === "trip-reservation"
              ? `/operator/reservations/${encodeURIComponent(row.component.targetId)}/workflow#fulfilment`
              : `/operator/tasks/target/service-reservation/${encodeURIComponent(row.component.targetId)}#fulfilment`;
            return <Link className={styles.row} href={href} key={`${row.component.targetType}-${row.component.targetId}-${row.component.componentKey}`}><strong>{row.component.componentLabel}</strong><span>{row.item?.supplierName ?? tr(locale, "Supplier not assigned", "Proveedor sin asignar")}</span><span className={styles.badge}>{row.item?.status === "rejected" ? tr(locale, "Rejected", "Rechazado") : tr(locale, "Overdue", "Vencido")}</span><span>{row.item?.deadline ?? "—"}</span></Link>;
          })}</div> : <div className={styles.notice}>{tr(locale, "No supplier confirmations currently require attention.", "Ninguna confirmación de proveedor requiere atención ahora mismo.")}</div>}
        </section> : null}

        {canTasks ? <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Follow-up", "Seguimiento")}</div>
          <h2>{tr(locale, "Tasks needing attention", "Tareas que requieren atención")}</h2>
          {openTasks.length ? <div className={styles.list}>{openTasks
            .sort((a, b) => (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"))
            .slice(0, 5)
            .map((task) => <Link className={styles.row} href="/operator/tasks" key={task.id}><strong>{task.title}</strong><span>{task.assigneeDisplayName ?? tr(locale, "Unassigned", "Sin asignar")}</span><span className={styles.badge}>{isOperationsTaskOverdue(task) ? tr(locale, "Overdue", "Vencida") : tr(locale, "Open", "Abierta")}</span><span>{task.dueDate ?? tr(locale, "No due date", "Sin vencimiento")}</span></Link>)}</div> : <div className={styles.notice}>{tr(locale, "No open operational tasks.", "No hay tareas operativas abiertas.")}</div>}
        </section> : null}

        {canReservations ? <>
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
        </> : null}
      </div>
    </main>
  );
}
