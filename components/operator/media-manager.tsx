"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/operator/operator.module.css";

export type MediaManagerItem = {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  alt?: string;
  credit?: string;
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaManager({ initialItems }: { initialItems: MediaManagerItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/operator/media", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(`Upload failed: ${payload.error ?? response.status}`);
        return;
      }

      setItems((current) => [payload.item, ...current]);
      formRef.current?.reset();
      setMessage("Image uploaded to MongoDB media library.");
      router.refresh();
    } catch {
      setMessage("Upload failed. Check the network connection and runtime logs.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: MediaManagerItem) {
    if (!window.confirm(`Delete ${item.originalName}?`)) return;
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/operator/media/${item.id}`, { method: "DELETE" });
      const payload = await response.json();

      if (response.status === 409) {
        setMessage("This image is currently used by a destination or trip. Remove it from the catalogue record first.");
        return;
      }
      if (!response.ok) {
        setMessage(`Delete failed: ${payload.error ?? response.status}`);
        return;
      }

      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage("Image deleted from the media library.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setMessage(`Copied ${url}`);
  }

  return (
    <>
      <form className={styles.mediaUploadForm} onSubmit={upload} ref={formRef}>
        <label className={styles.field}>
          <span>Image file *</span>
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            required
          />
        </label>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>ALT text</span>
            <input name="alt" placeholder="Describe the image for accessibility" />
          </label>
          <label className={styles.field}>
            <span>Credit</span>
            <input name="credit" placeholder="Photographer / source" />
          </label>
        </div>
        <div className={styles.actions}>
          <button className="button button-primary" type="submit" disabled={busy}>
            {busy ? "Uploading…" : "Upload image"}
          </button>
          <span className={styles.muted}>JPEG, PNG, WebP or AVIF · max 8 MB</span>
        </div>
      </form>

      {message ? <div className={styles.notice}>{message}</div> : null}

      {items.length ? (
        <div className={styles.mediaGrid}>
          {items.map((item) => (
            <article className={styles.mediaCard} key={item.id}>
              <div className={styles.mediaPreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt || item.originalName} />
              </div>
              <div className={styles.mediaCardBody}>
                <strong>{item.originalName}</strong>
                <span>{formatBytes(item.size)} · {item.contentType}</span>
                {item.alt ? <span>ALT: {item.alt}</span> : null}
                {item.credit ? <span>Credit: {item.credit}</span> : null}
                <code>{item.url}</code>
                <div className={styles.actions}>
                  <button className="button button-secondary" type="button" onClick={() => copyUrl(item.url)} disabled={busy}>Copy URL</button>
                  <button className="button button-secondary" type="button" onClick={() => remove(item)} disabled={busy}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.notice}>No uploaded images yet.</div>
      )}
    </>
  );
}
