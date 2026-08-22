import Link from "next/link";
import { resetStaffPasswordAction } from "@/app/operator/password-recovery-actions";
import styles from "@/app/operator/operator.module.css";

export const metadata = {
  title: "Staff recovery | Kairoseth Travel",
  description: "Complete secure staff account recovery."
};

export default async function StaffResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token = "", error } = await searchParams;

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Staff security</div>
          <h1>Choose new credentials.</h1>
          <p className={styles.lead}>The recovery link is single-use and expires after 30 minutes.</p>

          {error === "validation" ? <div className={styles.notice}>The two values must match and contain at least 12 characters.</div> : null}
          {error === "invalid-token" || !token ? <div className={styles.notice}>This recovery link is invalid, already used, or expired.</div> : null}

          {token ? (
            <form action={resetStaffPasswordAction} className={styles.editorForm}>
              <input type="hidden" name="token" value={token} />
              <label className={styles.field}>
                <span>New password</span>
                <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
              </label>
              <label className={styles.field}>
                <span>Confirm new password</span>
                <input name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
              </label>
              <button className="button button-primary" type="submit">Save new password</button>
            </form>
          ) : null}

          <Link className="text-link" href="/operator/forgot-password">Request a new recovery link →</Link>
        </section>
      </div>
    </main>
  );
}
