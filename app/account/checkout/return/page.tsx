import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/account/account.module.css";
import { getLocale } from "@/lib/get-locale";
import { finalizeCheckoutOrder, getCheckoutOrderForCustomer, resolveCheckoutTargetForCustomer } from "@/lib/payment-checkout";
import { getActivePaymentProviderCredentials } from "@/lib/payment-provider-config";
import { retrieveStripeCheckoutSession } from "@/lib/payment-stripe";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";

export default async function CheckoutReturnPage({ searchParams }: {
  searchParams: Promise<{ checkout?: string; provider?: string; session_id?: string; result?: string }>;
}) {
  const [query, locale] = await Promise.all([searchParams, getLocale()]);
  const identity = await requireCustomerIdentity();
  if (!query.checkout) notFound();
  let order = await getCheckoutOrderForCustomer(identity.id, query.checkout);
  if (!order) notFound();

  if (order.provider === "stripe" && order.status === "pending" && query.session_id && (!order.providerReference || order.providerReference === query.session_id)) {
    const credentials = await getActivePaymentProviderCredentials("stripe");
    if (credentials?.provider === "stripe" && credentials.environment === order.environment) {
      try {
        const session = await retrieveStripeCheckoutSession(credentials, query.session_id);
        if (session.id === query.session_id && (session.payment_status === "paid" || session.payment_status === "no_payment_required")) {
          await finalizeCheckoutOrder(order.id, "paid", session.id);
        } else if (session.status === "expired") {
          await finalizeCheckoutOrder(order.id, "failed", session.id);
        }
        order = await getCheckoutOrderForCustomer(identity.id, order.id) ?? order;
      } catch (error) {
        console.error("Stripe checkout reconciliation on return failed", error);
      }
    }
  }

  const target = await resolveCheckoutTargetForCustomer(identity.id, order.targetType, order.targetId);
  const t = (en: string, es: string) => locale === "es" ? es : en;
  const title = order.status === "paid"
    ? t("Payment confirmed", "Pago confirmado")
    : order.status === "failed"
      ? t("Payment not completed", "Pago no completado")
      : t("Payment is being confirmed", "Estamos confirmando el pago");
  const message = order.status === "paid"
    ? t("Your payment has been confirmed. You can return to the reservation to see the updated balance.", "Tu pago ha quedado confirmado. Puedes volver a la reserva para consultar el saldo actualizado.")
    : order.status === "failed"
      ? t("The payment was not completed. Return to the reservation when you are ready to try again.", "El pago no se ha completado. Vuelve a la reserva cuando quieras intentarlo de nuevo.")
      : t("The payment is still being confirmed. Please do not pay again while this status is pending.", "El pago todavía se está confirmando. No vuelvas a pagar mientras este estado siga pendiente.");

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{t("Payment status", "Estado del pago")}</div>
          <h1>{title}</h1>
          <p className={styles.lead}>{message}</p>
          <dl className={styles.profileList}>
            <div><dt>{t("Reservation", "Reserva")}</dt><dd>{order.targetLabel}</dd></div>
            <div><dt>{t("Amount", "Importe")}</dt><dd>{new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", { style: "currency", currency: order.currency }).format(order.amount)}</dd></div>
            <div><dt>{t("Payment reference", "Referencia del pago")}</dt><dd>{order.id}</dd></div>
          </dl>
          <div className={styles.actions}>
            {target ? <Link className="button button-primary" href={target.detailUrl}>{t("View reservation", "Ver reserva")}</Link> : null}
            {order.status === "pending" ? <Link className="button button-secondary" href={`/account/checkout/return?checkout=${encodeURIComponent(order.id)}&provider=${order.provider}`}>{t("Refresh status", "Actualizar estado")}</Link> : null}
            <Link className="button button-secondary" href="/account">{t("My account", "Mi cuenta")}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
