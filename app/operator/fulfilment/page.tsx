import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { supplierFulfilmentStatusLabel } from "@/components/operator/supplier-fulfilment-panel";
import type { SupplierFulfilmentComponent, SupplierFulfilmentStatus } from "@/domain/operations/types";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorDate, formatOperatorMoney, tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { isSupplierFulfilmentOverdue, supplierFulfilmentDateKey } from "@/lib/supplier-fulfilment-rules";
import { listSupplierFulfilmentQueue } from "@/lib/supplier-fulfilment";

const views = new Set(["all", "not-requested", "requested", "confirmed", "attention", "cancelled"]);

function targetHref(component: SupplierFulfilmentComponent) {
  if (component.targetType === "trip-reservation") {
    return `/operator/reservations/${encodeURIComponent(component.targetId)}/workflow#fulfilment`;
  }
  return `/operator/tasks/target/service-reservation/${encodeURIComponent(component.targetId)}#fulfilment`;
}

function componentTypeLabel(component: SupplierFulfilmentComponent, locale: "en" | "es") {
  if (component.componentType === "trip") return tr(locale, "Trip", "Viaje");
  if (component.componentType === "accommodation") return tr(locale, "Accommodation", "Alojamiento");
  return tr(locale, "Service", "Servicio");
}

export const metadata = {
  title: "Supplier fulfilment | Kairoseth Travel",
  description: "Protected supplier confirmation queue."
};

export default async function OperatorFulfilmentPage({
  searchParams
}: {
  searchParams: Promise<{ view?: string; fulfilmentUpdated?: string; fulfilmentError?: string }>;
}) {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const query = await searchParams;
  const activeView = query.view && views.has(query.view) ? query.view : "all";
  const rows = await listSupplierFulfilmentQueue();
  const today = supplierFulfilmentDateKey();
  const statusOf = (row: (typeof rows)[number]) => row.item?.status ?? "not-requested" as SupplierFulfilmentStatus;
  const overdueOf = (row: (typeof rows)[number]) => row.item ? isSupplierFulfilmentOverdue(row.item, today) : false;
  const counts = {
    total: rows.filter((row) => statusOf(row) !== "cancelled").length,
    notRequested: rows.filter((row) => statusOf(row) === "not-requested").length,
    requested: rows.filter((row) => statusOf(row) === "requested").length,
    attention: rows.filter((row) => statusOf(row) === "rejected" || overdueOf(row)).length
  };
  const visible = rows.filter((row) => {
    const status = statusOf(row);
    if (activeView === "not-requested") return status === "not-requested";
    if (activeView === "requested") return status === "requested";
    if (activeView === "confirmed") return status === "confirmed";
    if (activeView === "cancelled") return status === "cancelled";
    if (activeView === "attention") return status === "rejected" || overdueOf(row);
    return status !== "cancelled";
  }).sort((a, b) => {
    const aOverdue = overdueOf(a) ? 0 : 1;
    const bOverdue = overdueOf(b) ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    const aDeadline = a.item?.deadline ?? "9999-12-31";
    const bDeadline = b.item?.deadline ?? "9999-12-31";
    return aDeadline.localeCompare(bDeadline) || a.component.componentLabel.localeCompare(b.component.componentLabel);
  });

  return <main className="section"><div className={`container ${styles.shell}`}>
    <section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Supplier operations", "Operaciones de proveedores")}</div>
      <h1>{tr(locale, "Supplier fulfilment", "Gestión de proveedores")}</h1>
      <p className={styles.lead}>{tr(
        locale,
        "See every trip, accommodation and service component that needs supplier follow-up. Internal supplier costs and references never change the customer booking total.",
        "Consulta cada viaje, alojamiento y servicio que requiere seguimiento con proveedor. Los costes y referencias internas nunca modifican el total de la reserva del cliente."
      )}</p>
      <div className={styles.metrics}>
        <div className={styles.metric}><strong>{counts.total}</strong><span>{tr(locale, "Active components", "Componentes activos")}</span></div>
        <div className={styles.metric}><strong>{counts.notRequested}</strong><span>{tr(locale, "Not requested", "No solicitados")}</span></div>
        <div className={styles.metric}><strong>{counts.requested}</strong><span>{tr(locale, "Awaiting confirmation", "Pendientes de confirmación")}</span></div>
        <div className={styles.metric}><strong>{counts.attention}</strong><span>{tr(locale, "Need attention", "Requieren atención")}</span></div>
      </div>
      {query.fulfilmentUpdated ? <div className={styles.notice}>{tr(locale, "Supplier tracking updated.", "Seguimiento de proveedor actualizado.")}</div> : null}
      {query.fulfilmentError ? <div className={styles.notice}>{tr(locale, "The supplier change could not be saved. Open the linked component to review it.", "No se pudo guardar el cambio del proveedor. Abre el componente vinculado para revisarlo.")}</div> : null}
      <div className={styles.actions}>
        <Link className="button button-secondary" href="/operator/fulfilment">{tr(locale, "Active", "Activos")}</Link>
        <Link className="button button-secondary" href="/operator/fulfilment?view=not-requested">{tr(locale, "Not requested", "No solicitados")}</Link>
        <Link className="button button-secondary" href="/operator/fulfilment?view=requested">{tr(locale, "Requested", "Solicitados")}</Link>
        <Link className="button button-secondary" href="/operator/fulfilment?view=confirmed">{tr(locale, "Confirmed", "Confirmados")}</Link>
        <Link className="button button-secondary" href="/operator/fulfilment?view=attention">{tr(locale, "Attention", "Atención")}</Link>
        <Link className="button button-secondary" href="/operator/fulfilment?view=cancelled">{tr(locale, "Cancelled", "Cancelados")}</Link>
      </div>
    </section>

    <section className={styles.panel} style={{ marginTop: "1rem" }}>
      <div className="eyebrow">{tr(locale, "Fulfilment queue", "Cola de confirmaciones")}</div>
      <h2>{visible.length} {tr(locale, "components", "componentes")}</h2>
      {visible.length ? <div className={styles.managementList}>{visible.map((row) => {
        const status = statusOf(row);
        const overdue = overdueOf(row);
        return <Link className={styles.managementRow} href={targetHref(row.component)} key={`${row.component.targetType}-${row.component.targetId}-${row.component.componentKey}`}>
          <div>
            <strong>{row.component.componentLabel}</strong><br />
            <span>{componentTypeLabel(row.component, locale)} · {row.component.targetId}</span>
          </div>
          <span className={styles.badge}>{supplierFulfilmentStatusLabel(status, locale)}</span>
          <span>{row.item?.supplierName ?? tr(locale, "Supplier not assigned", "Proveedor sin asignar")}</span>
          <span>{row.item?.supplierReference ? `${tr(locale, "Ref.", "Ref.")} ${row.item.supplierReference}` : "—"}</span>
          <span>{row.item?.deadline ? <>{formatOperatorDate(`${row.item.deadline}T12:00:00Z`, locale)}{overdue ? ` · ${tr(locale, "Overdue", "Vencido")}` : ""}</> : tr(locale, "No deadline", "Sin fecha límite")}</span>
          <span>{row.item?.supplierCost !== undefined ? formatOperatorMoney(row.item.supplierCost, row.item.supplierCurrency ?? row.component.customerCurrency, locale, 2) : "—"}</span>
        </Link>;
      })}</div> : <p className={styles.muted}>{tr(locale, "No supplier components match this view.", "No hay componentes de proveedor que coincidan con esta vista.")}</p>}
      <p><Link className="text-link" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link></p>
    </section>
  </div></main>;
}
