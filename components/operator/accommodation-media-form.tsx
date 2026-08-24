"use client";

import { useState } from "react";
import { saveAccommodationMediaAction } from "@/app/operator/catalogue/accommodations/media-actions";
import styles from "@/app/operator/operator.module.css";
import { MediaEditorCard } from "@/components/operator/structured-editors";
import type { Accommodation } from "@/domain/accommodation/types";
import type { TravelLocale, TravelMedia } from "@/domain/travel/types";
import type { MediaLibraryChoice } from "@/lib/media-library";
import { tr } from "@/lib/operator-i18n";

type EditableMedia = TravelMedia & { key: string };

function GalleryGroup({
  title,
  copy,
  gallery,
  prefix,
  choices,
  locale
}: {
  title: string;
  copy: string;
  gallery?: TravelMedia[];
  prefix: string;
  choices: MediaLibraryChoice[];
  locale: TravelLocale;
}) {
  const [items, setItems] = useState<EditableMedia[]>(() =>
    (gallery ?? []).map((item, index) => ({ ...item, key: `existing-${index}-${item.src}` }))
  );

  function add() {
    setItems((current) => [...current, { src: "", key: `new-${crypto.randomUUID()}` }]);
  }

  function move(index: number, direction: -1 | 1) {
    setItems((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className={styles.editorSection}>
      <div className={styles.sectionHeader}>
        <div>
          <h3>{title}</h3>
          <p className={styles.muted}>{copy}</p>
        </div>
        <button className="button button-secondary" type="button" onClick={add}>{tr(locale, "+ Add image", "+ Añadir imagen")}</button>
      </div>

      {items.length ? (
        <div className={styles.managementList}>
          {items.map((media, index) => (
            <div key={media.key}>
              <div className={styles.reorderToolbar}>
                <span>{tr(locale, "Image", "Imagen")} {index + 1}</span>
                <div>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={tr(locale, "Move image up", "Mover imagen arriba")}>↑</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={tr(locale, "Move image down", "Mover imagen abajo")}>↓</button>
                </div>
              </div>
              <MediaEditorCard
                title={`${title} · ${index + 1}`}
                media={media}
                choices={choices}
                locale={locale}
                names={{
                  src: `${prefix}Src`,
                  alt: `${prefix}Alt`,
                  caption: `${prefix}Caption`,
                  credit: `${prefix}Credit`,
                  focalPoint: `${prefix}FocalPoint`
                }}
                removable
                onRemove={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.notice}>{tr(locale, "No gallery images yet.", "Todavía no hay imágenes en esta galería.")}</div>
      )}
    </div>
  );
}

export function AccommodationMediaForm({
  accommodation,
  mediaLibrary,
  locale,
  updated,
  error
}: {
  accommodation: Accommodation;
  mediaLibrary: MediaLibraryChoice[];
  locale: TravelLocale;
  updated?: boolean;
  error?: string;
}) {
  return (
    <section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Accommodation galleries", "Galerías del alojamiento")}</div>
      <h2>{tr(locale, "Property and room photography", "Fotografías del alojamiento y habitaciones")}</h2>
      <p className={styles.lead}>{tr(
        locale,
        "Use one gallery for the property and a separate gallery for every room type. Images can be uploaded or reused from the shared media library.",
        "Usa una galería general para el alojamiento y una galería independiente para cada tipo de habitación. Puedes subir imágenes o reutilizarlas desde la biblioteca multimedia."
      )}</p>
      {updated ? <div className={styles.notice}>{tr(locale, "Accommodation galleries saved.", "Galerías del alojamiento guardadas.")}</div> : null}
      {error ? <div className={styles.notice}>{tr(locale, "Review the selected images and try again.", "Revisa las imágenes seleccionadas e inténtalo de nuevo.")}</div> : null}

      <form action={saveAccommodationMediaAction} className={styles.editorForm}>
        <input type="hidden" name="accommodationId" value={accommodation.id} />
        <GalleryGroup
          title={tr(locale, "Property gallery", "Galería general")}
          copy={tr(locale, "Exterior, common areas, surroundings and the overall accommodation experience.", "Exterior, zonas comunes, entorno y experiencia general del alojamiento.")}
          gallery={accommodation.gallery}
          prefix="propertyGallery"
          choices={mediaLibrary}
          locale={locale}
        />

        {accommodation.roomTypes.map((room) => (
          <GalleryGroup
            key={room.id}
            title={`${tr(locale, "Room gallery", "Galería de habitación")} · ${room.name}`}
            copy={tr(locale, "Show the actual room, bathroom, layout and relevant room details.", "Muestra la habitación real, baño, distribución y detalles relevantes del tipo de habitación.")}
            gallery={room.gallery}
            prefix={`roomGallery__${room.id}`}
            choices={mediaLibrary}
            locale={locale}
          />
        ))}

        <div className={styles.actionsCompact}>
          <button className="button button-primary" type="submit">{tr(locale, "Save galleries", "Guardar galerías")}</button>
        </div>
      </form>
    </section>
  );
}
