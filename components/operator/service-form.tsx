"use client";

import { useState } from "react";
import Link from "next/link";
import { saveTravelServiceAction } from "@/app/operator/catalogue/services/actions";
import styles from "@/app/operator/operator.module.css";
import { ChangePolicyEditor } from "@/components/operator/change-policy-editor";
import { GalleryEditor, MediaEditorCard } from "@/components/operator/structured-editors";
import { TravellerPricingEditor } from "@/components/operator/traveller-pricing-editor";
import { TravellerRequirementsEditor } from "@/components/operator/traveller-requirements-editor";
import type { TravelService, TravelServicePricingMode, TravelServiceType } from "@/domain/services/types";
import type { TravelLocale } from "@/domain/travel/types";
import type { MediaLibraryChoice } from "@/lib/media-library";
import { publicationStatusLabel, tr } from "@/lib/operator-i18n";

function ErrorNotice({ error, locale }: { error?: string; locale: TravelLocale }) {
  if (!error) return null;
  const message = error === "validation"
    ? tr(locale, "Review the required fields and enter valid values.", "Revisa los campos obligatorios e introduce valores válidos.")
    : error === "content-quality"
      ? tr(
          locale,
          "This service is not ready to publish yet. Complete the English and Spanish customer copy, use distinct text for summary/highlights/inclusions, add a cover image with alt text and review the service-specific details. Insurance also requires a provider and an HTTPS terms link.",
          "Este servicio todavía no está listo para publicar. Completa el contenido para cliente en inglés y español, usa textos distintos para resumen/destacados/incluidos, añade una portada con texto alternativo y revisa los datos específicos del servicio. Los seguros también necesitan proveedor y un enlace HTTPS a sus condiciones."
        )
      : tr(locale, "The service could not be saved. Review the form and try again.", "No se pudo guardar el servicio. Revisa el formulario e inténtalo de nuevo.");
  return <div className={styles.notice}>{message}</div>;
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

      <div className={styles.notice}>
        <strong>{tr(locale, "Publishing checklist", "Checklist antes de publicar")}</strong><br />
        {tr(
          locale,
          "Published services need complete customer-facing English and Spanish copy, a useful summary, at least two highlights, included and not-included information, a cover image with alt text and service-specific details. Keep the product as Draft while any of that is still being prepared.",
          "Los servicios publicados necesitan contenido completo para cliente en inglés y español, un resumen útil, al menos dos destacados, información de incluido y no incluido, una portada con texto alternativo y los datos propios del servicio. Mantén el producto como Borrador mientras falte alguno de estos elementos."
        )}
      </div>

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">{tr(locale, "Public content · English", "Contenido público · Inglés")}</div>
          <p className={styles.muted}>{tr(locale, "Write for a traveller deciding whether to book. Explain the experience, route or product clearly before operational details.", "Escribe para una persona que está decidiendo si reservar. Explica primero la experiencia, la ruta o el producto y deja los detalles operativos en segundo plano.")}</p>
        </div>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>{tr(locale, "Title *", "Título (EN) *")}</span><input name="title" defaultValue={service?.title ?? ""} required /></label>
          <label className={styles.field}><span>Slug</span><input name="slug" defaultValue={service?.slug ?? ""} placeholder="auto-generated-from-title" /></label>
          <label className={styles.field}><span>{tr(locale, "Currency", "Moneda")}</span><select name="currency" defaultValue={service?.currency ?? "EUR"}><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select></label>
          <label className={styles.field}>
            <span>{tr(locale, "Starting price *", "Precio desde *")}</span>
            <input type="number" min="0" step="0.01" name="fromPrice" defaultValue={fromPrice} onChange={(event) => setStartingPrice(Number(event.target.value) || 0)} required />
          </label>
          <label className={styles.field}>
            <span>{tr(locale, "Pricing model", "Modelo de precio")}</span>
            <select name="pricingMode" value={pricingMode} onChange={(event) => setPricingMode(event.target.value as TravelServicePricingMode)}>
              <option value="per-person">{tr(locale, "Per person", "Por persona")}</option>
              <option value="per-booking">{tr(locale, "Per booking", "Por reserva")}</option>
              <option value="per-unit">{tr(locale, "Per unit", "Por unidad")}</option>
              <option value="per-age-band">{tr(locale, "By traveller age", "Según edad del viajero")}</option>
            </select>
          </label>
          <label className={styles.field}><span>{tr(locale, "Publication", "Publicación")}</span><select name="publicationStatus" defaultValue={service?.publicationStatus ?? (isEditing ? "published" : "draft")}><option value="draft">{publicationStatusLabel("draft", locale)}</option><option value="published">{publicationStatusLabel("published", locale)}</option></select></label>
        </div>
        <label className={styles.field}>
          <span>{tr(locale, "Summary *", "Resumen (EN) *")}</span>
          <textarea name="summary" defaultValue={service?.summary ?? ""} rows={5} required />
          <small>{tr(locale, "Aim for 1–3 specific sentences: what it is, who it is for and the main value. Do not repeat the title or the Included section.", "Usa 1–3 frases concretas: qué es, para quién sirve y cuál es su principal valor. No repitas el título ni la sección Incluido.")}</small>
        </label>
        <label className={styles.checkboxField}><input type="checkbox" name="featured" defaultChecked={service?.featured ?? false} /><span>{tr(locale, "Featured service", "Servicio destacado")}</span></label>
      </div>

      {pricingMode === "per-age-band" ? (
        <>
          <div className={styles.notice}>{tr(locale, "Define the price for each traveller age range. These bands are used for adults, minors and infants and are checked when the service is booked.", "Define el precio para cada rango de edad. Estas bandas se utilizan para adultos, menores y bebés y se comprueban al reservar el servicio.")}</div>
          <TravellerPricingEditor bands={service?.travellerPricing} fromPrice={startingPrice} locale={locale} context="service" />
        </>
      ) : null}

      {type === "activity" ? (
        <div className={styles.editorSection}>
          <div><div className="eyebrow">{tr(locale, "Activity details", "Datos de la actividad")}</div><p className={styles.muted}>{tr(locale, "Use customer-readable labels. Duration must include a unit, for example “2.5 hours” rather than “2.5”.", "Usa datos comprensibles para el cliente. La duración debe incluir unidad, por ejemplo «2,5 horas» en lugar de «2,5».")}</p></div>
          <div className={styles.formGrid}>
            <label className={styles.field}><span>{tr(locale, "Category *", "Categoría (EN) *")}</span><input name="activityCategory" defaultValue={service?.serviceType === "activity" ? service.activityCategory : ""} required /></label>
            <label className={styles.field}><span>{tr(locale, "Location *", "Ubicación (EN) *")}</span><input name="location" defaultValue={service?.serviceType === "activity" ? service.location : ""} required /></label>
            <label className={styles.field}><span>{tr(locale, "Duration *", "Duración (EN) *")}</span><input name="durationLabel" defaultValue={service?.serviceType === "activity" ? service.durationLabel : ""} placeholder="2.5 hours + transfers" required /></label>
            <label className={styles.field}><span>{tr(locale, "Meeting point", "Punto de encuentro (EN)")}</span><input name="meetingPoint" defaultValue={service?.serviceType === "activity" ? service.meetingPoint ?? "" : ""} /></label>
          </div>
        </div>
      ) : null}

      {type === "transport" ? (
        <div className={styles.editorSection}>
          <div><div className="eyebrow">{tr(locale, "Transport details", "Datos del transporte")}</div><p className={styles.muted}>{tr(locale, "Name the route exactly as the traveller will understand it. Avoid internal abbreviations or placeholder locations.", "Nombra la ruta tal como la entenderá el viajero. Evita abreviaturas internas o ubicaciones provisionales.")}</p></div>
          <div className={styles.formGrid}>
            <label className={styles.field}><span>{tr(locale, "Transport mode *", "Tipo de transporte (EN) *")}</span><input name="transportMode" defaultValue={service?.serviceType === "transport" ? service.transportMode : ""} placeholder="Private transfer" required /></label>
            <label className={styles.field}><span>{tr(locale, "Origin *", "Origen (EN) *")}</span><input name="origin" defaultValue={service?.serviceType === "transport" ? service.origin : ""} placeholder="Cusco Airport" required /></label>
            <label className={styles.field}><span>{tr(locale, "Destination *", "Destino (EN) *")}</span><input name="destination" defaultValue={service?.serviceType === "transport" ? service.destination : ""} placeholder="Cusco hotel" required /></label>
            <label className={styles.field}><span>{tr(locale, "Capacity per unit", "Capacidad por unidad")}</span><input type="number" min="1" step="1" name="capacity" defaultValue={service?.serviceType === "transport" ? service.capacity ?? "" : ""} /></label>
          </div>
        </div>
      ) : null}

      {type === "insurance" ? (
        <div className={styles.editorSection}>
          <div>
            <div className="eyebrow">{tr(locale, "Travel protection details", "Datos de protección de viaje")}</div>
            <p className={styles.muted}>{tr(locale, "Do not publish generic or invented coverage. Use the provider's real product name, coverage description and pre-contract terms.", "No publiques coberturas genéricas ni inventadas. Utiliza el nombre real del proveedor, la descripción de cobertura y las condiciones precontractuales del producto.")}</p>
          </div>
          <div className={styles.formGrid}>
            <label className={styles.field}><span>{tr(locale, "Provider *", "Proveedor *")}</span><input name="providerName" defaultValue={service?.serviceType === "insurance" ? service.providerName ?? "" : ""} placeholder={tr(locale, "Insurance provider", "Aseguradora o proveedor")} /></label>
            <label className={styles.field}><span>{tr(locale, "Policy / product reference", "Referencia de póliza / producto")}</span><input name="policyReference" defaultValue={service?.serviceType === "insurance" ? service.policyReference ?? "" : ""} /></label>
            <label className={styles.field}><span>{tr(locale, "Coverage type *", "Tipo de cobertura (EN) *")}</span><input name="coverageType" defaultValue={service?.serviceType === "insurance" ? service.coverageType : ""} placeholder="Medical assistance and cancellation" required /></label>
            <label className={styles.field}><span>{tr(locale, "Maximum trip days", "Duración máxima del viaje")}</span><input type="number" min="1" step="1" name="maxTripDays" defaultValue={service?.serviceType === "insurance" ? service.maxTripDays ?? "" : ""} /></label>
          </div>
          <label className={styles.field}><span>{tr(locale, "Provider terms URL *", "URL de condiciones del proveedor *")}</span><input type="url" name="termsUrl" defaultValue={service?.serviceType === "insurance" ? service.termsUrl ?? "" : ""} placeholder="https://…" /></label>
        </div>
      ) : null}

      <TravellerRequirementsEditor profile={service?.travellerRequirements} locale={locale} />
      <ChangePolicyEditor policy={service?.changePolicy} locale={locale} />

      <div className={styles.editorSection}>
        <div>
          <div className="eyebrow">{tr(locale, "Commercial content", "Contenido comercial")}</div>
          <p className={styles.muted}>{tr(locale, "Use one specific point per line. Highlights explain why to choose it; Included and Not included define the scope. Do not paste the same sentence into several sections.", "Usa un punto concreto por línea. Destacados explica por qué elegirlo; Incluido y No incluido delimitan el servicio. No pegues la misma frase en varias secciones.")}</p>
        </div>
        <label className={styles.field}><span>{tr(locale, "Highlights", "Destacados (EN)")}</span><textarea name="highlights" defaultValue={(service?.highlights ?? []).join("\n")} rows={5} /></label>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>{tr(locale, "Included", "Incluido (EN)")}</span><textarea name="included" defaultValue={(service?.included ?? []).join("\n")} rows={5} /></label>
          <label className={styles.field}><span>{tr(locale, "Not included", "No incluido (EN)")}</span><textarea name="notIncluded" defaultValue={(service?.notIncluded ?? []).join("\n")} rows={5} /></label>
        </div>
      </div>

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Cover media", "Imagen de portada")}</div><p className={styles.muted}>{tr(locale, "A published service needs a cover image and useful alternative text that describes the image without marketing filler.", "Un servicio publicado necesita una portada y un texto alternativo útil que describa la imagen sin frases comerciales de relleno.")}</p></div>
        <MediaEditorCard title={tr(locale, "Service cover", "Portada del servicio")} media={service?.coverImage} choices={mediaLibrary} locale={locale} names={{ src: "coverSrc", alt: "coverAlt", caption: "coverCaption", credit: "coverCredit", focalPoint: "coverFocalPoint" }} />
      </div>
      <GalleryEditor gallery={service?.gallery} choices={mediaLibrary} locale={locale} />

      <div className={styles.editorSection}>
        <div><div className="eyebrow">{tr(locale, "Spanish public content", "Contenido público · Español")}</div><p className={styles.muted}>{tr(locale, "A published service must read naturally in both languages. Translate meaning, not word-for-word structure.", "Un servicio publicado debe leerse de forma natural en ambos idiomas. Traduce el significado, no la estructura palabra por palabra.")}</p></div>
        <label className={styles.field}><span>Título</span><input name="titleEs" defaultValue={es?.title ?? ""} /></label>
        <label className={styles.field}><span>Resumen</span><textarea name="summaryEs" defaultValue={es?.summary ?? ""} rows={5} /></label>
        {type === "activity" ? <div className={styles.formGrid}><label className={styles.field}><span>Categoría</span><input name="activityCategoryEs" defaultValue={es?.activityCategory ?? ""} /></label><label className={styles.field}><span>Ubicación</span><input name="locationEs" defaultValue={es?.location ?? ""} /></label><label className={styles.field}><span>Duración</span><input name="durationLabelEs" defaultValue={es?.durationLabel ?? ""} placeholder="2,5 horas + traslados" /></label><label className={styles.field}><span>Punto de encuentro</span><input name="meetingPointEs" defaultValue={es?.meetingPoint ?? ""} /></label></div> : null}
        {type === "transport" ? <div className={styles.formGrid}><label className={styles.field}><span>Tipo de transporte</span><input name="transportModeEs" defaultValue={es?.transportMode ?? ""} /></label><label className={styles.field}><span>Origen</span><input name="originEs" defaultValue={es?.origin ?? ""} /></label><label className={styles.field}><span>Destino</span><input name="destinationEs" defaultValue={es?.destination ?? ""} /></label></div> : null}
        {type === "insurance" ? <label className={styles.field}><span>Tipo de cobertura</span><input name="coverageTypeEs" defaultValue={es?.coverageType ?? ""} placeholder="Asistencia médica y cancelación" /></label> : null}
        <label className={styles.field}><span>Destacados — uno por línea</span><textarea name="highlightsEs" defaultValue={(es?.highlights ?? []).join("\n")} rows={5} /></label>
        <div className={styles.formGrid}><label className={styles.field}><span>Incluido — uno por línea</span><textarea name="includedEs" defaultValue={(es?.included ?? []).join("\n")} rows={5} /></label><label className={styles.field}><span>No incluido — uno por línea</span><textarea name="notIncludedEs" defaultValue={(es?.notIncluded ?? []).join("\n")} rows={5} /></label></div>
      </div>

      <div className={styles.stickySaveBar}>
        <div><strong>{isEditing ? tr(locale, "Save service changes", "Guardar cambios del servicio") : tr(locale, "Create service", "Crear servicio")}</strong><span>{tr(locale, "Drafts can be incomplete. Publishing activates the full content-quality check.", "Los borradores pueden estar incompletos. Al publicar se activa la validación completa de contenido.")}</span></div>
        <div className={styles.actionsCompact}>
          <Link className="button button-secondary" href="/operator/catalogue">{tr(locale, "Cancel", "Cancelar")}</Link>
          <button className="button button-primary" type="submit">{isEditing ? tr(locale, "Save service", "Guardar servicio") : tr(locale, "Create service", "Crear servicio")}</button>
        </div>
      </div>
    </form>
  );
}
