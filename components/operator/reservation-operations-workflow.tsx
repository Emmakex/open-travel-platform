import styles from "@/app/operator/operator.module.css";
import {
  addReservationInternalNoteAction,
  saveReservationOperationsAction
} from "@/app/operator/reservations/operations-actions";
import type {
  ReservationInternalNote,
  ReservationOperationsEvent,
  ReservationOperationsState,
  ReservationPriority,
  StaffRole
} from "@/domain/operations/types";
import type { TravelLocale } from "@/domain/travel/types";
import { formatOperatorDate, staffRoleLabel, tr } from "@/lib/operator-i18n";

type StaffOption = {
  id: string;
  displayName: string;
  role: StaffRole;
  status: "active" | "disabled";
};

function priorityLabel(priority: ReservationPriority, locale: TravelLocale) {
  const labels: Record<ReservationPriority, [string, string]> = {
    low: ["Low", "Baja"],
    normal: ["Normal", "Normal"],
    high: ["High", "Alta"],
    urgent: ["Urgent", "Urgente"]
  };
  return locale === "es" ? labels[priority][1] : labels[priority][0];
}

function fieldLabel(field: ReservationOperationsEvent["changes"][number]["field"], locale: TravelLocale) {
  if (field === "owner") return tr(locale, "Owner", "Responsable");
  if (field === "priority") return tr(locale, "Priority", "Prioridad");
  return tr(locale, "Tags", "Etiquetas");
}

function changeValue(field: ReservationOperationsEvent["changes"][number]["field"], value: string, locale: TravelLocale) {
  if (!value) return field === "owner"
    ? tr(locale, "Unassigned", "Sin asignar")
    : field === "tags"
      ? tr(locale, "No tags", "Sin etiquetas")
      : "—";
  if (field === "priority" && ["low", "normal", "high", "urgent"].includes(value)) {
    return priorityLabel(value as ReservationPriority, locale);
  }
  return value;
}

export function ReservationOperationsWorkflow({
  reservationId,
  state,
  notes,
  events,
  staffOptions,
  locale,
  writesEnabled,
  updated,
  error
}: {
  reservationId: string;
  state: ReservationOperationsState;
  notes: ReservationInternalNote[];
  events: ReservationOperationsEvent[];
  staffOptions: StaffOption[];
  locale: TravelLocale;
  writesEnabled: boolean;
  updated?: string;
  error?: string;
}) {
  const errors: Record<string, string> = {
    "workflow-unavailable": tr(locale, "Internal workflow management is unavailable in this deployment.", "La gestión operativa interna no está disponible en este despliegue."),
    "invalid-request": tr(locale, "Review the owner, priority and tags before saving.", "Revisa responsable, prioridad y etiquetas antes de guardar."),
    "invalid-owner": tr(locale, "The selected owner is no longer an active staff account.", "El responsable seleccionado ya no es una cuenta activa del equipo."),
    "invalid-priority": tr(locale, "Choose a valid reservation priority.", "Selecciona una prioridad válida para la reserva."),
    "invalid-tags": tr(locale, "Use up to 10 tags, with a maximum of 40 characters each.", "Usa hasta 10 etiquetas, con un máximo de 40 caracteres cada una."),
    "invalid-note": tr(locale, "Write an internal note of up to 2,000 characters.", "Escribe una nota interna de hasta 2.000 caracteres."),
    "no-changes": tr(locale, "No operational changes were detected.", "No se detectaron cambios operativos."),
    "not-found": tr(locale, "The reservation could not be found.", "No se ha encontrado la reserva."),
    "update-failed": tr(locale, "The internal workflow change could not be saved.", "No se pudo guardar el cambio operativo interno.")
  };
  const timeline = [
    ...notes.map((note) => ({ kind: "note" as const, at: note.createdAt, note })),
    ...events.map((event) => ({ kind: "event" as const, at: event.occurredAt, event }))
  ].sort((a, b) => b.at.localeCompare(a.at));
  const currentOwnerIncluded = !state.ownerStaffId || staffOptions.some((item) => item.id === state.ownerStaffId);
  const hasError = Boolean(error && errors[error]);
  const workflowError = hasError && error !== "invalid-note";
  const noteError = error === "invalid-note";
  const ownerInvalid = error === "invalid-owner" || error === "invalid-request";
  const priorityInvalid = error === "invalid-priority" || error === "invalid-request";
  const tagsInvalid = error === "invalid-tags" || error === "invalid-request";

  return (
    <section className={styles.panel} id="internal-workflow" style={{ marginTop: "1rem" }} aria-labelledby="internal-workflow-title">
      <div className="eyebrow">{tr(locale, "Internal workflow", "Gestión interna")}</div>
      <h2 id="internal-workflow-title">{tr(locale, "Owner, priority and notes", "Responsable, prioridad y notas")}</h2>
      <p className={styles.lead}>{tr(
        locale,
        "This area is visible only to authorized staff. Internal notes and workflow labels are never shown in the customer account.",
        "Esta área solo es visible para personal autorizado. Las notas internas y etiquetas operativas nunca se muestran en la cuenta del cliente."
      )}</p>

      {updated === "workflow" ? <div id="operations-status" className={styles.notice} role="status" aria-live="polite">{tr(locale, "Internal workflow updated.", "Gestión interna actualizada.")}</div> : null}
      {updated === "note" ? <div id="operations-status" className={styles.notice} role="status" aria-live="polite">{tr(locale, "Internal note added.", "Nota interna añadida.")}</div> : null}
      {hasError ? <div id="operations-error" className={styles.notice} role="alert" aria-live="assertive">{errors[error!]}</div> : null}

      <form action={saveReservationOperationsAction} className={styles.editorForm} aria-label={tr(locale, "Reservation internal workflow", "Gestión interna de la reserva")} aria-describedby={workflowError ? "operations-error" : undefined}>
        <input type="hidden" name="reservationId" value={reservationId} />
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>{tr(locale, "Reservation owner", "Responsable de la reserva")}</span>
            <select name="ownerStaffId" defaultValue={state.ownerStaffId ?? ""} disabled={!writesEnabled} aria-invalid={ownerInvalid ? "true" : undefined}>
              <option value="">{tr(locale, "Unassigned", "Sin asignar")}</option>
              {!currentOwnerIncluded && state.ownerStaffId ? (
                <option value={state.ownerStaffId}>{state.ownerDisplayName ?? state.ownerStaffId} · {tr(locale, "inactive", "inactivo")}</option>
              ) : null}
              {staffOptions.map((member) => (
                <option value={member.id} key={member.id} disabled={member.status !== "active"}>
                  {member.displayName} · {staffRoleLabel(member.role, locale)}{member.status !== "active" ? ` · ${tr(locale, "inactive", "inactivo")}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>{tr(locale, "Priority", "Prioridad")}</span>
            <select name="priority" defaultValue={state.priority} disabled={!writesEnabled} aria-invalid={priorityInvalid ? "true" : undefined}>
              <option value="low">{priorityLabel("low", locale)}</option>
              <option value="normal">{priorityLabel("normal", locale)}</option>
              <option value="high">{priorityLabel("high", locale)}</option>
              <option value="urgent">{priorityLabel("urgent", locale)}</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>{tr(locale, "Tags", "Etiquetas")}</span>
            <input name="tags" defaultValue={state.tags.join(", ")} maxLength={420} disabled={!writesEnabled} placeholder={tr(locale, "VIP, documents pending, supplier", "VIP, documentación pendiente, proveedor")} aria-invalid={tagsInvalid ? "true" : undefined} aria-describedby={`operations-tags-help${workflowError ? " operations-error" : ""}`} />
            <small id="operations-tags-help">{tr(locale, "Separate tags with commas. Maximum 10.", "Separa las etiquetas con comas. Máximo 10.")}</small>
          </label>
        </div>
        {writesEnabled ? <button className="button button-primary" type="submit">{tr(locale, "Save internal workflow", "Guardar gestión interna")}</button> : null}
      </form>

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">{tr(locale, "Internal note", "Nota interna")}</div>
          <p className={styles.muted} id="operations-note-help">{tr(locale, "Add operational context that should remain available to the team. Notes are added to the timeline and are not sent to the customer.", "Añade contexto operativo que deba permanecer disponible para el equipo. Las notas se añaden al timeline y no se envían al cliente.")}</p>
        </div>
        <form action={addReservationInternalNoteAction} className={styles.editorForm} aria-label={tr(locale, "Add internal reservation note", "Añadir nota interna de reserva")} aria-describedby={noteError ? "operations-note-help operations-error" : "operations-note-help"}>
          <input type="hidden" name="reservationId" value={reservationId} />
          <label className={styles.field}>
            <span>{tr(locale, "Note", "Nota")}</span>
            <textarea name="body" rows={4} maxLength={2000} required disabled={!writesEnabled} placeholder={tr(locale, "Example: supplier confirmation pending; follow up before Friday.", "Ejemplo: confirmación del proveedor pendiente; hacer seguimiento antes del viernes.")} aria-invalid={noteError ? "true" : undefined} />
          </label>
          {writesEnabled ? <button className="button button-secondary" type="submit">{tr(locale, "Add internal note", "Añadir nota interna")}</button> : null}
        </form>
      </div>

      <div className={styles.editorSection}>
        <div className="eyebrow">{tr(locale, "Operational timeline", "Timeline operativo")}</div>
        <h3>{tr(locale, "Internal activity", "Actividad interna")}</h3>
        {timeline.length ? (
          <div className={styles.auditList} aria-label={tr(locale, "Internal workflow activity", "Actividad de gestión interna")}>
            {timeline.map((item) => item.kind === "note" ? (
              <div className={styles.auditItem} key={item.note.id}>
                <strong>{tr(locale, "Internal note", "Nota interna")}</strong><br />
                {item.note.body.split("\n").map((line, index) => <span key={`${item.note.id}-${index}`}>{line}{index < item.note.body.split("\n").length - 1 ? <br /> : null}</span>)}<br />
                <span>{item.note.authorDisplayName} · {staffRoleLabel(item.note.authorRole, locale)}</span><br />
                {formatOperatorDate(item.note.createdAt, locale, true)}
              </div>
            ) : (
              <div className={styles.auditItem} key={item.event.id}>
                <strong>{tr(locale, "Workflow updated", "Gestión actualizada")}</strong><br />
                {item.event.changes.map((change) => (
                  <span key={`${item.event.id}-${change.field}`}>
                    {fieldLabel(change.field, locale)}: {changeValue(change.field, change.before, locale)} → {changeValue(change.field, change.after, locale)}<br />
                  </span>
                ))}
                <span>{item.event.actorDisplayName} · {staffRoleLabel(item.event.actorRole, locale)}</span><br />
                {formatOperatorDate(item.event.occurredAt, locale, true)}
              </div>
            ))}
          </div>
        ) : <p className={styles.muted}>{tr(locale, "No internal workflow activity has been recorded yet.", "Todavía no se ha registrado actividad operativa interna.")}</p>}
      </div>
    </section>
  );
}