import Link from "next/link";
import { redirect } from "next/navigation";
import {
  startDemoAdminSession,
  startDemoOperatorSession
} from "@/app/operator/actions";
import styles from "@/app/operator/operator.module.css";
import { hasOperationsAccess } from "@/lib/access-control";
import { identityConfig } from "@/lib/identity-config";
import { getIdentityRepository } from "@/lib/identity-repository";

export const metadata = {
  title: "Operator sign in | Kairoseth Travel",
  description: "Staff access boundary for Kairoseth Travel operations."
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

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Staff identity boundary</div>
          <h1>Operations access.</h1>
          <p className={styles.lead}>
            Customer accounts are now persistent. Operator and admin access remains an explicit demo-only staff switch while the production staff identity layer is being built.
          </p>

          {error === "forbidden" ? (
            <div className={styles.notice}>
              The current identity does not have operator access. Staff permissions are checked on the server.
            </div>
          ) : null}

          {demo === "disabled" ? (
            <div className={styles.notice}>Demo staff identity is disabled in this deployment.</div>
          ) : null}

          {identity?.role === "customer" ? (
            <div className={styles.notice}>
              A customer session is active. Starting a staff session signs that customer session out before entering the operator console.
            </div>
          ) : null}

          {identityConfig.demoStaffEnabled ? (
            <div className={styles.actions}>
              <form action={startDemoOperatorSession}>
                <button className="button button-primary" type="submit">Start demo operator</button>
              </form>
              <form action={startDemoAdminSession}>
                <button className="button button-secondary" type="submit">Start demo admin</button>
              </form>
            </div>
          ) : (
            <div className={styles.notice}>
              Staff demo access is disabled. Connect a trusted staff identity provider or persistent staff account source.
            </div>
          )}

          <div className={styles.notice}>
            <strong>Temporary staff bridge.</strong> Customer identities cannot self-assign operator/admin roles. The demo staff switch remains isolated and server-controlled until real staff authentication replaces it.
          </div>

          <Link className="text-link" href="/">← Back to public catalogue</Link>
        </section>
      </div>
    </main>
  );
}
