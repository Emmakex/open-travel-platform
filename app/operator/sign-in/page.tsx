import Link from "next/link";
import { redirect } from "next/navigation";
import { signInStaffAction, startDemoAdminSession, startDemoOperatorSession } from "@/app/operator/actions";
import styles from "@/app/operator/operator.module.css";
import { hasOperationsAccess } from "@/lib/access-control";
import { isEmailDeliveryConfigured } from "@/lib/email";
import { getLocale } from "@/lib/get-locale";
import { identityConfig } from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";
import { tr } from "@/lib/operator-i18n";
import { ensureBootstrapAdmin } from "@/lib/staff-auth";

export const metadata = { title: "Operator sign in | Kairoseth Travel", description: "Secure staff access for Kairoseth Travel operations." };

export default async function OperatorSignInPage({ searchParams }: { searchParams: Promise<{ error?: string; demo?: string; reset?: string }> }) {
  const locale = await getLocale();
  const identity = await getIdentityRepository().getCurrentIdentity();
  const { error, demo, reset } = await searchParams;
  if (hasOperationsAccess(identity)) redirect("/operator");

  const bootstrap = identityConfig.staffAuthEnabled ? await ensureBootstrapAdmin().catch(() => ({ created: false, count: 0, configured: false })) : null;
  const recoveryEnabled = identityConfig.staffAuthEnabled && isEmailDeliveryConfigured();
  const errors: Record<string, string> = {
    "invalid-credentials": tr(locale, "Sign in was not successful. Check your credentials. After repeated failures, staff access is temporarily locked for 15 minutes.", "No se ha podido iniciar sesión. Comprueba tus credenciales. Tras varios intentos fallidos, el acceso del personal se bloquea temporalmente durante 15 minutos."),
    "rate-limited": tr(locale, "Too many staff sign-in attempts were made in a short period. Wait a few minutes before trying again.", "Se han realizado demasiados intentos de acceso del personal en poco tiempo. Espera unos minutos antes de volver a intentarlo."),
    "auth-disabled": tr(locale, "Persistent staff authentication is disabled in this deployment.", "La autenticación persistente del personal está desactivada en este despliegue."),
    forbidden: tr(locale, "The current account does not have operator access.", "La cuenta actual no tiene acceso de operador.")
  };

  return (
    <main className="section"><div className={`container ${styles.shell}`}><section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Staff access", "Acceso del personal")}</div>
      <h1>{tr(locale, "Operations sign in.", "Acceso a operaciones.")}</h1>
      <p className={styles.lead}>{tr(locale, "Staff accounts use a separate protected identity boundary from customer accounts.", "Las cuentas del personal usan un ámbito de identidad protegido y separado de las cuentas de clientes.")}</p>

      {reset === "success" ? <div className={styles.notice}>{tr(locale, "Your password has been reset. Sign in with the new password.", "Tu contraseña se ha restablecido. Inicia sesión con la nueva contraseña.")}</div> : null}
      {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}
      {demo === "disabled" ? <div className={styles.notice}>{tr(locale, "Temporary staff access is disabled in this deployment.", "El acceso temporal del personal está desactivado en este despliegue.")}</div> : null}
      {identity?.role === "customer" ? <div className={styles.notice}>{tr(locale, "A customer session is active. Signing in as staff will close the customer session first.", "Hay una sesión de cliente activa. Al iniciar sesión como personal se cerrará primero la sesión de cliente.")}</div> : null}

      {identityConfig.staffAuthEnabled ? (
        <>
          {bootstrap?.count === 0 && !bootstrap.configured ? <div className={styles.notice}>{tr(locale, "No staff administrator exists yet. Configure the one-time bootstrap administrator variables and redeploy before signing in.", "Todavía no existe un administrador de personal. Configura las variables de creación inicial del administrador y vuelve a desplegar antes de iniciar sesión.")}</div> : null}
          <form action={signInStaffAction} className={styles.editorForm}>
            <label className={styles.field}><span>Email</span><input name="email" type="email" autoComplete="username" required /></label>
            <label className={styles.field}><span>{tr(locale, "Password", "Contraseña")}</span><input name="password" type="password" autoComplete="current-password" required /></label>
            <button className="button button-primary" type="submit">{tr(locale, "Sign in to operations", "Entrar en operaciones")}</button>
          </form>
          {recoveryEnabled ? <p><Link className="text-link" href="/operator/forgot-password">{tr(locale, "Forgot your password? →", "¿Has olvidado tu contraseña? →")}</Link></p> : null}
          <div className={styles.notice}>{tr(locale, "Staff sessions expire after 8 hours. Customer and staff sessions cannot be active at the same time. Authentication activity is audited securely.", "Las sesiones del personal caducan tras 8 horas. Las sesiones de cliente y personal no pueden estar activas al mismo tiempo. La actividad de autenticación se audita de forma segura.")}</div>
        </>
      ) : identityConfig.demoStaffEnabled ? (
        <>
          <div className={styles.actions}>
            <form action={startDemoOperatorSession}><button className="button button-primary" type="submit">{tr(locale, "Start temporary operator access", "Iniciar acceso temporal de operador")}</button></form>
            <form action={startDemoAdminSession}><button className="button button-secondary" type="submit">{tr(locale, "Start temporary admin access", "Iniciar acceso temporal de administrador")}</button></form>
          </div>
          <div className={styles.notice}><strong>{tr(locale, "Temporary bridge.", "Puente temporal.")}</strong> {tr(locale, "Set STAFF_AUTH_MODE=mongodb to use persistent staff accounts.", "Configura STAFF_AUTH_MODE=mongodb para utilizar cuentas de personal persistentes.")}</div>
        </>
      ) : <div className={styles.notice}>{tr(locale, "Staff access is disabled in this deployment.", "El acceso del personal está desactivado en este despliegue.")}</div>}

      <Link className="text-link" href="/">{tr(locale, "← Back to public catalogue", "← Volver al catálogo público")}</Link>
    </section></div></main>
  );
}