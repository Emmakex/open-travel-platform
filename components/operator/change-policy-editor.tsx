import styles from "@/app/operator/operator.module.css";
import type { ReservationChangePolicy } from "@/domain/operations/change-policy";
import type { TravelLocale } from "@/domain/travel/types";
import { tr } from "@/lib/operator-i18n";

export function ChangePolicyEditor({
  policy,
  locale
}: {
  policy?: ReservationChangePolicy;
  locale: TravelLocale;
}) {
  return (
    <div className={styles.editorSection}>
      <div>
        <div className="eyebrow">{tr(locale, "Changes & cancellation", "Cambios y cancelación")}</div>
        <p className={styles.muted}>
          {tr(
            locale,
            "Set the rules that apply to new reservations. Each booking keeps a copy of these conditions, so changing the product later does not alter existing bookings. Leave a deadline blank when no time limit should apply.",
            "Configura las reglas para nuevas reservas. Cada reserva conserva una copia de estas condiciones, de modo que los cambios posteriores del producto no modifican reservas existentes. Deja un plazo vacío cuando no deba existir límite de tiempo."
          )}
        </p>
      </div>

      <label className={styles.checkboxField}>
        <input
          type="checkbox"
          name="customerCancellationAllowed"
          defaultChecked={policy?.customerCancellationAllowed !== false}
        />
        <span>{tr(locale, "Allow customer self-service cancellation", "Permitir cancelación por el cliente")}</span>
      </label>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>{tr(locale, "Customer cancellation deadline (hours before start)", "Plazo de cancelación del cliente (horas antes del inicio)")}</span>
          <input
            type="number"
            name="customerCancellationCutoffHours"
            min="0"
            max="8760"
            step="1"
            defaultValue={policy?.customerCancellationCutoffHours ?? ""}
            placeholder={tr(locale, "No time limit", "Sin límite de tiempo")}
          />
        </label>
        <label className={styles.field}>
          <span>{tr(locale, "Staff modification deadline (hours before start)", "Plazo de modificación por personal (horas antes del inicio)")}</span>
          <input
            type="number"
            name="staffModificationCutoffHours"
            min="0"
            max="8760"
            step="1"
            defaultValue={policy?.staffModificationCutoffHours ?? ""}
            placeholder={tr(locale, "No time limit", "Sin límite de tiempo")}
          />
        </label>
        <label className={styles.field}>
          <span>{tr(locale, "Staff cancellation deadline (hours before start)", "Plazo de cancelación por personal (horas antes del inicio)")}</span>
          <input
            type="number"
            name="staffCancellationCutoffHours"
            min="0"
            max="8760"
            step="1"
            defaultValue={policy?.staffCancellationCutoffHours ?? ""}
            placeholder={tr(locale, "No time limit", "Sin límite de tiempo")}
          />
        </label>
      </div>

      <label className={styles.checkboxField}>
        <input
          type="checkbox"
          name="notifyCustomerOnStaffChange"
          defaultChecked={policy?.notifyCustomerOnStaffChange !== false}
        />
        <span>{tr(locale, "Email the customer after staff changes", "Enviar correo al cliente después de cambios del personal")}</span>
      </label>
    </div>
  );
}
