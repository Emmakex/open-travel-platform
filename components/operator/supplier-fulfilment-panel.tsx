import styles from "@/app/operator/operator.module.css";
import {
  addSupplierFulfilmentNoteAction,
  saveSupplierFulfilmentAction
} from "@/app/operator/fulfilment/actions";
import type {
  SupplierFulfilmentComponent,
  SupplierFulfilmentEvent,
  SupplierFulfilmentItem,
  SupplierFulfilmentNote,
  SupplierFulfilmentStatus
} from "@/domain/operations/types";
import type { TravelLocale } from "@/domain/travel/types";
import { formatOperatorDate, formatOperatorMoney, tr } from "@/lib/operator-i18n";
import { isSupplierFulfilmentOverdue, supplierFulfilmentDateKey } from "@/lib/supplier-fulfilment-rules";

const statusOrder: SupplierFulfilmentStatus[] = ["not-requested", "requested", "confirmed", "rejected", "cancelled"];

export function supplierFulfilmentStatusLabel(status: SupplierFulfilmentStatus, locale: TravelLocale) {
  const labels: Record<SupplierFulfilmentStatus, [string, string]> = {
    "not-requested": ["Not requested", "No solicitado"],
    requested: ["Requested", "Solicitado"],
    confirmed: ["Confirmed", "Confirmado"],
    rejected: ["Rejected", "Rechazado"],
    cancelled: ["Cancelled", "Cancelado"]
  };
  return locale === "es" ? labels[status][1] : labels[status][0];
}

function allowedStatuses(current: SupplierFulfilmentStatus) {
  if (current === "cancelled") return ["cancelled"] as SupplierFulfilmentStatus[];
  if (current === "not-requested") return ["not-requested", "requested", "cancelled"] as SupplierFulfilmentStatus[];
  if (current === "requested") return ["requested", "confirmed", "rejected", "cancelled"] as SupplierFulfilmentStatus[];
  return [current, "requested", "cancelled"] as SupplierFulfilmentStatus[];
}

function componentTypeLabel(component: SupplierFulfilmentComponent, locale: TravelLocale) {
  if (component.componentType === "trip") return tr(locale, "Trip package", "Paquete de viaje");
  if (component.componentType === "accommodation") return tr(locale, "Accommodation", "Alojamiento");
  return tr(locale, "Service", "Servicio");
}

function eventFieldLabel(field: SupplierFulfilmentEvent["changes"][number]["field"], locale: TravelLocale) {
  if (field === "supplier") return tr(locale, "Supplier", "Proveedor");
  if (field === "status") return tr(locale, "Status", "Estado");
  if (field === "reference") return tr(locale, "Supplier reference", "Referencia del proveedor");
  if (field === "cost") return tr(locale, "Supplier cost", "Coste proveedor");
  return tr(locale, "Deadline", "Fecha límite");
}

function eventValue(
  field: SupplierFulfilmentEvent["changes"][number]["field"],
  value: string,
  locale: TravelLocale
) {
  if (!value) return "—";
  if (field === "status" && statusOrder.includes(value as SupplierFulfilmentStatus)) {
    return supplierFulfilmentStatusLabel(value as SupplierFulfilmentStatus, locale);
  }
  if (field === "cost") {
    const [amount, currency] = value.split("|");
    const number = Number(amount);
    return Number.isFinite(number) && currency
      ? formatOperatorMoney(number, currency, locale, 2)
      : value;
  }
  if (field === "deadline") return formatOperatorDate(`${value}T12:00:00Z`, locale);
  return value;
}

export function SupplierFulfilmentPanel({
  components,
  items,
  events,
  notes,
  locale,
  writesEnabled,
  returnTo,
  updated,
  error
}: {
  components: SupplierFulfilmentComponent[];
  items: SupplierFulfilmentItem[];
  events: SupplierFulfilmentEvent[];
  notes: SupplierFulfilmentNote[];
  locale: TravelLocale;
  writesEnabled: boolean;
  returnTo: string;
  updated?: string;
  error?: string;
}) {
  const errors: Record<string, string> = {
    "fulfilment-unavailable": tr(locale, "Supplier tracking is unavailable in this deployment.", "El seguimiento de proveedores no está disponible en este despliegue."),
    "target-not-found": tr(locale, "The linked reservation could not be found.", "No se ha encontrado la reserva vinculada."),
    "component-not-found": tr(locale, "The linked component no longer exists on this reservation.", "El componente vinculado ya no existe en esta reserva."),
    "fulfilment-not-found": tr(locale, "The supplier tracking record could not be found.", "No se ha encontrado el registro de seguimiento del proveedor."),
    "supplier-required": tr(locale, "Choose or enter a supplier before requesting or confirming this component.", "Indica un proveedor antes de solicitar o confirmar este componente."),
    "invalid-cost": tr(locale, "Review the supplier cost and currency.", "Revisa el coste del proveedor y la moneda."),
    "invalid-transition": tr(locale, "That supplier status change is not allowed from the current state.", "Ese cambio de estado del proveedor no está permitido desde el estado actual."),
    "invalid-note": tr(locale, "Write an internal supplier note of up to 2,000 characters.", "Escribe una nota interna de proveedor de hasta 2.000 caracteres."),
    "invalid-fulfilment": tr(locale, "Review the supplier, status, cost and deadline before saving.", "Revisa proveedor, estado, coste y fecha límite antes de guardar."),
    "no-changes": tr(locale, "No supplier changes were detected.", "No se detectaron cambios del proveedor."),
    "update-failed": tr(locale, "The supplier tracking change could not be saved.", "No se pudo guardar el cambio de seguimiento del proveedor.")
  };
  const itemByKey = new Map(items.map((item) => [item.componentKey, item]));
  const today = supplierFulfilmentDateKey();

  return (
    <section className={styles.panel} id="fulfilment" style={{ marginTop: "1rem" }}>
      <div className="eyebrow">{tr(locale, "Supplier fulfilment", "Gestión de proveedores")}</div>
      <h2>{tr(locale, "Supplier confirmations", "Confirmaciones de proveedores")}</h2>
      <p className={styles.lead}>{tr(
        locale,
        "Track each operational component without changing the customer's booking price or payment ledger. Supplier references, costs and notes are staff-only.",
        "Haz seguimiento de cada componente operativo sin modificar el precio de la reserva del cliente ni el historial de pagos. Las referencias, costes y notas de proveedor son solo internas."
      )}</p>
      {updated === "saved" ? <div className={styles.notice}>{tr(locale, "Supplier tracking updated.", "Seguimiento del proveedor actualizado.")}</div> : null}
      {updated === "note" ? <div className={styles.notice}>{tr(locale, "Supplier note added.", "Nota del proveedor añadida.")}</div> : null}
      {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}

      <div className={styles.managementList}>
        {components.map((component) => {
          const item = itemByKey.get(component.componentKey);
          const status = item?.status ?? "not-requested";
          const overdue = item ? isSupplierFulfilmentOverdue(item, today) : false;
          const itemEvents = item ? events.filter((event) => event.fulfilmentId === item.id) : [];
          const itemNotes = item ? notes.filter((note) => note.fulfilmentId === item.id) : [];
          const timeline = [
            ...itemEvents.map((event) => ({ kind: "event" as const, at: event.occurredAt, event })),
            ...itemNotes.map((note) => ({ kind: "note" as const, at: note.createdAt, note }))
          ].sort((a, b) => b.at.localeCompare(a.at));

          return (
            <article className={styles.editorSection} key={component.componentKey}>
              <div>
                <div className="eyebrow">{componentTypeLabel(component, locale)}</div>
                <h3>{component.componentLabel}</h3>
                <div className={styles.actions}>
                  <span className={styles.badge}>{supplierFulfilmentStatusLabel(status, locale)}</span>
                  {overdue ? <span className={styles.badge}>{tr(locale, "Overdue", "Vencido")}</span> : null}
                  {item?.supplierName ? <span>{item.supplierName}</span> : null}
                  {item?.supplierReference ? <span>{tr(locale, "Ref.", "Ref.")} {item.supplierReference}</span> : null}
                </div>
              </div>

              <form action={saveSupplierFulfilmentAction} className={styles.editorForm}>
                <input type="hidden" name="targetType" value={component.targetType} />
                <input type="hidden" name="targetId" value={component.targetId} />
                <input type="hidden" name="componentKey" value={component.componentKey} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>{tr(locale, "Status", "Estado")}</span>
                    <select name="status" defaultValue={status} disabled={!writesEnabled || status === "cancelled"}>
                      {allowedStatuses(status).map((option) => <option value={option} key={option}>{supplierFulfilmentStatusLabel(option, locale)}</option>)}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Supplier", "Proveedor")}</span>
                    <input name="supplierName" defaultValue={item?.supplierName ?? ""} maxLength={160} disabled={!writesEnabled || status === "cancelled"} placeholder={tr(locale, "Supplier or hotel company", "Proveedor o empresa hotelera")} />
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Supplier reference", "Referencia del proveedor")}</span>
                    <input name="supplierReference" defaultValue={item?.supplierReference ?? ""} maxLength={160} disabled={!writesEnabled || status === "cancelled"} placeholder={tr(locale, "Confirmation / locator", "Confirmación / localizador")} />
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Supplier cost", "Coste proveedor")}</span>
                    <input name="supplierCost" type="number" min="0" max="1000000000" step="0.01" defaultValue={item?.supplierCost ?? ""} disabled={!writesEnabled || status === "cancelled"} />
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Cost currency", "Moneda del coste")}</span>
                    <select name="supplierCurrency" defaultValue={item?.supplierCurrency ?? component.customerCurrency} disabled={!writesEnabled || status === "cancelled"}>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Confirmation deadline", "Fecha límite de confirmación")}</span>
                    <input name="deadline" type="date" defaultValue={item?.deadline ?? ""} disabled={!writesEnabled || status === "cancelled"} />
                  </label>
                </div>
                {item?.supplierCost !== undefined ? (
                  <p className={styles.muted}>{tr(locale, "Current internal supplier cost", "Coste interno actual del proveedor")}: <strong>{formatOperatorMoney(item.supplierCost, item.supplierCurrency ?? component.customerCurrency, locale, 2)}</strong></p>
                ) : null}
                {writesEnabled && status !== "cancelled" ? <button className="button button-primary" type="submit">{tr(locale, "Save supplier tracking", "Guardar seguimiento")}</button> : null}
              </form>

              {item ? (
                <form action={addSupplierFulfilmentNoteAction} className={styles.editorForm}>
                  <input type="hidden" name="fulfilmentId" value={item.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <label className={styles.field}>
                    <span>{tr(locale, "Internal supplier note", "Nota interna de proveedor")}</span>
                    <textarea name="body" rows={3} maxLength={2000} required disabled={!writesEnabled} placeholder={tr(locale, "Example: hotel asked for rooming list before Friday.", "Ejemplo: el hotel solicita la rooming list antes del viernes.")} />
                  </label>
                  {writesEnabled ? <button className="button button-secondary" type="submit">{tr(locale, "Add supplier note", "Añadir nota de proveedor")}</button> : null}
                </form>
              ) : (
                <p className={styles.muted}>{tr(locale, "Save this component once before adding supplier notes.", "Guarda este componente una vez antes de añadir notas de proveedor.")}</p>
              )}

              {timeline.length ? (
                <div className={styles.auditList}>
                  {timeline.map((entry) => entry.kind === "note" ? (
                    <div className={styles.auditItem} key={entry.note.id}>
                      <strong>{tr(locale, "Supplier note", "Nota de proveedor")}</strong><br />
                      {entry.note.body}<br />
                      <span>{entry.note.authorDisplayName}</span><br />
                      {formatOperatorDate(entry.note.createdAt, locale, true)}
                    </div>
                  ) : (
                    <div className={styles.auditItem} key={entry.event.id}>
                      <strong>{tr(locale, "Supplier tracking updated", "Seguimiento de proveedor actualizado")}</strong><br />
                      {entry.event.changes.map((change) => (
                        <span key={`${entry.event.id}-${change.field}`}>
                          {eventFieldLabel(change.field, locale)}: {eventValue(change.field, change.before, locale)} → {eventValue(change.field, change.after, locale)}<br />
                        </span>
                      ))}
                      <span>{entry.event.actorDisplayName}</span><br />
                      {formatOperatorDate(entry.event.occurredAt, locale, true)}
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
