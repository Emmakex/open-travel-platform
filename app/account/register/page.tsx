import Link from "next/link";
import { redirect } from "next/navigation";
import { registerCustomerAction } from "@/app/account/actions";
import styles from "@/app/account/account.module.css";
import { hasCustomerAccess, hasOperationsAccess } from "@/lib/access-control";
import { getLocale } from "@/lib/get-locale";
import { identityConfig } from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";

export const metadata = {
  title: "Create account",
  description: "Create a Kairoseth Travel customer account."
};

function safeNext(value?: string) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && value.length <= 1000 ? value : "";
}

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const locale = await getLocale();
  const identity = await getIdentityRepository().getCurrentIdentity();
  const { error, next: rawNext } = await searchParams;
  const next = safeNext(rawNext);

  if (hasCustomerAccess(identity)) redirect(next || "/account");
  if (hasOperationsAccess(identity)) redirect("/operator");
  if (!identityConfig.customerAuthEnabled) redirect(`/account/sign-in?error=registration-disabled${next ? `&next=${encodeURIComponent(next)}` : ""}`);

  const isEs = locale === "es";
  const errors: Record<string, string> = {
    validation: isEs
      ? "Revisa los campos. La contraseña debe tener al menos 10 caracteres."
      : "Check the form fields. Passwords must contain at least 10 characters.",
    "email-exists": isEs
      ? "Ya existe una cuenta con este correo. Puedes iniciar sesión."
      : "An account already exists for this email. You can sign in instead.",
    "rate-limited": isEs
      ? "Se han realizado demasiados intentos de registro en poco tiempo. Espera antes de volver a intentarlo."
      : "Too many registration attempts were made in a short period. Wait before trying again."
  };
  const errorMessage = error ? errors[error] : undefined;
  const validationError = error === "validation";
  const emailExists = error === "email-exists";

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{isEs ? "Nueva cuenta" : "New customer account"}</div>
          <h1>{isEs ? "Empieza tu próxima aventura." : "Start your next journey."}</h1>
          <p className={styles.lead}>
            {next
              ? isEs ? "Crea tu cuenta y volverás directamente a la reserva del servicio." : "Create your account and return directly to the service booking."
              : isEs ? "Crea una cuenta para guardar reservas y consultar tus viajes desde cualquier sesión." : "Create an account to keep reservations and access your trips whenever you need them."}
          </p>

          {errorMessage ? <div id="registration-error" className={styles.notice} role="alert" aria-live="assertive">{errorMessage}</div> : null}

          <form action={registerCustomerAction} className={styles.authForm} aria-describedby={errorMessage ? "registration-error" : undefined}>
            <input type="hidden" name="next" value={next} />
            <div className={styles.authGrid}>
              <label className={styles.field} htmlFor="register-first-name"><span>{isEs ? "Nombre" : "First name"}</span><input id="register-first-name" name="firstName" autoComplete="given-name" maxLength={80} required aria-invalid={validationError || undefined} autoFocus={validationError && !emailExists} /></label>
              <label className={styles.field} htmlFor="register-last-name"><span>{isEs ? "Apellidos" : "Last name"}</span><input id="register-last-name" name="lastName" autoComplete="family-name" maxLength={80} required aria-invalid={validationError || undefined} /></label>
            </div>
            <label className={styles.field} htmlFor="register-email"><span>Email</span><input id="register-email" name="email" type="email" autoComplete="email" required aria-invalid={emailExists || validationError || undefined} aria-describedby={emailExists ? "registration-error" : undefined} autoFocus={emailExists} /></label>
            <label className={styles.field} htmlFor="register-country"><span>{isEs ? "País" : "Country"}</span><input id="register-country" name="country" autoComplete="country-name" maxLength={80} /></label>
            <label className={styles.field} htmlFor="register-password"><span>{isEs ? "Contraseña" : "Password"}</span><input id="register-password" name="password" type="password" minLength={10} maxLength={128} autoComplete="new-password" required aria-invalid={validationError || undefined} aria-describedby={`register-password-help${validationError ? " registration-error" : ""}`} /><small id="register-password-help">{isEs ? "Mínimo 10 caracteres." : "At least 10 characters."}</small></label>
            <button className="button button-primary" type="submit">{isEs ? "Crear mi cuenta" : "Create my account"}</button>
          </form>

          <div className={styles.authFooter}>
            <span>{isEs ? "¿Ya tienes cuenta?" : "Already have an account?"}</span>{" "}
            <Link className="text-link" href={`/account/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`}>{isEs ? "Iniciar sesión →" : "Sign in →"}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}