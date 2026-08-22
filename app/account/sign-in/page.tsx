import Link from "next/link";
import { redirect } from "next/navigation";
import {
  signInCustomerAction,
  startDemoSession
} from "@/app/account/actions";
import styles from "@/app/account/account.module.css";
import { hasCustomerAccess, hasOperationsAccess } from "@/lib/access-control";
import { getLocale } from "@/lib/get-locale";
import { identityConfig } from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";
import { isEmailDeliveryConfigured } from "@/lib/email";

export const metadata = {
  title: "Sign in | Kairoseth Travel",
  description: "Sign in to your Kairoseth Travel customer account."
};

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; demo?: string; reset?: string }>;
}) {
  const locale = await getLocale();
  const identity = await getIdentityRepository().getCurrentIdentity();
  const { error, demo, reset } = await searchParams;

  if (hasCustomerAccess(identity)) redirect("/account");
  if (hasOperationsAccess(identity)) redirect("/operator");

  const isEs = locale === "es";
  const recoveryEnabled = identityConfig.customerAuthEnabled && isEmailDeliveryConfigured();
  const errors: Record<string, string> = {
    "invalid-credentials": isEs
      ? "No se ha podido iniciar sesión. Comprueba tus credenciales. Tras varios intentos fallidos, el acceso se bloquea temporalmente durante 15 minutos."
      : "Sign in was not successful. Check your credentials. After repeated failures, access is temporarily locked for 15 minutes.",
    "auth-disabled": isEs
      ? "El acceso de clientes está desactivado temporalmente."
      : "Customer sign in is temporarily disabled.",
    "registration-disabled": isEs
      ? "El registro de clientes está desactivado temporalmente."
      : "Customer registration is temporarily disabled."
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{isEs ? "Cuenta de cliente" : "Customer account"}</div>
          <h1>{isEs ? "Accede a tus viajes." : "Welcome back."}</h1>
          <p className={styles.lead}>
            {isEs
              ? "Consulta tus reservas, fechas y detalles de viaje desde una cuenta persistente y segura."
              : "Review your reservations, departures and travel details from your persistent customer account."}
          </p>

          {reset === "success" ? (
            <div className={styles.notice}>
              {isEs
                ? "Tu contraseña se ha restablecido. Ya puedes iniciar sesión con la nueva contraseña."
                : "Your password has been reset. You can now sign in with the new password."}
            </div>
          ) : null}
          {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}
          {demo === "disabled" ? (
            <div className={styles.notice}>{isEs ? "La sesión demo está desactivada." : "The demo session is disabled."}</div>
          ) : null}

          {identityConfig.customerAuthEnabled ? (
            <form action={signInCustomerAction} className={styles.authForm}>
              <label className={styles.field}>
                <span>Email</span>
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label className={styles.field}>
                <span>{isEs ? "Contraseña" : "Password"}</span>
                <input name="password" type="password" autoComplete="current-password" required />
              </label>
              <button className="button button-primary" type="submit">
                {isEs ? "Iniciar sesión" : "Sign in"}
              </button>
            </form>
          ) : identityConfig.demoSessionEnabled ? (
            <form action={startDemoSession}>
              <button className="button button-primary" type="submit">
                {isEs ? "Iniciar demo de cliente" : "Start customer demo"}
              </button>
            </form>
          ) : (
            <div className={styles.notice}>{isEs ? "El acceso de clientes no está disponible." : "Customer access is unavailable."}</div>
          )}

          {recoveryEnabled ? (
            <p>
              <Link className="text-link" href="/account/forgot-password">
                {isEs ? "¿Has olvidado tu contraseña? →" : "Forgot your password? →"}
              </Link>
            </p>
          ) : null}

          {identityConfig.customerAuthEnabled ? (
            <div className={styles.authFooter}>
              <span>{isEs ? "¿Aún no tienes cuenta?" : "New to Kairoseth Travel?"}</span>{" "}
              <Link className="text-link" href="/account/register">
                {isEs ? "Crear cuenta →" : "Create account →"}
              </Link>
            </div>
          ) : null}

          <p><Link className="text-link" href="/operator/sign-in">{isEs ? "Acceso de operador →" : "Operator sign in →"}</Link></p>
          <Link className="text-link" href="/">{isEs ? "← Volver al catálogo" : "← Back to catalogue"}</Link>
        </section>
      </div>
    </main>
  );
}
