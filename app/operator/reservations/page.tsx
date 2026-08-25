import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import type { ReservationStatus } from "@/domain/booking/types";
import type { PaymentStatus } from "@/domain/payment/types";
import type { ReservationOperationsState, ReservationPriority } from "@/domain/operations/types";
import type { TravelLocale } from "@/domain/travel/types";
import { listCustomersForOperations } from "@/lib/customer-auth";
import { getLocale } from "@/lib/get-locale";
import { identityConfig } from "@/lib/identity-config";
import { formatOperatorDate, formatOperatorMoney, reservationStatusLabel, tr } from "@/lib/operator-i18n";
import {
  filterOperationsQueue,
  normalizeQueueDate,
  normalizeQueueSearch,
  normalizeQueueTag,
  paginateOperationsQueue,
  sortOperationsQueue,
  type OperationsQueueAttention,
  type OperationsQueuePayment,
  type OperationsQueueRow,
  type OperationsQueueSort
} from "@/lib/operations-queue";
import { getOperationsRepository } from "@/lib/operations-repository";
import { isOperationsTaskOverdue } from "@/lib/operations-task-rules";
import { listOperationsTasks } from "@/lib/operations-tasks";
import { paymentStatusLabel } from "@/lib/payment-i18n";
import { getPaymentRepository } from "@/lib/payment-repository";
import { deriveReservationPaymentSchedule } from "@/lib/payment-terms";
import { listReservationOperationsStates } from "@/lib/reservation-operations";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { listStaffUsers } from "@/lib/staff-auth";
import { isSupplierFulfilmentOverdue } from "@/lib/supplier-fulfilment-rules";
import { listSupplierFulfilmentQueue } from "@/lib/supplier-fulfilment";
import { getTravelRepository } from "@/lib/travel-repository";

const statuses = new Set<ReservationStatus>(["pending", "confirmed", "cancelled"]);
const priorities = new Set<ReservationPriority>(["low", "normal", "high", "urgent"]);
const paymentStatuses = new Set<PaymentStatus>(["unpaid", "pending", "partially_paid", "paid", "partially_refunded", "refunded"]);
const paymentFilters = new Set<OperationsQueuePayment>([...paymentStatuses, "all", "outstanding", "overdue"]);
const attentionFilters = new Set<OperationsQueueAttention>(["all", "any", "overdue-tasks", "supplier", "payment", "unassigned"]);
const sortOptions = new Set<OperationsQueueSort>(["departure-asc", "departure-desc", "newest", "priority"]);

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

function queueHref(
  query: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  const merged = { ...query, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value && value !== "all" && !(key === "page" && value === "1")) params.set(key, value);
  }
  const suffix = params.toString();
  return `/operator/reservations${suffix ? `?${suffix}` : ""}`;
}

export const metadata = {
  title: "Reservations | Kairoseth Travel",
  description: "Protected Kairoseth Travel reservation operations queue."
};

type QueueSearchParams = {
  q?: string;
  status?: string;
  owner?: string;
  priority?: string;
  tag?: string;
  payment?: string;
  from?: string;
  to?: string;
  attention?: string;
  sort?: string;
  page?: string;
  error?: string;
};

export default async function OperatorReservationsPage({ searchParams }: { searchParams: Promise<QueueSearchParams> }) {
  const locale = await getLocale();
  const identity = await requireOperationsIdentity();
  const query = await searchParams;
  const operations = getOperationsRepository();
  const payments = getPaymentRepository();

  const [reservations, trips, tasks, fulfilmentQueue, persistentStaff, customers] = await Promise.all([
    operations.listReservations(),
    getTravelRepository().listTrips(),
    listOperationsTasks(),
    listSupplierFulfilmentQueue(),
    identityConfig.staffAuthEnabled ? listStaffUsers() : Promise.resolve([]),
    identityConfig.customerAuthEnabled ? listCustomersForOperations() : Promise.resolve([])
  ]);
  const [operationsStates, paymentSummaries] = await Promise.all([
    listReservationOperationsStates(reservations.map((reservation) => reservation.id)),
    payments.getSummaries(reservations)
  ]);

  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const overdueTasksByReservation = new Map<string, number>();
  for (const task of tasks) {
    if (task.targetType !== "trip-reservation" || !isOperationsTaskOverdue(task)) continue;
    overdueTasksByReservation.set(task.targetId, (overdueTasksByReservation.get(task.targetId) ?? 0) + 1);
  }

  const supplierAttentionByReservation = new Map<string, number>();
  for (const row of fulfilmentQueue) {
    if (row.component.targetType !== "trip-reservation") continue;
    const status = row.item?.status ?? "not-requested";
    const needsAttention = status === "not-requested" || status === "requested" || status === "rejected" || Boolean(row.item && isSupplierFulfilmentOverdue(row.item));
    if (!needsAttention) continue;
    supplierAttentionByReservation.set(
      row.component.targetId,
      (supplierAttentionByReservation.get(row.component.targetId) ?? 0) + 1
    );
  }

  const queueRows: OperationsQueueRow[] = reservations.map((reservation) => {
    const customer = customerById.get(reservation.identityId);
    const schedule = deriveReservationPaymentSchedule(reservation, paymentSummaries[reservation.id]);
    const paymentOverdue = reservation.status !== "cancelled" && schedule.installments.some((item) => item.state === "overdue");
    return {
      reservation,
      tripTitle: tripById.get(reservation.tripId)?.title ?? reservation.tripTitle ?? reservation.tripId,
      customerName: customer?.displayName,
      customerEmail: customer?.email,
      workflow: workflowState(operationsStates, reservation.id),
      payment: paymentSummaries[reservation.id],
      paymentOverdue,
      overdueTaskCount: overdueTasksByReservation.get(reservation.id) ?? 0,
      supplierAttentionCount: supplierAttentionByReservation.get(reservation.id) ?? 0
    };
  });

  const filters = {
    q: normalizeQueueSearch(query.q),
    status: query.status && statuses.has(query.status as ReservationStatus) ? query.status as ReservationStatus : "all" as const,
    owner: query.owner?.trim() || "all",
    priority: query.priority && priorities.has(query.priority as ReservationPriority) ? query.priority as ReservationPriority : "all" as const,
    tag: normalizeQueueTag(query.tag),
    payment: query.payment && paymentFilters.has(query.payment as OperationsQueuePayment) ? query.payment as OperationsQueuePayment : "all" as const,
    departureFrom: normalizeQueueDate(query.from),
    departureTo: normalizeQueueDate(query.to),
    attention: query.attention && attentionFilters.has(query.attention as OperationsQueueAttention) ? query.attention as OperationsQueueAttention : "all" as const,
    sort: query.sort && sortOptions.has(query.sort as OperationsQueueSort) ? query.sort as OperationsQueueSort : "departure-asc" as const
  };

  const filtered = sortOperationsQueue(filterOperationsQueue(queueRows, filters), filters.sort);
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const page = paginateOperationsQueue(filtered, Number.isFinite(requestedPage) ? requestedPage : 1, 20);
  const allTags = [...new Set(queueRows.flatMap((row) => row.workflow.tags))].sort((a, b) => a.localeCompare(b));
  const staffOptions = persistentStaff.length
    ? persistentStaff.filter((staff) => staff.status === "active")
    : [{ id: identity.id, displayName: identity.displayName, role: identity.role, status: "active" as const }];

  const attentionCount = filtered.filter((row) => row.overdueTaskCount > 0 || row.supplierAttentionCount > 0 || row.paymentOverdue || !row.workflow.ownerStaffId).length;
  const overdueTaskCount = filtered.reduce((sum, row) => sum + row.overdueTaskCount, 0);
  const overduePaymentCount = filtered.filter((row) => row.paymentOverdue).length;
  const queryForLinks: Record<string, string | undefined> = {
    q: filters.q,
    status: filters.status,
    owner: filters.owner,
    priority: filters.priority,
    tag: filters.tag,
    payment: filters.payment,
    from: filters.departureFrom,
    to: filters.departureTo,
    attention: filters.attention,
    sort: filters.sort,
    page: String(page.page)
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Operations queue", "Cola de operaciones")}</div>
          <h1>{tr(locale, "Reservations", "Reservas")}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "Search and prioritize reservations using customer, owner, payment, departure and operational follow-up signals.",
            "Busca y prioriza reservas usando cliente, responsable, pagos, salida y señales de seguimiento operativo."
          )}</p>

          {query.error === "not-found" ? <div className={styles.notice}>{tr(locale, "Reservation not found.", "Reserva no encontrada.")}</div> : null}

          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{filtered.length}</strong><span>{tr(locale, "Matching reservations", "Reservas encontradas")}</span></div>
            <div className={styles.metric}><strong>{attentionCount}</strong><span>{tr(locale, "Need attention", "Requieren atención")}</span></div>
            <div className={styles.metric}><strong>{overdueTaskCount}</strong><span>{tr(locale, "Overdue tasks", "Tareas vencidas")}</span></div>
            <div className={styles.metric}><strong>{overduePaymentCount}</strong><span>{tr(locale, "Payment overdue", "Pago vencido")}</span></div>
          </div>

          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator/reservations">{tr(locale, "All", "Todas")}</Link>
            <Link className="button button-secondary" href={queueHref(queryForLinks, { owner: identity.id, page: undefined })}>{tr(locale, "Mine", "Mías")}</Link>
            <Link className="button button-secondary" href={queueHref(queryForLinks, { attention: "any", page: undefined })}>{tr(locale, "Needs attention", "Requieren atención")}</Link>
            <Link className="button button-secondary" href={queueHref(queryForLinks, { owner: "unassigned", page: undefined })}>{tr(locale, "Unassigned", "Sin responsable")}</Link>
          </div>

          <form className={styles.queueFilterForm} method="get">
            <div className={styles.queueFilterGrid}>
              <label className={styles.field}>
                <span>{tr(locale, "Search", "Buscar")}</span>
                <input name="q" defaultValue={filters.q ?? ""} placeholder={tr(locale, "Reference, customer, trip, traveller, tag…", "Referencia, cliente, viaje, viajero, etiqueta…")} />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Reservation status", "Estado de reserva")}</span>
                <select name="status" defaultValue={filters.status}>
                  <option value="all">{tr(locale, "All", "Todos")}</option>
                  <option value="pending">{tr(locale, "Pending", "Pendiente")}</option>
                  <option value="confirmed">{tr(locale, "Confirmed", "Confirmada")}</option>
                  <option value="cancelled">{tr(locale, "Cancelled", "Cancelada")}</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Owner", "Responsable")}</span>
                <select name="owner" defaultValue={filters.owner}>
                  <option value="all">{tr(locale, "All", "Todos")}</option>
                  <option value="unassigned">{tr(locale, "Unassigned", "Sin responsable")}</option>
                  {staffOptions.map((staff) => <option key={staff.id} value={staff.id}>{staff.displayName}</option>)}
                </select>
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Priority", "Prioridad")}</span>
                <select name="priority" defaultValue={filters.priority}>
                  <option value="all">{tr(locale, "All", "Todas")}</option>
                  <option value="urgent">{tr(locale, "Urgent", "Urgente")}</option>
                  <option value="high">{tr(locale, "High", "Alta")}</option>
                  <option value="normal">{tr(locale, "Normal", "Normal")}</option>
                  <option value="low">{tr(locale, "Low", "Baja")}</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Payment", "Pago")}</span>
                <select name="payment" defaultValue={filters.payment}>
                  <option value="all">{tr(locale, "All", "Todos")}</option>
                  <option value="overdue">{tr(locale, "Overdue installment", "Cuota vencida")}</option>
                  <option value="outstanding">{tr(locale, "Outstanding balance", "Saldo pendiente")}</option>
                  <option value="unpaid">{tr(locale, "Unpaid", "No pagado")}</option>
                  <option value="pending">{tr(locale, "Pending", "Pendiente")}</option>
                  <option value="partially_paid">{tr(locale, "Partially paid", "Parcialmente pagado")}</option>
                  <option value="paid">{tr(locale, "Paid", "Pagado")}</option>
                  <option value="partially_refunded">{tr(locale, "Partially refunded", "Parcialmente reembolsado")}</option>
                  <option value="refunded">{tr(locale, "Refunded", "Reembolsado")}</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Attention", "Atención")}</span>
                <select name="attention" defaultValue={filters.attention}>
                  <option value="all">{tr(locale, "All", "Todas")}</option>
                  <option value="any">{tr(locale, "Any attention signal", "Cualquier señal")}</option>
                  <option value="overdue-tasks">{tr(locale, "Overdue tasks", "Tareas vencidas")}</option>
                  <option value="supplier">{tr(locale, "Supplier pending", "Proveedor pendiente")}</option>
                  <option value="payment">{tr(locale, "Payment overdue", "Pago vencido")}</option>
                  <option value="unassigned">{tr(locale, "No owner", "Sin responsable")}</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Departure from", "Salida desde")}</span>
                <input type="date" name="from" defaultValue={filters.departureFrom ?? ""} />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Departure to", "Salida hasta")}</span>
                <input type="date" name="to" defaultValue={filters.departureTo ?? ""} />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Tag", "Etiqueta")}</span>
                <input name="tag" list="reservation-queue-tags" defaultValue={filters.tag ?? ""} placeholder={tr(locale, "Exact tag", "Etiqueta exacta")} />
                <datalist id="reservation-queue-tags">{allTags.map((tag) => <option value={tag} key={tag} />)}</datalist>
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Sort", "Orden")}</span>
                <select name="sort" defaultValue={filters.sort}>
                  <option value="departure-asc">{tr(locale, "Departure · soonest", "Salida · más próxima")}</option>
                  <option value="departure-desc">{tr(locale, "Departure · latest", "Salida · más lejana")}</option>
                  <option value="newest">{tr(locale, "Newest booking", "Reserva más reciente")}</option>
                  <option value="priority">{tr(locale, "Priority", "Prioridad")}</option>
                </select>
              </label>
            </div>
            <div className={styles.actionsCompact}>
              <button className="button button-primary" type="submit">{tr(locale, "Apply filters", "Aplicar filtros")}</button>
              <Link className="button button-secondary" href="/operator/reservations">{tr(locale, "Clear", "Limpiar")}</Link>
            </div>
          </form>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className={styles.sectionHeaderCompact}>
            <div>
              <div className="eyebrow">{tr(locale, "Work queue", "Cola de trabajo")}</div>
              <h2>{page.total} {tr(locale, "reservations", "reservas")}</h2>
            </div>
            <span className={styles.muted}>{tr(locale, `Page ${page.page} of ${page.totalPages}`, `Página ${page.page} de ${page.totalPages}`)}</span>
          </div>

          {page.rows.length ? (
            <div className={styles.managementList}>
              {page.rows.map((row) => {
                const reservation = row.reservation;
                const paymentLabel = row.payment ? paymentStatusLabel(row.payment.status, locale) : "—";
                return (
                  <div className={styles.queueRow} key={reservation.id}>
                    <div className={styles.queueMain}>
                      <strong><Link className="text-link" href={`/operator/reservations/${encodeURIComponent(reservation.id)}`}>{row.tripTitle}</Link></strong>
                      <span>{row.customerName ? `${row.customerName}${row.customerEmail ? ` · ${row.customerEmail}` : ""}` : reservation.id}</span>
                      <span>
                        {reservation.departureDate ? formatOperatorDate(`${reservation.departureDate}T12:00:00Z`, locale) : tr(locale, "No departure date", "Sin fecha de salida")}
                        {` · ${reservation.partySize} ${tr(locale, "travellers", "viajeros")}`}
                        {` · ${tr(locale, "Owner", "Responsable")}: ${row.workflow.ownerDisplayName ?? tr(locale, "Unassigned", "Sin asignar")}`}
                      </span>
                      {row.workflow.tags.length ? <span>{row.workflow.tags.join(" · ")}</span> : null}
                      <div className={styles.queueSignals}>
                        {row.overdueTaskCount > 0 ? <span className={styles.badge}>{tr(locale, `${row.overdueTaskCount} overdue tasks`, `${row.overdueTaskCount} tareas vencidas`)}</span> : null}
                        {row.supplierAttentionCount > 0 ? <span className={styles.badge}>{tr(locale, `${row.supplierAttentionCount} supplier pending`, `${row.supplierAttentionCount} proveedor pendiente`)}</span> : null}
                        {row.paymentOverdue ? <span className={styles.badge}>{tr(locale, "Payment overdue", "Pago vencido")}</span> : null}
                        {!row.workflow.ownerStaffId ? <span className={styles.badge}>{tr(locale, "Unassigned", "Sin responsable")}</span> : null}
                      </div>
                    </div>
                    <span className={styles.badge}>{priorityLabel(row.workflow.priority, locale)}</span>
                    <div className={styles.queueStatusStack}>
                      <span className={styles.badge}>{reservationStatusLabel(reservation.status, locale)}</span>
                      <span className={styles.badge}>{paymentLabel}</span>
                    </div>
                    <div>
                      <strong>{formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</strong>
                      {row.payment && row.payment.outstandingAmount > 0 ? <span className={styles.queueSubtext}>{tr(locale, "Outstanding", "Pendiente")}: {formatOperatorMoney(row.payment.outstandingAmount, row.payment.currency, locale)}</span> : null}
                    </div>
                    <Link className="button button-secondary" href={`/operator/reservations/${encodeURIComponent(reservation.id)}/workflow`}>{tr(locale, "Workspace", "Gestión")}</Link>
                  </div>
                );
              })}
            </div>
          ) : <div className={styles.notice}>{tr(locale, "No reservations match these filters.", "No hay reservas que coincidan con estos filtros.")}</div>}

          {page.totalPages > 1 ? <nav className={styles.pagination} aria-label={tr(locale, "Reservation queue pages", "Páginas de la cola de reservas")}>
            {page.page > 1 ? <Link className="button button-secondary" href={queueHref(queryForLinks, { page: String(page.page - 1) })}>{tr(locale, "← Previous", "← Anterior")}</Link> : <span />}
            <span>{page.page} / {page.totalPages}</span>
            {page.page < page.totalPages ? <Link className="button button-secondary" href={queueHref(queryForLinks, { page: String(page.page + 1) })}>{tr(locale, "Next →", "Siguiente →")}</Link> : <span />}
          </nav> : null}

          <p><Link className="text-link" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link></p>
        </section>
      </div>
    </main>
  );
}
