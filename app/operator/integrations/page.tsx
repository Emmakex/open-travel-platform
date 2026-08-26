import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import {
  deleteIntegrationEndpointAction,
  processIntegrationDeliveriesAction,
  saveIntegrationEndpointAction
} from "@/app/operator/integrations/actions";
import {
  integrationEventTypes,
  listIntegrationEndpointSummaries
} from "@/lib/integration-endpoints";
import {
  getIntegrationCompletedRetentionDays,
  getIntegrationHealthMetrics,
  getIntegrationWorkerBatchSize,
  getIntegrationWorkerMinimumIntervalSeconds
} from "@/lib/integration-operations";
import { listRecentIntegrationDeliveries } from "@/lib/integration-outbox";
import { isIntegrationSecretEncryptionConfigured } from "@/lib/integration-secrets";
import { isIntegrationWorkerAuthConfigured } from "@/lib/integration-worker-auth";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorDate, tr } from "@/lib/operator-i18n";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

export const metadata = {
  title: "Integrations | Kairoseth Travel",
  description: "Admin-only outbound integration configuration and delivery operations."
};

function eventLabel(event: string, locale: "en" | "es") {
  const labels: Record<string, [string, string]> = {
    "trip.reservation.created": ["Trip reservation created", "Reserva de viaje creada"],
    "trip.reservation.status.changed": ["Trip reservation status changed", "Estado de reserva de viaje cambiado"],
    "service.reservation.created": ["Service reservation created", "Reserva de servicio creada"],
    "service.reservation.status.changed": ["Service reservation status changed", "Estado de reserva de servicio cambiado"]
  };
  const pair = labels[event] ?? [event, event];
  return locale === "es" ? pair[1] : pair[0];
}

function percentage(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

export default async function OperatorIntegrationsPage({
  searchParams
}: {
  searchParams: Promise<{
    saved?: string;
    deleted?: string;
    error?: string;
    processed?: string;
    succeeded?: string;
    retried?: string;
    dead?: string;
  }>;
}) {
  const [locale, query] = await Promise.all([getLocale(), searchParams]);
  await requireAdminIdentity();
  const encryptionReady = isIntegrationSecretEncryptionConfigured();
  const workerAuthReady = isIntegrationWorkerAuthConfigured();
  const [endpoints, deliveries, health] = await Promise.all([
    listIntegrationEndpointSummaries(),
    listRecentIntegrationDeliveries(100),
    getIntegrationHealthMetrics()
  ]);
  const endpointById = new Map(endpoints.map((endpoint) => [endpoint.id, endpoint]));
  const workerBatch = getIntegrationWorkerBatchSize();
  const workerMinimumInterval = getIntegrationWorkerMinimumIntervalSeconds();
  const retentionDays = getIntegrationCompletedRetentionDays();
  const errors: Record<string, string> = {
    "encryption-required": tr(locale, "Set INTEGRATION_SECRETS_KEY before storing webhook secrets.", "Configura INTEGRATION_SECRETS_KEY antes de guardar secretos de webhook."),
    "invalid-name": tr(locale, "Use an integration name between 3 and 120 characters.", "Usa un nombre de integración de entre 3 y 120 caracteres."),
    "invalid-url": tr(locale, "Enter a valid webhook URL.", "Introduce una URL de webhook válida."),
    "https-required": tr(locale, "Outbound webhook URLs must use HTTPS.", "Las URLs de webhooks salientes deben usar HTTPS."),
    "private-target": tr(locale, "The webhook target resolves to a private, local or reserved network and was rejected.", "El webhook resuelve a una red privada, local o reservada y ha sido rechazado."),
    "events-required": tr(locale, "Select at least one event to deliver.", "Selecciona al menos un evento para enviar."),
    "not-found": tr(locale, "The integration endpoint could not be found.", "No se ha encontrado el endpoint de integración."),
    "secret-required": tr(locale, "Enter a signing secret of at least 16 characters for a new endpoint.", "Introduce un secreto de firma de al menos 16 caracteres para un endpoint nuevo."),
    "worker-busy": tr(locale, "The integration worker is already running or inside its minimum interval. Try again after the current run window.", "El worker de integraciones ya está ejecutándose o dentro de su intervalo mínimo. Inténtalo después de la ventana actual."),
    "worker-failed": tr(locale, "The integration worker run failed. Review server logs and delivery diagnostics.", "La ejecución del worker de integraciones falló. Revisa los logs del servidor y los diagnósticos de entrega."),
    "delivery-not-found": tr(locale, "The integration delivery could not be found.", "No se ha encontrado la entrega de integración."),
    "save-failed": tr(locale, "The integration endpoint could not be saved.", "No se pudo guardar el endpoint de integración.")
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Admin · Integrations", "Admin · Integraciones")}</div>
          <h1>{tr(locale, "Outbound integrations", "Integraciones salientes")}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "Configure provider-neutral signed webhooks for reservation events and operate their durable delivery queue. Endpoints receive a minimal operational event envelope rather than internal database documents or protected traveller data.",
            "Configura webhooks firmados y neutrales respecto a proveedor para eventos de reservas y opera su cola durable de entregas. Los endpoints reciben un evento operativo mínimo, no documentos internos de base de datos ni datos protegidos de viajeros."
          )}</p>
          <div className={styles.notice}>{tr(
            locale,
            "Webhook targets are HTTPS-only and are revalidated against private/reserved networks before every delivery. Redirects are not followed. Signing secrets are encrypted at rest and never displayed after saving.",
            "Los destinos webhook deben usar HTTPS y se vuelven a validar contra redes privadas/reservadas antes de cada entrega. No se siguen redirecciones. Los secretos de firma se cifran en reposo y nunca vuelven a mostrarse después de guardarlos."
          )}</div>
          {!encryptionReady ? <div className={styles.notice}><strong>{tr(locale, "Server encryption key required", "Falta la clave de cifrado del servidor")}</strong><br />{tr(locale, "Set INTEGRATION_SECRETS_KEY once in the deployment environment before creating integrations.", "Configura INTEGRATION_SECRETS_KEY una sola vez en el entorno del despliegue antes de crear integraciones.")}</div> : null}
          {query.saved ? <div className={styles.notice}>{tr(locale, "Integration endpoint saved.", "Endpoint de integración guardado.")}</div> : null}
          {query.deleted ? <div className={styles.notice}>{tr(locale, "Integration endpoint deleted. Existing queued deliveries keep their audit history and will eventually dead-letter if the endpoint remains unavailable.", "Endpoint eliminado. Las entregas ya encoladas conservan su historial y acabarán en dead-letter si el endpoint sigue sin estar disponible.")}</div> : null}
          {query.error && errors[query.error] ? <div className={styles.notice}>{errors[query.error]}</div> : null}
          {query.processed !== undefined ? <div className={styles.notice}>{tr(
            locale,
            `Delivery run: ${query.processed} processed · ${query.succeeded ?? 0} succeeded · ${query.retried ?? 0} retrying · ${query.dead ?? 0} dead-lettered.`,
            `Ejecución de entregas: ${query.processed} procesadas · ${query.succeeded ?? 0} correctas · ${query.retried ?? 0} en reintento · ${query.dead ?? 0} en dead-letter.`
          )}</div> : null}
          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link>
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Queue health · last 24 hours", "Salud de cola · últimas 24 horas")}</div>
          <h2>{tr(locale, "Integration delivery health", "Salud de entregas de integración")}</h2>
          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{health.pending}</strong><span>Pending</span></div>
            <div className={styles.metric}><strong>{health.retrying}</strong><span>Retrying</span></div>
            <div className={styles.metric}><strong>{health.deadLetter}</strong><span>Dead-letter</span></div>
            <div className={styles.metric}><strong>{percentage(health.recentSuccessRate)}</strong><span>{tr(locale, "Attempt success", "Éxito de intentos")}</span></div>
            <div className={styles.metric}><strong>{percentage(health.recentFailureRate)}</strong><span>{tr(locale, "Attempt failure", "Fallo de intentos")}</span></div>
          </div>
          <div className={styles.notice}>
            <strong>{tr(locale, "Oldest due delivery", "Entrega vencida más antigua")}:</strong>{" "}
            {health.oldestDueAt ? formatOperatorDate(health.oldestDueAt, locale, true) : tr(locale, "none", "ninguna")}<br />
            {tr(locale, `${health.recentAttempts} attempts observed in the last 24 hours.`, `${health.recentAttempts} intentos observados en las últimas 24 horas.`)}
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Scheduler / worker", "Scheduler / worker")}</div>
          <h2>{tr(locale, "Server-only scheduled execution", "Ejecución programada server-only")}</h2>
          <p className={styles.lead}>{tr(
            locale,
            "Deployments can POST to /api/internal/integrations/process with a server-only Bearer token. The route uses a durable worker lease and minimum interval so browser sessions are not required and overlapping schedulers are bounded.",
            "Los despliegues pueden hacer POST a /api/internal/integrations/process con un Bearer token server-only. La ruta usa un lease durable y un intervalo mínimo para no depender de sesiones de navegador y limitar schedulers solapados."
          )}</p>
          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{workerAuthReady ? tr(locale, "READY", "LISTO") : tr(locale, "NOT CONFIGURED", "SIN CONFIGURAR")}</strong><span>{tr(locale, "Worker authentication", "Autenticación del worker")}</span></div>
            <div className={styles.metric}><strong>{workerBatch}</strong><span>{tr(locale, "Scheduled batch", "Lote programado")}</span></div>
            <div className={styles.metric}><strong>{workerMinimumInterval}s</strong><span>{tr(locale, "Minimum interval", "Intervalo mínimo")}</span></div>
            <div className={styles.metric}><strong>{retentionDays}d</strong><span>{tr(locale, "Completed retention", "Retención completada")}</span></div>
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Reference adapter", "Adapter de referencia")}</div>
          <h2>{tr(locale, "Add signed webhook endpoint", "Añadir endpoint webhook firmado")}</h2>
          <form action={saveIntegrationEndpointAction} className={styles.editorForm}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>{tr(locale, "Name", "Nombre")}</span>
                <input name="name" minLength={3} maxLength={120} required placeholder={tr(locale, "Example: CRM booking webhook", "Ejemplo: webhook de reservas del CRM")} />
              </label>
              <label className={styles.field}>
                <span>HTTPS URL</span>
                <input name="url" type="url" required placeholder="https://integration.example.com/webhooks/travel" autoComplete="off" />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Signing secret", "Secreto de firma")}</span>
                <input name="signingSecret" type="password" minLength={16} required autoComplete="new-password" placeholder={tr(locale, "Minimum 16 characters", "Mínimo 16 caracteres")} />
              </label>
            </div>
            <div className={styles.editorSection}>
              <strong>{tr(locale, "Subscribed events", "Eventos suscritos")}</strong>
              {integrationEventTypes.map((event) => (
                <label className={styles.checkboxField} key={event}>
                  <input type="checkbox" name="event" value={event} defaultChecked />
                  <span>{eventLabel(event, locale)} · <code>{event}</code></span>
                </label>
              ))}
            </div>
            <label className={styles.checkboxField}>
              <input type="checkbox" name="enabled" defaultChecked />
              <span>{tr(locale, "Enable deliveries immediately", "Activar entregas inmediatamente")}</span>
            </label>
            <button className="button button-primary" type="submit" disabled={!encryptionReady}>{tr(locale, "Create integration", "Crear integración")}</button>
          </form>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Endpoints", "Endpoints")}</div>
          <h2>{tr(locale, "Configured integrations", "Integraciones configuradas")}</h2>
          {endpoints.length ? (
            <div className={styles.managementList}>
              {endpoints.map((endpoint) => (
                <article className={styles.editorSection} key={endpoint.id}>
                  <div className={styles.sectionHeaderCompact}>
                    <div><strong>{endpoint.name}</strong><p className={styles.muted}>{endpoint.url}</p></div>
                    <span className={styles.badge}>{endpoint.enabled ? tr(locale, "Enabled", "Activa") : tr(locale, "Disabled", "Inactiva")}</span>
                  </div>
                  <form action={saveIntegrationEndpointAction} className={styles.editorForm}>
                    <input type="hidden" name="endpointId" value={endpoint.id} />
                    <div className={styles.formGrid}>
                      <label className={styles.field}><span>{tr(locale, "Name", "Nombre")}</span><input name="name" defaultValue={endpoint.name} minLength={3} maxLength={120} required /></label>
                      <label className={styles.field}><span>HTTPS URL</span><input name="url" type="url" defaultValue={endpoint.url} required /></label>
                      <label className={styles.field}><span>{tr(locale, "Replace signing secret", "Sustituir secreto de firma")}</span><input name="signingSecret" type="password" minLength={16} autoComplete="new-password" placeholder={tr(locale, "Leave blank to keep current secret", "Deja vacío para conservar el secreto actual")} /></label>
                    </div>
                    {integrationEventTypes.map((event) => (
                      <label className={styles.checkboxField} key={event}>
                        <input type="checkbox" name="event" value={event} defaultChecked={endpoint.subscribedEvents.includes(event)} />
                        <span>{eventLabel(event, locale)}</span>
                      </label>
                    ))}
                    <label className={styles.checkboxField}><input type="checkbox" name="enabled" defaultChecked={endpoint.enabled} /><span>{tr(locale, "Endpoint enabled", "Endpoint activo")}</span></label>
                    <button className="button button-secondary" type="submit">{tr(locale, "Save endpoint", "Guardar endpoint")}</button>
                  </form>
                  <form action={deleteIntegrationEndpointAction}>
                    <input type="hidden" name="endpointId" value={endpoint.id} />
                    <button className="button button-secondary" type="submit">{tr(locale, "Delete endpoint", "Eliminar endpoint")}</button>
                  </form>
                </article>
              ))}
            </div>
          ) : <div className={styles.notice}>{tr(locale, "No outbound integrations are configured yet.", "Todavía no hay integraciones salientes configuradas.")}</div>}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Delivery worker", "Procesador de entregas")}</div>
          <h2>{tr(locale, "Pending and recent deliveries", "Entregas pendientes y recientes")}</h2>
          <p className={styles.lead}>{tr(
            locale,
            "The Admin processor and the server-only scheduler share the same durable worker lock. Delivery records still use per-item leases for crash recovery and concurrency safety.",
            "El procesador de Admin y el scheduler server-only comparten el mismo lock durable del worker. Las entregas siguen usando leases por elemento para recuperación tras caída y seguridad ante concurrencia."
          )}</p>
          <form action={processIntegrationDeliveriesAction}>
            <button className="button button-primary" type="submit">{tr(locale, "Process up to 25 due deliveries", "Procesar hasta 25 entregas vencidas")}</button>
          </form>
          {deliveries.length ? (
            <div className={styles.list} style={{ marginTop: "1rem" }}>
              {deliveries.slice(0, 50).map((delivery) => {
                const endpoint = endpointById.get(delivery.endpointId);
                return (
                  <Link className={styles.row} href={`/operator/integrations/deliveries/${encodeURIComponent(delivery.id)}`} key={delivery.id}>
                    <strong>{endpoint?.name ?? delivery.endpointId}</strong>
                    <span className={styles.badge}>{delivery.status}</span>
                    <span>{tr(locale, "Attempts", "Intentos")}: {delivery.attempts}</span>
                    <span>{formatOperatorDate(delivery.updatedAt ?? delivery.createdAt, locale, true)}</span>
                  </Link>
                );
              })}
            </div>
          ) : <p className={styles.muted}>{tr(locale, "No deliveries have been queued yet. New events are queued only for endpoints that were enabled and subscribed when the reservation transaction committed.", "Todavía no hay entregas encoladas. Los nuevos eventos solo se encolan para endpoints que estaban activos y suscritos cuando se confirmó la transacción de reserva.")}</p>}
        </section>
      </div>
    </main>
  );
}
