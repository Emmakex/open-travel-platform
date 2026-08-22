import Link from "next/link";
import { redirect } from "next/navigation";
import { startDemoSession } from "@/app/account/actions";
import styles from "@/app/account/account.module.css";
import { hasCustomerAccess, hasOperationsAccess } from "@/lib/access-control";
import { identityConfig } from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";

export const metadata = {
  title: "Customer demo",
  description: "Explore the Kairoseth Travel customer account and booking journey with fictional demo data."
};

export default async function SignInPage() {
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
          <div className="eyebrow">Customer demo</div>
          <h1>Explore the customer journey.</h1>
          <p className={styles.lead}>
            Start a fictional customer session to create a demo reservation, review your trip and
            explore the account experience. No password or real personal data is required.
          </p>

          {identityConfig.demoSessionEnabled ? (
            <form action={startDemoSession}>
              <button className="button button-primary" type="submit">
                Start customer demo
              </button>
            </form>
          ) : (
            <div className={styles.notice}>
              Customer demo access is disabled in this deployment.
            </div>
          )}

          <div className={styles.notice}>
            <strong>Demo environment.</strong> The identity and account information shown here are
            fictional and must not be used for real customer or commercial data.
          </div>

          <p><Link className="text-link" href="/operator/sign-in">Staff demo →</Link></p>
          <Link className="text-link" href="/">← Back to catalogue</Link>
        </section>
      </div>
    </main>
  );
}
