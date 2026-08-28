"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { createReservationAction } from "@/app/reservations/actions";
import styles from "@/app/trips/[slug]/book/booking.module.css";
import type { Accommodation } from "@/domain/accommodation/types";
import type { AvailabilityWindow, GuardianRelationship } from "@/domain/booking/types";
import type { TravellerPricingBand, TravelLocale, TripAccommodationComponent, TripAddOn } from "@/domain/travel/types";
import {
  AccommodationBookingError,
  accommodationBookingTotals,
  buildAccommodationBookingPlan
} from "@/lib/accommodation-booking";
import { buildTripPackageAddOns, TripPackageAddOnError } from "@/lib/trip-package-addons";
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

type TravellerField = "firstName" | "lastName" | "dateOfBirth" | "nationality" | "guardianTravellerId" | "guardianRelationship";
type FieldErrors = Record<string, string>;

const fieldNamePrefixes: Record<TravellerField, string> = {
  firstName: "travellerFirstName",
  lastName: "travellerLastName",
  dateOfBirth: "travellerDateOfBirth",
  nationality: "travellerNationality",
  guardianTravellerId: "travellerGuardian",
  guardianRelationship: "travellerGuardianRelationship"
};

function fieldKey(id: string, field: TravellerField) {
  return `${id}:${field}`;
}

function fieldErrorId(id: string, field: TravellerField) {
  return `traveller-${id}-${field}-error`;
}

function fieldControlName(id: string, field: TravellerField) {
  return `${fieldNamePrefixes[field]}__${id}`;
}

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
  accommodations = [],
  addOns = []
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
  addOns?: TripAddOn[];
}) {
  const t = (en: string, es: string) => locale === "es" ? es : en;
  const nextId = useRef(3);
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState(availability[0]?.id ?? "");
  const [selectedOptionalAccommodationIds, setSelectedOptionalAccommodationIds] = useState<string[]>([]);
  const [selectedBookingAddOnIds, setSelectedBookingAddOnIds] = useState<string[]>([]);
  const [selectedTravellerAddOnIds, setSelectedTravellerAddOnIds] = useState<Record<string, string[]>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
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
  const requiredAccommodationInvalid = accommodationComponents.some((component) =>
    component.mode === "included" && componentPreviews.get(component.id)?.error
  );
  const selectedOptionalInvalid = selectedOptionalAccommodationIds.some((id) => componentPreviews.get(id)?.error);
  const accommodationInvalid = Boolean(accommodationPreview.error || requiredAccommodationInvalid || selectedOptionalInvalid);

  const packageAddOnPreview = useMemo(() => {
    try {
      return {
        ...buildTripPackageAddOns({
          addOns,
          travellers,
          selectedBookingAddOnIds,
          selectedTravellerIdsByAddOn: selectedTravellerAddOnIds
        }),
        error: null as TripPackageAddOnError | null
      };
    } catch (error) {
      return {
        bookings: [],
        packageAddOnTotal: 0,
        error: error instanceof TripPackageAddOnError
          ? error
          : new TripPackageAddOnError("ADDON_SELECTION_INVALID", "Package supplement preview is unavailable.")
      };
    }
  }, [addOns, travellers, selectedBookingAddOnIds, selectedTravellerAddOnIds]);

  const addOnBookingById = new Map(packageAddOnPreview.bookings.map((item) => [item.addOnId, item]));
  const total = Number((travellerTotal + accommodationTotals.accommodationAdditionalTotal + packageAddOnPreview.packageAddOnTotal).toFixed(2));
  const canSubmit = Boolean(
    selectedAvailability &&
    !leadIsMinor &&
    !inventoryExceeded &&
    !accommodationInvalid &&
    !packageAddOnPreview.error
  );

  function clearFieldErrors(id: string, fields: TravellerField[]) {
    setFieldErrors((current) => {
      let changed = false;
      const next = { ...current };
      for (const field of fields) {
        const key = fieldKey(id, field);
        if (key in next) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }

  function update(id: string, patch: Partial<TravellerRow>) {
    setTravellers((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
    clearFieldErrors(id, Object.keys(patch).filter((field): field is TravellerField => field !== "id") as TravellerField[]);
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
    setSelectedTravellerAddOnIds((current) => Object.fromEntries(
      Object.entries(current).map(([addOnId, ids]) => [addOnId, ids.filter((travellerId) => travellerId !== id)])
    ));
    setFieldErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${id}:`))));
  }

  function toggleOptionalAccommodation(id: string, checked: boolean) {
    setSelectedOptionalAccommodationIds((current) => checked
      ? [...new Set([...current, id])]
      : current.filter((item) => item !== id));
  }

  function toggleBookingAddOn(id: string, checked: boolean) {
    setSelectedBookingAddOnIds((current) => checked
      ? [...new Set([...current, id])]
      : current.filter((item) => item !== id));
  }

  function toggleTravellerAddOn(addOnId: string, travellerId: string, checked: boolean) {
    setSelectedTravellerAddOnIds((current) => {
      const selected = current[addOnId] ?? [];
      return {
        ...current,
        [addOnId]: checked
          ? [...new Set([...selected, travellerId])]
          : selected.filter((id) => id !== travellerId)
      };
    });
  }

  function travellerNames(ids: string[]) {
    return ids.map((id) => {
      const traveller = travellers.find((item) => item.id === id);
      if (!traveller) return t("Traveller", "Viajero");
      return `${traveller.firstName || t("Traveller", "Viajero")} ${traveller.lastName}`.trim();
    }).join(", ");
  }

  function validateTravellerFields() {
    const next: FieldErrors = {};
    for (const item of calculated) {
      const { traveller, age, band } = item;
      if (!traveller.firstName.trim()) next[fieldKey(traveller.id, "firstName")] = t("Enter the traveller's first name.", "Introduce el nombre del viajero.");
      if (!traveller.lastName.trim()) next[fieldKey(traveller.id, "lastName")] = t("Enter the traveller's last name.", "Introduce los apellidos del viajero.");
      if (!traveller.dateOfBirth) {
        next[fieldKey(traveller.id, "dateOfBirth")] = t("Enter the traveller's date of birth.", "Introduce la fecha de nacimiento del viajero.");
      } else if (age === null || !band) {
        next[fieldKey(traveller.id, "dateOfBirth")] = t("Enter a valid date of birth for this departure.", "Introduce una fecha de nacimiento válida para esta salida.");
      }
      if (!traveller.nationality.trim()) next[fieldKey(traveller.id, "nationality")] = t("Enter the traveller's nationality.", "Introduce la nacionalidad del viajero.");
      if (age !== null && age < 18) {
        const validGuardian = traveller.guardianTravellerId && adultChoices.some((adult) => adult.traveller.id === traveller.guardianTravellerId);
        if (!validGuardian) next[fieldKey(traveller.id, "guardianTravellerId")] = t("Choose an adult travelling on this booking.", "Selecciona un adulto que viaje en esta reserva.");
        if (!traveller.guardianRelationship) next[fieldKey(traveller.id, "guardianRelationship")] = t("Choose the relationship with the responsible adult.", "Selecciona la relación con el adulto responsable.");
      }
    }
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors = validateTravellerFields();
    const firstKey = Object.keys(nextErrors)[0];
    if (!firstKey) {
      setFieldErrors({});
      return;
    }

    event.preventDefault();
    setFieldErrors(nextErrors);
    const separator = firstKey.indexOf(":");
    const travellerId = firstKey.slice(0, separator);
    const field = firstKey.slice(separator + 1) as TravellerField;
    const control = event.currentTarget.elements.namedItem(fieldControlName(travellerId, field));
    if (control instanceof HTMLElement) control.focus();
  }

  const fieldErrorCount = Object.keys(fieldErrors).length;

  return (
    <form action={createReservationAction} className={styles.form} noValidate onSubmit={handleSubmit}>
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

      {fieldErrorCount ? (
        <div id="trip-booking-field-errors" className={styles.error} role="alert" aria-live="assertive" aria-atomic="true">
          <strong>{t(`Review ${fieldErrorCount} highlighted traveller field${fieldErrorCount === 1 ? "" : "s"}.`, `Revisa ${fieldErrorCount} campo${fieldErrorCount === 1 ? "" : "s"} de viajero marcado${fieldErrorCount === 1 ? "" : "s"}.`)}</strong><br />
          {t("Focus has moved to the first field that needs attention.", "El foco se ha movido al primer campo que necesita atención.")}
        </div>
      ) : null}

      <div className={styles.travellerList}>
        {calculated.map(({ traveller, index, age, band, unitPrice }) => {
          const isMinor = age !== null && age < 18;
          const firstNameError = fieldErrors[fieldKey(traveller.id, "firstName")];
          const lastNameError = fieldErrors[fieldKey(traveller.id, "lastName")];
          const dateOfBirthError = fieldErrors[fieldKey(traveller.id, "dateOfBirth")];
          const nationalityError = fieldErrors[fieldKey(traveller.id, "nationality")];
          const guardianError = fieldErrors[fieldKey(traveller.id, "guardianTravellerId")];
          const relationshipError = fieldErrors[fieldKey(traveller.id, "guardianRelationship")];
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
                  <input name={`travellerFirstName__${traveller.id}`} value={traveller.firstName} onChange={(event) => update(traveller.id, { firstName: event.target.value })} autoComplete="given-name" required aria-invalid={firstNameError ? "true" : undefined} aria-describedby={firstNameError ? fieldErrorId(traveller.id, "firstName") : undefined} />
                  {firstNameError ? <span id={fieldErrorId(traveller.id, "firstName")} className={styles.fieldError}>{firstNameError}</span> : null}
                </label>
                <label className={styles.field}>
                  <span>{t("Last name *", "Apellidos *")}</span>
                  <input name={`travellerLastName__${traveller.id}`} value={traveller.lastName} onChange={(event) => update(traveller.id, { lastName: event.target.value })} autoComplete="family-name" required aria-invalid={lastNameError ? "true" : undefined} aria-describedby={lastNameError ? fieldErrorId(traveller.id, "lastName") : undefined} />
                  {lastNameError ? <span id={fieldErrorId(traveller.id, "lastName")} className={styles.fieldError}>{lastNameError}</span> : null}
                </label>
                <label className={styles.field}>
                  <span>{t("Date of birth *", "Fecha de nacimiento *")}</span>
                  <input name={`travellerDateOfBirth__${traveller.id}`} type="date" value={traveller.dateOfBirth} onChange={(event) => update(traveller.id, { dateOfBirth: event.target.value, guardianTravellerId: "", guardianRelationship: "" })} required aria-invalid={dateOfBirthError ? "true" : undefined} aria-describedby={dateOfBirthError ? fieldErrorId(traveller.id, "dateOfBirth") : undefined} />
                  {dateOfBirthError ? <span id={fieldErrorId(traveller.id, "dateOfBirth")} className={styles.fieldError}>{dateOfBirthError}</span> : null}
                </label>
                <label className={styles.field}>
                  <span>{t("Nationality *", "Nacionalidad *")}</span>
                  <input name={`travellerNationality__${traveller.id}`} value={traveller.nationality} onChange={(event) => update(traveller.id, { nationality: event.target.value })} placeholder={t("e.g. Spanish", "p. ej. Española")} required aria-invalid={nationalityError ? "true" : undefined} aria-describedby={nationalityError ? fieldErrorId(traveller.id, "nationality") : undefined} />
                  {nationalityError ? <span id={fieldErrorId(traveller.id, "nationality")} className={styles.fieldError}>{nationalityError}</span> : null}
                </label>
              </div>

              {isMinor ? (
                <div className={styles.minorBox}>
                  <strong>{t("Minor traveller", "Viajero menor de edad")}</strong>
                  <p>{t("A responsible adult travelling on the same booking is required.", "Es obligatorio asociar un adulto responsable que viaje en la misma reserva.")}</p>
                  <div className={styles.travellerGrid}>
                    <label className={styles.field}>
                      <span>{t("Responsible adult *", "Adulto responsable *")}</span>
                      <select name={`travellerGuardian__${traveller.id}`} value={traveller.guardianTravellerId} onChange={(event) => update(traveller.id, { guardianTravellerId: event.target.value })} required aria-invalid={guardianError ? "true" : undefined} aria-describedby={guardianError ? fieldErrorId(traveller.id, "guardianTravellerId") : undefined}>
                        <option value="">{t("Choose adult", "Seleccionar adulto")}</option>
                        {adultChoices.filter((adult) => adult.traveller.id !== traveller.id).map((adult) => (
                          <option value={adult.traveller.id} key={adult.traveller.id}>
                            {adult.traveller.firstName || t("Adult", "Adulto")} {adult.traveller.lastName}
                          </option>
                        ))}
                      </select>
                      {guardianError ? <span id={fieldErrorId(traveller.id, "guardianTravellerId")} className={styles.fieldError}>{guardianError}</span> : null}
                    </label>
                    <label className={styles.field}>
                      <span>{t("Relationship *", "Relación *")}</span>
                      <select name={`travellerGuardianRelationship__${traveller.id}`} value={traveller.guardianRelationship} onChange={(event) => update(traveller.id, { guardianRelationship: event.target.value as GuardianRelationship | "" })} required aria-invalid={relationshipError ? "true" : undefined} aria-describedby={relationshipError ? fieldErrorId(traveller.id, "guardianRelationship") : undefined}>
                        <option value="">{t("Choose relationship", "Seleccionar relación")}</option>
                        <option value="parent">{t("Parent", "Padre / madre")}</option>
                        <option value="legal-guardian">{t("Legal guardian", "Tutor legal")}</option>
                        <option value="other">{t("Other responsible adult", "Otro adulto responsable")}</option>
                      </select>
                      {relationshipError ? <span id={fieldErrorId(traveller.id, "guardianRelationship")} className={styles.fieldError}>{relationshipError}</span> : null}
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

      {addOns.length ? (
        <section className={styles.travellerCard}>
          <div className={styles.bookingSectionHeader}>
            <div>
              <strong>{t("Optional extras", "Extras opcionales")}</strong>
              <span>{t("Choose only the extras you want. They are added clearly to the reservation total.", "Elige solo los extras que quieras. Se añadirán de forma clara al total de la reserva.")}</span>
            </div>
          </div>

          <div className={styles.travellerList}>
            {addOns.map((addOn) => {
              const localizedTitle = locale === "es" ? addOn.titleEs : addOn.title;
              const localizedDescription = locale === "es" ? addOn.descriptionEs : addOn.description;
              const booking = addOnBookingById.get(addOn.id);
              const selectedTravellerIds = selectedTravellerAddOnIds[addOn.id] ?? [];

              return (
                <div className={styles.minorBox} key={addOn.id}>
                  <div className={styles.travellerHeader}>
                    <div>
                      <strong>{localizedTitle}</strong>
                      <span>{localizedDescription || (addOn.pricingMode === "per-booking" ? t("Charged once per booking", "Se cobra una vez por reserva") : t("Charged for each selected traveller", "Se cobra por cada viajero seleccionado"))}</span>
                    </div>
                    <strong>{money(addOn.price, currency, locale)}{addOn.pricingMode === "per-traveller" ? ` / ${t("traveller", "viajero")}` : ""}</strong>
                  </div>

                  {addOn.pricingMode === "per-booking" ? (
                    <label className={styles.field}>
                      <span>{t("Add to this booking", "Añadir a esta reserva")}</span>
                      <input
                        type="checkbox"
                        name="packageAddOnBookingId"
                        value={addOn.id}
                        checked={selectedBookingAddOnIds.includes(addOn.id)}
                        onChange={(event) => toggleBookingAddOn(addOn.id, event.target.checked)}
                      />
                    </label>
                  ) : (
                    <div className={styles.fareBands}>
                      {travellers.map((traveller, index) => (
                        <label key={`${addOn.id}-${traveller.id}`}>
                          <span>
                            <input
                              type="checkbox"
                              name={`packageAddOnTraveller__${addOn.id}`}
                              value={traveller.id}
                              checked={selectedTravellerIds.includes(traveller.id)}
                              onChange={(event) => toggleTravellerAddOn(addOn.id, traveller.id, event.target.checked)}
                            />{" "}
                            {traveller.firstName || `${t("Traveller", "Viajero")} ${index + 1}`} {traveller.lastName}
                          </span>
                          <strong>{selectedTravellerIds.includes(traveller.id) ? `+${money(addOn.price, currency, locale)}` : "—"}</strong>
                        </label>
                      ))}
                    </div>
                  )}

                  {booking ? (
                    <p><strong>+{money(booking.totalPrice, currency, locale)}</strong>{booking.quantity > 1 ? ` · ${booking.quantity} ${t("travellers", "viajeros")}` : ""}</p>
                  ) : (
                    <p>{t("Not selected", "No seleccionado")}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {packageAddOnPreview.error ? (
        <div className={styles.error}>{t("Review the optional extras before confirming the reservation.", "Revisa los extras opcionales antes de confirmar la reserva.")}</div>
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
        {packageAddOnPreview.packageAddOnTotal > 0 ? (
          <div>
            <span>{t("Optional extras", "Extras opcionales")}</span>
            <strong>+{money(packageAddOnPreview.packageAddOnTotal, currency, locale)}</strong>
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
