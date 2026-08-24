"use client";

import { useMemo, useRef, useState } from "react";
import { createReservationAction } from "@/app/reservations/actions";
import styles from "@/app/trips/[slug]/book/booking.module.css";
import type { Accommodation } from "@/domain/accommodation/types";
import type { AvailabilityWindow, GuardianRelationship } from "@/domain/booking/types";
import type { TravellerPricingBand, TravelLocale, TripAccommodationComponent } from "@/domain/travel/types";
import {
  AccommodationBookingError,
  accommodationBookingTotals,
  buildAccommodationBookingPlan
} from "@/lib/accommodation-booking";
import {
  calculateAgeOnDate,
  findTravellerPricingBand,
  getTravellerBandPrice
} from "@/lib/traveller-pricing";

type TravellerRow = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  guardianTravellerId: string;
  guardianRelationship: GuardianRelationship | "";
};

function blankTraveller(id: string): TravellerRow {
  return {
    id,
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "",
    guardianTravellerId: "",
    guardianRelationship: ""
  };
}

function money(value: number, currency: string, locale: TravelLocale) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    style: "currency",
    currency
  }).format(value);
}

function date(value: string, locale: TravelLocale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}

export function TravellerBookingForm({
  tripSlug,
  fromPrice,
  currency,
  pricingBands,
  hasExplicitPricing,
  availability,
  locale,
  accommodationComponents = [],
  accommodations = []
}: {
  tripSlug: string;
  fromPrice: number;
  currency: string;
  pricingBands: TravellerPricingBand[];
  hasExplicitPricing: boolean;
  availability: AvailabilityWindow[];
  locale: TravelLocale;
  accommodationComponents?: TripAccommodationComponent[];
  accommodations?: Accommodation[];
}) {
  const t = (en: string, es: string) => locale === "es" ? es : en;
  const nextId = useRef(3);
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState(availability[0]?.id ?? "");
  const [selectedOptionalAccommodationIds, setSelectedOptionalAccommodationIds] = useState<string[]>([]);
  const [travellers, setTravellers] = useState<TravellerRow[]>([
    blankTraveller("traveller-1"),
    blankTraveller("traveller-2")
  ]);

  const selectedAvailability = availability.find((item) => item.id === selectedAvailabilityId) ?? availability[0];

  const calculated = useMemo(() => travellers.map((traveller, index) => {
    const age = selectedAvailability
      ? calculateAgeOnDate(traveller.dateOfBirth, selectedAvailability.departureDate)
      : null;
    const band = age === null ? null : findTravellerPricingBand(pricingBands, age);
    const unitPrice = band && selectedAvailability
      ? getTravellerBandPrice({
          trip: { fromPrice, travellerPricing: hasExplicitPricing ? pricingBands : undefined },
          availability: selectedAvailability,
          band
        })
      : null;

    return { traveller, index, age, band, unitPrice };
  }), [travellers, selectedAvailability, pricingBands, fromPrice, hasExplicitPricing]);

  const adultChoices = calculated.filter((item) => item.age !== null && item.age >= 18);
  const travellerTotal = calculated.reduce((sum, item) => sum + (item.unitPrice ?? 0), 0);
  const inventorySpaces = calculated.reduce(
    (sum, item) => sum + (item.band?.consumesInventory ? 1 : 0),
    0
  );
  const leadAge = calculated[0]?.age ?? null;
  const leadIsMinor = leadAge !== null && leadAge < 18;
  const inventoryExceeded = Boolean(selectedAvailability && inventorySpaces > selectedAvailability.remainingSpaces);
  const complete = calculated.every((item) => {
    const row = item.traveller;
    if (!row.firstName.trim() || !row.lastName.trim() || !row.dateOfBirth || !row.nationality.trim() || item.age === null || !item.band) return false;
    if (item.age < 18) {
      return Boolean(row.guardianTravellerId && row.guardianRelationship && adultChoices.some((adult) => adult.traveller.id === row.guardianTravellerId));
    }
    return true;
  });

  const accommodationReadyForPreview = Boolean(
    selectedAvailability &&
    travellers.length > 0 &&
    travellers.every((traveller) => traveller.dateOfBirth)
  );

  const accommodationPreview = useMemo(() => {
    if (!accommodationReadyForPreview || !selectedAvailability || !accommodationComponents.length) {
      return { bookings: [], error: null as AccommodationBookingError | null };
    }
    try {
      const bookings = buildAccommodationBookingPlan({
        components: accommodationComponents,
        accommodations,
        departureDate: selectedAvailability.departureDate,
        travellers,
        selectedOptionalComponentIds: selectedOptionalAccommodationIds,
        reservationCurrency: currency
      });
      return { bookings, error: null as AccommodationBookingError | null };
    } catch (error) {
      return {
        bookings: [],
        error: error instanceof AccommodationBookingError ? error : new AccommodationBookingError(
          "ACCOMMODATION_CONFIGURATION_INVALID",
          "Accommodation preview is unavailable."
        )
      };
    }
  }, [
    accommodationReadyForPreview,
    selectedAvailability,
    accommodationComponents,
    accommodations,
    travellers,
    selectedOptionalAccommodationIds,
    currency
  ]);

  const componentPreviews = useMemo(() => {
    const map = new Map<string, { booking?: ReturnType<typeof buildAccommodationBookingPlan>[number]; error?: AccommodationBookingError }>();
    if (!accommodationReadyForPreview || !selectedAvailability) return map;
    for (const component of accommodationComponents) {
      try {
        const bookings = buildAccommodationBookingPlan({
          components: [component],
          accommodations,
          departureDate: selectedAvailability.departureDate,
          travellers,
          selectedOptionalComponentIds: component.mode === "optional" ? [component.id] : [],
          reservationCurrency: currency
        });
        map.set(component.id, { booking: bookings[0] });
      } catch (error) {
        map.set(component.id, {
          error: error instanceof AccommodationBookingError ? error : new AccommodationBookingError(
            "ACCOMMODATION_CONFIGURATION_INVALID",
            "Accommodation preview is unavailable."
          )
        });
      }
    }
    return map;
  }, [accommodationReadyForPreview, selectedAvailability, accommodationComponents, accommodations, travellers, currency]);

  const accommodationTotals = accommodationBookingTotals(accommodationPreview.bookings);
  const total = Number((travellerTotal + accommodationTotals.accommodationAdditionalTotal).toFixed(2));
  const requiredAccommodationInvalid = accommodationComponents.some((component) =>
    component.mode === "included" && componentPreviews.get(component.id)?.error
  );
  const selectedOptionalInvalid = selectedOptionalAccommodationIds.some((id) => componentPreviews.get(id)?.error);
  const accommodationInvalid = Boolean(accommodationPreview.error || requiredAccommodationInvalid || selectedOptionalInvalid);
  const canSubmit = Boolean(selectedAvailability && complete && !leadIsMinor && !inventoryExceeded && !accommodationInvalid);

  function update(id: string, patch: Partial<TravellerRow>) {
    setTravellers((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function addTraveller() {
    if (travellers.length >= 8) return;
    const id = `traveller-${nextId.current}`;
    nextId.current += 1;
    setTravellers((current) => [...current, blankTraveller(id)]);
  }

  function removeTraveller(id: string) {
    if (travellers.length <= 1 || id === travellers[0]?.id) return;
    setTravellers((current) => current
      .filter((item) => item.id !== id)
      .map((item) => item.guardianTravellerId === id ? { ...item, guardianTravellerId: "", guardianRelationship: "" } : item));
  }

  function toggleOptionalAccommodation(id: string, checked: boolean) {
    setSelectedOptionalAccommodationIds((current) => checked
      ? [...new Set([...current, id])]
      : current.filter((item) => item !== id));
  }

  function travellerNames(ids: string[]) {
    return ids.map((id) => {
      const traveller = travellers.find((item) => item.id === id);
      if (!traveller) return t("Traveller", "Viajero");
      return `${traveller.firstName || t("Traveller", "Viajero")} ${traveller.lastName}`.trim();
    }).join(", ");
  }

  return (
    <form action={createReservationAction} className={styles.form}>
      <input type="hidden" name="tripSlug" value={tripSlug} />

      <label className={styles.field}>
        <span>{t("Departure", "Salida")}</span>
        <select name="availabilityId" required value={selectedAvailabilityId} onChange={(event) => setSelectedAvailabilityId(event.target.value)}>
          {availability.map((item) => (
            <option key={item.id} value={item.id}>
              {date(item.departureDate, locale)} → {date(item.returnDate, locale)} · {item.remainingSpaces} {t("spaces", "plazas")}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.bookingSectionHeader}>
        <div>
          <strong>{t("Travellers", "Viajeros")}</strong>
          <span>{t("Age and price are calculated on the departure date.", "La edad y el precio se calculan en la fecha de salida.")}</span>
        </div>
        <button className="button button-secondary" type="button" onClick={addTraveller} disabled={travellers.length >= 8}>
          {t("+ Add traveller", "+ Añadir viajero")}
        </button>
      </div>

      {leadIsMinor ? (
        <div className={styles.error}>{t("The lead traveller must be at least 18 on the departure date.", "El viajero principal debe tener al menos 18 años en la fecha de salida.")}</div>
      ) : null}

      <div className={styles.travellerList}>
        {calculated.map(({ traveller, index, age, band, unitPrice }) => {
          const isMinor = age !== null && age < 18;
          return (
            <div className={styles.travellerCard} key={traveller.id}>
              <input type="hidden" name="travellerId" value={traveller.id} />
              <div className={styles.travellerHeader}>
                <div>
                  <strong>{index === 0 ? t("Lead traveller", "Viajero principal") : `${t("Traveller", "Viajero")} ${index + 1}`}</strong>
                  <span>
                    {age === null
                      ? t("Enter date of birth to calculate fare", "Introduce la fecha de nacimiento para calcular la tarifa")
                      : `${age} ${t("years", "años")} · ${locale === "es" ? (band?.labelEs || band?.label) : band?.label}${unitPrice === null ? "" : ` · ${money(unitPrice, currency, locale)}`}`}
                  </span>
                </div>
                {index > 0 ? <button type="button" className={styles.removeButton} onClick={() => removeTraveller(traveller.id)}>{t("Remove", "Eliminar")}</button> : null}
              </div>

              <div className={styles.travellerGrid}>
                <label className={styles.field}>
                  <span>{t("First name *", "Nombre *")}</span>
                  <input name={`travellerFirstName__${traveller.id}`} value={traveller.firstName} onChange={(event) => update(traveller.id, { firstName: event.target.value })} autoComplete="given-name" required />
                </label>
                <label className={styles.field}>
                  <span>{t("Last name *", "Apellidos *")}</span>
                  <input name={`travellerLastName__${traveller.id}`} value={traveller.lastName} onChange={(event) => update(traveller.id, { lastName: event.target.value })} autoComplete="family-name" required />
                </label>
                <label className={styles.field}>
                  <span>{t("Date of birth *", "Fecha de nacimiento *")}</span>
                  <input name={`travellerDateOfBirth__${traveller.id}`} type="date" value={traveller.dateOfBirth} onChange={(event) => update(traveller.id, { dateOfBirth: event.target.value, guardianTravellerId: "", guardianRelationship: "" })} required />
                </label>
                <label className={styles.field}>
                  <span>{t("Nationality *", "Nacionalidad *")}</span>
                  <input name={`travellerNationality__${traveller.id}`} value={traveller.nationality} onChange={(event) => update(traveller.id, { nationality: event.target.value })} placeholder={t("e.g. Spanish", "p. ej. Española")} required />
                </label>
              </div>

              {isMinor ? (
                <div className={styles.minorBox}>
                  <strong>{t("Minor traveller", "Viajero menor de edad")}</strong>
                  <p>{t("A responsible adult travelling on the same booking is required.", "Es obligatorio asociar un adulto responsable que viaje en la misma reserva.")}</p>
                  <div className={styles.travellerGrid}>
                    <label className={styles.field}>
                      <span>{t("Responsible adult *", "Adulto responsable *")}</span>
                      <select name={`travellerGuardian__${traveller.id}`} value={traveller.guardianTravellerId} onChange={(event) => update(traveller.id, { guardianTravellerId: event.target.value })} required>
                        <option value="">{t("Choose adult", "Seleccionar adulto")}</option>
                        {adultChoices.filter((adult) => adult.traveller.id !== traveller.id).map((adult) => (
                          <option value={adult.traveller.id} key={adult.traveller.id}>
                            {adult.traveller.firstName || t("Adult", "Adulto")} {adult.traveller.lastName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>{t("Relationship *", "Relación *")}</span>
                      <select name={`travellerGuardianRelationship__${traveller.id}`} value={traveller.guardianRelationship} onChange={(event) => update(traveller.id, { guardianRelationship: event.target.value as GuardianRelationship | "" })} required>
                        <option value="">{t("Choose relationship", "Seleccionar relación")}</option>
                        <option value="parent">{t("Parent", "Padre / madre")}</option>
                        <option value="legal-guardian">{t("Legal guardian", "Tutor legal")}</option>
                        <option value="other">{t("Other responsible adult", "Otro adulto responsable")}</option>
                      </select>
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <input type="hidden" name={`travellerGuardian__${traveller.id}`} value="" />
                  <input type="hidden" name={`travellerGuardianRelationship__${traveller.id}`} value="" />
                </>
              )}
            </div>
          );
        })}
      </div>

      {inventoryExceeded ? (
        <div className={styles.error}>{t("There are not enough spaces for this group of travellers.", "No quedan suficientes plazas para este grupo de viajeros.")}</div>
      ) : null}

      {accommodationComponents.length ? (
        <section className={styles.travellerCard}>
          <div className={styles.bookingSectionHeader}>
            <div>
              <strong>{t("Accommodation", "Alojamiento")}</strong>
              <span>{t("Room allocation is calculated from the travellers and checked again when you confirm.", "La distribución de habitaciones se calcula con los viajeros y se vuelve a comprobar al confirmar.")}</span>
            </div>
          </div>

          {!accommodationReadyForPreview ? (
            <div className={styles.notice}>{t("Enter every traveller's date of birth to preview the room distribution and accommodation price.", "Introduce la fecha de nacimiento de todos los viajeros para ver la distribución de habitaciones y el precio del alojamiento.")}</div>
          ) : null}

          <div className={styles.travellerList}>
            {accommodationComponents.map((component) => {
              const accommodation = accommodations.find((item) => item.id === component.accommodationId);
              const room = accommodation?.roomTypes.find((item) => item.id === component.roomTypeId);
              const preview = componentPreviews.get(component.id);
              const booking = preview?.booking;
              const isOptional = component.mode === "optional";
              const selected = !isOptional || selectedOptionalAccommodationIds.includes(component.id);
              return (
                <div className={styles.minorBox} key={component.id}>
                  <div className={styles.travellerHeader}>
                    <div>
                      <strong>{accommodation?.name ?? t("Accommodation unavailable", "Alojamiento no disponible")}</strong>
                      <span>{room?.name ?? t("Room unavailable", "Habitación no disponible")} · {component.nights} {component.nights === 1 ? t("night", "noche") : t("nights", "noches")}</span>
                    </div>
                    <strong>{isOptional ? t("Optional", "Opcional") : t("Included", "Incluido")}</strong>
                  </div>

                  {isOptional ? (
                    <label className={styles.field}>
                      <span>{t("Add this accommodation option", "Añadir esta opción de alojamiento")}</span>
                      <input
                        type="checkbox"
                        name="optionalAccommodationComponentId"
                        value={component.id}
                        checked={selectedOptionalAccommodationIds.includes(component.id)}
                        disabled={Boolean(preview?.error)}
                        onChange={(event) => toggleOptionalAccommodation(component.id, event.target.checked)}
                      />
                    </label>
                  ) : (
                    <p>{t("This stay is already included in the trip price and will not be charged a second time.", "Esta estancia ya está incluida en el precio del viaje y no se cobrará una segunda vez.")}</p>
                  )}

                  {preview?.error ? (
                    <div className={styles.error}>{t("This room cannot currently be allocated to this traveller group.", "Esta habitación no puede asignarse actualmente a este grupo de viajeros.")}</div>
                  ) : booking ? (
                    <>
                      <p>
                        <strong>{booking.rooms.length} {booking.rooms.length === 1 ? t("room", "habitación") : t("rooms", "habitaciones")}</strong>
                        {isOptional ? ` · +${money(booking.totalPrice, currency, locale)}` : ` · ${t("included", "incluido")}`}
                      </p>
                      <div className={styles.fareBands}>
                        {booking.rooms.map((allocation, index) => (
                          <div key={allocation.id}>
                            <span>{t("Room", "Habitación")} {index + 1}: {travellerNames(allocation.travellerIds)}</span>
                            <strong>{money(allocation.totalPrice, currency, locale)}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {isOptional && !selected ? (
                    <p>{t("This option is not included in the current reservation total.", "Esta opción no está incluida en el total actual de la reserva.")}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {accommodationInvalid && accommodationReadyForPreview ? (
        <div className={styles.error}>{t("Review the accommodation options before confirming the reservation.", "Revisa las opciones de alojamiento antes de confirmar la reserva.")}</div>
      ) : null}

      <div className={styles.priceSummary}>
        <div>
          <span>{t("Travellers", "Viajeros")}</span>
          <strong>{travellers.length}</strong>
        </div>
        <div>
          <span>{t("Places required", "Plazas necesarias")}</span>
          <strong>{inventorySpaces}</strong>
        </div>
        {accommodationTotals.accommodationAdditionalTotal > 0 ? (
          <div>
            <span>{t("Optional accommodation", "Alojamiento opcional")}</span>
            <strong>+{money(accommodationTotals.accommodationAdditionalTotal, currency, locale)}</strong>
          </div>
        ) : null}
        <div className={styles.totalRow}>
          <span>{t("Reservation total", "Total de la reserva")}</span>
          <strong>{money(total, currency, locale)}</strong>
        </div>
      </div>

      <button className="button button-primary" type="submit" disabled={!canSubmit}>
        {t("Confirm reservation", "Confirmar reserva")}
      </button>
    </form>
  );
}
