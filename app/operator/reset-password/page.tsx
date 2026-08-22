import Link from "next/link";
import { resetStaffPasswordAction } from "@/app/operator/password-recovery-actions";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { tr } from "@/lib/operator-i18n";

export const metadata = { title: "Password reset | Kairoseth Travel", description: "Complete secure staff account recovery." };

export default async function StaffResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const locale = await getLocale();
  const { token = "", error } = await searchParams;

  return (
    <main className="section"><div className={`container ${styles.shell}`}><section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Staff security", "Seguridad del personal")}</div>
      <h1>{tr(locale, "Choose a new password.", "Elige una nueva contraseña.")}</h1>
      <p className={styles.lead}>{tr(locale, "The recovery link is single-use and expires after 30 minutes.", "El enlace de recuperación es de un solo uso y caduca después de 30 minutos.")}</p>
      {error === "validation" ? <div className={styles.notice}>{tr(locale, "The two values must match and contain at least 12 characters.", "Los dos valores deben coincidir y contener al menos 12 caracteres.")}</div> : null}
      {error === "invalid-token" || !token ? <div className={styles.notice}>{tr(locale, "This recovery link is invalid, already used, or expired.", "Este enlace de recuperación no es válido, ya se utilizó o ha caducado.")}</div> : null}
      {token ? (
        <form action={resetStaffPasswordAction} className={styles.editorForm}>
          <input type="hidden" name="token" value={token} />
          <label className={styles.field}><span>{tr(locale, "New password", "Nueva contraseña")}</span><input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
          <label className={styles.field}><span>{tr(locale, "Confirm new password", "Confirmar nueva contraseña")}</span><input name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
          <button className="button button-primary" type="submit">{tr(locale, "Save new password", "Guardar nueva contraseña")}</button>
        </form>
      ) : null}
      <Link className="text-link" href="/operator/forgot-password">{tr(locale, "Request a new recovery link →", "Solicitar un nuevo enlace de recuperación →")}</Link>
    </section></div></main>
  );
}
