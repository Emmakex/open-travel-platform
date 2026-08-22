import Link from "next/link";
import { createStaffAccountAction, setStaffStatusAction } from "@/app/operator/staff/actions";
import styles from "@/app/operator/operator.module.css";
import { listRecentAuthAudit } from "@/lib/auth-security";
import { getLocale } from "@/lib/get-locale";
import { identityConfig } from "@/lib/identity-config";
import { accountStatusLabel, authEventLabel, formatOperatorDate, staffRoleLabel, tr } from "@/lib/operator-i18n";
import { requireAdminIdentity } from "@/lib/require-admin-identity";
import { listStaffUsers } from "@/lib/staff-auth";

export const metadata = { title: "Staff | Kairoseth Travel", description: "Admin-only Kairoseth Travel staff account management." };

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; updated?: string }> }) {
  const locale = await getLocale();
  const identity = await requireAdminIdentity();
  const { error, created, updated } = await searchParams;
  const [users, authAudit] = identityConfig.staffAuthEnabled ? await Promise.all([listStaffUsers(), listRecentAuthAudit(30)]) : [[], []];
  const errors: Record<string, string> = {
    validation: tr(locale, "Check the name, email, role and password. Passwords require at least 12 characters.", "Revisa nombre, email, rol y contraseña. La contraseña requiere al menos 12 caracteres."),
    "email-exists": tr(locale, "A staff account already exists for this email.", "Ya existe una cuenta de personal para este email."),
    "invalid-request": tr(locale, "The requested staff change is invalid.", "El cambio solicitado para el personal no es válido."),
    "self-disable": tr(locale, "You cannot disable your own active administrator account.", "No puedes desactivar tu propia cuenta de administrador activa."),
    "last-admin": tr(locale, "The final active administrator cannot be disabled.", "No se puede desactivar al último administrador activo."),
    "not-found": tr(locale, "The staff account could not be found.", "No se ha encontrado la cuenta de personal.")
  };

  return (
    <main className="section"><div className={`container ${styles.shell}`}>
      <section className={styles.panel}>
        <div className="eyebrow">{tr(locale, "Access control", "Control de acceso")}</div>
        <h1>{tr(locale, "Staff accounts", "Cuentas del personal")}</h1>
        <p className={styles.lead}>{tr(locale, "Administrators can create operator/admin accounts and disable access. Password hashes and session tokens are never shown here.", "Los administradores pueden crear cuentas de operador/administrador y desactivar accesos. Los hashes de contraseña y tokens de sesión nunca se muestran aquí.")}</p>
        {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}
        {created === "1" ? <div className={styles.notice}>{tr(locale, "Staff account created successfully.", "Cuenta de personal creada correctamente.")}</div> : null}
        {updated ? <div className={styles.notice}>{tr(locale, "Staff access updated to", "Acceso del personal actualizado a")} {accountStatusLabel(updated, locale)}.</div> : null}
        {!identityConfig.staffAuthEnabled ? <div className={styles.notice}>{tr(locale, "Persistent staff authentication is not active yet.", "La autenticación persistente del personal todavía no está activa.")}</div> : (
          <>
            <div className={styles.metrics}>
              <div className={styles.metric}><strong>{users.length}</strong><span>{tr(locale, "Total staff", "Total personal")}</span></div>
              <div className={styles.metric}><strong>{users.filter((user) => user.status === "active").length}</strong><span>{tr(locale, "Active", "Activos")}</span></div>
              <div className={styles.metric}><strong>{users.filter((user) => user.role === "admin").length}</strong><span>{tr(locale, "Admins", "Administradores")}</span></div>
              <div className={styles.metric}><strong>{users.filter((user) => user.role === "operator").length}</strong><span>{tr(locale, "Operators", "Operadores")}</span></div>
            </div>
            <div className={styles.sectionHeaderCompact}><div><div className="eyebrow">{tr(locale, "Provision access", "Crear acceso")}</div><h2>{tr(locale, "Create staff account", "Crear cuenta de personal")}</h2></div></div>
            <form action={createStaffAccountAction} className={styles.editorForm}>
              <div className={styles.formGrid}>
                <label className={styles.field}><span>{tr(locale, "Display name", "Nombre visible")}</span><input name="displayName" maxLength={100} required /></label>
                <label className={styles.field}><span>Email</span><input name="email" type="email" autoComplete="off" required /></label>
                <label className={styles.field}><span>{tr(locale, "Role", "Rol")}</span><select name="role" defaultValue="operator"><option value="operator">{staffRoleLabel("operator", locale)}</option><option value="admin">{staffRoleLabel("admin", locale)}</option></select></label>
                <label className={styles.field}><span>{tr(locale, "Temporary password", "Contraseña temporal")}</span><input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /><small>{tr(locale, "At least 12 characters. Share it through a secure channel.", "Al menos 12 caracteres. Compártela mediante un canal seguro.")}</small></label>
              </div>
              <button className="button button-primary" type="submit">{tr(locale, "Create staff account", "Crear cuenta de personal")}</button>
            </form>
          </>
        )}
      </section>

      {identityConfig.staffAuthEnabled ? <>
        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Team directory", "Directorio del equipo")}</div><h2>{tr(locale, "Operations users", "Usuarios de operaciones")}</h2>
          <div className={styles.managementList}>{users.map((user) => (
            <div className={styles.managementRow} key={user.id}>
              <div><strong>{user.displayName}{user.id === identity.id ? ` · ${tr(locale, "You", "Tú")}` : ""}</strong><span>{user.email} · {tr(locale, "created", "creado")} {formatOperatorDate(user.createdAt, locale, true)} · {tr(locale, "last sign-in", "último acceso")} {user.lastSignedInAt ? formatOperatorDate(user.lastSignedInAt, locale, true) : "—"}</span></div>
              <span className={styles.badge}>{staffRoleLabel(user.role, locale)}</span><span className={styles.badge}>{accountStatusLabel(user.status, locale)}</span>
              <form action={setStaffStatusAction}><input type="hidden" name="userId" value={user.id} /><input type="hidden" name="status" value={user.status === "active" ? "disabled" : "active"} /><button className="button button-secondary" type="submit" disabled={user.id === identity.id && user.status === "active"}>{user.status === "active" ? tr(locale, "Disable", "Desactivar") : tr(locale, "Enable", "Activar")}</button></form>
            </div>
          ))}</div>
        </section>
        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Authentication audit", "Auditoría de autenticación")}</div><h2>{tr(locale, "Recent account security activity", "Actividad reciente de seguridad")}</h2>
          <p className={styles.muted}>{tr(locale, "Authentication events never store raw passwords or session tokens. Unknown account identifiers are represented by one-way hashes.", "Los eventos de autenticación nunca guardan contraseñas ni tokens de sesión en bruto. Los identificadores de cuentas no resueltas se representan mediante hashes unidireccionales.")}</p>
          {authAudit.length ? <div className={styles.auditList}>{authAudit.map((event) => <div className={styles.auditItem} key={event.id}><strong>{staffRoleLabel(event.scope, locale)}</strong> · {authEventLabel(event.event, locale)} · {formatOperatorDate(event.occurredAt, locale, true)}{event.subjectId ? ` · ${event.subjectId}` : ` · ${tr(locale, "unresolved account", "cuenta no resuelta")}`}</div>)}</div> : <p className={styles.muted}>{tr(locale, "No authentication events have been recorded yet.", "Todavía no se han registrado eventos de autenticación.")}</p>}
        </section>
      </> : null}

      <div className={styles.toolbar}><Link className="button button-secondary" href="/operator/security">{tr(locale, "Security settings", "Ajustes de seguridad")}</Link><Link className="button button-secondary" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link></div>
    </div></main>
  );
}
