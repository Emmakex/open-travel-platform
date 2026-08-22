import Link from "next/link";
import { saveDestinationAction, saveTripAction } from "@/app/operator/catalogue/actions";
import styles from "@/app/operator/operator.module.css";
import { DepartureEditor } from "@/components/operator/departure-editor";
import { GalleryEditor, ItineraryEditor, MediaEditorCard } from "@/components/operator/structured-editors";
import { TravellerPricingEditor } from "@/components/operator/traveller-pricing-editor";
import type { TripDeparture } from "@/domain/booking/types";
import type { Destination, TravelLocale, Trip } from "@/domain/travel/types";
import type { MediaLibraryChoice } from "@/lib/media-library";
import { publicationStatusLabel, tr } from "@/lib/operator-i18n";
import { defaultTravellerPricingBands } from "@/lib/traveller-pricing";

function ErrorNotice({ error, locale }: { error?: string; locale: TravelLocale }) {
  if (!error) return null;
  return (
    <div className={styles.notice}>
      {error === "validation"
        ? tr(locale, "Complete all required fields with valid values. Check age pricing, media URLs, itinerary rows and departure capacity/dates.", "Completa todos los campos obligatorios con valores válidos. Revisa precios por edad, URL de imágenes, itinerario y fechas/cupos de las salidas.")
        : tr(locale, "The record could not be saved. Check for a duplicate slug and review the runtime log.", "No se pudo guardar el registro. Comprueba si el slug está duplicado y revisa los logs de ejecución.")}
    </div>
  );
}

export function DestinationForm({ destination, error, mediaLibrary = [], locale }: {
  destination?: Destination | null;
  error?: string;
  mediaLibrary?: MediaLibraryChoice[];
  locale: TravelLocale;
}) {
  const isEditing = Boolean(destination);
  const returnTo = isEditing ? `/operator/catalogue/destinations/${destination?.id}` : "/operator/catalogue/destinations/new";
  const es = destination?.translations?.es;

  return (
    <form action={saveDestinationAction} className={styles.editorForm}>
      <input type="hidden" name="id" value={destination?.id ?? ""} />
      <input type="hidden" name="_returnTo" value={returnTo} />
      <ErrorNotice error={error} locale={locale} />

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Core details · English content", "Datos principales · contenido en inglés")}</div><p className={styles.muted}>{tr(locale, "Primary public content used as the default language and fallback.", "Contenido público principal usado como idioma base y como fallback.")}</p></div>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>{tr(locale, "Name *", "Nombre (EN) *")}</span><input name="name" defaultValue={destination?.name ?? ""} required /></label>
          <label className={styles.field}><span>Slug</span><input name="slug" defaultValue={destination?.slug ?? ""} placeholder="auto-generated-from-name" /></label>
          <label className={styles.field}><span>{tr(locale, "Country *", "País (EN) *")}</span><input name="country" defaultValue={destination?.country ?? ""} required /></label>
          <label className={styles.field}><span>{tr(locale, "Region *", "Región (EN) *")}</span><input name="region" defaultValue={destination?.region ?? ""} required /></label>
        </div>
        <label className={styles.field}><span>{tr(locale, "Summary *", "Resumen (EN) *")}</span><textarea name="summary" defaultValue={destination?.summary ?? ""} rows={5} required /></label>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>{tr(locale, "Publication", "Publicación")}</span>
            <select name="publicationStatus" defaultValue={destination?.publicationStatus ?? (isEditing ? "published" : "draft")}>
              <option value="draft">{publicationStatusLabel("draft", locale)}</option>
              <option value="published">{publicationStatusLabel("published", locale)}</option>
            </select>
          </label>
          <label className={styles.checkboxField}><input type="checkbox" name="featured" defaultChecked={destination?.featured ?? false} /><span>{tr(locale, "Featured destination", "Destino destacado")}</span></label>
        </div>
      </div>

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Cover media", "Imagen de portada")}</div><p className={styles.muted}>{tr(locale, "Upload or reuse the main image shown across the destination experience.", "Sube o reutiliza la imagen principal que se mostrará en el destino.")}</p></div>
        <MediaEditorCard title={tr(locale, "Destination cover", "Portada del destino")} media={destination?.coverImage} choices={mediaLibrary} locale={locale} names={{ src: "coverSrc", alt: "coverAlt", caption: "coverCaption", credit: "coverCredit", focalPoint: "coverFocalPoint" }} />
      </div>

      <GalleryEditor gallery={destination?.gallery} choices={mediaLibrary} locale={locale} />

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Spanish translation", "Traducción al español")}</div><p className={styles.muted}>{tr(locale, "Leave fields empty to fall back to the English catalogue content.", "Deja campos vacíos para usar automáticamente el contenido base en inglés.")}</p></div>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>Nombre</span><input name="nameEs" defaultValue={es?.name ?? ""} /></label>
          <label className={styles.field}><span>País</span><input name="countryEs" defaultValue={es?.country ?? ""} /></label>
          <label className={styles.field}><span>Región</span><input name="regionEs" defaultValue={es?.region ?? ""} /></label>
        </div>
        <label className={styles.field}><span>Resumen</span><textarea name="summaryEs" defaultValue={es?.summary ?? ""} rows={5} /></label>
      </div>

      <div className={styles.stickySaveBar}>
        <div><strong>{isEditing ? tr(locale, "Save destination changes", "Guardar cambios del destino") : tr(locale, "Create destination", "Crear destino")}</strong><span>{tr(locale, "Changes are written to MongoDB when you save.", "Los cambios se guardan en MongoDB al confirmar.")}</span></div>
        <div className={styles.actionsCompact}>
          <Link className="button button-secondary" href="/operator/catalogue">{tr(locale, "Cancel", "Cancelar")}</Link>
          <button className="button button-primary" type="submit">{isEditing ? tr(locale, "Save destination", "Guardar destino") : tr(locale, "Create destination", "Crear destino")}</button>
        </div>
      </div>
    </form>
  );
}

export function TripForm({ trip, destinations, departures = [], error, mediaLibrary = [], locale }: {
  trip?: Trip | null;
  destinations: Destination[];
  departures?: TripDeparture[];
  error?: string;
  mediaLibrary?: MediaLibraryChoice[];
  locale: TravelLocale;
}) {
  const isEditing = Boolean(trip);
  const returnTo = isEditing ? `/operator/catalogue/trips/${trip?.id}` : "/operator/catalogue/trips/new";
  const es = trip?.translations?.es;
  const pricingBands = trip?.travellerPricing?.length
    ? trip.travellerPricing
    : defaultTravellerPricingBands(trip?.fromPrice ?? 0);

  return (
    <form action={saveTripAction} className={styles.editorForm}>
      <input type="hidden" name="id" value={trip?.id ?? ""} />
      <input type="hidden" name="_returnTo" value={returnTo} />
      <ErrorNotice error={error} locale={locale} />

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Product basics · English content", "Datos del producto · contenido en inglés")}</div><p className={styles.muted}>{tr(locale, "Core commercial information shown in trip cards and detail pages.", "Información comercial principal mostrada en tarjetas y fichas de viaje.")}</p></div>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>{tr(locale, "Title *", "Título (EN) *")}</span><input name="title" defaultValue={trip?.title ?? ""} required /></label>
          <label className={styles.field}><span>Slug</span><input name="slug" defaultValue={trip?.slug ?? ""} placeholder="auto-generated-from-title" /></label>
          <label className={styles.field}><span>{tr(locale, "Destination *", "Destino *")}</span><select name="destinationId" defaultValue={trip?.destinationId ?? destinations[0]?.id ?? ""} required>{destinations.map((destination) => <option value={destination.id} key={destination.id}>{destination.name}</option>)}</select></label>
          <label className={styles.field}><span>{tr(locale, "Currency", "Moneda")}</span><select name="currency" defaultValue={trip?.currency ?? "EUR"}><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select></label>
          <label className={styles.field}><span>{tr(locale, "Duration (days) *", "Duración (días) *")}</span><input type="number" min="1" step="1" name="durationDays" defaultValue={trip?.durationDays ?? 1} required /></label>
          <label className={styles.field}><span>{tr(locale, "Starting price *", "Precio desde *")}</span><input type="number" min="0" step="0.01" name="fromPrice" defaultValue={trip?.fromPrice ?? 0} required /></label>
        </div>
        <label className={styles.field}><span>{tr(locale, "Summary *", "Resumen (EN) *")}</span><textarea name="summary" defaultValue={trip?.summary ?? ""} rows={5} required /></label>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>{tr(locale, "Publication", "Publicación")}</span><select name="publicationStatus" defaultValue={trip?.publicationStatus ?? (isEditing ? "published" : "draft")}><option value="draft">{publicationStatusLabel("draft", locale)}</option><option value="published">{publicationStatusLabel("published", locale)}</option></select></label>
          <label className={styles.checkboxField}><input type="checkbox" name="featured" defaultChecked={trip?.featured ?? false} /><span>{tr(locale, "Featured trip", "Viaje destacado")}</span></label>
        </div>
      </div>

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Trip content", "Contenido del viaje")}</div><p className={styles.muted}>{tr(locale, "Use one line per item for highlights and inclusions.", "Usa una línea por elemento para destacados e inclusiones.")}</p></div>
        <label className={styles.field}><span>{tr(locale, "Highlights", "Destacados (EN)")}</span><textarea name="highlights" defaultValue={(trip?.highlights ?? []).join("\n")} rows={5} /></label>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>{tr(locale, "Included", "Incluido (EN)")}</span><textarea name="included" defaultValue={(trip?.included ?? []).join("\n")} rows={5} /></label>
          <label className={styles.field}><span>{tr(locale, "Not included", "No incluido (EN)")}</span><textarea name="notIncluded" defaultValue={(trip?.notIncluded ?? []).join("\n")} rows={5} /></label>
        </div>
      </div>

      <TravellerPricingEditor bands={trip?.travellerPricing} fromPrice={trip?.fromPrice ?? 0} locale={locale} />

      {!trip?.travellerPricing?.length && isEditing ? (
        <div className={styles.notice}>
          {tr(locale, "Save the traveller pricing bands once before fine-tuning per-departure overrides. Legacy departure prices are shown for every band during this first migration save.", "Guarda una vez las bandas de precios por viajero antes de ajustar los precios de cada salida. En esta primera migración se muestra el precio antiguo de la salida en todas las bandas.")}
        </div>
      ) : null}

      <DepartureEditor departures={departures} pricingBands={pricingBands} legacySinglePrice={!trip?.travellerPricing?.length} locale={locale} />

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Cover media", "Imagen de portada")}</div><p className={styles.muted}>{tr(locale, "Upload or reuse the hero image for this travel product.", "Sube o reutiliza la imagen principal de este producto de viaje.")}</p></div>
        <MediaEditorCard title={tr(locale, "Trip cover", "Portada del viaje")} media={trip?.coverImage} choices={mediaLibrary} locale={locale} names={{ src: "coverSrc", alt: "coverAlt", caption: "coverCaption", credit: "coverCredit", focalPoint: "coverFocalPoint" }} />
      </div>

      <GalleryEditor gallery={trip?.gallery} choices={mediaLibrary} locale={locale} />
      <ItineraryEditor itinerary={trip?.itinerary} label={tr(locale, "English itinerary", "Itinerario en inglés")} locale={locale} />

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Spanish translation", "Traducción al español")}</div><p className={styles.muted}>{tr(locale, "Translate only fields that differ from the English base content.", "Traduce los campos necesarios respecto al contenido base en inglés.")}</p></div>
        <label className={styles.field}><span>Título</span><input name="titleEs" defaultValue={es?.title ?? ""} /></label>
        <label className={styles.field}><span>Resumen</span><textarea name="summaryEs" defaultValue={es?.summary ?? ""} rows={5} /></label>
        <label className={styles.field}><span>Destacados — uno por línea</span><textarea name="highlightsEs" defaultValue={(es?.highlights ?? []).join("\n")} rows={5} /></label>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>Incluido — uno por línea</span><textarea name="includedEs" defaultValue={(es?.included ?? []).join("\n")} rows={5} /></label>
          <label className={styles.field}><span>No incluido — uno por línea</span><textarea name="notIncludedEs" defaultValue={(es?.notIncluded ?? []).join("\n")} rows={5} /></label>
        </div>
      </div>

      <ItineraryEditor itinerary={es?.itinerary} suffix="Es" label={tr(locale, "Spanish itinerary", "Itinerario en español")} locale={locale} />

      <div className={styles.stickySaveBar}>
        <div><strong>{isEditing ? tr(locale, "Save trip changes", "Guardar cambios del viaje") : tr(locale, "Create trip", "Crear viaje")}</strong><span>{tr(locale, "Product, traveller pricing, departures and inventory are written to MongoDB when you save.", "El producto, los precios por viajero, las salidas y el inventario se guardan en MongoDB al confirmar.")}</span></div>
        <div className={styles.actionsCompact}>
          <Link className="button button-secondary" href="/operator/catalogue">{tr(locale, "Cancel", "Cancelar")}</Link>
          <button className="button button-primary" type="submit">{isEditing ? tr(locale, "Save trip", "Guardar viaje") : tr(locale, "Create trip", "Crear viaje")}</button>
        </div>
      </div>
    </form>
  );
}
