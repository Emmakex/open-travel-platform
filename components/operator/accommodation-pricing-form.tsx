"use client";

import { useState } from "react";
import { saveAccommodationPricingAction } from "@/app/operator/catalogue/accommodations/pricing-actions";
import styles from "@/app/operator/operator.module.css";
import type {
  Accommodation,
  AccommodationAdjustmentDirection,
  AccommodationAdjustmentMode,
  AccommodationOccupancyPricingKind,
  AccommodationOccupancyPricingRule,
  AccommodationSeasonalPricingRule
} from "@/domain/accommodation/types";
import type { TravelLocale } from "@/domain/travel/types";
import { tr } from "@/lib/operator-i18n";

type SeasonalEditorRule = AccommodationSeasonalPricingRule & { key: string };
type OccupancyEditorRule = AccommodationOccupancyPricingRule & { key: string };

const seasonalModes: AccommodationAdjustmentMode[] = ["fixed-per-room-night", "percent-of-room"];
const occupancyModes: AccommodationAdjustmentMode[] = ["fixed-per-room-night", "percent-of-room", "fixed-per-child-night", "percent-per-child"];
const occupancyKinds: AccommodationOccupancyPricingKind[] = ["single-supplement", "triple-discount", "child-sharing-discount", "custom"];

function directionLabel(direction: AccommodationAdjustmentDirection, locale: TravelLocale) {
  return direction === "discount" ? tr(locale, "Discount", "Descuento") : tr(locale, "Surcharge", "Suplemento");
}

function modeLabel(mode: AccommodationAdjustmentMode, locale: TravelLocale) {
  const labels: Record<AccommodationAdjustmentMode, [string, string]> = {
    "fixed-per-room-night": ["Fixed amount / room / night", "Importe fijo / habitación / noche"],
    "percent-of-room": ["% of room stay", "% de la estancia"],
    "fixed-per-child-night": ["Fixed amount / child / night", "Importe fijo / niño / noche"],
    "percent-per-child": ["% of proportional child share", "% de la parte proporcional del niño"]
  };
  return locale === "es" ? labels[mode][1] : labels[mode][0];
}

function kindLabel(kind: AccommodationOccupancyPricingKind, locale: TravelLocale) {
  const labels: Record<AccommodationOccupancyPricingKind, [string, string]> = {
    "single-supplement": ["Single supplement", "Suplemento individual"],
    "triple-discount": ["Triple occupancy discount", "Descuento ocupación triple"],
    "child-sharing-discount": ["Child sharing discount", "Descuento niño compartiendo"],
    custom: ["Custom occupancy rule", "Regla de ocupación personalizada"]
  };
  return locale === "es" ? labels[kind][1] : labels[kind][0];
}

export function AccommodationPricingForm({ accommodation, locale, updated, error }: {
  accommodation: Accommodation;
  locale: TravelLocale;
  updated?: boolean;
  error?: string;
}) {
  const [seasonal, setSeasonal] = useState<SeasonalEditorRule[]>(() =>
    (accommodation.seasonalPricing ?? []).map((rule) => ({ ...rule, key: rule.id }))
  );
  const [occupancy, setOccupancy] = useState<OccupancyEditorRule[]>(() =>
    (accommodation.occupancyPricing ?? []).map((rule) => ({ ...rule, key: rule.id }))
  );

  function addSeason() {
    const id = `season-${crypto.randomUUID()}`;
    setSeasonal((current) => [...current, {
      id,
      key: id,
      label: "",
      startDate: "",
      endDate: "",
      direction: "surcharge",
      mode: "percent-of-room",
      value: 0
    }]);
  }

  function addOccupancyRule() {
    const id = `occupancy-${crypto.randomUUID()}`;
    setOccupancy((current) => [...current, {
      id,
      key: id,
      label: "",
      kind: "custom",
      direction: "surcharge",
      mode: "fixed-per-room-night",
      value: 0
    }]);
  }

  function updateSeason(id: string, patch: Partial<AccommodationSeasonalPricingRule>) {
    setSeasonal((current) => current.map((rule) => rule.id === id ? { ...rule, ...patch } : rule));
  }

  function updateOccupancy(id: string, patch: Partial<AccommodationOccupancyPricingRule>) {
    setOccupancy((current) => current.map((rule) => rule.id === id ? { ...rule, ...patch } : rule));
  }

  return (
    <section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Accommodation pricing", "Pricing de alojamiento")}</div>
      <h2>{tr(locale, "Seasons and occupancy adjustments", "Temporadas y ajustes por ocupación")}</h2>
      <p className={styles.lead}>{tr(
        locale,
        "Build reusable pricing rules on the accommodation. Matching rules can stack, so a seasonal surcharge and an occupancy discount can both apply to the same stay.",
        "Crea reglas de precio reutilizables en el alojamiento. Las reglas que coincidan pueden acumularse, por ejemplo una temporada alta y un descuento por ocupación en la misma estancia."
      )}</p>
      {updated ? <div className={styles.notice}>{tr(locale, "Accommodation pricing rules saved.", "Reglas de precio del alojamiento guardadas.")}</div> : null}
      {error ? <div className={styles.notice}>{tr(locale, "Review dates, room selection, occupancy limits and adjustment values.", "Revisa fechas, habitación, límites de ocupación y valores de los ajustes.")}</div> : null}

      <form action={saveAccommodationPricingAction} className={styles.editorForm}>
        <input type="hidden" name="accommodationId" value={accommodation.id} />

        <div className={styles.editorSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h3>{tr(locale, "Seasonal pricing", "Tarifas por temporada")}</h3>
              <p className={styles.muted}>{tr(locale, "Apply a surcharge or discount to every night whose date falls inside the configured range.", "Aplica un suplemento o descuento a cada noche cuya fecha esté dentro del periodo configurado.")}</p>
            </div>
            <button className="button button-secondary" type="button" onClick={addSeason}>{tr(locale, "+ Season", "+ Temporada")}</button>
          </div>

          {seasonal.length ? <div className={styles.managementList}>{seasonal.map((rule, index) => {
            const roomSelection = rule.roomTypeIds?.[0] ?? "*";
            return (
              <div className={styles.editorSection} key={rule.key}>
                <input type="hidden" name="seasonalRuleId" value={rule.id} />
                <div className={styles.sectionHeader}>
                  <strong>{tr(locale, "Season", "Temporada")} {index + 1}</strong>
                  <button type="button" className="button button-secondary" onClick={() => setSeasonal((current) => current.filter((item) => item.id !== rule.id))}>{tr(locale, "Remove", "Quitar")}</button>
                </div>
                <div className={styles.formGrid}>
                  <label className={styles.field}><span>{tr(locale, "Label", "Nombre")}</span><input name={`seasonalLabel:${rule.id}`} value={rule.label} onChange={(event) => updateSeason(rule.id, { label: event.target.value })} placeholder={tr(locale, "High season", "Temporada alta")} required /></label>
                  <label className={styles.field}><span>{tr(locale, "Room", "Habitación")}</span><select name={`seasonalRoom:${rule.id}`} value={roomSelection} onChange={(event) => updateSeason(rule.id, { roomTypeIds: event.target.value === "*" ? undefined : [event.target.value] })}><option value="*">{tr(locale, "All room types", "Todas las habitaciones")}</option>{accommodation.roomTypes.map((room) => <option value={room.id} key={room.id}>{room.name}</option>)}</select></label>
                  <label className={styles.field}><span>{tr(locale, "Start", "Inicio")}</span><input type="date" name={`seasonalStart:${rule.id}`} value={rule.startDate} onChange={(event) => updateSeason(rule.id, { startDate: event.target.value })} required /></label>
                  <label className={styles.field}><span>{tr(locale, "End", "Fin")}</span><input type="date" name={`seasonalEnd:${rule.id}`} value={rule.endDate} onChange={(event) => updateSeason(rule.id, { endDate: event.target.value })} required /></label>
                  <label className={styles.field}><span>{tr(locale, "Effect", "Efecto")}</span><select name={`seasonalDirection:${rule.id}`} value={rule.direction} onChange={(event) => updateSeason(rule.id, { direction: event.target.value as AccommodationAdjustmentDirection })}><option value="surcharge">{directionLabel("surcharge", locale)}</option><option value="discount">{directionLabel("discount", locale)}</option></select></label>
                  <label className={styles.field}><span>{tr(locale, "Calculation", "Cálculo")}</span><select name={`seasonalMode:${rule.id}`} value={rule.mode} onChange={(event) => updateSeason(rule.id, { mode: event.target.value as AccommodationSeasonalPricingRule["mode"] })}>{seasonalModes.map((mode) => <option value={mode} key={mode}>{modeLabel(mode, locale)}</option>)}</select></label>
                  <label className={styles.field}><span>{tr(locale, "Value", "Valor")}</span><input type="number" min="0" max={rule.mode === "percent-of-room" ? 100 : undefined} step="0.01" name={`seasonalValue:${rule.id}`} value={rule.value} onChange={(event) => updateSeason(rule.id, { value: Number(event.target.value) })} required /></label>
                </div>
              </div>
            );
          })}</div> : <div className={styles.notice}>{tr(locale, "No seasonal adjustments. Base nightly rates apply all year.", "Sin ajustes de temporada. Se aplican las tarifas base durante todo el año.")}</div>}
        </div>

        <div className={styles.editorSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h3>{tr(locale, "Occupancy pricing", "Pricing por ocupación")}</h3>
              <p className={styles.muted}>{tr(locale, "Configure single supplements, triple discounts, child-sharing reductions or custom occupancy rules.", "Configura suplemento individual, descuento triple, reducción por niño compartiendo o reglas personalizadas de ocupación.")}</p>
            </div>
            <button className="button button-secondary" type="button" onClick={addOccupancyRule}>{tr(locale, "+ Occupancy rule", "+ Regla de ocupación")}</button>
          </div>

          {occupancy.length ? <div className={styles.managementList}>{occupancy.map((rule, index) => (
            <div className={styles.editorSection} key={rule.key}>
              <input type="hidden" name="occupancyRuleId" value={rule.id} />
              <div className={styles.sectionHeader}>
                <strong>{tr(locale, "Occupancy rule", "Regla de ocupación")} {index + 1}</strong>
                <button type="button" className="button button-secondary" onClick={() => setOccupancy((current) => current.filter((item) => item.id !== rule.id))}>{tr(locale, "Remove", "Quitar")}</button>
              </div>
              <div className={styles.formGrid}>
                <label className={styles.field}><span>{tr(locale, "Label", "Nombre")}</span><input name={`occupancyLabel:${rule.id}`} value={rule.label} onChange={(event) => updateOccupancy(rule.id, { label: event.target.value })} placeholder={tr(locale, "Single supplement", "Suplemento individual")} required /></label>
                <label className={styles.field}><span>{tr(locale, "Rule type", "Tipo de regla")}</span><select name={`occupancyKind:${rule.id}`} value={rule.kind} onChange={(event) => updateOccupancy(rule.id, { kind: event.target.value as AccommodationOccupancyPricingKind })}>{occupancyKinds.map((kind) => <option value={kind} key={kind}>{kindLabel(kind, locale)}</option>)}</select></label>
                <label className={styles.field}><span>{tr(locale, "Room", "Habitación")}</span><select name={`occupancyRoom:${rule.id}`} value={rule.roomTypeId ?? "*"} onChange={(event) => updateOccupancy(rule.id, { roomTypeId: event.target.value === "*" ? undefined : event.target.value })}><option value="*">{tr(locale, "All room types", "Todas las habitaciones")}</option>{accommodation.roomTypes.map((room) => <option value={room.id} key={room.id}>{room.name}</option>)}</select></label>
                <label className={styles.field}><span>{tr(locale, "Effect", "Efecto")}</span><select name={`occupancyDirection:${rule.id}`} value={rule.direction} onChange={(event) => updateOccupancy(rule.id, { direction: event.target.value as AccommodationAdjustmentDirection })}><option value="surcharge">{directionLabel("surcharge", locale)}</option><option value="discount">{directionLabel("discount", locale)}</option></select></label>
                <label className={styles.field}><span>{tr(locale, "Calculation", "Cálculo")}</span><select name={`occupancyMode:${rule.id}`} value={rule.mode} onChange={(event) => updateOccupancy(rule.id, { mode: event.target.value as AccommodationAdjustmentMode })}>{occupancyModes.map((mode) => <option value={mode} key={mode}>{modeLabel(mode, locale)}</option>)}</select></label>
                <label className={styles.field}><span>{tr(locale, "Value", "Valor")}</span><input type="number" min="0" max={rule.mode === "percent-of-room" || rule.mode === "percent-per-child" ? 100 : undefined} step="0.01" name={`occupancyValue:${rule.id}`} value={rule.value} onChange={(event) => updateOccupancy(rule.id, { value: Number(event.target.value) })} required /></label>
                <label className={styles.field}><span>{tr(locale, "Min adults", "Adultos mín.")}</span><input type="number" min="0" step="1" name={`occupancyMinAdults:${rule.id}`} value={rule.minAdults ?? ""} onChange={(event) => updateOccupancy(rule.id, { minAdults: event.target.value === "" ? undefined : Number(event.target.value) })} /></label>
                <label className={styles.field}><span>{tr(locale, "Max adults", "Adultos máx.")}</span><input type="number" min="0" step="1" name={`occupancyMaxAdults:${rule.id}`} value={rule.maxAdults ?? ""} onChange={(event) => updateOccupancy(rule.id, { maxAdults: event.target.value === "" ? undefined : Number(event.target.value) })} /></label>
                <label className={styles.field}><span>{tr(locale, "Min children", "Niños mín.")}</span><input type="number" min="0" step="1" name={`occupancyMinChildren:${rule.id}`} value={rule.minChildren ?? ""} onChange={(event) => updateOccupancy(rule.id, { minChildren: event.target.value === "" ? undefined : Number(event.target.value) })} /></label>
                <label className={styles.field}><span>{tr(locale, "Max children", "Niños máx.")}</span><input type="number" min="0" step="1" name={`occupancyMaxChildren:${rule.id}`} value={rule.maxChildren ?? ""} onChange={(event) => updateOccupancy(rule.id, { maxChildren: event.target.value === "" ? undefined : Number(event.target.value) })} /></label>
                <label className={styles.field}><span>{tr(locale, "Child age from", "Edad niño desde")}</span><input type="number" min="0" max="17" step="1" name={`occupancyMinChildAge:${rule.id}`} value={rule.minChildAge ?? ""} onChange={(event) => updateOccupancy(rule.id, { minChildAge: event.target.value === "" ? undefined : Number(event.target.value) })} /></label>
                <label className={styles.field}><span>{tr(locale, "Child age to", "Edad niño hasta")}</span><input type="number" min="0" max="17" step="1" name={`occupancyMaxChildAge:${rule.id}`} value={rule.maxChildAge ?? ""} onChange={(event) => updateOccupancy(rule.id, { maxChildAge: event.target.value === "" ? undefined : Number(event.target.value) })} /></label>
              </div>
            </div>
          ))}</div> : <div className={styles.notice}>{tr(locale, "No occupancy price adjustments configured.", "No hay ajustes de precio por ocupación configurados.")}</div>}
        </div>

        <div className={styles.notice}>{tr(
          locale,
          "Pricing rules are reusable. Booking-time room allocation will later apply these same server-side calculations using the travellers' real occupancy.",
          "Las reglas son reutilizables. La asignación de habitaciones en la reserva aplicará más adelante estos mismos cálculos del servidor usando la ocupación real de los viajeros."
        )}</div>
        <div className={styles.actionsCompact}>
          <button className="button button-primary" type="submit">{tr(locale, "Save accommodation pricing", "Guardar pricing de alojamiento")}</button>
        </div>
      </form>
    </section>
  );
}
