"use client";

import { useState } from "react";
import { saveTripAccommodationsAction } from "@/app/operator/catalogue/trips/accommodation-actions";
import styles from "@/app/operator/operator.module.css";
import type { Accommodation } from "@/domain/accommodation/types";
import type { TripDeparture } from "@/domain/booking/types";
import type { TravelLocale, Trip, TripAccommodationComponent } from "@/domain/travel/types";
import { addIsoDays, calculateAccommodationStayPrice } from "@/lib/accommodation-pricing";
import { tr } from "@/lib/operator-i18n";

type EditableComponent = TripAccommodationComponent & {
  key: string;
  childAgeText: string;
};

function money(value: number, currency: string, locale: TravelLocale) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", { style: "currency", currency }).format(value);
}

function defaultAdults(accommodation: Accommodation | undefined, roomTypeId: string) {
  const room = accommodation?.roomTypes.find((item) => item.id === roomTypeId);
  if (!room) return 1;
  return Math.max(room.occupancy.minAdults, Math.min(2, room.occupancy.maxAdults));
}

function childAgesFromText(value: string) {
  if (!value.trim()) return [];
  const values = value.split(",").map((item) => item.trim()).filter(Boolean).map(Number);
  return values.every((age) => Number.isInteger(age) && age >= 0 && age <= 17) ? values : null;
}

export function TripAccommodationEditor({ trip, accommodations, departures, locale, updated, error }: {
  trip: Trip;
  accommodations: Accommodation[];
  departures: TripDeparture[];
  locale: TravelLocale;
  updated?: boolean;
  error?: string;
}) {
  const [items, setItems] = useState<EditableComponent[]>(() => (trip.accommodations ?? []).map((item) => ({
    ...item,
    pricingAdults: item.pricingAdults ?? defaultAdults(accommodations.find((accommodation) => accommodation.id === item.accommodationId), item.roomTypeId),
    pricingChildAges: item.pricingChildAges ?? [],
    childAgeText: (item.pricingChildAges ?? []).join(", "),
    key: item.id
  })));

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
      mode: "included",
      pricingAdults: defaultAdults(accommodation, room.id),
      pricingChildAges: [],
      childAgeText: ""
    }]);
  }

  function update(id: string, patch: Partial<EditableComponent>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function selectAccommodation(id: string, accommodationId: string) {
    const accommodation = accommodations.find((item) => item.id === accommodationId);
    const roomTypeId = accommodation?.roomTypes[0]?.id ?? "";
    update(id, {
      accommodationId,
      roomTypeId,
      pricingAdults: defaultAdults(accommodation, roomTypeId),
      pricingChildAges: [],
      childAgeText: ""
    });
  }

  function selectRoom(id: string, accommodation: Accommodation | undefined, roomTypeId: string) {
    update(id, {
      roomTypeId,
      pricingAdults: defaultAdults(accommodation, roomTypeId),
      pricingChildAges: [],
      childAgeText: ""
    });
  }

  return (
    <section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Trip accommodation", "Alojamiento del viaje")}</div>
      <h2>{tr(locale, "Linked stays and package pricing", "Estancias vinculadas y pricing del paquete")}</h2>
      <p className={styles.lead}>{tr(
        locale,
        "Link reusable accommodation to this trip and preview the real room cost for each departure using seasons and occupancy rules. The hotel keeps one shared inventory across every trip.",
        "Vincula alojamientos reutilizables al viaje y previsualiza el coste real de habitación por salida aplicando temporadas y reglas de ocupación. El hotel mantiene un único inventario compartido entre todos los viajes."
      )}</p>
      {updated ? <div className={styles.notice}>{tr(locale, "Trip accommodation saved.", "Alojamiento del viaje guardado.")}</div> : null}
      {error ? <div className={styles.notice}>{tr(locale, "Review hotel, room, nights and the reference occupancy. The occupancy must be valid for the selected room.", "Revisa hotel, habitación, noches y ocupación de referencia. La ocupación debe ser válida para la habitación seleccionada.")}</div> : null}

      {!accommodations.length ? (
        <div className={styles.notice}>{tr(locale, "Create an accommodation with at least one room type before linking it to a trip.", "Crea un alojamiento con al menos un tipo de habitación antes de vincularlo a un viaje.")}</div>
      ) : (
        <form action={saveTripAccommodationsAction} className={styles.editorForm}>
          <input type="hidden" name="tripId" value={trip.id} />
          <div className={styles.managementList}>
            {items.map((item, index) => {
              const accommodation = accommodations.find((candidate) => candidate.id === item.accommodationId);
              const room = accommodation?.roomTypes.find((candidate) => candidate.id === item.roomTypeId);
              const childAges = childAgesFromText(item.childAgeText);
              const previews = departures.slice(0, 5).map((departure) => {
                const checkInDate = addIsoDays(departure.departureDate, item.checkInDay - 1);
                const result = accommodation && checkInDate && childAges !== null
                  ? calculateAccommodationStayPrice({
                    accommodation,
                    roomTypeId: item.roomTypeId,
                    checkInDate,
                    nights: item.nights,
                    adults: item.pricingAdults ?? 1,
                    childAges
                  })
                  : null;
                return { departure, checkInDate, result };
              });

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
                      <select name={`tripAccommodationRoom:${item.id}`} value={item.roomTypeId} onChange={(event) => selectRoom(item.id, accommodation, event.target.value)}>
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
                    <label className={styles.field}>
                      <span>{tr(locale, "Reference adults", "Adultos de referencia")}</span>
                      <input type="number" min="1" max={room?.occupancy.maxAdults ?? 20} step="1" name={`tripAccommodationPricingAdults:${item.id}`} value={item.pricingAdults ?? 1} onChange={(event) => update(item.id, { pricingAdults: Number(event.target.value) })} />
                    </label>
                    <label className={styles.field}>
                      <span>{tr(locale, "Reference child ages", "Edades de niños de referencia")}</span>
                      <input name={`tripAccommodationPricingChildAges:${item.id}`} value={item.childAgeText} onChange={(event) => update(item.id, { childAgeText: event.target.value })} placeholder={tr(locale, "Example: 6, 10", "Ejemplo: 6, 10")} />
                    </label>
                  </div>

                  {room ? (
                    <div className={styles.notice}>
                      <strong>{tr(locale, "Departure pricing preview", "Previsión de precio por salida")}</strong>
                      {room.baseNightlyRate === undefined ? (
                        <p>{tr(locale, "This room does not have a base nightly rate yet.", "Esta habitación todavía no tiene una tarifa base por noche.")}</p>
                      ) : childAges === null ? (
                        <p>{tr(locale, "Enter child ages separated by commas.", "Introduce las edades de los niños separadas por comas.")}</p>
                      ) : previews.length ? (
                        <ul>
                          {previews.map(({ departure, checkInDate, result }) => (
                            <li key={departure.id}>
                              <strong>{departure.departureDate}</strong>{checkInDate ? ` · ${tr(locale, "check-in", "entrada")} ${checkInDate}` : ""}
                              {result ? (
                                <> · {money(result.total, result.currency, locale)} ({tr(locale, "base", "base")} {money(result.baseTotal, result.currency, locale)}{result.seasonalAdjustment ? ` · ${tr(locale, "season", "temporada")} ${money(result.seasonalAdjustment, result.currency, locale)}` : ""}{result.occupancyAdjustment ? ` · ${tr(locale, "occupancy", "ocupación")} ${money(result.occupancyAdjustment, result.currency, locale)}` : ""})</>
                              ) : ` · ${tr(locale, "occupancy or pricing rule needs review", "revisar ocupación o reglas de precio")}`}
                            </li>
                          ))}
                        </ul>
                      ) : <p>{tr(locale, "Create a departure to preview date-sensitive accommodation pricing.", "Crea una salida para previsualizar el precio del alojamiento según la fecha.")}</p>}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className={styles.notice}>{tr(
            locale,
            "Reference occupancy is used for package planning. A later booking step will calculate the same rules with the travellers' real room allocation before consuming room inventory.",
            "La ocupación de referencia se usa para planificar el paquete. Un paso posterior de reserva aplicará las mismas reglas con la distribución real de viajeros antes de consumir inventario de habitaciones."
          )}</div>
          <div className={styles.actionsCompact}>
            <button className="button button-secondary" type="button" onClick={add}>{tr(locale, "+ Add stay", "+ Añadir estancia")}</button>
            <button className="button button-primary" type="submit">{tr(locale, "Save trip accommodation", "Guardar alojamiento del viaje")}</button>
          </div>
        </form>
      )}
    </section>
  );
}
