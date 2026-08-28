import styles from "@/app/operator/operator.module.css";
import {
  addSupplierFulfilmentNoteAction,
  runSupplierAdapterAction,
  saveSupplierFulfilmentAction
} from "@/app/operator/fulfilment/actions";
import { setSupplierReferenceDisclosureAction } from "@/app/operator/fulfilment/reference-actions";
import type {
  SupplierFulfilmentComponent,
  SupplierFulfilmentEvent,
  SupplierFulfilmentItem,
  SupplierFulfilmentNote,
  SupplierFulfilmentStatus
} from "@/domain/operations/types";
import type { TravelLocale } from "@/domain/travel/types";
import { listSupplierReferenceDisclosures } from "@/lib/customer-document-references";
import { formatOperatorDate, formatOperatorMoney, tr } from "@/lib/operator-i18n";
import { isSupplierFulfilmentAdapterConfigured } from "@/lib/supplier-fulfilment-adapter-config";
import { isSupplierFulfilmentOverdue, supplierFulfilmentDateKey } from "@/lib/supplier-fulfilment-rules";
import {
  listSupplierAdapterAuditForTarget,
  type SupplierFulfilmentAdapterAuditEvent
} from "@/lib/supplier-fulfilment-sync";

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

function adapterOperationLabel(event: SupplierFulfilmentAdapterAuditEvent, locale: TravelLocale) {
  if (event.operation === "request") return tr(locale, "External request", "Solicitud externa");
  if (event.operation === "cancel") return tr(locale, "External cancellation", "Cancelación externa");
  return tr(locale, "External status sync", "Sincronización externa de estado");
}

function adapterOutcomeLabel(event: SupplierFulfilmentAdapterAuditEvent, locale: TravelLocale) {
  if (event.outcome === "applied") return tr(locale, "Applied", "Aplicado");
  if (event.outcome === "no-change") return tr(locale, "No local change", "Sin cambio local");
  if (event.outcome === "conflict") return tr(locale, "Local transition conflict", "Conflicto de transición local");
  if (event.outcome === "failed") return tr(locale, "Failed", "Fallido");
  return tr(locale, "Response received", "Respuesta recibida");
}

export async function SupplierFulfilmentPanel({
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
    "update-failed": tr(locale, "The supplier tracking change could not be saved.", "No se pudo guardar el cambio de seguimiento del proveedor."),
    "adapter-disabled": tr(locale, "The external supplier adapter is disabled in this deployment.", "El adapter externo de proveedores está desactivado en este despliegue."),
    "adapter-unavailable": tr(locale, "The external supplier adapter is temporarily unavailable.", "El adapter externo de proveedores no está disponible temporalmente."),
    "adapter-config": tr(locale, "Review the server-only supplier adapter configuration.", "Revisa la configuración server-only del adapter de proveedores."),
    "adapter-supplier-required": tr(locale, "Save a supplier locally before sending an external request.", "Guarda primero el proveedor localmente antes de enviar una solicitud externa."),
    "adapter-invalid-operation": tr(locale, "That external supplier operation is not allowed from the current state.", "Esa operación externa de proveedor no está permitida desde el estado actual."),
    "adapter-fulfilment-not-found": tr(locale, "The local supplier record no longer exists.", "El registro local del proveedor ya no existe."),
    "adapter-auth": tr(locale, "The supplier API rejected server authentication.", "La API del proveedor rechazó la autenticación del servidor."),
    "adapter-not-found": tr(locale, "The supplier API could not find this fulfilment request.", "La API del proveedor no encontró esta solicitud de fulfilment."),
    "adapter-conflict": tr(locale, "The supplier response conflicts with the current local state and was not forced.", "La respuesta del proveedor entra en conflicto con el estado local actual y no se ha forzado."),
    "adapter-rejected": tr(locale, "The supplier API rejected the operation.", "La API del proveedor rechazó la operación."),
    "adapter-rate-limited": tr(locale, "The supplier API is rate limited. Try again later.", "La API del proveedor está limitada temporalmente. Inténtalo más tarde."),
    "adapter-timeout": tr(locale, "The supplier API did not respond before the timeout.", "La API del proveedor no respondió antes del timeout."),
    "adapter-network": tr(locale, "The supplier API could not be reached.", "No se pudo conectar con la API del proveedor."),
    "adapter-contract": tr(locale, "The supplier API response does not match the supported contract version.", "La respuesta de la API del proveedor no cumple la versión de contrato soportada."),
    "adapter-response-too-large": tr(locale, "The supplier API response exceeded the configured safety limit.", "La respuesta de la API del proveedor superó el límite de seguridad configurado."),
    "adapter-audit": tr(locale, "The external response could not be audited, so it was not applied locally.", "La respuesta externa no pudo auditarse, por lo que no se aplicó localmente."),
    "reference-disclosure-unavailable": tr(locale, "Customer voucher reference controls are unavailable in this deployment.", "Los controles de referencia para vouchers de cliente no están disponibles en este despliegue."),
    "reference-required": tr(locale, "Save a supplier reference before allowing it on customer vouchers.", "Guarda una referencia de proveedor antes de permitirla en vouchers del cliente."),
    "invalid-reference-disclosure": tr(locale, "The customer voucher reference setting is invalid.", "La configuración de referencia del voucher de cliente no es válida."),
    "reference-disclosure-failed": tr(locale, "The customer voucher reference setting could not be saved.", "No se pudo guardar la configuración de referencia para el voucher del cliente.")
  };
  const itemByKey = new Map(items.map((item) => [item.componentKey, item]));
  const disclosures = await listSupplierReferenceDisclosures(items.map((item) => item.id)).catch(() => []);
  const disclosureByFulfilmentId = new Map(disclosures.map((item) => [item.fulfilmentId, item]));
  const adapterConfigured = isSupplierFulfilmentAdapterConfigured();
  const firstComponent = components[0];
  const adapterAudit = firstComponent && adapterConfigured
    ? await listSupplierAdapterAuditForTarget(firstComponent.targetType, firstComponent.targetId).catch(() => [])
    : [];
  const today = supplierFulfilmentDateKey();
  const hasError = Boolean(error && errors[error]);
  const supplierInvalid = error === "supplier-required" || error === "invalid-fulfilment";
  const statusInvalid = error === "invalid-transition" || error === "invalid-fulfilment";
  const costInvalid = error === "invalid-cost" || error === "invalid-fulfilment";
  const noteInvalid = error === "invalid-note";

  return (
    <section className={styles.panel} id="fulfilment" style={{ marginTop: "1rem" }} aria-labelledby="fulfilment-title">
      <div className="eyebrow">{tr(locale, "Supplier fulfilment", "Gestión de proveedores")}</div>
      <h2 id="fulfilment-title">{tr(locale, "Supplier confirmations", "Confirmaciones de proveedores")}</h2>
      <p className={styles.lead}>{tr(
        locale,
        "Track each operational component without changing the customer's booking price or payment ledger. Supplier costs and notes always remain staff-only. A supplier reference appears on customer vouchers only after explicit approval below.",
        "Haz seguimiento de cada componente operativo sin modificar el precio de la reserva del cliente ni el historial de pagos. Los costes y notas del proveedor siempre son internos. Una referencia solo aparece en vouchers del cliente tras aprobarla explícitamente aquí."
      )}</p>
      <p className={styles.muted}>{adapterConfigured
        ? tr(locale, "External supplier API synchronization is enabled. External responses still pass local transition rules and are audited before application.", "La sincronización con API externa de proveedores está habilitada. Las respuestas externas siguen pasando por las reglas locales de transición y se auditan antes de aplicarse.")
        : tr(locale, "External supplier API synchronization is disabled; manual supplier tracking remains fully available.", "La sincronización con API externa de proveedores está desactivada; el seguimiento manual sigue totalmente disponible.")}</p>
      {updated === "saved" ? <div id="fulfilment-status" className={styles.notice} role="status" aria-live="polite">{tr(locale, "Supplier tracking updated.", "Seguimiento del proveedor actualizado.")}</div> : null}
      {updated === "note" ? <div id="fulfilment-status" className={styles.notice} role="status" aria-live="polite">{tr(locale, "Supplier note added.", "Nota del proveedor añadida.")}</div> : null}
      {updated === "reference-disclosure" ? <div id="fulfilment-status" className={styles.notice} role="status" aria-live="polite">{tr(locale, "Customer voucher reference policy updated.", "Política de referencia para vouchers del cliente actualizada.")}</div> : null}
      {updated?.startsWith("adapter-") ? <div id="fulfilment-status" className={styles.notice} role="status" aria-live="polite">{tr(locale, "External supplier synchronization completed.", "Sincronización externa con proveedor completada.")}</div> : null}
      {hasError ? <div id="fulfilment-error" className={styles.notice} role="alert" aria-live="assertive">{errors[error!]}</div> : null}

      <div className={styles.managementList}>
        {components.map((component) => {
          const item = itemByKey.get(component.componentKey);
          const status = item?.status ?? "not-requested";
          const overdue = item ? isSupplierFulfilmentOverdue(item, today) : false;
          const itemEvents = item ? events.filter((event) => event.fulfilmentId === item.id) : [];
          const itemNotes = item ? notes.filter((note) => note.fulfilmentId === item.id) : [];
          const itemAdapterAudit = item ? adapterAudit.filter((entry) => entry.fulfilmentId === item.id) : [];
          const timeline = [
            ...itemEvents.map((event) => ({ kind: "event" as const, at: event.occurredAt, event })),
            ...itemNotes.map((note) => ({ kind: "note" as const, at: note.createdAt, note }))
          ].sort((a, b) => b.at.localeCompare(a.at));
          const disclosure = item ? disclosureByFulfilmentId.get(item.id) : undefined;
          const referenceIsApproved = Boolean(
            item?.supplierReference &&
            disclosure?.visible === true &&
            disclosure.approvedReference === item.supplierReference
          );
          const componentTitleId = `fulfilment-${component.componentKey}-title`;

          return (
            <article className={styles.editorSection} key={component.componentKey} aria-labelledby={componentTitleId}>
              <div>
                <div className="eyebrow">{componentTypeLabel(component, locale)}</div>
                <h3 id={componentTitleId}>{component.componentLabel}</h3>
                <div className={styles.actions} aria-label={tr(locale, `Current supplier state for ${component.componentLabel}`, `Estado actual del proveedor para ${component.componentLabel}`)}>
                  <span className={styles.badge}>{supplierFulfilmentStatusLabel(status, locale)}</span>
                  {overdue ? <span className={styles.badge}>{tr(locale, "Overdue", "Vencido")}</span> : null}
                  {item?.supplierName ? <span>{item.supplierName}</span> : null}
                  {item?.supplierReference ? <span>{tr(locale, "Ref.", "Ref.")} {item.supplierReference}</span> : null}
                </div>
              </div>

              <form action={saveSupplierFulfilmentAction} className={styles.editorForm} aria-label={tr(locale, `Supplier tracking for ${component.componentLabel}`, `Seguimiento de proveedor para ${component.componentLabel}`)} aria-describedby={hasError && !noteInvalid ? "fulfilment-error" : undefined}>
                <input type="hidden" name="targetType" value={component.targetType} />
                <input type="hidden" name="targetId" value={component.targetId} />
                <input type="hidden" name="componentKey" value={component.componentKey} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>{tr(locale, "Status", "Estado")}</span>
                    <select name="status" defaultValue={status} disabled={!writesEnabled || status === "cancelled"} aria-invalid={statusInvalid ? "true" : undefined}>
                      {allowedStatuses(status).map((option) => <option value={option} key={option}>{supplierFulfilmentStatusLabel(option, locale)}</option>)}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Supplier", "Proveedor")}</span>
                    <input name="supplierName" defaultValue={item?.supplierName ?? ""} maxLength={160} disabled={!writesEnabled || status === "cancelled"} placeholder={tr(locale, "Supplier or hotel company", "Proveedor o empresa hotelera")} aria-invalid={supplierInvalid ? "true" : undefined} />
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Supplier reference", "Referencia del proveedor")}</span>
                    <input name="supplierReference" defaultValue={item?.supplierReference ?? ""} maxLength={160} disabled={!writesEnabled || status === "cancelled"} placeholder={tr(locale, "Confirmation / locator", "Confirmación / localizador")} />
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Supplier cost", "Coste proveedor")}</span>
                    <input name="supplierCost" type="number" min="0" max="1000000000" step="0.01" defaultValue={item?.supplierCost ?? ""} disabled={!writesEnabled || status === "cancelled"} aria-invalid={costInvalid ? "true" : undefined} />
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Cost currency", "Moneda del coste")}</span>
                    <select name="supplierCurrency" defaultValue={item?.supplierCurrency ?? component.customerCurrency} disabled={!writesEnabled || status === "cancelled"} aria-invalid={costInvalid ? "true" : undefined}>
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

              {adapterConfigured && writesEnabled ? (
                item ? (
                  <div className={styles.editorForm} role="group" aria-label={tr(locale, `External supplier actions for ${component.componentLabel}`, `Acciones externas de proveedor para ${component.componentLabel}`)}>
                    <strong>{tr(locale, "External supplier API", "API externa del proveedor")}</strong>
                    <p className={styles.muted}>{tr(locale, "Only operational component identifiers, supplier name/reference and deadline are sent. Prices, payment ledger and protected traveller data are excluded.", "Solo se envían identificadores operativos del componente, proveedor/referencia y fecha límite. Se excluyen precios, historial de pagos y datos protegidos del viajero.")}</p>
                    <div className={styles.actions}>
                      {(status === "not-requested" || status === "rejected") ? (
                        <form action={runSupplierAdapterAction}>
                          <input type="hidden" name="fulfilmentId" value={item.id} />
                          <input type="hidden" name="operation" value="request" />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <button className="button button-secondary" type="submit">{status === "rejected" ? tr(locale, "Request again", "Solicitar de nuevo") : tr(locale, "Send supplier request", "Enviar solicitud al proveedor")}</button>
                        </form>
                      ) : null}
                      {status !== "not-requested" && status !== "cancelled" ? (
                        <form action={runSupplierAdapterAction}>
                          <input type="hidden" name="fulfilmentId" value={item.id} />
                          <input type="hidden" name="operation" value="status" />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <button className="button button-secondary" type="submit">{tr(locale, "Sync supplier status", "Sincronizar estado")}</button>
                        </form>
                      ) : null}
                      {status !== "not-requested" && status !== "cancelled" ? (
                        <form action={runSupplierAdapterAction}>
                          <input type="hidden" name="fulfilmentId" value={item.id} />
                          <input type="hidden" name="operation" value="cancel" />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <button className="button button-secondary" type="submit">{tr(locale, "Cancel with supplier", "Cancelar con proveedor")}</button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className={styles.muted}>{tr(locale, "Save the supplier locally once before using the external adapter.", "Guarda el proveedor localmente una vez antes de usar el adapter externo.")}</p>
                )
              ) : null}

              {itemAdapterAudit.length ? (
                <div className={styles.auditList} aria-label={tr(locale, `External supplier audit for ${component.componentLabel}`, `Auditoría externa de proveedor para ${component.componentLabel}`)}>
                  {itemAdapterAudit.map((entry) => (
                    <div className={styles.auditItem} key={entry.id}>
                      <strong>{adapterOperationLabel(entry, locale)} · {adapterOutcomeLabel(entry, locale)}</strong><br />
                      {entry.responseStatus ? <>{tr(locale, "External status", "Estado externo")}: {entry.responseStatus}<br /></> : null}
                      {entry.responseReference ? <>{tr(locale, "External reference", "Referencia externa")}: {entry.responseReference}<br /></> : null}
                      {entry.providerMessage ? <>{tr(locale, "Provider message", "Mensaje del proveedor")}: {entry.providerMessage}<br /></> : null}
                      {entry.errorCode ? <>{tr(locale, "Error code", "Código de error")}: {entry.errorCode}<br /></> : null}
                      <span>{entry.actorDisplayName} · {entry.adapterId}</span><br />
                      {formatOperatorDate(entry.occurredAt, locale, true)}
                    </div>
                  ))}
                </div>
              ) : null}

              {item?.supplierReference ? (
                <div className={styles.editorForm}>
                  <div className={styles.notice} role="status" aria-live="polite">
                    <strong>{tr(locale, "Customer voucher reference", "Referencia en voucher del cliente")}: {referenceIsApproved ? tr(locale, "APPROVED", "APROBADA") : tr(locale, "HIDDEN", "OCULTA")}</strong><br />
                    {referenceIsApproved
                      ? tr(locale, "This exact reference may be printed on customer-facing vouchers. If the supplier reference changes, this approval automatically becomes invalid.", "Esta referencia exacta puede imprimirse en vouchers orientados al cliente. Si cambia la referencia del proveedor, la aprobación queda invalidada automáticamente.")
                      : tr(locale, "The reference remains internal. Approve it only after confirming that the locator is safe and useful for the customer.", "La referencia permanece interna. Apruébala solo después de confirmar que el localizador es seguro y útil para el cliente.")}
                  </div>
                  {writesEnabled ? (
                    <form action={setSupplierReferenceDisclosureAction} aria-label={tr(locale, `Customer voucher reference for ${component.componentLabel}`, `Referencia de voucher de cliente para ${component.componentLabel}`)}>
                      <input type="hidden" name="fulfilmentId" value={item.id} />
                      <input type="hidden" name="visible" value={referenceIsApproved ? "0" : "1"} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button className="button button-secondary" type="submit">
                        {referenceIsApproved
                          ? tr(locale, "Hide from customer vouchers", "Ocultar en vouchers del cliente")
                          : tr(locale, "Approve for customer vouchers", "Aprobar para vouchers del cliente")}
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : null}

              {item ? (
                <form action={addSupplierFulfilmentNoteAction} className={styles.editorForm} aria-label={tr(locale, `Add supplier note for ${component.componentLabel}`, `Añadir nota de proveedor para ${component.componentLabel}`)} aria-describedby={noteInvalid ? "fulfilment-error" : undefined}>
                  <input type="hidden" name="fulfilmentId" value={item.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <label className={styles.field}>
                    <span>{tr(locale, "Internal supplier note", "Nota interna de proveedor")}</span>
                    <textarea name="body" rows={3} maxLength={2000} required disabled={!writesEnabled} placeholder={tr(locale, "Example: hotel asked for rooming list before Friday.", "Ejemplo: el hotel solicita la rooming list antes del viernes.")} aria-invalid={noteInvalid ? "true" : undefined} />
                  </label>
                  {writesEnabled ? <button className="button button-secondary" type="submit">{tr(locale, "Add supplier note", "Añadir nota de proveedor")}</button> : null}
                </form>
              ) : (
                <p className={styles.muted}>{tr(locale, "Save this component once before adding supplier notes.", "Guarda este componente una vez antes de añadir notas de proveedor.")}</p>
              )}

              {timeline.length ? (
                <div className={styles.auditList} aria-label={tr(locale, `Supplier history for ${component.componentLabel}`, `Historial de proveedor para ${component.componentLabel}`)}>
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