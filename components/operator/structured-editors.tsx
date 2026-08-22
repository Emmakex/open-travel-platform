"use client";

import { useState } from "react";
import styles from "@/app/operator/operator.module.css";
import { MediaSourceField, type MediaSourceChoice } from "@/components/operator/media-source-field";
import type { TravelMedia, TripDay } from "@/domain/travel/types";

type FocalPoint = "center" | "top" | "bottom" | "left" | "right";

const focalPoints: FocalPoint[] = ["center", "top", "bottom", "left", "right"];

type MediaNames = {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  focalPoint: string;
};

export function MediaEditorCard({
  title,
  media,
  choices,
  names,
  removable = false,
  onRemove
}: {
  title: string;
  media?: TravelMedia;
  choices: MediaSourceChoice[];
  names: MediaNames;
  removable?: boolean;
  onRemove?: () => void;
}) {
  const [alt, setAlt] = useState(media?.alt ?? "");
  const [credit, setCredit] = useState(media?.credit ?? "");

  return (
    <div className={styles.mediaEditorCard}>
      <div className={styles.mediaEditorHeader}>
        <strong>{title}</strong>
        {removable ? (
          <button className={styles.textButtonDanger} type="button" onClick={onRemove}>Remove</button>
        ) : null}
      </div>

      <div className={styles.mediaEditorLayout}>
        <MediaSourceField
          name={names.src}
          label="Image"
          defaultValue={media?.src ?? ""}
          choices={choices}
          uploadAlt={alt}
          uploadCredit={credit}
          onMetadata={(metadata) => {
            if (metadata.alt && !alt) setAlt(metadata.alt);
            if (metadata.credit && !credit) setCredit(metadata.credit);
          }}
        />

        <div className={styles.mediaMetadataGrid}>
          <label className={styles.field}>
            <span>ALT text</span>
            <input name={names.alt} value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Describe what is visible" />
          </label>
          <label className={styles.field}>
            <span>Focal point</span>
            <select name={names.focalPoint} defaultValue={media?.focalPoint ?? "center"}>
              {focalPoints.map((point) => <option value={point} key={point}>{point}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>Credit</span>
            <input name={names.credit} value={credit} onChange={(event) => setCredit(event.target.value)} placeholder="Photographer / source" />
          </label>
          <label className={styles.field}>
            <span>Caption</span>
            <input name={names.caption} defaultValue={media?.caption ?? ""} placeholder="Optional editorial caption" />
          </label>
        </div>
      </div>
    </div>
  );
}

export function GalleryEditor({ gallery = [], choices }: { gallery?: TravelMedia[]; choices: MediaSourceChoice[] }) {
  const [items, setItems] = useState<Array<TravelMedia & { key: string }>>(() =>
    gallery.map((item, index) => ({ ...item, key: `existing-${index}-${item.src}` }))
  );

  function add() {
    setItems((current) => [...current, { src: "", key: `new-${crypto.randomUUID()}` }]);
  }

  function remove(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
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
      <div className={styles.sectionHeaderCompact}>
        <div>
          <div className="eyebrow">Gallery</div>
          <p className={styles.muted}>Add only the images you need and control their display order.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={add}>+ Add image</button>
      </div>

      {items.length ? (
        <div className={styles.repeatList}>
          {items.map((media, index) => (
            <div key={media.key}>
              <div className={styles.reorderToolbar}>
                <span>Image {index + 1}</span>
                <div>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move image up">↑</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Move image down">↓</button>
                </div>
              </div>
              <MediaEditorCard
                title={`Gallery image ${index + 1}`}
                media={media}
                choices={choices}
                names={{
                  src: "gallerySrc",
                  alt: "galleryAlt",
                  caption: "galleryCaption",
                  credit: "galleryCredit",
                  focalPoint: "galleryFocalPoint"
                }}
                removable
                onRemove={() => remove(index)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyEditorState}>
          <strong>No gallery images yet</strong>
          <span>Add images when this destination or trip needs a gallery.</span>
          <button className="button button-secondary" type="button" onClick={add}>+ Add first image</button>
        </div>
      )}
    </div>
  );
}

type EditableDay = TripDay & { key: string };

export function ItineraryEditor({
  itinerary = [],
  suffix = "",
  label
}: {
  itinerary?: TripDay[];
  suffix?: "" | "Es";
  label: string;
}) {
  const [days, setDays] = useState<EditableDay[]>(() =>
    itinerary.map((day, index) => ({ ...day, key: `day-${index}-${day.day}` }))
  );

  function add() {
    setDays((current) => [
      ...current,
      { day: current.length ? Math.max(...current.map((item) => item.day)) + 1 : 1, title: "", summary: "", key: `new-${crypto.randomUUID()}` }
    ]);
  }

  function remove(index: number) {
    setDays((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function move(index: number, direction: -1 | 1) {
    setDays((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, itemIndex) => ({ ...item, day: itemIndex + 1 }));
    });
  }

  function update(index: number, patch: Partial<TripDay>) {
    setDays((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  return (
    <div className={styles.editorSection}>
      <div className={styles.sectionHeaderCompact}>
        <div>
          <div className="eyebrow">{label}</div>
          <p className={styles.muted}>Add, remove and reorder itinerary days. Day numbers update automatically after reordering.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={add}>+ Add day</button>
      </div>

      {days.length ? (
        <div className={styles.repeatList}>
          {days.map((day, index) => (
            <div className={styles.itineraryCard} key={day.key}>
              <div className={styles.itineraryCardHeader}>
                <strong>Day {index + 1}</strong>
                <div className={styles.reorderActions}>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move day up">↑</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === days.length - 1} aria-label="Move day down">↓</button>
                  <button type="button" className={styles.textButtonDanger} onClick={() => remove(index)}>Remove</button>
                </div>
              </div>
              <input type="hidden" name={`itineraryDay${suffix}`} value={index + 1} />
              <label className={styles.field}>
                <span>Title</span>
                <input name={`itineraryTitle${suffix}`} value={day.title} onChange={(event) => update(index, { title: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Summary</span>
                <textarea name={`itinerarySummary${suffix}`} value={day.summary} onChange={(event) => update(index, { summary: event.target.value })} rows={3} />
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyEditorState}>
          <strong>No itinerary days yet</strong>
          <span>Add the first day when you are ready to build the itinerary.</span>
          <button className="button button-secondary" type="button" onClick={add}>+ Add first day</button>
        </div>
      )}
    </div>
  );
}
