import Link from "next/link";
import { redirect } from "next/navigation";
import {
  signInStaffAction,
  startDemoAdminSession,
  startDemoOperatorSession
} from "@/app/operator/actions";
import styles from "@/app/operator/operator.module.css";
import { hasOperationsAccess } from "@/lib/access-control";
import { identityConfig } from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";
import { ensureBootstrapAdmin } from "@/lib/staff-auth";

export const metadata = {
  title: "Operator sign in | Kairoseth Travel",
  description: "Secure staff access for Kairoseth Travel operations."
};

export default async function OperatorSignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; demo?: string }>;
}) {
  const identity = await getIdentityRepository().getCurrentIdentity();
  const { error, demo } = await searchParams;

  if (hasOperationsAccess(identity)) {
    redirect("/operator");
  }

  const bootstrap = identityConfig.staffAuthEnabled
    ? await ensureBootstrapAdmin().catch(() => ({ created: false, count: 0, configured: false }))
    : null;

  const errors: Record<string, string> = {
    "invalid-credentials": "Sign in was not successful. Check your credentials. After repeated failures, staff access is temporarily locked for 15 minutes.",
    "auth-disabled": "Persistent staff authentication is disabled in this deployment.",
    forbidden: "The current identity does not have operator access."
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Staff access</div>
          <h1>Operations sign in.</h1>
          <p className={styles.lead}>
            Staff accounts use a separate protected identity boundary from customer accounts.
          </p>

          {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}
          {demo === "disabled" ? (
            <div className={styles.notice}>Demo staff identity is disabled in this deployment.</div>
          ) : null}

          {identity?.role === "customer" ? (
            <div className={styles.notice}>
              A customer session is active. Signing in as staff will close the customer session first.
            </div>
          ) : null}

          {identityConfig.staffAuthEnabled ? (
            <>
              {bootstrap?.count === 0 && !bootstrap.configured ? (
                <div className={styles.notice}>
                  No staff administrator exists yet. Configure the one-time bootstrap admin environment variables and redeploy before signing in.
                </div>
              ) : null}
              <form action={signInStaffAction} className={styles.editorForm}>
                <label className={styles.field}>
                  <span>Email</span>
                  <input name="email" type="email" autoComplete="username" required />
                </label>
                <label className={styles.field}>
                  <span>Password</span>
                  <input name="password" type="password" autoComplete="current-password" required />
                </label>
                <button className="button button-primary" type="submit">Sign in to operations</button>
              </form>
              <div className={styles.notice}>
                Staff sessions expire after 8 hours. Customer and staff sessions cannot be active at the same time. Authentication activity is audited without storing raw passwords or session tokens.
              </div>
            </>
          ) : identityConfig.demoStaffEnabled ? (
            <>
              <div className={styles.actions}>
                <form action={startDemoOperatorSession}>
                  <button className="button button-primary" type="submit">Start demo operator</button>
                </form>
                <form action={startDemoAdminSession}>
                  <button className="button button-secondary" type="submit">Start demo admin</button>
                </form>
              </div>
              <div className={styles.notice}>
                <strong>Temporary bridge.</strong> Set STAFF_AUTH_MODE=mongodb to replace these demo staff identities with persistent accounts.
              </div>
            </>
          ) : (
            <div className={styles.notice}>Staff access is disabled in this deployment.</div>
          )}

          <Link className="text-link" href="/">← Back to public catalogue</Link>
        </section>
      </div>
    </main>
  );
}
