import Link from "next/link";
import { changeStaffPasswordAction } from "@/app/operator/actions";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = { title: "Security | Kairoseth Travel", description: "Manage Kairoseth Travel staff account security." };

export default async function StaffSecurityPage({ searchParams }: { searchParams: Promise<{ error?: string; changed?: string }> }) {
  const locale = await getLocale();
  const identity = await requireOperationsIdentity();
  const { error, changed } = await searchParams;
  const errors: Record<string, string> = {
    validation: tr(locale, "Check the fields. The new password must contain at least 12 characters, match the confirmation and differ from the current password.", "Revisa los campos. La nueva contraseña debe tener al menos 12 caracteres, coincidir con la confirmación y ser distinta de la actual."),
    "current-password": tr(locale, "The current password is incorrect.", "La contraseña actual es incorrecta."),
    forbidden: tr(locale, "Your account cannot manage this staff security page.", "Tu cuenta no puede gestionar esta página de seguridad del personal.")
  };

  return (
    <main className="section"><div className={`container ${styles.shell}`}><section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Staff security", "Seguridad del personal")}</div>
      <h1>{tr(locale, "Protect your operations account.", "Protege tu cuenta de operaciones.")}</h1>
      <p className={styles.lead}>{tr(locale, "Signed in as", "Sesión iniciada como")} <strong>{identity.displayName}</strong>. {tr(locale, "Changing your password revokes every other staff session and renews this session securely.", "Cambiar la contraseña revoca el resto de sesiones del personal y renueva esta sesión de forma segura.")}</p>
      {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}
      {changed === "1" ? <div className={styles.notice}>{tr(locale, "Password updated successfully.", "Contraseña actualizada correctamente.")}</div> : null}
      <form action={changeStaffPasswordAction} className={styles.editorForm}>
        <label className={styles.field}><span>{tr(locale, "Current password", "Contraseña actual")}</span><input name="currentPassword" type="password" autoComplete="current-password" required /></label>
        <label className={styles.field}><span>{tr(locale, "New password", "Nueva contraseña")}</span><input name="newPassword" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /><small>{tr(locale, "At least 12 characters.", "Al menos 12 caracteres.")}</small></label>
        <label className={styles.field}><span>{tr(locale, "Confirm new password", "Confirmar nueva contraseña")}</span><input name="confirmPassword" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label>
        <button className="button button-primary" type="submit">{tr(locale, "Update staff password", "Actualizar contraseña")}</button>
      </form>
      <div className={styles.notice}>{tr(locale, "Staff sign-in is temporarily locked for 15 minutes after 5 failed attempts. Authentication events are audited without storing raw passwords or session tokens.", "El acceso del personal se bloquea temporalmente durante 15 minutos tras 5 intentos fallidos. Los eventos de autenticación se auditan sin guardar contraseñas ni tokens de sesión en bruto.")}</div>
      <Link className="text-link" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link>
    </section></div></main>
  );
}
