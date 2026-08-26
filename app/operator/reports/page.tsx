import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { listCustomersForOperations } from "@/lib/customer-auth";
import { getLocale } from "@/lib/get-locale";
import { getOperationsRepository } from "@/lib/operations-repository";
import {
  listRecentOperatorExportAudit,
  type OperatorExportType
} from "@/lib/operator-export-audit";
import {
  buildFinancialRows,
  filterCustomersByDate,
  filterReservationsByDate,
  filterServicesByDate,
  reportDateFilters
} from "@/lib/operator-reporting";
import { formatOperatorDate, formatOperatorMoney, tr } from "@/lib/operator-i18n";
import { operationsConfig } from "@/lib/operations-config";
import { getPaymentRepository } from "@/lib/payment-repository";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { listServiceReservationsForOperator } from "@/lib/service-reservations";
import { hasStaffCapability } from "@/lib/staff-capabilities";

export const metadata = {
  title: "Reports and exports | Kairoseth Travel",
  description: "Protected operational and financial reporting workspace."
};

function exportLabel(type: OperatorExportType, locale: "en" | "es") {
  const labels: Record<OperatorExportType, [string, string]> = {
    reservations: ["Reservations", "Reservas"],
    services: ["Service reservations", "Reservas de servicios"],
    customers: ["Customers", "Clientes"],
    reconciliation: ["Payment reconciliation", "Conciliación de pagos"],
    "outstanding-balances": ["Outstanding balances", "Saldos pendientes"],
    revenue: ["Revenue by product", "Ingresos por producto"],
    "protected-travellers": ["Protected traveller data", "Datos protegidos de viajeros"]
  };
  return locale === "es" ? labels[type][1] : labels[type][0];
}

function ordinaryExportHref(type: string, format: "csv" | "xlsx", filters: { from?: string; to?: string }) {
  const params = new URLSearchParams({ format });
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return `/operator/reports/export/${type}?${params.toString()}`;
}

type CurrencySummary = {
  currency: string;
  booked: number;
  netCollected: number;
  outstanding: number;
  refunded: number;
};

export default async function OperatorReportsPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const [locale, identity, query] = await Promise.all([
    getLocale(),
    requireOperationsIdentity(),
    searchParams
  ]);
  const canReservations = hasStaffCapability(identity, "reservations");
  const canFinance = hasStaffCapability(identity, "finance");
  const canTravellerData = hasStaffCapability(identity, "traveller-data");
  const canProtectedExport = canReservations && canTravellerData;

  const filterParams = new URLSearchParams();
  if (typeof query.from === "string") filterParams.set("from", query.from);
  if (typeof query.to === "string") filterParams.set("to", query.to);
  const filters = reportDateFilters(filterParams);

  const needsReservations = canReservations || canFinance;
  const [allReservations, allServices, allCustomers, audit] = await Promise.all([
    needsReservations ? getOperationsRepository().listReservations() : Promise.resolve([]),
    needsReservations ? listServiceReservationsForOperator() : Promise.resolve([]),
    canReservations ? listCustomersForOperations() : Promise.resolve([]),
    (canReservations || canFinance)
      ? listRecentOperatorExportAudit({
          actorIdentityId: identity.role === "admin" ? undefined : identity.id,
          limit: 20
        })
      : Promise.resolve([])
  ]);
  const reservations = filterReservationsByDate(allReservations, filters);
  const services = filterServicesByDate(allServices, filters);
  const customers = filterCustomersByDate(allCustomers, filters);
  const activeTripReservations = allReservations.filter((item) => item.status !== "cancelled");
  const activeServices = allServices.filter((item) => item.status !== "cancelled");

  let currencySummaries: CurrencySummary[] = [];
  if (canFinance) {
    const payments = getPaymentRepository();
    const [reservationSummaries, serviceEntries] = await Promise.all([
      payments.getSummaries(reservations),
      Promise.all(services.map(async (service) => [
        service.id,
        await payments.getTargetSummary({
          id: service.id,
          totalPrice: service.totalPrice,
          currency: service.currency,
          targetType: "service"
        })
      ] as const))
    ]);
    const financialRows = buildFinancialRows({
      reservations,
      reservationSummaries,
      services,
      serviceSummaries: Object.fromEntries(serviceEntries)
    });
    const byCurrency = new Map<string, CurrencySummary>();
    for (const row of financialRows) {
      const current = byCurrency.get(row.currency) ?? {
        currency: row.currency,
        booked: 0,
        netCollected: 0,
        outstanding: 0,
        refunded: 0
      };
      current.booked += row.payment.totalAmount;
      current.netCollected += row.payment.netPaidAmount;
      current.outstanding += row.reservationStatus === "cancelled" ? 0 : row.payment.outstandingAmount;
      current.refunded += row.payment.refundedAmount;
      byCurrency.set(row.currency, current);
    }
    currencySummaries = [...byCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency));
  }

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Reports and exports", "Informes y exportaciones")}</div>
          <h1>{tr(locale, "Operational reporting", "Reporting operativo")}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "Download operational and financial datasets using only the areas this staff account is allowed to access. CSV and XLSX exports use the same server-authoritative source data.",
            "Descarga datasets operativos y financieros utilizando únicamente las áreas a las que esta cuenta de personal tiene acceso. Los CSV y XLSX usan los mismos datos autoritativos del servidor."
          )}</p>
          <div className={styles.notice}>{tr(
            locale,
            "Date filters apply to the record creation date. Financial totals are kept separate by currency and are never combined across currencies.",
            "Los filtros de fecha se aplican a la fecha de creación del registro. Los totales financieros se mantienen separados por moneda y nunca se suman monedas distintas."
          )}</div>

          <form method="get" className={styles.editorForm}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>{tr(locale, "Created from", "Creado desde")}</span>
                <input type="date" name="from" defaultValue={filters.from ?? ""} />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Created to", "Creado hasta")}</span>
                <input type="date" name="to" defaultValue={filters.to ?? ""} />
              </label>
            </div>
            <div className={styles.actions}>
              <button className="button button-primary" type="submit">{tr(locale, "Apply filters", "Aplicar filtros")}</button>
              <Link className="button button-secondary" href="/operator/reports">{tr(locale, "Clear", "Limpiar")}</Link>
            </div>
          </form>
        </section>

        {canReservations ? (
          <section className={styles.panel} style={{ marginTop: "1rem" }}>
            <div className="eyebrow">{tr(locale, "Operations", "Operaciones")}</div>
            <h2>{tr(locale, "Reservation and customer exports", "Exportaciones de reservas y clientes")}</h2>
            <div className={styles.metrics}>
              <div className={styles.metric}><strong>{reservations.length}</strong><span>{tr(locale, "Trip reservations", "Reservas de viaje")}</span></div>
              <div className={styles.metric}><strong>{services.length}</strong><span>{tr(locale, "Service reservations", "Reservas de servicios")}</span></div>
              <div className={styles.metric}><strong>{customers.length}</strong><span>{tr(locale, "Customers", "Clientes")}</span></div>
            </div>
            <div className={styles.managementList}>
              {[
                ["reservations", tr(locale, "Trip reservations", "Reservas de viaje")],
                ["services", tr(locale, "Service reservations", "Reservas de servicios")],
                ["customers", tr(locale, "Customers", "Clientes")]
              ].map(([type, label]) => (
                <div className={styles.managementRow} key={type}>
                  <span><strong>{label}</strong><span>{tr(locale, "Current filtered dataset", "Dataset filtrado actual")}</span></span>
                  <a className="button button-secondary" href={ordinaryExportHref(type, "csv", filters)}>CSV</a>
                  <a className="button button-secondary" href={ordinaryExportHref(type, "xlsx", filters)}>XLSX</a>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {canFinance ? (
          <section className={styles.panel} style={{ marginTop: "1rem" }}>
            <div className="eyebrow">{tr(locale, "Finance", "Finanzas")}</div>
            <h2>{tr(locale, "Reconciliation and commercial reporting", "Conciliación y reporting comercial")}</h2>
            {currencySummaries.length ? (
              <div className={styles.managementList}>
                {currencySummaries.map((summary) => (
                  <div className={styles.managementRow} key={summary.currency}>
                    <span><strong>{summary.currency}</strong><span>{tr(locale, "Filtered financial position", "Posición financiera filtrada")}</span></span>
                    <span>{tr(locale, "Booked", "Reservado")}: {formatOperatorMoney(summary.booked, summary.currency, locale, 2)}</span>
                    <span>{tr(locale, "Net", "Neto")}: {formatOperatorMoney(summary.netCollected, summary.currency, locale, 2)}</span>
                    <span>{tr(locale, "Outstanding", "Pendiente")}: {formatOperatorMoney(summary.outstanding, summary.currency, locale, 2)}</span>
                  </div>
                ))}
              </div>
            ) : <div className={styles.notice}>{tr(locale, "No financial rows match the current date filter.", "No hay filas financieras para el filtro de fechas actual.")}</div>}
            <div className={styles.managementList} style={{ marginTop: "1rem" }}>
              {[
                ["reconciliation", tr(locale, "Payment reconciliation", "Conciliación de pagos")],
                ["outstanding-balances", tr(locale, "Outstanding balances", "Saldos pendientes")],
                ["revenue", tr(locale, "Revenue by product/service", "Ingresos por producto/servicio")]
              ].map(([type, label]) => (
                <div className={styles.managementRow} key={type}>
                  <span><strong>{label}</strong><span>{tr(locale, "Finance permission required", "Requiere permiso de Finanzas")}</span></span>
                  <a className="button button-secondary" href={ordinaryExportHref(type, "csv", filters)}>CSV</a>
                  <a className="button button-secondary" href={ordinaryExportHref(type, "xlsx", filters)}>XLSX</a>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {canProtectedExport ? (
          <section className={styles.panel} style={{ marginTop: "1rem" }}>
            <div className="eyebrow">{tr(locale, "Protected traveller data", "Datos protegidos de viajeros")}</div>
            <h2>{tr(locale, "Audited operational export", "Exportación operativa auditada")}</h2>
            <div className={styles.notice}>{tr(
              locale,
              operationsConfig.mode === "mongodb"
                ? "This export decrypts post-purchase traveller fields only for the selected active reservation. A concrete operational reason is mandatory and the audit record must be stored successfully before the file is returned."
                : "Sensitive exports are disabled because this deployment cannot persist the mandatory export audit record.",
              operationsConfig.mode === "mongodb"
                ? "Esta exportación descifra datos post-compra únicamente para la reserva activa seleccionada. Es obligatorio indicar un motivo operativo concreto y guardar correctamente la auditoría antes de devolver el archivo."
                : "Las exportaciones sensibles están desactivadas porque este despliegue no puede guardar el registro de auditoría obligatorio."
            )}</div>

            {operationsConfig.mode === "mongodb" ? (
              <div className={styles.managementList}>
                <form method="post" action="/operator/reports/protected-travellers/export" className={styles.editorForm}>
                  <input type="hidden" name="targetType" value="trip" />
                  <div className="eyebrow">{tr(locale, "Trip reservation", "Reserva de viaje")}</div>
                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>{tr(locale, "Active reservation", "Reserva activa")}</span>
                      <select name="targetId" required defaultValue="">
                        <option value="" disabled>{tr(locale, "Choose a reservation", "Selecciona una reserva")}</option>
                        {activeTripReservations.map((reservation) => (
                          <option key={reservation.id} value={reservation.id}>{reservation.tripTitle ?? reservation.tripId} · {reservation.id}</option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Format", "Formato")}</span>
                      <select name="format" defaultValue="xlsx"><option value="xlsx">XLSX</option><option value="csv">CSV</option></select>
                    </label>
                  </div>
                  <label className={styles.field}>
                    <span>{tr(locale, "Operational reason", "Motivo operativo")}</span>
                    <textarea name="reason" minLength={10} maxLength={500} rows={3} required placeholder={tr(locale, "Example: airline manifest preparation for confirmed departure.", "Ejemplo: preparación del manifiesto de la aerolínea para la salida confirmada.")} />
                  </label>
                  <button className="button button-primary" type="submit" disabled={!activeTripReservations.length}>{tr(locale, "Export protected traveller data", "Exportar datos protegidos")}</button>
                </form>

                <form method="post" action="/operator/reports/protected-travellers/export" className={styles.editorForm}>
                  <input type="hidden" name="targetType" value="service" />
                  <div className="eyebrow">{tr(locale, "Service reservation", "Reserva de servicio")}</div>
                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>{tr(locale, "Active reservation", "Reserva activa")}</span>
                      <select name="targetId" required defaultValue="">
                        <option value="" disabled>{tr(locale, "Choose a service reservation", "Selecciona una reserva de servicio")}</option>
                        {activeServices.map((reservation) => (
                          <option key={reservation.id} value={reservation.id}>{reservation.serviceTitle} · {reservation.id}</option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Format", "Formato")}</span>
                      <select name="format" defaultValue="xlsx"><option value="xlsx">XLSX</option><option value="csv">CSV</option></select>
                    </label>
                  </div>
                  <label className={styles.field}>
                    <span>{tr(locale, "Operational reason", "Motivo operativo")}</span>
                    <textarea name="reason" minLength={10} maxLength={500} rows={3} required placeholder={tr(locale, "Example: supplier passenger list required to fulfil this service.", "Ejemplo: lista de pasajeros requerida por el proveedor para prestar este servicio.")} />
                  </label>
                  <button className="button button-primary" type="submit" disabled={!activeServices.length}>{tr(locale, "Export protected traveller data", "Exportar datos protegidos")}</button>
                </form>
              </div>
            ) : null}
          </section>
        ) : null}

        {(canReservations || canFinance) ? (
          <section className={styles.panel} style={{ marginTop: "1rem" }}>
            <div className="eyebrow">{tr(locale, "Audit", "Auditoría")}</div>
            <h2>{identity.role === "admin" ? tr(locale, "Recent export activity", "Actividad reciente de exportaciones") : tr(locale, "My recent exports", "Mis exportaciones recientes")}</h2>
            <p className={styles.lead}>{tr(
              locale,
              "Audit history records metadata about the export, never the exported cell values.",
              "El historial de auditoría registra metadatos de la exportación, nunca los valores de las celdas exportadas."
            )}</p>
            {audit.length ? (
              <div className={styles.auditList}>
                {audit.map((event) => (
                  <div className={styles.auditItem} key={event.id}>
                    <strong>{exportLabel(event.exportType, locale)} · {event.format.toUpperCase()}</strong><br />
                    {event.rowCount} {tr(locale, "rows", "filas")} · {event.sensitive ? tr(locale, "Sensitive", "Sensible") : tr(locale, "Standard", "Estándar")}
                    {identity.role === "admin" ? <><br />{event.actorDisplayName}</> : null}<br />
                    {formatOperatorDate(event.occurredAt.toISOString(), locale, true)}
                  </div>
                ))}
              </div>
            ) : <p className={styles.muted}>{tr(locale, "No export audit events have been recorded yet.", "Todavía no se han registrado eventos de exportación.")}</p>}
          </section>
        ) : null}

        {!canReservations && !canFinance ? (
          <section className={styles.panel} style={{ marginTop: "1rem" }}>
            <div className={styles.notice}>{tr(locale, "This staff account does not have Reservations or Finance permission, so no report datasets are available.", "Esta cuenta de personal no tiene permiso de Reservas ni Finanzas, por lo que no hay datasets de reporting disponibles.")}</div>
          </section>
        ) : null}

        <div className={styles.toolbar}>
          <Link className="button button-secondary" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link>
          {canReservations ? <Link className="button button-secondary" href="/operator/documents">{tr(locale, "Documents", "Documentos")}</Link> : null}
          {canFinance ? <Link className="button button-secondary" href="/operator/payments">{tr(locale, "Payments", "Pagos")}</Link> : null}
        </div>
      </div>
    </main>
  );
}
