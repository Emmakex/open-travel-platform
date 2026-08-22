"use client";

import { useState } from "react";
import styles from "@/app/operator/operator.module.css";
import departureStyles from "@/components/operator/departure-editor.module.css";
import type { TripDeparture } from "@/domain/booking/types";

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
    key: `new-${crypto.randomUUID()}`
  };
}

export function DepartureEditor({ departures = [] }: { departures?: TripDeparture[] }) {
  const [items, setItems] = useState<EditableDeparture[]>(() =>
    departures.map((item) => ({ ...item, key: `departure-${item.id}` }))
  );

  function add() {
    setItems((current) => [...current, blankDeparture()]);
  }

  function remove(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

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
          <div className="eyebrow">Departures & availability</div>
          <p className={styles.muted}>Manage real departure dates, inventory and optional departure-specific pricing. Remaining spaces are calculated from capacity minus reserved spaces.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={add}>+ Add departure</button>
      </div>

      {items.length ? (
        <div className={styles.repeatList}>
          {items.map((item, index) => {
            const remaining = Math.max(0, item.capacity - item.reservedSpaces);
            return (
              <div className={departureStyles.card} key={item.key}>
                <div className={departureStyles.header}>
                  <div>
                    <strong>Departure {index + 1}</strong>
                    <span>{remaining} of {item.capacity} spaces available</span>
                  </div>
                  <div className={styles.reorderActions}>
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move departure up">↑</button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Move departure down">↓</button>
                    <button type="button" className={styles.textButtonDanger} onClick={() => remove(index)}>Remove</button>
                  </div>
                </div>

                <input type="hidden" name="departureId" value={item.id} />
                <div className={departureStyles.grid}>
                  <label className={styles.field}>
                    <span>Departure date *</span>
                    <input name="departureDate" type="date" value={item.departureDate} onChange={(event) => update(index, { departureDate: event.target.value })} required />
                  </label>
                  <label className={styles.field}>
                    <span>Return date *</span>
                    <input name="returnDate" type="date" value={item.returnDate} onChange={(event) => update(index, { returnDate: event.target.value })} required />
                  </label>
                  <label className={styles.field}>
                    <span>Capacity *</span>
                    <input name="departureCapacity" type="number" min="1" step="1" value={item.capacity} onChange={(event) => update(index, { capacity: Number(event.target.value) })} required />
                  </label>
                  <label className={styles.field}>
                    <span>Reserved spaces</span>
                    <input name="departureReserved" type="number" min="0" step="1" max={Math.max(item.capacity, item.reservedSpaces)} value={item.reservedSpaces} onChange={(event) => update(index, { reservedSpaces: Number(event.target.value) })} />
                  </label>
                  <label className={styles.field}>
                    <span>Price per traveller</span>
                    <input name="departurePrice" type="number" min="0" step="0.01" value={item.unitPrice ?? ""} onChange={(event) => update(index, { unitPrice: event.target.value === "" ? undefined : Number(event.target.value) })} placeholder="Use trip starting price" />
                  </label>
                  <label className={styles.field}>
                    <span>Status</span>
                    <select name="departureStatus" value={item.status} onChange={(event) => update(index, { status: event.target.value as TripDeparture["status"] })}>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="sold-out">Sold out</option>
                    </select>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyEditorState}>
          <strong>No departures yet</strong>
          <span>Add a departure to make real availability visible on the booking page.</span>
          <button className="button button-secondary" type="button" onClick={add}>+ Add first departure</button>
        </div>
      )}
    </div>
  );
}
