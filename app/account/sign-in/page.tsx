import Link from "next/link";
import { redirect } from "next/navigation";
import { signInCustomerAction, startDemoSession } from "@/app/account/actions";
import styles from "@/app/account/account.module.css";
import { hasCustomerAccess, hasOperationsAccess } from "@/lib/access-control";
import { getLocale } from "@/lib/get-locale";
import { identityConfig } from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";
import { isEmailDeliveryConfigured } from "@/lib/email";

export const metadata = { title: "Sign in", description: "Sign in to your Kairoseth Travel customer account." };

function safeNext(value?: string) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && value.length <= 1000 ? value : "";
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; demo?: string; reset?: string; next?: string }> }) {
  const locale = await getLocale();
  const identity = await getIdentityRepository().getCurrentIdentity();
  const { error, demo, reset, next: rawNext } = await searchParams;
  const next = safeNext(rawNext);
  if (hasCustomerAccess(identity)) redirect(next || "/account");
  if (hasOperationsAccess(identity)) redirect("/operator");

  const isEs = locale === "es";
  const recoveryEnabled = identityConfig.customerAuthEnabled && isEmailDeliveryConfigured();
  const errors: Record<string, string> = {
    "invalid-credentials": isEs ? "No se ha podido iniciar sesión. Comprueba tus credenciales. Tras varios intentos fallidos, el acceso se bloquea temporalmente durante 15 minutos." : "Sign in was not successful. Check your credentials. After repeated failures, access is temporarily locked for 15 minutes.",
    "rate-limited": isEs ? "Se han realizado demasiados intentos en poco tiempo. Espera unos minutos antes de volver a intentarlo." : "Too many attempts were made in a short period. Wait a few minutes before trying again.",
    "auth-disabled": isEs ? "El acceso de clientes está desactivado temporalmente." : "Customer sign in is temporarily disabled.",
    "registration-disabled": isEs ? "El registro de clientes está desactivado temporalmente." : "Customer registration is temporarily disabled."
  };
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
  const errorMessage = error ? errors[error] : undefined;
  const invalidCredentials = error === "invalid-credentials";

  return (
    <main className="section"><div className={`container ${styles.shell}`}><section className={styles.panel}>
      <div className="eyebrow">{isEs ? "Cuenta de cliente" : "Customer account"}</div>
      <h1>{isEs ? "Accede a tus viajes." : "Welcome back."}</h1>
      <p className={styles.lead}>{next ? (isEs ? "Inicia sesión para continuar con tu reserva del servicio." : "Sign in to continue your service booking.") : (isEs ? "Consulta tus reservas, fechas y detalles de viaje desde tu cuenta." : "Review your reservations, departure dates and travel details from your account.")}</p>
      {reset === "success" ? <div id="sign-in-status" className={styles.notice} role="status" aria-live="polite">{isEs ? "Tu contraseña se ha restablecido. Ya puedes iniciar sesión con la nueva contraseña." : "Your password has been reset. You can now sign in with the new password."}</div> : null}
      {errorMessage ? <div id="sign-in-error" className={styles.notice} role="alert" aria-live="assertive">{errorMessage}</div> : null}
      {demo === "disabled" ? <div id="demo-status" className={styles.notice} role="status" aria-live="polite">{isEs ? "El acceso temporal está desactivado." : "Temporary customer access is disabled."}</div> : null}

      {identityConfig.customerAuthEnabled ? (
        <form action={signInCustomerAction} className={styles.authForm} aria-describedby={errorMessage ? "sign-in-error" : undefined}>
          <input type="hidden" name="next" value={next} />
          <label className={styles.field} htmlFor="customer-sign-in-email"><span>Email</span><input id="customer-sign-in-email" name="email" type="email" autoComplete="email" required aria-invalid={invalidCredentials || undefined} aria-describedby={invalidCredentials ? "sign-in-error" : undefined} autoFocus={invalidCredentials} /></label>
          <label className={styles.field} htmlFor="customer-sign-in-password"><span>{isEs ? "Contraseña" : "Password"}</span><input id="customer-sign-in-password" name="password" type="password" autoComplete="current-password" required aria-invalid={invalidCredentials || undefined} aria-describedby={invalidCredentials ? "sign-in-error" : undefined} /></label>
          <button className="button button-primary" type="submit">{isEs ? "Iniciar sesión" : "Sign in"}</button>
        </form>
      ) : identityConfig.demoSessionEnabled ? (
        <form action={startDemoSession}><button className="button button-primary" type="submit">{isEs ? "Iniciar acceso temporal" : "Start temporary customer access"}</button></form>
      ) : <div className={styles.notice} role="status">{isEs ? "El acceso de clientes no está disponible." : "Customer access is unavailable."}</div>}

      {recoveryEnabled ? <p><Link className="text-link" href="/account/forgot-password">{isEs ? "¿Has olvidado tu contraseña? →" : "Forgot your password? →"}</Link></p> : null}
      {identityConfig.customerAuthEnabled ? <div className={styles.authFooter}><span>{isEs ? "¿Aún no tienes cuenta?" : "New to Kairoseth Travel?"}</span>{" "}<Link className="text-link" href={`/account/register${nextQuery}`}>{isEs ? "Crear cuenta →" : "Create account →"}</Link></div> : null}
      <p><Link className="text-link" href="/operator/sign-in">{isEs ? "Acceso de operador →" : "Operator sign in →"}</Link></p>
      <Link className="text-link" href={next || "/"}>{next ? (isEs ? "← Volver al servicio" : "← Back to service") : (isEs ? "← Volver al catálogo" : "← Back to catalogue")}</Link>
    </section></div></main>
  );
}