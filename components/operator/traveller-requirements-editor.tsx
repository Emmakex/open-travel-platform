"use client";

import { useState } from "react";
import styles from "@/app/operator/operator.module.css";
import type {
  TravellerRequirementField,
  TravellerRequirementPreset,
  TravellerRequirementsProfile
} from "@/domain/traveller/types";
import type { TravelLocale } from "@/domain/travel/types";
import { tr } from "@/lib/operator-i18n";
import {
  defaultTravellerRetentionDays,
  travellerRequirementFields,
  travellerRequirementPresetFields
} from "@/lib/traveller-requirements";

const fieldLabels: Record<TravellerRequirementField, [string, string]> = {
  secondSurname: ["Second surname", "Segundo apellido"],
  sex: ["Sex as shown on document", "Sexo según documento"],
  documentType: ["Travel document type", "Tipo de documento"],
  documentNumber: ["Travel document number", "Número de documento"],
  documentSupportNumber: ["Document support number", "Número de soporte del documento"],
  documentIssuingCountry: ["Document issuing country", "País emisor del documento"],
  documentExpiryDate: ["Document expiry date", "Caducidad del documento"],
  residenceAddress: ["Habitual residence address", "Dirección de residencia habitual"],
  residenceCity: ["Habitual residence city", "Localidad de residencia habitual"],
  residenceCountry: ["Habitual residence country", "País de residencia habitual"],
  phone: ["Phone", "Teléfono"],
  email: ["Email", "Correo electrónico"],
  emergencyContactName: ["Emergency contact name", "Nombre de contacto de emergencia"],
  emergencyContactPhone: ["Emergency contact phone", "Teléfono de emergencia"],
  minorTravelAuthorization: ["Minor travel authorisation status", "Autorización de viaje del menor"]
};

export function TravellerRequirementsEditor({
  profile,
  locale
}: {
  profile?: TravellerRequirementsProfile;
  locale: TravelLocale;
}) {
  const [preset, setPreset] = useState<TravellerRequirementPreset>(profile?.preset ?? "none");
  const [retention, setRetention] = useState(profile?.retentionDaysAfterEnd ?? defaultTravellerRetentionDays(profile?.preset ?? "none"));
  const selected = new Set(profile?.requiredFields ?? travellerRequirementPresetFields(preset));

  function changePreset(next: TravellerRequirementPreset) {
    setPreset(next);
    setRetention(defaultTravellerRetentionDays(next));
  }

  return (
    <div className={styles.editorSection}>
      <div>
        <div className="eyebrow">{tr(locale, "Post-purchase traveller data", "Datos de viajeros después de la compra")}</div>
        <p className={styles.muted}>
          {tr(
            locale,
            "Request advanced identity/document fields only after the booking is created and only when the supplier, route or law requires them. Do not request scans or copies of passports/DNI here.",
            "Solicita datos avanzados de identidad/documentación solo después de crear la reserva y únicamente cuando el proveedor, la ruta o la ley los exijan. No solicites escaneos ni copias de pasaporte/DNI aquí."
          )}
        </p>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>{tr(locale, "Requirement preset", "Perfil de requisitos")}</span>
          <select name="travellerRequirementPreset" value={preset} onChange={(event) => changePreset(event.target.value as TravellerRequirementPreset)}>
            <option value="none">{tr(locale, "No additional data", "Sin datos adicionales")}</option>
            <option value="travel-document">{tr(locale, "Travel document", "Documento de viaje")}</option>
            <option value="international-air">{tr(locale, "International air / border data", "Vuelo internacional / datos fronterizos")}</option>
            <option value="maritime">{tr(locale, "Passenger ship (>20 miles)", "Transporte marítimo (>20 millas)")}</option>
            <option value="spanish-lodging">{tr(locale, "Spanish lodging registration", "Registro de hospedaje en España")}</option>
            <option value="custom">{tr(locale, "Custom", "Personalizado")}</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>{tr(locale, "Customer editing closes (days before start)", "Cerrar edición del cliente (días antes del inicio)")}</span>
          <input name="travellerRequirementDeadlineDays" type="number" min="0" max="365" step="1" defaultValue={profile?.completionDeadlineDaysBeforeStart ?? ""} placeholder={tr(locale, "Blank = until start", "Vacío = hasta el inicio")} />
        </label>
        <label className={styles.field}>
          <span>{tr(locale, "Retention after trip/service ends (days)", "Conservación tras finalizar el viaje/servicio (días)")}</span>
          <input name="travellerRequirementRetentionDays" type="number" min="0" max="3650" step="1" value={retention} onChange={(event) => setRetention(Number(event.target.value) || 0)} />
        </label>
      </div>

      {preset === "spanish-lodging" ? (
        <div className={styles.notice}>
          {tr(
            locale,
            "Use this preset only when the deployment is legally acting as a lodging provider/intermediary subject to Spanish RD 933/2021. It defaults to 3-year retention. AEPD guidance says lodging operators must not request a copy of the DNI/passport merely to satisfy that registration duty.",
            "Usa este perfil solo cuando el despliegue actúe legalmente como proveedor/intermediario de hospedaje sujeto al RD 933/2021. Por defecto conserva 3 años. La AEPD indica que no debe solicitarse una copia del DNI/pasaporte solo para cumplir esta obligación de registro."
          )}
        </div>
      ) : null}

      {preset !== "none" ? (
        <div className={styles.editorForm}>
          <h3>{tr(locale, "Fields requested after booking", "Campos solicitados después de reservar")}</h3>
          {travellerRequirementFields.map((field) => {
            const checked = preset === "custom"
              ? selected.has(field)
              : travellerRequirementPresetFields(preset).includes(field);
            return (
              <label className={styles.checkboxField} key={field}>
                <input
                  type="checkbox"
                  name="travellerRequirementField"
                  value={field}
                  defaultChecked={checked}
                  disabled={preset !== "custom"}
                />
                <span>{tr(locale, fieldLabels[field][0], fieldLabels[field][1])}</span>
              </label>
            );
          })}
          {preset !== "custom" ? (
            <p className={styles.muted}>{tr(locale, "Choose Custom to change the field list.", "Elige Personalizado para cambiar la lista de campos.")}</p>
          ) : null}
        </div>
      ) : null}

      <div className={styles.notice}>
        {tr(
          locale,
          "Health/medical information is intentionally not part of these presets. If an insurer or supplier genuinely requires health data, use a separate explicit-consent flow and legal review because health data is a special category under GDPR Article 9.",
          "Los datos médicos/sanitarios no forman parte de estos perfiles de forma intencionada. Si una aseguradora o proveedor los exige realmente, debe utilizarse un flujo separado con consentimiento explícito y revisión legal, ya que los datos de salud son categoría especial según el artículo 9 del RGPD."
        )}
      </div>
    </div>
  );
}
