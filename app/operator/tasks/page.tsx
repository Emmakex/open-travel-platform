import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { updateOperationsTaskAction } from "@/app/operator/tasks/actions";
import { operationsTaskStatusLabel } from "@/components/operator/operations-tasks";
import type { OperationsTask } from "@/domain/operations/types";
import { listCustomersForOperations } from "@/lib/customer-auth";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorDate, tr } from "@/lib/operator-i18n";
import { operationsConfig } from "@/lib/operations-config";
import {
  isOperationsTaskDueToday,
  isOperationsTaskOpen,
  isOperationsTaskOverdue,
  operationsDateKey
} from "@/lib/operations-task-rules";
import { listOperationsTasks } from "@/lib/operations-tasks";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { listServiceReservationsForOperator } from "@/lib/service-reservations";
import { getTravelRepository } from "@/lib/travel-repository";

const views = new Set(["all", "mine", "overdue", "today", "upcoming", "completed"]);

function taskTargetHref(task: OperationsTask) {
  if (task.targetType === "trip-reservation") return `/operator/reservations/${encodeURIComponent(task.targetId)}/workflow#tasks`;
  return `/operator/tasks/target/${encodeURIComponent(task.targetType)}/${encodeURIComponent(task.targetId)}#tasks`;
}

export const metadata = {
  title: "Tasks | Kairoseth Travel",
  description: "Protected operations task dashboard."
};

export default async function OperatorTasksPage({ searchParams }: { searchParams: Promise<{ view?: string; taskUpdated?: string; taskError?: string }> }) {
  const locale = await getLocale();
  const identity = await requireOperationsIdentity();
  const query = await searchParams;
  const activeView = query.view && views.has(query.view) ? query.view : "all";
  const [tasks, reservations, trips, serviceReservations, customers] = await Promise.all([
    listOperationsTasks(),
    getOperationsRepository().listReservations(),
    getTravelRepository().listTrips(),
    listServiceReservationsForOperator(),
    listCustomersForOperations()
  ]);
  const today = operationsDateKey();
  const active = tasks.filter(isOperationsTaskOpen);
  const counts = {
    open: active.length,
    mine: active.filter((task) => task.assigneeStaffId === identity.id).length,
    overdue: active.filter((task) => isOperationsTaskOverdue(task, today)).length,
    today: active.filter((task) => isOperationsTaskDueToday(task, today)).length
  };
  const visible = tasks.filter((task) => {
    if (activeView === "mine") return isOperationsTaskOpen(task) && task.assigneeStaffId === identity.id;
    if (activeView === "overdue") return isOperationsTaskOverdue(task, today);
    if (activeView === "today") return isOperationsTaskDueToday(task, today);
    if (activeView === "upcoming") return isOperationsTaskOpen(task) && Boolean(task.dueDate && task.dueDate > today);
    if (activeView === "completed") return task.status === "completed";
    return isOperationsTaskOpen(task);
  }).sort((a, b) => {
    const aDue = a.dueDate ?? "9999-12-31";
    const bDue = b.dueDate ?? "9999-12-31";
    return aDue.localeCompare(bDue) || b.createdAt.localeCompare(a.createdAt);
  });
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const reservationById = new Map(reservations.map((reservation) => [reservation.id, reservation]));
  const serviceById = new Map(serviceReservations.map((reservation) => [reservation.id, reservation]));
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));

  const taskTargetLabel = (task: OperationsTask) => {
    if (task.targetType === "trip-reservation") {
      const reservation = reservationById.get(task.targetId);
      const trip = reservation ? tripById.get(reservation.tripId) : undefined;
      return trip?.title ?? reservation?.tripTitle ?? task.targetId;
    }
    if (task.targetType === "service-reservation") return serviceById.get(task.targetId)?.serviceTitle ?? task.targetId;
    return customerById.get(task.targetId)?.displayName ?? task.targetId;
  };

  return (
    <main className="section"><div className={`container ${styles.shell}`}>
      <section className={styles.panel}>
        <div className="eyebrow">{tr(locale, "Operations follow-up", "Seguimiento operativo")}</div>
        <h1>{tr(locale, "Tasks", "Tareas")}</h1>
        <p className={styles.lead}>{tr(locale, "Prioritize the team's open work across trip reservations, service reservations and customers.", "Prioriza el trabajo abierto del equipo entre reservas de viaje, reservas de servicios y clientes.")}</p>
        <div className={styles.metrics}>
          <div className={styles.metric}><strong>{counts.open}</strong><span>{tr(locale, "Open", "Abiertas")}</span></div>
          <div className={styles.metric}><strong>{counts.mine}</strong><span>{tr(locale, "Assigned to me", "Asignadas a mí")}</span></div>
          <div className={styles.metric}><strong>{counts.overdue}</strong><span>{tr(locale, "Overdue", "Vencidas")}</span></div>
          <div className={styles.metric}><strong>{counts.today}</strong><span>{tr(locale, "Due today", "Vencen hoy")}</span></div>
        </div>
        {query.taskUpdated ? <div className={styles.notice}>{tr(locale, "Task updated.", "Tarea actualizada.")}</div> : null}
        {query.taskError ? <div className={styles.notice}>{tr(locale, "The task change could not be saved. Open the linked item to review it.", "No se pudo guardar el cambio de la tarea. Abre el elemento vinculado para revisarla.")}</div> : null}
        <div className={styles.actions}>
          <Link className="button button-primary" href="/operator/tasks/new">{tr(locale, "New task", "Nueva tarea")}</Link>
          <Link className="button button-secondary" href="/operator/tasks">{tr(locale, "Open", "Abiertas")}</Link>
          <Link className="button button-secondary" href="/operator/tasks?view=mine">{tr(locale, "Mine", "Mías")}</Link>
          <Link className="button button-secondary" href="/operator/tasks?view=overdue">{tr(locale, "Overdue", "Vencidas")}</Link>
          <Link className="button button-secondary" href="/operator/tasks?view=today">{tr(locale, "Today", "Hoy")}</Link>
          <Link className="button button-secondary" href="/operator/tasks?view=upcoming">{tr(locale, "Upcoming", "Próximas")}</Link>
          <Link className="button button-secondary" href="/operator/tasks?view=completed">{tr(locale, "Completed", "Completadas")}</Link>
        </div>
      </section>

      <section className={styles.panel} style={{ marginTop: "1rem" }}>
        <div className="eyebrow">{tr(locale, "Work queue", "Cola de trabajo")}</div>
        <h2>{visible.length} {tr(locale, "tasks", "tareas")}</h2>
        {visible.length ? <div className={styles.managementList}>{visible.map((task) => {
          const overdue = isOperationsTaskOverdue(task, today);
          return <div className={styles.managementRow} key={task.id}>
            <div>
              <strong>{task.title}</strong><br />
              <Link className="text-link" href={taskTargetHref(task)}>{taskTargetLabel(task)}</Link><br />
              <span>{task.targetType === "trip-reservation" ? tr(locale, "Trip reservation", "Reserva de viaje") : task.targetType === "service-reservation" ? tr(locale, "Service reservation", "Reserva de servicio") : tr(locale, "Customer", "Cliente")}</span>
            </div>
            <span className={styles.badge}>{operationsTaskStatusLabel(task.status, locale)}</span>
            <span>{task.assigneeDisplayName ?? tr(locale, "Unassigned", "Sin asignar")}</span>
            <span>{task.dueDate ? <>{formatOperatorDate(`${task.dueDate}T12:00:00Z`, locale)}{overdue ? ` · ${tr(locale, "Overdue", "Vencida")}` : ""}</> : tr(locale, "No due date", "Sin vencimiento")}</span>
            {operationsConfig.writesEnabled && isOperationsTaskOpen(task) ? <form action={updateOperationsTaskAction}>
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="status" value="completed" />
              <input type="hidden" name="dueDate" value={task.dueDate ?? ""} />
              <input type="hidden" name="assigneeStaffId" value={task.assigneeStaffId ?? ""} />
              <input type="hidden" name="returnTo" value={`/operator/tasks${activeView !== "all" ? `?view=${encodeURIComponent(activeView)}` : ""}`} />
              <button className="button button-secondary" type="submit">{tr(locale, "Complete", "Completar")}</button>
            </form> : null}
          </div>;
        })}</div> : <p className={styles.muted}>{tr(locale, "No tasks match this view.", "No hay tareas que coincidan con esta vista.")}</p>}
        <p><Link className="text-link" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link></p>
      </section>
    </div></main>
  );
}
