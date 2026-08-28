import styles from "@/app/operator/operator.module.css";
import {
  addOperationsTaskCommentAction,
  createOperationsTaskAction,
  updateOperationsTaskAction
} from "@/app/operator/tasks/actions";
import type {
  OperationsTask,
  OperationsTaskComment,
  OperationsTaskEvent,
  OperationsTaskStatus,
  OperationsTaskTargetType,
  StaffRole
} from "@/domain/operations/types";
import type { TravelLocale } from "@/domain/travel/types";
import { formatOperatorDate, staffRoleLabel, tr } from "@/lib/operator-i18n";
import { isOperationsTaskOverdue } from "@/lib/operations-task-rules";

type StaffOption = {
  id: string;
  displayName: string;
  role: StaffRole;
  status: "active" | "disabled";
};

type TaskHistory = {
  events: OperationsTaskEvent[];
  comments: OperationsTaskComment[];
};

export function operationsTaskStatusLabel(status: OperationsTaskStatus, locale: TravelLocale) {
  const labels: Record<OperationsTaskStatus, [string, string]> = {
    open: ["Open", "Abierta"],
    "in-progress": ["In progress", "En curso"],
    completed: ["Completed", "Completada"],
    cancelled: ["Cancelled", "Cancelada"]
  };
  return locale === "es" ? labels[status][1] : labels[status][0];
}

function taskFieldLabel(field: OperationsTaskEvent["changes"][number]["field"], locale: TravelLocale) {
  if (field === "status") return tr(locale, "Status", "Estado");
  if (field === "assignee") return tr(locale, "Assignee", "Responsable");
  return tr(locale, "Due date", "Vencimiento");
}

function taskChangeValue(field: OperationsTaskEvent["changes"][number]["field"], value: string, locale: TravelLocale) {
  if (!value) return tr(locale, "None", "Ninguno");
  if (field === "status" && ["open", "in-progress", "completed", "cancelled"].includes(value)) {
    return operationsTaskStatusLabel(value as OperationsTaskStatus, locale);
  }
  if (field === "dueDate") return formatOperatorDate(`${value}T12:00:00Z`, locale);
  return value;
}

function dueLabel(task: OperationsTask, locale: TravelLocale) {
  if (!task.dueDate) return tr(locale, "No due date", "Sin vencimiento");
  const formatted = formatOperatorDate(`${task.dueDate}T12:00:00Z`, locale);
  return isOperationsTaskOverdue(task)
    ? `${formatted} · ${tr(locale, "Overdue", "Vencida")}`
    : formatted;
}

export function OperationsTasks({
  targetType,
  targetId,
  tasks,
  histories,
  staffOptions,
  locale,
  writesEnabled,
  returnTo,
  updated,
  error
}: {
  targetType: OperationsTaskTargetType;
  targetId: string;
  tasks: OperationsTask[];
  histories: Record<string, TaskHistory>;
  staffOptions: StaffOption[];
  locale: TravelLocale;
  writesEnabled: boolean;
  returnTo: string;
  updated?: string;
  error?: string;
}) {
  const errors: Record<string, string> = {
    "tasks-unavailable": tr(locale, "Task management is unavailable in this deployment.", "La gestión de tareas no está disponible en este despliegue."),
    "target-not-found": tr(locale, "The item linked to this task could not be found.", "No se ha encontrado el elemento vinculado a esta tarea."),
    "task-not-found": tr(locale, "The task could not be found.", "No se ha encontrado la tarea."),
    "invalid-assignee": tr(locale, "The selected assignee is no longer an active staff account.", "El responsable seleccionado ya no es una cuenta activa del equipo."),
    "invalid-due-date": tr(locale, "Choose a valid due date.", "Selecciona una fecha de vencimiento válida."),
    "invalid-transition": tr(locale, "That task status change is not allowed.", "Ese cambio de estado de tarea no está permitido."),
    "invalid-comment": tr(locale, "Write a follow-up note of up to 2,000 characters.", "Escribe un seguimiento de hasta 2.000 caracteres."),
    "invalid-task": tr(locale, "Review the task title, assignee and due date.", "Revisa el título, responsable y vencimiento de la tarea."),
    "no-changes": tr(locale, "No task changes were detected.", "No se detectaron cambios en la tarea."),
    "update-failed": tr(locale, "The task change could not be saved.", "No se pudo guardar el cambio de la tarea.")
  };
  const hasError = Boolean(error && errors[error]);
  const assigneeInvalid = error === "invalid-assignee" || error === "invalid-task";
  const dueDateInvalid = error === "invalid-due-date" || error === "invalid-task";
  const titleInvalid = error === "invalid-task";
  const commentInvalid = error === "invalid-comment";
  const statusInvalid = error === "invalid-transition";

  return (
    <section className={styles.panel} id="tasks" style={{ marginTop: "1rem" }} aria-labelledby="tasks-title">
      <div className="eyebrow">{tr(locale, "Tasks and follow-ups", "Tareas y seguimientos")}</div>
      <h2 id="tasks-title">{tr(locale, "Team actions", "Acciones del equipo")}</h2>
      <p className={styles.lead}>{tr(
        locale,
        "Create dated internal tasks, assign them to active staff and keep follow-up notes with a durable history. These tasks are never shown to customers.",
        "Crea tareas internas con fecha, asígnalas a personal activo y conserva seguimientos con historial. Estas tareas nunca se muestran al cliente."
      )}</p>

      {updated === "created" ? <div id="tasks-status" className={styles.notice} role="status" aria-live="polite">{tr(locale, "Task created.", "Tarea creada.")}</div> : null}
      {updated === "updated" ? <div id="tasks-status" className={styles.notice} role="status" aria-live="polite">{tr(locale, "Task updated.", "Tarea actualizada.")}</div> : null}
      {updated === "comment" ? <div id="tasks-status" className={styles.notice} role="status" aria-live="polite">{tr(locale, "Follow-up added.", "Seguimiento añadido.")}</div> : null}
      {hasError ? <div id="tasks-error" className={styles.notice} role="alert" aria-live="assertive">{errors[error!]}</div> : null}

      <form action={createOperationsTaskAction} className={styles.editorForm} aria-label={tr(locale, "Create internal task", "Crear tarea interna")} aria-describedby={hasError && !commentInvalid && !statusInvalid ? "tasks-error" : undefined}>
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>{tr(locale, "Task", "Tarea")}</span>
            <input name="title" maxLength={160} required disabled={!writesEnabled} placeholder={tr(locale, "Confirm hotel with supplier", "Confirmar hotel con proveedor")} aria-invalid={titleInvalid ? "true" : undefined} />
          </label>
          <label className={styles.field}>
            <span>{tr(locale, "Assignee", "Responsable")}</span>
            <select name="assigneeStaffId" defaultValue="" disabled={!writesEnabled} aria-invalid={assigneeInvalid ? "true" : undefined}>
              <option value="">{tr(locale, "Unassigned", "Sin asignar")}</option>
              {staffOptions.map((member) => <option key={member.id} value={member.id} disabled={member.status !== "active"}>{member.displayName} · {staffRoleLabel(member.role, locale)}{member.status !== "active" ? ` · ${tr(locale, "inactive", "inactivo")}` : ""}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>{tr(locale, "Due date", "Vencimiento")}</span>
            <input name="dueDate" type="date" disabled={!writesEnabled} aria-invalid={dueDateInvalid ? "true" : undefined} />
          </label>
        </div>
        <label className={styles.field}>
          <span>{tr(locale, "Details", "Detalles")}</span>
          <textarea name="details" rows={3} maxLength={2000} disabled={!writesEnabled} placeholder={tr(locale, "Optional instructions or expected outcome.", "Instrucciones opcionales o resultado esperado.")} />
        </label>
        {writesEnabled ? <button className="button button-primary" type="submit">{tr(locale, "Create task", "Crear tarea")}</button> : null}
      </form>

      <div className={styles.editorSection}>
        <div className="eyebrow">{tr(locale, "Task list", "Lista de tareas")}</div>
        <h3>{tr(locale, "Current and historical tasks", "Tareas actuales e históricas")}</h3>
        {tasks.length ? <div className={styles.managementList}>{tasks.map((task) => {
          const history = histories[task.id] ?? { events: [], comments: [] };
          const currentAssigneeIncluded = !task.assigneeStaffId || staffOptions.some((member) => member.id === task.assigneeStaffId);
          const taskTitleId = `task-${task.id}-title`;
          return (
            <article className={styles.editorSection} key={task.id} style={{ marginTop: "1rem" }} aria-labelledby={taskTitleId}>
              <div>
                <h4 id={taskTitleId}>{task.title}{" "}<span className={styles.badge}>{operationsTaskStatusLabel(task.status, locale)}</span></h4>
                <p className={styles.muted}>{dueLabel(task, locale)} · {task.assigneeDisplayName ?? tr(locale, "Unassigned", "Sin asignar")}</p>
                {task.details ? <p>{task.details}</p> : null}
                <p className={styles.muted}>{tr(locale, "Created by", "Creada por")} {task.createdByDisplayName} · {formatOperatorDate(task.createdAt, locale, true)}</p>
              </div>

              {task.status !== "cancelled" ? <form action={updateOperationsTaskAction} className={styles.editorForm} aria-label={tr(locale, `Update task ${task.title}`, `Actualizar tarea ${task.title}`)} aria-describedby={hasError && !commentInvalid ? "tasks-error" : undefined}>
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>{tr(locale, "Status", "Estado")}</span>
                    <select name="status" defaultValue={task.status} disabled={!writesEnabled} aria-invalid={statusInvalid ? "true" : undefined}>
                      <option value="open">{operationsTaskStatusLabel("open", locale)}</option>
                      <option value="in-progress">{operationsTaskStatusLabel("in-progress", locale)}</option>
                      <option value="completed">{operationsTaskStatusLabel("completed", locale)}</option>
                      {task.status !== "completed" ? <option value="cancelled">{operationsTaskStatusLabel("cancelled", locale)}</option> : null}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Assignee", "Responsable")}</span>
                    <select name="assigneeStaffId" defaultValue={task.assigneeStaffId ?? ""} disabled={!writesEnabled} aria-invalid={assigneeInvalid ? "true" : undefined}>
                      <option value="">{tr(locale, "Unassigned", "Sin asignar")}</option>
                      {!currentAssigneeIncluded && task.assigneeStaffId ? <option value={task.assigneeStaffId}>{task.assigneeDisplayName ?? task.assigneeStaffId} · {tr(locale, "inactive", "inactivo")}</option> : null}
                      {staffOptions.map((member) => <option key={member.id} value={member.id} disabled={member.status !== "active"}>{member.displayName} · {staffRoleLabel(member.role, locale)}{member.status !== "active" ? ` · ${tr(locale, "inactive", "inactivo")}` : ""}</option>)}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Due date", "Vencimiento")}</span>
                    <input name="dueDate" type="date" defaultValue={task.dueDate ?? ""} disabled={!writesEnabled} aria-invalid={dueDateInvalid ? "true" : undefined} />
                  </label>
                </div>
                {writesEnabled ? <button className="button button-secondary" type="submit">{tr(locale, "Save task", "Guardar tarea")}</button> : null}
              </form> : null}

              <form action={addOperationsTaskCommentAction} className={styles.editorForm} aria-label={tr(locale, `Add follow-up to ${task.title}`, `Añadir seguimiento a ${task.title}`)} aria-describedby={commentInvalid ? "tasks-error" : undefined}>
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <label className={styles.field}>
                  <span>{tr(locale, "Follow-up", "Seguimiento")}</span>
                  <textarea name="body" rows={2} maxLength={2000} required disabled={!writesEnabled} placeholder={tr(locale, "Add the latest update for the team.", "Añade la última actualización para el equipo.")} aria-invalid={commentInvalid ? "true" : undefined} />
                </label>
                {writesEnabled ? <button className="button button-secondary" type="submit">{tr(locale, "Add follow-up", "Añadir seguimiento")}</button> : null}
              </form>

              {history.comments.length || history.events.length ? <div className={styles.auditList} aria-label={tr(locale, `History for ${task.title}`, `Historial de ${task.title}`)}>
                {[
                  ...history.comments.map((comment) => ({ kind: "comment" as const, at: comment.createdAt, comment })),
                  ...history.events.map((event) => ({ kind: "event" as const, at: event.occurredAt, event }))
                ].sort((a, b) => b.at.localeCompare(a.at)).map((entry) => entry.kind === "comment" ? (
                  <div className={styles.auditItem} key={entry.comment.id}>
                    <strong>{tr(locale, "Follow-up", "Seguimiento")}</strong><br />
                    {entry.comment.body}<br />
                    <span>{entry.comment.authorDisplayName} · {staffRoleLabel(entry.comment.authorRole, locale)}</span><br />
                    {formatOperatorDate(entry.comment.createdAt, locale, true)}
                  </div>
                ) : (
                  <div className={styles.auditItem} key={entry.event.id}>
                    <strong>{tr(locale, "Task updated", "Tarea actualizada")}</strong><br />
                    {entry.event.changes.map((change) => <span key={`${entry.event.id}-${change.field}`}>{taskFieldLabel(change.field, locale)}: {taskChangeValue(change.field, change.before, locale)} → {taskChangeValue(change.field, change.after, locale)}<br /></span>)}
                    <span>{entry.event.actorDisplayName} · {staffRoleLabel(entry.event.actorRole, locale)}</span><br />
                    {formatOperatorDate(entry.event.occurredAt, locale, true)}
                  </div>
                ))}
              </div> : null}
            </article>
          );
        })}</div> : <p className={styles.muted}>{tr(locale, "No tasks have been created for this item yet.", "Todavía no se han creado tareas para este elemento.")}</p>}
      </div>
    </section>
  );
}