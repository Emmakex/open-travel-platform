import Link from "next/link";
import styles from "@/app/account/account.module.css";
import { createPrivacyRequestAction, withdrawPrivacyRequestAction } from "@/app/account/privacy/actions";
import { getLocale } from "@/lib/get-locale";
import { listPrivacyRequestsForCustomer, privacyRightTypes, type PrivacyRequestStatus, type PrivacyRightType } from "@/lib/privacy-rights";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";

export const metadata = {
  title: "Privacy rights | Kairoseth Travel",
  description: "Submit and track authenticated privacy-rights requests."
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
    restriction: ["Restriction of processing", "Limitación del tratamiento"],
    objection: ["Objection", "Oposición"],
    portability: ["Data portability", "Portabilidad de datos"]
  };
  return locale === "es" ? labels[type][1] : labels[type][0];
}

function statusLabel(locale: "en" | "es", status: PrivacyRequestStatus) {
  const labels: Record<PrivacyRequestStatus, [string, string]> = {
    received: ["Received", "Recibida"],
    "verification-required": ["Identity verification required", "Verificación de identidad requerida"],
    "in-review": ["In review", "En revisión"],
    "action-pending": ["Action pending", "Acción pendiente"],
    completed: ["Completed", "Completada"],
    declined: ["Not actioned", "No atendida"],
    withdrawn: ["Withdrawn", "Retirada"]
  };
  return locale === "es" ? labels[status][1] : labels[status][0];
}

const terminal = new Set<PrivacyRequestStatus>(["completed", "declined", "withdrawn"]);

export default async function AccountPrivacyPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; withdrawn?: string; error?: string }>;
}) {
  const [locale, identity, query] = await Promise.all([
    getLocale(),
    requireCustomerIdentity(),
    searchParams
  ]);
  const requests = await listPrivacyRequestsForCustomer(identity.id);
  const errors: Record<string, string> = {
    "invalid-type": tr(locale, "Choose a supported privacy right.", "Selecciona un derecho de privacidad compatible."),
    "already-open": tr(locale, "You already have an open request of this type. Track it below before creating another one.", "Ya tienes una solicitud abierta de este tipo. Revísala abajo antes de crear otra."),
    "invalid-request": tr(locale, "The request identifier is invalid.", "El identificador de la solicitud no es válido."),
    "request-unavailable": tr(locale, "That request cannot be withdrawn because it is closed or unavailable.", "Esa solicitud no puede retirarse porque ya está cerrada o no está disponible.")
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Account · Privacy", "Cuenta · Privacidad")}</div>
          <h1>{tr(locale, "Your privacy rights", "Tus derechos de privacidad")}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "Submit an authenticated request for access, rectification, erasure, restriction, objection or portability and track its handling status here.",
            "Presenta una solicitud autenticada de acceso, rectificación, supresión, limitación, oposición o portabilidad y consulta aquí su estado."
          )}</p>
          <div className={styles.notice}>{tr(
            locale,
            "Requests are reviewed individually. We may ask for additional identity verification when necessary. An erasure request does not automatically delete booking, payment or audit records when a retention review shows they must remain available for another applicable purpose or obligation.",
            "Las solicitudes se revisan individualmente. Podemos pedir verificación adicional de identidad cuando sea necesario. Una solicitud de supresión no elimina automáticamente reservas, pagos o auditorías cuando la revisión de retención determine que deben conservarse por otra finalidad u obligación aplicable."
          )}</div>
          {query.created ? <div className={styles.notice}><strong>{tr(locale, "Request received.", "Solicitud recibida.")}</strong> {tr(locale, "You can track it below.", "Puedes seguirla a continuación.")}</div> : null}
          {query.withdrawn ? <div className={styles.notice}>{tr(locale, "Request withdrawn.", "Solicitud retirada.")}</div> : null}
          {query.error && errors[query.error] ? <div className={styles.notice}>{errors[query.error]}</div> : null}

          <form action={createPrivacyRequestAction} className={styles.form}>
            <label className={styles.field}>
              <span>{tr(locale, "Right to exercise", "Derecho que quieres ejercer")}</span>
              <select name="type" required defaultValue="access">
                {privacyRightTypes.map((type) => <option key={type} value={type}>{rightLabel(locale, type)}</option>)}
              </select>
              <small>{tr(locale, "Only one open request of the same type is kept at a time; completed requests remain in your history.", "Solo se mantiene una solicitud abierta del mismo tipo a la vez; las solicitudes cerradas permanecen en tu historial.")}</small>
            </label>
            <div className={styles.actions}>
              <button className="button" type="submit">{tr(locale, "Submit request", "Enviar solicitud")}</button>
              <Link className="button button-secondary" href="/account">{tr(locale, "← Account", "← Cuenta")}</Link>
            </div>
          </form>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Request history", "Historial de solicitudes")}</div>
          <h2>{tr(locale, "Privacy cases", "Expedientes de privacidad")}</h2>
          {requests.length === 0 ? <p className={styles.lead}>{tr(locale, "You have not submitted a privacy-rights request yet.", "Todavía no has presentado ninguna solicitud de derechos de privacidad.")}</p> : null}
          <dl className={styles.profileList}>
            {requests.map((request) => {
              const deadline = request.extendedDueAt ?? request.dueAt;
              return (
                <div key={request.id}>
                  <dt>{rightLabel(locale, request.type)}</dt>
                  <dd>
                    <div>{statusLabel(locale, request.status)}</div>
                    <small>{tr(locale, "Received", "Recibida")}: {formatDate(locale, request.receivedAt)} · {tr(locale, "Current response deadline", "Plazo de respuesta actual")}: {formatDate(locale, deadline)}</small>
                    {request.extendedDueAt ? <div><small>{tr(locale, "Deadline extension recorded", "Prórroga de plazo registrada")}</small></div> : null}
                    {request.type === "erasure" && request.retentionState === "hold" ? <div><small>{tr(locale, "Retention review: some data must remain retained; the final outcome will explain the applicable case status.", "Revisión de retención: algunos datos deben conservarse; el resultado final reflejará el estado aplicable del expediente.")}</small></div> : null}
                    {!terminal.has(request.status) ? (
                      <form action={withdrawPrivacyRequestAction} style={{ marginTop: "0.65rem" }}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <button className="button button-secondary" type="submit">{tr(locale, "Withdraw request", "Retirar solicitud")}</button>
                      </form>
                    ) : null}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      </div>
    </main>
  );
}
