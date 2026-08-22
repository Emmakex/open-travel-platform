"use client";

import { useId, useRef, useState } from "react";
import styles from "@/app/operator/operator.module.css";

export type MediaSourceChoice = {
  id: string;
  url: string;
  label: string;
  alt?: string;
  credit?: string;
};

type UploadedMediaPayload = {
  item?: {
    id: string;
    url: string;
    originalName?: string;
    alt?: string;
    credit?: string;
  };
  error?: string;
};

export function MediaSourceField({
  name,
  label,
  defaultValue = "",
  choices,
  uploadAlt = "",
  uploadCredit = "",
  onMetadata
}: {
  name: string;
  label: string;
  defaultValue?: string;
  choices: MediaSourceChoice[];
  uploadAlt?: string;
  uploadCredit?: string;
  onMetadata?: (metadata: { alt?: string; credit?: string }) => void;
}) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [availableChoices, setAvailableChoices] = useState(choices);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  function selectChoice(url: string) {
    const choice = availableChoices.find((item) => item.url === url);
    setValue(url);
    if (choice) onMetadata?.({ alt: choice.alt, credit: choice.credit });
    setMessage("Image selected. Save the record to apply it.");
  }

  async function uploadSelectedFile(file: File) {
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (uploadAlt.trim()) formData.append("alt", uploadAlt.trim());
      if (uploadCredit.trim()) formData.append("credit", uploadCredit.trim());

      const response = await fetch("/api/operator/media", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as UploadedMediaPayload;

      if (!response.ok || !payload.item) {
        setMessage(`Upload failed: ${payload.error ?? response.status}`);
        return;
      }

      const newChoice: MediaSourceChoice = {
        id: payload.item.id,
        url: payload.item.url,
        label: payload.item.alt || payload.item.originalName || file.name,
        alt: payload.item.alt,
        credit: payload.item.credit
      };

      setAvailableChoices((current) => [
        newChoice,
        ...current.filter((choice) => choice.id !== newChoice.id)
      ]);
      setValue(newChoice.url);
      onMetadata?.({ alt: newChoice.alt, credit: newChoice.credit });
      setMessage("Uploaded and selected. Save the record to apply it.");
    } catch {
      setMessage("Upload failed. Check the connection and runtime logs.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className={styles.mediaSourceField}>
      <input type="hidden" name={name} value={value} />
      <div className={styles.mediaSourceLabel}>{label}</div>

      <div className={styles.mediaSourceExperience}>
        <div className={styles.mediaSourcePreview}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Selected media preview" />
          ) : (
            <div className={styles.mediaPlaceholder}>
              <span>No image selected</span>
              <small>Upload a new image or reuse one from the library.</small>
            </div>
          )}
        </div>

        <div className={styles.mediaSourceControls}>
          <input
            ref={fileInputRef}
            className={styles.hiddenFileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadSelectedFile(file);
            }}
          />

          <div className={styles.inlineMediaActions}>
            <button
              className="button button-primary"
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
            </button>
            {value ? (
              <button
                className="button button-secondary"
                type="button"
                disabled={uploading}
                onClick={() => {
                  setValue("");
                  setMessage("Image assignment cleared. Save the record to apply it.");
                }}
              >
                Remove image
              </button>
            ) : null}
          </div>

          {availableChoices.length ? (
            <label className={styles.compactField}>
              <span>Reuse from library</span>
              <select
                value=""
                onChange={(event) => {
                  if (event.target.value) selectChoice(event.target.value);
                }}
                aria-label={`Choose ${label.toLowerCase()} from media library`}
              >
                <option value="">Choose an existing image…</option>
                {availableChoices.map((choice) => (
                  <option value={choice.url} key={choice.id}>{choice.label}</option>
                ))}
              </select>
            </label>
          ) : null}

          <details className={styles.advancedMediaSource}>
            <summary>Advanced · use image URL</summary>
            <label htmlFor={inputId} className={styles.compactField}>
              <span>Image URL</span>
              <input
                id={inputId}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="/media/... or https://..."
              />
            </label>
          </details>

          {message ? <small className={styles.inlineMediaStatus}>{message}</small> : null}
        </div>
      </div>
    </div>
  );
}
