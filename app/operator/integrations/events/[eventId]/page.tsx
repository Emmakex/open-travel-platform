import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/operator/operator.module.css";
import { listIntegrationEndpointSummaries } from "@/lib/integration-endpoints";
import { getIntegrationEventDetails } from "@/lib/integration-operations";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorDate, tr } from "@/lib/operator-i18n";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

export const metadata = {
  title: "Integration event | Kairoseth Travel",
  description: "Admin-only outbound integration event diagnostics."
};

export default async function IntegrationEventPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const [locale, routeParams] = await Promise.all([getLocale(), params]);
  await requireAdminIdentity();
  const details = await getIntegrationEventDetails(routeParams.eventId);
  if (!details) notFound();
  const endpoints = await listIntegrationEndpointSummaries();
  const endpointById = new Map(endpoints.map((endpoint) => [endpoint.id, endpoint]));

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Admin · Integration event", "Admin · Evento de integración")}</div>
          <h1>{details.event.type}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "This view shows the provider-neutral event envelope and its delivery fan-out. Signing secrets and protected traveller fields are not part of this diagnostic surface.",
            "Esta vista muestra el sobre de evento neutral respecto a proveedor y sus entregas. Los secretos de firma y los campos protegidos del viajero no forman parte de esta superficie de diagnóstico."
          )}</p>
          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator/integrations">{tr(locale, "← Integrations", "← Integraciones")}</Link>
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Event envelope", "Sobre del evento")}</div>
          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{details.event.version}</strong><span>{tr(locale, "Version", "Versión")}</span></div>
            <div className={styles.metric}><strong>{details.event.aggregateType}</strong><span>{tr(locale, "Aggregate", "Agregado")}</span></div>
            <div className={styles.metric}><strong>{details.deliveries.length}</strong><span>{tr(locale, "Deliveries", "Entregas")}</span></div>
          </div>
          <div className={styles.auditList} style={{ marginTop: "1rem" }}>
            <div className={styles.auditItem}><strong>ID</strong><br /><code>{details.event.id}</code></div>
            <div className={styles.auditItem}><strong>{tr(locale, "Aggregate ID", "ID del agregado")}</strong><br /><code>{details.event.aggregateId}</code></div>
            <div className={styles.auditItem}><strong>{tr(locale, "Occurred", "Ocurrido")}</strong><br />{formatOperatorDate(details.event.occurredAt, locale, true)}</div>
          </div>
          <h2 style={{ marginTop: "1rem" }}>{tr(locale, "Operational payload", "Payload operativo")}</h2>
          <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}>{JSON.stringify(details.event.payload, null, 2)}</pre>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Fan-out", "Distribución")}</div>
          <h2>{tr(locale, "Deliveries for this event", "Entregas de este evento")}</h2>
          {details.deliveries.length ? (
            <div className={styles.list}>
              {details.deliveries.map((delivery) => {
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
          ) : <div className={styles.notice}>{tr(locale, "No endpoint was subscribed when this event committed.", "Ningún endpoint estaba suscrito cuando se confirmó este evento.")}</div>}
        </section>
      </div>
    </main>
  );
}
