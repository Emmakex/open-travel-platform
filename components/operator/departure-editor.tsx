"use client";

import { useState } from "react";
import styles from "@/app/operator/operator.module.css";
import departureStyles from "@/components/operator/departure-editor.module.css";
import type { TripDeparture } from "@/domain/booking/types";
import type { TravelLocale } from "@/domain/travel/types";
import { departureStatusLabel, tr } from "@/lib/operator-i18n";

type EditableDeparture = TripDeparture & { key: string };

function blankDeparture(): EditableDeparture {
  return { id: crypto.randomUUID(), tripId: "", departureDate: "", returnDate: "", capacity: 12, reservedSpaces: 0, status: "open", key: `new-${crypto.randomUUID()}` };
}

export function DepartureEditor({ departures = [], locale }: { departures?: TripDeparture[]; locale: TravelLocale }) {
  const [items, setItems] = useState<EditableDeparture[]>(() => departures.map((item) => ({ ...item, key: `departure-${item.id}` })));
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

  return (
    <div className={styles.editorSection}>
      <div className={styles.sectionHeaderCompact}>
        <div>
          <div className="eyebrow">{tr(locale, "Departures & availability", "Salidas y disponibilidad")}</div>
          <p className={styles.muted}>{tr(locale, "Manage departure dates, capacity, status and optional departure-specific pricing. Reserved spaces update automatically with reservations.", "Gestiona fechas de salida, cupos, estado y precios específicos por salida. Las plazas reservadas se actualizan automáticamente con las reservas.")}</p>
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
                  <label className={styles.field}><span>{tr(locale, "Departure date *", "Fecha de salida *")}</span><input name="departureDate" type="date" value={item.departureDate} onChange={(event) => update(index, { departureDate: event.target.value })} required /></label>
                  <label className={styles.field}><span>{tr(locale, "Return date *", "Fecha de regreso *")}</span><input name="returnDate" type="date" value={item.returnDate} onChange={(event) => update(index, { returnDate: event.target.value })} required /></label>
                  <label className={styles.field}><span>{tr(locale, "Capacity *", "Cupo total *")}</span><input name="departureCapacity" type="number" min={Math.max(1, item.reservedSpaces)} step="1" value={item.capacity} onChange={(event) => update(index, { capacity: Number(event.target.value) })} required /></label>
                  <label className={styles.field}><span>{tr(locale, "Reserved spaces", "Plazas reservadas")}</span><input name="departureReserved" type="number" value={item.reservedSpaces} readOnly aria-readonly="true" /></label>
                  <label className={styles.field}><span>{tr(locale, "Price per traveller", "Precio por viajero")}</span><input name="departurePrice" type="number" min="0" step="0.01" value={item.unitPrice ?? ""} onChange={(event) => update(index, { unitPrice: event.target.value === "" ? undefined : Number(event.target.value) })} placeholder={tr(locale, "Use trip starting price", "Usar precio base del viaje")} /></label>
                  <label className={styles.field}>
                    <span>{tr(locale, "Status", "Estado")}</span>
                    <select name="departureStatus" value={item.status} onChange={(event) => update(index, { status: event.target.value as TripDeparture["status"] })}>
                      {(["open", "closed", "sold-out"] as const).map((status) => <option value={status} key={status}>{departureStatusLabel(status, locale)}</option>)}
                    </select>
                  </label>
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
