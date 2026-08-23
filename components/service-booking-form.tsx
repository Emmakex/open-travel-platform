"use client";

import { useMemo, useRef, useState } from "react";
import { createServiceReservationAction } from "@/app/service-reservations/actions";
import styles from "@/app/trips/[slug]/book/booking.module.css";
import type { GuardianRelationship } from "@/domain/booking/types";
import type { ServiceAvailabilitySlot, TravelService } from "@/domain/services/types";
import type { TravelLocale } from "@/domain/travel/types";
import {
  calculateAgeOnDate,
  defaultTravellerPricingBands,
  findTravellerPricingBand
} from "@/lib/traveller-pricing";

const blank = (id: string) => ({
  id,
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  nationality: "",
  guardianTravellerId: "",
  guardianRelationship: "" as GuardianRelationship | ""
});

type TravellerRow = ReturnType<typeof blank>;

function money(value: number, currency: string, locale: TravelLocale) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", { style: "currency", currency }).format(value);
}

function dateLabel(value: string, locale: TravelLocale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric", month: "short", day: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}

export function ServiceBookingForm({
  service,
  availability,
  initialAvailabilityId,
  relatedReservations,
  locale
}: {
  service: TravelService;
  availability: ServiceAvailabilitySlot[];
  initialAvailabilityId?: string;
  relatedReservations: Array<{ id: string; label: string }>;
  locale: TravelLocale;
}) {
  const t = (en: string, es: string) => locale === "es" ? es : en;
  const nextId = useRef(3);
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState(
    availability.some((slot) => slot.id === initialAvailabilityId) ? initialAvailabilityId! : availability[0]?.id ?? ""
  );
  const [travellers, setTravellers] = useState<TravellerRow[]>([blank("traveller-1"), blank("traveller-2")]);
  const [destination, setDestination] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [insuredAmount, setInsuredAmount] = useState("");

  const selected = availability.find((slot) => slot.id === selectedAvailabilityId) ?? availability[0];
  const referenceDate = service.serviceType === "insurance" ? tripStartDate : selected?.date ?? "";
  const basePrice = selected?.priceOverride ?? service.fromPrice;
  const bands = service.travellerPricing?.length ? service.travellerPricing : defaultTravellerPricingBands(service.fromPrice);
  const calculated = useMemo(() => travellers.map((traveller, index) => {
    const age = referenceDate ? calculateAgeOnDate(traveller.dateOfBirth, referenceDate) : null;
    const band = age === null ? null : findTravellerPricingBand(bands, age);
    return { traveller, index, age, band };
  }), [travellers, referenceDate, bands]);
  const adults = calculated.filter((item) => item.age !== null && item.age >= 18);
  const leadMinor = calculated[0]?.age !== null && calculated[0]?.age !== undefined && calculated[0].age < 18;
  const complete = calculated.every((item) => {
    const row = item.traveller;
    if (!row.firstName.trim() || !row.lastName.trim() || !row.dateOfBirth || !row.nationality.trim() || item.age === null || !item.band) return false;
    if ((item.age ?? 0) < 18) return Boolean(row.guardianTravellerId && row.guardianRelationship && adults.some((adult) => adult.traveller.id === row.guardianTravellerId));
    return true;
  });
  const transportCapacity = service.serviceType === "transport" && service.capacity ? service.capacity : 1;
  const quantity = service.pricingMode === "per-unit"
    ? service.serviceType === "transport" ? Math.max(1, Math.ceil(travellers.length / transportCapacity)) : 1
    : service.pricingMode === "per-booking" ? 1 : travellers.length;
  const total = service.pricingMode === "per-age-band"
    ? calculated.reduce((sum, item) => sum + (item.band?.price ?? 0), 0)
    : service.pricingMode === "per-person"
      ? basePrice * travellers.length
      : basePrice * quantity;
  const inventoryUnits = service.serviceType === "insurance"
    ? 0
    : service.serviceType === "transport" && service.pricingMode === "per-unit"
      ? quantity
      : service.pricingMode === "per-age-band"
        ? calculated.reduce((sum, item) => sum + (item.band?.consumesInventory ? 1 : 0), 0)
        : travellers.length;
  const remaining = selected ? Math.max(0, selected.capacity - selected.reserved) : 0;
  const inventoryExceeded = service.serviceType !== "insurance" && Boolean(selected) && inventoryUnits > remaining;
  const insuranceComplete = service.serviceType !== "insurance" || Boolean(destination.trim() && tripStartDate && tripEndDate && tripEndDate >= tripStartDate);
  const canSubmit = complete && !leadMinor && !inventoryExceeded && insuranceComplete && (service.serviceType === "insurance" || Boolean(selected));

  function update(id: string, patch: Partial<TravellerRow>) {
    setTravellers((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  }
  function addTraveller() {
    if (travellers.length >= 8) return;
    const id = `traveller-${nextId.current++}`;
    setTravellers((current) => [...current, blank(id)]);
  }
  function removeTraveller(id: string) {
    if (travellers.length <= 1 || id === travellers[0]?.id) return;
    setTravellers((current) => current.filter((row) => row.id !== id).map((row) => row.guardianTravellerId === id ? { ...row, guardianTravellerId: "", guardianRelationship: "" } : row));
  }

  return (
    <form action={createServiceReservationAction} className={styles.form}>
      <input type="hidden" name="serviceType" value={service.serviceType} />
      <input type="hidden" name="serviceSlug" value={service.slug} />

      {service.serviceType !== "insurance" ? (
        <label className={styles.field}>
          <span>{t("Date and time", "Fecha y horario")}</span>
          <select name="availabilityId" required value={selectedAvailabilityId} onChange={(event) => setSelectedAvailabilityId(event.target.value)}>
            {availability.map((slot) => <option value={slot.id} key={slot.id}>{dateLabel(slot.date, locale)} · {slot.startTime}{slot.endTime ? `–${slot.endTime}` : ""} · {Math.max(0, slot.capacity - slot.reserved)} {slot.inventoryMode === "units" ? t("units", "unidades") : t("spaces", "plazas")}</option>)}
          </select>
        </label>
      ) : (
        <div className={styles.travellerGrid}>
          <label className={styles.field}><span>{t("Destination *", "Destino *")}</span><input name="destination" value={destination} onChange={(event) => setDestination(event.target.value)} required /></label>
          <label className={styles.field}><span>{t("Trip start *", "Inicio del viaje *")}</span><input type="date" name="tripStartDate" value={tripStartDate} onChange={(event) => setTripStartDate(event.target.value)} required /></label>
          <label className={styles.field}><span>{t("Trip end *", "Fin del viaje *")}</span><input type="date" name="tripEndDate" value={tripEndDate} onChange={(event) => setTripEndDate(event.target.value)} required /></label>
          <label className={styles.field}><span>{t("Insured trip amount", "Importe del viaje asegurado")}</span><input type="number" min="0" step="0.01" name="insuredAmount" value={insuredAmount} onChange={(event) => setInsuredAmount(event.target.value)} /></label>
        </div>
      )}

      {relatedReservations.length ? (
        <label className={styles.field}>
          <span>{t("Link to one of my Kairoseth trips (optional)", "Vincular con uno de mis viajes Kairoseth (opcional)")}</span>
          <select name="relatedReservationId" defaultValue="">
            <option value="">{t("No linked trip / externally booked trip", "Sin viaje vinculado / viaje reservado fuera")}</option>
            {relatedReservations.map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.label}</option>)}
          </select>
        </label>
      ) : <input type="hidden" name="relatedReservationId" value="" />}

      <div className={styles.bookingSectionHeader}>
        <div><strong>{t("Travellers", "Viajeros")}</strong><span>{t("Enter every participant, including minors.", "Introduce todos los participantes, incluidos los menores.")}</span></div>
        <button className="button button-secondary" type="button" onClick={addTraveller} disabled={travellers.length >= 8}>{t("+ Add traveller", "+ Añadir viajero")}</button>
      </div>

      {leadMinor ? <div className={styles.error}>{t("The lead traveller must be an adult.", "El viajero principal debe ser mayor de edad.")}</div> : null}

      <div className={styles.travellerList}>
        {calculated.map(({ traveller, index, age, band }) => {
          const minor = age !== null && age < 18;
          const displayedPrice = service.pricingMode === "per-age-band" && band ? money(band.price, service.currency, locale) : null;
          return (
            <div className={styles.travellerCard} key={traveller.id}>
              <input type="hidden" name="travellerId" value={traveller.id} />
              <div className={styles.travellerHeader}>
                <div><strong>{index === 0 ? t("Lead traveller", "Viajero principal") : `${t("Traveller", "Viajero")} ${index + 1}`}</strong><span>{age === null ? t("Enter date of birth", "Introduce la fecha de nacimiento") : `${age} ${t("years", "años")}${band ? ` · ${locale === "es" ? band.labelEs || band.label : band.label}` : ""}${displayedPrice ? ` · ${displayedPrice}` : ""}`}</span></div>
                {index > 0 ? <button type="button" className={styles.removeButton} onClick={() => removeTraveller(traveller.id)}>{t("Remove", "Eliminar")}</button> : null}
              </div>
              <div className={styles.travellerGrid}>
                <label className={styles.field}><span>{t("First name *", "Nombre *")}</span><input name={`travellerFirstName__${traveller.id}`} value={traveller.firstName} onChange={(event) => update(traveller.id, { firstName: event.target.value })} required /></label>
                <label className={styles.field}><span>{t("Last name *", "Apellidos *")}</span><input name={`travellerLastName__${traveller.id}`} value={traveller.lastName} onChange={(event) => update(traveller.id, { lastName: event.target.value })} required /></label>
                <label className={styles.field}><span>{t("Date of birth *", "Fecha de nacimiento *")}</span><input type="date" name={`travellerDateOfBirth__${traveller.id}`} value={traveller.dateOfBirth} onChange={(event) => update(traveller.id, { dateOfBirth: event.target.value, guardianTravellerId: "", guardianRelationship: "" })} required /></label>
                <label className={styles.field}><span>{t("Nationality *", "Nacionalidad *")}</span><input name={`travellerNationality__${traveller.id}`} value={traveller.nationality} onChange={(event) => update(traveller.id, { nationality: event.target.value })} required /></label>
              </div>
              {minor ? (
                <div className={styles.minorBox}>
                  <strong>{t("Minor traveller", "Viajero menor de edad")}</strong>
                  <p>{t("A responsible adult on this reservation is required.", "Es obligatorio asociar un adulto responsable de esta reserva.")}</p>
                  <div className={styles.travellerGrid}>
                    <label className={styles.field}><span>{t("Responsible adult *", "Adulto responsable *")}</span><select name={`travellerGuardian__${traveller.id}`} value={traveller.guardianTravellerId} onChange={(event) => update(traveller.id, { guardianTravellerId: event.target.value })} required><option value="">{t("Choose adult", "Seleccionar adulto")}</option>{adults.filter((adult) => adult.traveller.id !== traveller.id).map((adult) => <option key={adult.traveller.id} value={adult.traveller.id}>{adult.traveller.firstName || t("Adult", "Adulto")} {adult.traveller.lastName}</option>)}</select></label>
                    <label className={styles.field}><span>{t("Relationship *", "Relación *")}</span><select name={`travellerGuardianRelationship__${traveller.id}`} value={traveller.guardianRelationship} onChange={(event) => update(traveller.id, { guardianRelationship: event.target.value as GuardianRelationship | "" })} required><option value="">{t("Choose relationship", "Seleccionar relación")}</option><option value="parent">{t("Parent", "Padre / madre")}</option><option value="legal-guardian">{t("Legal guardian", "Tutor legal")}</option><option value="other">{t("Other responsible adult", "Otro adulto responsable")}</option></select></label>
                  </div>
                </div>
              ) : <><input type="hidden" name={`travellerGuardian__${traveller.id}`} value="" /><input type="hidden" name={`travellerGuardianRelationship__${traveller.id}`} value="" /></>}
            </div>
          );
        })}
      </div>

      {inventoryExceeded ? <div className={styles.error}>{t("There is not enough availability for this booking.", "No queda disponibilidad suficiente para esta reserva.")}</div> : null}
      <div className={styles.priceSummary}>
        <div><span>{t("Travellers", "Viajeros")}</span><strong>{travellers.length}</strong></div>
        {service.pricingMode === "per-unit" ? <div><span>{t("Units", "Unidades")}</span><strong>{quantity}</strong></div> : null}
        <div className={styles.totalRow}><span>{t("Service total", "Total del servicio")}</span><strong>{money(total, service.currency, locale)}</strong></div>
      </div>
      <button className="button button-primary" type="submit" disabled={!canSubmit}>{t("Create service reservation", "Crear reserva del servicio")}</button>
    </form>
  );
}
