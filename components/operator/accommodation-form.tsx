"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { saveAccommodationAction } from "@/app/operator/catalogue/accommodations/actions";
import styles from "@/app/operator/operator.module.css";
import { MediaEditorCard } from "@/components/operator/structured-editors";
import type {
  Accommodation,
  AccommodationInventoryPeriod,
  AccommodationRoomType
} from "@/domain/accommodation/types";
import type { TravelLocale } from "@/domain/travel/types";
import type { MediaLibraryChoice } from "@/lib/media-library";
import { publicationStatusLabel, tr } from "@/lib/operator-i18n";

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

type RoomEditorRow = AccommodationRoomType & {
  nameEs?: string;
  descriptionEs?: string;
};

export function AccommodationForm({
  accommodation,
  inventory = [],
  mediaLibrary = [],
  locale,
  error
}: {
  accommodation?: Accommodation | null;
  inventory?: AccommodationInventoryPeriod[];
  mediaLibrary?: MediaLibraryChoice[];
  locale: TravelLocale;
  error?: string;
}) {
  const initialRooms = useMemo<RoomEditorRow[]>(() => (
    accommodation?.roomTypes.map((room) => ({
      ...room,
      nameEs: accommodation.translations?.es?.roomTypes?.[room.id]?.name,
      descriptionEs: accommodation.translations?.es?.roomTypes?.[room.id]?.description
    })) ?? []
  ), [accommodation]);
  const [rooms, setRooms] = useState<RoomEditorRow[]>(initialRooms);
  const [periods, setPeriods] = useState<AccommodationInventoryPeriod[]>(inventory);
  const isEditing = Boolean(accommodation);
  const es = accommodation?.translations?.es;

  function addRoom() {
    const id = newId("room");
    setRooms((current) => [...current, {
      id,
      code: "",
      name: "",
      occupancy: {
        minAdults: 1,
        maxAdults: 2,
        maxChildren: 0,
        maxOccupancy: 2
      }
    }]);
  }

  function removeRoom(id: string) {
    setRooms((current) => current.filter((room) => room.id !== id));
    setPeriods((current) => current.filter((period) => period.roomTypeId !== id));
  }

  function updateRoom(id: string, patch: Partial<RoomEditorRow>) {
    setRooms((current) => current.map((room) => room.id === id ? { ...room, ...patch } : room));
  }

  function updateOccupancy(id: string, patch: Partial<AccommodationRoomType["occupancy"]>) {
    setRooms((current) => current.map((room) => room.id === id
      ? { ...room, occupancy: { ...room.occupancy, ...patch } }
      : room));
  }

  function addInventoryPeriod() {
    if (!rooms.length) return;
    setPeriods((current) => [...current, {
      id: newId("room-inventory"),
      accommodationId: accommodation?.id ?? "",
      roomTypeId: rooms[0].id,
      startDate: "",
      endDate: "",
      capacity: 0,
      reserved: 0,
      status: "open"
    }]);
  }

  function updatePeriod(id: string, patch: Partial<AccommodationInventoryPeriod>) {
    setPeriods((current) => current.map((period) => period.id === id ? { ...period, ...patch } : period));
  }

  function removePeriod(id: string) {
    setPeriods((current) => current.filter((period) => period.id !== id));
  }

  const errorMessage = error === "capacity-conflict"
    ? tr(locale, "Capacity cannot be lower than rooms already reserved in that period.", "La capacidad no puede ser inferior a las habitaciones ya reservadas en ese periodo.")
    : error === "validation"
      ? tr(locale, "Review accommodation, room occupancy and inventory fields. Inventory periods for the same room type cannot overlap.", "Revisa los datos del alojamiento, ocupación e inventario. Los periodos de un mismo tipo de habitación no pueden solaparse.")
      : error
        ? tr(locale, "The accommodation could not be saved. Review the form and try again.", "No se pudo guardar el alojamiento. Revisa el formulario e inténtalo de nuevo.")
        : null;

  return (
    <form action={saveAccommodationAction} className={styles.editorForm}>
      <input type="hidden" name="id" value={accommodation?.id ?? ""} />
      {errorMessage ? <div className={styles.notice}>{errorMessage}</div> : null}

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">{tr(locale, "Accommodation product", "Producto de alojamiento")}</div>
          <h2>{tr(locale, "Property details", "Datos del alojamiento")}</h2>
          <p className={styles.muted}>{tr(locale, "Create the reusable accommodation first. Room pricing and package pricing are configured in later steps, not in this inventory foundation.", "Crea primero el alojamiento reutilizable. Las tarifas de habitación y el pricing de paquetes se configurarán en pasos posteriores, no en esta base de inventario.")}</p>
        </div>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>{tr(locale, "Name *", "Nombre (EN) *")}</span><input name="name" defaultValue={accommodation?.name ?? ""} required /></label>
          <label className={styles.field}><span>Slug</span><input name="slug" defaultValue={accommodation?.slug ?? ""} placeholder="hotel-or-lodge-name" /></label>
          <label className={styles.field}><span>{tr(locale, "Location *", "Ubicación (EN) *")}</span><input name="location" defaultValue={accommodation?.location ?? ""} required /></label>
          <label className={styles.field}><span>{tr(locale, "Country *", "País *")}</span><input name="country" defaultValue={accommodation?.country ?? ""} required /></label>
          <label className={styles.field}><span>{tr(locale, "Currency", "Moneda")}</span><select name="currency" defaultValue={accommodation?.currency ?? "EUR"}><option>EUR</option><option>USD</option><option>GBP</option></select></label>
          <label className={styles.field}><span>{tr(locale, "Publication", "Publicación")}</span><select name="publicationStatus" defaultValue={accommodation?.publicationStatus ?? "draft"}><option value="draft">{publicationStatusLabel("draft", locale)}</option><option value="published">{publicationStatusLabel("published", locale)}</option></select></label>
        </div>
        <label className={styles.field}><span>{tr(locale, "Summary *", "Resumen (EN) *")}</span><textarea name="summary" defaultValue={accommodation?.summary ?? ""} rows={5} required /></label>
        <label className={styles.checkboxField}><input type="checkbox" name="featured" defaultChecked={accommodation?.featured ?? false} /><span>{tr(locale, "Featured accommodation", "Alojamiento destacado")}</span></label>
      </div>

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Spanish content", "Contenido en español")}</div><p className={styles.muted}>{tr(locale, "Leave a translation empty to use the English base content.", "Deja una traducción vacía para utilizar el contenido base en inglés.")}</p></div>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>Nombre</span><input name="nameEs" defaultValue={es?.name ?? ""} /></label>
          <label className={styles.field}><span>Ubicación</span><input name="locationEs" defaultValue={es?.location ?? ""} /></label>
        </div>
        <label className={styles.field}><span>Resumen</span><textarea name="summaryEs" defaultValue={es?.summary ?? ""} rows={4} /></label>
      </div>

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">{tr(locale, "Accommodation media", "Imágenes del alojamiento")}</div>
          <p className={styles.muted}>{tr(locale, "Upload a new cover image or reuse one from the media library. Direct image URLs remain available only as an advanced option.", "Sube una portada nueva o reutiliza una imagen de la biblioteca multimedia. Las URL directas quedan disponibles solo como opción avanzada.")}</p>
        </div>
        <MediaEditorCard
          title={tr(locale, "Accommodation cover", "Portada del alojamiento")}
          media={accommodation?.coverImage}
          choices={mediaLibrary}
          locale={locale}
          names={{ src: "coverSrc", alt: "coverAlt", caption: "coverCaption", credit: "coverCredit", focalPoint: "coverFocalPoint" }}
        />
      </div>

      <div className={styles.editorSection}>
        <div className={styles.sectionHeader}>
          <div>
            <div className="eyebrow">{tr(locale, "Room types", "Tipos de habitación")}</div>
            <h2>{tr(locale, "Occupancy rules", "Reglas de ocupación")}</h2>
            <p className={styles.muted}>{tr(locale, "Each room type has a stable ID/code and explicit adult, child and total occupancy limits. These rules will drive package pricing and booking validation later.", "Cada tipo de habitación tiene ID/código estable y límites explícitos de adultos, niños y ocupación total. Estas reglas controlarán más adelante el pricing y la validación de reservas.")}</p>
          </div>
          <button className="button button-secondary" type="button" onClick={addRoom}>{tr(locale, "+ Room type", "+ Tipo de habitación")}</button>
        </div>

        {rooms.length ? rooms.map((room, index) => (
          <div className={styles.editorSection} key={room.id}>
            <input type="hidden" name="roomId" value={room.id} />
            <div className={styles.sectionHeader}>
              <strong>{tr(locale, "Room type", "Tipo de habitación")} {index + 1}</strong>
              <button className="button button-secondary" type="button" onClick={() => removeRoom(room.id)}>{tr(locale, "Remove", "Quitar")}</button>
            </div>
            <div className={styles.formGrid}>
              <label className={styles.field}><span>{tr(locale, "Code *", "Código *")}</span><input name={`roomCode:${room.id}`} value={room.code} onChange={(event) => updateRoom(room.id, { code: event.target.value })} placeholder="double_standard" required /></label>
              <label className={styles.field}><span>{tr(locale, "Name *", "Nombre (EN) *")}</span><input name={`roomName:${room.id}`} value={room.name} onChange={(event) => updateRoom(room.id, { name: event.target.value })} required /></label>
              <label className={styles.field}><span>{tr(locale, "Name (Spanish)", "Nombre (ES)")}</span><input name={`roomNameEs:${room.id}`} value={room.nameEs ?? ""} onChange={(event) => updateRoom(room.id, { nameEs: event.target.value })} /></label>
              <label className={styles.field}><span>{tr(locale, "Minimum adults *", "Adultos mínimos *")}</span><input type="number" min="1" step="1" name={`roomMinAdults:${room.id}`} value={room.occupancy.minAdults} onChange={(event) => updateOccupancy(room.id, { minAdults: Number(event.target.value) })} required /></label>
              <label className={styles.field}><span>{tr(locale, "Maximum adults *", "Adultos máximos *")}</span><input type="number" min="1" step="1" name={`roomMaxAdults:${room.id}`} value={room.occupancy.maxAdults} onChange={(event) => updateOccupancy(room.id, { maxAdults: Number(event.target.value) })} required /></label>
              <label className={styles.field}><span>{tr(locale, "Maximum children *", "Niños máximos *")}</span><input type="number" min="0" step="1" name={`roomMaxChildren:${room.id}`} value={room.occupancy.maxChildren} onChange={(event) => updateOccupancy(room.id, { maxChildren: Number(event.target.value) })} required /></label>
              <label className={styles.field}><span>{tr(locale, "Maximum total occupancy *", "Ocupación total máxima *")}</span><input type="number" min="1" step="1" name={`roomMaxOccupancy:${room.id}`} value={room.occupancy.maxOccupancy} onChange={(event) => updateOccupancy(room.id, { maxOccupancy: Number(event.target.value) })} required /></label>
              <label className={styles.field}><span>{tr(locale, "Child maximum age", "Edad máxima de niño")}</span><input type="number" min="0" max="17" step="1" name={`roomChildMaxAge:${room.id}`} value={room.occupancy.childMaxAge ?? ""} onChange={(event) => updateOccupancy(room.id, { childMaxAge: event.target.value === "" ? undefined : Number(event.target.value) })} disabled={room.occupancy.maxChildren === 0} /></label>
            </div>
            <label className={styles.field}><span>{tr(locale, "Description", "Descripción (EN)")}</span><textarea name={`roomDescription:${room.id}`} value={room.description ?? ""} onChange={(event) => updateRoom(room.id, { description: event.target.value })} rows={3} /></label>
            <label className={styles.field}><span>{tr(locale, "Description (Spanish)", "Descripción (ES)")}</span><textarea name={`roomDescriptionEs:${room.id}`} value={room.descriptionEs ?? ""} onChange={(event) => updateRoom(room.id, { descriptionEs: event.target.value })} rows={3} /></label>
          </div>
        )) : <div className={styles.notice}>{tr(locale, "Add at least one room type before saving.", "Añade al menos un tipo de habitación antes de guardar.")}</div>}
      </div>

      <div className={styles.editorSection}>
        <div className={styles.sectionHeader}>
          <div>
            <div className="eyebrow">{tr(locale, "Room inventory", "Inventario de habitaciones")}</div>
            <h2>{tr(locale, "Inventory periods", "Periodos de inventario")}</h2>
            <p className={styles.muted}>{tr(locale, "Set how many rooms of each type are available for a date range. Reserved rooms are system-managed and cannot be edited here.", "Define cuántas habitaciones de cada tipo existen en cada periodo. Las habitaciones reservadas las gestiona el sistema y no se editan aquí.")}</p>
          </div>
          <button className="button button-secondary" type="button" onClick={addInventoryPeriod} disabled={!rooms.length}>{tr(locale, "+ Inventory period", "+ Periodo de inventario")}</button>
        </div>

        {periods.length ? <div className={styles.managementList}>{periods.map((period) => {
          const room = rooms.find((item) => item.id === period.roomTypeId);
          return (
            <div className={styles.editorSection} key={period.id}>
              <input type="hidden" name="inventoryId" value={period.id} />
              <div className={styles.sectionHeader}><strong>{room?.name || tr(locale, "Room inventory", "Inventario de habitación")}</strong><button className="button button-secondary" type="button" onClick={() => removePeriod(period.id)}>{tr(locale, "Remove", "Quitar")}</button></div>
              <div className={styles.formGrid}>
                <label className={styles.field}><span>{tr(locale, "Room type", "Tipo de habitación")}</span><select name={`inventoryRoomType:${period.id}`} value={period.roomTypeId} onChange={(event) => updatePeriod(period.id, { roomTypeId: event.target.value })}>{rooms.map((item) => <option key={item.id} value={item.id}>{item.name || item.code || tr(locale, "Unnamed room", "Habitación sin nombre")}</option>)}</select></label>
                <label className={styles.field}><span>{tr(locale, "Start date", "Fecha inicial")}</span><input type="date" name={`inventoryStartDate:${period.id}`} value={period.startDate} onChange={(event) => updatePeriod(period.id, { startDate: event.target.value })} required /></label>
                <label className={styles.field}><span>{tr(locale, "End date", "Fecha final")}</span><input type="date" name={`inventoryEndDate:${period.id}`} value={period.endDate} onChange={(event) => updatePeriod(period.id, { endDate: event.target.value })} required /></label>
                <label className={styles.field}><span>{tr(locale, "Room capacity", "Capacidad de habitaciones")}</span><input type="number" min={period.reserved} step="1" name={`inventoryCapacity:${period.id}`} value={period.capacity} onChange={(event) => updatePeriod(period.id, { capacity: Number(event.target.value) })} required /></label>
                <label className={styles.field}><span>{tr(locale, "Reserved", "Reservadas")}</span><input value={period.reserved} readOnly disabled /></label>
                <label className={styles.field}><span>{tr(locale, "Status", "Estado")}</span><select name={`inventoryStatus:${period.id}`} value={period.status} onChange={(event) => updatePeriod(period.id, { status: event.target.value === "closed" ? "closed" : "open" })}><option value="open">{tr(locale, "Open", "Abierto")}</option><option value="closed">{tr(locale, "Closed", "Cerrado")}</option></select></label>
              </div>
            </div>
          );
        })}</div> : <div className={styles.notice}>{tr(locale, "No room inventory periods yet. You can save the accommodation first and add inventory afterwards.", "Todavía no hay periodos de inventario. Puedes guardar primero el alojamiento y añadir inventario después.")}</div>}
      </div>

      <div className={styles.stickySaveBar}>
        <div><strong>{isEditing ? tr(locale, "Save accommodation", "Guardar alojamiento") : tr(locale, "Create accommodation", "Crear alojamiento")}</strong><span>{tr(locale, "Property, rooms, occupancy rules and inventory are stored together safely.", "El alojamiento, habitaciones, reglas de ocupación e inventario se guardan de forma coordinada.")}</span></div>
        <div className={styles.actionsCompact}>
          <Link className="button button-secondary" href="/operator/catalogue">{tr(locale, "Cancel", "Cancelar")}</Link>
          <button className="button button-primary" type="submit" disabled={!rooms.length}>{isEditing ? tr(locale, "Save changes", "Guardar cambios") : tr(locale, "Create accommodation", "Crear alojamiento")}</button>
        </div>
      </div>
    </form>
  );
}