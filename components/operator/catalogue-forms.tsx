import Link from "next/link";
import { saveDestinationAction, saveTripAction } from "@/app/operator/catalogue/actions";
import styles from "@/app/operator/operator.module.css";
import type { Destination, Trip } from "@/domain/travel/types";

function ErrorNotice({ error }: { error?: string }) {
  if (!error) return null;

  return (
    <div className={styles.notice}>
      {error === "validation"
        ? "Please complete all required fields with valid values."
        : "The record could not be saved. Check for a duplicate slug and review the runtime log."}
    </div>
  );
}

export function DestinationForm({
  destination,
  error
}: {
  destination?: Destination | null;
  error?: string;
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

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Name *</span>
          <input name="name" defaultValue={destination?.name ?? ""} required />
        </label>
        <label className={styles.field}>
          <span>Slug</span>
          <input name="slug" defaultValue={destination?.slug ?? ""} placeholder="auto-generated-from-name" />
        </label>
        <label className={styles.field}>
          <span>Country *</span>
          <input name="country" defaultValue={destination?.country ?? ""} required />
        </label>
        <label className={styles.field}>
          <span>Region *</span>
          <input name="region" defaultValue={destination?.region ?? ""} required />
        </label>
      </div>

      <label className={styles.field}>
        <span>Summary *</span>
        <textarea name="summary" defaultValue={destination?.summary ?? ""} rows={5} required />
      </label>

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

      <div className={styles.editorSection}>
        <div className="eyebrow">Spanish translation</div>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>Nombre</span><input name="nameEs" defaultValue={es?.name ?? ""} /></label>
          <label className={styles.field}><span>País</span><input name="countryEs" defaultValue={es?.country ?? ""} /></label>
          <label className={styles.field}><span>Región</span><input name="regionEs" defaultValue={es?.region ?? ""} /></label>
        </div>
        <label className={styles.field}><span>Resumen</span><textarea name="summaryEs" defaultValue={es?.summary ?? ""} rows={5} /></label>
      </div>

      <div className={styles.actions}>
        <button className="button button-primary" type="submit">{isEditing ? "Save destination" : "Create destination"}</button>
        <Link className="button button-secondary" href="/operator/catalogue">Cancel</Link>
      </div>
    </form>
  );
}

export function TripForm({
  trip,
  destinations,
  error
}: {
  trip?: Trip | null;
  destinations: Destination[];
  error?: string;
}) {
  const isEditing = Boolean(trip);
  const returnTo = isEditing ? `/operator/catalogue/trips/${trip?.id}` : "/operator/catalogue/trips/new";
  const es = trip?.translations?.es;

  return (
    <form action={saveTripAction} className={styles.editorForm}>
      <input type="hidden" name="id" value={trip?.id ?? ""} />
      <input type="hidden" name="_returnTo" value={returnTo} />
      <ErrorNotice error={error} />

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Title *</span>
          <input name="title" defaultValue={trip?.title ?? ""} required />
        </label>
        <label className={styles.field}>
          <span>Slug</span>
          <input name="slug" defaultValue={trip?.slug ?? ""} placeholder="auto-generated-from-title" />
        </label>
        <label className={styles.field}>
          <span>Destination *</span>
          <select name="destinationId" defaultValue={trip?.destinationId ?? destinations[0]?.id ?? ""} required>
            {destinations.map((destination) => (
              <option value={destination.id} key={destination.id}>{destination.name}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Currency</span>
          <select name="currency" defaultValue={trip?.currency ?? "EUR"}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Duration (days) *</span>
          <input type="number" min="1" step="1" name="durationDays" defaultValue={trip?.durationDays ?? 1} required />
        </label>
        <label className={styles.field}>
          <span>Starting price *</span>
          <input type="number" min="0" step="0.01" name="fromPrice" defaultValue={trip?.fromPrice ?? 0} required />
        </label>
      </div>

      <label className={styles.field}>
        <span>Summary *</span>
        <textarea name="summary" defaultValue={trip?.summary ?? ""} rows={5} required />
      </label>
      <label className={styles.field}>
        <span>Highlights — one per line</span>
        <textarea name="highlights" defaultValue={(trip?.highlights ?? []).join("\n")} rows={5} />
      </label>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Included — one per line</span>
          <textarea name="included" defaultValue={(trip?.included ?? []).join("\n")} rows={5} />
        </label>
        <label className={styles.field}>
          <span>Not included — one per line</span>
          <textarea name="notIncluded" defaultValue={(trip?.notIncluded ?? []).join("\n")} rows={5} />
        </label>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Publication</span>
          <select name="publicationStatus" defaultValue={trip?.publicationStatus ?? (isEditing ? "published" : "draft")}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className={styles.checkboxField}>
          <input type="checkbox" name="featured" defaultChecked={trip?.featured ?? false} />
          <span>Featured trip</span>
        </label>
      </div>

      <div className={styles.editorSection}>
        <div className="eyebrow">Spanish translation</div>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>Título</span><input name="titleEs" defaultValue={es?.title ?? ""} /></label>
        </div>
        <label className={styles.field}><span>Resumen</span><textarea name="summaryEs" defaultValue={es?.summary ?? ""} rows={5} /></label>
        <label className={styles.field}><span>Destacados — uno por línea</span><textarea name="highlightsEs" defaultValue={(es?.highlights ?? []).join("\n")} rows={5} /></label>
      </div>

      <div className={styles.actions}>
        <button className="button button-primary" type="submit">{isEditing ? "Save trip" : "Create trip"}</button>
        <Link className="button button-secondary" href="/operator/catalogue">Cancel</Link>
      </div>
    </form>
  );
}
