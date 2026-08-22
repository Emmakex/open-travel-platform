"use client";

import { useMemo, useState } from "react";
import styles from "@/app/operator/operator.module.css";
import type { TravellerPricingBand, TravelLocale } from "@/domain/travel/types";
import { defaultTravellerPricingBands } from "@/lib/traveller-pricing";
import { tr } from "@/lib/operator-i18n";

type EditableBand = TravellerPricingBand & { key: string };

function editable(band: TravellerPricingBand): EditableBand {
  return { ...band, key: `pricing-${band.id}` };
}

function newBand(items: EditableBand[]): EditableBand {
  const last = [...items].sort((a, b) => a.minAge - b.minAge).at(-1);
  const nextMin = last?.maxAge !== undefined ? last.maxAge + 1 : 0;
  const id = crypto.randomUUID();
  return {
    id,
    key: `pricing-${id}`,
    code: "custom",
    label: "Traveller",
    labelEs: "Viajero",
    minAge: nextMin,
    maxAge: undefined,
    price: last?.price ?? 0,
    consumesInventory: true
  };
}

export function TravellerPricingEditor({
  bands,
  fromPrice,
  locale
}: {
  bands?: TravellerPricingBand[];
  fromPrice: number;
  locale: TravelLocale;
}) {
  const initial = useMemo(
    () => (bands?.length ? bands : defaultTravellerPricingBands(fromPrice)).map(editable),
    [bands, fromPrice]
  );
  const [items, setItems] = useState<EditableBand[]>(initial);

  function update(index: number, patch: Partial<TravellerPricingBand>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function remove(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function add() {
    setItems((current) => [...current, newBand(current)]);
  }

  return (
    <div className={styles.editorSection}>
      <div className={styles.sectionHeaderCompact}>
        <div>
          <div className="eyebrow">{tr(locale, "Traveller pricing", "Precios por viajero")}</div>
          <p className={styles.muted}>
            {tr(
              locale,
              "Define contiguous age bands. The traveller age is calculated on the departure date and the server applies the matching price.",
              "Define bandas de edad continuas. La edad se calcula en la fecha de salida y el servidor aplica el precio correspondiente."
            )}
          </p>
        </div>
        <button className="button button-secondary" type="button" onClick={add}>
          {tr(locale, "+ Add age band", "+ Añadir banda de edad")}
        </button>
      </div>

      <div className={styles.notice}>
        {tr(
          locale,
          "Bands must start at age 0, have no gaps/overlaps and the final band must have no maximum age. Existing trips default to the old price for every age until you save explicit values.",
          "Las bandas deben empezar en 0 años, no pueden tener huecos ni solaparse y la última debe quedar sin edad máxima. Los viajes existentes mantienen por defecto el precio anterior para todas las edades hasta que guardes valores explícitos."
        )}
      </div>

      <div className={styles.repeatList}>
        {items.map((item, index) => (
          <div className={styles.panel} key={item.key} style={{ padding: "1rem" }}>
            <input type="hidden" name="pricingBandId" value={item.id} />
            <input type="hidden" name={`pricingConsumesInventory:${item.id}`} value={item.consumesInventory ? "1" : "0"} />
            <div className={styles.sectionHeaderCompact}>
              <div>
                <strong>{item.label || tr(locale, "Traveller band", "Banda de viajero")}</strong>
                <p className={styles.muted} style={{ margin: ".25rem 0 0" }}>
                  {item.maxAge === undefined ? `${item.minAge}+` : `${item.minAge}–${item.maxAge}`} {tr(locale, "years", "años")}
                </p>
              </div>
              {items.length > 1 ? (
                <button type="button" className={styles.textButtonDanger} onClick={() => remove(index)}>
                  {tr(locale, "Remove", "Eliminar")}
                </button>
              ) : null}
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>{tr(locale, "Internal code *", "Código interno *")}</span>
                <input name={`pricingCode:${item.id}`} value={item.code} onChange={(event) => update(index, { code: event.target.value })} required />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Label (EN) *", "Etiqueta (EN) *")}</span>
                <input name={`pricingLabel:${item.id}`} value={item.label} onChange={(event) => update(index, { label: event.target.value })} required />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Label (ES)", "Etiqueta (ES)")}</span>
                <input name={`pricingLabelEs:${item.id}`} value={item.labelEs ?? ""} onChange={(event) => update(index, { labelEs: event.target.value || undefined })} />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Minimum age *", "Edad mínima *")}</span>
                <input type="number" min="0" max="120" step="1" name={`pricingMinAge:${item.id}`} value={item.minAge} onChange={(event) => update(index, { minAge: Number(event.target.value) })} required />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Maximum age", "Edad máxima")}</span>
                <input type="number" min={item.minAge} max="120" step="1" name={`pricingMaxAge:${item.id}`} value={item.maxAge ?? ""} onChange={(event) => update(index, { maxAge: event.target.value === "" ? undefined : Number(event.target.value) })} placeholder={tr(locale, "No limit", "Sin límite")} />
              </label>
              <label className={styles.field}>
                <span>{tr(locale, "Base price *", "Precio base *")}</span>
                <input type="number" min="0" step="0.01" name={`pricingPrice:${item.id}`} value={item.price} onChange={(event) => update(index, { price: Number(event.target.value) })} required />
              </label>
            </div>

            <label className={styles.checkboxField}>
              <input type="checkbox" checked={item.consumesInventory} onChange={(event) => update(index, { consumesInventory: event.target.checked })} />
              <span>{tr(locale, "Consumes one trip inventory space", "Consume una plaza del cupo del viaje")}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
