"use client";

import { useRef, useState } from "react";
import styles from "@/app/operator/operator.module.css";
import type { TravelLocale, TripAddOn } from "@/domain/travel/types";
import { tr } from "@/lib/operator-i18n";

type EditableAddOn = TripAddOn;

export function TripAddOnEditor({ addOns = [], locale }: { addOns?: TripAddOn[]; locale: TravelLocale }) {
  const nextId = useRef(1);
  const [rows, setRows] = useState<EditableAddOn[]>(addOns);

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
    <div className={styles.editorSection}>
      <div>
        <div className="eyebrow">{tr(locale, "Optional package supplements", "Suplementos opcionales del paquete")}</div>
        <p className={styles.muted}>
          {tr(
            locale,
            "Use these for non-inventory upgrades or supplements sold inside the trip booking. Capacity-based activities, transfers and dated services should remain independent services.",
            "Úsalos para mejoras o suplementos sin inventario propio vendidos dentro de la reserva del viaje. Las actividades, traslados y servicios con fecha o cupo deben seguir como servicios independientes."
          )}
        </p>
      </div>

      {rows.length ? rows.map((row, index) => (
        <div className={styles.editorSection} key={row.id}>
          <input type="hidden" name="tripAddOnId" value={row.id} />
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

          <div className={styles.actionsCompact}>
            <span className={styles.muted}>{tr(locale, `Supplement ${index + 1}`, `Suplemento ${index + 1}`)}</span>
            <button className="button button-secondary" type="button" onClick={() => removeRow(row.id)}>
              {tr(locale, "Remove", "Eliminar")}
            </button>
          </div>
        </div>
      )) : (
        <p className={styles.muted}>{tr(locale, "No optional package supplements configured yet.", "Todavía no hay suplementos opcionales configurados.")}</p>
      )}

      <div className={styles.actionsCompact}>
        <button className="button button-secondary" type="button" onClick={addRow} disabled={rows.length >= 20}>
          {tr(locale, "+ Add supplement", "+ Añadir suplemento")}
        </button>
        <span className={styles.muted}>{rows.length}/20</span>
      </div>
    </div>
  );
}
