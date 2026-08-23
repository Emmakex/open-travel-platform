import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import {
  saveRedsysProviderAction,
  saveStripeProviderAction
} from "@/app/operator/payments/providers/actions";
import { getLocale } from "@/lib/get-locale";
import { tr } from "@/lib/operator-i18n";
import {
  listPaymentProviderSummaries,
  type PaymentEnvironment,
  type PaymentProviderEnvironmentSummary
} from "@/lib/payment-provider-config";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

export const metadata = {
  title: "Payment providers | Kairoseth Travel",
  description: "Admin-only payment gateway configuration."
};

type PageProps = {
  searchParams: Promise<{
    saved?: string;
    environment?: string;
    error?: string;
  }>;
};

function environmentLabel(environment: PaymentEnvironment, locale: "en" | "es") {
  return environment === "test"
    ? tr(locale, "Test / Sandbox", "Pruebas / Sandbox")
    : tr(locale, "Live / Production", "Real / Producción");
}

function configuredLabel(config: PaymentProviderEnvironmentSummary, locale: "en" | "es") {
  return config.configured
    ? tr(locale, "Configured", "Configurado")
    : tr(locale, "Not configured", "Sin configurar");
}

function secretPlaceholder(configured: boolean, locale: "en" | "es") {
  if (configured) {
    return tr(locale, "Configured — leave blank to keep", "Configurado — deja vacío para conservar");
  }
  return tr(locale, "Enter secret", "Introduce el secreto");
}

export default async function PaymentProvidersPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  await requireAdminIdentity();
  const params = await searchParams;
  const providers = await listPaymentProviderSummaries();
  const stripe = providers.find((item) => item.provider === "stripe")!;
  const redsys = providers.find((item) => item.provider === "redsys")!;

  const renderProviderState = (enabled: boolean, activeEnvironment: PaymentEnvironment) => (
    <div className={styles.metrics}>
      <div className={styles.metric}>
        <strong>{enabled ? tr(locale, "ON", "ACTIVO") : tr(locale, "OFF", "INACTIVO")}</strong>
        <span>{tr(locale, "Checkout availability", "Disponibilidad en checkout")}</span>
      </div>
      <div className={styles.metric}>
        <strong>{environmentLabel(activeEnvironment, locale)}</strong>
        <span>{tr(locale, "Active environment", "Entorno activo")}</span>
      </div>
    </div>
  );

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Admin · Payments", "Admin · Pagos")}</div>
          <h1>{tr(locale, "Payment providers", "Pasarelas de pago")}</h1>
          <p className={styles.lead}>
            {tr(
              locale,
              "Configure test and live credentials here. Sensitive values are encrypted before storage and are never shown again after saving.",
              "Configura aquí las credenciales de pruebas y producción. Los valores sensibles se cifran antes de guardarse y nunca vuelven a mostrarse después de guardar."
            )}
          </p>

          {!stripe.encryptionReady ? (
            <div className={styles.notice}>
              <strong>{tr(locale, "Server encryption key required.", "Falta la clave de cifrado del servidor.")}</strong><br />
              {tr(
                locale,
                "Set PAYMENT_SECRETS_KEY once in the deployment environment before storing gateway credentials. Provider credentials themselves will then be managed only from this admin page.",
                "Configura PAYMENT_SECRETS_KEY una sola vez en el entorno del despliegue antes de guardar credenciales. Después, las credenciales de las pasarelas se gestionarán únicamente desde esta pantalla de administración."
              )}
            </div>
          ) : null}

          {params.saved ? (
            <div className={styles.notice}>
              {tr(locale, "Payment provider settings saved.", "Configuración de la pasarela guardada.")}
            </div>
          ) : null}
          {params.error ? <div className={styles.notice}>{decodeURIComponent(params.error)}</div> : null}

          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator/payments">
              {tr(locale, "← Payment operations", "← Operativa de pagos")}
            </Link>
            <Link className="button button-secondary" href="/operator">
              {tr(locale, "Operator dashboard", "Panel de operador")}
            </Link>
          </div>
        </section>

        <section className={styles.panel} id="stripe" style={{ marginTop: "1rem" }}>
          <div className="eyebrow">Stripe</div>
          <h2>{tr(locale, "Stripe configuration", "Configuración de Stripe")}</h2>
          <p className={styles.muted}>
            {tr(
              locale,
              "Keep separate sandbox and live credentials. A restricted server key is preferred when its permissions cover the required payment operations.",
              "Mantén credenciales separadas para sandbox y producción. Se recomienda una clave restringida de servidor cuando sus permisos cubran las operaciones de pago necesarias."
            )}
          </p>
          {renderProviderState(stripe.enabled, stripe.activeEnvironment)}

          {(["test", "live"] as const).map((environment) => {
            const config = environment === "test" ? stripe.test : stripe.live;
            return (
              <form className={styles.editorForm} action={saveStripeProviderAction} key={environment}>
                <input type="hidden" name="environment" value={environment} />
                <div className={styles.editorSection}>
                  <div className={styles.sectionHeaderCompact}>
                    <div>
                      <strong>{environmentLabel(environment, locale)}</strong>
                      <p className={styles.muted}>{configuredLabel(config, locale)}</p>
                    </div>
                    <span className={styles.badge}>{configuredLabel(config, locale)}</span>
                  </div>

                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>{tr(locale, "Publishable key", "Clave publicable")}</span>
                      <input
                        name="publishableKey"
                        defaultValue={config.publicFields.publishableKey}
                        placeholder={environment === "test" ? "pk_test_…" : "pk_live_…"}
                        autoComplete="off"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Server API key", "Clave API de servidor")}</span>
                      <input
                        type="password"
                        name="apiKey"
                        placeholder={secretPlaceholder(config.secretFields.apiKey, locale)}
                        autoComplete="new-password"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Webhook signing secret", "Secreto de firma del webhook")}</span>
                      <input
                        type="password"
                        name="webhookSecret"
                        placeholder={secretPlaceholder(config.secretFields.webhookSecret, locale)}
                        autoComplete="new-password"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Active environment", "Entorno activo")}</span>
                      <select name="activeEnvironment" defaultValue={stripe.activeEnvironment}>
                        <option value="test">{environmentLabel("test", locale)}</option>
                        <option value="live">{environmentLabel("live", locale)}</option>
                      </select>
                    </label>
                  </div>

                  <label className={styles.checkboxField}>
                    <input type="checkbox" name="enabled" defaultChecked={stripe.enabled} />
                    <span>{tr(locale, "Enable Stripe for checkout", "Activar Stripe en el checkout")}</span>
                  </label>
                  <label className={styles.checkboxField}>
                    <input type="checkbox" name="clearApiKey" />
                    <span>{tr(locale, "Remove the stored server API key", "Eliminar la clave API de servidor guardada")}</span>
                  </label>
                  <label className={styles.checkboxField}>
                    <input type="checkbox" name="clearWebhookSecret" />
                    <span>{tr(locale, "Remove the stored webhook secret", "Eliminar el secreto de webhook guardado")}</span>
                  </label>

                  <div className={styles.actionsCompact}>
                    <button className="button button-primary" type="submit" disabled={!stripe.encryptionReady}>
                      {tr(locale, `Save Stripe ${environment}`, `Guardar Stripe ${environment === "test" ? "pruebas" : "producción"}`)}
                    </button>
                  </div>
                </div>
              </form>
            );
          })}
        </section>

        <section className={styles.panel} id="redsys" style={{ marginTop: "1rem" }}>
          <div className="eyebrow">Redsys</div>
          <h2>{tr(locale, "Redsys configuration", "Configuración de Redsys")}</h2>
          <p className={styles.muted}>
            {tr(
              locale,
              "The payment endpoint is selected automatically from the active environment. The signing key is encrypted and never displayed after saving.",
              "El endpoint de pago se selecciona automáticamente según el entorno activo. La clave de firma se cifra y nunca se muestra después de guardar."
            )}
          </p>
          {renderProviderState(redsys.enabled, redsys.activeEnvironment)}

          {(["test", "live"] as const).map((environment) => {
            const config = environment === "test" ? redsys.test : redsys.live;
            return (
              <form className={styles.editorForm} action={saveRedsysProviderAction} key={environment}>
                <input type="hidden" name="environment" value={environment} />
                <div className={styles.editorSection}>
                  <div className={styles.sectionHeaderCompact}>
                    <div>
                      <strong>{environmentLabel(environment, locale)}</strong>
                      <p className={styles.muted}>{configuredLabel(config, locale)}</p>
                    </div>
                    <span className={styles.badge}>{configuredLabel(config, locale)}</span>
                  </div>

                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>{tr(locale, "Merchant code (FUC)", "Código de comercio (FUC)")}</span>
                      <input name="merchantCode" inputMode="numeric" defaultValue={config.publicFields.merchantCode} autoComplete="off" />
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Terminal", "Terminal")}</span>
                      <input name="terminal" inputMode="numeric" defaultValue={config.publicFields.terminal} autoComplete="off" />
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Signing key", "Clave de firma")}</span>
                      <input
                        type="password"
                        name="signingKey"
                        placeholder={secretPlaceholder(config.secretFields.signingKey, locale)}
                        autoComplete="new-password"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Active environment", "Entorno activo")}</span>
                      <select name="activeEnvironment" defaultValue={redsys.activeEnvironment}>
                        <option value="test">{environmentLabel("test", locale)}</option>
                        <option value="live">{environmentLabel("live", locale)}</option>
                      </select>
                    </label>
                  </div>

                  <div className={styles.notice}>
                    <strong>{tr(locale, "Gateway endpoint", "Endpoint de la pasarela")}</strong><br />
                    {config.publicFields.paymentUrl}
                  </div>

                  <label className={styles.checkboxField}>
                    <input type="checkbox" name="enabled" defaultChecked={redsys.enabled} />
                    <span>{tr(locale, "Enable Redsys for checkout", "Activar Redsys en el checkout")}</span>
                  </label>
                  <label className={styles.checkboxField}>
                    <input type="checkbox" name="clearSigningKey" />
                    <span>{tr(locale, "Remove the stored signing key", "Eliminar la clave de firma guardada")}</span>
                  </label>

                  <div className={styles.actionsCompact}>
                    <button className="button button-primary" type="submit" disabled={!redsys.encryptionReady}>
                      {tr(locale, `Save Redsys ${environment}`, `Guardar Redsys ${environment === "test" ? "pruebas" : "producción"}`)}
                    </button>
                  </div>
                </div>
              </form>
            );
          })}
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Extensible core", "Core extensible")}</div>
          <h2>{tr(locale, "Ready for more payment providers", "Preparado para más pasarelas")}</h2>
          <p className={styles.lead}>
            {tr(
              locale,
              "Checkout will consume a provider-neutral runtime contract. Adding another PSP will require a new provider adapter, not changes to trip or service reservations.",
              "El checkout consumirá un contrato neutral de proveedor. Añadir otro PSP requerirá un nuevo adaptador de pasarela, no cambios en las reservas de viajes o servicios."
            )}
          </p>
        </section>
      </div>
    </main>
  );
}
