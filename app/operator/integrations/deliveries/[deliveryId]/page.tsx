import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/operator/operator.module.css";
import { requeueIntegrationDeliveryAction } from "@/app/operator/integrations/actions";
import { listIntegrationEndpointSummaries } from "@/lib/integration-endpoints";
import { getIntegrationDeliveryDetails } from "@/lib/integration-operations";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorDate, tr } from "@/lib/operator-i18n";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

export const metadata = {
  title: "Integration delivery | Kairoseth Travel",
  description: "Admin-only outbound integration delivery diagnostics."
};

export default async function IntegrationDeliveryPage({
  params,
  searchParams
}: {
  params: Promise<{ deliveryId: string }>;
  searchParams: Promise<{ requeued?: string; error?: string }>;
}) {
  const [locale, routeParams, query] = await Promise.all([getLocale(), params, searchParams]);
  await requireAdminIdentity();
  const details = await getIntegrationDeliveryDetails(routeParams.deliveryId);
  if (!details) notFound();
  const endpoints = await listIntegrationEndpointSummaries();
  const endpoint = endpoints.find((item) => item.id === details.delivery.endpointId);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Admin · Integration delivery", "Admin · Entrega de integración")}</div>
          <h1>{endpoint?.name ?? details.delivery.endpointId}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "Delivery diagnostics expose status, bounded error text and attempt history only. Signing secrets and protected traveller values are never rendered here.",
            "Los diagnósticos de entrega solo muestran estado, texto de error limitado e historial de intentos. Los secretos de firma y los valores protegidos del viajero nunca se muestran aquí."
          )}</p>
          {query.requeued ? <div className={styles.notice}>{tr(locale, "Dead-letter delivery requeued for a new bounded retry cycle.", "La entrega dead-letter se ha reencolado para un nuevo ciclo limitado de reintentos.")}</div> : null}
          {query.error === "not-dead-letter" ? <div className={styles.notice}>{tr(locale, "Only current dead-letter deliveries can be requeued.", "Solo se pueden reencolar entregas que estén actualmente en dead-letter.")}</div> : null}
          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator/integrations">{tr(locale, "← Integrations", "← Integraciones")}</Link>
            {details.event ? <Link className="button button-secondary" href={`/operator/integrations/events/${encodeURIComponent(details.event.id)}`}>{tr(locale, "View event", "Ver evento")}</Link> : null}
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Delivery state", "Estado de entrega")}</div>
          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{details.delivery.status}</strong><span>{tr(locale, "Status", "Estado")}</span></div>
            <div className={styles.metric}><strong>{details.delivery.attempts}</strong><span>{tr(locale, "Current-cycle attempts", "Intentos del ciclo actual")}</span></div>
            <div className={styles.metric}><strong>{details.delivery.responseStatus ?? "—"}</strong><span>HTTP</span></div>
          </div>
          <div className={styles.auditList} style={{ marginTop: "1rem" }}>
            <div className={styles.auditItem}><strong>{tr(locale, "Delivery ID", "ID de entrega")}</strong><br /><code>{details.delivery.id}</code></div>
            <div className={styles.auditItem}><strong>{tr(locale, "Event ID", "ID de evento")}</strong><br /><code>{details.delivery.eventId}</code></div>
            <div className={styles.auditItem}><strong>{tr(locale, "Endpoint", "Endpoint")}</strong><br />{endpoint?.url ?? details.delivery.endpointId}</div>
            <div className={styles.auditItem}><strong>{tr(locale, "Created", "Creada")}</strong><br />{formatOperatorDate(details.delivery.createdAt, locale, true)}</div>
            <div className={styles.auditItem}><strong>{tr(locale, "Next attempt", "Próximo intento")}</strong><br />{formatOperatorDate(details.delivery.nextAttemptAt, locale, true)}</div>
            {details.delivery.lastError ? <div className={styles.auditItem}><strong>{tr(locale, "Last bounded error", "Último error limitado")}</strong><br />{details.delivery.lastError}</div> : null}
          </div>
          {details.delivery.status === "dead-letter" ? (
            <form action={requeueIntegrationDeliveryAction} style={{ marginTop: "1rem" }}>
              <input type="hidden" name="deliveryId" value={details.delivery.id} />
              <button className="button button-primary" type="submit">{tr(locale, "Requeue dead-letter delivery", "Reencolar entrega dead-letter")}</button>
            </form>
          ) : null}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Attempt history", "Historial de intentos")}</div>
          <h2>{tr(locale, "Durable delivery attempts", "Intentos de entrega durables")}</h2>
          {details.attempts.length ? (
            <div className={styles.auditList}>
              {details.attempts.map((attempt) => (
                <div className={styles.auditItem} key={attempt.id}>
                  <strong>#{attempt.attempt} · {attempt.outcome}</strong><br />
                  {formatOperatorDate(attempt.occurredAt, locale, true)}
                  {attempt.responseStatus ? <> · HTTP {attempt.responseStatus}</> : null}
                  {attempt.error ? <><br />{attempt.error}</> : null}
                </div>
              ))}
            </div>
          ) : <p className={styles.muted}>{tr(locale, "No delivery attempts have been recorded yet.", "Todavía no se han registrado intentos de entrega.")}</p>}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Replay audit", "Auditoría de replay")}</div>
          <h2>{tr(locale, "Manual dead-letter requeues", "Reencolados manuales de dead-letter")}</h2>
          {details.audit.length ? (
            <div className={styles.auditList}>
              {details.audit.map((item) => (
                <div className={styles.auditItem} key={item.id}>
                  <strong>{item.action}</strong> · {tr(locale, "previous attempts", "intentos previos")}: {item.previousAttempts}<br />
                  {formatOperatorDate(item.occurredAt, locale, true)} · {item.actorRole} · {item.actorIdentityId}
                </div>
              ))}
            </div>
          ) : <p className={styles.muted}>{tr(locale, "This delivery has not been manually requeued.", "Esta entrega no se ha reencolado manualmente.")}</p>}
        </section>
      </div>
    </main>
  );
}
