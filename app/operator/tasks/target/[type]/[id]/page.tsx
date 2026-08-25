import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/operator/operator.module.css";
import { OperationsTasks } from "@/components/operator/operations-tasks";
import type { OperationsTaskTargetType } from "@/domain/operations/types";
import { getCustomerForOperations } from "@/lib/customer-auth";
import { getLocale } from "@/lib/get-locale";
import { tr } from "@/lib/operator-i18n";
import { operationsConfig } from "@/lib/operations-config";
import { getOperationsRepository } from "@/lib/operations-repository";
import { isOperationsTaskTargetType } from "@/lib/operations-task-rules";
import { loadOperationsTaskView } from "@/lib/operations-task-view";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { getServiceReservationForOperator } from "@/lib/service-reservations";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = { title: "Task workspace", description: "Protected operations task workspace." };

export default async function OperationsTaskTargetPage({
  params,
  searchParams
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ taskUpdated?: string; taskError?: string }>;
}) {
  const locale = await getLocale();
  const staff = await requireOperationsIdentity();
  const [{ type, id }, query] = await Promise.all([params, searchParams]);
  if (!isOperationsTaskTargetType(type)) notFound();
  const targetType = type as OperationsTaskTargetType;

  let title = "";
  let sourceHref = "/operator/tasks";
  let sourceLabel = tr(locale, "Open source item", "Abrir elemento origen");

  if (targetType === "trip-reservation") {
    const [reservation, trips] = await Promise.all([
      getOperationsRepository().getReservation(id),
      getTravelRepository().listTrips()
    ]);
    if (!reservation) notFound();
    title = trips.find((trip) => trip.id === reservation.tripId)?.title ?? reservation.tripTitle ?? reservation.id;
    sourceHref = `/operator/reservations/${encodeURIComponent(id)}/workflow`;
    sourceLabel = tr(locale, "Reservation workspace", "Espacio de reserva");
  } else if (targetType === "service-reservation") {
    const reservation = await getServiceReservationForOperator(id);
    if (!reservation) notFound();
    title = reservation.serviceTitle;
    sourceHref = `/operator/service-reservations/${encodeURIComponent(id)}`;
    sourceLabel = tr(locale, "Service reservation", "Reserva de servicio");
  } else {
    const customer = await getCustomerForOperations(id);
    if (!customer) notFound();
    title = customer.displayName;
    sourceHref = `/operator/customers/${encodeURIComponent(id)}`;
    sourceLabel = tr(locale, "Customer profile", "Ficha del cliente");
  }

  const taskView = await loadOperationsTaskView(targetType, id, staff);
  const returnTo = `/operator/tasks/target/${encodeURIComponent(targetType)}/${encodeURIComponent(id)}`;

  return <main className="section"><div className={`container ${styles.shell}`}>
    <section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Task workspace", "Espacio de tareas")}</div>
      <h1>{title}</h1>
      <p className={styles.lead}>{tr(locale, "Internal follow-up for this specific operational context. Nothing in this task workspace is exposed to the customer account.", "Seguimiento interno para este contexto operativo concreto. Nada de este espacio de tareas se expone en la cuenta del cliente.")}</p>
      <div className={styles.actions}>
        <Link className="button button-secondary" href={sourceHref}>{sourceLabel}</Link>
        <Link className="button button-secondary" href="/operator/tasks">{tr(locale, "All tasks", "Todas las tareas")}</Link>
      </div>
    </section>

    <OperationsTasks
      targetType={targetType}
      targetId={id}
      tasks={taskView.tasks}
      histories={taskView.histories}
      staffOptions={taskView.staffOptions}
      locale={locale}
      writesEnabled={operationsConfig.writesEnabled}
      returnTo={returnTo}
      updated={query.taskUpdated}
      error={query.taskError}
    />
  </div></main>;
}
