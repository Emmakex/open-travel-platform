"use client";

import { useState } from "react";
import styles from "@/app/operator/operator.module.css";
import { MediaSourceField, type MediaSourceChoice } from "@/components/operator/media-source-field";
import type { TravelLocale, TravelMedia, TripDay } from "@/domain/travel/types";
import { focalPointLabel, tr } from "@/lib/operator-i18n";

type FocalPoint = "center" | "top" | "bottom" | "left" | "right";
const focalPoints: FocalPoint[] = ["center", "top", "bottom", "left", "right"];

type MediaNames = { src: string; alt: string; caption: string; credit: string; focalPoint: string };

export function MediaEditorCard({ title, media, choices, names, locale, removable = false, onRemove }: {
  title: string;
  media?: TravelMedia;
  choices: MediaSourceChoice[];
  names: MediaNames;
  locale: TravelLocale;
  removable?: boolean;
  onRemove?: () => void;
}) {
  const [alt, setAlt] = useState(media?.alt ?? "");
  const [credit, setCredit] = useState(media?.credit ?? "");

  return (
    <div className={styles.mediaEditorCard}>
      <div className={styles.mediaEditorHeader}>
        <strong>{title}</strong>
        {removable ? <button className={styles.textButtonDanger} type="button" onClick={onRemove}>{tr(locale, "Remove", "Eliminar")}</button> : null}
      </div>
      <div className={styles.mediaEditorLayout}>
        <MediaSourceField name={names.src} label={tr(locale, "Image", "Imagen")} defaultValue={media?.src ?? ""} choices={choices} uploadAlt={alt} uploadCredit={credit} locale={locale} onMetadata={(metadata) => {
          if (metadata.alt && !alt) setAlt(metadata.alt);
          if (metadata.credit && !credit) setCredit(metadata.credit);
        }} />
        <div className={styles.mediaMetadataGrid}>
          <label className={styles.field}><span>{tr(locale, "ALT text", "Texto ALT")}</span><input name={names.alt} value={alt} onChange={(event) => setAlt(event.target.value)} placeholder={tr(locale, "Describe what is visible", "Describe lo que aparece en la imagen")} /></label>
          <label className={styles.field}>
            <span>{tr(locale, "Focal point", "Punto focal")}</span>
            <select name={names.focalPoint} defaultValue={media?.focalPoint ?? "center"}>{focalPoints.map((point) => <option value={point} key={point}>{focalPointLabel(point, locale)}</option>)}</select>
          </label>
          <label className={styles.field}><span>{tr(locale, "Credit", "Crédito")}</span><input name={names.credit} value={credit} onChange={(event) => setCredit(event.target.value)} placeholder={tr(locale, "Photographer / source", "Fotógrafo / fuente")} /></label>
          <label className={styles.field}><span>{tr(locale, "Caption", "Pie de foto")}</span><input name={names.caption} defaultValue={media?.caption ?? ""} placeholder={tr(locale, "Optional editorial caption", "Pie de foto editorial opcional")} /></label>
        </div>
      </div>
    </div>
  );
}

export function GalleryEditor({ gallery = [], choices, locale }: { gallery?: TravelMedia[]; choices: MediaSourceChoice[]; locale: TravelLocale }) {
  const [items, setItems] = useState<Array<TravelMedia & { key: string }>>(() => gallery.map((item, index) => ({ ...item, key: `existing-${index}-${item.src}` })));
  const add = () => setItems((current) => [...current, { src: "", key: `new-${crypto.randomUUID()}` }]);
  const remove = (index: number) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
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
      <div className={styles.sectionHeaderCompact}>
        <div><div className="eyebrow">{tr(locale, "Gallery", "Galería")}</div><p className={styles.muted}>{tr(locale, "Add only the images you need and control their display order.", "Añade solo las imágenes necesarias y controla su orden de visualización.")}</p></div>
        <button className="button button-secondary" type="button" onClick={add}>{tr(locale, "+ Add image", "+ Añadir imagen")}</button>
      </div>
      {items.length ? (
        <div className={styles.repeatList}>
          {items.map((media, index) => (
            <div key={media.key}>
              <div className={styles.reorderToolbar}>
                <span>{tr(locale, "Image", "Imagen")} {index + 1}</span>
                <div>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={tr(locale, "Move image up", "Mover imagen arriba")}>↑</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={tr(locale, "Move image down", "Mover imagen abajo")}>↓</button>
                </div>
              </div>
              <MediaEditorCard title={`${tr(locale, "Gallery image", "Imagen de galería")} ${index + 1}`} media={media} choices={choices} locale={locale} names={{ src: "gallerySrc", alt: "galleryAlt", caption: "galleryCaption", credit: "galleryCredit", focalPoint: "galleryFocalPoint" }} removable onRemove={() => remove(index)} />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyEditorState}>
          <strong>{tr(locale, "No gallery images yet", "Todavía no hay imágenes en la galería")}</strong>
          <span>{tr(locale, "Add images when this destination or trip needs a gallery.", "Añade imágenes cuando el destino o viaje necesite una galería.")}</span>
          <button className="button button-secondary" type="button" onClick={add}>{tr(locale, "+ Add first image", "+ Añadir primera imagen")}</button>
        </div>
      )}
    </div>
  );
}

type EditableDay = TripDay & { key: string };

export function ItineraryEditor({ itinerary = [], suffix = "", label, locale }: {
  itinerary?: TripDay[];
  suffix?: "" | "Es";
  label: string;
  locale: TravelLocale;
}) {
  const [days, setDays] = useState<EditableDay[]>(() => itinerary.map((day, index) => ({ ...day, key: `day-${index}-${day.day}` })));
  function add() {
    setDays((current) => [...current, { day: current.length ? Math.max(...current.map((item) => item.day)) + 1 : 1, title: "", summary: "", key: `new-${crypto.randomUUID()}` }]);
  }
  const remove = (index: number) => setDays((current) => current.filter((_, itemIndex) => itemIndex !== index));
  function move(index: number, direction: -1 | 1) {
    setDays((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, itemIndex) => ({ ...item, day: itemIndex + 1 }));
    });
  }
  function update(index: number, patch: Partial<TripDay>) { setDays((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)); }

  return (
    <div className={styles.editorSection}>
      <div className={styles.sectionHeaderCompact}>
        <div><div className="eyebrow">{label}</div><p className={styles.muted}>{tr(locale, "Add, remove and reorder itinerary days. Day numbers update automatically after reordering.", "Añade, elimina y reordena los días del itinerario. La numeración se actualiza automáticamente al reordenar.")}</p></div>
        <button className="button button-secondary" type="button" onClick={add}>{tr(locale, "+ Add day", "+ Añadir día")}</button>
      </div>
      {days.length ? (
        <div className={styles.repeatList}>
          {days.map((day, index) => (
            <div className={styles.itineraryCard} key={day.key}>
              <div className={styles.itineraryCardHeader}>
                <strong>{tr(locale, "Day", "Día")} {index + 1}</strong>
                <div className={styles.reorderActions}>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={tr(locale, "Move day up", "Mover día arriba")}>↑</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === days.length - 1} aria-label={tr(locale, "Move day down", "Mover día abajo")}>↓</button>
                  <button type="button" className={styles.textButtonDanger} onClick={() => remove(index)}>{tr(locale, "Remove", "Eliminar")}</button>
                </div>
              </div>
              <input type="hidden" name={`itineraryDay${suffix}`} value={index + 1} />
              <label className={styles.field}><span>{tr(locale, "Title", "Título")}</span><input name={`itineraryTitle${suffix}`} value={day.title} onChange={(event) => update(index, { title: event.target.value })} /></label>
              <label className={styles.field}><span>{tr(locale, "Summary", "Resumen")}</span><textarea name={`itinerarySummary${suffix}`} value={day.summary} onChange={(event) => update(index, { summary: event.target.value })} rows={3} /></label>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyEditorState}>
          <strong>{tr(locale, "No itinerary days yet", "Todavía no hay días de itinerario")}</strong>
          <span>{tr(locale, "Add the first day when you are ready to build the itinerary.", "Añade el primer día cuando estés listo para construir el itinerario.")}</span>
          <button className="button button-secondary" type="button" onClick={add}>{tr(locale, "+ Add first day", "+ Añadir primer día")}</button>
        </div>
      )}
    </div>
  );
}
