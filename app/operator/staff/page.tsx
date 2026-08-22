import Link from "next/link";
import {
  createStaffAccountAction,
  setStaffStatusAction
} from "@/app/operator/staff/actions";
import styles from "@/app/operator/operator.module.css";
import { identityConfig } from "@/lib/identity-config";
import { requireAdminIdentity } from "@/lib/require-admin-identity";
import { listStaffUsers } from "@/lib/staff-auth";

export const metadata = {
  title: "Staff access | Kairoseth Travel",
  description: "Admin-only staff account management for Kairoseth Travel."
};

function formatDate(value?: Date) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function StaffPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string }>;
}) {
  const identity = await requireAdminIdentity();
  const { error, created, updated } = await searchParams;
  const users = identityConfig.staffAuthEnabled ? await listStaffUsers() : [];

  const errors: Record<string, string> = {
    validation: "Check the name, email, role and password. Passwords require at least 12 characters.",
    "email-exists": "A staff account already exists for this email.",
    "invalid-request": "The requested staff change is invalid.",
    "self-disable": "You cannot disable your own active administrator account.",
    "last-admin": "The final active administrator cannot be disabled.",
    "not-found": "The staff account could not be found."
  };

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Access control</div>
          <h1>Staff accounts</h1>
          <p className={styles.lead}>
            Administrators can provision operator/admin accounts and disable access. Password hashes and session tokens are never shown here.
          </p>

          {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}
          {created === "1" ? <div className={styles.notice}>Staff account created successfully.</div> : null}
          {updated ? <div className={styles.notice}>Staff access updated to {updated}.</div> : null}

          {!identityConfig.staffAuthEnabled ? (
            <div className={styles.notice}>
              Persistent staff authentication is not active yet. Set <strong>STAFF_AUTH_MODE=mongodb</strong> and configure the one-time bootstrap administrator before using this module.
            </div>
          ) : (
            <>
              <div className={styles.metrics}>
                <div className={styles.metric}><strong>{users.length}</strong><span>Total staff</span></div>
                <div className={styles.metric}><strong>{users.filter((user) => user.status === "active").length}</strong><span>Active</span></div>
                <div className={styles.metric}><strong>{users.filter((user) => user.role === "admin").length}</strong><span>Admins</span></div>
                <div className={styles.metric}><strong>{users.filter((user) => user.role === "operator").length}</strong><span>Operators</span></div>
              </div>

              <div className={styles.sectionHeaderCompact}>
                <div>
                  <div className="eyebrow">Provision access</div>
                  <h2>Create staff account</h2>
                </div>
              </div>

              <form action={createStaffAccountAction} className={styles.editorForm}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>Display name</span>
                    <input name="displayName" maxLength={100} required />
                  </label>
                  <label className={styles.field}>
                    <span>Email</span>
                    <input name="email" type="email" autoComplete="off" required />
                  </label>
                  <label className={styles.field}>
                    <span>Role</span>
                    <select name="role" defaultValue="operator">
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Temporary password</span>
                    <input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required />
                    <small>At least 12 characters. Share it through a secure channel.</small>
                  </label>
                </div>
                <button className="button button-primary" type="submit">Create staff account</button>
              </form>
            </>
          )}
        </section>

        {identityConfig.staffAuthEnabled ? (
          <section className={styles.panel} style={{ marginTop: "1rem" }}>
            <div className="eyebrow">Team directory</div>
            <h2>Operations users</h2>
            <div className={styles.managementList}>
              {users.map((user) => (
                <div className={styles.managementRow} key={user.id}>
                  <div>
                    <strong>{user.displayName}{user.id === identity.id ? " · You" : ""}</strong>
                    <span>{user.email} · created {formatDate(user.createdAt)} · last sign-in {formatDate(user.lastSignedInAt)}</span>
                  </div>
                  <span className={styles.badge}>{user.role}</span>
                  <span className={styles.badge}>{user.status}</span>
                  <form action={setStaffStatusAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="status" value={user.status === "active" ? "disabled" : "active"} />
                    <button
                      className="button button-secondary"
                      type="submit"
                      disabled={user.id === identity.id && user.status === "active"}
                    >
                      {user.status === "active" ? "Disable" : "Enable"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className={styles.toolbar}>
          <Link className="button button-secondary" href="/operator">← Operator dashboard</Link>
        </div>
      </div>
    </main>
  );
}
