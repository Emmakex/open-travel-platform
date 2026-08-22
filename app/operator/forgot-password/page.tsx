import Link from "next/link";
import { requestStaffPasswordResetAction } from "@/app/operator/password-recovery-actions";
import styles from "@/app/operator/operator.module.css";
import { isEmailDeliveryConfigured } from "@/lib/email";
import { getLocale } from "@/lib/get-locale";
import { tr } from "@/lib/operator-i18n";

export const metadata = { title: "Password recovery | Kairoseth Travel", description: "Secure Kairoseth Travel staff password recovery." };

export default async function StaffForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const locale = await getLocale();
  const { sent, error } = await searchParams;
  const configured = isEmailDeliveryConfigured();

  return (
    <main className="section"><div className={`container ${styles.shell}`}><section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Staff security", "Seguridad del personal")}</div>
      <h1>{tr(locale, "Recover staff access.", "Recuperar acceso del personal.")}</h1>
      <p className={styles.lead}>{tr(locale, "Enter your staff email. If an active account exists, a single-use password reset link valid for 30 minutes will be sent.", "Introduce tu email de personal. Si existe una cuenta activa, se enviará un enlace de un solo uso válido durante 30 minutos.")}</p>
      {sent === "1" ? <div className={styles.notice}>{tr(locale, "If an active staff account exists for that email, a recovery link will arrive shortly.", "Si existe una cuenta activa para ese email, recibirás un enlace de recuperación en breve.")}</div> : null}
      {error === "delivery-unavailable" || !configured ? <div className={styles.notice}>{tr(locale, "Email password recovery is temporarily unavailable.", "La recuperación de contraseña por email no está disponible temporalmente.")}</div> : null}
      {error === "delivery-failed" ? <div className={styles.notice}>{tr(locale, "The recovery email could not be sent. Please try again in a few minutes.", "No se pudo enviar el correo de recuperación. Inténtalo de nuevo en unos minutos.")}</div> : null}
      {configured ? (
        <form action={requestStaffPasswordResetAction} className={styles.editorForm}>
          <label className={styles.field}><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
          <button className="button button-primary" type="submit">{tr(locale, "Send recovery link", "Enviar enlace de recuperación")}</button>
        </form>
      ) : null}
      <Link className="text-link" href="/operator/sign-in">{tr(locale, "← Back to staff sign in", "← Volver al acceso del personal")}</Link>
    </section></div></main>
  );
}
