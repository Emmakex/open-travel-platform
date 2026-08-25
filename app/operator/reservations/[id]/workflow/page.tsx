import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/operator/operator.module.css";
import { OperationsTasks } from "@/components/operator/operations-tasks";
import { ReservationOperationsWorkflow } from "@/components/operator/reservation-operations-workflow";
import { getLocale } from "@/lib/get-locale";
import { identityConfig } from "@/lib/identity-config";
import { formatOperatorMoney, reservationStatusLabel, tr } from "@/lib/operator-i18n";
import { operationsConfig } from "@/lib/operations-config";
import { getOperationsRepository } from "@/lib/operations-repository";
import {
  listOperationsTaskComments,
  listOperationsTaskEvents,
  listOperationsTasksForTarget
} from "@/lib/operations-tasks";
import {
  getReservationOperationsState,
  listReservationInternalNotes,
  listReservationOperationsEvents
} from "@/lib/reservation-operations";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { listStaffUsers } from "@/lib/staff-auth";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "Reservation workflow",
  description: "Protected internal reservation workflow."
};

export default async function ReservationWorkflowPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    operationsUpdated?: string;
    operationsError?: string;
    taskUpdated?: string;
    taskError?: string;
  }>;
}) {
  const locale = await getLocale();
  const staff = await requireOperationsIdentity();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const operations = getOperationsRepository();
  const [reservation, trips, state, notes, events, persistentStaff, tasks] = await Promise.all([
    operations.getReservation(id),
    getTravelRepository().listTrips(),
    getReservationOperationsState(id),
    listReservationInternalNotes(id),
    listReservationOperationsEvents(id),
    identityConfig.staffAuthEnabled ? listStaffUsers() : Promise.resolve([]),
    listOperationsTasksForTarget("trip-reservation", id)
  ]);

  if (!reservation) notFound();
  const trip = trips.find((item) => item.id === reservation.tripId);
  const staffOptions = persistentStaff.length
    ? persistentStaff.map((member) => ({ id: member.id, displayName: member.displayName, role: member.role, status: member.status }))
    : [{ id: staff.id, displayName: staff.displayName, role: staff.role, status: "active" as const }];
  const histories = Object.fromEntries(await Promise.all(tasks.map(async (task) => [
    task.id,
    {
      events: await listOperationsTaskEvents(task.id),
      comments: await listOperationsTaskComments(task.id)
    }
  ])));
  const returnTo = `/operator/reservations/${encodeURIComponent(reservation.id)}/workflow`;

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Reservation workspace", "Espacio de trabajo de reserva")}</div>
          <h1>{trip?.title ?? reservation.tripTitle ?? tr(locale, "Reservation", "Reserva")}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "Manage the team's internal ownership, priorities, tasks and follow-ups without changing customer-visible booking or payment records.",
            "Gestiona la responsabilidad, prioridades, tareas y seguimientos internos del equipo sin modificar los datos de reserva o pagos visibles para el cliente."
          )}</p>
          <dl className={styles.definitionList}>
            <div><dt>{tr(locale, "Status", "Estado")}</dt><dd><span className={styles.badge}>{reservationStatusLabel(reservation.status, locale)}</span></dd></div>
            <div><dt>{tr(locale, "Travellers", "Viajeros")}</dt><dd>{reservation.partySize}</dd></div>
            <div><dt>{tr(locale, "Total", "Total")}</dt><dd>{formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</dd></div>
            <div><dt>{tr(locale, "Reference", "Referencia")}</dt><dd>{reservation.id}</dd></div>
          </dl>
          <div className={styles.actions}>
            <Link className="button button-secondary" href={`/operator/reservations/${encodeURIComponent(reservation.id)}`}>{tr(locale, "Reservation detail", "Detalle de la reserva")}</Link>
            <Link className="button button-secondary" href="/operator/tasks">{tr(locale, "All tasks", "Todas las tareas")}</Link>
            <Link className="button button-secondary" href="/operator/reservations">{tr(locale, "Reservation queue", "Cola de reservas")}</Link>
          </div>
        </section>

        <ReservationOperationsWorkflow
          reservationId={reservation.id}
          state={state}
          notes={notes}
          events={events}
          staffOptions={staffOptions}
          locale={locale}
          writesEnabled={operationsConfig.writesEnabled}
          updated={query.operationsUpdated}
          error={query.operationsError}
        />

        <OperationsTasks
          targetType="trip-reservation"
          targetId={reservation.id}
          tasks={tasks}
          histories={histories}
          staffOptions={staffOptions}
          locale={locale}
          writesEnabled={operationsConfig.writesEnabled}
          returnTo={returnTo}
          updated={query.taskUpdated}
          error={query.taskError}
        />
      </div>
    </main>
  );
}
