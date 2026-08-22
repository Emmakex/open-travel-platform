"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/operator/operator.module.css";
import type { TravelLocale } from "@/domain/travel/types";
import { tr } from "@/lib/operator-i18n";

export type MediaManagerItem = { id: string; url: string; filename: string; originalName: string; contentType: string; size: number; uploadedAt: string; alt?: string; credit?: string };

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaManager({ initialItems, locale }: { initialItems: MediaManagerItem[]; locale: TravelLocale }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/operator/media", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) { setMessage(`${tr(locale, "Upload failed", "La subida ha fallado")}: ${payload.error ?? response.status}`); return; }
      setItems((current) => [payload.item, ...current]);
      formRef.current?.reset();
      setMessage(tr(locale, "Image uploaded to the media library.", "Imagen subida a la biblioteca multimedia."));
      router.refresh();
    } catch {
      setMessage(tr(locale, "Upload failed. Check the network connection and runtime logs.", "La subida ha fallado. Revisa la conexión y los logs de ejecución."));
    } finally { setBusy(false); }
  }

  async function remove(item: MediaManagerItem) {
    if (!window.confirm(tr(locale, `Delete ${item.originalName}?`, `¿Eliminar ${item.originalName}?`))) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/operator/media/${item.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (response.status === 409) { setMessage(tr(locale, "This image is used by a destination or trip. Remove it from the catalogue record first.", "Esta imagen está en uso en un destino o viaje. Quítala primero del registro del catálogo.")); return; }
      if (!response.ok) { setMessage(`${tr(locale, "Delete failed", "La eliminación ha fallado")}: ${payload.error ?? response.status}`); return; }
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage(tr(locale, "Image deleted from the media library.", "Imagen eliminada de la biblioteca multimedia."));
      router.refresh();
    } finally { setBusy(false); }
  }

  async function copyUrl(url: string) { await navigator.clipboard.writeText(url); setMessage(tr(locale, "URL copied.", "URL copiada.")); }

  return (
    <>
      <form className={styles.mediaUploadForm} onSubmit={upload} ref={formRef}>
        <label className={styles.field}><span>{tr(locale, "Image file *", "Archivo de imagen *")}</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required /></label>
        <div className={styles.formGrid}>
          <label className={styles.field}><span>{tr(locale, "ALT text", "Texto ALT")}</span><input name="alt" placeholder={tr(locale, "Describe the image for accessibility", "Describe la imagen para accesibilidad")} /></label>
          <label className={styles.field}><span>{tr(locale, "Credit", "Crédito")}</span><input name="credit" placeholder={tr(locale, "Photographer / source", "Fotógrafo / fuente")} /></label>
        </div>
        <div className={styles.actions}>
          <button className="button button-primary" type="submit" disabled={busy}>{busy ? tr(locale, "Uploading…", "Subiendo…") : tr(locale, "Upload image", "Subir imagen")}</button>
          <span className={styles.muted}>JPEG, PNG, WebP {tr(locale, "or", "o")} AVIF · max 8 MB</span>
        </div>
      </form>
      {message ? <div className={styles.notice}>{message}</div> : null}
      {items.length ? (
        <div className={styles.mediaGrid}>
          {items.map((item) => (
            <article className={styles.mediaCard} key={item.id}>
              <div className={styles.mediaPreview}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.url} alt={item.alt || item.originalName} /></div>
              <div className={styles.mediaCardBody}>
                <strong>{item.originalName}</strong><span>{formatBytes(item.size)} · {item.contentType}</span>
                {item.alt ? <span>ALT: {item.alt}</span> : null}
                {item.credit ? <span>{tr(locale, "Credit", "Crédito")}: {item.credit}</span> : null}
                <code>{item.url}</code>
                <div className={styles.actions}>
                  <button className="button button-secondary" type="button" onClick={() => copyUrl(item.url)} disabled={busy}>{tr(locale, "Copy URL", "Copiar URL")}</button>
                  <button className="button button-secondary" type="button" onClick={() => remove(item)} disabled={busy}>{tr(locale, "Delete", "Eliminar")}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <div className={styles.notice}>{tr(locale, "No uploaded images yet.", "Todavía no hay imágenes subidas.")}</div>}
    </>
  );
}
