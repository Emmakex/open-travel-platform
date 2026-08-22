"use client";

import { useState } from "react";
import styles from "@/app/operator/operator.module.css";
import departureStyles from "@/components/operator/departure-editor.module.css";
import type { TripDeparture } from "@/domain/booking/types";
import type { TravellerPricingBand, TravelLocale } from "@/domain/travel/types";
import { departureStatusLabel, tr } from "@/lib/operator-i18n";

type EditableDeparture = TripDeparture & { key: string };

function blankDeparture(): EditableDeparture {
  return {
    id: crypto.randomUUID(),
    tripId: "",
    departureDate: "",
    returnDate: "",
    capacity: 12,
    reservedSpaces: 0,
    status: "open",
    travellerPrices: {},
    key: `new-${crypto.randomUUID()}`
  };
}

export function DepartureEditor({
  departures = [],
  pricingBands,
  legacySinglePrice = false,
  locale
}: {
  departures?: TripDeparture[];
  pricingBands: TravellerPricingBand[];
  legacySinglePrice?: boolean;
  locale: TravelLocale;
}) {
  const [items, setItems] = useState<EditableDeparture[]>(() =>
    departures.map((item) => ({ ...item, travellerPrices: { ...(item.travellerPrices ?? {}) }, key: `departure-${item.id}` }))
  );
  const add = () => setItems((current) => [...current, blankDeparture()]);
  const remove = (index: number) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));

  function move(index: number, direction: -1 | 1) {
    setItems((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function update(index: number, patch: Partial<TripDeparture>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function visibleTravellerPrice(item: EditableDeparture, band: TravellerPricingBand) {
    const specific = item.travellerPrices?.[band.id];
    if (specific !== undefined) return specific;
    if (legacySinglePrice && item.unitPrice !== undefined) return item.unitPrice;
    if (band.code === "adult" && item.unitPrice !== undefined) return item.unitPrice;
    return "";
  }

  function updateTravellerPrice(index: number, bandId: string, rawValue: string) {
    setItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const next = { ...(item.travellerPrices ?? {}) };
      if (rawValue === "") delete next[bandId];
      else next[bandId] = Number(rawValue);
      return { ...item, travellerPrices: next };
    }));
  }

  return (
    <div className={styles.editorSection}>
      <div className={styles.sectionHeaderCompact}>
        <div>
          <div className="eyebrow">{tr(locale, "Departures & availability", "Salidas y disponibilidad")}</div>
          <p className={styles.muted}>
            {tr(
              locale,
              "Manage dates, inventory and optional price overrides for each traveller age band. Reserved spaces update automatically with reservations.",
              "Gestiona fechas, cupos y precios opcionales por cada banda de edad. Las plazas reservadas se actualizan automáticamente con las reservas."
            )}
          </p>
        </div>
        <button className="button button-secondary" type="button" onClick={add}>{tr(locale, "+ Add departure", "+ Añadir salida")}</button>
      </div>

      {items.length ? (
        <div className={styles.repeatList}>
          {items.map((item, index) => {
            const remaining = Math.max(0, item.capacity - item.reservedSpaces);
            return (
              <div className={departureStyles.card} key={item.key}>
                <div className={departureStyles.header}>
                  <div>
                    <strong>{tr(locale, "Departure", "Salida")} {index + 1}</strong>
                    <span>{remaining} {tr(locale, "of", "de")} {item.capacity} {tr(locale, "spaces available", "plazas disponibles")} · {item.reservedSpaces} {tr(locale, "reserved", "reservadas")}</span>
                  </div>
                  <div className={styles.reorderActions}>
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={tr(locale, "Move departure up", "Mover salida arriba")}>↑</button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={tr(locale, "Move departure down", "Mover salida abajo")}>↓</button>
                    <button type="button" className={styles.textButtonDanger} onClick={() => remove(index)}>{tr(locale, "Remove", "Eliminar")}</button>
                  </div>
                </div>
                <input type="hidden" name="departureId" value={item.id} />
                <div className={departureStyles.grid}>
                  <label className={styles.field}><span>{tr(locale, "Departure date *", "Fecha de salida *")}</span><input name={`departureDate__${item.id}`} type="date" value={item.departureDate} onChange={(event) => update(index, { departureDate: event.target.value })} required /></label>
                  <label className={styles.field}><span>{tr(locale, "Return date *", "Fecha de regreso *")}</span><input name={`returnDate__${item.id}`} type="date" value={item.returnDate} onChange={(event) => update(index, { returnDate: event.target.value })} required /></label>
                  <label className={styles.field}><span>{tr(locale, "Capacity *", "Cupo total *")}</span><input name={`departureCapacity__${item.id}`} type="number" min={Math.max(1, item.reservedSpaces)} step="1" value={item.capacity} onChange={(event) => update(index, { capacity: Number(event.target.value) })} required /></label>
                  <label className={styles.field}><span>{tr(locale, "Reserved spaces", "Plazas reservadas")}</span><input name={`departureReserved__${item.id}`} type="number" value={item.reservedSpaces} readOnly aria-readonly="true" /></label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Status", "Estado")}</span>
                    <select name={`departureStatus__${item.id}`} value={item.status} onChange={(event) => update(index, { status: event.target.value as TripDeparture["status"] })}>
                      {(["open", "closed", "sold-out"] as const).map((status) => <option value={status} key={status}>{departureStatusLabel(status, locale)}</option>)}
                    </select>
                  </label>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <strong>{tr(locale, "Traveller price overrides", "Precios por viajero para esta salida")}</strong>
                  <p className={styles.muted} style={{ margin: ".35rem 0 .75rem" }}>
                    {tr(locale, "Leave a value empty to use the base price configured in Traveller pricing.", "Deja un valor vacío para usar el precio base configurado en Precios por viajero.")}
                  </p>
                  <div className={departureStyles.grid}>
                    {pricingBands.map((band) => (
                      <label className={styles.field} key={band.id}>
                        <span>{locale === "es" ? (band.labelEs || band.label) : band.label} · {band.minAge}{band.maxAge === undefined ? "+" : `–${band.maxAge}`}</span>
                        <input
                          name={`departureTravellerPrice__${item.id}__${band.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={visibleTravellerPrice(item, band)}
                          onChange={(event) => updateTravellerPrice(index, band.id, event.target.value)}
                          placeholder={String(band.price)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyEditorState}>
          <strong>{tr(locale, "No departures yet", "Todavía no hay salidas")}</strong>
          <span>{tr(locale, "Add a departure to make availability visible on the booking page.", "Añade una salida para mostrar disponibilidad en la página de reserva.")}</span>
          <button className="button button-secondary" type="button" onClick={add}>{tr(locale, "+ Add first departure", "+ Añadir primera salida")}</button>
        </div>
      )}
    </div>
  );
}
