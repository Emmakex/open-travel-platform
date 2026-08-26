import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { erpAccountingMode, isErpAccountingConfigured } from "@/lib/erp-accounting-config";
import { listErpAccountingLinks, listRecentErpAccountingAudit } from "@/lib/erp-accounting-sync";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorDate, tr } from "@/lib/operator-i18n";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

export const metadata = {
  title: "ERP / accounting | Kairoseth Travel",
  description: "Admin-only ERP/accounting synchronization status and audit metadata."
};

export default async function OperatorErpAccountingPage() {
  const locale = await getLocale();
  await requireAdminIdentity();
  const configured = isErpAccountingConfigured();
  const [audit, links] = await Promise.all([
    listRecentErpAccountingAudit(100).catch(() => []),
    listErpAccountingLinks(100).catch(() => [])
  ]);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Admin · Integrations", "Admin · Integraciones")}</div>
          <h1>{tr(locale, "ERP / accounting synchronization", "Sincronización ERP / contabilidad")}</h1>
          <p className={styles.lead}>{tr(
            locale,
            "ERP/accounting synchronization is downstream-only. Only succeeded payment and refund movements from the authoritative local ledger are exported. The ERP can acknowledge an external reference, but it cannot change reservations, inventory or payment/refund history.",
            "La sincronización ERP/contabilidad es exclusivamente downstream. Solo se exportan movimientos de pago y reembolso correctos del ledger local autoritativo. El ERP puede confirmar una referencia externa, pero no puede cambiar reservas, inventario ni el historial de pagos/reembolsos."
          )}</p>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <strong>{erpAccountingMode.toUpperCase()}</strong>
              <span>{tr(locale, "Configured mode", "Modo configurado")}</span>
            </div>
            <div className={styles.metric}>
              <strong>{configured ? tr(locale, "READY", "LISTO") : tr(locale, "DISABLED", "DESACTIVADO")}</strong>
              <span>{tr(locale, "Runtime status", "Estado runtime")}</span>
            </div>
            <div className={styles.metric}>
              <strong>{links.length}</strong>
              <span>{tr(locale, "Recent external links", "Referencias externas recientes")}</span>
            </div>
            <div className={styles.metric}>
              <strong>{audit.length}</strong>
              <span>{tr(locale, "Recent acknowledgements", "Confirmaciones recientes")}</span>
            </div>
          </div>
          <div className={styles.notice}>{tr(
            locale,
            "This generic contract exports accounting-ready ledger movements, not jurisdiction-specific legal invoices. Tax IDs, billing addresses and chart-of-accounts mappings are not invented by the core; vendor/jurisdiction-specific accounting mapping belongs in the downstream adapter.",
            "Este contrato genérico exporta movimientos del ledger preparados para contabilidad, no facturas legales específicas de una jurisdicción. El core no inventa NIF, direcciones fiscales ni mapeos de plan contable; el mapping específico de proveedor/jurisdicción pertenece al adapter downstream."
          )}</div>
          {!configured ? <div className={styles.notice}>{tr(
            locale,
            "Set ERP_ACCOUNTING_MODE=rest and the server-only REST_ERP_ACCOUNTING_* variables to enable synchronization. Local payment accounting continues normally while ERP synchronization is disabled.",
            "Configura ERP_ACCOUNTING_MODE=rest y las variables server-only REST_ERP_ACCOUNTING_* para habilitar la sincronización. La contabilidad local de pagos sigue funcionando normalmente mientras la sincronización ERP esté desactivada."
          )}</div> : null}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "External references", "Referencias externas")}</div>
          <h2>{tr(locale, "Recent accounting links", "Referencias contables recientes")}</h2>
          <p className={styles.muted}>{tr(
            locale,
            "Links map the immutable local payment-movement ID to the downstream ERP/accounting ID. Amounts and currencies remain in the payment ledger rather than being duplicated in this metadata collection.",
            "Las referencias vinculan el ID inmutable del movimiento de pago local con el ID downstream del ERP/contabilidad. Importes y monedas permanecen en el ledger de pagos y no se duplican en esta colección de metadata."
          )}</p>
          {links.length ? (
            <div className={styles.managementList}>
              {links.map((entry) => (
                <article className={styles.managementRow} key={entry.id}>
                  <div><strong>{tr(locale, "Payment movement", "Movimiento de pago")}</strong><br /><span>{entry.localId}</span></div>
                  <span>{tr(locale, "External ID", "ID externo")}: {entry.externalId}</span>
                  <span>{entry.adapterId}</span>
                  <span>{formatOperatorDate(entry.lastSyncedAt, locale, true)}</span>
                </article>
              ))}
            </div>
          ) : <p className={styles.muted}>{tr(locale, "No ERP/accounting links yet.", "Todavía no hay referencias ERP/contabilidad.")}</p>}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Audit metadata", "Metadata de auditoría")}</div>
          <h2>{tr(locale, "Recent accounting acknowledgements", "Confirmaciones contables recientes")}</h2>
          <p className={styles.muted}>{tr(
            locale,
            "This view intentionally stores identifiers, adapter outcome and timestamps only. Financial amounts, currency, provider references, customer PII, raw HTTP bodies and bearer credentials are not stored in the ERP audit collection.",
            "Esta vista guarda intencionadamente solo identificadores, resultado del adapter y timestamps. Importes, moneda, referencias del proveedor, PII del cliente, cuerpos HTTP y credenciales Bearer no se guardan en la colección de auditoría ERP."
          )}</p>
          {audit.length ? (
            <div className={styles.managementList}>
              {audit.map((entry) => (
                <article className={styles.managementRow} key={entry.id}>
                  <div><strong>{tr(locale, "Payment movement", "Movimiento de pago")}</strong><br /><span>{entry.localId}</span></div>
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
          ) : <p className={styles.muted}>{tr(locale, "No ERP/accounting audit records yet.", "Todavía no hay registros de auditoría ERP/contabilidad.")}</p>}
        </section>
      </div>
    </main>
  );
}
