import Link from "next/link";
import { changeCustomerPasswordAction } from "@/app/account/actions";
import styles from "@/app/account/account.module.css";
import { getLocale } from "@/lib/get-locale";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";

export const metadata = {
  title: "Account security | Kairoseth Travel",
  description: "Manage your Kairoseth Travel account password."
};

export default async function CustomerSecurityPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; changed?: string }>;
}) {
  await requireCustomerIdentity();
  const locale = await getLocale();
  const { error, changed } = await searchParams;
  const isEs = locale === "es";

  const errors: Record<string, string> = {
    validation: isEs
      ? "Comprueba los campos. La nueva contraseña debe tener al menos 10 caracteres, coincidir y ser distinta de la actual."
      : "Check the fields. The new password must contain at least 10 characters, match the confirmation and differ from the current password.",
    "current-password": isEs
      ? "La contraseña actual no es correcta."
      : "The current password is incorrect.",
    "auth-disabled": isEs
      ? "La seguridad de cuenta no está disponible temporalmente."
      : "Account security is temporarily unavailable."
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{isEs ? "Seguridad de la cuenta" : "Account security"}</div>
          <h1>{isEs ? "Cambia tu contraseña." : "Change your password."}</h1>
          <p className={styles.lead}>
            {isEs
              ? "Al cambiarla se cierran todas las demás sesiones abiertas y esta sesión se renueva de forma segura."
              : "Changing it closes every other active session and securely renews this session."}
          </p>

          {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}
          {changed === "1" ? (
            <div className={styles.notice}>
              {isEs ? "Contraseña actualizada correctamente." : "Password updated successfully."}
            </div>
          ) : null}

          <form action={changeCustomerPasswordAction} className={styles.authForm}>
            <label className={styles.field}>
              <span>{isEs ? "Contraseña actual" : "Current password"}</span>
              <input name="currentPassword" type="password" autoComplete="current-password" required />
            </label>
            <label className={styles.field}>
              <span>{isEs ? "Nueva contraseña" : "New password"}</span>
              <input name="newPassword" type="password" minLength={10} maxLength={128} autoComplete="new-password" required />
              <small>{isEs ? "Mínimo 10 caracteres." : "At least 10 characters."}</small>
            </label>
            <label className={styles.field}>
              <span>{isEs ? "Repetir nueva contraseña" : "Confirm new password"}</span>
              <input name="confirmPassword" type="password" minLength={10} maxLength={128} autoComplete="new-password" required />
            </label>
            <button className="button button-primary" type="submit">
              {isEs ? "Actualizar contraseña" : "Update password"}
            </button>
          </form>

          <div className={styles.notice}>
            {isEs
              ? "Protección adicional: después de 5 intentos fallidos de inicio de sesión, la cuenta se bloquea temporalmente durante 15 minutos."
              : "Additional protection: after 5 failed sign-in attempts, the account is temporarily locked for 15 minutes."}
          </div>

          <Link className="text-link" href="/account">{isEs ? "← Volver a mi cuenta" : "← Back to my account"}</Link>
        </section>
      </div>
    </main>
  );
}
