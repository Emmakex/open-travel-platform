import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { createOperationsTaskAction } from "@/app/operator/tasks/actions";
import { listCustomersForOperations } from "@/lib/customer-auth";
import { getLocale } from "@/lib/get-locale";
import { identityConfig } from "@/lib/identity-config";
import { tr } from "@/lib/operator-i18n";
import { operationsConfig } from "@/lib/operations-config";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { listServiceReservationsForOperator } from "@/lib/service-reservations";
import { listStaffUsers } from "@/lib/staff-auth";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = { title: "New task", description: "Create an internal operations task." };

export default async function NewOperationsTaskPage() {
  const locale = await getLocale();
  const staff = await requireOperationsIdentity();
  const [reservations, trips, serviceReservations, customers, persistentStaff] = await Promise.all([
    getOperationsRepository().listReservations(),
    getTravelRepository().listTrips(),
    listServiceReservationsForOperator(),
    listCustomersForOperations(),
    identityConfig.staffAuthEnabled ? listStaffUsers() : Promise.resolve([])
  ]);
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const staffOptions = persistentStaff.length
    ? persistentStaff.filter((member) => member.status === "active")
    : [{ id: staff.id, displayName: staff.displayName, role: staff.role, status: "active" as const }];

  const taskForm = (targetType: "trip-reservation" | "service-reservation" | "customer", options: { id: string; label: string }[]) => (
    <form action={createOperationsTaskAction} className={styles.editorForm}>
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="returnTo" value="/operator/tasks" />
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>{targetType === "trip-reservation" ? tr(locale, "Trip reservation", "Reserva de viaje") : targetType === "service-reservation" ? tr(locale, "Service reservation", "Reserva de servicio") : tr(locale, "Customer", "Cliente")}</span>
          <select name="targetId" required disabled={!operationsConfig.writesEnabled}>
            <option value="">{tr(locale, "Choose…", "Selecciona…")}</option>
            {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
        <label className={styles.field}><span>{tr(locale, "Task", "Tarea")}</span><input name="title" maxLength={160} required disabled={!operationsConfig.writesEnabled} /></label>
        <label className={styles.field}>
          <span>{tr(locale, "Assignee", "Responsable")}</span>
          <select name="assigneeStaffId" defaultValue="" disabled={!operationsConfig.writesEnabled}>
            <option value="">{tr(locale, "Unassigned", "Sin asignar")}</option>
            {staffOptions.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
          </select>
        </label>
        <label className={styles.field}><span>{tr(locale, "Due date", "Vencimiento")}</span><input name="dueDate" type="date" disabled={!operationsConfig.writesEnabled} /></label>
      </div>
      <label className={styles.field}><span>{tr(locale, "Details", "Detalles")}</span><textarea name="details" rows={3} maxLength={2000} disabled={!operationsConfig.writesEnabled} /></label>
      {operationsConfig.writesEnabled ? <button className="button button-primary" type="submit">{tr(locale, "Create task", "Crear tarea")}</button> : null}
    </form>
  );

  return <main className="section"><div className={`container ${styles.shell}`}>
    <section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Operations follow-up", "Seguimiento operativo")}</div>
      <h1>{tr(locale, "New task", "Nueva tarea")}</h1>
      <p className={styles.lead}>{tr(locale, "Create a task against the exact trip reservation, service reservation or customer that needs follow-up.", "Crea una tarea sobre la reserva de viaje, reserva de servicio o cliente exacto que requiera seguimiento.")}</p>
      <div className={styles.actions}><Link className="button button-secondary" href="/operator/tasks">{tr(locale, "← Tasks", "← Tareas")}</Link></div>
    </section>

    <section className={styles.panel} style={{ marginTop: "1rem" }}>
      <div className="eyebrow">{tr(locale, "Trip reservation", "Reserva de viaje")}</div>
      <h2>{tr(locale, "Create reservation task", "Crear tarea de reserva")}</h2>
      {taskForm("trip-reservation", reservations.map((reservation) => ({ id: reservation.id, label: `${tripById.get(reservation.tripId)?.title ?? reservation.tripTitle ?? reservation.tripId} · ${reservation.id}` })))}
    </section>

    <section className={styles.panel} style={{ marginTop: "1rem" }}>
      <div className="eyebrow">{tr(locale, "Service reservation", "Reserva de servicio")}</div>
      <h2>{tr(locale, "Create service task", "Crear tarea de servicio")}</h2>
      {taskForm("service-reservation", serviceReservations.map((reservation) => ({ id: reservation.id, label: `${reservation.serviceTitle} · ${reservation.id}` })))}
    </section>

    <section className={styles.panel} style={{ marginTop: "1rem" }}>
      <div className="eyebrow">{tr(locale, "Customer", "Cliente")}</div>
      <h2>{tr(locale, "Create customer task", "Crear tarea de cliente")}</h2>
      {taskForm("customer", customers.map((customer) => ({ id: customer.id, label: `${customer.displayName} · ${customer.email}` })))}
    </section>
  </div></main>;
}
