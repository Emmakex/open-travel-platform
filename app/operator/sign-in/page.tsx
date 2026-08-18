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
  title: "Operator sign in",
  description: "Fictional staff identity entry for Open Travel Platform."
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
          <h1>Operator workflows without provider lock-in.</h1>
          <p className={styles.lead}>
            The demo exposes fixed fictional operator and admin identities so forks can exercise
            role-aware workflows. A browser never supplies the role that becomes authoritative.
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
              A fictional customer session is active. Starting a staff demo session replaces only the
              demo identity; fictional reservations in this browser are preserved so the workflow can be reviewed.
            </div>
          ) : null}

          {identityConfig.demoSessionEnabled ? (
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
              Connect a production identity provider and map trusted claims to the `operator` or `admin` roles.
            </div>
          )}

          <div className={styles.notice}>
            <strong>Demo-only privilege switch.</strong> Self-selecting a staff identity is acceptable only
            because every record here is fictional. Production roles must come from a trusted server-side identity source.
          </div>

          <Link className="text-link" href="/">← Back to public catalogue</Link>
        </section>
      </div>
    </main>
  );
}
