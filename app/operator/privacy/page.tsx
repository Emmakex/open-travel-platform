import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { reviewPrivacyRequestAction } from "@/app/operator/privacy/actions";
import {
  approvePrivacyExportAction,
  executePrivacyErasureAction,
  executePrivacyRestrictionAction
} from "@/app/operator/privacy/execution-actions";
import { getLocale } from "@/lib/get-locale";
import {
  listPrivacyRequestsForAdmin,
  privacyRequestStatuses,
  type PrivacyRequestStatus,
  type PrivacyRightType
} from "@/lib/privacy-rights";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

export const metadata = {
  title: "Privacy rights",
  description: "Admin-only privacy-rights request review and controlled execution."
};

function tr(locale: "en" | "es", en: string, es: string) {
  return locale === "es" ? es : en;
}

function formatDate(locale: "en" | "es", date: Date) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(date);
}

function rightLabel(locale: "en" | "es", type: PrivacyRightType) {
  const labels: Record<PrivacyRightType, [string, string]> = {
    access: ["Access", "Acceso"],
    rectification: ["Rectification", "Rectificación"],
    erasure: ["Erasure", "Supresión"],
    restriction: ["Restriction", "Limitación"],
    objection: ["Objection", "Oposición"],
    portability: ["Portability", "Portabilidad"]
  };
  return locale === "es" ? labels[type][1] : labels[type][0];
}

function statusLabel(locale: "en" | "es", status: PrivacyRequestStatus) {
  const labels: Record<PrivacyRequestStatus, [string, string]> = {
    received: ["Received", "Recibida"],
    "verification-required": ["Verification required", "Verificación requerida"],
    "in-review": ["In review", "En revisión"],
    "action-pending": ["Action pending", "Acción pendiente"],
    completed: ["Completed", "Completada"],
    declined: ["Not actioned", "No atendida"],
    withdrawn: ["Withdrawn", "Retirada"]
  };
  return locale === "es" ? labels[status][1] : labels[status][0];
}

const terminal = new Set<PrivacyRequestStatus>(["completed", "declined", "withdrawn"]);

export default async function OperatorPrivacyPage({
  searchParams
}: {
  searchParams: Promise<{
    updated?: string;
    error?: string;
    request?: string;
    execution?: string;
    executionError?: string;
  }>;
}) {
  const [locale, query] = await Promise.all([getLocale(), searchParams]);
  await requireAdminIdentity();
  const requests = await listPrivacyRequestsForAdmin(200);
  const now = Date.now();
  const open = requests.filter((request) => !terminal.has(request.status));
  const overdue = open.filter((request) => (request.extendedDueAt ?? request.dueAt).getTime() < now);
  const verification = open.filter((request) => request.status === "verification-required");
  const erasurePending = open.filter((request) => request.type === "erasure" && request.retentionState === "pending");
  const errors: Record<string, string> = {
    "invalid-request": tr(locale, "Invalid privacy request identifier.", "Identificador de solicitud no válido."),
    "no-change": tr(locale, "Choose at least one review change.", "Selecciona al menos un cambio de revisión."),
    "not-found": tr(locale, "Privacy request not found.", "No se ha encontrado la solicitud."),
    "invalid-status": tr(locale, "That status transition is not allowed.", "Esa transición de estado no está permitida."),
    "extension-reason": tr(locale, "Choose a structured reason before extending the deadline.", "Selecciona un motivo estructurado antes de ampliar el plazo."),
    "retention-not-applicable": tr(locale, "Retention review applies only to erasure requests.", "La revisión de retención solo se aplica a solicitudes de supresión."),
    "retention-reason": tr(locale, "A retention-hold reason is required.", "Es obligatorio indicar un motivo de conservación."),
    "retention-review": tr(locale, "Resolve the erasure retention review before completing the request.", "Resuelve la revisión de retención antes de completar la solicitud de supresión."),
    "outcome-required": tr(locale, "A structured outcome is required when closing a request.", "Es obligatorio indicar un resultado estructurado al cerrar una solicitud."),
    conflict: tr(locale, "The request changed concurrently. Reload and review the current state.", "La solicitud cambió de forma concurrente. Recarga y revisa el estado actual."),
    terminal: tr(locale, "The request is already closed and cannot be modified.", "La solicitud ya está cerrada y no puede modificarse.")
  };
  const executionErrors: Record<string, string> = {
    "invalid-request": tr(locale, "Invalid privacy request identifier.", "Identificador de solicitud no válido."),
    "not-found": tr(locale, "Privacy request not found.", "No se ha encontrado la solicitud."),
    terminal: tr(locale, "This privacy case is already closed.", "Este expediente de privacidad ya está cerrado."),
    "not-ready": tr(locale, "Move the verified case to Action pending before executing it.", "Mueve el expediente verificado a Acción pendiente antes de ejecutarlo."),
    "export-not-applicable": tr(locale, "Only access and portability cases can approve a customer export.", "Solo los casos de acceso y portabilidad permiten aprobar una exportación."),
    "restriction-not-applicable": tr(locale, "This action is available only for restriction cases.", "Esta acción solo está disponible para casos de limitación."),
    "erasure-not-applicable": tr(locale, "This action is available only for erasure cases.", "Esta acción solo está disponible para casos de supresión."),
    "retention-block": tr(locale, "Erasure remains blocked until retention review is Clear.", "La supresión permanece bloqueada hasta que la revisión de retención esté en Clear."),
    "identity-not-found": tr(locale, "The customer identity no longer exists.", "La identidad del cliente ya no existe."),
    "offline-required": tr(locale, "This account exceeds the bounded online execution limit and needs the offline migration runbook.", "Esta cuenta supera el límite de ejecución online y necesita el procedimiento de migración offline."),
    "confirmation-required": tr(locale, "Confirm the irreversible action before executing it.", "Confirma la acción irreversible antes de ejecutarla.")
  };
  const executionMessages: Record<string, string> = {
    "export-approved": tr(locale, "Customer export approved. The authenticated customer can now download it from the privacy page.", "Exportación aprobada. El cliente autenticado ya puede descargarla desde su página de privacidad."),
    "restriction-applied": tr(locale, "Processing restriction applied: customer sign-in sessions were revoked and the account was disabled.", "Limitación aplicada: se revocaron las sesiones del cliente y se deshabilitó la cuenta."),
    "erasure-applied": tr(locale, "Controlled erasure applied. Direct account/traveller identifiers were removed or pseudonymised while structural business records were preserved.", "Supresión controlada aplicada. Los identificadores directos de cuenta/viajeros se eliminaron o seudonimizaron preservando la estructura de los registros de negocio.")
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Admin · Privacy", "Admin · Privacidad")}</div>
          <h1>{tr(locale, "Privacy-rights operations", "Gestión de derechos de privacidad")}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "Track authenticated data-subject requests, identity verification, response deadlines, release approval and controlled restriction or erasure execution.",
            "Gestiona solicitudes autenticadas, verificación de identidad, plazos, aprobación de entrega y ejecución controlada de limitación o supresión."
          )}</p>
          <div className={styles.notice}>{tr(
            locale,
            "Execution is intentionally fail-closed. Exports require a verified case in Action pending. Erasure additionally requires retention review to be Clear and an explicit irreversible-action confirmation.",
            "La ejecución falla de forma segura por defecto. Las exportaciones requieren un expediente verificado en Acción pendiente. La supresión exige además retención en Clear y una confirmación explícita de acción irreversible."
          )}</div>
          {query.updated ? <div className={styles.notice}>{tr(locale, "Privacy case updated.", "Expediente de privacidad actualizado.")}</div> : null}
          {query.error && errors[query.error] ? <div className={styles.notice}>{errors[query.error]}</div> : null}
          {query.execution && executionMessages[query.execution] ? <div className={styles.notice}>{executionMessages[query.execution]}</div> : null}
          {query.executionError && executionErrors[query.executionError] ? <div className={styles.notice}>{executionErrors[query.executionError]}</div> : null}
          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link>
          </div>
          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{open.length}</strong><span>{tr(locale, "Open", "Abiertas")}</span></div>
            <div className={styles.metric}><strong>{overdue.length}</strong><span>{tr(locale, "Past deadline", "Fuera de plazo")}</span></div>
            <div className={styles.metric}><strong>{verification.length}</strong><span>{tr(locale, "Verification", "Verificación")}</span></div>
            <div className={styles.metric}><strong>{erasurePending.length}</strong><span>{tr(locale, "Erasure review", "Revisión supresión")}</span></div>
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Case queue", "Cola de expedientes")}</div>
          <h2>{tr(locale, "Recent privacy requests", "Solicitudes de privacidad recientes")}</h2>
          {requests.length === 0 ? <p className={styles.muted}>{tr(locale, "No privacy requests yet.", "Todavía no hay solicitudes de privacidad.")}</p> : null}
          <div className={styles.managementList}>
            {requests.map((request) => {
              const deadline = request.extendedDueAt ?? request.dueAt;
              const isOverdue = !terminal.has(request.status) && deadline.getTime() < now;
              const executable = request.status === "action-pending";
              return (
                <article className={styles.panel} key={request.id} style={{ borderRadius: "16px", padding: "1rem" }}>
                  <div className={styles.sectionHeaderCompact}>
                    <div>
                      <strong>{rightLabel(locale, request.type)}</strong>
                      <p className={styles.muted}>{request.id} · {request.identityId}</p>
                    </div>
                    <span className={styles.badge}>{statusLabel(locale, request.status)}</span>
                  </div>
                  <dl className={styles.definitionList}>
                    <div><dt>{tr(locale, "Received", "Recibida")}</dt><dd>{formatDate(locale, request.receivedAt)}</dd></div>
                    <div><dt>{tr(locale, "Deadline", "Plazo")}</dt><dd>{formatDate(locale, deadline)}{isOverdue ? ` · ${tr(locale, "PAST DEADLINE", "FUERA DE PLAZO")}` : ""}</dd></div>
                    <div><dt>{tr(locale, "Retention", "Retención")}</dt><dd>{request.retentionState}{request.retentionReason ? ` · ${request.retentionReason}` : ""}</dd></div>
                    <div><dt>{tr(locale, "Outcome", "Resultado")}</dt><dd>{request.outcomeCode ?? "—"}</dd></div>
                  </dl>

                  {!terminal.has(request.status) ? (
                    <form action={reviewPrivacyRequestAction} className={styles.editorForm}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <div className={styles.formGrid}>
                        <label className={styles.field}>
                          <span>{tr(locale, "Case status", "Estado del expediente")}</span>
                          <select name="status" defaultValue={request.status}>
                            {privacyRequestStatuses.filter((status) => status !== "withdrawn").map((status) => (
                              <option value={status} key={status}>{statusLabel(locale, status)}</option>
                            ))}
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>{tr(locale, "Closing outcome", "Resultado de cierre")}</span>
                          <select name="outcomeCode" defaultValue="">
                            <option value="">—</option>
                            <option value="fulfilled">fulfilled</option>
                            <option value="partially-fulfilled">partially-fulfilled</option>
                            <option value="identity-not-verified">identity-not-verified</option>
                            <option value="not-applicable">not-applicable</option>
                            <option value="retention-required">retention-required</option>
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>{tr(locale, "Deadline extension", "Prórroga de plazo")}</span>
                          <select name="extendByMonths" defaultValue="">
                            <option value="">—</option>
                            <option value="1">+1 month</option>
                            <option value="2">+2 months</option>
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>{tr(locale, "Extension reason", "Motivo de prórroga")}</span>
                          <select name="extensionReason" defaultValue="">
                            <option value="">—</option>
                            <option value="complexity">complexity</option>
                            <option value="request-volume">request-volume</option>
                          </select>
                        </label>
                        {request.type === "erasure" ? (
                          <>
                            <label className={styles.field}>
                              <span>{tr(locale, "Erasure retention review", "Revisión de retención para supresión")}</span>
                              <select name="retentionState" defaultValue={request.retentionState}>
                                <option value="pending">pending</option>
                                <option value="clear">clear</option>
                                <option value="hold">hold</option>
                              </select>
                            </label>
                            <label className={styles.field}>
                              <span>{tr(locale, "Hold reason", "Motivo de conservación")}</span>
                              <select name="retentionReason" defaultValue={request.retentionReason ?? ""}>
                                <option value="">—</option>
                                <option value="legal-obligation">legal-obligation</option>
                                <option value="legal-claims">legal-claims</option>
                                <option value="rights-of-others">rights-of-others</option>
                                <option value="other-applicable-basis">other-applicable-basis</option>
                              </select>
                            </label>
                          </>
                        ) : null}
                      </div>
                      <div className={styles.actions}>
                        <button className="button" type="submit">{tr(locale, "Apply review", "Aplicar revisión")}</button>
                      </div>
                    </form>
                  ) : null}

                  {executable && (request.type === "access" || request.type === "portability") ? (
                    <form action={approvePrivacyExportAction} style={{ marginTop: "1rem" }}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <button className="button button-secondary" type="submit">
                        {tr(locale, "Approve customer JSON export", "Aprobar exportación JSON del cliente")}
                      </button>
                    </form>
                  ) : null}

                  {executable && request.type === "restriction" ? (
                    <form action={executePrivacyRestrictionAction} className={styles.editorForm} style={{ marginTop: "1rem" }}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <label className={styles.field}>
                        <span>{tr(locale, "Confirm restriction", "Confirmar limitación")}</span>
                        <span><input type="checkbox" name="confirm" value="restrict" required /> {tr(locale, "Disable the account and revoke active customer sessions.", "Deshabilitar la cuenta y revocar las sesiones activas del cliente.")}</span>
                      </label>
                      <button className="button button-secondary" type="submit">{tr(locale, "Apply restriction", "Aplicar limitación")}</button>
                    </form>
                  ) : null}

                  {executable && request.type === "erasure" ? (
                    <div className={styles.notice} style={{ marginTop: "1rem" }}>
                      {request.retentionState !== "clear" ? (
                        <p>{tr(locale, "Erasure execution is locked until retention review is Clear.", "La ejecución de supresión está bloqueada hasta que la revisión de retención esté en Clear.")}</p>
                      ) : (
                        <form action={executePrivacyErasureAction} className={styles.editorForm}>
                          <input type="hidden" name="requestId" value={request.id} />
                          <label className={styles.field}>
                            <span>{tr(locale, "Irreversible confirmation", "Confirmación irreversible")}</span>
                            <span><input type="checkbox" name="confirm" value="erase" required /> {tr(locale, "Anonymise direct account/traveller identifiers, revoke sessions and remove active protected traveller payloads.", "Anonimizar identificadores directos de cuenta/viajeros, revocar sesiones y eliminar los datos protegidos de viajeros activos.")}</span>
                          </label>
                          <button className="button" type="submit">{tr(locale, "Execute controlled erasure", "Ejecutar supresión controlada")}</button>
                        </form>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
