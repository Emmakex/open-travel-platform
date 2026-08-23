import Link from "next/link";
import { redirect } from "next/navigation";
import { registerCustomerAction } from "@/app/account/actions";
import styles from "@/app/account/account.module.css";
import { hasCustomerAccess, hasOperationsAccess } from "@/lib/access-control";
import { getLocale } from "@/lib/get-locale";
import { identityConfig } from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";

export const metadata = {
  title: "Create account | Kairoseth Travel",
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
      : "An account already exists for this email. You can sign in instead."
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{isEs ? "Nueva cuenta" : "New customer account"}</div>
          <h1>{isEs ? "Empieza tu próxima aventura." : "Start your next journey."}</h1>
          <p className={styles.lead}>
            {next
              ? isEs ? "Crea tu cuenta y volverás directamente a la reserva del servicio." : "Create your account and return directly to the service booking."
              : isEs ? "Crea una cuenta para guardar reservas y consultar tus viajes desde cualquier sesión." : "Create an account to keep reservations and access your trips across sessions."}
          </p>

          {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}

          <form action={registerCustomerAction} className={styles.authForm}>
            <input type="hidden" name="next" value={next} />
            <div className={styles.authGrid}>
              <label className={styles.field}><span>{isEs ? "Nombre" : "First name"}</span><input name="firstName" autoComplete="given-name" maxLength={80} required /></label>
              <label className={styles.field}><span>{isEs ? "Apellidos" : "Last name"}</span><input name="lastName" autoComplete="family-name" maxLength={80} required /></label>
            </div>
            <label className={styles.field}><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
            <label className={styles.field}><span>{isEs ? "País" : "Country"}</span><input name="country" autoComplete="country-name" maxLength={80} /></label>
            <label className={styles.field}><span>{isEs ? "Contraseña" : "Password"}</span><input name="password" type="password" minLength={10} maxLength={128} autoComplete="new-password" required /><small>{isEs ? "Mínimo 10 caracteres." : "At least 10 characters."}</small></label>
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
