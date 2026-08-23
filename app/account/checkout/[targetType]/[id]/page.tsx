import Link from "next/link";
import { notFound } from "next/navigation";
import { startPaymentCheckoutAction } from "@/app/account/checkout/actions";
import styles from "@/app/account/account.module.css";
import type { PaymentTargetType } from "@/domain/payment/types";
import { getLocale } from "@/lib/get-locale";
import { getCheckoutPaymentSchedule, resolveCheckoutTargetForCustomer } from "@/lib/payment-checkout";
import { listEnabledPaymentProviders } from "@/lib/payment-provider-config";
import { paymentStatusLabel } from "@/lib/payment-i18n";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";

function validTargetType(value: string): PaymentTargetType | null {
  return value === "trip" || value === "service" ? value : null;
}

function money(value: number, currency: string, locale: "en" | "es") {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(value: string, locale: "en" | "es") {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function UnifiedCheckoutPage({ params, searchParams }: {
  params: Promise<{ targetType: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ targetType: rawType, id }, query, locale] = await Promise.all([params, searchParams, getLocale()]);
  const targetType = validTargetType(rawType);
  if (!targetType) notFound();
  const identity = await requireCustomerIdentity();
  const target = await resolveCheckoutTargetForCustomer(identity.id, targetType, id);
  if (!target) notFound();
  const [{ summary, schedule }, providers] = await Promise.all([
    getCheckoutPaymentSchedule(target),
    listEnabledPaymentProviders()
  ]);
  const publicProviders = process.env.NODE_ENV === "production"
    ? providers.filter((provider) => provider.activeEnvironment === "live")
    : providers;
  const t = (en: string, es: string) => locale === "es" ? es : en;
  const errors: Record<string, string> = {
    "invalid-request": t("The payment request is incomplete.", "La solicitud de pago está incompleta."),
    "provider-unavailable": t("That payment method is not available right now.", "Ese método de pago no está disponible ahora mismo."),
    "already-paid": t("This reservation has no outstanding balance.", "Esta reserva no tiene saldo pendiente."),
    "payment-pending": t("A payment is already being processed for this reservation.", "Ya hay un pago en proceso para esta reserva."),
    "cancelled": t("Cancelled reservations cannot be paid.", "Las reservas canceladas no se pueden pagar."),
    "provider-error": t("We could not open the payment page. Please try again.", "No se ha podido abrir la página de pago. Inténtalo de nuevo.")
  };
  const next = schedule.nextInstallment;
  const canPayOnline = !schedule.outdated && target.status !== "cancelled" && summary.outstandingAmount > 0 && summary.pendingPaymentAmount <= 0;

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{t("Secure payment", "Pago seguro")}</div>
          <h1>{target.label}</h1>
          <p className={styles.lead}>{t("Review the amount due and choose an available payment method. Your reservation will show the updated payment status once the payment has been confirmed.", "Revisa el importe pendiente y elige un método de pago disponible. La reserva mostrará el estado actualizado cuando el pago quede confirmado.")}</p>

          {query.error && errors[query.error] ? <div className={styles.notice}>{errors[query.error]}</div> : null}
          {schedule.outdated ? (
            <div className={styles.notice}>
              <strong>{t("Your payment plan needs review before another online payment can be made.", "Tu plan de pagos necesita una revisión antes de realizar otro pago online.")}</strong><br />
              {t("Return to the reservation for the latest balance and payment information.", "Vuelve a la reserva para consultar el saldo y la información de pago actualizados.")}
            </div>
          ) : null}

          <dl className={styles.profileList}>
            <div><dt>{t("Payment status", "Estado del pago")}</dt><dd>{paymentStatusLabel(summary.status, locale)}</dd></div>
            <div><dt>{t("Reservation total", "Total de la reserva")}</dt><dd>{money(summary.totalAmount, summary.currency, locale)}</dd></div>
            <div><dt>{t("Already paid", "Ya pagado")}</dt><dd>{money(summary.netPaidAmount, summary.currency, locale)}</dd></div>
            <div><dt>{t("Amount still due", "Pendiente de pago")}</dt><dd>{money(summary.outstandingAmount, summary.currency, locale)}</dd></div>
            {next && !schedule.outdated ? (
              <div>
                <dt>{t("Next payment", "Siguiente pago")}</dt>
                <dd>
                  <strong>{money(schedule.nextPaymentAmount, summary.currency, locale)}</strong>
                  {next.dueDate ? ` · ${t("due", "vence")} ${formatDate(next.dueDate, locale)}` : ""}
                  <br />
                  {locale === "es" ? (next.labelEs || next.label) : next.label}
                </dd>
              </div>
            ) : null}
          </dl>

          {target.status === "cancelled" ? (
            <div className={styles.notice}>{t("This reservation is cancelled and cannot receive payments.", "Esta reserva está cancelada y no admite pagos.")}</div>
          ) : summary.outstandingAmount <= 0 ? (
            <div className={styles.notice}>{t("This reservation is fully paid.", "Esta reserva está pagada por completo.")}</div>
          ) : summary.pendingPaymentAmount > 0 ? (
            <div className={styles.notice}>{t("A payment is awaiting confirmation. You do not need to pay again.", "Hay un pago pendiente de confirmación. No necesitas volver a pagar.")}</div>
          ) : canPayOnline && publicProviders.length ? (
            <div className={styles.actions}>
              {publicProviders.map((provider) => (
                <form action={startPaymentCheckoutAction} key={provider.provider}>
                  <input type="hidden" name="targetType" value={target.targetType} />
                  <input type="hidden" name="targetId" value={target.targetId} />
                  <input type="hidden" name="provider" value={provider.provider} />
                  <button className="button button-primary" type="submit">
                    {t("Pay", "Pagar")} {money(schedule.nextPaymentAmount || summary.outstandingAmount, summary.currency, locale)} {t("with", "con")} {provider.label}
                  </button>
                </form>
              ))}
            </div>
          ) : canPayOnline && !publicProviders.length ? (
            <div className={styles.notice}>{t("Online payment is not available for this reservation right now.", "El pago online no está disponible para esta reserva en este momento.")}</div>
          ) : null}

          <p><Link className="text-link" href={target.detailUrl}>{t("← Back to reservation", "← Volver a la reserva")}</Link></p>
        </section>
      </div>
    </main>
  );
}
