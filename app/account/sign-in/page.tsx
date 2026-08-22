import Link from "next/link";
import { redirect } from "next/navigation";
import { startDemoSession } from "@/app/account/actions";
import styles from "@/app/account/account.module.css";
import { hasCustomerAccess, hasOperationsAccess } from "@/lib/access-control";
import { getAccountCopy } from "@/lib/account-i18n";
import { getLocale } from "@/lib/get-locale";
import { identityConfig } from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";

export const metadata = {
  title: "Customer demo",
  description: "Explore the Kairoseth Travel customer account and booking journey with fictional demo data."
};

export default async function SignInPage() {
  const locale = await getLocale();
  const copy = getAccountCopy(locale).signIn;
  const identity = await getIdentityRepository().getCurrentIdentity();

  if (hasCustomerAccess(identity)) {
    redirect("/account");
  }

  if (hasOperationsAccess(identity)) {
    redirect("/operator");
  }

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1>{copy.title}</h1>
          <p className={styles.lead}>{copy.lead}</p>

          {identityConfig.demoSessionEnabled ? (
            <form action={startDemoSession}>
              <button className="button button-primary" type="submit">{copy.start}</button>
            </form>
          ) : (
            <div className={styles.notice}>{copy.disabled}</div>
          )}

          <div className={styles.notice}>
            <strong>{copy.noteTitle}</strong> {copy.note}
          </div>

          <p><Link className="text-link" href="/operator/sign-in">{copy.operator}</Link></p>
          <Link className="text-link" href="/">{copy.back}</Link>
        </section>
      </div>
    </main>
  );
}
