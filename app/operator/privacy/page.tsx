import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { reviewPrivacyRequestAction } from "@/app/operator/privacy/actions";
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
  description: "Admin-only privacy-rights request review and deadline tracking."
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
  searchParams: Promise<{ updated?: string; error?: string; request?: string }>;
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

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Admin · Privacy", "Admin · Privacidad")}</div>
          <h1>{tr(locale, "Privacy-rights operations", "Gestión de derechos de privacidad")}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "Track authenticated data-subject requests, identity-verification needs, response deadlines and erasure retention review. This console records the case workflow and does not automatically erase or export business records.",
            "Gestiona solicitudes autenticadas, necesidades de verificación de identidad, plazos de respuesta y revisión de retención para supresión. Esta consola registra el expediente y no borra ni exporta automáticamente registros de negocio."
          )}</p>
          <div className={styles.notice}>{tr(
            locale,
            "Closing an erasure case as completed is fail-closed until retention review is resolved. Closing any staff-reviewed case requires a structured outcome. Deadline extensions require a structured complexity or request-volume reason.",
            "Cerrar una supresión como completada falla de forma segura hasta resolver la revisión de retención. Cerrar cualquier expediente revisado por staff exige un resultado estructurado. Las prórrogas requieren un motivo estructurado de complejidad o volumen de solicitudes."
          )}</div>
          {query.updated ? <div className={styles.notice}>{tr(locale, "Privacy case updated.", "Expediente de privacidad actualizado.")}</div> : null}
          {query.error && errors[query.error] ? <div className={styles.notice}>{errors[query.error]}</div> : null}
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
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
