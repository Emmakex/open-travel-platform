import Link from "next/link";
import { saveDestinationAction, saveTripAction } from "@/app/operator/catalogue/actions";
import styles from "@/app/operator/operator.module.css";
import { DepartureEditor } from "@/components/operator/departure-editor";
import {
  GalleryEditor,
  ItineraryEditor,
  MediaEditorCard
} from "@/components/operator/structured-editors";
import type { TripDeparture } from "@/domain/booking/types";
import type { Destination, Trip } from "@/domain/travel/types";
import type { MediaLibraryChoice } from "@/lib/media-library";

function ErrorNotice({ error }: { error?: string }) {
  if (!error) return null;

  return (
    <div className={styles.notice}>
      {error === "validation"
        ? "Please complete all required fields with valid values. Media URLs must be local / paths or HTTPS URLs, itinerary rows require title and summary, and departure dates/capacity must be valid."
        : "The record could not be saved. Check for a duplicate slug and review the runtime log."}
    </div>
  );
}

export function DestinationForm({
  destination,
  error,
  mediaLibrary = []
}: {
  destination?: Destination | null;
  error?: string;
  mediaLibrary?: MediaLibraryChoice[];
}) {
  const isEditing = Boolean(destination);
  const returnTo = isEditing
    ? `/operator/catalogue/destinations/${destination?.id}`
    : "/operator/catalogue/destinations/new";
  const es = destination?.translations?.es;

  return (
    <form action={saveDestinationAction} className={styles.editorForm}>
      <input type="hidden" name="id" value={destination?.id ?? ""} />
      <input type="hidden" name="_returnTo" value={returnTo} />
      <ErrorNotice error={error} />

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">Core details</div>
          <p className={styles.muted}>Public information used in destination cards and detail pages.</p>
        </div>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>Name *</span><input name="name" defaultValue={destination?.name ?? ""} required /></label>
          <label className={styles.field}><span>Slug</span><input name="slug" defaultValue={destination?.slug ?? ""} placeholder="auto-generated-from-name" /></label>
          <label className={styles.field}><span>Country *</span><input name="country" defaultValue={destination?.country ?? ""} required /></label>
          <label className={styles.field}><span>Region *</span><input name="region" defaultValue={destination?.region ?? ""} required /></label>
        </div>
        <label className={styles.field}><span>Summary *</span><textarea name="summary" defaultValue={destination?.summary ?? ""} rows={5} required /></label>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Publication</span>
            <select name="publicationStatus" defaultValue={destination?.publicationStatus ?? (isEditing ? "published" : "draft")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label className={styles.checkboxField}>
            <input type="checkbox" name="featured" defaultChecked={destination?.featured ?? false} />
            <span>Featured destination</span>
          </label>
        </div>
      </div>

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">Cover media</div>
          <p className={styles.muted}>Upload or reuse the main image shown across the destination experience.</p>
        </div>
        <MediaEditorCard
          title="Destination cover"
          media={destination?.coverImage}
          choices={mediaLibrary}
          names={{
            src: "coverSrc",
            alt: "coverAlt",
            caption: "coverCaption",
            credit: "coverCredit",
            focalPoint: "coverFocalPoint"
          }}
        />
      </div>

      <GalleryEditor gallery={destination?.gallery} choices={mediaLibrary} />

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">Spanish translation</div>
          <p className={styles.muted}>Leave individual fields empty to fall back to the English catalogue content.</p>
        </div>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>Nombre</span><input name="nameEs" defaultValue={es?.name ?? ""} /></label>
          <label className={styles.field}><span>País</span><input name="countryEs" defaultValue={es?.country ?? ""} /></label>
          <label className={styles.field}><span>Región</span><input name="regionEs" defaultValue={es?.region ?? ""} /></label>
        </div>
        <label className={styles.field}><span>Resumen</span><textarea name="summaryEs" defaultValue={es?.summary ?? ""} rows={5} /></label>
      </div>

      <div className={styles.stickySaveBar}>
        <div>
          <strong>{isEditing ? "Save destination changes" : "Create destination"}</strong>
          <span>Changes are written to MongoDB when you save.</span>
        </div>
        <div className={styles.actionsCompact}>
          <Link className="button button-secondary" href="/operator/catalogue">Cancel</Link>
          <button className="button button-primary" type="submit">{isEditing ? "Save destination" : "Create destination"}</button>
        </div>
      </div>
    </form>
  );
}

export function TripForm({
  trip,
  destinations,
  departures = [],
  error,
  mediaLibrary = []
}: {
  trip?: Trip | null;
  destinations: Destination[];
  departures?: TripDeparture[];
  error?: string;
  mediaLibrary?: MediaLibraryChoice[];
}) {
  const isEditing = Boolean(trip);
  const returnTo = isEditing ? `/operator/catalogue/trips/${trip?.id}` : "/operator/catalogue/trips/new";
  const es = trip?.translations?.es;

  return (
    <form action={saveTripAction} className={styles.editorForm}>
      <input type="hidden" name="id" value={trip?.id ?? ""} />
      <input type="hidden" name="_returnTo" value={returnTo} />
      <ErrorNotice error={error} />

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">Product basics</div>
          <p className={styles.muted}>Core commercial information shown in trip cards and detail pages.</p>
        </div>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>Title *</span><input name="title" defaultValue={trip?.title ?? ""} required /></label>
          <label className={styles.field}><span>Slug</span><input name="slug" defaultValue={trip?.slug ?? ""} placeholder="auto-generated-from-title" /></label>
          <label className={styles.field}>
            <span>Destination *</span>
            <select name="destinationId" defaultValue={trip?.destinationId ?? destinations[0]?.id ?? ""} required>
              {destinations.map((destination) => <option value={destination.id} key={destination.id}>{destination.name}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>Currency</span>
            <select name="currency" defaultValue={trip?.currency ?? "EUR"}>
              <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
            </select>
          </label>
          <label className={styles.field}><span>Duration (days) *</span><input type="number" min="1" step="1" name="durationDays" defaultValue={trip?.durationDays ?? 1} required /></label>
          <label className={styles.field}><span>Starting price *</span><input type="number" min="0" step="0.01" name="fromPrice" defaultValue={trip?.fromPrice ?? 0} required /></label>
        </div>
        <label className={styles.field}><span>Summary *</span><textarea name="summary" defaultValue={trip?.summary ?? ""} rows={5} required /></label>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Publication</span>
            <select name="publicationStatus" defaultValue={trip?.publicationStatus ?? (isEditing ? "published" : "draft")}>
              <option value="draft">Draft</option><option value="published">Published</option>
            </select>
          </label>
          <label className={styles.checkboxField}>
            <input type="checkbox" name="featured" defaultChecked={trip?.featured ?? false} />
            <span>Featured trip</span>
          </label>
        </div>
      </div>

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">Trip content</div>
          <p className={styles.muted}>Use one line per item for highlights and inclusions.</p>
        </div>
        <label className={styles.field}><span>Highlights</span><textarea name="highlights" defaultValue={(trip?.highlights ?? []).join("\n")} rows={5} /></label>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>Included</span><textarea name="included" defaultValue={(trip?.included ?? []).join("\n")} rows={5} /></label>
          <label className={styles.field}><span>Not included</span><textarea name="notIncluded" defaultValue={(trip?.notIncluded ?? []).join("\n")} rows={5} /></label>
        </div>
      </div>

      <DepartureEditor departures={departures} />

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">Cover media</div>
          <p className={styles.muted}>Upload or reuse the hero image for this travel product.</p>
        </div>
        <MediaEditorCard
          title="Trip cover"
          media={trip?.coverImage}
          choices={mediaLibrary}
          names={{
            src: "coverSrc",
            alt: "coverAlt",
            caption: "coverCaption",
            credit: "coverCredit",
            focalPoint: "coverFocalPoint"
          }}
        />
      </div>

      <GalleryEditor gallery={trip?.gallery} choices={mediaLibrary} />
      <ItineraryEditor itinerary={trip?.itinerary} label="English itinerary" />

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">Spanish translation</div>
          <p className={styles.muted}>Translate only the fields that differ from the English catalogue content.</p>
        </div>
        <label className={styles.field}><span>Título</span><input name="titleEs" defaultValue={es?.title ?? ""} /></label>
        <label className={styles.field}><span>Resumen</span><textarea name="summaryEs" defaultValue={es?.summary ?? ""} rows={5} /></label>
        <label className={styles.field}><span>Destacados — uno por línea</span><textarea name="highlightsEs" defaultValue={(es?.highlights ?? []).join("\n")} rows={5} /></label>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>Incluido — uno por línea</span><textarea name="includedEs" defaultValue={(es?.included ?? []).join("\n")} rows={5} /></label>
          <label className={styles.field}><span>No incluido — uno por línea</span><textarea name="notIncludedEs" defaultValue={(es?.notIncluded ?? []).join("\n")} rows={5} /></label>
        </div>
      </div>

      <ItineraryEditor itinerary={es?.itinerary} suffix="Es" label="Itinerario en español" />

      <div className={styles.stickySaveBar}>
        <div>
          <strong>{isEditing ? "Save trip changes" : "Create trip"}</strong>
          <span>Product, departures and inventory are written to MongoDB when you save.</span>
        </div>
        <div className={styles.actionsCompact}>
          <Link className="button button-secondary" href="/operator/catalogue">Cancel</Link>
          <button className="button button-primary" type="submit">{isEditing ? "Save trip" : "Create trip"}</button>
        </div>
      </div>
    </form>
  );
}
