import { notFound, redirect } from "next/navigation";
import styles from "@/app/account/account.module.css";
import { RedsysAutoSubmitForm } from "@/components/redsys-auto-submit-form";
import { getLocale } from "@/lib/get-locale";
import { getCheckoutOrderForCustomer } from "@/lib/payment-checkout";
import { getActivePaymentProviderCredentials } from "@/lib/payment-provider-config";
import { buildRedsysPaymentForm } from "@/lib/payment-redsys";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";

export default async function RedsysCheckoutBridgePage({
  params
}: {
  params: Promise<{ checkoutId: string }>;
}) {
  const [{ checkoutId }, locale] = await Promise.all([params, getLocale()]);
  const identity = await requireCustomerIdentity();
  const order = await getCheckoutOrderForCustomer(identity.id, checkoutId);
  if (!order) notFound();
  if (order.provider !== "redsys") notFound();
  if (order.status !== "pending") {
    redirect(`/account/checkout/return?checkout=${encodeURIComponent(order.id)}&provider=redsys`);
  }

  const credentials = await getActivePaymentProviderCredentials("redsys");
  if (!credentials || credentials.provider !== "redsys" || credentials.environment !== order.environment) {
    redirect(`/account/checkout/${order.targetType}/${encodeURIComponent(order.targetId)}?error=provider-unavailable`);
  }
  const form = buildRedsysPaymentForm(order, credentials);
  const t = (en: string, es: string) => locale === "es" ? es : en;

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Redsys · {order.environment === "test" ? t("TEST", "PRUEBAS") : t("LIVE", "PRODUCCIÓN")}</div>
          <h1>{t("Redirecting to secure payment", "Redirigiendo al pago seguro")}</h1>
          <p id="redsys-handoff-status" className={styles.lead} role="status" aria-live="polite">
            {t(
              "You are being redirected to the bank payment page. If the redirect does not start automatically, use the button below.",
              "Te estamos redirigiendo a la página de pago del banco. Si la redirección no comienza automáticamente, utiliza el botón inferior."
            )}
          </p>
          <RedsysAutoSubmitForm action={form.action} fields={form.fields} label={t("Continue to Redsys", "Continuar a Redsys")} />
        </section>
      </div>
    </main>
  );
}
