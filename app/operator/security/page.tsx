import Link from "next/link";
import { changeStaffPasswordAction } from "@/app/operator/actions";
import styles from "@/app/operator/operator.module.css";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = {
  title: "Staff security | Kairoseth Travel",
  description: "Manage Kairoseth Travel staff account security."
};

export default async function StaffSecurityPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; changed?: string }>;
}) {
  const identity = await requireOperationsIdentity();
  const { error, changed } = await searchParams;

  const errors: Record<string, string> = {
    validation: "Check the fields. The new password must contain at least 12 characters, match the confirmation and differ from the current password.",
    "current-password": "The current password is incorrect.",
    forbidden: "Your current identity cannot manage this staff security page."
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Staff security</div>
          <h1>Protect your operations account.</h1>
          <p className={styles.lead}>
            Signed in as <strong>{identity.displayName}</strong>. Changing your password revokes every other staff session and securely renews this session.
          </p>

          {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}
          {changed === "1" ? <div className={styles.notice}>Password updated successfully.</div> : null}

          <form action={changeStaffPasswordAction} className={styles.editorForm}>
            <label className={styles.field}>
              <span>Current password</span>
              <input name="currentPassword" type="password" autoComplete="current-password" required />
            </label>
            <label className={styles.field}>
              <span>New password</span>
              <input name="newPassword" type="password" minLength={12} maxLength={128} autoComplete="new-password" required />
              <small>At least 12 characters.</small>
            </label>
            <label className={styles.field}>
              <span>Confirm new password</span>
              <input name="confirmPassword" type="password" minLength={12} maxLength={128} autoComplete="new-password" required />
            </label>
            <button className="button button-primary" type="submit">Update staff password</button>
          </form>

          <div className={styles.notice}>
            Staff sign-in is temporarily locked for 15 minutes after 5 failed attempts. Authentication events are recorded without storing raw passwords or session tokens.
          </div>

          <Link className="text-link" href="/operator">← Operator dashboard</Link>
        </section>
      </div>
    </main>
  );
}
