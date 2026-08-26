import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { tr } from "@/lib/operator-i18n";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

export default async function OperatorIntegrationsLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  await requireAdminIdentity();
  return (
    <>
      <div className="section" style={{ paddingBottom: 0 }}>
        <div className={`container ${styles.shell}`}>
          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator/integrations">
              {tr(locale, "Webhooks & queue", "Webhooks y cola")}
            </Link>
            <Link className="button button-secondary" href="/operator/integrations/crm">
              {tr(locale, "CRM sync", "Sincronización CRM")}
            </Link>
            <Link className="button button-secondary" href="/operator/integrations/erp">
              {tr(locale, "ERP / accounting", "ERP / contabilidad")}
            </Link>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
