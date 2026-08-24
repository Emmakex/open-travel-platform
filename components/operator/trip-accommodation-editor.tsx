"use client";

import { useState } from "react";
import { saveTripAccommodationsAction } from "@/app/operator/catalogue/trips/accommodation-actions";
import styles from "@/app/operator/operator.module.css";
import type { Accommodation } from "@/domain/accommodation/types";
import type { TravelLocale, Trip, TripAccommodationComponent } from "@/domain/travel/types";
import { tr } from "@/lib/operator-i18n";

type EditableComponent = TripAccommodationComponent & { key: string };

function money(value: number, currency: string, locale: TravelLocale) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", { style: "currency", currency }).format(value);
}

export function TripAccommodationEditor({ trip, accommodations, locale, updated, error }: {
  trip: Trip;
  accommodations: Accommodation[];
  locale: TravelLocale;
  updated?: boolean;
  error?: string;
}) {
  const [items, setItems] = useState<EditableComponent[]>(() => (trip.accommodations ?? []).map((item) => ({ ...item, key: item.id })));

  function add() {
    const accommodation = accommodations[0];
    const room = accommodation?.roomTypes[0];
    if (!accommodation || !room) return;
    const id = `trip-stay-${crypto.randomUUID()}`;
    setItems((current) => [...current, {
      id,
      key: id,
      accommodationId: accommodation.id,
      roomTypeId: room.id,
      checkInDay: 1,
      nights: Math.max(1, trip.durationDays - 1),
      mode: "included"
    }]);
  }

  function update(id: string, patch: Partial<TripAccommodationComponent>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function selectAccommodation(id: string, accommodationId: string) {
    const accommodation = accommodations.find((item) => item.id === accommodationId);
    update(id, { accommodationId, roomTypeId: accommodation?.roomTypes[0]?.id ?? "" });
  }

  return (
    <section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Trip accommodation", "Alojamiento del viaje")}</div>
      <h2>{tr(locale, "Linked stays", "Estancias vinculadas")}</h2>
      <p className={styles.lead}>{tr(
        locale,
        "Link reusable accommodation and room types to this trip. The hotel keeps its own inventory and can be reused by other trips.",
        "Vincula alojamientos y habitaciones reutilizables a este viaje. El hotel mantiene su propio inventario y puede utilizarse en otros viajes."
      )}</p>
      {updated ? <div className={styles.notice}>{tr(locale, "Trip accommodation saved.", "Alojamiento del viaje guardado.")}</div> : null}
      {error ? <div className={styles.notice}>{tr(locale, "Review the hotel, room, check-in day and number of nights.", "Revisa el hotel, la habitación, el día de entrada y el número de noches.")}</div> : null}

      {!accommodations.length ? (
        <div className={styles.notice}>{tr(locale, "Create an accommodation with at least one room type before linking it to a trip.", "Crea un alojamiento con al menos un tipo de habitación antes de vincularlo a un viaje.")}</div>
      ) : (
        <form action={saveTripAccommodationsAction} className={styles.editorForm}>
          <input type="hidden" name="tripId" value={trip.id} />
          <div className={styles.managementList}>
            {items.map((item, index) => {
              const accommodation = accommodations.find((candidate) => candidate.id === item.accommodationId);
              const room = accommodation?.roomTypes.find((candidate) => candidate.id === item.roomTypeId);
              const referenceTotal = room?.baseNightlyRate !== undefined ? room.baseNightlyRate * item.nights : undefined;
              return (
                <div className={styles.editorSection} key={item.key}>
                  <input type="hidden" name="tripAccommodationId" value={item.id} />
                  <div className={styles.sectionHeader}>
                    <strong>{tr(locale, "Stay", "Estancia")} {index + 1}</strong>
                    <button type="button" className="button button-secondary" onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))}>{tr(locale, "Remove", "Quitar")}</button>
                  </div>
                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>{tr(locale, "Accommodation", "Alojamiento")}</span>
                      <select name={`tripAccommodationProperty:${item.id}`} value={item.accommodationId} onChange={(event) => selectAccommodation(item.id, event.target.value)}>
                        {accommodations.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.name} · {candidate.location}</option>)}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Room", "Habitación")}</span>
                      <select name={`tripAccommodationRoom:${item.id}`} value={item.roomTypeId} onChange={(event) => update(item.id, { roomTypeId: event.target.value })}>
                        {(accommodation?.roomTypes ?? []).map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Check-in on trip day", "Entrada en el día del viaje")}</span>
                      <input type="number" min="1" max={trip.durationDays} step="1" name={`tripAccommodationCheckInDay:${item.id}`} value={item.checkInDay} onChange={(event) => update(item.id, { checkInDay: Number(event.target.value) })} />
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Nights", "Noches")}</span>
                      <input type="number" min="1" max={Math.max(1, trip.durationDays - item.checkInDay)} step="1" name={`tripAccommodationNights:${item.id}`} value={item.nights} onChange={(event) => update(item.id, { nights: Number(event.target.value) })} />
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Package role", "Uso en el paquete")}</span>
                      <select name={`tripAccommodationMode:${item.id}`} value={item.mode} onChange={(event) => update(item.id, { mode: event.target.value === "optional" ? "optional" : "included" })}>
                        <option value="included">{tr(locale, "Included stay", "Estancia incluida")}</option>
                        <option value="optional">{tr(locale, "Optional accommodation", "Alojamiento opcional")}</option>
                      </select>
                    </label>
                  </div>
                  {room ? (
                    <div className={styles.notice}>
                      {room.baseNightlyRate !== undefined
                        ? tr(locale, `Reference: ${money(room.baseNightlyRate, accommodation?.currency ?? trip.currency, locale)} per room/night · ${money(referenceTotal ?? 0, accommodation?.currency ?? trip.currency, locale)} for ${item.nights} night(s).`, `Referencia: ${money(room.baseNightlyRate, accommodation?.currency ?? trip.currency, locale)} por habitación/noche · ${money(referenceTotal ?? 0, accommodation?.currency ?? trip.currency, locale)} para ${item.nights} noche(s).`)
                        : tr(locale, "This room does not have a base nightly rate yet.", "Esta habitación todavía no tiene una tarifa base por noche.")}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className={styles.actionsCompact}>
            <button className="button button-secondary" type="button" onClick={add}>{tr(locale, "+ Add stay", "+ Añadir estancia")}</button>
            <button className="button button-primary" type="submit">{tr(locale, "Save trip accommodation", "Guardar alojamiento del viaje")}</button>
          </div>
        </form>
      )}
    </section>
  );
}
