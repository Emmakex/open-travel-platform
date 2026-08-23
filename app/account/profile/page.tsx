import Link from "next/link";
import { redirect } from "next/navigation";
import { updateCustomerProfileAction } from "@/app/account/actions";
import styles from "@/app/account/account.module.css";
import { getLocale } from "@/lib/get-locale";
import { identityConfig } from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";

export const metadata = {
  title: "Profile",
  description: "Update your Kairoseth Travel customer profile."
};

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const locale = await getLocale();
  const isEs = locale === "es";
  const { error } = await searchParams;
  const identity = await requireCustomerIdentity();

  if (!identityConfig.customerAuthEnabled) redirect("/account");

  const profile = await getIdentityRepository().getCustomerProfile(identity.id);
  if (!profile) redirect("/account");

  const errors: Record<string, string> = {
    validation: isEs
      ? "Revisa los datos del perfil e inténtalo de nuevo."
      : "Check the profile fields and try again.",
    "not-found": isEs
      ? "No se pudo actualizar esta cuenta."
      : "This account could not be updated."
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{isEs ? "Perfil de cliente" : "Customer profile"}</div>
          <h1>{isEs ? "Tus datos de viaje." : "Your travel details."}</h1>
          <p className={styles.lead}>
            {isEs
              ? "Mantén actualizados tus datos de contacto y tu preferencia de idioma. El correo de acceso no se modifica desde esta pantalla."
              : "Keep your contact details and language preference up to date. Your sign-in email is not changed from this screen."}
          </p>

          {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}

          <form action={updateCustomerProfileAction} className={styles.authForm}>
            <div className={styles.authGrid}>
              <label className={styles.field}>
                <span>{isEs ? "Nombre" : "First name"}</span>
                <input name="firstName" defaultValue={profile.firstName} autoComplete="given-name" maxLength={80} required />
              </label>
              <label className={styles.field}>
                <span>{isEs ? "Apellidos" : "Last name"}</span>
                <input name="lastName" defaultValue={profile.lastName} autoComplete="family-name" maxLength={80} required />
              </label>
            </div>

            <label className={styles.field}>
              <span>Email</span>
              <input value={profile.email} disabled aria-disabled="true" />
              <small>{isEs ? "Este es el correo utilizado para iniciar sesión." : "This is the email used to sign in."}</small>
            </label>

            <div className={styles.authGrid}>
              <label className={styles.field}>
                <span>{isEs ? "Teléfono" : "Phone"}</span>
                <input name="phone" defaultValue={profile.phone ?? ""} autoComplete="tel" maxLength={40} />
              </label>
              <label className={styles.field}>
                <span>{isEs ? "País" : "Country"}</span>
                <input name="country" defaultValue={profile.country ?? ""} autoComplete="country-name" maxLength={80} />
              </label>
            </div>

            <label className={styles.field}>
              <span>{isEs ? "Idioma preferido" : "Preferred language"}</span>
              <select name="preferredLocale" defaultValue={profile.preferredLocale === "es" ? "es" : "en"}>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </label>

            <div className={styles.actions}>
              <button className="button button-primary" type="submit">
                {isEs ? "Guardar cambios" : "Save changes"}
              </button>
              <Link className="button button-secondary" href="/account">
                {isEs ? "Cancelar" : "Cancel"}
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
