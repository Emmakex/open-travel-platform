"use client";

import { useMemo, useState } from "react";
import { saveServiceAvailabilityAction } from "@/app/operator/catalogue/services/availability-actions";
import styles from "@/app/operator/operator.module.css";
import type {
  ServiceAvailabilitySlot,
  ServiceInventoryMode,
  TravelService
} from "@/domain/services/types";
import type { TravelLocale } from "@/domain/travel/types";
import { tr } from "@/lib/operator-i18n";

function resolveInventoryMode(service: TravelService): ServiceInventoryMode {
  if (service.serviceType !== "transport") return "people";
  return service.inventoryMode ?? (service.pricingMode === "per-unit" ? "units" : "people");
}

function newSlot(service: TravelService): ServiceAvailabilitySlot {
  const inventoryMode = resolveInventoryMode(service);
  return {
    id: crypto.randomUUID(),
    serviceId: service.id,
    serviceType: service.serviceType === "transport" ? "transport" : "activity",
    date: "",
    startTime: "09:00",
    endTime: "",
    inventoryMode,
    capacity: inventoryMode === "units" ? 1 : 10,
    reserved: 0,
    status: "open",
    priceOverride: undefined
  };
}

export function ServiceAvailabilityEditor({
  service,
  slots,
  locale
}: {
  service: TravelService;
  slots: ServiceAvailabilitySlot[];
  locale: TravelLocale;
}) {
  const inventoryMode = resolveInventoryMode(service);
  const usesAgePricing = service.pricingMode === "per-age-band";
  const initial = useMemo<ServiceAvailabilitySlot[]>(
    () => slots.map((slot) => ({
      ...slot,
      inventoryMode,
      // A single slot-level price cannot represent multiple age bands. Ignore
      // legacy slot overrides for age-priced services; prices come from bands.
      priceOverride: usesAgePricing ? undefined : slot.priceOverride
    })),
    [slots, inventoryMode, usesAgePricing]
  );
  const [items, setItems] = useState<ServiceAvailabilitySlot[]>(initial);

  if (service.serviceType === "insurance") return null;

  function update(index: number, patch: Partial<ServiceAvailabilitySlot>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function remove(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function add() {
    setItems((current) => [...current, newSlot(service)]);
  }

  const unitLabel = inventoryMode === "units"
    ? tr(locale, "units", "unidades")
    : tr(locale, "people", "personas");

  return (
    <form action={saveServiceAvailabilityAction} className={styles.editorForm} style={{ marginTop: "1rem" }}>
      <input type="hidden" name="serviceId" value={service.id} />
      <input type="hidden" name="serviceType" value={service.serviceType} />
      <input type="hidden" name="inventoryMode" value={inventoryMode} />

      <div className={styles.editorSection}>
        <div className={styles.sectionHeaderCompact}>
          <div>
            <div className="eyebrow">{tr(locale, "Availability & inventory", "Disponibilidad e inventario")}</div>
            <h2>{tr(locale, "Service schedule", "Calendario del servicio")}</h2>
            <p className={styles.muted}>
              {service.serviceType === "activity"
                ? tr(locale, "Create dated activity sessions with their own capacity. Reserved inventory is protected from catalogue edits.", "Crea sesiones de actividad con fecha, horario y cupo propio. El inventario ya reservado queda protegido frente a cambios del catálogo.")
                : tr(locale, "Create dated transport departures and manage inventory as passengers or units depending on the pricing model.", "Crea salidas de transporte con fecha y horario y gestiona el inventario como pasajeros o unidades según el modelo de precio.")}
            </p>
          </div>
          <button className="button button-secondary" type="button" onClick={add}>
            {tr(locale, "+ Add slot", "+ Añadir horario")}
          </button>
        </div>

        <div className={styles.notice}>
          {tr(locale, "Inventory mode", "Modo de inventario")}: <strong>{inventoryMode === "units" ? tr(locale, "Units", "Unidades") : tr(locale, "People", "Personas")}</strong>. {service.serviceType === "transport" ? tr(locale, "Per-unit pricing uses units; other transport pricing models use passenger capacity.", "El precio por unidad utiliza unidades; los demás modelos de transporte utilizan capacidad de pasajeros.") : tr(locale, "Activities always manage capacity by participant.", "Las actividades siempre gestionan el cupo por participante.")}
        </div>

        {usesAgePricing ? (
          <div className={styles.notice}>
            <strong>{tr(locale, "Age-band pricing", "Precio según edad")}.</strong>{" "}
            {tr(locale, "Each participant is priced from the configured traveller age bands. A single price override per slot is disabled because it would not represent adult, child and infant prices correctly.", "Cada participante se tarifa con las bandas de edad configuradas. El precio especial único por horario está desactivado porque no representaría correctamente los precios de adulto, menor y bebé.")}
          </div>
        ) : null}

        {items.length ? (
          <div className={styles.repeatList}>
            {items.map((item, index) => (
              <div className={styles.panel} key={item.id} style={{ padding: "1rem" }}>
                <input type="hidden" name="slotId" value={item.id} />
                <div className={styles.sectionHeaderCompact}>
                  <div>
                    <strong>{item.date || tr(locale, "New availability", "Nueva disponibilidad")}</strong>
                    <p className={styles.muted} style={{ margin: ".25rem 0 0" }}>
                      {tr(locale, "Reserved", "Reservado")}: {item.reserved} {unitLabel}
                    </p>
                  </div>
                  <button type="button" className={styles.textButtonDanger} onClick={() => remove(index)}>
                    {item.reserved > 0 ? tr(locale, "Close/remove", "Cerrar/eliminar") : tr(locale, "Remove", "Eliminar")}
                  </button>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.field}><span>{tr(locale, "Date *", "Fecha *")}</span><input type="date" name={`slotDate__${item.id}`} value={item.date} onChange={(event) => update(index, { date: event.target.value })} required /></label>
                  <label className={styles.field}><span>{tr(locale, "Start time *", "Hora inicio *")}</span><input type="time" name={`slotStartTime__${item.id}`} value={item.startTime} onChange={(event) => update(index, { startTime: event.target.value })} required /></label>
                  <label className={styles.field}><span>{tr(locale, "End time", "Hora fin")}</span><input type="time" name={`slotEndTime__${item.id}`} value={item.endTime ?? ""} onChange={(event) => update(index, { endTime: event.target.value || undefined })} /></label>
                  <label className={styles.field}><span>{tr(locale, "Capacity *", "Capacidad *")} ({unitLabel})</span><input type="number" min={Math.max(1, item.reserved)} step="1" name={`slotCapacity__${item.id}`} value={item.capacity} onChange={(event) => update(index, { capacity: Number(event.target.value) })} required /></label>
                  {!usesAgePricing ? (
                    <label className={styles.field}><span>{tr(locale, "Price override", "Precio especial")}</span><input type="number" min="0" step="0.01" name={`slotPriceOverride__${item.id}`} value={item.priceOverride ?? ""} onChange={(event) => update(index, { priceOverride: event.target.value === "" ? undefined : Number(event.target.value) })} placeholder={tr(locale, "Use service price", "Usar precio del servicio")} /></label>
                  ) : null}
                  <label className={styles.field}><span>{tr(locale, "Status", "Estado")}</span><select name={`slotStatus__${item.id}`} value={item.status} onChange={(event) => update(index, { status: event.target.value === "closed" ? "closed" : "open" })}><option value="open">{tr(locale, "Open", "Abierta")}</option><option value="closed">{tr(locale, "Closed", "Cerrada")}</option></select></label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.notice}>{tr(locale, "No availability has been scheduled yet. The public service page will remain visible, but no bookable dates will be advertised.", "Todavía no hay disponibilidad programada. La ficha pública seguirá visible, pero no se anunciarán fechas reservables.")}</div>
        )}
      </div>

      <div className={styles.stickySaveBar}>
        <div><strong>{tr(locale, "Save availability", "Guardar disponibilidad")}</strong><span>{tr(locale, "Schedule changes do not alter existing reserved inventory.", "Los cambios de calendario no modifican el inventario ya reservado.")}</span></div>
        <button className="button button-primary" type="submit">{tr(locale, "Save schedule", "Guardar calendario")}</button>
      </div>
    </form>
  );
}