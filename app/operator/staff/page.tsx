import Link from "next/link";
import {
  createStaffAccountAction,
  setStaffCapabilitiesAction,
  setStaffStatusAction
} from "@/app/operator/staff/actions";
import styles from "@/app/operator/operator.module.css";
import type { StaffCapability } from "@/domain/identity/types";
import { listRecentAuthAudit } from "@/lib/auth-security";
import { getLocale } from "@/lib/get-locale";
import { identityConfig } from "@/lib/identity-config";
import { accountStatusLabel, authEventLabel, formatOperatorDate, staffRoleLabel, tr } from "@/lib/operator-i18n";
import { requireAdminIdentity } from "@/lib/require-admin-identity";
import { legacyOperatorCapabilities } from "@/lib/staff-capabilities";
import { listExplicitStaffCapabilities, listRecentStaffCapabilityAudit } from "@/lib/staff-permissions";
import { listStaffUsers } from "@/lib/staff-auth";

export const metadata = { title: "Staff | Kairoseth Travel", description: "Admin-only Kairoseth Travel staff account management." };

export default async function StaffPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; permissionsUpdated?: string }>;
}) {
  const locale = await getLocale();
  const identity = await requireAdminIdentity();
  const { error, created, updated, permissionsUpdated } = await searchParams;
  const [users, authAudit, explicitCapabilities, permissionAudit] = identityConfig.staffAuthEnabled
    ? await Promise.all([
        listStaffUsers(),
        listRecentAuthAudit(30),
        listExplicitStaffCapabilities(),
        listRecentStaffCapabilityAudit(40)
      ])
    : [[], [], new Map<string, StaffCapability[]>(), []];

  const capabilityOptions: Array<{ value: StaffCapability; label: string; description: string }> = [
    { value: "reservations", label: tr(locale, "Reservations", "Reservas"), description: tr(locale, "Reservation queues, status and booking amendments.", "Colas, estados y modificaciones de reservas.") },
    { value: "catalogue", label: tr(locale, "Catalogue", "Catálogo"), description: tr(locale, "Trips, services, accommodation, media and availability configuration.", "Viajes, servicios, alojamientos, multimedia y disponibilidad.") },
    { value: "finance", label: tr(locale, "Finance", "Finanzas"), description: tr(locale, "Payments, refunds, balances, payment terms and reminders.", "Pagos, reembolsos, saldos, condiciones y recordatorios de pago.") },
    { value: "traveller-data", label: tr(locale, "Traveller data", "Datos de viajeros"), description: tr(locale, "Post-purchase traveller-data completion and protected traveller information.", "Completitud e información protegida de viajeros post-compra.") },
    { value: "suppliers", label: tr(locale, "Suppliers", "Proveedores"), description: tr(locale, "Supplier fulfilment, references, internal cost and follow-up.", "Gestión, referencias, coste interno y seguimiento de proveedores.") },
    { value: "tasks", label: tr(locale, "Tasks", "Tareas"), description: tr(locale, "Internal tasks, assignees, deadlines and follow-ups.", "Tareas internas, responsables, vencimientos y seguimientos.") }
  ];
  const capabilityLabels = new Map(capabilityOptions.map((item) => [item.value, item.label]));
  const staffNames = new Map(users.map((user) => [user.id, user.displayName]));
  const capabilitySummary = (mode: "legacy" | "explicit", capabilities?: StaffCapability[]) => {
    if (mode === "legacy") return tr(locale, "Legacy Operator default", "Perfil Operator heredado");
    if (!capabilities?.length) return tr(locale, "No operational capabilities", "Sin capacidades operativas");
    return capabilities.map((capability) => capabilityLabels.get(capability) ?? capability).join(", ");
  };

  const errors: Record<string, string> = {
    validation: tr(locale, "Check the name, email, role and password. Passwords require at least 12 characters.", "Revisa nombre, email, rol y contraseña. La contraseña requiere al menos 12 caracteres."),
    "email-exists": tr(locale, "A staff account already exists for this email.", "Ya existe una cuenta de personal para este email."),
    "invalid-request": tr(locale, "The requested staff change is invalid.", "El cambio solicitado para el personal no es válido."),
    "self-disable": tr(locale, "You cannot disable your own active administrator account.", "No puedes desactivar tu propia cuenta de administrador activa."),
    "last-admin": tr(locale, "The final active administrator cannot be disabled.", "No se puede desactivar al último administrador activo."),
    "not-found": tr(locale, "The staff account could not be found.", "No se ha encontrado la cuenta de personal."),
    "admin-capabilities": tr(locale, "Administrator accounts always have full access and cannot be restricted here.", "Las cuentas de administrador siempre tienen acceso completo y no se pueden restringir aquí.")
  };

  return (
    <main className="section"><div className={`container ${styles.shell}`}>
      <section className={styles.panel}>
        <div className="eyebrow">{tr(locale, "Access control", "Control de acceso")}</div>
        <h1>{tr(locale, "Staff accounts", "Cuentas del personal")}</h1>
        <p className={styles.lead}>{tr(
          locale,
          "Administrators can create staff accounts, restrict Operator capabilities and disable access. Administrator accounts remain full-access superusers.",
          "Los administradores pueden crear cuentas, restringir capacidades de Operator y desactivar accesos. Las cuentas Admin permanecen como superusuarios con acceso completo."
        )}</p>
        {error && errors[error] ? <div className={styles.notice}>{errors[error]}</div> : null}
        {created === "1" ? <div className={styles.notice}>{tr(locale, "Staff account created successfully.", "Cuenta de personal creada correctamente.")}</div> : null}
        {updated ? <div className={styles.notice}>{tr(locale, "Staff access updated to", "Acceso del personal actualizado a")} {accountStatusLabel(updated, locale)}.</div> : null}
        {permissionsUpdated === "1" ? <div className={styles.notice}>{tr(locale, "Operator permissions updated.", "Permisos de Operator actualizados.")}</div> : null}

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
                <label className={styles.field}><span>{tr(locale, "Role", "Rol")}</span><select name="role" defaultValue="operator"><option value="operator">{staffRoleLabel("operator", locale)}</option><option value="admin">{staffRoleLabel("admin", locale)}</option></select><small>{tr(locale, "Admin always receives full access. The capability selection below applies to Operator accounts.", "Admin siempre recibe acceso completo. La selección inferior se aplica a cuentas Operator.")}</small></label>
                <label className={styles.field}><span>{tr(locale, "Temporary password", "Contraseña temporal")}</span><input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /><small>{tr(locale, "At least 12 characters. Share it through a secure channel.", "Al menos 12 caracteres. Compártela mediante un canal seguro.")}</small></label>
              </div>

              <fieldset className={styles.editorSection}>
                <legend><strong>{tr(locale, "Operator capabilities", "Capacidades de Operator")}</strong></legend>
                <div className={styles.managementList}>
                  {capabilityOptions.map((capability) => (
                    <label className={styles.managementRow} key={capability.value}>
                      <span><strong>{capability.label}</strong><span>{capability.description}</span></span>
                      <input type="checkbox" name="capabilities" value={capability.value} defaultChecked />
                    </label>
                  ))}
                </div>
              </fieldset>

              <button className="button button-primary" type="submit">{tr(locale, "Create staff account", "Crear cuenta de personal")}</button>
            </form>
          </>
        )}
      </section>

      {identityConfig.staffAuthEnabled ? <>
        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Team directory", "Directorio del equipo")}</div>
          <h2>{tr(locale, "Operations users", "Usuarios de operaciones")}</h2>
          <div className={styles.managementList}>{users.map((user) => {
            const explicit = explicitCapabilities.get(user.id);
            const selected = new Set(explicit ?? legacyOperatorCapabilities);
            return (
              <div className={styles.editorSection} key={user.id}>
                <div className={styles.sectionHeader}>
                  <div><strong>{user.displayName}{user.id === identity.id ? ` · ${tr(locale, "You", "Tú")}` : ""}</strong><div className={styles.muted}>{user.email} · {tr(locale, "created", "creado")} {formatOperatorDate(user.createdAt, locale, true)} · {tr(locale, "last sign-in", "último acceso")} {user.lastSignedInAt ? formatOperatorDate(user.lastSignedInAt, locale, true) : "—"}</div></div>
                  <div className={styles.actions}><span className={styles.badge}>{staffRoleLabel(user.role, locale)}</span><span className={styles.badge}>{accountStatusLabel(user.status, locale)}</span></div>
                </div>

                {user.role === "operator" ? (
                  <form action={setStaffCapabilitiesAction} className={styles.editorForm}>
                    <input type="hidden" name="userId" value={user.id} />
                    <div className={styles.notice}>
                      {explicit === undefined
                        ? tr(locale, "Legacy Operator access is active. Saving this form will create an explicit least-privilege assignment.", "El acceso legacy de Operator está activo. Al guardar se creará una asignación explícita de mínimo privilegio.")
                        : tr(locale, "Explicit Operator permissions are active.", "Los permisos explícitos de Operator están activos.")}
                    </div>
                    <div className={styles.managementList}>
                      {capabilityOptions.map((capability) => (
                        <label className={styles.managementRow} key={`${user.id}-${capability.value}`}>
                          <span><strong>{capability.label}</strong><span>{capability.description}</span></span>
                          <input type="checkbox" name="capabilities" value={capability.value} defaultChecked={selected.has(capability.value)} />
                        </label>
                      ))}
                    </div>
                    <button className="button button-secondary" type="submit">{tr(locale, "Save permissions", "Guardar permisos")}</button>
                  </form>
                ) : (
                  <div className={styles.notice}>{tr(locale, "Administrator · Full access to every capability.", "Administrador · Acceso completo a todas las capacidades.")}</div>
                )}

                <form action={setStaffStatusAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="status" value={user.status === "active" ? "disabled" : "active"} />
                  <button className="button button-secondary" type="submit" disabled={user.id === identity.id && user.status === "active"}>{user.status === "active" ? tr(locale, "Disable account", "Desactivar cuenta") : tr(locale, "Enable account", "Activar cuenta")}</button>
                </form>
              </div>
            );
          })}</div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          <div className="eyebrow">{tr(locale, "Permission audit", "Auditoría de permisos")}</div>
          <h2>{tr(locale, "Recent access changes", "Cambios recientes de acceso")}</h2>
          <p className={styles.muted}>{tr(
            locale,
            "Every explicit Operator capability change records the previous assignment, the new assignment, the administrator and the timestamp.",
            "Cada cambio explícito de capacidades de Operator registra la asignación anterior, la nueva, el administrador responsable y la fecha y hora."
          )}</p>
          {permissionAudit.length ? <div className={styles.auditList}>{permissionAudit.map((event) => (
            <div className={styles.auditItem} key={event.id}>
              <strong>{staffNames.get(event.userId) ?? event.userId}</strong> · {formatOperatorDate(event.occurredAt, locale, true)}<br />
              {capabilitySummary(event.beforeMode, event.beforeCapabilities)} → {capabilitySummary(event.afterMode, event.afterCapabilities)}<br />
              <span className={styles.muted}>{tr(locale, "Changed by", "Modificado por")}: {staffNames.get(event.actorIdentityId) ?? event.actorIdentityId}</span>
            </div>
          ))}</div> : <p className={styles.muted}>{tr(locale, "No permission changes have been recorded yet.", "Todavía no se han registrado cambios de permisos.")}</p>}
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
