"use client";

import { useRef, useState } from "react";
import { saveTripAddOnsAction } from "@/app/operator/catalogue/trips/add-on-actions";
import styles from "@/app/operator/operator.module.css";
import type { TravelLocale, Trip, TripAddOn } from "@/domain/travel/types";
import { tr } from "@/lib/operator-i18n";

type EditableAddOn = TripAddOn;

export function TripAddOnEditor({ trip, locale, updated, error }: {
  trip: Trip;
  locale: TravelLocale;
  updated?: boolean;
  error?: string;
}) {
  const nextId = useRef(1);
  const [rows, setRows] = useState<EditableAddOn[]>(trip.addOns ?? []);

  function addRow() {
    if (rows.length >= 20) return;
    const id = `addon-new-${Date.now()}-${nextId.current++}`;
    setRows((current) => [
      ...current,
      {
        id,
        code: "",
        title: "",
        titleEs: "",
        description: "",
        descriptionEs: "",
        price: 0,
        pricingMode: "per-booking",
        enabled: true
      }
    ]);
  }

  function updateRow(id: string, patch: Partial<EditableAddOn>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  return (
    <section className={styles.panel} id="package-addons">
      <div className="eyebrow">{tr(locale, "Optional package supplements", "Suplementos opcionales del paquete")}</div>
      <h2>{tr(locale, "Build the optional package", "Configurar el paquete opcional")}</h2>
      <p className={styles.lead}>
        {tr(
          locale,
          "Add non-inventory upgrades or supplements that customers can select inside the trip booking. Capacity-based activities, transfers and dated services remain independent services.",
          "Añade mejoras o suplementos sin inventario propio que el cliente pueda seleccionar dentro de la reserva del viaje. Las actividades, traslados y servicios con fecha o cupo siguen como servicios independientes."
        )}
      </p>
      {updated ? <div className={styles.notice}>{tr(locale, "Package supplements saved.", "Suplementos del paquete guardados.")}</div> : null}
      {error ? (
        <div className={styles.notice}>
          {error === "validation"
            ? tr(locale, "Review titles, translations, unique codes, prices and descriptions. Descriptions must be completed in both languages or left empty in both.", "Revisa títulos, traducciones, códigos únicos, precios y descripciones. Las descripciones deben completarse en ambos idiomas o dejarse vacías en ambos.")
            : tr(locale, "The package supplements could not be saved.", "No se pudieron guardar los suplementos del paquete.")}
        </div>
      ) : null}

      <form action={saveTripAddOnsAction} className={styles.editorForm}>
        <input type="hidden" name="tripId" value={trip.id} />

        {rows.length ? rows.map((row, index) => (
          <div className={styles.editorSection} key={row.id}>
            <input type="hidden" name="tripAddOnId" value={row.id} />
            <div className={styles.sectionHeader}>
              <strong>{tr(locale, "Supplement", "Suplemento")} {index + 1}</strong>
              <button className="button button-secondary" type="button" onClick={() => removeRow(row.id)}>
                {tr(locale, "Remove", "Eliminar")}
              </button>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>{tr(locale, "Title (EN) *", "Título (EN) *")}</span>
                <input name={`tripAddOnTitle__${row.id}`} value={row.title} onChange={(event) => updateRow(row.id, { title: event.target.value })} required />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Title (ES) *", "Título (ES) *")}</span>
                <input name={`tripAddOnTitleEs__${row.id}`} value={row.titleEs} onChange={(event) => updateRow(row.id, { titleEs: event.target.value })} required />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Code *", "Código *")}</span>
                <input name={`tripAddOnCode__${row.id}`} value={row.code} onChange={(event) => updateRow(row.id, { code: event.target.value })} placeholder="luggage_upgrade" required />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Price *", "Precio *")}</span>
                <input type="number" min="0" step="0.01" name={`tripAddOnPrice__${row.id}`} value={row.price} onChange={(event) => updateRow(row.id, { price: Number(event.target.value) })} required />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Charge", "Cobro")}</span>
                <select name={`tripAddOnPricingMode__${row.id}`} value={row.pricingMode} onChange={(event) => updateRow(row.id, { pricingMode: event.target.value === "per-traveller" ? "per-traveller" : "per-booking" })}>
                  <option value="per-booking">{tr(locale, "Once per booking", "Una vez por reserva")}</option>
                  <option value="per-traveller">{tr(locale, "Per selected traveller", "Por viajero seleccionado")}</option>
                </select>
              </label>
              <label className={styles.checkboxField}>
                <input type="checkbox" name={`tripAddOnEnabled__${row.id}`} checked={row.enabled} onChange={(event) => updateRow(row.id, { enabled: event.target.checked })} />
                <span>{tr(locale, "Available to customers", "Disponible para clientes")}</span>
              </label>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>{tr(locale, "Description (EN)", "Descripción (EN)")}</span>
                <textarea name={`tripAddOnDescription__${row.id}`} value={row.description ?? ""} onChange={(event) => updateRow(row.id, { description: event.target.value })} rows={3} />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Description (ES)", "Descripción (ES)")}</span>
                <textarea name={`tripAddOnDescriptionEs__${row.id}`} value={row.descriptionEs ?? ""} onChange={(event) => updateRow(row.id, { descriptionEs: event.target.value })} rows={3} />
              </label>
            </div>
          </div>
        )) : (
          <p className={styles.muted}>{tr(locale, "No optional package supplements configured yet.", "Todavía no hay suplementos opcionales configurados.")}</p>
        )}

        <div className={styles.notice}>
          {tr(
            locale,
            "Mandatory costs belong in the base trip fare. These supplements are always explicit customer choices and do not own inventory.",
            "Los costes obligatorios deben formar parte de la tarifa base del viaje. Estos suplementos son siempre elecciones explícitas del cliente y no gestionan inventario propio."
          )}
        </div>

        <div className={styles.actionsCompact}>
          <button className="button button-secondary" type="button" onClick={addRow} disabled={rows.length >= 20}>
            {tr(locale, "+ Add supplement", "+ Añadir suplemento")}
          </button>
          <span className={styles.muted}>{rows.length}/20</span>
          <button className="button button-primary" type="submit">{tr(locale, "Save package supplements", "Guardar suplementos")}</button>
        </div>
      </form>
    </section>
  );
}
