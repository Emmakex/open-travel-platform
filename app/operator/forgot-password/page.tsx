import Link from "next/link";
import { requestStaffPasswordResetAction } from "@/app/operator/password-recovery-actions";
import styles from "@/app/operator/operator.module.css";
import { isEmailDeliveryConfigured } from "@/lib/email";

export const metadata = {
  title: "Staff password recovery | Kairoseth Travel",
  description: "Request a secure Kairoseth Travel staff password reset link."
};

export default async function StaffForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  const configured = isEmailDeliveryConfigured();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Staff security</div>
          <h1>Recover staff access.</h1>
          <p className={styles.lead}>
            Enter your staff email. If an active account exists, a single-use password reset link valid for 30 minutes will be sent.
          </p>

          {sent === "1" ? (
            <div className={styles.notice}>
              If an active staff account exists for that email, a recovery link will arrive shortly.
            </div>
          ) : null}
          {error === "delivery-unavailable" || !configured ? (
            <div className={styles.notice}>Email password recovery is temporarily unavailable.</div>
          ) : null}
          {error === "delivery-failed" ? (
            <div className={styles.notice}>The recovery email could not be sent. Please try again in a few minutes.</div>
          ) : null}

          {configured ? (
            <form action={requestStaffPasswordResetAction} className={styles.editorForm}>
              <label className={styles.field}>
                <span>Email</span>
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <button className="button button-primary" type="submit">Send recovery link</button>
            </form>
          ) : null}

          <Link className="text-link" href="/operator/sign-in">← Back to staff sign in</Link>
        </section>
      </div>
    </main>
  );
}
