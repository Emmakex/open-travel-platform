import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import type { ReservationStatus } from "@/domain/booking/types";
import type { ReservationOperationsState, ReservationPriority } from "@/domain/operations/types";
import type { TravelLocale } from "@/domain/travel/types";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorMoney, reservationStatusLabel, tr } from "@/lib/operator-i18n";
import { getOperationsRepository } from "@/lib/operations-repository";
import { listReservationOperationsStates } from "@/lib/reservation-operations";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { getTravelRepository } from "@/lib/travel-repository";

const statuses = new Set<ReservationStatus>(["pending", "confirmed", "cancelled"]);

function priorityLabel(priority: ReservationPriority, locale: TravelLocale) {
  const labels: Record<ReservationPriority, [string, string]> = {
    low: ["Low", "Baja"],
    normal: ["Normal", "Normal"],
    high: ["High", "Alta"],
    urgent: ["Urgent", "Urgente"]
  };
  return locale === "es" ? labels[priority][1] : labels[priority][0];
}

function workflowState(map: Map<string, ReservationOperationsState>, reservationId: string) {
  return map.get(reservationId) ?? { reservationId, priority: "normal" as const, tags: [] };
}

export const metadata = {
  title: "Reservations | Kairoseth Travel",
  description: "Protected Kairoseth Travel reservation operations queue."
};

export default async function OperatorReservationsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const { status, error } = await searchParams;
  const activeStatus = status && statuses.has(status as ReservationStatus)
    ? status as ReservationStatus
    : null;

  const [reservations, trips] = await Promise.all([
    getOperationsRepository().listReservations(),
    getTravelRepository().listTrips()
  ]);
  const operationsStates = await listReservationOperationsStates(reservations.map((reservation) => reservation.id));
  const visible = activeStatus
    ? reservations.filter((reservation) => reservation.status === activeStatus)
    : reservations;

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Operations queue", "Cola de operaciones")}</div>
          <h1>{tr(locale, "Reservations", "Reservas")}</h1>
          <p className={styles.lead}>
            {tr(
              locale,
              "Review reservations together with internal ownership and priority. Open the workspace to manage tags, team context and internal notes.",
              "Revisa las reservas junto con su responsable y prioridad internos. Abre el espacio de trabajo para gestionar etiquetas, contexto del equipo y notas internas."
            )}
          </p>

          {error === "not-found" ? <div className={styles.notice}>{tr(locale, "Reservation not found.", "Reserva no encontrada.")}</div> : null}

          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator/reservations">{tr(locale, "All", "Todas")}</Link>
            <Link className="button button-secondary" href="/operator/reservations?status=pending">{tr(locale, "Pending", "Pendientes")}</Link>
            <Link className="button button-secondary" href="/operator/reservations?status=confirmed">{tr(locale, "Confirmed", "Confirmadas")}</Link>
            <Link className="button button-secondary" href="/operator/reservations?status=cancelled">{tr(locale, "Cancelled", "Canceladas")}</Link>
          </div>

          {visible.length ? (
            <div className={styles.managementList}>
              {visible.map((reservation) => {
                const trip = trips.find((item) => item.id === reservation.tripId);
                const workflow = workflowState(operationsStates, reservation.id);
                return (
                  <div className={styles.managementRow} key={reservation.id}>
                    <div>
                      <strong><Link className="text-link" href={`/operator/reservations/${encodeURIComponent(reservation.id)}`}>{trip?.title ?? reservation.tripTitle ?? reservation.tripId}</Link></strong>
                      <span>
                        {reservation.partySize} {tr(locale, "travellers", "viajeros")} · {tr(locale, "Owner", "Responsable")}: {workflow.ownerDisplayName ?? tr(locale, "Unassigned", "Sin asignar")}
                        {workflow.tags.length ? ` · ${workflow.tags.slice(0, 3).join(", ")}${workflow.tags.length > 3 ? "…" : ""}` : ""}
                      </span>
                    </div>
                    <span className={styles.badge}>{priorityLabel(workflow.priority, locale)}</span>
                    <span className={styles.badge}>{reservationStatusLabel(reservation.status, locale)}</span>
                    <span>{formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</span>
                    <Link className="button button-secondary" href={`/operator/reservations/${encodeURIComponent(reservation.id)}/workflow`}>{tr(locale, "Workspace", "Gestión")}</Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.notice}>{tr(locale, "No reservations match this view.", "No hay reservas que coincidan con esta vista.")}</div>
          )}

          <p><Link className="text-link" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link></p>
        </section>
      </div>
    </main>
  );
}
