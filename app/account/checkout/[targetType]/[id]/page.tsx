import Link from "next/link";
import { notFound } from "next/navigation";
import { startPaymentCheckoutAction } from "@/app/account/checkout/actions";
import styles from "@/app/account/account.module.css";
import type { PaymentTargetType } from "@/domain/payment/types";
import { getLocale } from "@/lib/get-locale";
import {
  getCheckoutPaymentSchedule,
  resolveCheckoutTargetForCustomer
} from "@/lib/payment-checkout";
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

export default async function UnifiedCheckoutPage({
  params,
  searchParams
}: {
  params: Promise<{ targetType: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ targetType: rawType, id }, query, locale] = await Promise.all([
    params,
    searchParams,
    getLocale()
  ]);
  const targetType = validTargetType(rawType);
  if (!targetType) notFound();
  const identity = await requireCustomerIdentity();
  const target = await resolveCheckoutTargetForCustomer(identity.id, targetType, id);
  if (!target) notFound();
  const [{ summary, schedule }, providers] = await Promise.all([
    getCheckoutPaymentSchedule(target),
    listEnabledPaymentProviders()
  ]);
  const t = (en: string, es: string) => locale === "es" ? es : en;
  const errors: Record<string, string> = {
    "invalid-request": t("The payment request is incomplete.", "La solicitud de pago está incompleta."),
    "provider-unavailable": t("That payment method is not available right now.", "Ese método de pago no está disponible ahora mismo."),
    "already-paid": t("This reservation has no outstanding balance.", "Esta reserva no tiene saldo pendiente."),
    "payment-pending": t("A payment is already being processed for this reservation.", "Ya hay un pago en proceso para esta reserva."),
    "cancelled": t("Cancelled reservations cannot be paid.", "Las reservas canceladas no se pueden pagar."),
    "provider-error": t("The payment provider could not start the checkout. Please try again.", "No se ha podido iniciar la pasarela de pago. Inténtalo de nuevo.")
  };
  const next = schedule.nextInstallment;

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{t("Secure checkout", "Pago seguro")}</div>
          <h1>{target.label}</h1>
          <p className={styles.lead}>
            {t(
              "Choose an available payment provider. The reservation remains the source of truth and the payment is confirmed only after the provider sends a verified server notification.",
              "Elige una pasarela disponible. La reserva sigue siendo la fuente de verdad y el pago solo se confirma cuando la pasarela envía una notificación verificada al servidor."
            )}
          </p>

          {query.error && errors[query.error] ? <div className={styles.notice}>{errors[query.error]}</div> : null}
          {schedule.outdated ? (
            <div className={styles.notice}>
              {t(
                "The configured payment schedule needs staff review, so checkout is temporarily using the full outstanding balance.",
                "El calendario de pagos configurado necesita revisión del equipo, por lo que temporalmente se utiliza todo el saldo pendiente."
              )}
            </div>
          ) : null}

          <dl className={styles.profileList}>
            <div><dt>{t("Payment status", "Estado del pago")}</dt><dd>{paymentStatusLabel(summary.status, locale)}</dd></div>
            <div><dt>{t("Reservation total", "Total de la reserva")}</dt><dd>{money(summary.totalAmount, summary.currency, locale)}</dd></div>
            <div><dt>{t("Already paid", "Ya pagado")}</dt><dd>{money(summary.netPaidAmount, summary.currency, locale)}</dd></div>
            <div><dt>{t("Total outstanding", "Pendiente total")}</dt><dd>{money(summary.outstandingAmount, summary.currency, locale)}</dd></div>
            {next ? (
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
            <div className={styles.notice}>{t("A payment is currently pending confirmation.", "Hay un pago pendiente de confirmación.")}</div>
          ) : providers.length ? (
            <div className={styles.actions}>
              {providers.map((provider) => (
                <form action={startPaymentCheckoutAction} key={provider.provider}>
                  <input type="hidden" name="targetType" value={target.targetType} />
                  <input type="hidden" name="targetId" value={target.targetId} />
                  <input type="hidden" name="provider" value={provider.provider} />
                  <button className="button button-primary" type="submit">
                    {t("Pay", "Pagar")} {money(schedule.nextPaymentAmount || summary.outstandingAmount, summary.currency, locale)} {t("with", "con")} {provider.label}
                    {provider.activeEnvironment === "test" ? ` · ${t("TEST", "PRUEBAS")}` : ""}
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <div className={styles.notice}>
              {t("No online payment provider is enabled at the moment.", "No hay ninguna pasarela de pago online activa en este momento.")}
            </div>
          )}

          <p><Link className="text-link" href={target.detailUrl}>{t("← Back to reservation", "← Volver a la reserva")}</Link></p>
        </section>
      </div>
    </main>
  );
}
