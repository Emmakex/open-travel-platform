"use client";

import { useState } from "react";
import Link from "next/link";
import { saveTravelServiceAction } from "@/app/operator/catalogue/services/actions";
import styles from "@/app/operator/operator.module.css";
import { GalleryEditor, MediaEditorCard } from "@/components/operator/structured-editors";
import { TravellerPricingEditor } from "@/components/operator/traveller-pricing-editor";
import type {
  TravelService,
  TravelServicePricingMode,
  TravelServiceType
} from "@/domain/services/types";
import type { TravelLocale } from "@/domain/travel/types";
import type { MediaLibraryChoice } from "@/lib/media-library";
import { publicationStatusLabel, tr } from "@/lib/operator-i18n";

function ErrorNotice({ error, locale }: { error?: string; locale: TravelLocale }) {
  if (!error) return null;
  return (
    <div className={styles.notice}>
      {error === "validation"
        ? tr(locale, "Complete all required fields with valid values.", "Completa todos los campos obligatorios con valores válidos.")
        : tr(locale, "The service could not be saved. Check for a duplicate slug and review the server logs.", "No se pudo guardar el servicio. Comprueba si el slug está duplicado y revisa los logs del servidor.")}
    </div>
  );
}

export function ServiceForm({ service, type, error, mediaLibrary = [], locale }: {
  service?: TravelService | null;
  type: TravelServiceType;
  error?: string;
  mediaLibrary?: MediaLibraryChoice[];
  locale: TravelLocale;
}) {
  const isEditing = Boolean(service);
  const es = service?.translations?.es;
  const fromPrice = service?.fromPrice ?? 0;
  const [pricingMode, setPricingMode] = useState<TravelServicePricingMode>(service?.pricingMode ?? "per-person");
  const [startingPrice, setStartingPrice] = useState(fromPrice);

  return (
    <form action={saveTravelServiceAction} className={styles.editorForm}>
      <input type="hidden" name="id" value={service?.id ?? ""} />
      <input type="hidden" name="serviceType" value={type} />
      <ErrorNotice error={error} locale={locale} />

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">{tr(locale, "Independent product · English content", "Producto independiente · contenido en inglés")}</div>
          <p className={styles.muted}>{tr(locale, "This product has its own public page and does not require a trip to exist or be purchased.", "Este producto tiene su propia página pública y no necesita que exista ni se compre un viaje.")}</p>
        </div>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>{tr(locale, "Title *", "Título (EN) *")}</span><input name="title" defaultValue={service?.title ?? ""} required /></label>
          <label className={styles.field}><span>Slug</span><input name="slug" defaultValue={service?.slug ?? ""} placeholder="auto-generated-from-title" /></label>
          <label className={styles.field}><span>{tr(locale, "Currency", "Moneda")}</span><select name="currency" defaultValue={service?.currency ?? "EUR"}><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select></label>
          <label className={styles.field}>
            <span>{tr(locale, "Starting price *", "Precio desde *")}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              name="fromPrice"
              defaultValue={fromPrice}
              onChange={(event) => setStartingPrice(Number(event.target.value) || 0)}
              required
            />
          </label>
          <label className={styles.field}>
            <span>{tr(locale, "Pricing model", "Modelo de precio")}</span>
            <select
              name="pricingMode"
              value={pricingMode}
              onChange={(event) => setPricingMode(event.target.value as TravelServicePricingMode)}
            >
              <option value="per-person">{tr(locale, "Per person", "Por persona")}</option>
              <option value="per-booking">{tr(locale, "Per booking", "Por reserva")}</option>
              <option value="per-unit">{tr(locale, "Per unit", "Por unidad")}</option>
              <option value="per-age-band">{tr(locale, "By traveller age", "Según edad del viajero")}</option>
            </select>
          </label>
          <label className={styles.field}><span>{tr(locale, "Publication", "Publicación")}</span><select name="publicationStatus" defaultValue={service?.publicationStatus ?? (isEditing ? "published" : "draft")}><option value="draft">{publicationStatusLabel("draft", locale)}</option><option value="published">{publicationStatusLabel("published", locale)}</option></select></label>
        </div>
        <label className={styles.field}><span>{tr(locale, "Summary *", "Resumen (EN) *")}</span><textarea name="summary" defaultValue={service?.summary ?? ""} rows={5} required /></label>
        <label className={styles.checkboxField}><input type="checkbox" name="featured" defaultChecked={service?.featured ?? false} /><span>{tr(locale, "Featured service", "Servicio destacado")}</span></label>
      </div>

      {pricingMode === "per-age-band" ? (
        <>
          <div className={styles.notice}>{tr(locale, "Define the price for each traveller age range. These bands are used for adults, minors and infants and will be validated when the service is booked.", "Define el precio para cada rango de edad. Estas bandas se utilizan para adultos, menores y bebés y se validarán al reservar el servicio.")}</div>
          <TravellerPricingEditor bands={service?.travellerPricing} fromPrice={startingPrice} locale={locale} context="service" />
        </>
      ) : null}

      {type === "activity" ? (
        <div className={styles.editorSection}>
          <div><div className="eyebrow">{tr(locale, "Activity details", "Datos de la actividad")}</div></div>
          <div className={styles.formGrid}>
            <label className={styles.field}><span>{tr(locale, "Category *", "Categoría (EN) *")}</span><input name="activityCategory" defaultValue={service?.serviceType === "activity" ? service.activityCategory : ""} required /></label>
            <label className={styles.field}><span>{tr(locale, "Location *", "Ubicación (EN) *")}</span><input name="location" defaultValue={service?.serviceType === "activity" ? service.location : ""} required /></label>
            <label className={styles.field}><span>{tr(locale, "Duration *", "Duración (EN) *")}</span><input name="durationLabel" defaultValue={service?.serviceType === "activity" ? service.durationLabel : ""} placeholder="4 hours" required /></label>
            <label className={styles.field}><span>{tr(locale, "Meeting point", "Punto de encuentro (EN)")}</span><input name="meetingPoint" defaultValue={service?.serviceType === "activity" ? service.meetingPoint ?? "" : ""} /></label>
          </div>
        </div>
      ) : null}

      {type === "transport" ? (
        <div className={styles.editorSection}>
          <div><div className="eyebrow">{tr(locale, "Transport details", "Datos del transporte")}</div></div>
          <div className={styles.formGrid}>
            <label className={styles.field}><span>{tr(locale, "Transport mode *", "Tipo de transporte (EN) *")}</span><input name="transportMode" defaultValue={service?.serviceType === "transport" ? service.transportMode : ""} placeholder="Private transfer" required /></label>
            <label className={styles.field}><span>{tr(locale, "Origin *", "Origen (EN) *")}</span><input name="origin" defaultValue={service?.serviceType === "transport" ? service.origin : ""} required /></label>
            <label className={styles.field}><span>{tr(locale, "Destination *", "Destino (EN) *")}</span><input name="destination" defaultValue={service?.serviceType === "transport" ? service.destination : ""} required /></label>
            <label className={styles.field}><span>{tr(locale, "Capacity per unit", "Capacidad por unidad")}</span><input type="number" min="1" step="1" name="capacity" defaultValue={service?.serviceType === "transport" ? service.capacity ?? "" : ""} /></label>
          </div>
        </div>
      ) : null}

      {type === "insurance" ? (
        <div className={styles.editorSection}>
          <div><div className="eyebrow">{tr(locale, "Insurance details", "Datos del seguro")}</div></div>
          <div className={styles.formGrid}>
            <label className={styles.field}><span>{tr(locale, "Coverage type *", "Tipo de cobertura (EN) *")}</span><input name="coverageType" defaultValue={service?.serviceType === "insurance" ? service.coverageType : ""} required /></label>
            <label className={styles.field}><span>{tr(locale, "Maximum trip days", "Duración máxima del viaje")}</span><input type="number" min="1" step="1" name="maxTripDays" defaultValue={service?.serviceType === "insurance" ? service.maxTripDays ?? "" : ""} /></label>
          </div>
        </div>
      ) : null}

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Commercial content", "Contenido comercial")}</div><p className={styles.muted}>{tr(locale, "Use one line per highlight or inclusion.", "Usa una línea por cada destacado o elemento incluido.")}</p></div>
        <label className={styles.field}><span>{tr(locale, "Highlights", "Destacados (EN)")}</span><textarea name="highlights" defaultValue={(service?.highlights ?? []).join("\n")} rows={5} /></label>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>{tr(locale, "Included", "Incluido (EN)")}</span><textarea name="included" defaultValue={(service?.included ?? []).join("\n")} rows={5} /></label>
          <label className={styles.field}><span>{tr(locale, "Not included", "No incluido (EN)")}</span><textarea name="notIncluded" defaultValue={(service?.notIncluded ?? []).join("\n")} rows={5} /></label>
        </div>
      </div>

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Cover media", "Imagen de portada")}</div></div>
        <MediaEditorCard title={tr(locale, "Service cover", "Portada del servicio")} media={service?.coverImage} choices={mediaLibrary} locale={locale} names={{ src: "coverSrc", alt: "coverAlt", caption: "coverCaption", credit: "coverCredit", focalPoint: "coverFocalPoint" }} />
      </div>
      <GalleryEditor gallery={service?.gallery} choices={mediaLibrary} locale={locale} />

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Spanish translation", "Traducción al español")}</div></div>
        <label className={styles.field}><span>Título</span><input name="titleEs" defaultValue={es?.title ?? ""} /></label>
        <label className={styles.field}><span>Resumen</span><textarea name="summaryEs" defaultValue={es?.summary ?? ""} rows={5} /></label>
        {type === "activity" ? <div className={styles.formGrid}><label className={styles.field}><span>Categoría</span><input name="activityCategoryEs" defaultValue={es?.activityCategory ?? ""} /></label><label className={styles.field}><span>Ubicación</span><input name="locationEs" defaultValue={es?.location ?? ""} /></label><label className={styles.field}><span>Duración</span><input name="durationLabelEs" defaultValue={es?.durationLabel ?? ""} /></label><label className={styles.field}><span>Punto de encuentro</span><input name="meetingPointEs" defaultValue={es?.meetingPoint ?? ""} /></label></div> : null}
        {type === "transport" ? <div className={styles.formGrid}><label className={styles.field}><span>Tipo de transporte</span><input name="transportModeEs" defaultValue={es?.transportMode ?? ""} /></label><label className={styles.field}><span>Origen</span><input name="originEs" defaultValue={es?.origin ?? ""} /></label><label className={styles.field}><span>Destino</span><input name="destinationEs" defaultValue={es?.destination ?? ""} /></label></div> : null}
        {type === "insurance" ? <label className={styles.field}><span>Tipo de cobertura</span><input name="coverageTypeEs" defaultValue={es?.coverageType ?? ""} /></label> : null}
        <label className={styles.field}><span>Destacados — uno por línea</span><textarea name="highlightsEs" defaultValue={(es?.highlights ?? []).join("\n")} rows={5} /></label>
        <div className={styles.formGrid}><label className={styles.field}><span>Incluido — uno por línea</span><textarea name="includedEs" defaultValue={(es?.included ?? []).join("\n")} rows={5} /></label><label className={styles.field}><span>No incluido — uno por línea</span><textarea name="notIncludedEs" defaultValue={(es?.notIncluded ?? []).join("\n")} rows={5} /></label></div>
      </div>

      <div className={styles.stickySaveBar}>
        <div><strong>{isEditing ? tr(locale, "Save service changes", "Guardar cambios del servicio") : tr(locale, "Create service", "Crear servicio")}</strong><span>{tr(locale, "The public catalogue updates when you save a published product.", "El catálogo público se actualiza al guardar un producto publicado.")}</span></div>
        <div className={styles.actionsCompact}>
          <Link className="button button-secondary" href="/operator/catalogue">{tr(locale, "Cancel", "Cancelar")}</Link>
          <button className="button button-primary" type="submit">{isEditing ? tr(locale, "Save service", "Guardar servicio") : tr(locale, "Create service", "Crear servicio")}</button>
        </div>
      </div>
    </form>
  );
}
