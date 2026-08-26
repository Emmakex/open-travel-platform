import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { crmSyncMode, isCrmSyncConfigured } from "@/lib/crm-sync-config";
import { listRecentCrmSyncAudit } from "@/lib/crm-sync";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorDate, tr } from "@/lib/operator-i18n";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

export const metadata = {
  title: "CRM sync | Kairoseth Travel",
  description: "Admin-only CRM synchronization status and audit metadata."
};

function entityLabel(entityType: string, locale: "en" | "es") {
  if (entityType === "contact") return tr(locale, "Contact", "Contacto");
  if (entityType === "trip-reservation") return tr(locale, "Trip reservation", "Reserva de viaje");
  if (entityType === "service-reservation") return tr(locale, "Service reservation", "Reserva de servicio");
  return entityType;
}

export default async function OperatorCrmSyncPage() {
  const locale = await getLocale();
  await requireAdminIdentity();
  const configured = isCrmSyncConfigured();
  const audit = await listRecentCrmSyncAudit(100).catch(() => []);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Admin · Integrations", "Admin · Integraciones")}</div>
          <h1>{tr(locale, "CRM synchronization", "Sincronización CRM")}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "CRM synchronization is downstream-only. It can receive allowlisted customer/contact and reservation lifecycle snapshots, but it cannot change booking state, pricing, inventory, supplier fulfilment or the payment ledger.",
            "La sincronización CRM es exclusivamente downstream. Puede recibir snapshots permitidos de contacto/cliente y ciclo de vida de reservas, pero no puede cambiar estados de reserva, pricing, inventario, fulfilment de proveedores ni el ledger de pagos."
          )}</p>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <strong>{crmSyncMode.toUpperCase()}</strong>
              <span>{tr(locale, "Configured mode", "Modo configurado")}</span>
            </div>
            <div className={styles.metric}>
              <strong>{configured ? tr(locale, "READY", "LISTO") : tr(locale, "DISABLED", "DESACTIVADO")}</strong>
              <span>{tr(locale, "Runtime status", "Estado runtime")}</span>
            </div>
            <div className={styles.metric}>
              <strong>{audit.length}</strong>
              <span>{tr(locale, "Recent sync records", "Registros recientes")}</span>
            </div>
          </div>
          <div className={styles.notice}>{tr(
            locale,
            "The generic CRM contract excludes payment values, supplier data, inventory mutation instructions, traveller arrays and protected post-purchase traveller fields. CRM contact/profile events are not available to generic webhook subscriptions.",
            "El contrato CRM genérico excluye importes de pago, datos de proveedores, instrucciones de mutación de inventario, arrays de viajeros y datos post-compra protegidos. Los eventos de contacto/perfil CRM no están disponibles para suscripciones webhook genéricas."
          )}</div>
          {!configured ? <div className={styles.notice}>{tr(
            locale,
            "Set CRM_SYNC_MODE=rest and the server-only REST_CRM_* variables to enable synchronization. Existing manual booking and Operator workflows continue normally while CRM sync is disabled.",
            "Configura CRM_SYNC_MODE=rest y las variables server-only REST_CRM_* para habilitar la sincronización. Las reservas y workflows manuales de Operator siguen funcionando normalmente mientras CRM esté desactivado."
          )}</div> : null}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Audit metadata", "Metadata de auditoría")}</div>
          <h2>{tr(locale, "Recent CRM upserts", "Upserts CRM recientes")}</h2>
          <p className={styles.muted}>{tr(
            locale,
            "This view intentionally shows identifiers and outcomes only. Contact names, email, phone, raw HTTP bodies and bearer credentials are not stored in this audit collection.",
            "Esta vista muestra intencionadamente solo identificadores y resultados. Nombres, email, teléfono, cuerpos HTTP y credenciales Bearer no se guardan en esta colección de auditoría."
          )}</p>
          {audit.length ? (
            <div className={styles.managementList}>
              {audit.map((entry) => (
                <article className={styles.managementRow} key={entry.id}>
                  <div>
                    <strong>{entityLabel(entry.entityType, locale)}</strong><br />
                    <span>{entry.localId}</span>
                  </div>
                  <span className={styles.badge}>{entry.outcome}</span>
                  <span>{tr(locale, "External ID", "ID externo")}: {entry.externalId}</span>
                  <span>{entry.adapterId}</span>
                  <span>{formatOperatorDate(entry.occurredAt, locale, true)}</span>
                  <Link className="text-link" href={`/operator/integrations/deliveries/${encodeURIComponent(entry.deliveryId)}`}>
                    {tr(locale, "Delivery details", "Detalle de entrega")}
                  </Link>
                </article>
              ))}
            </div>
          ) : <p className={styles.muted}>{tr(locale, "No CRM synchronization audit records yet.", "Todavía no hay registros de auditoría de sincronización CRM.")}</p>}
        </section>
      </div>
    </main>
  );
}
