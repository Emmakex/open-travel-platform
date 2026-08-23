import Link from "next/link";
import { resetCustomerPasswordAction } from "@/app/account/password-recovery-actions";
import styles from "@/app/account/account.module.css";
import { getLocale } from "@/lib/get-locale";

export const metadata = {
  title: "Reset password",
  description: "Set a new password for your Kairoseth Travel customer account."
};

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const locale = await getLocale();
  const { token = "", error } = await searchParams;
  const isEs = locale === "es";

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{isEs ? "Seguridad de cuenta" : "Account security"}</div>
          <h1>{isEs ? "Elige una nueva contraseña." : "Choose a new password."}</h1>
          <p className={styles.lead}>
            {isEs
              ? "El enlace solo puede utilizarse una vez y caduca 30 minutos después de ser emitido."
              : "The link can only be used once and expires 30 minutes after it is issued."}
          </p>

          {error === "validation" ? (
            <div className={styles.notice}>
              {isEs
                ? "Las contraseñas deben coincidir y tener al menos 10 caracteres."
                : "Passwords must match and contain at least 10 characters."}
            </div>
          ) : null}
          {error === "invalid-token" || !token ? (
            <div className={styles.notice}>
              {isEs
                ? "Este enlace no es válido, ya se utilizó o ha caducado. Solicita uno nuevo."
                : "This link is invalid, already used, or expired. Request a new one."}
            </div>
          ) : null}

          {token ? (
            <form action={resetCustomerPasswordAction} className={styles.authForm}>
              <input type="hidden" name="token" value={token} />
              <label className={styles.field}>
                <span>{isEs ? "Nueva contraseña" : "New password"}</span>
                <input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required />
              </label>
              <label className={styles.field}>
                <span>{isEs ? "Repite la nueva contraseña" : "Confirm new password"}</span>
                <input name="passwordConfirmation" type="password" autoComplete="new-password" minLength={10} maxLength={128} required />
              </label>
              <button className="button button-primary" type="submit">
                {isEs ? "Guardar nueva contraseña" : "Save new password"}
              </button>
            </form>
          ) : null}

          <Link className="text-link" href="/account/forgot-password">
            {isEs ? "Solicitar un nuevo enlace →" : "Request a new link →"}
          </Link>
        </section>
      </div>
    </main>
  );
}
