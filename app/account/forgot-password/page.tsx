import Link from "next/link";
import { requestCustomerPasswordResetAction } from "@/app/account/password-recovery-actions";
import styles from "@/app/account/account.module.css";
import { getLocale } from "@/lib/get-locale";
import { isEmailDeliveryConfigured } from "@/lib/email";

export const metadata = {
  title: "Forgot password",
  description: "Request a secure Kairoseth Travel password reset link."
};

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const locale = await getLocale();
  const { sent, error } = await searchParams;
  const isEs = locale === "es";
  const configured = isEmailDeliveryConfigured();
  const deliveryUnavailable = error === "delivery-unavailable" || !configured;
  const deliveryFailed = error === "delivery-failed";

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{isEs ? "Seguridad de cuenta" : "Account security"}</div>
          <h1>{isEs ? "Restablece tu contraseña." : "Reset your password."}</h1>
          <p className={styles.lead} id="password-recovery-help">
            {isEs
              ? "Introduce tu correo. Si existe una cuenta activa, enviaremos un enlace de un solo uso válido durante 30 minutos."
              : "Enter your email. If an active account exists, we will send a single-use link valid for 30 minutes."}
          </p>

          {sent === "1" ? (
            <div id="password-recovery-status" className={styles.notice} role="status" aria-live="polite">
              {isEs
                ? "Si existe una cuenta para ese correo, recibirás un enlace de recuperación en unos minutos."
                : "If an account exists for that email, a recovery link will arrive shortly."}
            </div>
          ) : null}

          {deliveryUnavailable ? (
            <div id="password-recovery-error" className={styles.notice} role="alert" aria-live="assertive">
              {isEs
                ? "La recuperación por correo no está disponible temporalmente."
                : "Email password recovery is temporarily unavailable."}
            </div>
          ) : null}
          {deliveryFailed ? (
            <div id="password-recovery-error" className={styles.notice} role="alert" aria-live="assertive">
              {isEs
                ? "No pudimos enviar el correo. Inténtalo de nuevo en unos minutos."
                : "We could not send the email. Please try again in a few minutes."}
            </div>
          ) : null}

          {configured ? (
            <form action={requestCustomerPasswordResetAction} className={styles.authForm} aria-describedby={`password-recovery-help${deliveryFailed ? " password-recovery-error" : ""}`}>
              <label className={styles.field} htmlFor="password-recovery-email">
                <span>Email</span>
                <input id="password-recovery-email" name="email" type="email" autoComplete="email" required aria-invalid={deliveryFailed || undefined} aria-describedby={deliveryFailed ? "password-recovery-error" : "password-recovery-help"} autoFocus={deliveryFailed} />
              </label>
              <button className="button button-primary" type="submit">
                {isEs ? "Enviar enlace de recuperación" : "Send recovery link"}
              </button>
            </form>
          ) : null}

          <Link className="text-link" href="/account/sign-in">
            {isEs ? "← Volver al inicio de sesión" : "← Back to sign in"}
          </Link>
        </section>
      </div>
    </main>
  );
}
