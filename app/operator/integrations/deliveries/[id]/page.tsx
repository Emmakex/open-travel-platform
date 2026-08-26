import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/operator/operator.module.css";
import { requeueDeadLetterDeliveryAction } from "@/app/operator/integrations/actions";
import { getLocale } from "@/lib/get-locale";
import { getIntegrationDeliveryDetail } from "@/lib/integration-outbox";
import { formatOperatorDate, tr } from "@/lib/operator-i18n";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

export const metadata = {
  title: "Integration delivery | Kairoseth Travel",
  description: "Admin-only outbound integration delivery diagnostics."
};

export default async function IntegrationDeliveryDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ requeued?: string; error?: string }>;
}) {
  const [locale, route, query] = await Promise.all([getLocale(), params, searchParams]);
  await requireAdminIdentity();
  const detail = await getIntegrationDeliveryDetail(route.id);
  if (!detail) notFound();

  const errors: Record<string, string> = {
    "not-dead-letter": tr(locale, "Only dead-letter deliveries can be requeued.", "Solo se pueden reencolar entregas en dead-letter."),
    "replay-reason": tr(locale, "Replay reason must contain 10–500 characters.", "El motivo del replay debe tener entre 10 y 500 caracteres."),
    "replay-failed": tr(locale, "The delivery could not be requeued.", "No se pudo reencolar la entrega.")
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Admin · Integration delivery", "Admin · Entrega de integración")}</div>
          <h1>{detail.delivery.id}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "Inspect the durable delivery, versioned event and attempt history. Signing secrets are never loaded into this diagnostic view.",
            "Consulta la entrega durable, el evento versionado y el historial de intentos. Los secretos de firma nunca se cargan en esta vista de diagnóstico."
          )}</p>
          {query.requeued ? <div className={styles.notice}>{tr(locale, "Delivery requeued with a fresh retry cycle. The previous attempts remain in history.", "Entrega reencolada con un nuevo ciclo de reintentos. Los intentos anteriores permanecen en el historial.")}</div> : null}
          {query.error && errors[query.error] ? <div className={styles.notice}>{errors[query.error]}</div> : null}
          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator/integrations">{tr(locale, "← Integrations", "← Integraciones")}</Link>
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Delivery", "Entrega")}</div>
          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{detail.delivery.status}</strong><span>{tr(locale, "Status", "Estado")}</span></div>
            <div className={styles.metric}><strong>{detail.delivery.attempts}</strong><span>{tr(locale, "Attempts in current cycle", "Intentos del ciclo actual")}</span></div>
            <div className={styles.metric}><strong>{detail.delivery.responseStatus ?? "—"}</strong><span>HTTP</span></div>
          </div>
          <div className={styles.auditList}>
            <div className={styles.auditItem}><strong>{tr(locale, "Event", "Evento")}</strong><br />{detail.delivery.eventId}</div>
            <div className={styles.auditItem}><strong>{tr(locale, "Endpoint", "Endpoint")}</strong><br />{detail.delivery.endpointId}</div>
            <div className={styles.auditItem}><strong>{tr(locale, "Created", "Creada")}</strong><br />{formatOperatorDate(detail.delivery.createdAt, locale, true)}</div>
            <div className={styles.auditItem}><strong>{tr(locale, "Next attempt", "Próximo intento")}</strong><br />{detail.delivery.nextAttemptAt ? formatOperatorDate(detail.delivery.nextAttemptAt, locale, true) : "—"}</div>
            {detail.delivery.lastError ? <div className={styles.auditItem}><strong>{tr(locale, "Last error", "Último error")}</strong><br />{detail.delivery.lastError}</div> : null}
          </div>
        </section>

        {detail.delivery.status === "dead-letter" ? (
          <section className={styles.panel} style={{ marginTop: "1rem" }}>
            <div className="eyebrow">{tr(locale, "Controlled replay", "Replay controlado")}</div>
            <h2>{tr(locale, "Requeue dead-letter delivery", "Reencolar entrega dead-letter")}</h2>
            <p className={styles.lead}>{tr(
              locale,
              "Requeue starts a new bounded retry cycle but never deletes the previous attempts. An operational reason is mandatory and permanently audited.",
              "El requeue inicia un nuevo ciclo limitado de reintentos sin borrar los intentos anteriores. Es obligatorio indicar un motivo operativo, que queda auditado."
            )}</p>
            <form action={requeueDeadLetterDeliveryAction} className={styles.editorForm}>
              <input type="hidden" name="deliveryId" value={detail.delivery.id} />
              <label className={styles.field}>
                <span>{tr(locale, "Operational reason", "Motivo operativo")}</span>
                <textarea name="reason" minLength={10} maxLength={500} required rows={4} placeholder={tr(locale, "Example: destination endpoint recovered after provider outage", "Ejemplo: el endpoint de destino se recuperó tras una incidencia del proveedor")} />
              </label>
              <button className="button button-primary" type="submit">{tr(locale, "Requeue delivery", "Reencolar entrega")}</button>
            </form>
          </section>
        ) : null}

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Versioned event", "Evento versionado")}</div>
          <h2>{detail.event?.type ?? detail.delivery.eventId}</h2>
          {detail.event ? (
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: 0 }}>
              {JSON.stringify(detail.event, null, 2)}
            </pre>
          ) : <div className={styles.notice}>{tr(locale, "The event record is no longer available.", "El registro del evento ya no está disponible.")}</div>}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Attempt history", "Historial de intentos")}</div>
          <h2>{tr(locale, "Delivery attempts", "Intentos de entrega")}</h2>
          {detail.attempts.length ? <div className={styles.auditList}>{detail.attempts.map((attempt) => (
            <div className={styles.auditItem} key={attempt.id}>
              <strong>#{attempt.attempt} · {attempt.outcome}</strong><br />
              {formatOperatorDate(attempt.occurredAt, locale, true)}{attempt.responseStatus ? ` · HTTP ${attempt.responseStatus}` : ""}<br />
              {attempt.error ?? ""}
            </div>
          ))}</div> : <p className={styles.muted}>{tr(locale, "No delivery attempts recorded yet.", "Todavía no hay intentos de entrega registrados.")}</p>}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Replay audit", "Auditoría de replay")}</div>
          <h2>{tr(locale, "Requeue history", "Historial de requeue")}</h2>
          {detail.replays.length ? <div className={styles.auditList}>{detail.replays.map((replay) => (
            <div className={styles.auditItem} key={replay.id}>
              <strong>{replay.actorRole} · {replay.actorIdentityId}</strong><br />
              {formatOperatorDate(replay.occurredAt, locale, true)} · {tr(locale, "previous attempts", "intentos anteriores")}: {replay.previousAttempts}<br />
              {replay.reason}
            </div>
          ))}</div> : <p className={styles.muted}>{tr(locale, "This delivery has never been manually requeued.", "Esta entrega nunca se ha reencolado manualmente.")}</p>}
        </section>
      </div>
    </main>
  );
}
